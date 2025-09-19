const { useState } = React;

function CToMipsyLearner() {
  const [cCode, setCCode] = useState(`// Example: compute factorial
#include <stdio.h>

int factorial(int n) {
  int i, res = 1;
  for (i = 2; i <= n; i++) {
    res = res * i;
  }
  return res;
}

int main() {
  int x;
  scanf("%d", &x);
  printf("%d\\n", factorial(x));
  return 0;
}`);
  const [mips, setMips] = useState('');
  const [explainMap, setExplainMap] = useState([]);
  const [log, setLog] = useState('');

  let uidCounter = 0;
  const uid = () => `id${++uidCounter}`;

  function translate() {
    const lines = cCode.split('\n');
    const out = [];
    const explanations = [];
    const stackFrame = {};
    let nextOffset = -4;
    function allocVar(n) {
      if (!(n in stackFrame)) {
        stackFrame[n] = nextOffset;
        nextOffset -= 4;
      }
      return stackFrame[n];
    }

    for (let raw of lines) {
      const line = raw.replace(/\/\/.*$/, '').trim();
      if (!line || line.startsWith('#')) continue;

      if (/^int\s+[a-zA-Z_]/.test(line) && line.includes(';')) {
        const decl = line.replace(/^int\s+/, '').replace(/;$/, '');
        const parts = decl.split(',').map(s => s.trim());
        for (const p of parts) {
          if (p.includes('=')) {
            const [name, val] = p.split('=');
            const off = allocVar(name.trim());
            out.push(`  li $t0, ${val.trim()}`);
            out.push(`  sw $t0, ${off}($sp)`);
            explanations.push({ id: uid(), text: `Declare ${name.trim()} init ${val.trim()}`, src: raw });
          } else {
            const off = allocVar(p.trim());
            out.push(`# alloc ${p.trim()} at ${off}($sp)`);
            explanations.push({ id: uid(), text: `Declare ${p.trim()}`, src: raw });
          }
        }
        continue;
      }

      if (/^[a-zA-Z_][a-zA-Z0-9_]*\s*=/.test(line)) {
        const [left, right] = line.split('=');
        const L = left.trim();
        const R = right.replace(/;$/, '').trim();
        if (/^[0-9]+$/.test(R)) {
          const off = allocVar(L);
          out.push(`  li $t0, ${R}`);
          out.push(`  sw $t0, ${off}($sp)`);
          explanations.push({ id: uid(), text: `Assign ${R} to ${L}`, src: raw });
        } else if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(R)) {
          const offL = allocVar(L);
          const offR = allocVar(R);
          out.push(`  lw $t0, ${offR}($sp)`);
          out.push(`  sw $t0, ${offL}($sp)`);
          explanations.push({ id: uid(), text: `Copy ${R} -> ${L}`, src: raw });
        } else {
          out.push(`# [UNSUPPORTED assign] ${raw}`);
          explanations.push({ id: uid(), text: `Complex assign not supported`, src: raw });
        }
        continue;
      }

      if (/^return\s+/.test(line)) {
        const expr = line.replace(/^return\s+/, '').replace(/;$/, '').trim();
        if (/^[0-9]+$/.test(expr)) {
          out.push(`  li $v0, ${expr}`);
          explanations.push({ id: uid(), text: `Return ${expr}`, src: raw });
        } else {
          const off = allocVar(expr);
          out.push(`  lw $v0, ${off}($sp)`);
          explanations.push({ id: uid(), text: `Return ${expr} via $v0`, src: raw });
        }
        continue;
      }

      if (/scanf\s*\(/.test(line)) {
        const m = raw.match(/scanf\s*\(\s*"%d"\s*,\s*&([a-zA-Z_][a-zA-Z0-9_]*)\s*\)/);
        if (m) {
          const v = m[1];
          const off = allocVar(v);
          out.push(`  li $v0, 5`);
          out.push(`  syscall`);
          out.push(`  sw $v0, ${off}($sp)`);
          explanations.push({ id: uid(), text: `scanf -> read int to ${v}`, src: raw });
        } else {
          out.push(`# [UNSUPPORTED scanf] ${raw}`);
          explanations.push({ id: uid(), text: `Unsupported scanf pattern`, src: raw });
        }
        continue;
      }

      if (/printf\s*\(/.test(line)) {
        const m = raw.match(/printf\s*\(\s*"%d(.*?)"\s*,\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\)/);
        if (m) {
          const varname = m[2];
          const off = allocVar(varname);
          out.push(`  lw $a0, ${off}($sp)`);
          out.push(`  li $v0, 1`);
          out.push(`  syscall`);
          if (m[1] && m[1].includes('\\n')) {
            out.push(`  li $a0, 10`);
            out.push(`  li $v0, 11`);
            out.push(`  syscall`);
          }
          explanations.push({ id: uid(), text: `printf int -> print syscall for ${varname}`, src: raw });
        } else {
          out.push(`# [UNSUPPORTED printf] ${raw}`);
          explanations.push({ id: uid(), text: `Unsupported printf`, src: raw });
        }
        continue;
      }

      out.push(`# [UNTRANSLATED] ${raw}`);
      explanations.push({ id: uid(), text: `Could not translate`, src: raw });
    }

    setMips(out.join('\n'));
    setExplainMap(explanations);
    setLog(`Translated ${lines.length} lines`);
  }

  function renderMips() {
    if (!mips) return <div style={{ color: '#6b7280' }}>No translation yet. Click Convert.</div>;
    const lines = mips.split('\n');
    return lines.map((ln, i) => {
      const e = explainMap[i] || null;
      return (
        <div key={i} className="mips-line">
          <pre style={{ margin: 0 }}>{ln}</pre>
          {e && (
            <div className="explain">
              <strong>Conversion note</strong>
              <div style={{ marginTop: 6 }}>{e.text}</div>
              <div style={{ marginTop: 6, color: '#6b7280' }}>
                Original: <code>{e.src.trim()}</code>
              </div>
            </div>
          )}
        </div>
      );
    });
  }

  return (
    <div className="app">
      <h1>C → MIPSy Learner</h1>
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontWeight: 600 }}>C source</label>
          <textarea
            value={cCode}
            onChange={e => setCCode(e.target.value)}
            rows={18}
          />
          <div style={{ marginTop: 8 }}>
            <button onClick={translate}>Convert</button>
            <button onClick={() => { setCCode(''); setMips(''); setExplainMap([]); setLog(''); }}>Clear</button>
            <button onClick={() => setCCode('// paste your C code here')}>Load Example</button>
          </div>
          <div style={{ marginTop: 8, color: '#6b7280' }}>Log: {log}</div>
        </div>
        <div style={{ flex: 1, maxWidth: 560 }}>
          <label style={{ fontWeight: 600 }}>MIPSy assembly (hover lines to see notes)</label>
          <div style={{ marginTop: 8, background: '#f8fafc', border: '1px solid #eef2f7', borderRadius: 6, height: 430, overflow: 'auto' }}>
            {renderMips()}
          </div>
        </div>
      </div>
      <div style={{ marginTop: 12, fontSize: 13, color: '#6b7280' }}>
        <strong>Notes:</strong> heuristic translator for learning. Not a production compiler.
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<CToMipsyLearner />);
