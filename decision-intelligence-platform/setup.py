from setuptools import setup, find_packages

setup(
    name="decision-intelligence-platform",
    version="1.0.0",
    description="AI-Powered Decision Intelligence Platform — Cloud-Native, GPU-Accelerated",
    packages=find_packages(),
    install_requires=[
        "pandas>=2.0.0",
        "numpy>=1.24.0",
        "pyarrow>=12.0.0",
        "flask>=3.0.0",
        "flask-cors>=4.0.0",
        "google-generativeai>=0.7.0",
        "python-dotenv>=1.0.0",
        "pyyaml>=6.0.0",
    ],
    extras_require={
        "gpu": [],
        "dev": ["pytest>=8.0.0", "black>=24.0.0"],
    },
    python_requires=">=3.10",
)