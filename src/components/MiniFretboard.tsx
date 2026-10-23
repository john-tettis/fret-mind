import React from 'react';
import { GUITAR_STRINGS, parseFretPositions } from '../utils/guitarTheory';

interface MiniFretboardProps {
  fretPositions: (number | null)[] | string[];
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const STRING_NAMES = ['E', 'A', 'D', 'G', 'B', 'e'];

export const MiniFretboard: React.FC<MiniFretboardProps> = ({
  fretPositions: rawPositions,
  className = '',
  size = 'md',
}) => {
  const positions = parseFretPositions(rawPositions);

  // Active frets that are actually pressed (> 0)
  const activeFrets = positions.filter((f): f is number => f !== null && f > 0);
  const minActive = activeFrets.length > 0 ? Math.min(...activeFrets) : 1;
  const maxActive = activeFrets.length > 0 ? Math.max(...activeFrets) : 4;

  const startFret = minActive <= 3 ? 1 : minActive;
  const fretCount = Math.max(4, Math.min(5, maxActive - startFret + 1));
  const frets = Array.from({ length: fretCount }, (_, i) => startFret + i);

  // Sizing dimensions
  const isSmall = size === 'sm';
  const isLarge = size === 'lg';

  const width = isSmall ? 104 : isLarge ? 144 : 124;
  const height = isSmall ? 88 : isLarge ? 120 : 104;

  const leftPad = 26;
  const rightPad = 14;
  const topPad = 22;
  const botPad = 18;

  const neckWidth = width - leftPad - rightPad;
  const neckHeight = height - topPad - botPad;

  // 6 strings from low E (index 0) to high E (index 5)
  const stringX = (idx: number) => leftPad + (idx * neckWidth) / 5;
  const fretY = (idx: number) => topPad + (idx * neckHeight) / fretCount;

  return (
    <div
      className={`inline-flex flex-col items-center bg-[#0d0d11] p-1.5 rounded-xl border border-white/[0.06] select-none shadow-inner ${className}`}
    >
      <svg width={width} height={height} className="select-none overflow-visible">
        {/* Fret Position Badge if not open position */}
        {startFret > 1 && (
          <g>
            <rect
              x="2"
              y={topPad + 2}
              width="20"
              height="16"
              rx="4"
              fill="#1e1813"
              stroke="#3d3126"
              strokeWidth="0.8"
            />
            <text
              x="12"
              y={topPad + 13}
              textAnchor="middle"
              fill="#d4af37"
              fontSize="9"
              fontFamily="monospace"
              fontWeight="bold"
            >
              {startFret}fr
            </text>
          </g>
        )}

        {/* Nut Line (Aged Bone if startFret === 1, fret wire otherwise) */}
        {startFret === 1 ? (
          <line
            x1={stringX(0) - 2}
            y1={topPad}
            x2={stringX(5) + 2}
            y2={topPad}
            stroke="#e3dac9"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
        ) : (
          <line
            x1={stringX(0)}
            y1={topPad}
            x2={stringX(5)}
            y2={topPad}
            stroke="#5c5045"
            strokeWidth="1.5"
          />
        )}

        {/* Fret wire lines */}
        {frets.map((_, i) => (
          <line
            key={`wire-${i}`}
            x1={stringX(0)}
            y1={fretY(i + 1)}
            x2={stringX(5)}
            y2={fretY(i + 1)}
            stroke="#473e35"
            strokeWidth="1.2"
          />
        ))}

        {/* Strings (Variable gauges from thick Low E to thin High E) */}
        {GUITAR_STRINGS.map((str, i) => (
          <line
            key={`str-${i}`}
            x1={stringX(i)}
            y1={topPad}
            x2={stringX(i)}
            y2={fretY(fretCount)}
            stroke={str.isWound ? '#b8860b' : '#cbd5e1'}
            strokeWidth={str.gauge * (isSmall ? 0.45 : 0.6)}
          />
        ))}

        {/* Status markers above Nut: Muted (✕) or Open (○) */}
        {positions.map((fret, i) => {
          const x = stringX(i);
          if (fret === null) {
            return (
              <text
                key={`mute-${i}`}
                x={x}
                y="14"
                textAnchor="middle"
                fill="#ef4444"
                fontSize="11"
                fontWeight="900"
                fontFamily="system-ui, sans-serif"
              >
                ✕
              </text>
            );
          }
          if (fret === 0) {
            return (
              <circle
                key={`open-${i}`}
                cx={x}
                cy="10"
                r="3.5"
                fill="none"
                stroke="#10b981"
                strokeWidth="1.8"
              />
            );
          }
          return null;
        })}

        {/* Fretted Dots (Active Finger Positions) */}
        {positions.map((fret, i) => {
          if (fret === null || fret === 0) return null;
          const fretIdx = frets.indexOf(fret);
          if (fretIdx === -1) return null;

          const cx = stringX(i);
          const prevY = fretIdx === 0 ? topPad : fretY(fretIdx);
          const nextY = fretY(fretIdx + 1);
          const cy = (prevY + nextY) / 2;

          return (
            <g key={`dot-${i}`}>
              {/* Outer soft glow */}
              <circle cx={cx} cy={cy} r="6.5" fill="#f59e0b" opacity="0.35" />
              {/* Core dot */}
              <circle
                cx={cx}
                cy={cy}
                r={isSmall ? 4.5 : 5.5}
                fill="#d97706"
                stroke="#fffdfa"
                strokeWidth="1.2"
              />
            </g>
          );
        })}

        {/* String Letter Labels on Bottom */}
        {STRING_NAMES.map((name, i) => (
          <text
            key={`name-${i}`}
            x={stringX(i)}
            y={height - 3}
            textAnchor="middle"
            fill="#736556"
            fontSize="8"
            fontFamily="monospace"
            fontWeight="bold"
          >
            {name}
          </text>
        ))}
      </svg>
    </div>
  );
};
