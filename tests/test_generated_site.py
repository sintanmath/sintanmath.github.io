from __future__ import annotations

import json
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT / "site"


class GeneratedSiteTests(unittest.TestCase):
    def test_homepage_contains_all_sections(self) -> None:
        homepage = (SITE / "index.html").read_text(encoding="utf-8")
        self.assertIn("仙童数学", homepage)
        self.assertIn("sintanmath", homepage)
        self.assertIn("个人介绍", homepage)
        self.assertIn("交互数学内容", homepage)
        self.assertIn("数学功法", homepage)
        self.assertIn("点 · 线 · 结构", homepage)
        self.assertIn("Zometool 虚拟构建", homepage)
        self.assertIn("eml函数", homepage)
        self.assertIn("teorth.github.io/tao-web", homepage)
        self.assertIn("bili-spotlight", homepage)
        self.assertIn("粉丝", homepage)
        self.assertIn("space.bilibili.com/490068376", homepage)
        self.assertNotIn("个视频", homepage)
        snapshot = json.loads((ROOT / "data" / "bilibili.json").read_text(encoding="utf-8"))
        if snapshot.get("play"):
            self.assertIn("总播放", homepage)

    def test_homepage_theme_switch_and_sage_palette(self) -> None:
        homepage = (SITE / "index.html").read_text(encoding="utf-8")
        self.assertIn('data-theme="system"', homepage)
        self.assertIn("跟随系统", homepage)
        self.assertIn("亮色", homepage)
        self.assertIn("暗色", homepage)
        self.assertIn("sintanmath-theme", homepage)
        self.assertIn("--accent: #2f7a6c", homepage)
        self.assertNotIn("#f7f1e3", homepage)
        self.assertNotIn("#9f2f28", homepage)

    def test_pages_artifact_disables_jekyll(self) -> None:
        self.assertTrue((SITE / ".nojekyll").exists())

    def test_homepage_uses_avatar_favicon(self) -> None:
        homepage = (SITE / "index.html").read_text(encoding="utf-8")
        self.assertIn('rel="icon"', homepage)
        self.assertIn("/favicon.png", homepage)
        self.assertTrue((SITE / "favicon.png").exists())
        self.assertTrue((SITE / "favicon.ico").exists())
        self.assertTrue((SITE / "apple-touch-icon.png").exists())

    def test_building_placeholder_pages_exist(self) -> None:
        expected = [
            "apps/infinite-sum-game.html",
        ]
        for relative_path in expected:
            with self.subTest(relative_path=relative_path):
                page = SITE / relative_path
                self.assertTrue(page.exists())
                self.assertIn("制作中", page.read_text(encoding="utf-8"))

    def test_trigonometry_courseware_opens_quark_share(self) -> None:
        quark_url = "https://pan.quark.cn/s/c08341b3a3e8"
        homepage = (SITE / "index.html").read_text(encoding="utf-8")
        self.assertIn("配套课件", homepage)
        self.assertIn(quark_url, homepage)
        self.assertIn(f'href="{quark_url}"', homepage)
        self.assertFalse((SITE / "works" / "trigonometry-human.html").exists())

    def test_eml_function_app_is_published(self) -> None:
        page = SITE / "apps" / "eml-function" / "index.html"
        self.assertTrue(page.exists())
        content = page.read_text(encoding="utf-8")
        self.assertIn("EML 单算子常数构造器", content)
        self.assertIn("返回仙童数学主页", content)
        self.assertNotIn("<strong>制作中</strong>", content)
        self.assertTrue((page.parent / "app.js").exists())
        self.assertTrue((page.parent / "simplifications.json").exists())

    def test_zometool_builder_embeds_third_party_page(self) -> None:
        page = SITE / "apps" / "zometool-builder" / "index.html"
        content = page.read_text(encoding="utf-8")
        self.assertTrue(page.exists())
        self.assertIn("https://cdn.mathufo.com/zometool/builder/", content)
        self.assertIn("<iframe", content)
        self.assertIn("并非仙童数学制作", content)
        self.assertIn("返回仙童数学主页", content)
        self.assertNotIn("<strong>制作中</strong>", content)

    def test_workbench_app_is_published(self) -> None:
        page = SITE / "apps" / "geometric-discovery-workbench" / "index.html"
        self.assertTrue(page.exists())
        content = page.read_text(encoding="utf-8")
        self.assertIn("点 · 线 · 结构", content)
        self.assertNotIn("<strong>制作中</strong>", content)
        self.assertTrue((page.parent / "assets").is_dir())

    def test_published_scroll_pages_are_preserved(self) -> None:
        expected_titles = {
            "works/immortal-geometry.html": "地阶残卷·仙式几何篇",
            "works/differential-trigonometry.html": "地阶残卷·微分三角篇",
        }
        for relative_path, title in expected_titles.items():
            with self.subTest(relative_path=relative_path):
                content = (SITE / relative_path).read_text(encoding="utf-8")
                self.assertIn(title, content)
                self.assertNotIn("<strong>制作中</strong>", content)
                self.assertIn("返回仙童数学主页", content)

    def test_every_project_has_a_video_slot(self) -> None:
        homepage = (SITE / "index.html").read_text(encoding="utf-8")
        self.assertEqual(homepage.count("视频待补充"), 3)
        self.assertIn("BV1ZhdSB6E7E", homepage)
        self.assertIn("BV1KDgf6zE89", homepage)
        for bvid in (
            "BV1BU4HzVE1j",
            "BV17o4vzLEAH",
            "BV1JmWxzSE9Y",
            "BV13gCnBJEod",
            "BV1bpUWBvETi",
            "BV1uh4y1D7wz",
            "BV19h4y1U7cm",
            "BV1pm4y1T7Bt",
        ):
            with self.subTest(bvid=bvid):
                self.assertIn(bvid, homepage)

    def test_generated_pages_have_no_runtime_ai_calls(self) -> None:
        forbidden = ("api.openai.com", "anthropic.com", "generativelanguage.googleapis.com")
        for page in SITE.rglob("*.html"):
            content = page.read_text(encoding="utf-8")
            for domain in forbidden:
                with self.subTest(page=page.name, domain=domain):
                    self.assertNotIn(domain, content)


if __name__ == "__main__":
    unittest.main()
