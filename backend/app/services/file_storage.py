import json
from pathlib import Path
from tempfile import NamedTemporaryFile
from typing import Any

from app.core.config import settings


class StorageCorruptionError(ValueError):
    pass


def ensure_storage_files() -> None:
    settings.resolved_storage_dir.mkdir(parents=True, exist_ok=True)
    for path in (settings.log_chain_path, settings.tamper_warning_path):
        if not path.exists():
            path.write_text("", encoding="utf-8")


def _read_jsonl(path: Path) -> list[dict[str, Any]]:
    ensure_storage_files()
    items: list[dict[str, Any]] = []
    with path.open("r", encoding="utf-8") as handle:
        for line_number, raw_line in enumerate(handle, start=1):
            line = raw_line.strip()
            if not line:
                continue
            try:
                item = json.loads(line)
            except json.JSONDecodeError as exc:
                raise StorageCorruptionError(
                    f"Invalid JSON in {path.name} at line {line_number}: {exc.msg}"
                ) from exc
            if not isinstance(item, dict):
                raise StorageCorruptionError(
                    f"Invalid JSON object in {path.name} at line {line_number}."
                )
            items.append(item)
    return items


def _write_jsonl(path: Path, items: list[dict[str, Any]]) -> None:
    ensure_storage_files()
    with NamedTemporaryFile("w", delete=False, encoding="utf-8", dir=str(path.parent)) as handle:
        for item in items:
            handle.write(json.dumps(item, ensure_ascii=False) + "\n")
        temp_path = Path(handle.name)
    temp_path.replace(path)


def read_log_records() -> list[dict[str, Any]]:
    return _read_jsonl(settings.log_chain_path)


def write_log_records(items: list[dict[str, Any]]) -> None:
    _write_jsonl(settings.log_chain_path, items)


def append_log_record(item: dict[str, Any]) -> None:
    ensure_storage_files()
    with settings.log_chain_path.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(item, ensure_ascii=False) + "\n")


def read_warning_records() -> list[dict[str, Any]]:
    return _read_jsonl(settings.tamper_warning_path)


def append_warning_record(item: dict[str, Any]) -> None:
    ensure_storage_files()
    with settings.tamper_warning_path.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(item, ensure_ascii=False) + "\n")


def clear_storage_files() -> dict[str, bool]:
    ensure_storage_files()
    settings.log_chain_path.write_text("", encoding="utf-8")
    settings.tamper_warning_path.write_text("", encoding="utf-8")
    return {
        "cleared_logs": True,
        "cleared_warnings": True,
    }
