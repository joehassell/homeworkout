/* global React */

function TimerScreen({ workout, onDone, onBack }) {
  const [step, setStep] = React.useState(0); // 0: warmup-work, 1: rest, 2: main-work, ...
  const [secondsLeft, setSecondsLeft] = React.useState(30);
  const [running, setRunning] = React.useState(true);

  // Build a flat sequence: warmup work → 60s rest → main reps interleaved with rests → cooldown
  const seq = React.useMemo(() => {
    const out = [];
    const main = workout.sections[1].items;
    out.push({ phase: "work", name: workout.sections[0].items[0].name, detail: "Warm-up", duration: 30 });
    out.push({ phase: "rest", name: "Rest", detail: "Up next: " + main[0].name, duration: 60 });
    main.forEach((ex, i) => {
      out.push({ phase: "work", name: ex.name, detail: ex.duration + " · " + ex.equipment, duration: 40 });
      if (i < main.length - 1) {
        out.push({ phase: "rest", name: "Rest", detail: "Up next: " + main[i+1].name, duration: 90 });
      }
    });
    out.push({ phase: "rest", name: "Cooldown", detail: workout.sections[2].items[0].name, duration: 30 });
    return out;
  }, [workout]);

  const cur = seq[step] || seq[0];

  React.useEffect(() => { setSecondsLeft(cur.duration); }, [step, cur.duration]);

  React.useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setSecondsLeft(s => s - 1), 1000);
    return () => clearInterval(t);
  }, [running]);

  React.useEffect(() => {
    if (secondsLeft < 0) {
      if (step >= seq.length - 1) onDone();
      else setStep(s => s + 1);
    }
  }, [secondsLeft, step, seq.length, onDone]);

  const fmt = (s) => {
    const mm = Math.max(0, Math.floor(Math.max(0,s) / 60)).toString().padStart(2,"0");
    const ss = Math.max(0, Math.max(0,s) % 60).toString().padStart(2,"0");
    return mm + ":" + ss;
  };

  const isFinal = secondsLeft <= 3 && secondsLeft >= 0 && cur.phase === "work";
  const pct = ((cur.duration - Math.max(0, secondsLeft)) / cur.duration) * 100;

  return (
    <div className={"timer-screen phase-" + cur.phase}>
      <div className={"timer-phase " + cur.phase}>
        {cur.phase === "work" ? "Work" : "Rest"}
      </div>
      <div className="timer-exercise-name">{cur.name}</div>
      <div className="timer-exercise-detail">{cur.detail}</div>

      <div className="timer-hr">
        <span className="hr-icon">♥</span>
        <span style={{fontVariantNumeric: "tabular-nums", fontWeight: 700}}>142</span>
        <span className="hr-unit">BPM</span>
      </div>

      <div className={"timer-display" + (isFinal ? " bloom" : "")}>
        {isFinal ? Math.max(0, secondsLeft) : fmt(secondsLeft)}
      </div>

      <div className="timer-progress">
        <div className={"timer-progress-bar " + cur.phase} style={{width: pct + "%"}} />
      </div>

      <div className="timer-set-progress">
        Step {step + 1} of {seq.length}
      </div>

      <div className="timer-controls">
        <button className="btn btn-ghost" onClick={() => setStep(s => Math.max(0, s - 1))}>‹ Prev</button>
        <button className="btn btn-primary" onClick={() => setRunning(r => !r)}>
          {running ? "Pause" : "Resume"}
        </button>
        <button className="btn btn-ghost" onClick={() => setStep(s => Math.min(seq.length - 1, s + 1))}>Skip ›</button>
      </div>

      <button className="btn btn-ghost" style={{marginTop: 14}} onClick={onBack}>End workout</button>
    </div>
  );
}

window.TimerScreen = TimerScreen;
