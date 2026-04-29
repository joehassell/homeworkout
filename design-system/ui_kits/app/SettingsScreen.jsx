/* global React */

function SettingsScreen() {
  const [theme, setTheme] = React.useState("dark");
  const [voice, setVoice] = React.useState(true);
  const [audio, setAudio] = React.useState(true);
  const [health, setHealth] = React.useState(true);

  React.useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme === "dark" ? "" : theme);
  }, [theme]);

  const themes = [
    { id: "dark",     name: "Dark",     bg: "linear-gradient(135deg,#0a0a0f 50%,#16161f 50%)", light: false },
    { id: "midnight", name: "Midnight", bg: "linear-gradient(135deg,#060912 50%,#0d1424 50%)", light: false },
    { id: "forest",   name: "Forest",   bg: "linear-gradient(135deg,#061410 50%,#0e1f17 50%)", light: false },
    { id: "hc",       name: "HC",       bg: "linear-gradient(135deg,#000 50%,#1a1a1a 50%)",   light: false },
    { id: "light",    name: "Light",    bg: "linear-gradient(135deg,#fafaf7 50%,#f0f0ed 50%)", light: true },
  ];

  const Row = ({ label, on, onClick, hint }) => (
    <div className="option-group" style={{display:"flex", alignItems:"center", justifyContent:"space-between", padding: "14px 0", borderBottom: "1px solid var(--border)", marginBottom: 0}}>
      <div>
        <div style={{fontSize: "0.95rem"}}>{label}</div>
        {hint && <div style={{fontSize: "0.72rem", color: "var(--text-dim)", marginTop: 2}}>{hint}</div>}
      </div>
      <button onClick={onClick} style={{
        background: on ? "var(--accent-glow)" : "var(--surface2)",
        color: on ? "var(--accent)" : "var(--text-dim)",
        border: on ? "2px solid var(--accent)" : "2px solid var(--border)",
        padding: "6px 16px", borderRadius: 999, fontWeight: 700, fontSize: "0.78rem", fontFamily: "inherit", cursor: "pointer"
      }}>{on ? "ON" : "OFF"}</button>
    </div>
  );

  return (
    <div className="screen">
      <div className="screen-header"><h1>Settings</h1></div>

      <label style={{fontSize: "0.7rem", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700, display: "block", marginBottom: 10}}>Theme</label>
      <div style={{display:"flex", gap: 8, marginBottom: 24}}>
        {themes.map(t => (
          <div key={t.id} onClick={() => setTheme(t.id)} style={{
            flex: 1, aspectRatio: "1", borderRadius: 12, border: "2px solid " + (theme === t.id ? "var(--accent)" : "var(--border)"),
            background: t.bg, position: "relative", cursor: "pointer",
            display: "flex", alignItems: "flex-end", justifyContent: "center", padding: 4
          }}>
            <span style={{
              fontSize: "0.6rem", fontWeight: 700, padding: "2px 5px", borderRadius: 4,
              background: t.light ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.55)",
              color: t.light ? "#18181b" : "#fff",
              textTransform: "uppercase", letterSpacing: "0.04em"
            }}>{t.name}</span>
            {theme === t.id && <span style={{position:"absolute",top:4,right:4,width:12,height:12,borderRadius:"50%",background:"var(--accent)",border:"2px solid var(--bg)"}}/>}
          </div>
        ))}
      </div>

      <Row label="Voice cues" on={voice} onClick={() => setVoice(v => !v)} hint="Spoken phase + countdown" />
      <Row label="Audio beeps" on={audio} onClick={() => setAudio(a => !a)} hint="3-2-1 countdown tones" />
      <Row label="Apple Health" on={health} onClick={() => setHealth(h => !h)} hint="Save workouts to Activity rings" />
    </div>
  );
}

window.SettingsScreen = SettingsScreen;
