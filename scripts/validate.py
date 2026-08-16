#!/usr/bin/env python3
"""Validate the site's YAML source against its JSON Schema."""

from __future__ import annotations

import sys
from pathlib import Path

import yaml
from jsonschema import Draft202012Validator


ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data" / "site.yaml"
SCHEMA = ROOT / "schema" / "site.schema.json"


def main() -> int:
    schema = yaml.safe_load(SCHEMA.read_text(encoding="utf-8"))
    document = yaml.safe_load(DATA.read_text(encoding="utf-8"))
    validator = Draft202012Validator(schema)
    errors = sorted(validator.iter_errors(document), key=lambda error: list(error.path))

    if errors:
        for error in errors:
            location = "/".join(str(part) for part in error.path) or "(root)"
            print(f"{DATA.name}: {location}: {error.message}", file=sys.stderr)
        print(f"\n{len(errors)} problem(s) found.", file=sys.stderr)
        return 1

    section_ids = [section["id"] for section in document["sections"]]
    item_ids = [
        item["id"]
        for section in document["sections"]
        for item in section["items"]
    ]
    duplicates = {
        item_id for item_id in item_ids if item_ids.count(item_id) > 1
    }
    if len(section_ids) != len(set(section_ids)) or duplicates:
        print("Section and item ids must be unique.", file=sys.stderr)
        return 1

    print(
        f"OK: {len(document['sections'])} sections, "
        f"{len(item_ids)} projects."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

