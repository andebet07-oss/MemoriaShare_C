import { useRef } from 'react';

/**
 * FramePicker — horizontal scroll strip for magnet frame selection.
 * Sits above the main action buttons in MagnetReview.
 *
 * Props:
 *   frames      Frame[]   — array from framePacks.js
 *   selectedId  string    — currently selected frame id
 *   onSelect    (frame) => void
 */
export default function FramePicker({ frames, selectedId, onSelect }) {
  const scrollRef = useRef(null);

  return (
    <div className="w-full">
      {/* Section label */}
      <p
        className="text-[10px] font-medium mb-2 px-1"
        style={{
          fontFamily: 'Montserrat, sans-serif',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'rgba(201,169,110,0.6)',
        }}
      >
        מסגרת
      </p>

      {/* Scroll row */}
      <div
        ref={scrollRef}
        className="flex gap-2.5 overflow-x-auto"
        dir="rtl"
        style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch', paddingBottom: '2px' }}
      >
        {frames.map((frame) => {
          const isSelected = frame.id === selectedId;
          return (
            <button
              key={frame.id}
              onClick={() => onSelect(frame)}
              className="flex-shrink-0 flex flex-col items-center gap-1.5 active:scale-95 transition-transform duration-150"
              style={{ outline: 'none' }}
            >
              {/* Thumbnail */}
              <div
                style={{
                  width: '52px',
                  height: '68px',
                  borderRadius: '4px',
                  background: frame.previewBg,
                  border: isSelected
                    ? '2px solid rgba(201,169,110,0.9)'
                    : '2px solid rgba(255,255,255,0.1)',
                  boxShadow: isSelected
                    ? '0 0 12px -2px rgba(201,169,110,0.5)'
                    : '0 2px 8px rgba(0,0,0,0.5)',
                  transition: 'border-color 0.18s, box-shadow 0.18s',
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'center',
                  paddingBottom: '8px',
                }}
              >
                {/* Tiny "M" monogram representative of the frame */}
                <span
                  style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: '13px',
                    color: isSelected ? 'rgba(201,169,110,0.9)' : 'rgba(255,255,255,0.28)',
                    lineHeight: 1,
                    transition: 'color 0.18s',
                    userSelect: 'none',
                  }}
                >
                  M
                </span>

                {/* Selected check indicator */}
                {isSelected && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '5px',
                      left: '5px',
                      width: '14px',
                      height: '14px',
                      borderRadius: '50%',
                      background: 'rgba(201,169,110,0.9)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                      <path d="M1.5 4L3.2 5.8L6.5 2.2" stroke="#0a0908" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Label */}
              <span
                style={{
                  fontFamily: 'Heebo, sans-serif',
                  fontSize: '10px',
                  fontWeight: isSelected ? 600 : 400,
                  color: isSelected ? 'rgba(201,169,110,0.9)' : 'rgba(255,255,255,0.38)',
                  transition: 'color 0.18s, font-weight 0.18s',
                  whiteSpace: 'nowrap',
                  userSelect: 'none',
                }}
              >
                {frame.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
