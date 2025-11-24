#!/usr/bin/env python3
"""Normalize OpenAPI JSON to remove volatile fields and produce deterministic output.

Usage:
  ./scripts/normalize_openapi.py <generated.json> <target1.json> [<target2.json> ...]

If normalized output differs from target files, the script will overwrite the targets
with the normalized generated content and exit with code 0. It prints what it changed.
"""
import json
import sys
from pathlib import Path

REMOVE_TOP_LEVEL = ["servers"]
REMOVE_INFO_KEYS = ["version", "description"]


def load_json(path: Path):
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def normalize(obj: dict) -> dict:
    # Work on a copy
    data = dict(obj)

    # Remove top-level volatile keys
    for k in REMOVE_TOP_LEVEL:
        data.pop(k, None)

    # Normalize info section
    info = data.get("info")
    if isinstance(info, dict):
        for k in REMOVE_INFO_KEYS:
            info.pop(k, None)
        # If info is now empty, remove it
        if not info:
            data.pop("info", None)
        else:
            data["info"] = info

    # Recursively remove x- fields that are likely volatile
    def strip_x(obj):
        if isinstance(obj, dict):
            return {k: strip_x(v) for k, v in obj.items() if not (k.startswith("x-") and k != "x-generated-by")}
        if isinstance(obj, list):
            return [strip_x(i) for i in obj]
        return obj

    data = strip_x(data)

    return data


def dump_normalized(data: dict) -> str:
    return json.dumps(data, sort_keys=True, indent=2, ensure_ascii=False) + "\n"


def main(argv):
    if len(argv) < 3:
        print("Usage: normalize_openapi.py <generated.json> <target1.json> [<target2.json> ...]")
        return 2

    gen_path = Path(argv[1])
    targets = [Path(p) for p in argv[2:]]

    if not gen_path.exists():
        print(f"Generated file not found: {gen_path}")
        return 2

    generated = load_json(gen_path)
    normalized = normalize(generated)
    out = dump_normalized(normalized)

    changed = False
    for t in targets:
        if t.exists():
            current = t.read_text(encoding="utf-8")
            if current != out:
                t.write_text(out, encoding="utf-8")
                print(f"Updated {t}")
                changed = True
            else:
                print(f"No change for {t}")
        else:
            t.write_text(out, encoding="utf-8")
            print(f"Created {t}")
            changed = True

    if changed:
        print("Normalization updated target schema files.")
    else:
        print("Normalized schema matches targets. No update needed.")

    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
