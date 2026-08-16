# EML 单算子常数构造器

一个纯前端的交互小工具。基于论文 *All elementary functions from a single operator* 中的 EML 算子：

\[
\mathrm{eml}(x,\, y) = e^{x} - \ln y
\]

从常数 `1` 出发，通过不断拖动数字到 `x`、`y` 槽并点击「运算」，构造出 `e`, `e^e`, `0`, `e − ln 0`, … 等新常数。

## 特性

- 内部用**符号表达式树**表示所有数字，**只保留精确值**，不做浮点近似。
- 基本化简规则：
  - `exp(0) → 1`，`exp(1) → e`
  - `ln(1) → 0`，`ln(e) → 1`，`ln(0) → ln 0`（保留符号，表示 −∞）
  - `exp(ln y) → y`，`ln(exp x) → x`
  - `a − 0 → a`，`a − a → 0`
- 每个数字都在一个独立的矩形卡片里，**用 KaTeX 渲染** LaTeX。
- HTML5 拖放；单击已填槽位即可清除。
- 新出现的数字会自动加入数字区，并伴有弹出动画。

本页已嵌入仙童数学主页的「eml函数」条目。线上入口：

<https://sintanmath.github.io/apps/eml-function/>

## 运行

直接双击 `index.html`，或从主页仓库根目录构建后访问：

```bash
# 在 personal-math-homepage 中
.venv/bin/python scripts/build.py
.venv/bin/python -m http.server 8000 -d site
# 访问 http://localhost:8000/apps/eml-function/
```

## 测试用例

| 操作 | 结果 |
| --- | --- |
| `eml(1, 1)` | `e` |
| `eml(e, 1)` | `e^e` |
| `eml(1, e^e)` | `0` |
| `eml(1, 0)` | `e − ln 0` |

在浏览器控制台里运行 `__emlSelfTest()` 可一次性看到四个结果的 LaTeX 源码。

## 文件

- `index.html` — 页面结构
- `style.css`  — 样式
- `app.js`     — 表达式、化简、渲染、交互
