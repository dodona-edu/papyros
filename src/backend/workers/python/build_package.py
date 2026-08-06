
import tarfile
import shutil
import os
import subprocess
import sys
import sysconfig

def tarfile_filter(tar_info):
    name = tar_info.name
    if any(
        x in name
        for x in [
            "__pycache__",
            "friendly_traceback/locales"
        ]
    ) or name.endswith(".pyc"):
        return None
    return tar_info

def relative_files(root):
    """Paths of every file under root, relative to it, ignoring what the tarball filter drops."""
    found = set()
    for dir_path, dir_names, file_names in os.walk(root):
        dir_names[:] = [d for d in dir_names if d != "__pycache__"]
        for file_name in file_names:
            if file_name.endswith(".pyc"):
                continue
            found.add(os.path.relpath(os.path.join(dir_path, file_name), root))
    return found

def create_package(package_name, dependencies, extra_deps):
    shutil.rmtree(package_name, ignore_errors=True)
    install_dependencies(dependencies.split(" "), package_name)
    dest_dir = os.path.join(package_name, extra_deps)
    shutil.rmtree(dest_dir, ignore_errors=True)
    try:
        shutil.copytree(extra_deps, dest_dir)
    except shutil.Error:
        # copytree raises if copying file metadata (e.g. macOS xattrs) fails
        # on any entry, even when every file's contents copied fine; the
        # check below is what actually decides if the copy succeeded
        pass
    missing = sorted(relative_files(extra_deps) - relative_files(dest_dir))
    if missing:
        raise RuntimeError(f"failed to copy {len(missing)} file(s) from {extra_deps!r} into {dest_dir!r}: {missing}")
    # Bundle CPython's turtle.py (removed from Pyodide's stdlib, required by svg-turtle).
    # Locate via sysconfig rather than `import turtle`, which would pull in tkinter.
    turtle_src = os.path.join(sysconfig.get_path("stdlib"), "turtle.py")
    shutil.copy(turtle_src, os.path.join(package_name, "turtle.py"))
    # Vendored from pyodide-worker-runner, provides install_imports used by papyros.py
    shutil.copy("pyodide_worker_runner.py", os.path.join(package_name, "pyodide_worker_runner.py"))
    tar_name = f"{package_name}.tar.gz.load_by_url"
    if os.path.exists(tar_name):
        os.remove(tar_name)
    with tarfile.open(tar_name, "w:gz") as tar:
        tar.add(package_name, arcname="", recursive=True, filter=tarfile_filter)
    shutil.rmtree(package_name)

def install_dependencies(packages, out_dir):
    if not isinstance(packages, list):
        packages = [packages]
    subprocess.check_call([sys.executable, "-m", "pip", "install", "-t", out_dir, *packages])

if __name__ == "__main__":
    create_package("python_package", "python-runner friendly_traceback pylint>=4,<5 tomli typing-extensions dodona-json-tracer>=1.0.0 svg-turtle", extra_deps="papyros")
