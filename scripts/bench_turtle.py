#!/usr/bin/env python3
"""Benchmark turtle snapshotting during a debug session.

Papyros takes a snapshot of the turtle drawing after every debug frame. This
compares how much that costs with the two possible strategies:

  full   re-render the whole SVG document per frame and base64 it
         (what Papyros did before dodona-edu/papyros#1020 was addressed)
  patch  render only the canvas items that changed and stream them as patches
         (papyros/turtle_svg.py, what Papyros does now)

It also asserts that replaying the patches reproduces exactly the document the
full strategy produces, so the fast path is not quietly drawing something else.

Numbers are CPython, not Pyodide/WASM: expect the real browser to be several
times slower, and both strategies to be affected in the same way.

Usage:
    python3 scripts/bench_turtle.py                  # the program from issue #1020
    python3 scripts/bench_turtle.py --program square
    python3 scripts/bench_turtle.py --program my_turtle_program.py
    python3 scripts/bench_turtle.py --mode patch     # only the new strategy

Requires the Python worker bundle, so run `yarn setup` first.
"""

import argparse
import base64
import importlib.util
import json
import os
import sys
import tarfile
import tempfile
import time
import types

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WORKER = os.path.join(REPO, "src", "backend", "workers", "python")
PACKAGE = os.path.join(WORKER, "python_package.tar.gz.load_by_url")

# The spirograph from https://github.com/dodona-edu/papyros/issues/1020,
# which took about three minutes to debug.
SPIRO = """
from turtle import Turtle, Screen

def drawCircles(t, size, steps, shift):
    for _ in range(steps):
        t.circle(size)
        size -= shift

def drawSpecial(t, size, repeat, steps, shift):
    for _ in range(repeat):
        drawCircles(t, size, steps, shift)
        t.right(360 / repeat)

spiro = [
    ['white', 100, 10, 4], ['yellow', 80, 4, 10], ['blue', 60, 4, 5],
    ['orange', 40, 4, 19], ['pink', 20, 4, 20],
]

window = Screen()
window.setup(400, 1000)
window.bgcolor('#663399')

turtle = Turtle()
for color, rotate, steps, shift in spiro:
    turtle.color(color)
    drawSpecial(turtle, 100, 10, steps, shift)
"""

SQUARE = """
import turtle

t = turtle.Turtle()
for _ in range(40):
    for _ in range(4):
        t.forward(100)
        t.right(90)
    t.right(9)
"""

PROGRAMS = {"spiro": SPIRO, "square": SQUARE}


def load_worker_package():
    """Unpack the Python worker bundle and put it on the path."""
    if not os.path.exists(PACKAGE):
        sys.exit(f"missing {os.path.relpath(PACKAGE, REPO)} — run `yarn setup` first")
    target = tempfile.mkdtemp(prefix="papyros-bench-")
    with tarfile.open(PACKAGE) as tar:
        tar.extractall(target, filter="data")
    sys.path.insert(0, target)


def load_papyros_modules():
    """Load the turtle modules from src/ (not from the bundle, which may be stale).

    They live in the ``papyros`` package, whose ``__init__`` pulls in Pyodide, so
    they are loaded into a stand-in package that only holds these two modules.
    """
    package = types.ModuleType("papyros_turtle")
    package.__path__ = [os.path.join(WORKER, "papyros")]
    sys.modules["papyros_turtle"] = package
    for name in ("turtle_svg", "turtle_hook"):
        path = os.path.join(WORKER, "papyros", f"{name}.py")
        spec = importlib.util.spec_from_file_location(f"papyros_turtle.{name}", path)
        module = importlib.util.module_from_spec(spec)
        sys.modules[f"papyros_turtle.{name}"] = module
        spec.loader.exec_module(module)
    return sys.modules["papyros_turtle.turtle_hook"]


def install_turtle(turtle_hook):
    """Set up turtle exactly like the worker does, and return the import hook."""
    hook = turtle_hook.TurtleImportHook()
    hook.papyros = None
    sys.modules.pop("turtle", None)
    sys.meta_path = [h for h in sys.meta_path if not isinstance(h, turtle_hook.TurtleImportHook)]
    sys.meta_path.insert(0, hook)
    return hook


def replay(patches):
    """The frontend's TurtleSvgBuilder, in Python (src/frontend/state/TurtleSvg.ts)."""
    fragments, order, open_, close = {}, None, "", ""
    for patch in patches:
        if patch.get("clear"):
            fragments, order = {}, None
        if "open" in patch:
            open_, close = patch["open"], patch.get("close", "")
        for index, fragment in patch.get("set", []):
            fragments[index] = fragment
        if "order" in patch:
            order = patch["order"]
    if not open_:
        return None
    order = order if order is not None else sorted(fragments)
    return open_ + "".join(fragments.get(i, "") for i in order) + close


def run(source, mode, module_name="sandbox"):
    """Trace ``source`` and snapshot the drawing after every frame."""
    from tracer import JSONTracer

    turtle_hook = load_papyros_modules()
    hook = install_turtle(turtle_hook)

    snapshots = []      # what a frame contributed to the payload sent to the frontend
    snapshot_time = 0.0
    frames = 0

    def take_snapshot():
        nonlocal snapshot_time
        if hook.render is None:
            return
        start = time.perf_counter()
        if mode == "patch":
            patch = hook.svg_stream.patch()
            payload = None if patch is None else json.dumps(patch)
        else:
            from svg_turtle import SvgTurtle

            svg = SvgTurtle._pen.to_svg()
            encoded = base64.b64encode(svg.encode("utf-8")).decode("utf-8")
            # The old code only sent a snapshot when the document changed.
            payload = None if encoded == take_snapshot.previous else encoded
            take_snapshot.previous = encoded
        snapshot_time += time.perf_counter() - start
        if payload is not None:
            snapshots.append(payload)

    take_snapshot.previous = None

    def frame_callback(_frame):
        nonlocal frames
        frames += 1
        take_snapshot()

    start = time.perf_counter()
    JSONTracer(frame_callback=frame_callback, module_name=module_name).runscript(source)
    take_snapshot()  # the snapshot Papyros emits when the program ends
    total = time.perf_counter() - start

    from svg_turtle import SvgTurtle

    document = SvgTurtle._pen.to_svg()
    if mode == "patch":
        rebuilt = replay([json.loads(p) for p in snapshots])
        if rebuilt != document:
            sys.exit("FAIL: replaying the patches does not reproduce svg-turtle's document")
    return {
        "frames": frames,
        "total": total,
        "snapshot_time": snapshot_time,
        "snapshots": len(snapshots),
        "bytes": sum(len(p) for p in snapshots),
        "document": len(document),
    }


def report(mode, result):
    print(f"  {mode:<6}  {result['snapshot_time']:7.2f}s snapshotting"
          f"  {result['total'] - result['snapshot_time']:8.2f}s tracing"
          f"  {result['total']:8.2f}s total"
          f"  {result['snapshots']:6d} snapshots"
          f"  {result['bytes'] / 1024 / 1024:8.1f} MiB streamed to the frontend")


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--program", default="spiro",
                        help="spiro (default), square, or a path to a Python file")
    parser.add_argument("--mode", default="both", choices=("both", "full", "patch"))
    args = parser.parse_args()

    if args.program in PROGRAMS:
        source = PROGRAMS[args.program]
    else:
        with open(args.program) as f:
            source = f.read()

    load_worker_package()
    modes = ("full", "patch") if args.mode == "both" else (args.mode,)

    print(f"program: {args.program}")
    results = {}
    for mode in modes:
        results[mode] = run(source, mode)
        report(mode, results[mode])

    first = results[modes[0]]
    print(f"\n{first['frames']} debug frames, final drawing {first['document'] / 1024:.0f} KiB of SVG")
    if len(modes) == 2:
        full, patch = results["full"], results["patch"]
        print(f"speedup: {full['snapshot_time'] / max(patch['snapshot_time'], 1e-9):.0f}x less time snapshotting, "
              f"{full['bytes'] / max(patch['bytes'], 1):.0f}x fewer bytes to the frontend")
        print("(patches reproduce svg-turtle's document exactly)")
    print("\nNote: 'tracing' is everything json-tracer does per frame and is untouched by this\n"
          "benchmark; for turtle programs it is dominated by the closure-discovery walk in\n"
          "json_tracer.visit_all_locally_reachable_function_objs.")


if __name__ == "__main__":
    main()
