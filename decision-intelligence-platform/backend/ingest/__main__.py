"""
Run the full Ingest & Clean pipeline for a given set of raw files.
"""
from pathlib import Path

from backend.ingest.landing_zone import seed_landing_zone
from backend.ingest.normalizer import normalize_all
from backend.ingest.deduplicator import deduplicate_all
from backend.ingest.filter import filter_all
from backend.config import RAW_DIR


def run_ingest(seed: bool = True, num_files: int = 5, rows_per_file: int = 2000):
    print("=" * 60)
    print("  INGEST & CLEAN LAYER")
    print(f"  User: Alex Chen — Supply Chain Operations Manager")
    print(f"  Decision Bottleneck: Inventory replenishment decision latency > 4h")
    print("=" * 60)

    if seed:
        files = seed_landing_zone(num_files, rows_per_file)
        print(f"\n[1/4] Landing zone seeded → {len(files)} files ({RAW_DIR})")

    normalized = normalize_all(RAW_DIR)
    print(f"[2/4] Normalized → {len(normalized)} files")

    deduped = deduplicate_all()
    print(f"[3/4] Deduplicated → {len(deduped)} files")

    cleaned = filter_all()
    print(f"[4/4] Cleaned → {len(cleaned)} files")

    return cleaned


if __name__ == "__main__":
    run_ingest()
