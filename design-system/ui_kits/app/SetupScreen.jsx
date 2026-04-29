/* global React */
const { useState, useEffect, useRef } = React;

// ───────── shared bits ─────────
function Eyebrow({ children, hint }) {
  return (
    <label>{children}{hint && <span className="focus-hint">{hint}</span>}</label>
  );
}

function Pill({ selected, onClick, children, sub }) {
  return (
    <div className={"pill" + (selected ? " selected" : "")} onClick={onClick}>
      {children}
      {sub && <span className="pill-sub">{sub}</span>}
    </div>
  );
}

// ───────── Setup screen ─────────
function SetupScreen({ config, setConfig, onGenerate }) {
  const types = [
    { id: "strength", label: "Strength", sub: "Heavy & slow" },
    { id: "hiit", label: "HIIT", sub: "Intervals" },
    { id: "conditioning", label: "Conditioning", sub: "High volume" },
    { id: "functional", label: "Functional", sub: "Multi-joint" },
  ];
  const durations = [15, 20, 30, 45, 60];
  const intensities = [
    { id: "light", label: "Light", sub: "Easy pace" },
    { id: "moderate", label: "Moderate", sub: "Steady" },
    { id: "high", label: "High", sub: "All out" },
  ];
  const sets = [1, 2, 3, 4];
  const focuses = ["Push", "Pull", "Lower", "Core", "Full body", "Mobility"];

  const cycle = (k) => {
    const cur = config.focus[k] || "include";
    const next = cur === "include" ? "increase" : cur === "increase" ? "exclude" : "include";
    setConfig({ ...config, focus: { ...config.focus, [k]: next } });
  };

  return (
    <div className="screen">
      <div className="setup-header">
        <h1>Workout Builder</h1>
        <p>Build your session</p>
      </div>

      <div className="option-group">
        <Eyebrow>Workout Type</Eyebrow>
        <div className="option-pills">
          {types.map(t => (
            <Pill key={t.id} selected={config.type === t.id} sub={t.sub}
              onClick={() => setConfig({ ...config, type: t.id })}>
              {t.label}
            </Pill>
          ))}
        </div>
      </div>

      <div className="option-group">
        <Eyebrow>Duration</Eyebrow>
        <div className="option-pills">
          {durations.map(d => (
            <Pill key={d} selected={config.duration === d} sub="min"
              onClick={() => setConfig({ ...config, duration: d })}>{d}</Pill>
          ))}
        </div>
      </div>

      <div className="option-group">
        <Eyebrow>Intensity</Eyebrow>
        <div className="option-pills">
          {intensities.map(i => (
            <Pill key={i.id} selected={config.intensity === i.id} sub={i.sub}
              onClick={() => setConfig({ ...config, intensity: i.id })}>{i.label}</Pill>
          ))}
        </div>
      </div>

      <div className="option-group">
        <Eyebrow>Sets</Eyebrow>
        <div className="option-pills">
          {sets.map(s => (
            <Pill key={s} selected={config.sets === s} sub={s === 1 ? "set" : "sets"}
              onClick={() => setConfig({ ...config, sets: s })}>{s}</Pill>
          ))}
        </div>
      </div>

      <div className="option-group">
        <Eyebrow hint="tap to cycle: include → boost → exclude">Focus</Eyebrow>
        <div className="focus-pills">
          {focuses.map(f => {
            const state = config.focus[f] || "include";
            return (
              <div key={f} className={"focus-pill fs-" + state} onClick={() => cycle(f)}>
                {f}
              </div>
            );
          })}
        </div>
      </div>

      <div className="generate-section">
        <button className="btn btn-primary btn-full" onClick={onGenerate}>Generate Workout</button>
      </div>
    </div>
  );
}

window.SetupScreen = SetupScreen;
