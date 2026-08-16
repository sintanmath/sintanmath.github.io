#!/usr/bin/env python3
"""Fetch public Bilibili stats for 仙童数学 and write a local snapshot."""

from __future__ import annotations

import argparse
import hashlib
import hmac
import http.cookiejar
import json
import os
import sys
import time
import urllib.error
import urllib.parse
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
WBI_MIXIN_TAB = [
    46, 47, 18, 2, 53, 8, 23, 32, 15, 50, 10, 31, 58, 3, 45, 35, 27, 43, 5, 49,
    33, 9, 42, 19, 29, 28, 14, 39, 12, 38, 41, 13, 37, 48, 7, 16, 24, 55, 40,
    61, 26, 17, 0, 1, 60, 51, 30, 4, 22, 25, 54, 21, 56, 59, 6, 63, 57, 62, 11,
    36, 20, 34, 44, 52,
]


def load_config() -> dict:
    document = yaml.safe_load(CONFIG.read_text(encoding="utf-8"))
    mid = int(document["mid"])
    space_url = str(document.get("space_url") or f"https://space.bilibili.com/{mid}")
    return {"mid": mid, "space_url": space_url}


def format_zh_count(count: int) -> str:
    number, unit = format_zh_parts(count)
    return f"{number} {unit}".strip()


def format_zh_parts(count: int) -> tuple[str, str]:
    if count >= 100_000_000:
        value = count / 100_000_000
        unit = "亿"
        digits = 1 if value < 100 else 0
    elif count >= 10_000:
        value = count / 10_000
        unit = "万"
        digits = 1 if value < 100 else 0
    else:
        return str(count), ""
    text = f"{value:.{digits}f}"
    if text.endswith(".0"):
        text = text[:-2]
    return text, unit


class BiliClient:
    def __init__(self, mid: int) -> None:
        self.mid = mid
        self.jar = http.cookiejar.CookieJar()
        self.opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(self.jar))
        self.ticket = ""
        self.sessdata = os.environ.get("BILI_SESSDATA", "").strip()
        self._prepare_session()

    def _prepare_session(self) -> None:
        self.request("https://www.bilibili.com/", accept="text/html")
        timestamp = str(int(time.time()))
        hexsign = hmac.new(
            b"XgwSnGZ1p",
            f"ts{timestamp}".encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()
        query = urllib.parse.urlencode(
            {
                "key_id": "ec02",
                "hexsign": hexsign,
                "context[ts]": timestamp,
                "csrf": "",
            }
        )
        payload = self.request(
            "https://api.bilibili.com/bapis/bilibili.api.ticket.v1.Ticket/GenWebTicket"
            f"?{query}",
            method="POST",
        )
        ticket = ((payload.get("data") or {}).get("ticket")) if isinstance(payload, dict) else None
        if ticket:
            self.ticket = str(ticket)

    def request(self, url: str, accept: str = "application/json", method: str = "GET") -> dict | str:
        headers = {
            "User-Agent": USER_AGENT,
            "Referer": f"https://space.bilibili.com/{self.mid}",
            "Origin": "https://space.bilibili.com",
            "Accept": accept,
        }
        cookies = [f"{cookie.name}={cookie.value}" for cookie in self.jar]
        if self.ticket:
            cookies.append(f"bili_ticket={self.ticket}")
        if self.sessdata:
            cookies.append(f"SESSDATA={self.sessdata}")
        if cookies:
            headers["Cookie"] = "; ".join(cookies)
        request = urllib.request.Request(
            url,
            data=b"" if method == "POST" else None,
            method=method,
            headers=headers,
        )
        with self.opener.open(request, timeout=20) as response:
            raw = response.read().decode("utf-8")
        if accept != "application/json":
            return raw
        payload = json.loads(raw)
        if not isinstance(payload, dict):
            raise RuntimeError(f"{url} returned a non-object payload")
        return payload

    def get_json(self, url: str) -> dict:
        payload = self.request(url)
        if not isinstance(payload, dict):
            raise RuntimeError(f"{url} returned a non-object payload")
        if payload.get("code") != 0 or not isinstance(payload.get("data"), dict):
            raise RuntimeError(f"{url} returned {payload.get('code')}: {payload.get('message')}")
        return payload["data"]

    def wbi_mixin(self) -> str:
        payload = self.request("https://api.bilibili.com/x/web-interface/nav")
        data = payload.get("data") if isinstance(payload, dict) and isinstance(payload.get("data"), dict) else {}
        images = data.get("wbi_img") or {}
        img_key = str(images.get("img_url", "")).rsplit("/", 1)[-1].split(".")[0]
        sub_key = str(images.get("sub_url", "")).rsplit("/", 1)[-1].split(".")[0]
        raw = img_key + sub_key
        mixin = "".join(raw[index] for index in WBI_MIXIN_TAB if index < len(raw))[:32]
        if len(mixin) < 32:
            raise RuntimeError("Bilibili WBI keys were missing from nav")
        return mixin


def wbi_sign(params: dict, mixin: str) -> dict:
    cleaned = {
        key: "".join(char for char in str(value) if char not in "!'()*")
        for key, value in params.items()
    }
    cleaned["wts"] = int(time.time())
    query = urllib.parse.urlencode(sorted(cleaned.items()))
    cleaned["w_rid"] = hashlib.md5((query + mixin).encode("utf-8")).hexdigest()
    return cleaned


def as_int(value: object) -> int | None:
    if isinstance(value, bool):
        return None
    if isinstance(value, int):
        return value
    if isinstance(value, str) and value.isdigit():
        return int(value)
    return None


def fetch_play_total(client: BiliClient) -> tuple[int, int]:
    mixin = client.wbi_mixin()
    total = 0
    counted = 0
    page = 1
    while page <= 20:
        query = urllib.parse.urlencode(
            wbi_sign(
                {"mid": client.mid, "ps": 50, "pn": page, "order": "pubdate"},
                mixin,
            )
        )
        try:
            data = client.get_json(
                f"https://api.bilibili.com/x/space/wbi/arc/search?{query}"
            )
        except (OSError, urllib.error.URLError, TimeoutError, RuntimeError):
            time.sleep(1.2)
            mixin = client.wbi_mixin()
            query = urllib.parse.urlencode(
                wbi_sign(
                    {"mid": client.mid, "ps": 50, "pn": page, "order": "pubdate"},
                    mixin,
                )
            )
            data = client.get_json(
                f"https://api.bilibili.com/x/space/wbi/arc/search?{query}"
            )
        videos = ((data.get("list") or {}).get("vlist")) or []
        for item in videos:
            play = as_int(item.get("play"))
            if play is not None and play >= 0:
                total += play
                counted += 1
        if len(videos) < 50:
            return total, counted
        page += 1
        time.sleep(0.35)
    return total, counted


def fetch_stats(mid: int, space_url: str) -> dict:
    client = BiliClient(mid)
    relation = client.get_json(f"https://api.bilibili.com/x/relation/stat?vmid={mid}")
    card = client.get_json(f"https://api.bilibili.com/x/web-interface/card?mid={mid}")
    follower = int(relation["follower"])
    play, play_videos = 0, 0
    if client.sessdata:
        try:
            upstat = client.get_json(f"https://api.bilibili.com/x/space/upstat?mid={mid}")
            view = as_int((upstat.get("archive") or {}).get("view"))
            if view:
                play, play_videos = view, 10**9
        except (OSError, urllib.error.URLError, TimeoutError, RuntimeError, KeyError, ValueError) as error:
            print(f"upstat unavailable: {error}", file=sys.stderr)
    if play_videos < 180:
        try:
            play, play_videos = fetch_play_total(client)
        except (OSError, urllib.error.URLError, TimeoutError, RuntimeError, KeyError, ValueError) as error:
            print(f"Play total unavailable: {error}", file=sys.stderr)
    previous = load_snapshot() or {}
    previous_play = int(previous.get("play") or 0)
    previous_videos = int(previous.get("play_videos") or 0)
    if play_videos < 180 and previous_videos >= play_videos and previous_play:
        play = previous_play
        play_videos = previous_videos
    return {
        "mid": mid,
        "name": card.get("card", {}).get("name") or "仙童数学",
        "follower": follower,
        "follower_label": format_zh_count(follower),
        "play": play,
        "play_label": format_zh_count(play) if play else "",
        "play_videos": play_videos,
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

    play_text = f" · {stats['play_label']}播放" if stats.get("play_label") else ""
    print(f"{stats['name']} · {stats['follower_label']}粉丝{play_text}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
