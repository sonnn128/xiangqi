import React, { useEffect, useState } from 'react';
import {
  PIECE_CHARS,
  PIECE_VI_NAMES,
  findGeneral,
} from '../engine/xiangqiEngine.js';

const MARKER_POSITIONS = [
  [2, 1],
  [2, 7],
  [7, 1],
  [7, 7],
  [3, 0],
  [3, 2],
  [3, 4],
  [3, 6],
  [3, 8],
  [6, 0],
  [6, 2],
  [6, 4],
  [6, 6],
  [6, 8],
];

function PieceToken({ piece, isSelected, showViLabels }) {
  const isRed = piece.side === 'red';
  return (
    <div
      className={`xq-piece ${isRed ? 'xq-piece-red' : 'xq-piece-black'} ${
        isSelected ? 'xq-piece-selected' : ''
      }`}
    >
      <div className="xq-piece-rim">
        <div className="xq-piece-face">
          <span className="xq-piece-char">
            {PIECE_CHARS[piece.side][piece.type]}
          </span>
        </div>
      </div>

      {showViLabels && (
        <span
          className="absolute -bottom-1 px-1 rounded text-[9px] font-bold tracking-tight leading-tight z-10"
          style={{
            backgroundColor: isRed ? '#991b1b' : '#1f2937',
            color: '#fef3c7',
          }}
        >
          {PIECE_VI_NAMES[piece.type]}
        </span>
      )}
    </div>
  );
}

function SlidingPiece({
  animatingMove,
  fromCoord,
  toCoord,
  W,
  H,
  CELL,
  showViLabels,
}) {
  const [atTarget, setAtTarget] = useState(false);

  useEffect(() => {
    setAtTarget(false);
    let raf2;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        setAtTarget(true);
      });
    });
    return () => {
      cancelAnimationFrame(raf1);
      if (raf2) cancelAnimationFrame(raf2);
    };
  }, [animatingMove]);

  const curLeft = ((atTarget ? toCoord.x : fromCoord.x) / W) * 100;
  const curTop = ((atTarget ? toCoord.y : fromCoord.y) / H) * 100;

  return (
    <div
      className={`xq-sliding-piece ${atTarget ? 'is-flying' : ''}`}
      style={{
        left: `${curLeft}%`,
        top: `${curTop}%`,
        width: `${(CELL / W) * 100}%`,
        aspectRatio: '1 / 1',
      }}
    >
      <PieceToken
        piece={animatingMove.piece}
        isSelected={false}
        showViLabels={showViLabels}
      />
    </div>
  );
}

function BoardBanner({ kind }) {
  if (!kind) return null;
  const isMate = kind === 'mate';
  return (
    <div className={`xq-banner ${isMate ? 'xq-banner-mate' : 'xq-banner-check'}`}>
      <div className="relative flex flex-col items-center justify-center">
        {isMate && (
          <>
            {/* Bóng chữ loang mở rộng trong khoảng 3s rồi dừng (Energy & Ink ripples) */}
            <img
              src="/images/banner_tuyet_sat.png"
              alt=""
              className="absolute inset-0 w-full h-auto object-contain pointer-events-none xq-mate-ripple-1"
            />
            <img
              src="/images/banner_tuyet_sat.png"
              alt=""
              className="absolute inset-0 w-full h-auto object-contain pointer-events-none xq-mate-ripple-2"
            />
          </>
        )}

        {/* Chữ chính đập xuống với ánh đỏ sắc sảo */}
        <img
          src={isMate ? '/images/banner_tuyet_sat.png' : '/images/banner_chieu.png'}
          alt={isMate ? 'Tuyệt Sát' : 'Chiếu'}
          className={`w-[290px] sm:w-[360px] max-w-[85vw] h-auto object-contain select-none pointer-events-none ${
            isMate ? 'xq-mate-main-text' : 'xq-check-main-text'
          }`}
        />
      </div>
    </div>
  );
}

export function XiangqiBoard({
  board,
  selectedPos,
  legalMoves,
  lastMove,
  hintMove,
  flipped,
  showViLabels,
  animatingMove,
  inCheckSide,
  winner,
  winReason,
  mySide,
  onSquareClick,
  children,
}) {
  const CELL = 64;
  const PAD = 38;
  const W = PAD * 2 + 8 * CELL;
  const H = PAD * 2 + 9 * CELL;

  const toDisplayCoord = (row, col) => {
    const dRow = flipped ? 9 - row : row;
    const dCol = flipped ? 8 - col : col;
    return {
      x: PAD + dCol * CELL,
      y: PAD + dRow * CELL,
    };
  };

  const renderCrosshair = (r, c) => {
    const dCol = flipped ? 8 - c : c;
    const { x, y } = toDisplayCoord(r, c);
    const gap = 4.5;
    const len = 10;
    const paths = [];

    if (dCol > 0) {
      paths.push(`M ${x - gap - len} ${y - gap} L ${x - gap} ${y - gap} L ${x - gap} ${y - gap - len}`);
      paths.push(`M ${x - gap - len} ${y + gap} L ${x - gap} ${y + gap} L ${x - gap} ${y + gap + len}`);
    }
    if (dCol < 8) {
      paths.push(`M ${x + gap + len} ${y - gap} L ${x + gap} ${y - gap} L ${x + gap} ${y - gap - len}`);
      paths.push(`M ${x + gap + len} ${y + gap} L ${x + gap} ${y + gap} L ${x + gap} ${y + gap + len}`);
    }

    return (
      <path
        key={`marker-${r}-${c}`}
        d={paths.join(' ')}
        stroke="var(--board-line)"
        strokeWidth="1.1"
        fill="none"
      />
    );
  };

  /**
   * Dấu nước đi [ ⌜ ⌝ ⌞ ⌟ ] giống hệt trong ảnh mẫu:
   * - variant === 'origin': 4 góc xanh nhỏ tại vị trí xuất phát (kèm số lộ ở giữa cạnh trên nếu ở hàng cuối)
   * - variant === 'piece': 4 góc xanh lớn bao quanh bên ngoài quân cờ vừa đáp xuống / đang chọn
   */
  const renderMoveBrackets = (
    r,
    c,
    variant = 'piece',
    color = '#67c687',
    keyPrefix = 'brk',
    isAnimated = false
  ) => {
    const { x, y } = toDisplayCoord(r, c);
    const isLarge = variant === 'piece';
    const half = isLarge ? 29.5 : 16.5;
    const arm = isLarge ? 11 : 7;
    const strokeW = isLarge ? 2.9 : 2.1;

    const d = [
      // Top-left
      `M ${x - half} ${y - half + arm} L ${x - half} ${y - half} L ${x - half + arm} ${y - half}`,
      // Top-right
      `M ${x + half - arm} ${y - half} L ${x + half} ${y - half} L ${x + half} ${y - half + arm}`,
      // Bottom-left
      `M ${x - half} ${y + half - arm} L ${x - half} ${y + half} L ${x - half + arm} ${y + half}`,
      // Bottom-right
      `M ${x + half - arm} ${y + half} L ${x + half} ${y + half} L ${x + half} ${y + half - arm}`,
    ].join(' ');

    // Nếu là ô xuất phát trống trên hàng cuối (row 0 hoặc row 9), hiển thị số lộ (như số 8 giữa 2 góc trên trong ảnh)
    const showBackRankFileNum =
      !isLarge && (r === 0 || r === 9) && !board[r][c];
    const fileNum = r === 0 ? c + 1 : 9 - c;
    const dRow = flipped ? 9 - r : r;
    const numY = dRow === 0 ? y - half + 4 : y + half + 2;

    return (
      <g
        key={`${keyPrefix}-${r}-${c}`}
        className={isAnimated ? 'xq-bracket-pulse' : ''}
        style={isAnimated ? { transformOrigin: `${x}px ${y}px` } : undefined}
      >
        <path
          d={d}
          stroke={color}
          strokeWidth={strokeW}
          fill="none"
          strokeLinecap="square"
          strokeLinejoin="miter"
        />
        {showBackRankFileNum && (
          <text
            x={x}
            y={numY}
            textAnchor="middle"
            fill="#b6b07d"
            style={{
              fontFamily: "'Be Vietnam Pro', sans-serif",
              fontSize: '14px',
              fontWeight: 700,
            }}
          >
            {fileNum}
          </text>
        )}
      </g>
    );
  };

  const isCheckmateBanner =
    Boolean(winner) &&
    winner !== 'draw' &&
    /chiếu|tuyệt|sát|hết nước/i.test(winReason || '');

  const bannerKind = isCheckmateBanner
    ? 'mate'
    : inCheckSide && !winner
      ? 'check'
      : null;

  const lastMoveColor = mySide && mySide !== 'spectator' && lastMove?.piece?.side !== mySide
    ? '#ef4444'
    : '#67c687';

  const checkedKing =
    inCheckSide && !winner && !animatingMove
      ? findGeneral(board, inCheckSide)
      : null;

  return (
    <div className="relative flex items-center justify-center select-none">
      <div
        className={`relative rounded-[16px] overflow-hidden xq-board-frame ${
          bannerKind === 'mate' ? 'xq-board-tremor' : ''
        }`}
        style={{
          width: 'min(88vw, 550px)',
          aspectRatio: `${W} / ${H}`,
          background: 'radial-gradient(ellipse 75% 65% at 50% 46%, #28543f 0%, #173b2c 50%, #071710 100%)',
        }}
      >
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-full block"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* 1. Tâm sáng ở giữa bàn cờ (sông & trung lộ) tỏa dần ra viền tạo hiệu ứng chỗ sáng chỗ trầm */}
            <radialGradient id="boardCenterGlow" cx="50%" cy="46%" r="65%" fx="50%" fy="42%">
              <stop offset="0%" stopColor="#2e634b" stopOpacity="1" />
              <stop offset="35%" stopColor="#204c38" stopOpacity="1" />
              <stop offset="68%" stopColor="#122f23" stopOpacity="1" />
              <stop offset="90%" stopColor="#0a1d15" stopOpacity="1" />
              <stop offset="100%" stopColor="#05120c" stopOpacity="1" />
            </radialGradient>

            {/* 2. Vệt sáng mềm từ trên rọi xuống */}
            <radialGradient id="boardTopLight" cx="50%" cy="5%" r="65%" fx="50%" fy="0%">
              <stop offset="0%" stopColor="#4a8b6b" stopOpacity="0.42" />
              <stop offset="45%" stopColor="#25553e" stopOpacity="0.16" />
              <stop offset="100%" stopColor="#081811" stopOpacity="0" />
            </radialGradient>

            {/* 3. Độ trầm (vignette shadow) hai bên sườn trái/phải theo chiều ngang */}
            <linearGradient id="boardFlankShadow" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#030c08" stopOpacity="0.68" />
              <stop offset="12%" stopColor="#05130d" stopOpacity="0.32" />
              <stop offset="28%" stopColor="#081d14" stopOpacity="0" />
              <stop offset="72%" stopColor="#081d14" stopOpacity="0" />
              <stop offset="88%" stopColor="#05130d" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#030c08" stopOpacity="0.68" />
            </linearGradient>

            {/* 4. Độ trầm dọc: 4 góc và viền đáy trầm tối */}
            <linearGradient id="boardVerticalShadow" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#030c08" stopOpacity="0.45" />
              <stop offset="10%" stopColor="#05130d" stopOpacity="0" />
              <stop offset="82%" stopColor="#05130d" stopOpacity="0" />
              <stop offset="95%" stopColor="#030b07" stopOpacity="0.52" />
              <stop offset="100%" stopColor="#010604" stopOpacity="0.82" />
            </linearGradient>

            {/* 5. Hiệu ứng viền vát sáng cạnh 3D bo góc bàn cờ */}
            <linearGradient id="boardBorderBezel" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#94d7b3" stopOpacity="0.35" />
              <stop offset="60%" stopColor="#3b7256" stopOpacity="0.10" />
              <stop offset="100%" stopColor="#071810" stopOpacity="0.50" />
            </linearGradient>
          </defs>

          {/* Các lớp ánh sáng bàn cờ chỗ sáng chỗ trầm giống mẫu */}
          <rect width={W} height={H} rx="16" fill="url(#boardCenterGlow)" />
          <rect width={W} height={H} rx="16" fill="url(#boardTopLight)" />
          <rect width={W} height={H} rx="16" fill="url(#boardFlankShadow)" />
          <rect width={W} height={H} rx="16" fill="url(#boardVerticalShadow)" />
          <rect
            x="0.75"
            y="0.75"
            width={W - 1.5}
            height={H - 1.5}
            rx="15.5"
            fill="none"
            stroke="url(#boardBorderBezel)"
            strokeWidth="1.5"
          />

          <rect
            x={PAD}
            y={PAD}
            width={8 * CELL}
            height={9 * CELL}
            fill="none"
            stroke="var(--board-line)"
            strokeWidth="1.25"
          />

          {Array.from({ length: 10 }).map((_, r) => (
            <line
              key={`h-${r}`}
              x1={PAD}
              y1={PAD + r * CELL}
              x2={PAD + 8 * CELL}
              y2={PAD + r * CELL}
              stroke="var(--board-line)"
              strokeWidth="1.2"
            />
          ))}

          {Array.from({ length: 7 }).map((_, idx) => {
            const c = idx + 1;
            const x = PAD + c * CELL;
            return (
              <g key={`v-${c}`} stroke="var(--board-line)" strokeWidth="1.2">
                <line x1={x} y1={PAD} x2={x} y2={PAD + 4 * CELL} />
                <line x1={x} y1={PAD + 5 * CELL} x2={x} y2={PAD + 9 * CELL} />
              </g>
            );
          })}

          <g stroke="var(--board-line)" strokeWidth="1.2">
            <line
              x1={PAD + 3 * CELL}
              y1={PAD}
              x2={PAD + 5 * CELL}
              y2={PAD + 2 * CELL}
            />
            <line
              x1={PAD + 5 * CELL}
              y1={PAD}
              x2={PAD + 3 * CELL}
              y2={PAD + 2 * CELL}
            />
            <line
              x1={PAD + 3 * CELL}
              y1={PAD + 7 * CELL}
              x2={PAD + 5 * CELL}
              y2={PAD + 9 * CELL}
            />
            <line
              x1={PAD + 5 * CELL}
              y1={PAD + 7 * CELL}
              x2={PAD + 3 * CELL}
              y2={PAD + 9 * CELL}
            />
          </g>

          {MARKER_POSITIONS.map(([r, c]) => renderCrosshair(r, c))}

          <text
            x={W / 2}
            y={PAD + 4.5 * CELL + 6}
            textAnchor="middle"
            fill="var(--river-text)"
            style={{
              fontFamily: "'Dancing Script', 'Cormorant Garamond', 'LXGW WenKai TC', cursive",
              fontSize: '21px',
              fontStyle: 'italic',
              fontWeight: 600,
              letterSpacing: '0.04em',
              opacity: bannerKind ? 0.18 : 0.85,
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.6)',
            }}
          >
            Vô Danh Kỳ Hữu
          </text>

          {/* Dấu nước đi vừa đánh (ô đi & ô đến) có hiệu ứng nhấp nhổm phóng to thu nhỏ */}
          {lastMove && (
            <>
              {renderMoveBrackets(
                lastMove.from.row,
                lastMove.from.col,
                'origin',
                lastMoveColor,
                'last-from',
                true
              )}
              {!animatingMove &&
                renderMoveBrackets(
                  lastMove.to.row,
                  lastMove.to.col,
                  'piece',
                  lastMoveColor,
                  'last-to',
                  true
                )}
            </>
          )}

          {/* Khung góc xanh quanh quân đang được nhấn chọn */}
          {selectedPos &&
            renderMoveBrackets(
              selectedPos.row,
              selectedPos.col,
              'piece',
              '#76e89d',
              'selected',
              true
            )}

          {/* Gợi ý nước đi */}
          {hintMove && (
            <>
              {renderMoveBrackets(
                hintMove.from.row,
                hintMove.from.col,
                'piece',
                '#fbbf24',
                'hint-from'
              )}
              {renderMoveBrackets(
                hintMove.to.row,
                hintMove.to.col,
                'origin',
                '#fbbf24',
                'hint-to'
              )}
            </>
          )}
        </svg>

        <div className="absolute inset-0">
          {animatingMove && (
            <SlidingPiece
              animatingMove={animatingMove}
              fromCoord={toDisplayCoord(
                animatingMove.from.row,
                animatingMove.from.col
              )}
              toCoord={toDisplayCoord(
                animatingMove.to.row,
                animatingMove.to.col
              )}
              W={W}
              H={H}
              CELL={CELL}
              showViLabels={showViLabels}
            />
          )}

          {Array.from({ length: 10 }).map((_, r) =>
            Array.from({ length: 9 }).map((__, c) => {
              const isAnimatingDest =
                animatingMove?.to.row === r && animatingMove?.to.col === c;
              const isAnimatingSource =
                animatingMove?.from.row === r && animatingMove?.from.col === c;
              const piece = isAnimatingDest || isAnimatingSource ? null : board[r][c];

              const { x, y } = toDisplayCoord(r, c);
              const leftPct = (x / W) * 100;
              const topPct = (y / H) * 100;

              const isSelected =
                selectedPos?.row === r && selectedPos?.col === c;
              const isLegalTarget = legalMoves.some(
                (m) => m.row === r && m.col === c
              );
              const isCheckedKing =
                checkedKing?.row === r && checkedKing?.col === c;

              return (
                <div
                  key={`cell-${r}-${c}`}
                  onClick={() => onSquareClick(r, c)}
                  className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center cursor-pointer"
                  style={{
                    left: `${leftPct}%`,
                    top: `${topPct}%`,
                    width: `${(CELL / W) * 100}%`,
                    aspectRatio: '1 / 1',
                    zIndex: isSelected || isCheckedKing ? 25 : piece ? 20 : 10,
                  }}
                >
                  {isAnimatingDest && animatingMove && (
                    <div className="xq-land-ripple" />
                  )}

                  {isCheckedKing && <div className="xq-check-ring" />}

                  {piece && (
                    <PieceToken
                      piece={piece}
                      isSelected={isSelected}
                      showViLabels={showViLabels}
                    />
                  )}

                  {isLegalTarget && !piece && (
                    <div
                      className="w-[16%] h-[16%] rounded-full transition-transform hover:scale-125"
                      style={{
                        backgroundColor: 'var(--move-dot)',
                      }}
                    />
                  )}

                  {isLegalTarget && piece && (
                    <div
                      className="absolute w-[90%] h-[90%] rounded-full pointer-events-none"
                      style={{
                        border: '2px solid var(--move-dot)',
                      }}
                    />
                  )}
                </div>
              );
            })
          )}
        </div>

        <BoardBanner kind={bannerKind} />
        {children}
      </div>
    </div>
  );
}
