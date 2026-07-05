"""
GCS / BigQuery integration — reads/writes data to Google Cloud Storage and BigQuery.

Provides drop-in replacements for local file-based I/O so the pipeline
can run against real GCP services in production.
"""
from __future__ import annotations

import io
import os
from pathlib import Path
from typing import Optional

import pandas as pd

from backend.config import GCS_BUCKET, GCS_PROJECT

GCS_AVAILABLE = False
BQ_AVAILABLE = False

try:
    from google.cloud import storage
    from google.cloud.exceptions import NotFound

    GCS_AVAILABLE = True
except ImportError:
    pass

try:
    from google.cloud import bigquery

    BQ_AVAILABLE = True
except ImportError:
    pass


# ── GCS Helpers ──────────────────────────────────────────────────


def _gcs_client():
    return storage.Client(project=GCS_PROJECT)


def list_gcs_files(prefix: str = "raw/") -> list[str]:
    if not GCS_AVAILABLE:
        raise RuntimeError("google-cloud-storage not installed")
    bucket = _gcs_client().bucket(GCS_BUCKET)
    blobs = bucket.list_blobs(prefix=prefix)
    return [b.name for b in blobs if not b.name.endswith("/")]


def read_csv_from_gcs(blob_path: str) -> pd.DataFrame:
    if not GCS_AVAILABLE:
        raise RuntimeError("google-cloud-storage not installed")
    bucket = _gcs_client().bucket(GCS_BUCKET)
    blob = bucket.blob(blob_path)
    content = blob.download_as_string()
    return pd.read_csv(io.BytesIO(content))


def write_parquet_to_gcs(df: pd.DataFrame, blob_path: str) -> None:
    if not GCS_AVAILABLE:
        raise RuntimeError("google-cloud-storage not installed")
    bucket = _gcs_client().bucket(GCS_BUCKET)
    buf = io.BytesIO()
    df.to_parquet(buf, index=False, compression="snappy")
    buf.seek(0)
    bucket.blob(blob_path).upload_from_file(buf, content_type="application/parquet")


# ── BigQuery Helpers ─────────────────────────────────────────────


def _bq_client():
    return bigquery.Client(project=GCS_PROJECT)


def query_bigquery(sql: str) -> pd.DataFrame:
    if not BQ_AVAILABLE:
        raise RuntimeError("google-cloud-bigquery not installed")
    return _bq_client().query(sql).to_dataframe()


def write_to_bigquery(df: pd.DataFrame, table_id: str, write_disposition: str = "WRITE_TRUNCATE") -> None:
    if not BQ_AVAILABLE:
        raise RuntimeError("google-cloud-bigquery not installed")
    job = _bq_client().load_table_from_dataframe(df, table_id, job_config=bigquery.LoadJobConfig(
        write_disposition=write_disposition,
    ))
    job.result()


# ── Unified I/O (local ↔ GCS) ───────────────────────────────────


def read_dataframe(source: str | Path, format: str = "parquet") -> pd.DataFrame:
    """Read from a local path or a GCS blob path (gs://...)"""
    source_str = str(source)
    if source_str.startswith("gs://"):
        parts = source_str.replace("gs://", "").split("/", 1)
        if len(parts) == 2:
            return read_csv_from_gcs(parts[1]) if format == "csv" else pd.read_parquet(
                io.BytesIO(_gcs_client().bucket(parts[0]).blob(parts[1]).download_as_string())
            )
    path = Path(source)
    if format == "csv":
        return pd.read_csv(path)
    return pd.read_parquet(path)


def write_dataframe(df: pd.DataFrame, destination: str | Path, format: str = "parquet") -> None:
    dest = str(destination)
    if dest.startswith("gs://"):
        parts = dest.replace("gs://", "").split("/", 1)
        if len(parts) == 2:
            write_parquet_to_gcs(df, parts[1])
        return
    path = Path(destination)
    path.parent.mkdir(parents=True, exist_ok=True)
    if format == "csv":
        df.to_csv(path, index=False)
    else:
        df.to_parquet(path, index=False, compression="snappy")
