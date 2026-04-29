/* global React */

function DoneScreen({ config, onAgain }) {
  const [rpe, setRpe] = React.useState(7);
  const [note, setNote] = React.useState("");
  const colorFor = (n) => n <= 3 ? "g" : n <= 6 ? "y" : n <= 8 ? "o" : "r";

  return (
    <div className="screen">
      <div className="done-screen">
        <h1>Workout complete</h1>
        <div className="sub">Saved to Apple Health</div>

        <div className="done-stats">
          <div className="done-stat">
            <div className="val">{config.duration}</div>
            <div className="lbl">minutes</div>
          </div>
          <div className="done-stat">
            <div className="val">{Math.round(config.duration * 7.4)}</div>
            <div className="lbl">cal</div>
          </div>
          <div className="done-stat">
            <div className="val">142</div>
            <div className="lbl">avg bpm</div>
          </div>
        </div>

        <label style={{fontSize: "0.7rem", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8, fontWeight: 700}}>How hard?</label>
        <div className="rpe-row">
          {[1,2,3,4,5,6,7,8,9,10].map(n => (
            <div key={n} className={"rpe-pill " + colorFor(n) + (rpe === n ? " selected" : "")} onClick={() => setRpe(n)}>{n}</div>
          ))}
        </div>

        <textarea
          placeholder="Note (optional)"
          value={note}
          onChange={e => setNote(e.target.value)}
          rows={2}
          style={{width:"100%", padding:"12px 14px", borderRadius: 10, background: "var(--surface)", color: "var(--text)", border: "2px solid var(--border)", fontSize: "0.9rem", fontFamily: "inherit", outline: "none", marginBottom: 16, marginTop: 8}}
        />

        <button className="btn btn-primary btn-full" onClick={onAgain}>Done</button>
      </div>
    </div>
  );
}

window.DoneScreen = DoneScreen;
