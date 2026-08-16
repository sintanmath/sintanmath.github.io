from __future__ import annotations

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
        self.assertIn("teorth.github.io/tao-web", homepage)

    def test_pages_artifact_disables_jekyll(self) -> None:
        self.assertTrue((SITE / ".nojekyll").exists())

    def test_building_placeholder_pages_exist(self) -> None:
        expected = [
            "apps/infinite-sum-game.html",
            "apps/eml-function.html",
            "works/trigonometry-human.html",
        ]
        for relative_path in expected:
            with self.subTest(relative_path=relative_path):
                page = SITE / relative_path
                self.assertTrue(page.exists())
                self.assertIn("制作中", page.read_text(encoding="utf-8"))

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
        self.assertEqual(homepage.count("视频待补充"), 5)

    def test_generated_pages_have_no_runtime_ai_calls(self) -> None:
        forbidden = ("api.openai.com", "anthropic.com", "generativelanguage.googleapis.com")
        for page in SITE.rglob("*.html"):
            content = page.read_text(encoding="utf-8")
            for domain in forbidden:
                with self.subTest(page=page.name, domain=domain):
                    self.assertNotIn(domain, content)


if __name__ == "__main__":
    unittest.main()
