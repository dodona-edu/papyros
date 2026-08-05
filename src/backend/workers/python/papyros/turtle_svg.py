"""Incremental SVG rendering for the svg-turtle canvas.

svg-turtle's ``to_svg()`` rebuilds the entire SVG document from every canvas
item on every call. Papyros takes a snapshot after every debug frame, which
makes debugging a turtle program O(frames x items): for the spirograph of
dodona-edu/papyros#1020 that is ~1130 full re-renders of a 260 KiB document,
each of which is then base64-encoded and shipped to the main thread.

Here every canvas item is rendered once and its SVG fragment is cached, so a
snapshot only pays for the items that actually changed. Snapshots are emitted
as patches that the frontend replays, which keeps the transferred and retained
bytes linear in the size of the drawing instead of quadratic.
"""

from svgwrite import Drawing
from svg_turtle.canvas import Canvas


class TrackedCanvas(Canvas):
    """Canvas that remembers which items changed since the last snapshot."""

    def __init__(self, width=400, height=250):
        super().__init__(width, height)
        self._dirty = set()
        self._cleared = False
        self._order_changed = True
        self._frame_changed = True

    def call(self, method_name, *args, **kwargs):
        item_id = super().call(method_name, *args, **kwargs)
        self._dirty.add(item_id)
        self._order_changed = True
        return item_id

    def coords(self, item, *coords):
        result = super().coords(item, *coords)
        if coords:
            self._dirty.add(item)
        return result

    def itemconfigure(self, item, **kwargs):
        super().itemconfigure(item, **kwargs)
        self._dirty.add(item)

    def delete(self, item):
        super().delete(item)
        if item == "all":
            self._dirty.clear()
            self._cleared = True
            self._order_changed = True
        else:
            self._dirty.add(item)

    def config(self, **kwargs):
        super().config(**kwargs)
        # Width, height and scrollregion feed into the coordinates of every
        # item, and the background colour into the document itself, so every
        # cached fragment has to be rendered again.
        self._frame_changed = True
        self._order_changed = True
        self._dirty.update(range(len(self.items)))

    def tag_raise(self, item):
        super().tag_raise(item)
        self._order_changed = True

    def take_changes(self):
        """Return what changed since the previous call and start tracking anew.

        :return: (cleared, dirty item indices, order changed, document changed)
        """
        changes = (self._cleared, self._dirty, self._order_changed, self._frame_changed)
        self._dirty = set()
        self._cleared = False
        self._order_changed = False
        self._frame_changed = False
        return changes


class TurtleSvgStream:
    """Turns canvas mutations into incremental SVG patches.

    A patch is a JSON-friendly dict holding any of:

    ``clear``         drop all fragments held so far (the canvas was reset)
    ``open``/``close``  the document surrounding the fragments; sent whenever
                      the canvas size or background changes, so in practice once
    ``set``           ``[[item index, svg fragment], ...]`` for changed items
    ``order``         all item indices in painting order, when that order changed

    Replaying every patch of a run in order and joining the fragments yields
    exactly the document ``SvgTurtle.to_svg()`` would have returned at that
    point; ``scripts/bench_turtle.py`` asserts that equivalence.
    """

    def __init__(self, canvas):
        self._canvas = canvas
        self._fragments = {}
        self._order = None
        # A throwaway drawing, used only as an element factory: svg-turtle
        # renders an item by adding it to a Drawing, so we add it to this one
        # and take the element back out again.
        self._scratch = Drawing(size=(1, 1))
        self._scratch_size = len(self._scratch.elements)

    def patch(self):
        """Return the changes since the previous call, or None when there are none."""
        cleared, dirty, order_changed, frame_changed = self._canvas.take_changes()
        patch = {}
        if cleared:
            self._fragments.clear()
            self._order = None
            patch["clear"] = True
        if frame_changed:
            patch["open"], patch["close"] = self._document_frame()

        changed = []
        for index in sorted(dirty):
            if index >= len(self._canvas.items):
                continue  # the item was dropped by a canvas reset
            fragment = self._render(index)
            previous = self._fragments.get(index)
            if fragment == previous:
                continue
            self._fragments[index] = fragment
            if fragment == "" and previous is None:
                continue  # invisible item the frontend never heard about
            changed.append([index, fragment])
        if changed:
            patch["set"] = changed

        if order_changed:
            order = self._painting_order()
            if order != self._order:
                self._order = order
                patch["order"] = order
        return patch or None

    def _render(self, index):
        """Render one canvas item to an SVG fragment ("" when it is invisible)."""
        scratch = self._scratch
        del scratch.elements[self._scratch_size:]
        self._canvas.add_svg_element(self._canvas.items[index], scratch)
        if len(scratch.elements) == self._scratch_size:
            return ""
        return scratch.elements[-1].tostring()

    def _painting_order(self):
        items = self._canvas.items
        # Stable, so this matches svg-turtle sorting the items themselves.
        return sorted(range(len(items)), key=lambda index: items[index].z_order)

    def _document_frame(self):
        """The document that wraps the fragments, split around its content."""
        canvas = self._canvas
        drawing = Drawing(size=(canvas.winfo_width(), canvas.winfo_height()))
        bgcolor = canvas.options.get("bg")
        if bgcolor:
            drawing.add(drawing.rect(fill=bgcolor, size=("100%", "100%")))
        head, _, tail = drawing.tostring().rpartition("</svg>")
        return head, "</svg>" + tail
