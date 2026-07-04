const STAGES = [
  { id: 'hr', label: 'HR Round', name: 'Kylie Jenner', role: 'HR Manager', glyph: 'H' },
  { id: 'technical', label: 'Technical', name: 'Lisa Chen', role: 'Project Manager', glyph: 'T' },
  { id: 'coding', label: 'Coding', name: 'Live IDE', role: 'Auto-graded', glyph: '{ }' },
  { id: 'teamlead', label: 'Final Round', name: 'Mark Rodriguez', role: 'Team Lead', glyph: 'F' },
]

export default function PanelRail({ currentStage, scores, compact = false }) {
  const scoreFor = (stageId) => scores?.find(s => s.stage === stageId)?.score
  const currentIndex = STAGES.findIndex(s => s.id === currentStage)
  const nodeSize = compact ? 30 : 40
  const gapAfter = compact ? 10 : 28

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {STAGES.map((stage, i) => {
        const score = scoreFor(stage.id)
        const isDone = score !== undefined
        const isActive = stage.id === currentStage
        const isPending = !isDone && !isActive

        return (
          <div key={stage.id} style={{ display: 'flex', gap: compact ? 10 : 14 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div
                className="mono"
                style={{
                  width: nodeSize, height: nodeSize, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: compact ? 11 : 13, fontWeight: 600,
                  background: isDone ? 'var(--positive-dim)' : isActive ? 'var(--accent-dim)' : 'var(--surface-alt)',
                  color: isDone ? 'var(--positive)' : isActive ? 'var(--accent)' : 'var(--text-faint)',
                  border: `1.5px solid ${isDone ? 'var(--positive)' : isActive ? 'var(--accent)' : 'var(--border-light)'}`,
                  animation: isActive ? 'pulse-ring 2s infinite' : 'none',
                  flexShrink: 0,
                  transition: 'all 0.3s ease',
                }}
              >
                {isDone ? '✓' : stage.glyph}
              </div>
              {i < STAGES.length - 1 && (
                <div style={{
                  width: 2, flex: 1, minHeight: compact ? 14 : 28,
                  background: i < currentIndex ? 'var(--positive)' : 'var(--border)',
                  opacity: i < currentIndex ? 0.6 : 1,
                }} />
              )}
            </div>

            <div style={{ paddingBottom: gapAfter, opacity: isPending ? 0.5 : 1 }}>
              {!compact && (
                <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-faint)', marginBottom: 2 }}>
                  {stage.label}
                </div>
              )}
              {compact ? (
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
                  {stage.name} <span style={{ fontSize: 11.5, color: 'var(--text-muted)', fontWeight: 400 }}>· {stage.role}</span>
                </div>
              ) : (
                <>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{stage.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{stage.role}</div>
                </>
              )}
              {isDone && (
                <div className="mono" style={{ fontSize: 13, color: 'var(--positive)', marginTop: 4, fontWeight: 600 }}>
                  {score.toFixed(1)}/10
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}