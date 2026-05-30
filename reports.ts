:root {
  /* Palette — deep teal "command center" */
  --bg: #0a1413;
  --bg-2: #0e1d1b;
  --panel: #102725;
  --panel-2: #143430;
  --line: #1d4541;
  --line-soft: #163b37;
  --ink: #e8f4f1;
  --ink-2: #9fc4bd;
  --ink-3: #6f968f;
  --teal: #2dd4bf;
  --teal-deep: #0c4a47;
  --teal-glow: rgba(45, 212, 191, 0.16);
  --amber: #f5b54a;
  --rose: #f87171;
  --green: #5ee6a8;
  --blue: #5fa8ff;
  --violet: #b79cff;

  --radius: 14px;
  --radius-sm: 9px;
  --shadow: 0 18px 50px -22px rgba(0, 0, 0, 0.75);
  --font-display: "Fraunces", Georgia, serif;
  --font-body: "Archivo", system-ui, sans-serif;
  --font-mono: "IBM Plex Mono", ui-monospace, monospace;
}

* { box-sizing: border-box; margin: 0; padding: 0; }

html, body, #root { height: 100%; }

body {
  font-family: var(--font-body);
  background: var(--bg);
  color: var(--ink);
  -webkit-font-smoothing: antialiased;
  background-image:
    radial-gradient(1200px 600px at 85% -10%, rgba(45, 212, 191, 0.08), transparent 60%),
    radial-gradient(900px 500px at -10% 110%, rgba(95, 168, 255, 0.06), transparent 55%);
  background-attachment: fixed;
}

a { color: inherit; text-decoration: none; }
button { font-family: inherit; cursor: pointer; }
input, select, textarea { font-family: inherit; }

::selection { background: var(--teal); color: #04201d; }

/* Scrollbar */
::-webkit-scrollbar { width: 10px; height: 10px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--line); border-radius: 20px; }
::-webkit-scrollbar-thumb:hover { background: var(--line-soft); }

/* ---------- Typography ---------- */
.display { font-family: var(--font-display); font-weight: 600; letter-spacing: -0.01em; line-height: 1.05; }
.mono { font-family: var(--font-mono); font-variant-numeric: tabular-nums; }
.eyebrow {
  font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase;
  color: var(--ink-3); font-weight: 600;
}

/* ---------- Buttons ---------- */
.btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  border: 1px solid var(--line); background: var(--panel-2); color: var(--ink);
  padding: 10px 16px; border-radius: var(--radius-sm); font-weight: 600; font-size: 14px;
  transition: transform 0.12s ease, background 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
}
.btn:hover { border-color: var(--teal); transform: translateY(-1px); }
.btn:active { transform: translateY(0); }
.btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
.btn-primary {
  background: linear-gradient(180deg, #2dd4bf, #14b8a6);
  color: #04201d; border-color: transparent;
  box-shadow: 0 10px 26px -12px var(--teal-glow), inset 0 1px 0 rgba(255, 255, 255, 0.3);
}
.btn-primary:hover { box-shadow: 0 14px 30px -10px rgba(45, 212, 191, 0.5); border-color: transparent; }
.btn-ghost { background: transparent; }
.btn-danger { border-color: rgba(248, 113, 113, 0.4); color: var(--rose); background: rgba(248, 113, 113, 0.08); }
.btn-sm { padding: 7px 12px; font-size: 13px; }
.btn-block { width: 100%; }

/* ---------- Inputs ---------- */
.field { display: flex; flex-direction: column; gap: 7px; margin-bottom: 16px; }
.field label { font-size: 13px; font-weight: 600; color: var(--ink-2); }
.input, .select, textarea.input {
  width: 100%; background: var(--bg-2); border: 1px solid var(--line);
  color: var(--ink); padding: 11px 13px; border-radius: var(--radius-sm); font-size: 14px;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
.input:focus, .select:focus, textarea.input:focus {
  outline: none; border-color: var(--teal); box-shadow: 0 0 0 3px var(--teal-glow);
}
.input::placeholder { color: var(--ink-3); }

/* ---------- Cards / panels ---------- */
.panel {
  background: linear-gradient(180deg, var(--panel), var(--bg-2));
  border: 1px solid var(--line-soft); border-radius: var(--radius); box-shadow: var(--shadow);
}
.panel-pad { padding: 22px; }
.card-grid { display: grid; gap: 16px; }
.center-screen { min-height: 100vh; display: grid; place-items: center; padding: 24px; }

/* ---------- Badges ---------- */
.badge {
  display: inline-flex; align-items: center; gap: 6px; font-size: 11.5px; font-weight: 600;
  padding: 4px 10px; border-radius: 999px; border: 1px solid var(--line);
  color: var(--ink-2); letter-spacing: 0.02em;
}
.badge-good { color: var(--green); border-color: rgba(94, 230, 168, 0.35); background: rgba(94, 230, 168, 0.08); }
.badge-warn { color: var(--amber); border-color: rgba(245, 181, 74, 0.35); background: rgba(245, 181, 74, 0.08); }
.badge-bad { color: var(--rose); border-color: rgba(248, 113, 113, 0.35); background: rgba(248, 113, 113, 0.08); }
.badge-teal { color: var(--teal); border-color: rgba(45, 212, 191, 0.35); background: var(--teal-glow); }

/* ---------- Utility ---------- */
.row { display: flex; align-items: center; }
.between { justify-content: space-between; }
.gap-8 { gap: 8px; } .gap-12 { gap: 12px; } .gap-16 { gap: 16px; } .gap-24 { gap: 24px; }
.wrap { flex-wrap: wrap; }
.muted { color: var(--ink-3); }
.tcenter { text-align: center; }
.spinner {
  width: 18px; height: 18px; border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.25); border-top-color: var(--ink);
  animation: spin 0.7s linear infinite;
}
.spinner-lg { width: 34px; height: 34px; border-width: 3px; }
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes rise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
.rise { animation: rise 0.5s cubic-bezier(0.2, 0.7, 0.2, 1) both; }

.alert { padding: 11px 14px; border-radius: var(--radius-sm); font-size: 13.5px; border: 1px solid; }
.alert-error { color: var(--rose); border-color: rgba(248, 113, 113, 0.4); background: rgba(248, 113, 113, 0.08); }
.alert-ok { color: var(--green); border-color: rgba(94, 230, 168, 0.4); background: rgba(94, 230, 168, 0.08); }
.alert-info { color: var(--ink-2); border-color: var(--line); background: var(--panel-2); }

.divider { height: 1px; background: var(--line-soft); border: 0; margin: 18px 0; }

table.data { width: 100%; border-collapse: collapse; font-size: 13.5px; }
table.data th { text-align: left; color: var(--ink-3); font-weight: 600; font-size: 11.5px;
  text-transform: uppercase; letter-spacing: 0.06em; padding: 10px 12px; border-bottom: 1px solid var(--line-soft); }
table.data td { padding: 11px 12px; border-bottom: 1px solid var(--line-soft); }
table.data tr:hover td { background: rgba(255, 255, 255, 0.02); }
