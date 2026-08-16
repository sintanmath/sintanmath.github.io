from __future__ import annotations

import sys
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))

import fetch_bilibili  # noqa: E402


class FetchBilibiliTests(unittest.TestCase):
    def test_format_zh_count(self) -> None:
        self.assertEqual(fetch_bilibili.format_zh_count(249), "249")
        self.assertEqual(fetch_bilibili.format_zh_count(9999), "9999")
        self.assertEqual(fetch_bilibili.format_zh_count(10000), "1 万")
        self.assertEqual(fetch_bilibili.format_zh_count(211297), "21.1 万")
        self.assertEqual(fetch_bilibili.format_zh_count(1_000_000), "100 万")
        self.assertEqual(fetch_bilibili.format_zh_count(19_268_398), "1927 万")
        self.assertEqual(fetch_bilibili.format_zh_count(100_000_000), "1 亿")
        self.assertEqual(fetch_bilibili.format_zh_parts(211297), ("21.1", "万"))

    def test_config_points_to_xian_tong_math(self) -> None:
        config = fetch_bilibili.load_config()
        self.assertEqual(config["mid"], 490068376)
        self.assertIn("490068376", config["space_url"])


if __name__ == "__main__":
    unittest.main()
