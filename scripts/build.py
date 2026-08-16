#!/usr/bin/env python3
"""Render data/site.yaml to a small static site."""

from __future__ import annotations

import html
import shutil
from pathlib import Path

import yaml


ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data" / "site.yaml"
STATIC = ROOT / "static"
SITE = ROOT / "site"

CSS = r"""
:root {
  color-scheme: light dark;
  --paper: #f7f1e3;
  --paper-deep: #eee4d0;
  --ink: #1e2421;
  --muted: #696b62;
  --line: #cfc4ae;
  --accent: #9f2f28;
  --accent-deep: #71201c;
  --card: rgba(255, 252, 243, .72);
  --wash: rgba(159, 47, 40, .065);
  --shadow: rgba(59, 43, 27, .09);
}
@media (prefers-color-scheme: dark) {
  :root {
    --paper: #171a18;
    --paper-deep: #20231f;
    --ink: #e9e2d2;
    --muted: #aaa99f;
    --line: #44463f;
    --accent: #e18a7d;
    --accent-deep: #f0aea5;
    --card: rgba(35, 38, 34, .78);
    --wash: rgba(225, 138, 125, .08);
    --shadow: rgba(0, 0, 0, .2);
  }
}
* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body {
  margin: 0;
  color: var(--ink);
  background:
    radial-gradient(circle at 18% 8%, var(--wash), transparent 28rem),
    repeating-linear-gradient(0deg, transparent 0 27px, rgba(100, 85, 62, .025) 28px),
    var(--paper);
  font-family: "Songti SC", "STSong", "Noto Serif CJK SC", Georgia, serif;
  font-size: 17px;
  line-height: 1.72;
}
a { color: var(--accent-deep); text-underline-offset: .2em; }
a:hover { color: var(--accent); }
.wrap { width: min(880px, calc(100% - 2.4rem)); margin: 0 auto; }
.masthead {
  position: relative;
  padding: 5.6rem 0 3.3rem;
  border-bottom: 1px solid var(--line);
}
.seal {
  position: absolute;
  top: 2rem;
  right: 0;
  width: 3.2rem;
  aspect-ratio: 1;
  display: grid;
  place-items: center;
  color: var(--paper);
  background: var(--accent);
  border-radius: 3px;
  font-size: 1.15rem;
  line-height: 1.05;
  letter-spacing: .08em;
  box-shadow: inset 0 0 0 3px var(--accent), inset 0 0 0 4px currentColor;
  transform: rotate(2deg);
}
.kicker, .eyebrow {
  margin: 0 0 .6rem;
  color: var(--accent);
  font-family: Georgia, "Times New Roman", serif;
  font-size: .72rem;
  font-weight: 700;
  letter-spacing: .19em;
  text-transform: uppercase;
}
h1, h2, h3 { line-height: 1.22; }
h1 {
  max-width: 12ch;
  margin: 0;
  font-size: clamp(2.6rem, 7vw, 5.2rem);
  font-weight: 600;
  letter-spacing: -.06em;
}
.tagline {
  max-width: 38rem;
  margin: 1.15rem 0 .35rem;
  color: var(--muted);
  font-size: 1.15rem;
}
.owner { margin: 0; font-size: .9rem; color: var(--muted); }
.intro {
  display: grid;
  grid-template-columns: 11rem 1fr;
  gap: 2.5rem;
  padding: 3rem 0;
  border-bottom: 1px solid var(--line);
}
.intro h2, .section-head h2 {
  margin: 0;
  font-size: 1.42rem;
  font-weight: 600;
}
.intro-copy p:first-child { margin-top: 0; }
.intro-copy p:last-child { margin-bottom: 0; }
.link-list { display: flex; flex-wrap: wrap; gap: .45rem 1rem; padding: 0; list-style: none; }
.content-section { padding: 3.4rem 0 .4rem; }
.section-head {
  display: grid;
  grid-template-columns: minmax(13rem, 1fr) 2fr;
  gap: 2rem;
  align-items: end;
  margin-bottom: 1.25rem;
}
.section-head p { margin: 0; color: var(--muted); }
.project-list { margin: 0; padding: 0; list-style: none; }
.project {
  display: grid;
  grid-template-columns: 3.2rem 1fr auto;
  gap: .9rem 1rem;
  align-items: start;
  padding: 1.3rem .2rem;
  border-top: 1px solid var(--line);
}
.index {
  color: var(--muted);
  font-family: Georgia, serif;
  font-size: .82rem;
  font-variant-numeric: tabular-nums;
}
.project h3 { margin: -.1rem 0 .25rem; font-size: 1.08rem; }
.project h3 a { color: inherit; text-decoration: none; }
.project h3 a:hover { color: var(--accent); }
.project p { margin: 0; color: var(--muted); font-size: .94rem; }
.project-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: .42rem;
}
.status {
  padding: .16rem .58rem;
  color: var(--accent-deep);
  background: var(--wash);
  border: 1px solid color-mix(in srgb, var(--accent) 28%, transparent);
  border-radius: 999px;
  font-size: .68rem;
  font-weight: 700;
  letter-spacing: .08em;
  white-space: nowrap;
}
.status.available { color: #27724c; background: rgba(39, 114, 76, .09); }
.video-link {
  display: inline-flex;
  align-items: center;
  gap: .28rem;
  color: var(--accent-deep);
  font-size: .74rem;
  font-weight: 600;
  text-decoration: none;
  white-space: nowrap;
}
.video-link::before {
  content: "▶";
  font-size: .58rem;
}
.video-link:hover { text-decoration: underline; }
.video-link.pending {
  color: var(--muted);
  cursor: default;
  opacity: .8;
}
footer {
  margin-top: 4rem;
  padding: 1.4rem 0 3rem;
  border-top: 1px solid var(--line);
  color: var(--muted);
  font-size: .8rem;
}
.back { display: inline-block; margin-bottom: 2.4rem; font-size: .88rem; }
.placeholder-main { min-height: calc(100vh - 8rem); padding: 3.5rem 0; }
.placeholder-card {
  position: relative;
  overflow: hidden;
  margin-top: 2rem;
  padding: clamp(2rem, 6vw, 4.5rem);
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 4px;
  box-shadow: 0 24px 70px var(--shadow);
}
.placeholder-card::after {
  content: "∞";
  position: absolute;
  right: -1.2rem;
  bottom: -4rem;
  color: var(--wash);
  font-family: Georgia, serif;
  font-size: 14rem;
  line-height: 1;
  pointer-events: none;
}
.placeholder-card h1 { max-width: 14ch; font-size: clamp(2.1rem, 6vw, 4.2rem); }
.placeholder-card .description { max-width: 36rem; color: var(--muted); }
.notice {
  position: relative;
  z-index: 1;
  width: fit-content;
  margin-top: 2rem;
  padding: .65rem .9rem;
  border-left: 3px solid var(--accent);
  background: var(--wash);
  font-size: .9rem;
}
@media (max-width: 650px) {
  .masthead { padding-top: 4.7rem; }
  .seal { top: 1.4rem; }
  .intro, .section-head { grid-template-columns: 1fr; gap: .8rem; }
  .project { grid-template-columns: 2.3rem 1fr; }
  .project-actions {
    grid-column: 2;
    flex-direction: row;
    align-items: center;
  }
}
@media (prefers-reduced-motion: no-preference) {
  .masthead > *, .project {
    animation: rise .55s ease both;
  }
  .project:nth-child(2) { animation-delay: .07s; }
  .project:nth-child(3) { animation-delay: .14s; }
  @keyframes rise {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
}
"""


def esc(value: object) -> str:
    return html.escape(str(value))


def page(title: str, description: str, body: str) -> str:
    return f"""<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="{esc(description)}">
  <title>{esc(title)}</title>
  <style>{CSS}</style>
</head>
<body>
{body}
</body>
</html>
"""


def render_links(links: list[dict]) -> str:
    if not links:
        return '<p class="owner">相关链接待补充。</p>'
    items = "".join(
        f'<li><a href="{esc(link["url"])}">{esc(link["label"])}</a></li>'
        for link in links
    )
    return f'<ul class="link-list">{items}</ul>'


def render_project(item: dict, index: int) -> str:
    status = item["status"]
    label = "已发布" if status == "available" else "制作中"
    video = render_video(item["video"])
    return f"""
      <li class="project">
        <span class="index">{index:02d}</span>
        <div>
          <h3><a href="{esc(item["url"])}">{esc(item["title"])}</a></h3>
          <p>{esc(item["description"])}</p>
        </div>
        <div class="project-actions">
          <span class="status {esc(status)}">{label}</span>
          {video}
        </div>
      </li>"""


def render_video(video: dict) -> str:
    if video["status"] == "available":
        return (
            f'<a class="video-link" href="{esc(video["url"])}" '
            f'target="_blank" rel="noopener noreferrer">'
            f'{esc(video["label"])}</a>'
        )
    return '<span class="video-link pending">视频待补充</span>'


def build_home(document: dict) -> str:
    site = document["site"]
    profile = document["profile"]
    profile_body = "".join(f"<p>{esc(paragraph)}</p>" for paragraph in profile["body"])
    sections = []
    counter = 1
    for section in document["sections"]:
        projects = []
        for item in section["items"]:
            projects.append(render_project(item, counter))
            counter += 1
        sections.append(f"""
    <section class="content-section" id="{esc(section["id"])}">
      <div class="section-head">
        <div>
          <p class="eyebrow">{esc(section["eyebrow"])}</p>
          <h2>{esc(section["title"])}</h2>
        </div>
        <p>{esc(section["description"])}</p>
      </div>
      <ol class="project-list">{"".join(projects)}
      </ol>
    </section>""")

    body = f"""
  <header class="masthead">
    <div class="wrap">
      <div class="seal" aria-hidden="true">数<br>学</div>
      <p class="kicker">Personal mathematics archive</p>
      <h1>{esc(site["title"])}</h1>
      <p class="tagline">{esc(site["tagline"])}</p>
      <p class="owner">{esc(site["owner"])}</p>
    </div>
  </header>
  <main class="wrap">
    <section class="intro" id="profile">
      <h2>{esc(profile["heading"])}</h2>
      <div class="intro-copy">
        {profile_body}
        {render_links(profile["links"])}
      </div>
    </section>
    {"".join(sections)}
  </main>
  <footer><div class="wrap">{esc(site["footer"])}</div></footer>"""
    return page(site["title"], site["description"], body)


def build_placeholder(item: dict, section: dict, site: dict) -> str:
    kind_label = "交互数学内容" if section["kind"] == "interactive" else "数学功法"
    format_note = (
        "这里将放置一个独立运行的交互式网页项目。"
        if section["kind"] == "interactive"
        else "这里将发布静态网页或 PDF 内容。"
    )
    body = f"""
  <main class="placeholder-main wrap">
    <a class="back" href="../index.html">← 返回主页</a>
    <article class="placeholder-card">
      <p class="eyebrow">{esc(kind_label)}</p>
      <h1>{esc(item["title"])}</h1>
      <p class="description">{esc(item["description"])}</p>
      <p class="notice"><strong>制作中</strong> · {esc(format_note)}</p>
      <p>{render_video(item["video"])}</p>
    </article>
  </main>
  <footer><div class="wrap">{esc(site["footer"])}</div></footer>"""
    return page(f'{item["title"]} — {site["title"]}', item["description"], body)


def main() -> None:
    document = yaml.safe_load(DATA.read_text(encoding="utf-8"))

    if SITE.exists():
        shutil.rmtree(SITE)
    SITE.mkdir(parents=True)

    if STATIC.exists():
        shutil.copytree(STATIC, SITE, dirs_exist_ok=True)

    (SITE / ".nojekyll").write_text("", encoding="utf-8")
    (SITE / "index.html").write_text(
        build_home(document), encoding="utf-8", newline="\n"
    )

    for section in document["sections"]:
        for item in section["items"]:
            destination = SITE / item["url"]
            destination.parent.mkdir(parents=True, exist_ok=True)
            if item["status"] == "building":
                destination.write_text(
                    build_placeholder(item, section, document["site"]),
                    encoding="utf-8",
                    newline="\n",
                )

    print(
        f"Built homepage and "
        f"{sum(len(section['items']) for section in document['sections'])} "
        f"project pages into {SITE}"
    )


if __name__ == "__main__":
    main()
