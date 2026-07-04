export default function ThemeToggle({ theme, onToggle }) {
  const isDark = theme === 'dark'
  return (
    <button
      onClick={onToggle}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{
        position: 'fixed', top: 20, right: 20, zIndex: 50,
        width: 42, height: 42, borderRadius: '50%',
        background: 'var(--surface-raised)', border: '1px solid var(--border-light)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--text-primary)', fontSize: 18, cursor: 'pointer',
        boxShadow: '0 4px 16px rgba(var(--shadow-color), 0.15)',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.transform = 'scale(1.08)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-light)'; e.currentTarget.style.transform = 'scale(1)' }}
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  )
}
