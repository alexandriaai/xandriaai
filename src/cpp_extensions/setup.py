from setuptools import setup, Extension
import pybind11

module = Extension(
    "fastcompute",
    sources=["fastcompute.cpp"],
    include_dirs=[pybind11.get_include()],
)

setup(
    name="fastcompute",
    version="1.0",
    ext_modules=[module],
)