/* global React */

function YogaSetup({ style, setStyle, duration, setDuration, onStart }) {
  const styles = [
    { id: "vinyasa",     label: "Vinyasa Flow", sub: "Linked breath" },
    { id: "hatha",       label: "Hatha",        sub: "Held shapes" },
    { id: "yin",         label: "Yin",          sub: "Long & slow" },
    { id: "power",       label: "Power",        sub: "Strong flow" },
    { id: "restorative", label: "Restorative",  sub: "Supported rest" },
  ];
  const durations = [10, 20, 30, 45, 60];

  return (
    <div className="screen">
      <div className="setup-header">
        <h1>Yoga</h1>
        <p>Pick a style, settle in</p>
      </div>

      <div className="option-group">
        <label>Style</label>
        <div className="option-pills" style={{flexDirection:"column", gap: 8}}>
          {styles.map(s => (
            <div key={s.id}
              className={"pill" + (style === s.id ? " selected" : "")}
              onClick={() => setStyle(s.id)}
              style={{flex: "0 0 auto", textAlign: "left", padding: "14px 16px", display: "flex", alignItems: "baseline", gap: 8}}>
              <span style={{fontWeight: 600}}>{s.label}</span>
              <span className="sanskrit-name" style={{fontStyle:"italic", color:"var(--text-dim)", fontSize:"0.82em", marginLeft: 4}}>· {s.sub}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="option-group">
        <label>Duration</label>
        <div className="option-pills">
          {durations.map(d => (
            <div key={d} className={"pill" + (duration === d ? " selected" : "")}
                 onClick={() => setDuration(d)}>
              {d}<span className="pill-sub">min</span>
            </div>
          ))}
        </div>
      </div>

      <div className="generate-section">
        <button className="btn btn-primary btn-full" onClick={onStart}>Begin practice</button>
      </div>
    </div>
  );
}

window.YogaSetup = YogaSetup;
