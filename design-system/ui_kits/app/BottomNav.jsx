/* global React */

function BottomNav({ tab, onTab, hidden }) {
  if (hidden) return null;
  const items = [
    { id: "build",   label: "Build",    icon: <svg viewBox="0 0 24 24" className="plus"><path d="M12 5v14M5 12h14"/></svg> },
    { id: "history", label: "History",  icon: <svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></svg> },
    { id: "settings",label: "Settings", icon: <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19 12.7a7 7 0 0 0 0-1.4l2-1.6-2-3.4-2.3.9a7 7 0 0 0-1.2-.7L15 4h-4l-.5 2.5a7 7 0 0 0-1.2.7L7 6.3l-2 3.4 2 1.6a7 7 0 0 0 0 1.4l-2 1.6 2 3.4 2.3-.9a7 7 0 0 0 1.2.7L11 20h4l.5-2.5a7 7 0 0 0 1.2-.7l2.3.9 2-3.4-2-1.6z"/></svg> },
  ];
  return (
    <nav className="bottom-nav">
      {items.map(it => (
        <button key={it.id} className={"nav-item" + (tab === it.id ? " active" : "")} onClick={() => onTab(it.id)}>
          {it.icon}
          <span>{it.label}</span>
        </button>
      ))}
    </nav>
  );
}

window.BottomNav = BottomNav;
