#!/usr/bin/env python3
"""Fetch public Bilibili stats for 仙童数学 and write a local snapshot."""

from __future__ import annotations

import argparse
import json
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

import yaml


ROOT = Path(__file__).resolve().parent.parent
CONFIG = ROOT / "data" / "bilibili.yaml"
SNAPSHOT = ROOT / "data" / "bilibili.json"
USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/126.0.0.0 Safari/537.36"
)


def load_config() -> dict:
    document = yaml.safe_load(CONFIG.read_text(encoding="utf-8"))
    mid = int(document["mid"])
    space_url = str(document.get("space_url") or f"https://space.bilibili.com/{mid}")
    return {"mid": mid, "space_url": space_url}


def format_zh_count(count: int) -> str:
    if count < 10_000:
        return str(count)
    wan = count / 10_000
    if wan >= 100:
        return f"{wan:.0f} 万"
    text = f"{wan:.1f}"
    if text.endswith(".0"):
        text = text[:-2]
    return f"{text} 万"


def get_json(url: str, mid: int) -> dict:
    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": USER_AGENT,
            "Referer": f"https://space.bilibili.com/{mid}",
            "Origin": "https://space.bilibili.com",
        },
    )
    with urllib.request.urlopen(request, timeout=15) as response:
        payload = json.loads(response.read().decode("utf-8"))
    if payload.get("code") != 0 or not isinstance(payload.get("data"), dict):
        raise RuntimeError(f"{url} returned {payload.get('code')}: {payload.get('message')}")
    return payload["data"]


def fetch_stats(mid: int, space_url: str) -> dict:
    relation = get_json(f"https://api.bilibili.com/x/relation/stat?vmid={mid}", mid)
    card = get_json(f"https://api.bilibili.com/x/web-interface/card?mid={mid}", mid)
    nav = get_json(f"https://api.bilibili.com/x/space/navnum?mid={mid}", mid)
    follower = int(relation["follower"])
    return {
        "mid": mid,
        "name": card.get("card", {}).get("name") or "仙童数学",
        "follower": follower,
        "follower_label": format_zh_count(follower),
        "following": int(relation.get("following") or 0),
        "video": int(nav.get("video") or 0),
        "space_url": space_url,
        "fetched_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
    }


def load_snapshot() -> dict | None:
    if not SNAPSHOT.exists():
        return None
    document = json.loads(SNAPSHOT.read_text(encoding="utf-8"))
    if not isinstance(document, dict) or "follower" not in document:
        return None
    return document


def write_snapshot(stats: dict) -> None:
    SNAPSHOT.write_text(
        json.dumps(stats, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def main() -> int:
    parser = argparse.ArgumentParser(description="Fetch public Bilibili stats.")
    parser.add_argument(
        "--offline",
        action="store_true",
        help="reuse the last snapshot instead of calling the API",
    )
    args = parser.parse_args()
    config = load_config()

    if args.offline:
        stats = load_snapshot()
        if stats is None:
            print("No Bilibili snapshot found.", file=sys.stderr)
            return 1
    else:
        try:
            stats = fetch_stats(config["mid"], config["space_url"])
        except (OSError, urllib.error.URLError, TimeoutError, RuntimeError, KeyError, ValueError) as error:
            print(f"Bilibili fetch failed: {error}", file=sys.stderr)
            return 1
        write_snapshot(stats)

    print(
        f"{stats['name']} · {stats['follower_label']}粉丝 · "
        f"{stats['video']} 个视频"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
