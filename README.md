# 我的数学主页

一个受 Terence Tao `tao-web` 启发的静态个人主页。

线上地址：<https://sintanmath.github.io/>

推送到 `main` 后，GitHub Actions 会校验、构建并发布 `site/`。

## 架构

- `data/site.yaml`：唯一内容源
- `data/bilibili.yaml`：B 站账号配置
- `data/bilibili.json`：粉丝数等公开数据快照
- `schema/site.schema.json`：内容结构约束
- `scripts/validate.py`：构建前校验
- `scripts/fetch_bilibili.py`：拉取 B 站公开数据
- `scripts/build.py`：将 YAML 渲染成静态 HTML
- `static/`：原样复制到输出目录的资源
- `apps/`：需要单独构建的交互项目源码
- `site/`：生成结果，不要直接编辑

## 本地使用

```bash
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/python scripts/validate.py
.venv/bin/python scripts/build.py
.venv/bin/python -m http.server 8000 -d site
```

构建时会尝试刷新 B 站粉丝数和总播放量；也可以单独运行：

```bash
.venv/bin/python scripts/fetch_bilibili.py
```

构建交互应用还需要 Node.js 20 或更高版本。线上站点每天会再拉一次公开数据。

然后打开 `http://localhost:8000`。

## 更新内容

日常只编辑 `data/site.yaml`：

- 完善个人介绍和链接；
- 项目完成后，将对应条目的 `status` 改成 `available`；
- 将 `url` 指向项目入口 HTML 或 PDF。
- 添加视频时，将项目的 `video.status` 改成 `available`，并填写 B 站
  `video.url`；未填写时主页会显示“视频待补充”。

交互项目建议放在 `static/apps/<项目名>/`，需要打包的应用放在
`apps/<项目名>/`；数学功法网页或 PDF 建议放在 `static/works/<项目名>/`。
构建时 `static/` 会被完整复制到 `site/`，`apps/` 中的项目会先构建再写入
对应入口。
