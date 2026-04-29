/* global React */

function YogaFlow({ onDone }) {
  const seq = [
    { en: "Centering breath",  sa: "Pranayama",          sec: 60, kind: "settle" },
    { en: "Mountain pose",     sa: "Tadasana",           sec: 30, kind: "flow" },
    { en: "Forward fold",      sa: "Uttanasana",         sec: 45, kind: "flow" },
    { en: "Downward dog",      sa: "Adho Mukha Svanasana", sec: 60, kind: "flow" },
    { en: "Warrior II",        sa: "Virabhadrasana II",  sec: 45, kind: "flow" },
    { en: "Pigeon",            sa: "Eka Pada Rajakapotasana", sec: 60, kind: "hold" },
    { en: "Final rest",        sa: "Savasana",           sec: 90, kind: "rest" },
  ];
  const [i, setI] = React.useState(0);
  const [s, setS] = React.useState(seq[0].sec);
  const cur = seq[i];
  const total = cur.sec;

  React.useEffect(() => { setS(seq[i].sec); }, [i]);
  React.useEffect(() => {
    const t = setInterval(() => setS(x => x - 1), 1000);
    return () => clearInterval(t);
  }, []);
  React.useEffect(() => {
    if (s < 0) {
      if (i >= seq.length - 1) onDone();
      else setI(x => x + 1);
    }
  }, [s, i]);

  const breathScale = 1 + 0.08 * Math.sin(Date.now() / 1800);
  const [, force] = React.useReducer(x => x + 1, 0);
  React.useEffect(() => {
    const r = setInterval(force, 60);
    return () => clearInterval(r);
  }, []);

  const pct = ((total - Math.max(0, s)) / total) * 100;

  return (
    <div className="timer-screen phase-rest" style={{background: "radial-gradient(ellipse at top, #1a1a2a 0%, #0d0d18 70%)"}}>
      <div className="timer-phase rest" style={{opacity: 0.9}}>
        {cur.kind === "settle" ? "Centering" : cur.kind === "rest" ? "Savasana" : cur.kind === "hold" ? "Hold" : "Flow"}
      </div>
      <div className="timer-exercise-name">{cur.en}</div>
      <div className="sanskrit-name" style={{fontStyle: "italic", color: "var(--text-dim)", fontSize: "0.95rem", marginBottom: 22}}>{cur.sa}</div>

      <div style={{
        width: 140, height: 140, borderRadius: "50%",
        border: "1.5px solid var(--accent)",
        background: "radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)",
        display: "flex", alignItems: "center", justifyContent: "center",
        transform: `scale(${breathScale.toFixed(3)})`,
        transition: "transform 1.6s ease",
        marginBottom: 28
      }}>
        <div style={{fontSize: "3.2rem", fontWeight: 200, color: "var(--text)", fontVariantNumeric: "tabular-nums"}}>
          {Math.max(0, s)}
        </div>
      </div>

      <div className="timer-progress" style={{maxWidth: 220}}>
        <div className="timer-progress-bar" style={{width: pct + "%"}} />
      </div>
      <div className="timer-set-progress">Pose {i + 1} of {seq.length}</div>

      <div className="timer-controls">
        <button className="btn btn-ghost" onClick={() => setI(x => Math.max(0, x - 1))}>‹ Prev</button>
        <button className="btn btn-ghost" onClick={() => setI(x => Math.min(seq.length - 1, x + 1))}>Skip ›</button>
      </div>
      <button className="btn btn-ghost" style={{marginTop: 14}} onClick={onDone}>End practice</button>
    </div>
  );
}

window.YogaFlow = YogaFlow;
