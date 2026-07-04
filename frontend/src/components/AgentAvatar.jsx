const PERSONAS = {
  hr: {
    skin: '#e8b48a', hair: '#3a2318', hairStyle: 'bun', top: '#4fd1c5', topDark: '#2fb3a7',
  },
  technical: {
    skin: '#f0c9a0', hair: '#1a1a1a', hairStyle: 'short-straight', top: '#8b7bd8', topDark: '#6a5bc4', glasses: true,
  },
  teamlead: {
    skin: '#c98a5e', hair: '#161616', hairStyle: 'short-fade', top: '#3b4a63', topDark: '#2a3648', beard: true,
  },
}

export default function AgentAvatar({ stage = 'hr', isSpeaking = false, size = 84 }) {
  const p = PERSONAS[stage] || PERSONAS.hr
  const uid = stage // stable id suffix so multiple instances don't clash on animation names

  return (
    <div style={{ width: size, height: size, position: 'relative' }}>
      <svg viewBox="0 0 100 100" width={size} height={size} style={{ display: 'block' }}>
        <defs>
          <clipPath id={`clip-${uid}`}>
            <circle cx="50" cy="50" r="48" />
          </clipPath>
        </defs>

        <circle cx="50" cy="50" r="49" fill="var(--surface-alt)" stroke={isSpeaking ? 'var(--accent)' : 'var(--border-light)'} strokeWidth="2" style={{ transition: 'stroke 0.2s ease' }} />

        <g clipPath={`url(#clip-${uid})`}>
          {/* shoulders / top */}
          <path d="M 10 100 Q 50 68 90 100 Z" fill={p.top} />
          <path d="M 10 100 Q 50 74 90 100 L 90 82 Q 50 66 10 82 Z" fill={p.topDark} opacity="0.5" />

          {/* neck */}
          <rect x="42" y="58" width="16" height="16" fill={p.skin} />

          {/* head */}
          <ellipse cx="50" cy="42" rx="22" ry="24" fill={p.skin} />

          {/* hair back */}
          {p.hairStyle === 'bun' && <circle cx="50" cy="16" r="7" fill={p.hair} />}

          {/* ears */}
          <circle cx="28" cy="44" r="4" fill={p.skin} />
          <circle cx="72" cy="44" r="4" fill={p.skin} />

          {/* hair front */}
          {p.hairStyle === 'bun' && (
            <path d="M 28 32 Q 30 12 50 12 Q 70 12 72 32 Q 72 20 50 20 Q 28 20 28 32 Z" fill={p.hair} />
          )}
          {p.hairStyle === 'short-straight' && (
            <path d="M 26 34 Q 26 10 50 10 Q 74 10 74 34 Q 74 24 50 22 Q 26 24 26 34 Z" fill={p.hair} />
          )}
          {p.hairStyle === 'short-fade' && (
            <path d="M 27 30 Q 28 11 50 11 Q 72 11 73 30 Q 73 18 50 17 Q 27 18 27 30 Z" fill={p.hair} />
          )}

          {/* beard */}
          {p.beard && (
            <path d="M 30 42 Q 30 60 50 62 Q 70 60 70 42 Q 70 52 50 54 Q 30 52 30 42 Z" fill={p.hair} opacity="0.85" />
          )}

          {/* glasses */}
          {p.glasses && (
            <g stroke="#2a2a2a" strokeWidth="1.8" fill="rgba(255,255,255,0.06)">
              <rect x="32" y="38" width="14" height="10" rx="3" />
              <rect x="54" y="38" width="14" height="10" rx="3" />
              <line x1="46" y1="42" x2="54" y2="42" />
            </g>
          )}

          {/* eyes (blink loop) */}
          <g style={{ transformOrigin: '41px 40px', animation: `blink-eye 4.5s ease-in-out infinite` }}>
            <ellipse cx="41" cy="40" rx="3.4" ry="4" fill="#1c1c1c" />
          </g>
          <g style={{ transformOrigin: '59px 40px', animation: `blink-eye 4.5s ease-in-out infinite` }}>
            <ellipse cx="59" cy="40" rx="3.4" ry="4" fill="#1c1c1c" />
          </g>

          {/* eyebrows */}
          <rect x="36" y="33" width="10" height="2" rx="1" fill={p.hair} opacity="0.8" />
          <rect x="54" y="33" width="10" height="2" rx="1" fill={p.hair} opacity="0.8" />

          {/* nose */}
          <path d="M 50 40 L 48 48 Q 50 50 52 48 Z" fill="rgba(0,0,0,0.12)" />

          {/* mouth (talk loop only while speaking) */}
          <ellipse
            cx="50" cy="56" rx={isSpeaking ? 6 : 5.5} ry={isSpeaking ? 4 : 1.6}
            fill="#7a3b30"
            style={{
              transformOrigin: '50px 56px',
              animation: isSpeaking ? 'talk-mouth 0.35s ease-in-out infinite' : 'none',
              transition: 'ry 0.15s ease',
            }}
          />
        </g>
      </svg>

      <style>{`
        @keyframes blink-eye {
          0%, 90%, 100% { transform: scaleY(1); }
          94% { transform: scaleY(0.1); }
        }
        @keyframes talk-mouth {
          0%, 100% { ry: 2px; }
          50% { ry: 5px; }
        }
      `}</style>
    </div>
  )
}
