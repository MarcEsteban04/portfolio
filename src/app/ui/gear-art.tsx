// Drawings of the gear on the Uses page, in the site's palette: each one a
// simple, recognisable picture of the real thing (a 27-inch monitor, a
// Ryzen chip, a dual-fan card, a 65% keyboard…), all on a 200×150 canvas.

export type GearArt = "monitor-main" | "monitor-second" | "cpu" | "gpu" | "ram" | "os" | "keyboard" | "mouse";

const frame = "#1b1d22";
const edge = "rgba(255,255,255,0.14)";

function Monitor({ width, label, hz }: { width: number; label: string; hz: string }) {
  const h = width * 0.56;
  const x = (200 - width) / 2;
  const y = 112 - h;
  return (
    <>
      <defs>
        <linearGradient id={`screen-${label}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1e3a8a" />
          <stop offset="0.55" stopColor="#7c3aed" />
          <stop offset="1" stopColor="#f97316" />
        </linearGradient>
      </defs>
      <rect x="92" y="112" width="16" height="18" fill={frame} />
      <path d="M70 136 Q100 128 130 136 Z" fill={frame} />
      <rect x="66" y="132" width="68" height="6" rx="3" fill="#24272e" />
      <rect x={x} y={y} width={width} height={h} rx="5" fill={frame} stroke={edge} />
      <rect x={x + 4} y={y + 4} width={width - 8} height={h - 10} rx="2" fill={`url(#screen-${label})`} opacity="0.9" />
      <text x={x + width - 9} y={y + h - 16} textAnchor="end" fontSize="9" fontWeight="600" fill="#fff" opacity="0.85">
        {hz}
      </text>
    </>
  );
}

const art: Record<GearArt, React.ReactNode> = {
  "monitor-main": <Monitor width={170} label="main" hz="300Hz" />,
  "monitor-second": <Monitor width={140} label="second" hz="100Hz" />,
  cpu: (
    <>
      <rect x="45" y="20" width="110" height="110" rx="8" fill="#14532d" opacity="0.35" />
      {Array.from({ length: 9 }, (_, i) => (
        <g key={i} fill="#c7a46b">
          <rect x={52 + i * 11} y="24" width="4" height="6" rx="1" />
          <rect x={52 + i * 11} y="120" width="4" height="6" rx="1" />
        </g>
      ))}
      <rect x="55" y="32" width="90" height="86" rx="6" fill="#c9ccd3" />
      <rect x="55" y="32" width="90" height="86" rx="6" fill="url(#ihs)" />
      <defs>
        <linearGradient id="ihs" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.5" />
          <stop offset="1" stopColor="#000" stopOpacity="0.15" />
        </linearGradient>
      </defs>
      <text x="100" y="66" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1f2937" letterSpacing="1">
        RYZEN
      </text>
      <text x="100" y="84" textAnchor="middle" fontSize="16" fontWeight="800" fill="#1f2937">
        5 5600
      </text>
      <text x="100" y="99" textAnchor="middle" fontSize="5.2" fill="#4b5563" letterSpacing="0.4">
        6 CORES · 12 THREADS
      </text>
    </>
  ),
  gpu: (
    <>
      <rect x="14" y="40" width="172" height="70" rx="8" fill={frame} stroke={edge} />
      <rect x="14" y="40" width="172" height="8" rx="4" fill="#dc2626" opacity="0.85" />
      {[62, 138].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy="78" r="26" fill="#0f1013" stroke={edge} />
          {Array.from({ length: 7 }, (_, i) => (
            <path
              key={i}
              d={`M${cx} 78 Q${cx + 14} ${78 - 10} ${cx + 22} 78`}
              stroke="#3a3d45"
              strokeWidth="3"
              fill="none"
              transform={`rotate(${i * (360 / 7)} ${cx} 78)`}
            />
          ))}
          <circle cx={cx} cy="78" r="7" fill="#24272e" stroke="#dc2626" />
        </g>
      ))}
      <rect x="40" y="110" width="110" height="7" fill="#c7a46b" />
      <text x="100" y="134" textAnchor="middle" fontSize="10" fontWeight="700" fill="#e5e7eb" letterSpacing="1.5">
        RX 6600
      </text>
    </>
  ),
  ram: (
    <>
      <rect x="14" y="52" width="172" height="46" rx="4" fill="#1d3b2a" stroke={edge} />
      <rect x="14" y="52" width="172" height="10" rx="3" fill="#0f1013" />
      {Array.from({ length: 8 }, (_, i) => (
        <rect key={i} x={22 + i * 20.5} y="68" width="15" height="18" rx="1.5" fill="#0f1013" />
      ))}
      {Array.from({ length: 34 }, (_, i) => (
        <rect key={i} x={20 + i * 4.9} y="98" width="3" height="8" fill="#c7a46b" />
      ))}
      <rect x="96" y="98" width="6" height="8" fill="#07080a" />
      <text x="100" y="44" textAnchor="middle" fontSize="10" fontWeight="700" fill="#e5e7eb" letterSpacing="1">
        16GB DDR4 · 3200MHz
      </text>
    </>
  ),
  os: (
    <>
      <rect x="22" y="22" width="156" height="104" rx="8" fill={frame} stroke={edge} />
      <rect x="22" y="22" width="156" height="16" rx="8" fill="#24272e" />
      {["#ff5f57", "#febc2e", "#28c840"].map((c, i) => (
        <circle key={c} cx={34 + i * 10} cy="30" r="3" fill={c} />
      ))}
      <g transform="translate(78 54)">
        <rect width="20" height="20" rx="1.5" fill="#3b82f6" />
        <rect x="23" width="20" height="20" rx="1.5" fill="#3b82f6" />
        <rect y="23" width="20" height="20" rx="1.5" fill="#3b82f6" />
        <rect x="23" y="23" width="20" height="20" rx="1.5" fill="#3b82f6" />
      </g>
      <rect x="22" y="114" width="156" height="12" fill="#24272e" />
    </>
  ),
  keyboard: (
    <>
      <rect x="8" y="42" width="184" height="72" rx="8" fill={frame} stroke={edge} />
      {[0, 1, 2, 3].map((row) =>
        Array.from({ length: 15 - (row === 3 ? 6 : 0) }, (_, i) => {
          const w = row === 3 && i === 3 ? 58 : 10;
          const x = 15 + i * 11.6 + (row === 3 && i > 3 ? 48 : 0) + (row % 2) * 3;
          return <rect key={`${row}-${i}`} x={x} y={50 + row * 15} width={w} height="11" rx="2" fill={i === 0 && row === 0 ? "#c7a46b" : "#2a2d35"} />;
        }),
      )}
      <rect x="8" y="110" width="184" height="4" rx="2" fill="#7c3aed" opacity="0.6" />
    </>
  ),
  mouse: (
    <>
      <ellipse cx="100" cy="128" rx="40" ry="6" fill="#000" opacity="0.35" />
      <path d="M100 22 C130 22 140 52 140 80 C140 112 124 126 100 126 C76 126 60 112 60 80 C60 52 70 22 100 22 Z" fill={frame} stroke={edge} />
      <path d="M100 22 L100 62" stroke="#3a3d45" strokeWidth="2" />
      <rect x="96" y="34" width="8" height="16" rx="4" fill="#2a2d35" stroke="#7c3aed" />
      <path d="M62 70 Q100 78 138 70" stroke="#2a2d35" strokeWidth="1.5" fill="none" />
      <circle cx="100" cy="104" r="3" fill="#7c3aed" opacity="0.8" />
    </>
  ),
};

export function GearPicture({ kind, className }: { kind: GearArt; className?: string }) {
  return (
    <svg viewBox="0 0 200 150" role="img" aria-hidden className={className}>
      {art[kind]}
    </svg>
  );
}
