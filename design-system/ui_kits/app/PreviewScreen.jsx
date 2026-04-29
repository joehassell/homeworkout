/* global React */
const { useState: usePrev, useEffect: useEffectPrev } = React;

function PreviewScreen({ config, workout, onBack, onStart }) {
  return (
    <div className="screen">
      <div className="screen-header">
        <h1>Your workout</h1>
      </div>
      <div className="preview-meta">
        <span className="meta-tag">{config.duration} min</span>
        <span className="meta-tag" style={{textTransform:"capitalize"}}>{config.type}</span>
        <span className="meta-tag" style={{textTransform:"capitalize"}}>{config.intensity}</span>
        <span className="meta-tag">{config.sets} {config.sets === 1 ? "set" : "sets"}</span>
      </div>

      <div>
        {workout.sections.map((section, sIdx) => (
          <React.Fragment key={sIdx}>
            <div className="set-header">
              {section.label}
              {section.rest && <span className="set-rest">{section.rest}</span>}
            </div>
            {section.items.map((ex, i) => (
              <div className="exercise-item" key={i}>
                <div className="ex-num">{ex.num}</div>
                <div className="ex-info">
                  <div className="ex-name">
                    {ex.name}
                    <span className={"section-badge " + section.badge}>{section.badgeLabel}</span>
                  </div>
                  <div className="ex-detail">
                    {ex.duration} · <span className="ex-reps">{ex.equipment}</span>
                  </div>
                </div>
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>

      <div className="preview-actions">
        <button className="btn btn-ghost" onClick={onBack}>Back</button>
        <button className="btn btn-primary" onClick={onStart}>Start</button>
      </div>
    </div>
  );
}

window.PreviewScreen = PreviewScreen;
