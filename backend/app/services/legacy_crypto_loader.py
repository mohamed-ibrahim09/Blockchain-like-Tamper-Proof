from functools import lru_cache
from importlib.util import module_from_spec, spec_from_file_location
import sys

from app.core.config import settings


def _load_module(module_name: str, file_name: str):
    module_path = settings.resolved_crypto_source_dir / file_name
    if not module_path.exists():
        raise FileNotFoundError(
            f"Required legacy crypto file was not found: {module_path}. "
            "Update CRYPTO_SOURCE_DIR in your environment if needed."
        )

    spec = spec_from_file_location(module_name, module_path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Could not load legacy module from {module_path}.")

    module = module_from_spec(spec)
    module_dir = str(module_path.parent)
    added = False
    if module_dir not in sys.path:
        sys.path.insert(0, module_dir)
        added = True
    try:
        spec.loader.exec_module(module)
    finally:
        if added and module_dir in sys.path:
            sys.path.remove(module_dir)
    return module


@lru_cache(maxsize=1)
def get_playfair_module():
    return _load_module("legacy_playfair", "playfair.py")


@lru_cache(maxsize=1)
def get_vigenere_module():
    return _load_module("legacy_vigenere", "vignere.py")


@lru_cache(maxsize=1)
def get_rsa_module():
    return _load_module("legacy_rsa", "rsa.py")


@lru_cache(maxsize=1)
def get_hybrid_module():
    candidates = ["hybrid.py", "hyprid.py", "enhancement.py"]
    for file_name in candidates:
        module_path = settings.resolved_crypto_source_dir / file_name
        if module_path.exists() and module_path.stat().st_size > 0:
            return _load_module("legacy_hybrid", file_name)

    enhancement_path = settings.resolved_crypto_source_dir / "enhancement.py"
    if enhancement_path.exists():
        return _load_module("legacy_hybrid_fallback", "enhancement.py")

    raise FileNotFoundError(
        "No usable hybrid implementation was found in CRYPTO_SOURCE_DIR. "
        "Expected hybrid.py, hyprid.py, or enhancement.py."
    )
