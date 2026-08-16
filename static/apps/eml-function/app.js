/*
  EML 单算子常数构造器
  eml(x, y) = exp(x) - ln(y)
  内部使用符号表达式树 + 精确化简，避免落入浮点近似。
*/

// ===== 表达式构造器 =====
const Num = (n)    => ({ type: 'num', value: n });
const E   = ()     => ({ type: 'e' });
const Pi  = ()     => ({ type: 'pi' });
const I   = ()     => ({ type: 'i' });
const Exp = (x)    => ({ type: 'exp', x });
const Ln  = (x)    => ({ type: 'ln',  x });
const Sub = (a, b) => ({ type: 'sub', a, b });
const Div = (a, b) => ({ type: 'div', a, b });
const Mul = (a, b) => ({ type: 'mul', a, b });
const Add = (a, b) => ({ type: 'add', a, b });
const Pow = (a, b) => ({ type: 'pow', a, b });
const Neg = (a)    => ({ type: 'neg', a });
const Sin = (x)    => ({ type: 'sin', x });
const Cos = (x)    => ({ type: 'cos', x });
const Ln0 = ()     => ({ type: 'ln0' }); // ln(0) = -∞，保留为符号

// ===== 结构相等 =====
function eq(a, b) {
  if (a.type !== b.type) return false;
  switch (a.type) {
    case 'num': return a.value === b.value;
    case 'e':
    case 'pi':
    case 'i':
    case 'ln0': return true;
    case 'exp':
    case 'ln':
    case 'sin':
    case 'cos': return eq(a.x, b.x);
    case 'neg': return eq(a.a, b.a);
    case 'sub':
    case 'div':
    case 'mul':
    case 'add':
    case 'pow': return eq(a.a, b.a) && eq(a.b, b.b);
  }
  return false;
}

// ===== 符号化简 =====
// 从任意表达式中抽取一个 i 因子。
//   - 支持 i / mul(i, r) / mul(r, i) / neg(...) 等多种形式
//   - 成功返回 { sign: +1|-1, rest }；rest 是去掉 i 因子后的剩余部分（可能是 Num(1)）
//   - 失败返回 null
function extractIFactor(expr) {
  if (expr.type === 'i') return { sign: 1, rest: Num(1) };
  if (expr.type === 'neg') {
    const s = extractIFactor(expr.a);
    if (!s) return null;
    return { sign: -s.sign, rest: s.rest };
  }
  if (expr.type === 'mul') {
    if (expr.a.type === 'i') return { sign: 1, rest: expr.b };
    if (expr.b.type === 'i') return { sign: 1, rest: expr.a };
    const la = extractIFactor(expr.a);
    if (la) return { sign: la.sign, rest: Mul(la.rest, expr.b) };
    const lb = extractIFactor(expr.b);
    if (lb) return { sign: lb.sign, rest: Mul(expr.a, lb.rest) };
  }
  return null;
}

// div 约分：返回新的简化表达式，或 null 表示不能约分
function divCancel(a, b) {
  if (eq(a, b)) return Num(1);
  // 分子是乘积，分母是单项
  if (a.type === 'mul') {
    if (eq(a.a, b)) return a.b;
    if (eq(a.b, b)) return a.a;
  }
  // 分子是单项，分母是乘积
  if (b.type === 'mul') {
    if (eq(a, b.a)) return Div(Num(1), b.b);
    if (eq(a, b.b)) return Div(Num(1), b.a);
  }
  // 双方都是乘积：4 种对角搭配
  if (a.type === 'mul' && b.type === 'mul') {
    if (eq(a.a, b.a)) return Div(a.b, b.b);
    if (eq(a.a, b.b)) return Div(a.b, b.a);
    if (eq(a.b, b.a)) return Div(a.a, b.b);
    if (eq(a.b, b.b)) return Div(a.a, b.a);
  }
  return null;
}

// opts.euler: 为 true 时允许 exp(i·θ) → cos θ + i sin θ 的欧拉展开；
// 默认 true（deepSimplify / 化简菜单走的路径）。
// 对于"eml 计算"这种"只做最朴素化简"的路径，传 { euler: false }，
// 这样 eml(i, 1) 会停在 e^i 而不是 cos 1 + i sin 1。
function simplify(expr, opts) {
  const o = opts || {};
  if (o.euler === undefined) o.euler = true;
  switch (expr.type) {
    case 'exp': {
      const x = simplify(expr.x, o);
      if (x.type === 'num' && x.value === 0) return Num(1);
      if (x.type === 'num' && x.value === 1) return E();
      // exp(-n) = 1 / exp(n)
      if (x.type === 'num' && x.value < 0) {
        return simplify(Div(Num(1), Exp(Num(-x.value))), o);
      }
      if (x.type === 'ln')  return x.x;                // exp(ln y) = y
      if (x.type === 'ln0') return Num(0);             // exp(ln 0) = exp(-∞) = 0
      // 欧拉公式：exp(i·θ) = cos θ + i sin θ；exp(-i·θ) = cos θ - i sin θ
      // 仅在 opts.euler 为 true 时展开，保证 eml 计算得到的 e^i 保持为 e^i。
      if (o.euler) {
        const iFac = extractIFactor(x);
        if (iFac) {
          const theta = simplify(iFac.rest, o);
          const cosPart = simplify(Cos(theta), o);
          const sinPart = simplify(Mul(I(), Sin(theta)), o);
          return iFac.sign > 0
            ? simplify(Add(cosPart, sinPart), o)
            : simplify(Sub(cosPart, sinPart), o);
        }
      }
      // exp(ln(c) / b) = c^{1/b} —— 用于 √ 等根式的识别
      if (x.type === 'div' && x.a.type === 'ln') {
        return simplify(Pow(x.a.x, Div(Num(1), x.b)), o);
      }
      if (x.type === 'neg') {
        // exp(-a) → 1/exp(a) 仅在内层 exp(a) 能化简到"不再是 exp"时才触发
        // 这样 exp(-ln 2) = 1/2（内层 exp(ln 2) = 2，已不再是 exp），
        // 而 exp(-i) 保持为 e^{-i}（内层 exp(i) 依然是 exp，不强行套壳）。
        const innerExp = simplify(Exp(x.a), o);
        if (innerExp.type !== 'exp') {
          return simplify(Div(Num(1), innerExp), o);
        }
        return Exp(x);
      }
      if (x.type === 'sub') {                          // exp(a - b) = e^a / e^b
        return simplify(Div(Exp(x.a), Exp(x.b)), o);
      }
      return Exp(x);
    }
    case 'ln': {
      const x = simplify(expr.x, o);
      if (x.type === 'num' && x.value === 1) return Num(0);
      if (x.type === 'num' && x.value === 0) return Ln0();
      if (x.type === 'e')   return Num(1);
      if (x.type === 'exp') return x.x;                // ln(exp x) = x
      if (x.type === 'div') {                          // ln(a / b) = ln a - ln b
        return simplify(Sub(Ln(x.a), Ln(x.b)), o);
      }
      // ln(a^k) = k * ln a —— 我们没有乘法节点，所以只在 k=Div(1,n) 时回退
      if (x.type === 'pow' && x.b.type === 'div'
          && x.b.a.type === 'num' && x.b.a.value === 1) {
        // ln(c^{1/n}) = ln(c) / n
        return simplify(Div(Ln(x.a), x.b.b), o);
      }
      return Ln(x);
    }
    case 'sin': {
      const x = simplify(expr.x, o);
      if (x.type === 'num' && x.value === 0) return Num(0);
      if (x.type === 'pi') return Num(0);
      // sin 奇函数：仅在允许欧拉类展开时自动折叠；否则留给"sin 奇函数"菜单项
      if (o.euler && x.type === 'neg') return simplify(Neg(Sin(x.a)), o);
      if (o.euler && x.type === 'num' && x.value < 0) return simplify(Neg(Sin(Num(-x.value))), o);
      return Sin(x);
    }
    case 'cos': {
      const x = simplify(expr.x, o);
      if (x.type === 'num' && x.value === 0) return Num(1);
      if (x.type === 'pi') return Num(-1);
      // cos 偶函数：同上
      if (o.euler && x.type === 'neg') return simplify(Cos(x.a), o);
      if (o.euler && x.type === 'num' && x.value < 0) return simplify(Cos(Num(-x.value)), o);
      return Cos(x);
    }
    case 'sub': {
      const a = simplify(expr.a, o);
      const b = simplify(expr.b, o);
      if (b.type === 'num' && b.value === 0) return a;
      if (a.type === 'num' && b.type === 'num') return Num(a.value - b.value);
      if (eq(a, b)) return Num(0);
      // 0 - b  →  -b
      if (a.type === 'num' && a.value === 0) return simplify(Neg(b), o);
      // a - (-b)  →  a + b
      if (b.type === 'neg') return simplify(Add(a, b.a), o);
      // a - (b - c)，当 a == b 时 → c
      if (b.type === 'sub' && eq(a, b.a)) return b.b;
      // (p + q) - (p - q) → 2q  （欧拉展开后合并虚部）
      if (a.type === 'add' && b.type === 'sub'
          && eq(a.a, b.a) && eq(a.b, b.b)) {
        return simplify(Mul(Num(2), a.b), o);
      }
      // (p - q) - (p + q) → -2q
      if (a.type === 'sub' && b.type === 'add'
          && eq(a.a, b.a) && eq(a.b, b.b)) {
        return simplify(Neg(Mul(Num(2), a.b)), o);
      }
      return Sub(a, b);
    }
    case 'add': {
      const a = simplify(expr.a, o);
      const b = simplify(expr.b, o);
      if (a.type === 'num' && a.value === 0) return b;
      if (b.type === 'num' && b.value === 0) return a;
      if (a.type === 'num' && b.type === 'num') return Num(a.value + b.value);
      // a + (-b) → a - b
      if (b.type === 'neg') return simplify(Sub(a, b.a), o);
      // (-a) + b → b - a
      if (a.type === 'neg') return simplify(Sub(b, a.a), o);
      if (eq(a, b)) return simplify(Mul(Num(2), a), o);
      // (p + q) + (p - q) → 2p
      if (a.type === 'add' && b.type === 'sub'
          && eq(a.a, b.a) && eq(a.b, b.b)) {
        return simplify(Mul(Num(2), a.a), o);
      }
      // (p - q) + (p + q) → 2p
      if (a.type === 'sub' && b.type === 'add'
          && eq(a.a, b.a) && eq(a.b, b.b)) {
        return simplify(Mul(Num(2), a.a), o);
      }
      return Add(a, b);
    }
    case 'div': {
      const a = simplify(expr.a, o);
      const b = simplify(expr.b, o);
      if (b.type === 'num' && b.value === 1) return a;
      const aIsZero = a.type === 'num' && a.value === 0;
      const bIsZero = b.type === 'num' && b.value === 0;
      if (eq(a, b) && !aIsZero && !bIsZero) return Num(1);
      if (aIsZero && !bIsZero) return Num(0);
      // 约分：公因子消去
      if (!bIsZero) {
        const cancelled = divCancel(a, b);
        if (cancelled) return simplify(cancelled, o);
      }
      // -a / b → -(a/b); a / -b → -(a/b)
      if (a.type === 'neg') return simplify(Neg(Div(a.a, b)), o);
      if (b.type === 'neg') return simplify(Neg(Div(a, b.a)), o);
      return Div(a, b);
    }
    case 'pow': {
      const a = simplify(expr.a, o);
      const b = simplify(expr.b, o);
      if (b.type === 'num' && b.value === 0) return Num(1);
      if (b.type === 'num' && b.value === 1) return a;
      if (a.type === 'num' && a.value === 1) return Num(1);
      if (a.type === 'num' && a.value === 0 && b.type === 'num' && b.value > 0) return Num(0);
      return Pow(a, b);
    }
    case 'mul': {
      const a = simplify(expr.a, o);
      const b = simplify(expr.b, o);
      if (a.type === 'num' && a.value === 0) return Num(0);
      if (b.type === 'num' && b.value === 0) return Num(0);
      if (a.type === 'num' && a.value === 1) return b;
      if (b.type === 'num' && b.value === 1) return a;
      if (a.type === 'num' && b.type === 'num') return Num(a.value * b.value);
      // -a · b = -(a·b)；a · -b = -(a·b)
      if (a.type === 'neg') return simplify(Neg(Mul(a.a, b)), o);
      if (b.type === 'neg') return simplify(Neg(Mul(a, b.a)), o);
      return Mul(a, b);
    }
    case 'neg': {
      const a = simplify(expr.a, o);
      if (a.type === 'num') return Num(-a.value);   // -(-2) 等整数直接翻符号
      if (a.type === 'neg') return a.a;             // -(-x) = x
      if (a.type === 'sub') return Sub(a.b, a.a);   // -(p-q) = q-p
      return Neg(a);
    }
    default:
      return expr;
  }
}

// "基础化简"：不展开欧拉公式，用于 eml 计算得到结果后直接展示。
function simplifyBasic(expr) {
  return simplify(expr, { euler: false });
}

function emlOp(x, y) {
  return simplifyBasic(buildRaw(x, y));
}

// 对表达式树做一次自顶向下的规则替换；任一子节点触发替换就返回替换后的整棵树。
function applyRulesOnce(expr, rules) {
  for (const rule of rules) {
    if (eq(expr, rule.from)) return rule.to;
  }
  switch (expr.type) {
    case 'exp': case 'ln': case 'sin': case 'cos': {
      const x2 = applyRulesOnce(expr.x, rules);
      return x2 === expr.x ? expr : { ...expr, x: x2 };
    }
    case 'neg': {
      const a2 = applyRulesOnce(expr.a, rules);
      return a2 === expr.a ? expr : { ...expr, a: a2 };
    }
    case 'sub': case 'add': case 'div': case 'mul': case 'pow': {
      const a2 = applyRulesOnce(expr.a, rules);
      if (a2 !== expr.a) return { ...expr, a: a2 };
      const b2 = applyRulesOnce(expr.b, rules);
      if (b2 !== expr.b) return { ...expr, b: b2 };
      return expr;
    }
  }
  return expr;
}

function applyRulesAll(expr, rules) {
  let cur = expr;
  for (let i = 0; i < 60; i++) {
    const next = applyRulesOnce(cur, rules);
    if (next === cur) break;
    cur = next;
  }
  return cur;
}

// 深度化简：反复（应用 JSON 规则 + 核心 simplify）直到不变。
// 既会吃掉"子树级"的 JSON 规则（例如 ln(-1)/2 里面的 ln(-1) → πi），
// 也会触发欧拉、约分等内建规则。
function deepSimplify(expr, rules) {
  const rs = rules || state.simplifyRules || [];
  let cur = simplify(expr);
  for (let i = 0; i < 30; i++) {
    const afterRules = applyRulesAll(cur, rs);
    const next = simplify(afterRules);
    if (eq(next, cur)) return cur;
    cur = next;
  }
  return cur;
}

// 代入但不化简，用于展示中间步骤 "e^x - ln y"
function buildRaw(x, y) {
  return Sub(Exp(x), Ln(y));
}

// ===== 命名化简规则 =====
// 每条规则: { id, label, match(expr) -> 替换表达式 | null }。
// 右键菜单会把"每条能把当前表达式改写成不同形态"的规则都列出来，让用户选。
// 这里只写「局部结构规则」：match 接收一个节点，决定是否把这个节点替换成什么。
// `rewriteAll` 会在整棵树上（post-order）尝试应用这条规则。
const SIMPLIFIERS = [
  {
    id: 'exp-neg',
    label: '负指数 (e^{-a} → 1/e^a)',
    match: (e) => (e.type === 'exp' && e.x.type === 'neg')
      ? Div(Num(1), Exp(e.x.a))
      : null,
  },
  {
    id: 'euler',
    label: '欧拉公式 (e^{iθ} → cos θ + i sin θ)',
    match: (e) => {
      if (e.type !== 'exp') return null;
      const iFac = extractIFactor(e.x);
      if (!iFac) return null;
      // 保留符号在 θ 里（例如 e^{-i} 展开为 cos(-1) + i sin(-1)），
      // 让后续的 cos 偶 / sin 奇 规则再把负号吃掉。
      const theta = iFac.sign > 0 ? iFac.rest : Neg(iFac.rest);
      return Add(Cos(theta), Mul(I(), Sin(theta)));
    },
  },
  {
    id: 'cos-even',
    label: 'cos 偶函数 (cos(-a) → cos a)',
    match: (e) => {
      if (e.type !== 'cos') return null;
      if (e.x.type === 'neg') return Cos(e.x.a);
      if (e.x.type === 'num' && e.x.value < 0) return Cos(Num(-e.x.value));
      return null;
    },
  },
  {
    id: 'sin-odd',
    label: 'sin 奇函数 (sin(-a) → -sin a)',
    match: (e) => {
      if (e.type !== 'sin') return null;
      if (e.x.type === 'neg') return Neg(Sin(e.x.a));
      if (e.x.type === 'num' && e.x.value < 0) return Neg(Sin(Num(-e.x.value)));
      return null;
    },
  },
];

// 对子节点做一次映射；如果全部没变就返回原表达式（保留引用相等）。
function mapChildren(expr, fn) {
  switch (expr.type) {
    case 'exp': case 'ln': case 'sin': case 'cos': {
      const x2 = fn(expr.x);
      return x2 === expr.x ? expr : { ...expr, x: x2 };
    }
    case 'neg': {
      const a2 = fn(expr.a);
      return a2 === expr.a ? expr : { ...expr, a: a2 };
    }
    case 'sub': case 'add': case 'div': case 'mul': case 'pow': {
      const a2 = fn(expr.a);
      const b2 = fn(expr.b);
      return (a2 === expr.a && b2 === expr.b) ? expr : { ...expr, a: a2, b: b2 };
    }
  }
  return expr;
}

// post-order 地在整棵树上尝试 matcher；每个位置匹配成功就替换。
function rewriteAll(expr, matcher) {
  const withChildren = mapChildren(expr, (c) => rewriteAll(c, matcher));
  const attempt = matcher(withChildren);
  return attempt !== null && attempt !== undefined ? attempt : withChildren;
}

// 对当前表达式应用一条命名规则：树上全范围替换 + 基础化简归一化
function applyNamedRule(expr, rule) {
  const after = rewriteAll(expr, rule.match);
  return simplify(after, { euler: false });
}

// 给定表达式，返回右键菜单可供选择的化简选项列表。
// - 每条内置命名规则（SIMPLIFIERS）；
// - simplifications.json 里的结构匹配规则；
// - 最后补一个"深度化简"作为一次性兜底（当它与上述任何一条的结果都不同时）。
// 重复结果会被去重。
function getSimplifyOptions(expr) {
  const options = [];
  const seen = new Map(); // key: 序列化后的表达式
  const addOption = (id, label, target) => {
    if (eq(target, expr)) return;
    const key = JSON.stringify(target);
    if (seen.has(key)) return;
    seen.set(key, true);
    options.push({ id, label, target });
  };

  for (const rule of SIMPLIFIERS) {
    addOption(rule.id, rule.label, applyNamedRule(expr, rule));
  }
  for (const jr of (state.simplifyRules || [])) {
    const target = simplify(
      rewriteAll(expr, (e) => eq(e, jr.from) ? jr.to : null),
      { euler: false }
    );
    addOption('json:' + jr.name, jr.name, target);
  }
  const deep = deepSimplify(expr);
  addOption('deep', '深度化简（一步到位）', deep);
  return options;
}

// ===== LaTeX 渲染 =====
function toLatex(expr) {
  switch (expr.type) {
    case 'num': return String(expr.value);
    case 'e':   return 'e';
    case 'pi':  return '\\pi';
    case 'i':   return 'i';
    case 'ln0': return '\\ln 0';
    case 'exp': return `e^{${toLatex(expr.x)}}`;
    case 'ln': {
      const inner = expr.x;
      // e/π/i 与非负整数不加括号；负数、mul、sub 等要加括号
      const bare = (inner.type === 'e' || inner.type === 'pi' || inner.type === 'i')
        || (inner.type === 'num' && inner.value >= 0);
      if (bare) return `\\ln ${toLatex(inner)}`;
      return `\\ln\\!\\left(${toLatex(inner)}\\right)`;
    }
    case 'sub': {
      const aLx = toLatex(expr.a);
      let bLx = toLatex(expr.b);
      // a - (b - c)、a - (b+c)、a - (-b) 都必须加括号
      if (expr.b.type === 'sub' || expr.b.type === 'add' || expr.b.type === 'neg') {
        bLx = `\\left(${bLx}\\right)`;
      }
      return `${aLx} - ${bLx}`;
    }
    case 'add': {
      const aLx = toLatex(expr.a);
      let bLx = toLatex(expr.b);
      if (expr.b.type === 'neg') bLx = `\\left(${bLx}\\right)`;
      return `${aLx} + ${bLx}`;
    }
    case 'sin': {
      const bare = (expr.x.type === 'num' && expr.x.value >= 0)
        || expr.x.type === 'e' || expr.x.type === 'pi' || expr.x.type === 'i';
      return bare
        ? `\\sin ${toLatex(expr.x)}`
        : `\\sin\\!\\left(${toLatex(expr.x)}\\right)`;
    }
    case 'cos': {
      const bare = (expr.x.type === 'num' && expr.x.value >= 0)
        || expr.x.type === 'e' || expr.x.type === 'pi' || expr.x.type === 'i';
      return bare
        ? `\\cos ${toLatex(expr.x)}`
        : `\\cos\\!\\left(${toLatex(expr.x)}\\right)`;
    }
    case 'div':
      return `\\dfrac{${toLatex(expr.a)}}{${toLatex(expr.b)}}`;
    case 'mul': {
      // 优先级低于乘法的外层必须加括号
      const wrap = (e, lx) =>
        (e.type === 'add' || e.type === 'sub' || e.type === 'neg')
          ? `\\left(${lx}\\right)` : lx;
      const aLx = wrap(expr.a, toLatex(expr.a));
      const bLx = wrap(expr.b, toLatex(expr.b));
      // 两边都是"贴着写也不歧义"的原子（字母常数、正整数、函数调用）时省略 \cdot
      const isAtom = (e) =>
        e.type === 'pi' || e.type === 'i' || e.type === 'e'
        || e.type === 'sin' || e.type === 'cos'
        || (e.type === 'num' && e.value >= 0);
      if (isAtom(expr.a) && isAtom(expr.b)) return `${aLx} ${bLx}`;
      return `${aLx} \\cdot ${bLx}`;
    }
    case 'pow': {
      const { a: base, b: ex } = expr;
      // 特殊形式：a^{1/n} → 根式
      if (ex.type === 'div'
          && ex.a.type === 'num' && ex.a.value === 1
          && ex.b.type === 'num' && Number.isInteger(ex.b.value) && ex.b.value >= 2) {
        if (ex.b.value === 2) return `\\sqrt{${toLatex(base)}}`;
        return `\\sqrt[${ex.b.value}]{${toLatex(base)}}`;
      }
      let baseLx = toLatex(base);
      if (base.type === 'sub' || base.type === 'add' || base.type === 'div'
          || base.type === 'neg' || base.type === 'pow' || base.type === 'exp'
          || base.type === 'mul') {
        baseLx = `\\left(${baseLx}\\right)`;
      }
      return `${baseLx}^{${toLatex(ex)}}`;
    }
    case 'neg': {
      const inner = expr.a;
      let innerLx = toLatex(inner);
      if (inner.type === 'sub' || inner.type === 'add' || inner.type === 'neg') {
        innerLx = `\\left(${innerLx}\\right)`;
      }
      return `-${innerLx}`;
    }
  }
  return '?';
}

// ===== 快捷函数注册表 =====
// 想加新快捷函数就在这里加一项。每个函数目前只接受一个参数 x。
// apply: (x) => 表达式  —— 结果会经过 simplify
// label: 函数名，UI 上显示
const QUICK_FNS = {
  ln: {
    label: '\\ln',                 // LaTeX 片段
    title: 'ln',                   // 可读名
    apply: (x) => simplifyBasic(Ln(x)),
  },
};

function emptyQFnState() {
  const q = {};
  for (const k of Object.keys(QUICK_FNS)) q[k] = { slot: null };
  return q;
}

// ===== 状态 =====
const INITIAL_POOL = () => [Num(1)];
const state = {
  pool: INITIAL_POOL(),
  slotX: null,
  slotY: null,
  result: null,
  busy: false,
  qFns: emptyQFnState(),
  simplifyRules: [],  // 从 simplifications.json 异步加载
  history: [],        // 已执行命令序列
  historyIdx: -1,     // 最近一条已生效命令的下标；-1 表示未执行过任何命令
};

// ===== 历史栈 =====
// 命令类型：
//   { t: 'drag',       slot: 'x'|'y', idx: N }     把 pool[N] 放进 eml 槽位
//   { t: 'clearSlot',  slot: 'x'|'y' }             清空单个 eml 槽位
//   { t: 'clearSlots' }                            清空两个 eml 槽位
//   { t: 'compute' }                               对当前 eml 槽位执行运算
//   { t: 'reset' }                                 数字区、所有槽位重置为初始
//   { t: 'qDrag',      fn, idx: N }                把 pool[N] 放进快捷函数 fn 的槽位
//   { t: 'qClearSlot', fn }                        清空快捷函数 fn 的槽位
//   { t: 'qCompute',   fn }                        执行快捷函数 fn
//   { t: 'simplify',   idx: N, targetExpr }        对 pool[N] 做深度化简，targetExpr 为化简结果
//   { t: 'simplify',   idx: N, ruleName }          （兼容旧格式）按单条命名规则化简
//   { t: 'remove',     idx: N }                    删除 pool[N]
function resetStateOnly() {
  state.pool = INITIAL_POOL();
  state.slotX = null;
  state.slotY = null;
  state.result = null;
  state.qFns = emptyQFnState();
}

function applyCommandInternal(cmd) {
  switch (cmd.t) {
    case 'drag': {
      if (cmd.idx < 0 || cmd.idx >= state.pool.length) return;
      const picked = state.pool[cmd.idx];
      if (cmd.slot === 'x') state.slotX = picked;
      else                  state.slotY = picked;
      state.result = null;
      return;
    }
    case 'clearSlot':
      if (cmd.slot === 'x') state.slotX = null;
      else                  state.slotY = null;
      state.result = null;
      return;
    case 'clearSlots':
      state.slotX = null;
      state.slotY = null;
      state.result = null;
      return;
    case 'compute': {
      if (!state.slotX || !state.slotY) return;
      const simplified = simplifyBasic(buildRaw(state.slotX, state.slotY));
      state.result = simplified;
      if (state.pool.findIndex(e => eq(e, simplified)) === -1) {
        state.pool.push(simplified);
      }
      return;
    }
    case 'reset':
      resetStateOnly();
      return;
    case 'qDrag': {
      const qf = state.qFns[cmd.fn];
      if (!qf) return;
      if (cmd.idx < 0 || cmd.idx >= state.pool.length) return;
      qf.slot = state.pool[cmd.idx];
      return;
    }
    case 'qClearSlot': {
      const qf = state.qFns[cmd.fn];
      if (!qf) return;
      qf.slot = null;
      return;
    }
    case 'qCompute': {
      const qf = state.qFns[cmd.fn];
      const def = QUICK_FNS[cmd.fn];
      if (!qf || !def || !qf.slot) return;
      const result = def.apply(qf.slot);
      if (state.pool.findIndex(e => eq(e, result)) === -1) {
        state.pool.push(result);
      }
      return;
    }
    case 'simplify': {
      if (cmd.idx < 0 || cmd.idx >= state.pool.length) return;
      // 新格式：目标表达式直接写在命令里（deepSimplify 的结果）
      if (cmd.targetExpr) {
        if (state.pool.findIndex(e => eq(e, cmd.targetExpr)) === -1) {
          state.pool.push(cmd.targetExpr);
        }
        return;
      }
      // 旧格式兼容：按 ruleName 单条规则化简
      const src = state.pool[cmd.idx];
      const rule = state.simplifyRules.find(r => r.name === cmd.ruleName);
      if (!rule) return;
      if (!eq(src, rule.from)) return;
      if (state.pool.findIndex(e => eq(e, rule.to)) === -1) {
        state.pool.push(rule.to);
      }
      return;
    }
    case 'remove': {
      if (cmd.idx < 0 || cmd.idx >= state.pool.length) return;
      state.pool.splice(cmd.idx, 1);
      return;
    }
  }
}

function pushCommand(cmd) {
  // 有 redo 队列就截断
  if (state.historyIdx < state.history.length - 1) {
    state.history = state.history.slice(0, state.historyIdx + 1);
  }
  state.history.push(cmd);
  state.historyIdx = state.history.length - 1;
  applyCommandInternal(cmd);
}

function replayHistory() {
  resetStateOnly();
  for (let i = 0; i <= state.historyIdx; i++) {
    applyCommandInternal(state.history[i]);
  }
}

function canUndo() { return state.historyIdx >= 0 && !state.busy; }
function canRedo() { return state.historyIdx < state.history.length - 1 && !state.busy; }

function undo() {
  if (!canUndo()) return;
  state.historyIdx--;
  replayHistory();
  renderAll();
}

function redo() {
  if (!canRedo()) return;
  state.historyIdx++;
  replayHistory();
  renderAll();
}

function clearHistory() {
  state.history = [];
  state.historyIdx = -1;
}

// ===== 存档 =====
function historyAsJson() {
  const payload = {
    app: 'eml-constants',
    version: 2,
    savedAt: new Date().toISOString(),
    history: state.history.slice(0, state.historyIdx + 1),
  };
  return JSON.stringify(payload, null, 2);
}

function saveHistory() {
  const jsonText = historyAsJson();
  // 同时显示到粘贴区，方便复制；即便浏览器屏蔽了下载也能 copy 走
  const ta = document.getElementById('pasteImportText');
  if (ta) ta.value = jsonText;
  const blob = new Blob([jsonText], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  a.href = url;
  a.download = `eml-history-${ts}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function loadHistoryFromText(text) {
  try {
    const payload = JSON.parse(text);
    if (!payload || !Array.isArray(payload.history)) {
      throw new Error('JSON 中找不到 history 数组');
    }
    for (const cmd of payload.history) {
      if (!cmd || typeof cmd.t !== 'string') throw new Error('history 中有异常命令');
    }
    state.history = payload.history;
    state.historyIdx = state.history.length - 1;
    replayHistory();
    renderAll();
    return true;
  } catch (err) {
    alert('导入失败：' + err.message);
    return false;
  }
}

function loadHistoryFromFile(file) {
  const reader = new FileReader();
  reader.onload = () => loadHistoryFromText(reader.result);
  reader.onerror = () => alert('读取文件失败');
  reader.readAsText(file);
}

// ===== DOM 渲染 =====
function kRender(latex, el) {
  try {
    // eslint-disable-next-line no-undef
    katex.render(latex, el, { throwOnError: false, displayMode: false });
  } catch (e) {
    el.textContent = latex;
  }
}

function renderFormulaDef() {
  const el = document.getElementById('formulaDef');
  if (!el) return;
  kRender('\\mathrm{eml}(x,\\, y) = e^{x} - \\ln y', el);
}

function renderPool(highlightIdx = -1) {
  const poolEl = document.getElementById('pool');
  if (!poolEl) return;
  poolEl.innerHTML = '';
  state.pool.forEach((expr, idx) => {
    const card = document.createElement('div');
    card.className = 'number-card';
    card.draggable = !state.busy;
    card.dataset.idx = String(idx);
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `数字卡片 #${idx}: ${toLatex(expr)}`);
    if (idx === highlightIdx) card.classList.add('new');
    const inner = document.createElement('span');
    kRender(toLatex(expr), inner);
    card.appendChild(inner);

    card.addEventListener('dragstart', (e) => {
      if (state.busy) { e.preventDefault(); return; }
      e.dataTransfer.setData('text/plain', String(idx));
      e.dataTransfer.effectAllowed = 'copy';
      card.classList.add('dragging');
    });
    card.addEventListener('dragend', () => card.classList.remove('dragging'));
    card.addEventListener('contextmenu', (e) => {
      if (state.busy) return;
      e.preventDefault();
      showContextMenu(idx, e.clientX, e.clientY);
    });

    // 悬浮出现的"更多"按钮，作为右键的等价入口
    const moreBtn = document.createElement('button');
    moreBtn.type = 'button';
    moreBtn.className = 'card-more';
    moreBtn.textContent = '⋯';
    moreBtn.title = '更多操作';
    moreBtn.setAttribute('aria-label', `对数字 #${idx} 打开菜单`);
    moreBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (state.busy) return;
      const r = moreBtn.getBoundingClientRect();
      showContextMenu(idx, r.left, r.bottom + 4);
    });
    moreBtn.addEventListener('mousedown', (e) => e.stopPropagation());
    moreBtn.addEventListener('dragstart', (e) => e.preventDefault());
    card.appendChild(moreBtn);

    poolEl.appendChild(card);
  });
  document.getElementById('counter').textContent =
    `共 ${state.pool.length} 个数字`;
}

// ===== 快捷函数 UI =====
function buildQuickFnsUI() {
  const list = document.getElementById('quickList');
  if (!list) return;
  list.innerHTML = '';
  for (const [fn, def] of Object.entries(QUICK_FNS)) {
    const row = document.createElement('div');
    row.className = 'qfn-item';
    row.dataset.fn = fn;
    row.innerHTML = `
      <span class="token func qfn-label"></span>
      <span class="token paren">(</span>
      <div class="slot" id="qfn-${fn}-slot" data-slot="x"
           role="button" aria-label="${def.title} 参数槽位"></div>
      <span class="token paren">)</span>
      <button class="primary" id="qfn-${fn}-btn" disabled>生成</button>
      <span class="token equals">=</span>
      <span class="qfn-preview" id="qfn-${fn}-preview"></span>
    `;
    list.appendChild(row);
    kRender(def.label, row.querySelector('.qfn-label'));
    setupQuickSlot(fn);
    row.querySelector(`#qfn-${fn}-btn`).addEventListener('click', () => runQuickFn(fn));
  }
}

function setupQuickSlot(fn) {
  const el = document.getElementById(`qfn-${fn}-slot`);
  if (!el) return;
  el.addEventListener('dragover', (e) => {
    if (state.busy) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    el.classList.add('drag-over');
  });
  el.addEventListener('dragleave', () => el.classList.remove('drag-over'));
  el.addEventListener('drop', (e) => {
    if (state.busy) return;
    e.preventDefault();
    el.classList.remove('drag-over');
    const idx = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (Number.isNaN(idx) || idx < 0 || idx >= state.pool.length) return;
    pushCommand({ t: 'qDrag', fn, idx });
    renderAll();
  });
  el.addEventListener('click', () => {
    if (state.busy) return;
    if (!state.qFns[fn] || !state.qFns[fn].slot) return;
    pushCommand({ t: 'qClearSlot', fn });
    renderAll();
  });
}

function renderQuickFns() {
  for (const [fn, def] of Object.entries(QUICK_FNS)) {
    const slotEl = document.getElementById(`qfn-${fn}-slot`);
    const btn    = document.getElementById(`qfn-${fn}-btn`);
    const prev   = document.getElementById(`qfn-${fn}-preview`);
    if (!slotEl) continue;
    const q = state.qFns[fn];
    slotEl.innerHTML = '';
    if (q && q.slot) {
      slotEl.classList.add('filled');
      const span = document.createElement('span');
      kRender(toLatex(q.slot), span);
      slotEl.appendChild(span);
    } else {
      slotEl.classList.remove('filled');
    }
    if (btn) btn.disabled = state.busy || !q || !q.slot;
    if (prev) {
      prev.innerHTML = '';
      if (q && q.slot) {
        const result = def.apply(q.slot);
        const span = document.createElement('span');
        kRender(toLatex(result), span);
        prev.appendChild(span);
      } else {
        prev.textContent = '?';
      }
    }
  }
}

function runQuickFn(fn) {
  if (state.busy) return;
  const q = state.qFns[fn];
  if (!q || !q.slot) return;
  const def = QUICK_FNS[fn];
  const result = def.apply(q.slot);
  pushCommand({ t: 'qCompute', fn });
  const newIdx = state.pool.findIndex(e => eq(e, result));
  renderAll(newIdx);
}

// ===== 右键上下文菜单：化简（多选项） + 删除 =====
function showContextMenu(idx, x, y) {
  const menu = document.getElementById('contextMenu');
  if (!menu) return;
  const expr = state.pool[idx];
  const options = getSimplifyOptions(expr);

  menu.innerHTML = '';

  if (options.length === 0) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ctx-item';
    btn.disabled = true;
    btn.textContent = '无法进一步化简';
    menu.appendChild(btn);
  } else {
    const hint = document.createElement('div');
    hint.className = 'ctx-section-label';
    hint.textContent = '化简为：';
    menu.appendChild(hint);
    for (const opt of options) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ctx-item ctx-simp-option';
      btn.setAttribute('role', 'menuitem');
      const ruleName = document.createElement('span');
      ruleName.className = 'ctx-rule-name';
      ruleName.textContent = opt.label;
      const arrow = document.createElement('span');
      arrow.className = 'ctx-arrow';
      arrow.textContent = '→';
      const latex = document.createElement('span');
      latex.className = 'ctx-latex';
      kRender(toLatex(opt.target), latex);
      btn.appendChild(ruleName);
      btn.appendChild(arrow);
      btn.appendChild(latex);
      btn.addEventListener('click', () => {
        hideContextMenu();
        pushCommand({
          t: 'simplify',
          idx,
          targetExpr: opt.target,
          ruleId: opt.id,
        });
        const newIdx = state.pool.findIndex(e => eq(e, opt.target));
        renderAll(newIdx);
      });
      menu.appendChild(btn);
    }
  }

  const divider = document.createElement('div');
  divider.className = 'ctx-divider';
  divider.setAttribute('role', 'separator');
  menu.appendChild(divider);

  const delBtn = document.createElement('button');
  delBtn.type = 'button';
  delBtn.className = 'ctx-item ctx-danger';
  delBtn.setAttribute('role', 'menuitem');
  delBtn.textContent = '删除此数字';
  delBtn.addEventListener('click', () => {
    hideContextMenu();
    pushCommand({ t: 'remove', idx });
    renderAll();
  });
  menu.appendChild(delBtn);

  // 先显示到视口外测量尺寸，再夹紧到视口内
  menu.style.left = '0px';
  menu.style.top = '0px';
  menu.hidden = false;
  const w = menu.offsetWidth;
  const h = menu.offsetHeight;
  const px = Math.min(x, window.innerWidth  - w - 8);
  const py = Math.min(y, window.innerHeight - h - 8);
  menu.style.left = px + 'px';
  menu.style.top  = py + 'px';
}

function hideContextMenu() {
  const menu = document.getElementById('contextMenu');
  if (menu) menu.hidden = true;
}

function renderSlot(slotId, expr) {
  const el = document.getElementById(slotId);
  if (!el) return;
  el.innerHTML = '';
  if (expr) {
    el.classList.add('filled');
    const span = document.createElement('span');
    kRender(toLatex(expr), span);
    el.appendChild(span);
  } else {
    el.classList.remove('filled');
  }
}

function setResultContent(latex, phase) {
  // phase: 'raw' | 'simp' | 'empty'
  const el = document.getElementById('result');
  if (!el) return null;
  el.classList.remove('has-value', 'is-raw', 'is-simp');
  el.innerHTML = '';
  if (phase === 'empty') {
    el.textContent = '?';
    return;
  }
  const span = document.createElement('span');
  span.className = 'expr';
  kRender(latex, span);
  el.appendChild(span);
  el.classList.add('has-value');
  if (phase === 'raw') el.classList.add('is-raw');
  else el.classList.add('is-simp');
  return span;
}

function renderResultStatic() {
  const el = document.getElementById('result');
  if (!el) return;
  el.classList.remove('is-raw');
  if (state.result) {
    setResultContent(toLatex(state.result), 'simp');
  } else {
    setResultContent('', 'empty');
  }
}

function updateComputeBtn() {
  const btn = document.getElementById('computeBtn');
  if (!btn) return;
  btn.disabled = state.busy || !(state.slotX && state.slotY);
}

function updateHistoryUI() {
  const undoBtn = document.getElementById('undoBtn');
  const redoBtn = document.getElementById('redoBtn');
  const counter = document.getElementById('historyCounter');
  const saveBtn = document.getElementById('saveBtn');
  if (undoBtn) undoBtn.disabled = !canUndo();
  if (redoBtn) redoBtn.disabled = !canRedo();
  if (saveBtn) saveBtn.disabled = state.busy || state.historyIdx < 0;
  if (counter) {
    const done = state.historyIdx + 1;
    const total = state.history.length;
    counter.textContent = total === 0 ? '无历史' : `步骤 ${done} / ${total}`;
  }
}

function renderAll(highlightIdx = -1) {
  renderPool(highlightIdx);
  renderSlot('slotX', state.slotX);
  renderSlot('slotY', state.slotY);
  renderResultStatic();
  renderQuickFns();
  updateComputeBtn();
  updateHistoryUI();
}

async function loadSimplifyRules() {
  try {
    const res = await fetch('simplifications.json', { cache: 'no-store' });
    if (!res.ok) throw new Error(res.statusText);
    const data = await res.json();
    if (Array.isArray(data.rules)) state.simplifyRules = data.rules;
  } catch (e) {
    console.warn('加载 simplifications.json 失败', e);
    state.simplifyRules = [];
  }
}

// ===== 交互（全部通过 pushCommand 走历史栈）=====
function setupSlot(slotId, which) {
  const el = document.getElementById(slotId);
  if (!el) return;

  el.addEventListener('dragover', (e) => {
    if (state.busy) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    el.classList.add('drag-over');
  });
  el.addEventListener('dragleave', () => el.classList.remove('drag-over'));
  el.addEventListener('drop', (e) => {
    if (state.busy) return;
    e.preventDefault();
    el.classList.remove('drag-over');
    const idxStr = e.dataTransfer.getData('text/plain');
    const idx = parseInt(idxStr, 10);
    if (Number.isNaN(idx) || idx < 0 || idx >= state.pool.length) return;
    pushCommand({ t: 'drag', slot: which, idx });
    renderAll();
  });

  // 点击已填槽位清除
  el.addEventListener('click', () => {
    if (state.busy) return;
    const cur = which === 'x' ? state.slotX : state.slotY;
    if (!cur) return;
    pushCommand({ t: 'clearSlot', slot: which });
    renderAll();
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function compute() {
  if (!state.slotX || !state.slotY || state.busy) return;
  state.busy = true;
  updateComputeBtn();
  updateHistoryUI();

  const raw = buildRaw(state.slotX, state.slotY);
  const simplified = simplifyBasic(raw);
  const rawLatex  = toLatex(raw);
  const simpLatex = toLatex(simplified);

  // 第一步：展示代入后的未化简形式 e^x - ln y
  const rawSpan = setResultContent(rawLatex, 'raw');

  if (rawLatex !== simpLatex) {
    await sleep(900);
    if (rawSpan) rawSpan.classList.add('leaving');
    await sleep(320);
    const simpSpan = setResultContent(simpLatex, 'simp');
    if (simpSpan) {
      simpSpan.classList.add('entering');
      requestAnimationFrame(() => requestAnimationFrame(() => {
        simpSpan.classList.remove('entering');
      }));
    }
    await sleep(360);
  } else {
    await sleep(400);
  }

  // 把 compute 写入历史栈（同样的逻辑再跑一次是幂等的）
  pushCommand({ t: 'compute' });

  // 先解除 busy 再 renderPool，否则新卡片会被渲染成 draggable=false
  state.busy = false;

  const newIdx = state.pool.findIndex(e => eq(e, simplified));
  renderPool(newIdx);
  updateComputeBtn();
  updateHistoryUI();
}

function clearSlotsAction() {
  if (state.busy) return;
  if (!state.slotX && !state.slotY && !state.result) return;
  pushCommand({ t: 'clearSlots' });
  renderAll();
}

function resetAllAction() {
  if (state.busy) return;
  pushCommand({ t: 'reset' });
  renderAll();
}

// ===== 启动 =====
function bindIfExists(id, event, handler) {
  const el = document.getElementById(id);
  if (el) el.addEventListener(event, handler);
}

window.addEventListener('DOMContentLoaded', async () => {
  // 仅在主页（存在 slotX）上初始化交互。tests.html 会走它自己的引导。
  if (!document.getElementById('slotX')) return;

  renderFormulaDef();
  setupSlot('slotX', 'x');
  setupSlot('slotY', 'y');
  buildQuickFnsUI();

  // 点击菜单外 / ESC 关闭右键菜单
  document.addEventListener('click', (e) => {
    const menu = document.getElementById('contextMenu');
    if (menu && !menu.hidden && !menu.contains(e.target)) hideContextMenu();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hideContextMenu();
  });
  window.addEventListener('scroll', hideContextMenu, true);
  bindIfExists('computeBtn',    'click', compute);
  bindIfExists('clearSlotsBtn', 'click', clearSlotsAction);
  bindIfExists('resetBtn',      'click', resetAllAction);
  bindIfExists('undoBtn',       'click', undo);
  bindIfExists('redoBtn',       'click', redo);
  bindIfExists('saveBtn',       'click', saveHistory);
  bindIfExists('loadInput',     'change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) loadHistoryFromFile(file);
    e.target.value = '';
  });
  bindIfExists('pasteImportBtn', 'click', () => {
    const ta = document.getElementById('pasteImportText');
    if (!ta || !ta.value.trim()) return;
    if (loadHistoryFromText(ta.value)) ta.value = '';
  });

  await loadSimplifyRules();

  // 键盘快捷键：Cmd/Ctrl+Z / Cmd/Ctrl+Shift+Z / Cmd/Ctrl+Y
  window.addEventListener('keydown', (e) => {
    const mod = e.metaKey || e.ctrlKey;
    if (!mod) return;
    if (e.key === 'z' || e.key === 'Z') {
      e.preventDefault();
      if (e.shiftKey) redo(); else undo();
    } else if (e.key === 'y' || e.key === 'Y') {
      e.preventDefault();
      redo();
    }
  });

  renderAll();
});

// 暴露核心 API 给测试页
window.EML = {
  Num, E, Pi, I, Exp, Ln, Sub, Div, Mul, Add, Pow, Neg, Sin, Cos, Ln0,
  eq, simplify, deepSimplify, emlOp, buildRaw, toLatex,
};

// 控制台自测
window.__emlSelfTest = function () {
  const n1 = Num(1);
  const r1 = emlOp(n1, n1);         // eml(1,1) -> e
  const r2 = emlOp(r1, n1);         // eml(e,1) -> e^e
  const r3 = emlOp(n1, r2);         // eml(1,e^e) -> 0
  const zero = r3;
  const r4 = emlOp(n1, zero);       // eml(1,0) -> e - ln 0
  const ee_over_0 = emlOp(r4, n1);  // eml(e - ln 0, 1) -> e^e / 0
  const ln0 = emlOp(n1, ee_over_0); // eml(1, e^e / 0) -> ln 0
  const sqrt2 = emlOp(Div(Ln(Num(2)), Num(2)), n1); // eml((ln 2)/2, 1) -> √2
  return {
    'eml(1,1)':         toLatex(r1),
    'eml(e,1)':         toLatex(r2),
    'eml(1,e^e)':       toLatex(r3),
    'eml(1,0)':         toLatex(r4),
    'eml(e-ln0,1)':     toLatex(ee_over_0),
    'eml(1,e^e/0)':     toLatex(ln0),
    'eml((ln2)/2,1)':   toLatex(sqrt2),
  };
};
