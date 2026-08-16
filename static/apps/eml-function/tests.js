// tests.js：加载 tests.json 并逐条调用 EML.emlOp 验证输出
(function () {
  const $ = (id) => document.getElementById(id);

  function renderKatex(el, latex) {
    if (window.katex) {
      try {
        window.katex.render(latex, el, { throwOnError: false, displayMode: false });
        return;
      } catch (_) {}
    }
    el.textContent = latex;
  }

  // 把 JSON 里用 type 描述的表达式树转换成 app.js 里的节点对象。
  // 结构已经对齐，直接深拷贝即可；这里顺便做一次严格校验。
  function parseExpr(node, path = 'expr') {
    if (!node || typeof node !== 'object' || !node.type) {
      throw new Error(`${path} 缺少 type 字段`);
    }
    switch (node.type) {
      case 'num':
        if (typeof node.value !== 'number') {
          throw new Error(`${path}.value 必须为数字`);
        }
        return window.EML.Num(node.value);
      case 'e':   return window.EML.E();
      case 'pi':  return window.EML.Pi();
      case 'i':   return window.EML.I();
      case 'ln0': return window.EML.Ln0();
      case 'exp': return window.EML.Exp(parseExpr(node.x, path + '.x'));
      case 'ln':  return window.EML.Ln(parseExpr(node.x,  path + '.x'));
      case 'neg': return window.EML.Neg(parseExpr(node.a, path + '.a'));
      case 'sub': return window.EML.Sub(
        parseExpr(node.a, path + '.a'),
        parseExpr(node.b, path + '.b')
      );
      case 'div': return window.EML.Div(
        parseExpr(node.a, path + '.a'),
        parseExpr(node.b, path + '.b')
      );
      case 'mul': return window.EML.Mul(
        parseExpr(node.a, path + '.a'),
        parseExpr(node.b, path + '.b')
      );
      case 'add': return window.EML.Add(
        parseExpr(node.a, path + '.a'),
        parseExpr(node.b, path + '.b')
      );
      case 'pow': return window.EML.Pow(
        parseExpr(node.a, path + '.a'),
        parseExpr(node.b, path + '.b')
      );
      case 'sin': return window.EML.Sin(parseExpr(node.x, path + '.x'));
      case 'cos': return window.EML.Cos(parseExpr(node.x, path + '.x'));
      default:
        throw new Error(`${path} 未知 type: ${node.type}`);
    }
  }

  // LaTeX 比较：忽略纯空白差异
  function canon(s) {
    return String(s).replace(/\s+/g, '');
  }

  async function loadSimplifyRules() {
    try {
      const resp = await fetch('simplifications.json', { cache: 'no-cache' });
      if (!resp.ok) return [];
      const data = await resp.json();
      if (!Array.isArray(data.rules)) return [];
      return data.rules.map((r) => ({
        name: r.name,
        from: parseExpr(r.from, `rules[${r.name}].from`),
        to:   parseExpr(r.to,   `rules[${r.name}].to`),
      }));
    } catch (_) {
      return [];
    }
  }

  async function main() {
    let config;
    try {
      const resp = await fetch('tests.json', { cache: 'no-cache' });
      if (!resp.ok) throw new Error(resp.statusText);
      config = await resp.json();
    } catch (err) {
      $('numBox').textContent = '加载 tests.json 失败';
      $('tbody').innerHTML = `<tr><td colspan="5" style="color:#ff3b30;padding:20px;">${err.message}</td></tr>`;
      return;
    }

    const rules = await loadSimplifyRules();

    const tbody = $('tbody');
    tbody.innerHTML = '';

    let passed = 0;
    config.tests.forEach((t, i) => {
      const tr = document.createElement('tr');

      let actualLatex = '';
      let pass = false;
      let errMsg = '';
      const kind = t.kind || 'eml';
      try {
        if (kind === 'toLatex') {
          const e = parseExpr(t.expr, `tests[${i}].expr`);
          actualLatex = window.EML.toLatex(e);
        } else if (kind === 'simplify') {
          const e = parseExpr(t.expr, `tests[${i}].expr`);
          const result = window.EML.deepSimplify(e, rules);
          actualLatex = window.EML.toLatex(result);
        } else {
          const x = parseExpr(t.x, `tests[${i}].x`);
          const y = parseExpr(t.y, `tests[${i}].y`);
          const result = window.EML.emlOp(x, y);
          actualLatex = window.EML.toLatex(result);
        }
        pass = canon(actualLatex) === canon(t.expectedLatex);
      } catch (err) {
        errMsg = err.message;
      }
      if (pass) passed++;
      tr.className = pass ? 'pass-row' : 'fail-row';

      const numTd = document.createElement('td');
      numTd.className = 'num-col';
      numTd.textContent = String(i + 1);

      const nameTd = document.createElement('td');
      nameTd.className = 'name-col';
      const title = document.createElement('div');
      title.className = 'title';
      title.textContent = t.name;
      nameTd.appendChild(title);
      if (t.rationale) {
        const why = document.createElement('div');
        why.className = 'why';
        why.textContent = t.rationale;
        nameTd.appendChild(why);
      }

      const expTd = document.createElement('td');
      expTd.className = 'latex-cell';
      renderKatex(expTd, t.expectedLatex);

      const actTd = document.createElement('td');
      actTd.className = 'latex-cell' + (pass ? '' : ' fail-cell');
      if (errMsg) {
        actTd.textContent = '⚠ ' + errMsg;
      } else {
        renderKatex(actTd, actualLatex);
        if (!pass) {
          const diff = document.createElement('div');
          diff.className = 'diff';
          diff.textContent = actualLatex;
          actTd.appendChild(diff);
        }
      }

      const statusTd = document.createElement('td');
      statusTd.className = 'status';
      statusTd.textContent = pass ? '✓' : '✗';

      tr.appendChild(numTd);
      tr.appendChild(nameTd);
      tr.appendChild(expTd);
      tr.appendChild(actTd);
      tr.appendChild(statusTd);
      tbody.appendChild(tr);
    });

    const total = config.tests.length;
    const box = $('numBox');
    box.innerHTML = `<span class="${passed === total ? 'pass' : 'fail'}">${passed}</span> / ${total} 通过`;
    document.title = `EML 测试 ${passed}/${total}`;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', main);
  } else {
    main();
  }
})();
