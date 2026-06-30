type NetworkNode = {
  id: string
  x: number
  y: number
  radius: number
  delay: number
}

type NetworkLink = {
  id: string
  path: string
  opacity: number
  duration: number
  delay: number
}

type Particle = {
  id: string
  x: number
  y: number
  size: number
  duration: number
  delay: number
  blur: number
  opacity: number
}

const nodes: NetworkNode[] = [
  { id: 'l1', x: 10, y: 16, radius: 1.4, delay: 0.2 },
  { id: 'l2', x: 18, y: 24, radius: 1.1, delay: 1.1 },
  { id: 'l3', x: 12, y: 37, radius: 1.2, delay: 1.7 },
  { id: 'l4', x: 22, y: 46, radius: 1.35, delay: 0.8 },
  { id: 'l5', x: 9, y: 62, radius: 1.05, delay: 2.4 },
  { id: 'l6', x: 19, y: 74, radius: 1.25, delay: 1.5 },
  { id: 'l7', x: 26, y: 18, radius: 0.95, delay: 2.1 },
  { id: 'l8', x: 24, y: 84, radius: 1.1, delay: 0.5 },
  { id: 'r1', x: 90, y: 14, radius: 1.35, delay: 0.3 },
  { id: 'r2', x: 82, y: 26, radius: 1.05, delay: 1.4 },
  { id: 'r3', x: 88, y: 39, radius: 1.2, delay: 2.2 },
  { id: 'r4', x: 79, y: 48, radius: 1.4, delay: 0.9 },
  { id: 'r5', x: 92, y: 64, radius: 1.15, delay: 1.8 },
  { id: 'r6', x: 83, y: 76, radius: 1.25, delay: 0.6 },
  { id: 'r7', x: 75, y: 20, radius: 0.95, delay: 2.7 },
  { id: 'r8', x: 77, y: 84, radius: 1.05, delay: 1.2 },
  { id: 't1', x: 34, y: 11, radius: 0.8, delay: 2.8 },
  { id: 't2', x: 66, y: 12, radius: 0.8, delay: 1.9 },
  { id: 'b1', x: 33, y: 89, radius: 0.85, delay: 0.7 },
  { id: 'b2', x: 67, y: 88, radius: 0.85, delay: 2.5 },
]

const links: NetworkLink[] = [
  { id: 'll-1', path: 'M10 16 Q15 20 18 24', opacity: 0.22, duration: 18, delay: 0.3 },
  { id: 'll-2', path: 'M18 24 Q14 31 12 37', opacity: 0.18, duration: 22, delay: 1.1 },
  { id: 'll-3', path: 'M12 37 Q18 42 22 46', opacity: 0.22, duration: 16, delay: 2.4 },
  { id: 'll-4', path: 'M22 46 Q13 55 9 62', opacity: 0.16, duration: 20, delay: 0.7 },
  { id: 'll-5', path: 'M9 62 Q15 68 19 74', opacity: 0.2, duration: 19, delay: 2.9 },
  { id: 'll-6', path: 'M18 24 Q22 20 26 18', opacity: 0.12, duration: 23, delay: 1.6 },
  { id: 'll-7', path: 'M19 74 Q22 79 24 84', opacity: 0.14, duration: 24, delay: 0.9 },
  { id: 'rr-1', path: 'M90 14 Q86 20 82 26', opacity: 0.21, duration: 18, delay: 0.5 },
  { id: 'rr-2', path: 'M82 26 Q86 33 88 39', opacity: 0.18, duration: 22, delay: 1.5 },
  { id: 'rr-3', path: 'M88 39 Q84 44 79 48', opacity: 0.22, duration: 16, delay: 2.1 },
  { id: 'rr-4', path: 'M79 48 Q87 57 92 64', opacity: 0.15, duration: 20, delay: 0.8 },
  { id: 'rr-5', path: 'M92 64 Q87 70 83 76', opacity: 0.19, duration: 19, delay: 2.8 },
  { id: 'rr-6', path: 'M82 26 Q78 21 75 20', opacity: 0.12, duration: 23, delay: 1.2 },
  { id: 'rr-7', path: 'M83 76 Q80 82 77 84', opacity: 0.14, duration: 24, delay: 0.4 },
  { id: 'tb-1', path: 'M26 18 Q31 12 34 11', opacity: 0.1, duration: 28, delay: 2.2 },
  { id: 'tb-2', path: 'M75 20 Q70 13 66 12', opacity: 0.1, duration: 28, delay: 1.3 },
  { id: 'tb-3', path: 'M24 84 Q28 88 33 89', opacity: 0.1, duration: 26, delay: 1.7 },
  { id: 'tb-4', path: 'M77 84 Q72 87 67 88', opacity: 0.1, duration: 26, delay: 2.6 },
  { id: 'arc-1', path: 'M26 18 Q50 4 75 20', opacity: 0.08, duration: 30, delay: 0.6 },
  { id: 'arc-2', path: 'M24 84 Q50 96 77 84', opacity: 0.08, duration: 32, delay: 2.1 },
  { id: 'arc-3', path: 'M22 46 Q17 50 9 62', opacity: 0.1, duration: 18, delay: 1.4 },
  { id: 'arc-4', path: 'M79 48 Q86 54 92 64', opacity: 0.1, duration: 18, delay: 2.3 },
]

const particles: Particle[] = [
  { id: 'p1', x: 8, y: 18, size: 3, duration: 18, delay: 0, blur: 0.4, opacity: 0.24 },
  { id: 'p2', x: 14, y: 70, size: 2, duration: 22, delay: 1.5, blur: 0.2, opacity: 0.18 },
  { id: 'p3', x: 24, y: 28, size: 2.5, duration: 20, delay: 2.8, blur: 0.6, opacity: 0.15 },
  { id: 'p4', x: 88, y: 18, size: 3, duration: 17, delay: 1.2, blur: 0.4, opacity: 0.2 },
  { id: 'p5', x: 84, y: 74, size: 2.5, duration: 21, delay: 3.4, blur: 0.5, opacity: 0.18 },
  { id: 'p6', x: 74, y: 30, size: 2, duration: 19, delay: 0.8, blur: 0.3, opacity: 0.16 },
  { id: 'p7', x: 29, y: 9, size: 2, duration: 26, delay: 2.2, blur: 0.8, opacity: 0.12 },
  { id: 'p8', x: 70, y: 90, size: 2, duration: 24, delay: 1.1, blur: 0.7, opacity: 0.12 },
  { id: 'p9', x: 6, y: 48, size: 1.5, duration: 16, delay: 0.5, blur: 0.2, opacity: 0.18 },
  { id: 'p10', x: 94, y: 52, size: 1.5, duration: 16, delay: 2.1, blur: 0.2, opacity: 0.18 },
  { id: 'p11', x: 18, y: 90, size: 2.2, duration: 23, delay: 1.7, blur: 0.6, opacity: 0.14 },
  { id: 'p12', x: 82, y: 8, size: 2.2, duration: 23, delay: 3.1, blur: 0.6, opacity: 0.14 },
]

export function SmartNetworkBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <style>{`
        @keyframes smart-network-drift {
          0% { transform: translate3d(0px, 0px, 0px) scale(1); }
          50% { transform: translate3d(0px, -10px, 0px) scale(1.01); }
          100% { transform: translate3d(0px, 0px, 0px) scale(1); }
        }

        @keyframes smart-network-drift-reverse {
          0% { transform: translate3d(0px, 0px, 0px); }
          50% { transform: translate3d(0px, 8px, 0px); }
          100% { transform: translate3d(0px, 0px, 0px); }
        }

        @keyframes smart-node-pulse {
          0%, 100% { opacity: 0.18; transform: scale(1); }
          45% { opacity: 0.4; transform: scale(1.12); }
          55% { opacity: 0.18; transform: scale(1); }
        }

        @keyframes smart-particle-float {
          0% { transform: translate3d(0px, 0px, 0px); opacity: 0; }
          15% { opacity: 1; }
          50% { transform: translate3d(10px, -16px, 0px); opacity: 0.9; }
          100% { transform: translate3d(-6px, -30px, 0px); opacity: 0; }
        }

        @keyframes smart-light-breathe {
          0%, 100% { opacity: 0.22; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(1.04); }
        }
      `}</style>

      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 18% 18%, rgba(42,108,248,0.08), transparent 28%), radial-gradient(circle at 82% 78%, rgba(109,168,255,0.07), transparent 30%), linear-gradient(135deg, #090C12 0%, #0B1018 45%, #111827 100%)',
        }}
      />

      <div
        className="absolute -left-24 top-[-12%] h-[36rem] w-[36rem] rounded-full blur-3xl"
        style={{
          background: 'radial-gradient(circle, rgba(42,108,248,0.16) 0%, rgba(42,108,248,0.04) 38%, transparent 72%)',
          animation: 'smart-light-breathe 18s ease-in-out infinite',
        }}
      />
      <div
        className="absolute -right-28 bottom-[-16%] h-[38rem] w-[38rem] rounded-full blur-3xl"
        style={{
          background: 'radial-gradient(circle, rgba(109,168,255,0.12) 0%, rgba(109,168,255,0.03) 38%, transparent 72%)',
          animation: 'smart-light-breathe 22s ease-in-out infinite reverse',
        }}
      />

      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(9,12,18,0.9) 0%, rgba(9,12,18,0.82) 28%, rgba(9,12,18,0.28) 56%, rgba(9,12,18,0.08) 100%)',
        }}
      />

      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
      >
        <defs>
          <linearGradient id="smart-line-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(42,108,248,0.12)" />
            <stop offset="50%" stopColor="rgba(109,168,255,0.2)" />
            <stop offset="100%" stopColor="rgba(42,108,248,0.08)" />
          </linearGradient>
        </defs>

        <g style={{ animation: 'smart-network-drift 28s ease-in-out infinite' }}>
          {links.map((link) => (
            <g key={link.id}>
              <path
                d={link.path}
                fill="none"
                stroke="rgba(109,168,255,0.14)"
                strokeWidth="0.12"
                strokeLinecap="round"
                opacity={link.opacity}
              />
              <circle r="0.22" fill="rgba(109,168,255,0.55)">
                <animateMotion
                  dur={`${link.duration}s`}
                  begin={`${link.delay}s`}
                  repeatCount="indefinite"
                  path={link.path}
                />
                <animate
                  attributeName="opacity"
                  values="0;0.75;0"
                  dur={`${Math.max(link.duration * 0.55, 8)}s`}
                  begin={`${link.delay}s`}
                  repeatCount="indefinite"
                />
              </circle>
            </g>
          ))}
        </g>

        <g style={{ animation: 'smart-network-drift-reverse 34s ease-in-out infinite' }}>
          {nodes.map((node) => (
            <g key={node.id} transform={`translate(${node.x} ${node.y})`}>
              <circle
                r={node.radius + 0.38}
                fill="rgba(109,168,255,0.06)"
                style={{
                  animation: `smart-node-pulse 8s ease-in-out ${node.delay}s infinite`,
                  transformOrigin: 'center',
                }}
              />
              <circle r={node.radius} fill="rgba(109,168,255,0.38)" />
              <circle r={Math.max(node.radius - 0.5, 0.28)} fill="rgba(255,255,255,0.22)" />
            </g>
          ))}
        </g>
      </svg>

      <div className="absolute inset-0" style={{ animation: 'smart-network-drift 30s ease-in-out infinite' }}>
        {particles.map((particle) => (
          <span
            key={particle.id}
            className="absolute rounded-full"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              background: 'rgba(109,168,255,0.65)',
              filter: `blur(${particle.blur}px)`,
              opacity: particle.opacity,
              animation: `smart-particle-float ${particle.duration}s ease-in-out ${particle.delay}s infinite`,
            }}
          />
        ))}
      </div>

      <div
        className="absolute inset-y-[18%] left-[30%] right-[30%] rounded-[999px]"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(9,12,18,0.92) 0%, rgba(9,12,18,0.82) 46%, rgba(9,12,18,0.08) 100%)',
          filter: 'blur(8px)',
        }}
      />

      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(9,12,18,0.16) 0%, rgba(9,12,18,0.02) 18%, rgba(9,12,18,0) 50%, rgba(9,12,18,0.08) 100%)',
        }}
      />
    </div>
  )
}
