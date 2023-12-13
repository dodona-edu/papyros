
import tarfile
import shutil
import os
import subprocess
import sys

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

def create_package(package_name, dependencies, extra_deps):
    shutil.rmtree(package_name, ignore_errors=True)
    install_dependencies(dependencies.split(" "), package_name)
    try:
        dest_dir = os.path.join(package_name, extra_deps)
        shutil.rmtree(dest_dir, ignore_errors=True)
        shutil.copytree(extra_deps, dest_dir)
    except Exception as e:
        # Always seems to result in a harmless permission denied error
        pass
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

def check_tar(tarname, out_dir="."):
    with open(tarname, "rb") as t:
        shutil.unpack_archive(tarname, out_dir, 'gztar')


if __name__ == "__main__":
    create_package("python_package", "python-runner friendly_traceback pylint<3.0.0 tomli typing-extensions json-tracer>=0.4.0b1", extra_deps="papyros")
