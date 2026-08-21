#!/usr/bin/env python3
"""Render data/site.yaml to a small static site."""

from __future__ import annotations

import html
import json
import shutil
import subprocess
import sys
from pathlib import Path

import yaml


ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data" / "site.yaml"
BILI_SNAPSHOT = ROOT / "data" / "bilibili.json"
STATIC = ROOT / "static"
SITE = ROOT / "site"
APPS = ROOT / "apps"
NESTED_APPS = (
    {
        "name": "geometric-discovery-workbench",
        "url": "apps/geometric-discovery-workbench",
    },
)

CSS = r"""
:root, html[data-theme="light"] {
  color-scheme: light;
  --paper: #eef3f3;
  --paper-deep: #e1ebeb;
  --ink: #1b2c2a;
  --muted: #5c706d;
  --line: #c5d4d3;
  --accent: #2f7a6c;
  --accent-deep: #21584e;
  --card: rgba(247, 252, 251, .82);
  --wash: rgba(47, 122, 108, .09);
  --shadow: rgba(27, 55, 52, .08);
}
html[data-theme="dark"] {
  color-scheme: dark;
  --paper: #121918;
  --paper-deep: #18211f;
  --ink: #dce7e4;
  --muted: #9aada8;
  --line: #2c3c39;
  --accent: #7ec9b6;
  --accent-deep: #a6ddd0;
  --card: rgba(24, 33, 31, .84);
  --wash: rgba(126, 201, 182, .1);
  --shadow: rgba(0, 0, 0, .28);
}
html[data-theme="system"] { color-scheme: light dark; }
@media (prefers-color-scheme: dark) {
  html[data-theme="system"] {
    color-scheme: dark;
    --paper: #121918;
    --paper-deep: #18211f;
    --ink: #dce7e4;
    --muted: #9aada8;
    --line: #2c3c39;
    --accent: #7ec9b6;
    --accent-deep: #a6ddd0;
    --card: rgba(24, 33, 31, .84);
    --wash: rgba(126, 201, 182, .1);
    --shadow: rgba(0, 0, 0, .28);
  }
}
* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body {
  margin: 0;
  color: var(--ink);
  background:
    radial-gradient(circle at 18% 8%, var(--wash), transparent 28rem),
    repeating-linear-gradient(0deg, transparent 0 27px, color-mix(in srgb, var(--ink) 3.5%, transparent) 28px),
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
.masthead-tools {
  position: absolute;
  top: 1.15rem;
  right: 0;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: .7rem;
}
.theme-switch {
  display: inline-flex;
  padding: 2px;
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 999px;
  box-shadow: 0 10px 28px var(--shadow);
}
.theme-switch button {
  margin: 0;
  padding: .28rem .62rem;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--muted);
  font-family: Georgia, "Times New Roman", serif;
  font-size: .68rem;
  font-weight: 700;
  letter-spacing: .06em;
  line-height: 1.2;
  cursor: pointer;
  white-space: nowrap;
}
.theme-switch button[aria-pressed="true"] {
  color: var(--paper);
  background: var(--accent);
}
.theme-switch button:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
.seal {
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
.bili-spotlight {
  display: flex;
  gap: clamp(1.8rem, 6vw, 3.2rem);
  width: fit-content;
  margin-top: 1.8rem;
  padding: 1.05rem 1.35rem 1.15rem;
  color: inherit;
  text-decoration: none;
  background: var(--card);
  border: 1px solid color-mix(in srgb, var(--accent) 34%, var(--line));
  box-shadow: 0 22px 60px var(--shadow);
}
.bili-metric strong {
  display: block;
  color: var(--accent);
  font-size: clamp(2.8rem, 9vw, 4.6rem);
  font-weight: 600;
  letter-spacing: -.07em;
  line-height: .92;
}
.bili-metric strong small {
  margin-left: .12em;
  font-size: .38em;
  letter-spacing: .08em;
}
.bili-metric em {
  display: block;
  margin-top: .48rem;
  color: var(--muted);
  font-family: Georgia, "Times New Roman", serif;
  font-size: .72rem;
  font-style: normal;
  font-weight: 700;
  letter-spacing: .22em;
}
.bili-spotlight:hover .bili-metric strong { color: var(--accent-deep); }
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
  color: var(--muted);
  background: transparent;
  border: 1px solid var(--line);
  border-radius: 999px;
  font-size: .68rem;
  font-weight: 700;
  letter-spacing: .08em;
  white-space: nowrap;
}
.status.available {
  color: var(--accent-deep);
  background: var(--wash);
  border-color: color-mix(in srgb, var(--accent) 28%, transparent);
}
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
.resource-link {
  display: inline-flex;
  align-items: center;
  gap: .28rem;
  color: var(--accent-deep);
  font-size: .74rem;
  font-weight: 600;
  text-decoration: none;
  white-space: nowrap;
}
.resource-link::before {
  content: "⬇";
  font-size: .7rem;
}
.resource-link:hover { text-decoration: underline; }
.cta-link {
  position: relative;
  z-index: 1;
  display: inline-flex;
  margin-top: 1.35rem;
  padding: .72rem 1.15rem;
  color: var(--paper);
  background: var(--accent);
  text-decoration: none;
  font-weight: 700;
  letter-spacing: .06em;
}
.cta-link:hover {
  color: var(--paper);
  background: var(--accent-deep);
}
.video-links {
  display: flex;
  flex-wrap: wrap;
  gap: .35rem .85rem;
  margin-top: .7rem;
}
.video-links .video-link {
  white-space: normal;
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
  .masthead { padding-top: 5.2rem; }
  .theme-switch button { padding: .26rem .46rem; font-size: .62rem; }
  .intro, .section-head { grid-template-columns: 1fr; gap: .8rem; }
  .project { grid-template-columns: 2.3rem 1fr; }
  .project-actions {
    grid-column: 2;
    flex-direction: row;
    flex-wrap: wrap;
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


THEME_BOOT = """
(function(){
  try {
    var t = localStorage.getItem("sintanmath-theme") || "system";
    if (t !== "light" && t !== "dark") t = "system";
    document.documentElement.dataset.theme = t;
  } catch (e) {
    document.documentElement.dataset.theme = "system";
  }
})();
"""

THEME_UI = """
(function(){
  function currentTheme() {
    var t = document.documentElement.dataset.theme;
    return t === "light" || t === "dark" ? t : "system";
  }
  function syncThemeButtons() {
    var t = currentTheme();
    document.querySelectorAll("[data-theme-value]").forEach(function(btn){
      btn.setAttribute("aria-pressed", String(btn.getAttribute("data-theme-value") === t));
    });
  }
  function setTheme(mode) {
    var value = mode === "light" || mode === "dark" ? mode : "system";
    document.documentElement.dataset.theme = value;
    try { localStorage.setItem("sintanmath-theme", value); } catch (e) {}
    syncThemeButtons();
  }
  document.querySelectorAll(".theme-switch").forEach(function(group){
    group.addEventListener("click", function(event){
      var btn = event.target.closest("[data-theme-value]");
      if (!btn) return;
      setTheme(btn.getAttribute("data-theme-value"));
    });
  });
  syncThemeButtons();
})();
"""

THEME_SWITCH = """
        <div class="theme-switch" role="radiogroup" aria-label="外观模式">
          <button type="button" data-theme-value="system">跟随系统</button>
          <button type="button" data-theme-value="light">亮色</button>
          <button type="button" data-theme-value="dark">暗色</button>
        </div>"""


def esc(value: object) -> str:
    return html.escape(str(value))


def page(title: str, description: str, body: str) -> str:
    return f"""<!doctype html>
<html lang="zh-CN" data-theme="system">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="{esc(description)}">
  <link rel="icon" href="/favicon.ico" sizes="any">
  <link rel="icon" type="image/png" href="/favicon.png">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  <title>{esc(title)}</title>
  <script>{THEME_BOOT}</script>
  <style>{CSS}</style>
</head>
<body>
{body}
<script>{THEME_UI}</script>
</body>
</html>
"""


def load_bilibili() -> dict | None:
    if not BILI_SNAPSHOT.exists():
        return None
    document = json.loads(BILI_SNAPSHOT.read_text(encoding="utf-8"))
    if not isinstance(document, dict) or "follower" not in document:
        return None
    return document


def render_metric(label: str, value: object, fallback: object | None = None) -> str:
    text = str(value or fallback or "")
    if not text:
        return ""
    if " " in text:
        number, unit = text.rsplit(" ", 1)
        number_html = f"{esc(number)}<small>{esc(unit)}</small>"
    else:
        number_html = esc(text)
    return (
        f'<span class="bili-metric">'
        f"<strong>{number_html}</strong>"
        f"<em>{esc(label)}</em>"
        f"</span>"
    )


def render_bilibili(stats: dict | None) -> str:
    if not stats:
        return ""
    follower = render_metric("粉丝", stats.get("follower_label"), stats.get("follower"))
    play = render_metric("总播放", stats.get("play_label"), None)
    if not follower:
        return ""
    fetched = stats.get("fetched_at", "")
    title = f' title="更新于 {esc(fetched[:10])}"' if fetched else ""
    return (
        f'<a class="bili-spotlight" href="{esc(stats["space_url"])}"{title}>'
        f"{follower}{play}</a>"
    )


def refresh_bilibili_snapshot() -> None:
    script = ROOT / "scripts" / "fetch_bilibili.py"
    try:
        subprocess.run([sys.executable, str(script)], check=True, timeout=90)
    except (OSError, subprocess.SubprocessError):
        pass


def render_links(links: list[dict]) -> str:
    if not links:
        return '<p class="owner">相关链接待补充。</p>'
    items = "".join(
        f'<li><a href="{esc(link["url"])}">{esc(link["label"])}</a></li>'
        for link in links
    )
    return f'<ul class="link-list">{items}</ul>'


def is_external_url(url: str) -> bool:
    return url.startswith(("http://", "https://"))


def render_item_anchor(title: str, url: str) -> str:
    attrs = f'href="{esc(url)}"'
    if is_external_url(url):
        attrs += ' target="_blank" rel="noopener noreferrer"'
    return f"<h3><a {attrs}>{esc(title)}</a></h3>"


def render_outbound_anchor(class_name: str, label: str, url: str) -> str:
    return (
        f'<a class="{esc(class_name)}" href="{esc(url)}" '
        f'target="_blank" rel="noopener noreferrer">'
        f'{esc(label)}</a>'
    )


def render_video_anchor(label: str, url: str) -> str:
    return render_outbound_anchor("video-link", label, url)


def render_resource(resource: dict | None, class_name: str = "resource-link") -> str:
    if not resource:
        return ""
    return render_outbound_anchor(class_name, resource["label"], resource["url"])


def render_video(video: dict) -> str:
    if video["status"] != "available":
        return '<span class="video-link pending">视频待补充</span>'
    links = video.get("links")
    if links:
        items = "".join(render_video_anchor(link["label"], link["url"]) for link in links)
        return f'<div class="video-links">{items}</div>'
    return render_video_anchor(video["label"], video["url"])


def render_project(item: dict, index: int) -> str:
    status = item["status"]
    label = "已发布" if status == "available" else "制作中"
    video = item["video"]
    video_html = render_video(video)
    extra = ""
    action_video = video_html
    if video.get("links"):
        extra = video_html
        action_video = ""
    resource_html = render_resource(item.get("resource"))
    extras = []
    if extra:
        extras.append(extra)
    if resource_html:
        extras.append(f'<div class="video-links">{resource_html}</div>')
    extra_html = "".join(extras)
    return f"""
      <li class="project">
        <span class="index">{index:02d}</span>
        <div>
          {render_item_anchor(item["title"], item["url"])}
          <p>{esc(item["description"])}</p>
          {extra_html}
        </div>
        <div class="project-actions">
          <span class="status {esc(status)}">{label}</span>
          {action_video}
        </div>
      </li>"""


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
      <div class="masthead-tools">
        {THEME_SWITCH}
        <div class="seal" aria-hidden="true">数<br>学</div>
      </div>
      <p class="kicker">Personal mathematics archive</p>
      <h1>{esc(site["title"])}</h1>
      <p class="tagline">{esc(site["tagline"])}</p>
      <p class="owner">{esc(site["owner"])}</p>
      {render_bilibili(load_bilibili())}
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
    kind_label = "数学法器" if section["kind"] == "interactive" else "数学功法"
    resource = item.get("resource")
    if resource:
        format_note = "网页讲义仍在整理。配套课件已放在夸克网盘，点击即可打开。"
    elif section["kind"] == "interactive":
        format_note = "这里将放置一个独立运行的交互式网页项目。"
    else:
        format_note = "这里将发布静态网页或 PDF 内容。"
    resource_html = render_resource(resource, "cta-link")
    body = f"""
  <main class="placeholder-main wrap">
    <a class="back" href="../index.html">← 返回主页</a>
    <article class="placeholder-card">
      <p class="eyebrow">{esc(kind_label)}</p>
      <h1>{esc(item["title"])}</h1>
      <p class="description">{esc(item["description"])}</p>
      <p class="notice"><strong>制作中</strong> · {esc(format_note)}</p>
      {resource_html}
      <p>{render_video(item["video"])}</p>
    </article>
  </main>
  <footer><div class="wrap">{esc(site["footer"])}</div></footer>"""
    return page(f'{item["title"]} — {site["title"]}', item["description"], body)


def build_nested_app(name: str, url: str) -> None:
    app = APPS / name
    if not app.exists():
        raise SystemExit(f"Missing nested app: {app}")

    if not (app / "node_modules").exists():
        subprocess.run(["npm", "ci"], cwd=app, check=True)
    subprocess.run(["npm", "test"], cwd=app, check=True)
    subprocess.run(["npm", "run", "build"], cwd=app, check=True)

    destination = SITE / url
    if destination.exists():
        shutil.rmtree(destination)
    shutil.copytree(app / "dist", destination)


def main() -> None:
    refresh_bilibili_snapshot()
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
            if is_external_url(item["url"]):
                continue
            destination = SITE / item["url"]
            destination.parent.mkdir(parents=True, exist_ok=True)
            if item["status"] == "building":
                destination.write_text(
                    build_placeholder(item, section, document["site"]),
                    encoding="utf-8",
                    newline="\n",
                )

    for app in NESTED_APPS:
        build_nested_app(app["name"], app["url"])

    print(
        f"Built homepage and "
        f"{sum(len(section['items']) for section in document['sections'])} "
        f"project pages into {SITE}"
    )


if __name__ == "__main__":
    main()
