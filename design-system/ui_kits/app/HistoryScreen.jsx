/* global React */

function HistoryScreen() {
  const cells = React.useMemo(() => {
    const arr = [];
    for (let i = 0; i < 16 * 7; i++) {
      const r = Math.random();
      let c = "";
      if (r > 0.55) c = "l1";
      if (r > 0.7) c = "l2";
      if (r > 0.83) c = "l3";
      if (r > 0.92) c = "l4";
      arr.push(c);
    }
    return arr;
  }, []);

  const rows = [
    { date: "Today",      type: "hiit",       label: "HIIT",       meta: "30 min · 3 sets · RPE 7" },
    { date: "2 days ago", type: "strength",   label: "Strength",   meta: "45 min · 4 sets · RPE 8" },
    { date: "Sun",        type: "functional", label: "Functional", meta: "20 min · 2 sets · RPE 6" },
  ];

  return (
    <div className="screen">
      <div className="screen-header"><h1>History</h1></div>

      <div className="hist-stats">
        <div className="hist-stat"><div className="hist-stat-val">23</div><div className="hist-stat-lbl">workouts</div></div>
        <div className="hist-stat"><div className="hist-stat-val">14h</div><div className="hist-stat-lbl">total</div></div>
        <div className="hist-stat"><div className="hist-stat-val">5</div><div className="hist-stat-lbl">streak</div></div>
        <div className="hist-stat"><div className="hist-stat-val">3.1k</div><div className="hist-stat-lbl">cal</div></div>
      </div>

      <label style={{fontSize: "0.7rem", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700, display: "block", marginBottom: 8}}>Last 16 weeks</label>
      <div className="heatmap">
        {cells.map((c, i) => <div key={i} className={"hm-cell " + c} />)}
      </div>

      <label style={{fontSize: "0.7rem", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700, display: "block", marginBottom: 8}}>Recent</label>
      {rows.map((r, i) => (
        <div key={i} className="hist-row">
          <div className="hist-row-date">{r.date}</div>
          <div className="hist-row-meta">
            <span className={"hist-type " + r.type}>{r.label}</span>
            <span>{r.meta}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

window.HistoryScreen = HistoryScreen;
