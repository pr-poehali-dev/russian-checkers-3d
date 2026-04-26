import { useState, useEffect, useCallback, useRef } from "react";
import Icon from "@/components/ui/icon";

type Section = "menu" | "game" | "profile" | "friends" | "chat" | "shop" | "settings" | "leaderboard";
type Pieces = Record<string, "white" | "black" | "white-queen" | "black-queen">;

const NAV_ITEMS = [
  { id: "menu", icon: "Home", label: "Меню" },
  { id: "game", icon: "Gamepad2", label: "Игра" },
  { id: "profile", icon: "User", label: "Профиль" },
  { id: "friends", icon: "Users", label: "Друзья" },
  { id: "chat", icon: "MessageSquare", label: "Чат" },
  { id: "shop", icon: "ShoppingBag", label: "Магазин" },
  { id: "settings", icon: "Settings", label: "Настройки" },
  { id: "leaderboard", icon: "Trophy", label: "Рейтинг" },
] as const;

// ===================== MENU =====================
function MenuSection({ onNavigate }: { onNavigate: (s: Section) => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 animate-fade-in relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-neon-cyan/5 blur-[120px]" />
        <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-neon-purple/5 blur-[100px]" />
      </div>
      <div className="relative z-10 text-center mb-12">
        <div className="inline-block px-3 py-1 mb-4 border border-neon-cyan/30 text-neon-cyan text-xs font-mono tracking-widest">ОНЛАЙН ШАШКИ v2.0</div>
        <h1 className="font-orbitron text-6xl md:text-8xl font-black neon-text mb-2">
          CHECK<span className="text-neon-purple" style={{textShadow:'0 0 10px #9b30ff,0 0 20px #9b30ff'}}>MATE</span>
        </h1>
        <p className="font-rajdhani text-xl text-muted-foreground tracking-widest uppercase">Играй. Побеждай. Доминируй.</p>
      </div>
      <div className="relative z-10 grid grid-cols-1 gap-4 w-full max-w-md mb-8">
        <button onClick={() => onNavigate("game")} className="neon-btn-primary px-8 py-5 text-xl rounded cursor-pointer">⚡ НАЧАТЬ ИГРУ</button>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => onNavigate("game")} className="neon-btn px-4 py-3 text-sm rounded cursor-pointer">VS ИГРОК</button>
          <button onClick={() => onNavigate("game")} className="neon-btn-purple px-4 py-3 text-sm rounded cursor-pointer">VS БОТ</button>
        </div>
      </div>
      <div className="relative z-10 grid grid-cols-3 gap-3 w-full max-w-md">
        {([
          { label: "Рейтинг", icon: "Trophy", id: "leaderboard" as Section },
          { label: "Магазин", icon: "ShoppingBag", id: "shop" as Section },
          { label: "Профиль", icon: "User", id: "profile" as Section },
        ]).map((item) => (
          <button key={item.id} onClick={() => onNavigate(item.id)} className="neon-card flex flex-col items-center gap-2 p-4 rounded cursor-pointer">
            <Icon name={item.icon} fallback="Home" size={20} className="text-neon-cyan" />
            <span className="font-rajdhani text-xs tracking-widest uppercase text-gray-400">{item.label}</span>
          </button>
        ))}
      </div>
      <div className="relative z-10 mt-10 flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="glow-dot" />
          <span className="font-mono text-xs text-neon-green">2,847 онлайн</span>
        </div>
        <div className="w-px h-4 bg-dark-border" />
        <span className="font-mono text-xs text-muted-foreground">Сервер: EU-WEST</span>
      </div>
    </div>
  );
}

// ===================== GAME LOGIC =====================
function initBoard(): Pieces {
  const board: Pieces = {};
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if ((row + col) % 2 === 1) {
        if (row < 3) board[`${row}-${col}`] = "black";
        else if (row > 4) board[`${row}-${col}`] = "white";
      }
    }
  }
  return board;
}

function colorOf(p: string): "white" | "black" {
  return p.startsWith("white") ? "white" : "black";
}

function isQueen(p: string): boolean {
  return p.endsWith("-queen");
}

// Получаем все обычные ходы для фишки
function getSimpleMoves(pieces: Pieces, key: string): string[] {
  const piece = pieces[key];
  if (!piece) return [];
  const color = colorOf(piece);
  const queen = isQueen(piece);
  const [r, c] = key.split("-").map(Number);
  const dirs = queen
    ? [[-1,-1],[-1,1],[1,-1],[1,1]]
    : color === "white" ? [[-1,-1],[-1,1]] : [[1,-1],[1,1]];
  return dirs
    .map(([dr, dc]) => `${r+dr}-${c+dc}`)
    .filter((k) => {
      const [nr, nc] = k.split("-").map(Number);
      return nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && !pieces[k];
    });
}

// Получаем все прыжки (захваты) для фишки
function getCaptures(pieces: Pieces, key: string): { to: string; captured: string }[] {
  const piece = pieces[key];
  if (!piece) return [];
  const color = colorOf(piece);
  const queen = isQueen(piece);
  const [r, c] = key.split("-").map(Number);
  const dirs = queen
    ? [[-1,-1],[-1,1],[1,-1],[1,1]]
    : color === "white" ? [[-1,-1],[-1,1]] : [[1,-1],[1,1]];
  const result: { to: string; captured: string }[] = [];
  for (const [dr, dc] of dirs) {
    const midKey = `${r+dr}-${c+dc}`;
    const landKey = `${r+dr*2}-${c+dc*2}`;
    const [lr, lc] = [r+dr*2, c+dc*2];
    const midPiece = pieces[midKey];
    if (midPiece && colorOf(midPiece) !== color && lr >= 0 && lr < 8 && lc >= 0 && lc < 8 && !pieces[landKey]) {
      result.push({ to: landKey, captured: midKey });
    }
  }
  return result;
}

function promoteIfNeeded(pieces: Pieces, key: string): Pieces {
  const p = pieces[key];
  if (!p) return pieces;
  const [r] = key.split("-").map(Number);
  if (p === "white" && r === 0) return { ...pieces, [key]: "white-queen" };
  if (p === "black" && r === 7) return { ...pieces, [key]: "black-queen" };
  return pieces;
}

// Все доступные ходы для цвета (захваты в приоритете)
function getAllMovesForColor(pieces: Pieces, color: "white" | "black"): { from: string; to: string; captured?: string }[] {
  const captures: { from: string; to: string; captured: string }[] = [];
  const simples: { from: string; to: string }[] = [];
  for (const key of Object.keys(pieces)) {
    if (colorOf(pieces[key]) === color) {
      for (const cap of getCaptures(pieces, key)) captures.push({ from: key, ...cap });
      for (const to of getSimpleMoves(pieces, key)) simples.push({ from: key, to });
    }
  }
  return captures.length > 0 ? captures : simples;
}

// ===================== 3D CHECKER PIECE =====================
function Checker3D({ color, isSelected, isQueen: queen }: { color: "white" | "black"; isSelected: boolean; isQueen: boolean }) {
  const isWhite = color === "white";
  return (
    <div className="w-full h-full flex items-center justify-center" style={{perspective: '200px'}}>
      <div
        style={{
          width: '78%',
          height: '78%',
          position: 'relative',
          transformStyle: 'preserve-3d',
          transform: isSelected ? 'rotateX(15deg) translateY(-4px) scale(1.1)' : 'rotateX(12deg)',
          transition: 'transform 0.2s ease',
          cursor: 'pointer',
        }}
      >
        {/* Shadow на доске */}
        <div style={{
          position: 'absolute',
          bottom: '-8px',
          left: '5%',
          width: '90%',
          height: '30%',
          borderRadius: '50%',
          background: 'rgba(0,0,0,0.5)',
          filter: 'blur(4px)',
          transform: 'translateZ(-2px)',
        }} />

        {/* Нижний ободок (толщина фишки) */}
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background: isWhite
            ? 'linear-gradient(180deg, #006080 0%, #003040 100%)'
            : 'linear-gradient(180deg, #3a0070 0%, #1a0035 100%)',
          transform: 'translateZ(-6px) scaleX(0.97)',
          boxShadow: isWhite
            ? '0 0 12px rgba(0,255,255,0.4)'
            : '0 0 12px rgba(155,48,255,0.4)',
        }} />

        {/* Боковая грань */}
        <div style={{
          position: 'absolute',
          inset: '2px',
          borderRadius: '50%',
          background: isWhite
            ? 'linear-gradient(135deg, #00b8cc 0%, #005566 50%, #002233 100%)'
            : 'linear-gradient(135deg, #7020c0 0%, #3a0070 50%, #1a0035 100%)',
          transform: 'translateZ(-3px)',
        }} />

        {/* Верхняя поверхность */}
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background: isWhite
            ? 'radial-gradient(ellipse at 35% 30%, #80ffff 0%, #00e5ff 30%, #00b8cc 60%, #004455 100%)'
            : 'radial-gradient(ellipse at 35% 30%, #cc88ff 0%, #9b30ff 30%, #6010c0 60%, #2a0050 100%)',
          boxShadow: isSelected
            ? isWhite
              ? '0 0 0 3px #00ffff, 0 0 20px #00ffff, 0 0 40px rgba(0,255,255,0.3)'
              : '0 0 0 3px #9b30ff, 0 0 20px #9b30ff, 0 0 40px rgba(155,48,255,0.3)'
            : isWhite
              ? '0 2px 8px rgba(0,255,255,0.3), inset 0 1px 3px rgba(255,255,255,0.3)'
              : '0 2px 8px rgba(155,48,255,0.3), inset 0 1px 3px rgba(255,255,255,0.2)',
          transform: 'translateZ(0px)',
        }}>
          {/* Блик */}
          <div style={{
            position: 'absolute',
            top: '12%',
            left: '18%',
            width: '35%',
            height: '25%',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.35)',
            filter: 'blur(2px)',
          }} />

          {/* Корона для дамки */}
          {queen && (
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              filter: 'drop-shadow(0 0 4px gold)',
            }}>
              👑
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ===================== GAME SECTION =====================
function GameSection() {
  const [pieces, setPieces] = useState<Pieces>(initBoard);
  const [selectedCell, setSelectedCell] = useState<string | null>(null);
  const [currentTurn, setCurrentTurn] = useState<"white" | "black">("white");
  const [autoMode, setAutoMode] = useState(false);
  const [botThinking, setBotThinking] = useState(false);
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [lastCapture, setLastCapture] = useState<string | null>(null);
  const autoRef = useRef(autoMode);
  autoRef.current = autoMode;

  const countPieces = (color: "white" | "black") =>
    Object.values(pieces).filter((v) => colorOf(v) === color).length;

  const applyMoveLogic = useCallback((from: string, to: string, capturedKey: string | undefined, board: Pieces): Pieces => {
    let next = { ...board };
    next[to] = next[from];
    delete next[from];
    if (capturedKey) delete next[capturedKey];
    next = promoteIfNeeded(next, to);
    return next;
  }, []);

  const makeBotMove = useCallback((board: Pieces) => {
    const moves = getAllMovesForColor(board, "black");
    if (!moves.length) return;
    setBotThinking(true);
    setTimeout(() => {
      const move = moves[Math.floor(Math.random() * moves.length)];
      const next = applyMoveLogic(move.from, move.to, move.captured, board);
      setPieces(next);
      setMoveHistory((h) => [`${move.from}→${move.to}`, ...h].slice(0, 8));
      if (move.captured) setLastCapture(move.captured);
      setCurrentTurn("white");
      setBotThinking(false);
    }, 700 + Math.random() * 600);
  }, [applyMoveLogic]);

  useEffect(() => {
    if (currentTurn === "black" && !botThinking) {
      makeBotMove(pieces);
    }
  }, [currentTurn, botThinking, pieces, makeBotMove]);

  useEffect(() => {
    if (!autoMode || currentTurn !== "white" || botThinking) return;
    const moves = getAllMovesForColor(pieces, "white");
    if (!moves.length) return;
    const t = setTimeout(() => {
      if (!autoRef.current) return;
      const move = moves[Math.floor(Math.random() * moves.length)];
      const next = applyMoveLogic(move.from, move.to, move.captured, pieces);
      setPieces(next);
      setMoveHistory((h) => [`${move.from}→${move.to}`, ...h].slice(0, 8));
      setCurrentTurn("black");
    }, 700 + Math.random() * 500);
    return () => clearTimeout(t);
  }, [autoMode, currentTurn, pieces, botThinking, applyMoveLogic]);

  // Все доступные ходы и захваты для выбранной фишки
  const allMoves = getAllMovesForColor(pieces, "white");
  const hasMandatoryCapture = allMoves.some((m) => m.captured);

  const cellMoves = selectedCell
    ? allMoves.filter((m) => m.from === selectedCell)
    : [];
  const validTargets = cellMoves.map((m) => m.to);

  const handleCellClick = (key: string) => {
    if (currentTurn !== "white" || botThinking || autoMode) return;

    // Ход на допустимую клетку
    if (validTargets.includes(key) && selectedCell) {
      const move = cellMoves.find((m) => m.to === key);
      if (!move) return;
      const next = applyMoveLogic(move.from, move.to, move.captured, pieces);
      setPieces(next);
      setMoveHistory((h) => [`${move.from}→${move.to}`, ...h].slice(0, 8));
      setSelectedCell(null);
      setCurrentTurn("black");
      return;
    }

    // Выбор своей фишки
    const piece = pieces[key];
    if (piece && colorOf(piece) === "white") {
      // Если есть обязательный захват — выбирать можно только тех, кто может прыгать
      if (hasMandatoryCapture) {
        const canCapture = allMoves.filter((m) => m.captured && m.from === key).length > 0;
        if (!canCapture) return;
      }
      setSelectedCell(key === selectedCell ? null : key);
    } else {
      setSelectedCell(null);
    }
  };

  const resetGame = () => {
    setPieces(initBoard());
    setSelectedCell(null);
    setCurrentTurn("white");
    setMoveHistory([]);
    setBotThinking(false);
    setLastCapture(null);
  };

  const whiteCount = countPieces("white");
  const blackCount = countPieces("black");
  const gameOver = whiteCount === 0 || blackCount === 0 || getAllMovesForColor(pieces, currentTurn).length === 0;

  return (
    <div className="p-4 animate-fade-in">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="neon-card p-3 rounded flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-purple/60 to-purple-900 border-2 border-neon-purple flex items-center justify-center text-xs font-bold text-white">AI</div>
            <div>
              <div className="font-rajdhani font-bold text-white">Бот ALPHA-7</div>
              <div className={`font-mono text-xs ${botThinking ? "text-neon-yellow animate-pulse-neon" : "text-gray-500"}`}>
                {botThinking ? "● думает..." : "● ждёт"}
              </div>
            </div>
            <div className="ml-2 font-orbitron text-xl text-neon-purple font-bold">{blackCount}</div>
          </div>

          <div className={`px-4 py-1 rounded font-orbitron text-xs font-bold ${
            gameOver
              ? "bg-neon-yellow/20 text-neon-yellow border border-neon-yellow"
              : currentTurn === "white"
                ? "bg-neon-cyan/20 text-neon-cyan border border-neon-cyan"
                : "bg-neon-purple/20 text-neon-purple border border-neon-purple"
          }`}>
            {gameOver
              ? (whiteCount > blackCount ? "ВЫ ПОБЕДИЛИ!" : blackCount === 0 ? "ВЫ ПОБЕДИЛИ!" : "БОТ ПОБЕДИЛ")
              : currentTurn === "white"
                ? (autoMode ? "АВТО ХОД" : hasMandatoryCapture ? "⚡ БЕЙ!" : "ВАШ ХОД")
                : "БОТ ДУМАЕТ"}
          </div>

          <div className="neon-card p-3 rounded flex items-center gap-3">
            <div className="font-orbitron text-xl text-neon-cyan font-bold">{whiteCount}</div>
            <div>
              <div className="font-rajdhani font-bold text-white">Вы</div>
              <div className="font-mono text-xs text-neon-green">● играете</div>
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-cyan/40 to-neon-purple/40 border-2 border-neon-cyan flex items-center justify-center text-xs font-bold text-white">ВЫ</div>
          </div>
        </div>

        {/* Board + Sidebar */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            {/* 3D перспектива доски */}
            <div
              className="neon-border rounded p-2 scanner-line"
              style={{
                background: 'linear-gradient(160deg, #0a1825 0%, #060c14 100%)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.8), 0 0 30px rgba(0,255,255,0.1)',
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(8, 1fr)',
                  gap: 0,
                  transformStyle: 'preserve-3d',
                }}
              >
                {Array.from({ length: 8 }, (_, row) =>
                  Array.from({ length: 8 }, (_, col) => {
                    const key = `${row}-${col}`;
                    const isDark = (row + col) % 2 === 1;
                    const piece = pieces[key];
                    const isSelected = selectedCell === key;
                    const isValidTarget = validTargets.includes(key);
                    const isCaptured = key === lastCapture;
                    const isCapturePath = cellMoves.some((m) => m.captured === key && validTargets.includes(m.to));

                    return (
                      <div
                        key={key}
                        onClick={() => handleCellClick(key)}
                        className="aspect-square relative"
                        style={{
                          background: isDark
                            ? isSelected
                              ? 'linear-gradient(135deg, #003d50, #001a22)'
                              : isCapturePath
                                ? 'linear-gradient(135deg, #3d0000, #1a0000)'
                                : 'linear-gradient(135deg, #0d1f2d, #071018)'
                            : 'linear-gradient(135deg, #0a1520, #060c14)',
                          boxShadow: isSelected
                            ? 'inset 0 0 15px rgba(0,255,255,0.3)'
                            : 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {/* Индикатор допустимого хода */}
                        {isValidTarget && isDark && (
                          <div style={{
                            position: 'absolute',
                            width: '35%',
                            height: '35%',
                            borderRadius: '50%',
                            background: 'rgba(0,255,255,0.25)',
                            border: '2px solid rgba(0,255,255,0.6)',
                            boxShadow: '0 0 10px rgba(0,255,255,0.4)',
                            animation: 'pulseNeon 1s ease-in-out infinite',
                            zIndex: 1,
                          }} />
                        )}

                        {/* Индикатор захватываемой фишки */}
                        {isCapturePath && piece && (
                          <div style={{
                            position: 'absolute',
                            inset: '2px',
                            borderRadius: '50%',
                            border: '2px solid rgba(255,51,102,0.8)',
                            boxShadow: '0 0 12px rgba(255,51,102,0.6)',
                            zIndex: 5,
                            pointerEvents: 'none',
                          }} />
                        )}

                        {/* Фишка 3D */}
                        {piece && (
                          <div style={{ position: 'relative', width: '100%', height: '100%', zIndex: 2 }}>
                            <Checker3D
                              color={colorOf(piece)}
                              isSelected={isSelected}
                              isQueen={isQueen(piece)}
                            />
                          </div>
                        )}

                        {/* Координаты */}
                        {col === 0 && (
                          <span style={{position:'absolute',top:2,left:2,fontSize:'8px',fontFamily:'monospace',color:'rgba(0,255,255,0.2)',lineHeight:1}}>
                            {8-row}
                          </span>
                        )}
                        {row === 7 && (
                          <span style={{position:'absolute',bottom:2,right:2,fontSize:'8px',fontFamily:'monospace',color:'rgba(0,255,255,0.2)',lineHeight:1}}>
                            {String.fromCharCode(65+col)}
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Кнопка АВТО РЕЖИМ — левый нижний угол */}
            <button
              onClick={() => setAutoMode((v) => !v)}
              className="absolute bottom-3 left-3 flex items-center gap-2 px-3 py-2 rounded font-orbitron text-xs font-bold transition-all cursor-pointer z-10"
              style={autoMode
                ? {background:'rgba(255,255,0,0.15)', border:'1px solid #ffff00', color:'#ffff00', boxShadow:'0 0 15px rgba(255,255,0,0.3)'}
                : {background:'rgba(10,18,32,0.9)', border:'1px solid #0d3350', color:'#555'}}
            >
              <Icon name="Zap" fallback="Play" size={12} />
              АВТО
            </button>

            {/* Конец игры оверлей */}
            {gameOver && (
              <div style={{position:'absolute',inset:0,background:'rgba(6,12,20,0.85)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',borderRadius:'4px',zIndex:20}}>
                <div className="font-orbitron text-3xl font-black mb-4" style={{
                  color: whiteCount > 0 ? '#00ffff' : '#9b30ff',
                  textShadow: whiteCount > 0 ? '0 0 20px #00ffff' : '0 0 20px #9b30ff',
                }}>
                  {whiteCount > 0 ? "ВЫ ПОБЕДИЛИ!" : "БОТ ПОБЕДИЛ"}
                </div>
                <button onClick={resetGame} className="neon-btn-primary px-8 py-3 rounded font-orbitron text-sm cursor-pointer">НОВАЯ ИГРА</button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="w-48 flex flex-col gap-3">
            <div className="neon-card p-3 rounded">
              <div className="font-orbitron text-xs text-neon-cyan mb-2 tracking-widest">ФИШКИ</div>
              <div className="flex justify-between items-center">
                <div className="text-center">
                  <div className="font-orbitron text-2xl font-bold text-neon-cyan">{whiteCount}</div>
                  <div className="text-xs text-gray-500 font-rajdhani">вы</div>
                </div>
                <div className="text-neon-cyan font-bold text-xl">:</div>
                <div className="text-center">
                  <div className="font-orbitron text-2xl font-bold text-neon-purple">{blackCount}</div>
                  <div className="text-xs text-gray-500 font-rajdhani">бот</div>
                </div>
              </div>
            </div>

            <div className="neon-card p-3 rounded">
              <div className="font-orbitron text-xs text-neon-cyan mb-2 tracking-widest">ХОДЫ</div>
              <div className="flex flex-col gap-1 font-mono text-xs text-gray-400">
                {moveHistory.length === 0 && <div className="text-gray-600">нет ходов</div>}
                {moveHistory.map((move, i) => (
                  <div key={i} className={`flex items-center gap-1 ${i === 0 ? "text-neon-cyan" : ""}`}>
                    <span className="text-gray-600">{moveHistory.length - i}.</span>
                    <span>{move}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="neon-card p-3 rounded">
              <div className="font-orbitron text-xs text-neon-cyan mb-2 tracking-widest">ДЕЙСТВИЯ</div>
              <div className="flex flex-col gap-2">
                <button onClick={resetGame} className="neon-btn text-xs py-2 px-3 rounded w-full cursor-pointer">НОВАЯ ИГРА</button>
                <button className="neon-btn-purple text-xs py-2 px-3 rounded w-full cursor-pointer">НИЧЬЯ</button>
                <button onClick={resetGame} className="neon-btn text-xs py-2 px-3 rounded w-full cursor-pointer">СДАТЬСЯ</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===================== PROFILE =====================
const AVATARS = ["🤖", "🦊", "🐉", "💀", "🦅", "🔮", "⚡", "🛸"];

function ProfileSection() {
  const [editing, setEditing] = useState(false);
  const [nickname, setNickname] = useState("DarkRider_99");
  const [editNick, setEditNick] = useState(nickname);
  const [avatarEmoji, setAvatarEmoji] = useState("🔮");
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  const stats = [
    { label: "ПОБЕДЫ", value: "247", color: "text-neon-green" },
    { label: "ПОРАЖЕНИЯ", value: "89", color: "text-neon-red" },
    { label: "НИЧЬИ", value: "34", color: "text-neon-yellow" },
    { label: "РЕЙТИНГ", value: "2,847", color: "text-neon-cyan" },
  ];

  const saveEdit = () => { setNickname(editNick.trim() || nickname); setEditing(false); };

  return (
    <div className="p-6 animate-fade-in max-w-4xl mx-auto">
      <h2 className="font-orbitron text-2xl neon-text mb-6 tracking-wider">ПРОФИЛЬ ИГРОКА</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="neon-card rounded p-6 flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-neon-cyan/30 to-neon-purple/30 border-2 border-neon-cyan flex items-center justify-center text-5xl">{avatarEmoji}</div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-neon-green rounded-full border-2 border-dark-bg" style={{boxShadow:'0 0 10px #00ff88'}} />
          </div>
          <button onClick={() => setShowAvatarPicker((v) => !v)} className="flex items-center gap-2 neon-btn px-3 py-1.5 text-xs rounded cursor-pointer w-full justify-center">
            <Icon name="Image" fallback="Camera" size={12} />СМЕНИТЬ АВАТАР
          </button>
          {showAvatarPicker && (
            <div className="grid grid-cols-4 gap-2 w-full p-2 bg-dark-bg rounded border border-dark-border animate-fade-in">
              {AVATARS.map((em) => (
                <button key={em} onClick={() => { setAvatarEmoji(em); setShowAvatarPicker(false); }}
                  className={`text-2xl p-1.5 rounded hover:bg-neon-cyan/10 transition-all cursor-pointer ${em === avatarEmoji ? "border border-neon-cyan" : ""}`}>{em}</button>
              ))}
            </div>
          )}
          {editing ? (
            <div className="flex flex-col gap-2 w-full">
              <input value={editNick} onChange={(e) => setEditNick(e.target.value)} maxLength={20}
                className="bg-dark-bg border border-neon-cyan/50 rounded px-3 py-1.5 font-rajdhani text-white text-sm outline-none text-center" />
              <div className="flex gap-2">
                <button onClick={saveEdit} className="neon-btn-primary flex-1 text-xs py-1.5 rounded cursor-pointer">✓</button>
                <button onClick={() => setEditing(false)} className="neon-btn flex-1 text-xs py-1.5 rounded cursor-pointer">✕</button>
              </div>
            </div>
          ) : (
            <div className="text-center w-full">
              <div className="font-orbitron text-xl font-bold text-white">{nickname}</div>
              <div className="font-mono text-xs text-neon-purple mt-1">РАНГ: МАСТЕР II</div>
              <div className="font-mono text-xs text-muted-foreground mt-1">#1,204 в мире</div>
            </div>
          )}
          {!editing && (
            <button onClick={() => { setEditNick(nickname); setEditing(true); }} className="flex items-center gap-2 neon-btn-purple px-3 py-1.5 text-xs rounded cursor-pointer w-full justify-center">
              <Icon name="Pencil" fallback="Edit" size={12} />РЕДАКТИРОВАТЬ
            </button>
          )}
          <div className="w-full">
            <div className="flex justify-between text-xs font-mono mb-1">
              <span className="text-gray-500">До следующего ранга</span><span className="text-neon-cyan">73%</span>
            </div>
            <div className="h-1.5 bg-dark-border rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-neon-cyan to-neon-purple rounded-full" style={{width:"73%"}} />
            </div>
          </div>
          <div className="flex gap-2">
            {["🏆","⚡","🔥","💎"].map((badge, i) => (
              <div key={i} className="w-8 h-8 neon-card rounded flex items-center justify-center text-sm cursor-pointer">{badge}</div>
            ))}
          </div>
        </div>
        <div className="md:col-span-2 grid grid-cols-2 gap-3">
          {stats.map((stat) => (
            <div key={stat.label} className="neon-card rounded p-4">
              <div className="font-orbitron text-xs text-muted-foreground tracking-widest mb-2">{stat.label}</div>
              <div className={`font-orbitron text-3xl font-black ${stat.color}`}>{stat.value}</div>
            </div>
          ))}
          <div className="col-span-2 neon-card rounded p-4">
            <div className="font-orbitron text-xs text-muted-foreground tracking-widest mb-3">ПОСЛЕДНИЕ ИГРЫ</div>
            <div className="flex flex-col gap-2">
              {[
                { opp: "Бот ALPHA-7", result: "WIN", rating: "+18", time: "2 ч назад" },
                { opp: "Бот ALPHA-7", result: "LOSS", rating: "-12", time: "5 ч назад" },
                { opp: "Бот BETA-3", result: "WIN", rating: "+15", time: "вчера" },
                { opp: "Бот OMEGA", result: "DRAW", rating: "0", time: "вчера" },
              ].map((game, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 border-b border-dark-border last:border-0">
                  <span className="font-rajdhani text-sm text-gray-300">{game.opp}</span>
                  <span className={`font-orbitron text-xs font-bold px-2 py-0.5 rounded ${
                    game.result === "WIN" ? "text-neon-green bg-neon-green/10 border border-neon-green/30" :
                    game.result === "LOSS" ? "text-neon-red bg-neon-red/10 border border-neon-red/30" :
                    "text-neon-yellow bg-neon-yellow/10 border border-neon-yellow/30"
                  }`}>{game.result}</span>
                  <span className={`font-mono text-xs ${game.rating.startsWith("+") ? "text-neon-green" : game.rating === "0" ? "text-gray-500" : "text-neon-red"}`}>{game.rating}</span>
                  <span className="font-mono text-xs text-gray-600">{game.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===================== FRIENDS (пустой список) =====================
function FriendsSection() {
  const [search, setSearch] = useState("");
  const [friends, setFriends] = useState<{name:string;rank:string;status:string;game:string;rating:number}[]>([]);
  const [requests, setRequests] = useState<string[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const filtered = friends.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6 animate-fade-in max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-orbitron text-2xl neon-text tracking-wider">ДРУЗЬЯ</h2>
        <div className="flex gap-2">
          <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Никнейм..."
            className="bg-dark-card border border-dark-border focus:border-neon-cyan/50 rounded px-3 py-1.5 font-rajdhani text-white text-xs placeholder:text-gray-600 outline-none transition-colors w-32" />
          <button onClick={() => {
            if (searchInput.trim()) {
              setFriends((f) => [...f, { name: searchInput.trim(), rank: "Новичок", status: "offline", game: "Нет", rating: 1000 }]);
              setSearchInput("");
            }
          }} className="neon-btn px-3 py-1.5 text-xs rounded cursor-pointer">+ ДОБАВИТЬ</button>
        </div>
      </div>

      {friends.length > 0 && (
        <div className="relative mb-4">
          <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neon-cyan/50" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Поиск в списке..."
            className="w-full bg-dark-card border border-dark-border focus:border-neon-cyan/50 rounded px-9 py-2.5 font-rajdhani text-white placeholder:text-gray-600 outline-none transition-colors" />
        </div>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-16 flex flex-col items-center gap-4">
          <div className="text-5xl opacity-30">👥</div>
          <div className="font-orbitron text-sm text-muted-foreground tracking-wide">
            {friends.length === 0 ? "СПИСОК ДРУЗЕЙ ПУСТ" : "НИКТО НЕ НАЙДЕН"}
          </div>
          <div className="font-rajdhani text-sm text-gray-600">
            {friends.length === 0 ? "Введите никнейм и нажмите + ДОБАВИТЬ" : ""}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {filtered.map((friend) => (
          <div key={friend.name} className="neon-card rounded p-4 flex items-center gap-4">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-purple/40 to-neon-cyan/20 border border-neon-purple/50 flex items-center justify-center font-orbitron text-sm font-bold text-neon-purple">
                {friend.name[0].toUpperCase()}
              </div>
              <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-dark-bg ${
                friend.status === "online" ? "bg-neon-green" : friend.status === "away" ? "bg-neon-yellow" : "bg-gray-600"
              }`} />
            </div>
            <div className="flex-1">
              <div className="font-rajdhani font-bold text-white">{friend.name}</div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-muted-foreground">{friend.rank}</span>
                {friend.game !== "Нет" && (
                  <span className="font-mono text-xs text-neon-green bg-neon-green/10 px-2 py-0.5 rounded border border-neon-green/20">{friend.game}</span>
                )}
              </div>
            </div>
            <div className="font-orbitron text-sm font-bold text-neon-cyan">{friend.rating}</div>
            <div className="flex gap-2">
              <button className="neon-btn px-3 py-1.5 text-xs rounded cursor-pointer">ВЫЗОВ</button>
              <button onClick={() => setFriends((f) => f.filter((x) => x.name !== friend.name))}
                className="neon-card px-3 py-1.5 text-xs rounded cursor-pointer text-gray-400 hover:text-neon-red">
                <Icon name="UserMinus" fallback="X" size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {requests.length > 0 && (
        <div className="mt-6">
          <div className="font-orbitron text-xs text-muted-foreground tracking-widest mb-3">ЗАПРОСЫ ({requests.length})</div>
          {requests.map((name) => (
            <div key={name} className="neon-card rounded p-3 flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 border border-neon-cyan/30 flex items-center justify-center font-orbitron text-xs text-neon-cyan">{name[0]}</div>
              <span className="flex-1 font-rajdhani text-white">{name}</span>
              <button onClick={() => { setFriends((f) => [...f, { name, rank: "Неизвестно", status: "online", game: "Нет", rating: 1500 }]); setRequests((r) => r.filter((x) => x !== name)); }}
                className="neon-btn-primary px-3 py-1.5 text-xs rounded cursor-pointer">✓</button>
              <button onClick={() => setRequests((r) => r.filter((x) => x !== name))} className="neon-btn px-3 py-1.5 text-xs rounded cursor-pointer">✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ===================== CHAT (чистый) =====================
function ChatSection() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<{user:string;text:string;time:string;isMe:boolean}[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = () => {
    if (!message.trim()) return;
    const now = new Date();
    const time = `${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`;
    setMessages((m) => [...m, { user: "Вы", text: message.trim(), time, isMe: true }]);
    setMessage("");
  };

  return (
    <div className="p-6 animate-fade-in max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-orbitron text-2xl neon-text tracking-wider">ЧАТ</h2>
        <div className="flex items-center gap-2">
          <div className="glow-dot" style={{width:'6px',height:'6px'}} />
          <span className="font-mono text-xs text-neon-green">Общий чат</span>
        </div>
      </div>

      <div className="neon-card rounded p-4 mb-3" style={{minHeight: '360px', maxHeight: '360px', overflowY: 'auto', display:'flex', flexDirection:'column', gap:'12px'}}>
        {messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center" style={{minHeight:'300px'}}>
            <div className="text-5xl opacity-20">💬</div>
            <div className="font-orbitron text-sm text-muted-foreground tracking-wide">ЧАТА ЕЩЁ НЕТ</div>
            <div className="font-rajdhani text-sm text-gray-600">Напишите первое сообщение!</div>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.isMe ? "flex-row-reverse" : ""}`}>
            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center font-orbitron text-xs font-bold border ${
              msg.isMe ? "bg-neon-cyan/20 border-neon-cyan/50 text-neon-cyan" : "bg-neon-purple/20 border-neon-purple/50 text-neon-purple"
            }`}>{msg.user[0]}</div>
            <div className={`flex flex-col gap-1 max-w-xs ${msg.isMe ? "items-end" : ""}`}>
              <div className="flex items-center gap-2">
                <span className="font-rajdhani text-xs font-bold text-white">{msg.user}</span>
                <span className="font-mono text-[10px] text-gray-600">{msg.time}</span>
              </div>
              <div className={`px-3 py-2 rounded font-rajdhani text-sm ${
                msg.isMe ? "bg-neon-cyan/15 border border-neon-cyan/30 text-white" : "bg-dark-border/50 border border-dark-border text-gray-300"
              }`}>{msg.text}</div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2">
        <input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Введите сообщение..."
          onKeyDown={(e) => e.key === "Enter" && send()}
          className="flex-1 bg-dark-card border border-dark-border focus:border-neon-cyan/50 rounded px-4 py-2.5 font-rajdhani text-white placeholder:text-gray-600 outline-none transition-colors" />
        <button onClick={send} className="neon-btn-primary px-4 py-2.5 rounded cursor-pointer">
          <Icon name="Send" fallback="ArrowRight" size={16} />
        </button>
      </div>
    </div>
  );
}

// ===================== SHOP =====================
function ShopSection() {
  const [activeTab, setActiveTab] = useState<"checkers"|"boards"|"effects">("checkers");
  const items = {
    checkers: [
      { name: "Неоновый Киберпанк", price: 500, preview: "🔵", owned: false, tag: "NEW" },
      { name: "Огненный Дракон", price: 750, preview: "🔴", owned: false, tag: "HOT" },
      { name: "Ледяной Кристалл", price: 600, preview: "❄️", owned: true, tag: "" },
      { name: "Золотой Мастер", price: 1200, preview: "🟡", owned: false, tag: "" },
      { name: "Тёмная Материя", price: 900, preview: "⚫", owned: false, tag: "" },
      { name: "Плазменный Шар", price: 450, preview: "🟣", owned: false, tag: "" },
    ],
    boards: [
      { name: "Звёздная Карта", price: 800, preview: "🌌", owned: false, tag: "NEW" },
      { name: "Неоновая Сетка", price: 650, preview: "🔷", owned: true, tag: "" },
      { name: "Каменная Крепость", price: 500, preview: "🗿", owned: false, tag: "" },
      { name: "Цифровой Лабиринт", price: 1000, preview: "💠", owned: false, tag: "HOT" },
    ],
    effects: [
      { name: "Взрыв при ударе", price: 300, preview: "💥", owned: false, tag: "" },
      { name: "След из искр", price: 250, preview: "✨", owned: true, tag: "" },
      { name: "Голографик", price: 700, preview: "🌀", owned: false, tag: "" },
    ],
  };
  const currentItems = items[activeTab];
  return (
    <div className="p-6 animate-fade-in max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-orbitron text-2xl neon-text tracking-wider">МАГАЗИН</h2>
        <div className="flex items-center gap-2 neon-card px-4 py-2 rounded">
          <span className="text-neon-yellow text-lg">💎</span>
          <span className="font-orbitron font-bold text-neon-yellow">2,400</span>
          <button className="neon-btn-primary text-xs px-3 py-1 rounded cursor-pointer ml-2">+ КУПИТЬ</button>
        </div>
      </div>
      <div className="flex gap-2 mb-6">
        {(["checkers","boards","effects"] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 font-orbitron text-xs rounded transition-all cursor-pointer ${
            activeTab === tab ? "bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/50" : "text-gray-500 border border-dark-border hover:border-neon-cyan/20"
          }`}>{tab === "checkers" ? "ФИШКИ" : tab === "boards" ? "ДОСКИ" : "ЭФФЕКТЫ"}</button>
        ))}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {currentItems.map((item) => (
          <div key={item.name} className="neon-card rounded p-4 flex flex-col gap-3">
            <div className="relative">
              <div className="h-24 bg-gradient-to-br from-dark-border to-dark-bg rounded flex items-center justify-center text-5xl">{item.preview}</div>
              {item.tag && (
                <span className={`absolute top-1 right-1 font-orbitron text-[9px] px-1.5 py-0.5 font-bold rounded ${item.tag==="NEW"?"bg-neon-green text-dark-bg":"bg-neon-red text-white"}`}>{item.tag}</span>
              )}
            </div>
            <div className="font-rajdhani font-bold text-white text-sm">{item.name}</div>
            {item.owned ? (
              <button className="neon-btn text-xs py-2 rounded cursor-pointer" style={{borderColor:'#00ff88',color:'#00ff88'}}>✓ ИСПОЛЬЗОВАТЬ</button>
            ) : (
              <button className="neon-btn-primary text-xs py-2 rounded cursor-pointer flex items-center justify-center gap-2"><span>💎</span>{item.price}</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ===================== SETTINGS =====================
function SettingsSection() {
  const [volume, setVolume] = useState(70);
  const [sfx, setSfx] = useState(85);
  const [difficulty, setDifficulty] = useState<"easy"|"medium"|"hard"|"impossible">("medium");
  const [toggles, setToggles] = useState({animations:true,notifications:true,sounds:true,hints:false,autoQueen:true});
  const toggle = (key: keyof typeof toggles) => setToggles((t) => ({...t,[key]:!t[key]}));
  return (
    <div className="p-6 animate-fade-in max-w-3xl mx-auto">
      <h2 className="font-orbitron text-2xl neon-text mb-6 tracking-wider">НАСТРОЙКИ</h2>
      <div className="flex flex-col gap-4">
        <div className="neon-card rounded p-5">
          <div className="font-orbitron text-sm text-neon-cyan mb-4 tracking-widest">АУДИО</div>
          <div className="flex flex-col gap-4">
            {[{label:"Музыка",value:volume,setter:setVolume},{label:"Звуковые эффекты",value:sfx,setter:setSfx}].map(({label,value,setter}) => (
              <div key={label}>
                <div className="flex justify-between mb-2">
                  <span className="font-rajdhani text-gray-300">{label}</span>
                  <span className="font-mono text-neon-cyan text-sm">{value}%</span>
                </div>
                <input type="range" min={0} max={100} value={value} onChange={(e) => setter(Number(e.target.value))}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                  style={{background:`linear-gradient(to right, #00ffff ${value}%, #0d3350 ${value}%)`}} />
              </div>
            ))}
          </div>
        </div>
        <div className="neon-card rounded p-5">
          <div className="font-orbitron text-sm text-neon-cyan mb-4 tracking-widest">УРОВЕНЬ СЛОЖНОСТИ</div>
          <div className="grid grid-cols-4 gap-2">
            {(["easy","medium","hard","impossible"] as const).map((d) => (
              <button key={d} onClick={() => setDifficulty(d)} className={`py-2 rounded font-orbitron text-xs cursor-pointer transition-all ${difficulty===d?"bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/50":"border border-dark-border text-gray-500 hover:border-neon-cyan/20"}`}>
                {d==="easy"?"ЛЕГКО":d==="medium"?"СРЕДНЕ":d==="hard"?"СЛОЖНО":"💀 БОЛЬ"}
              </button>
            ))}
          </div>
        </div>
        <div className="neon-card rounded p-5">
          <div className="font-orbitron text-sm text-neon-cyan mb-4 tracking-widest">ИГРОВЫЕ ОПЦИИ</div>
          <div className="flex flex-col gap-4">
            {[{key:"animations",label:"Анимации"},{key:"notifications",label:"Уведомления"},{key:"sounds",label:"Звуки ходов"},{key:"hints",label:"Подсказки"},{key:"autoQueen",label:"Авто-дамка"}].map(({key,label}) => (
              <div key={key} className="flex items-center justify-between">
                <span className="font-rajdhani text-gray-300">{label}</span>
                <button onClick={() => toggle(key as keyof typeof toggles)} className={`w-12 h-6 rounded-full relative transition-all cursor-pointer ${toggles[key as keyof typeof toggles]?"bg-neon-cyan/30 border border-neon-cyan/50":"bg-dark-border border border-dark-border"}`}>
                  <div className={`absolute top-0.5 w-5 h-5 rounded-full transition-all ${toggles[key as keyof typeof toggles]?"left-6 bg-neon-cyan":"left-0.5 bg-gray-600"}`}
                    style={toggles[key as keyof typeof toggles]?{boxShadow:'0 0 10px #00ffff'}:{}} />
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-3">
          <button className="neon-btn-primary flex-1 py-3 rounded cursor-pointer font-orbitron text-sm">СОХРАНИТЬ</button>
          <button className="neon-btn px-6 py-3 rounded cursor-pointer font-orbitron text-sm">СБРОС</button>
        </div>
      </div>
    </div>
  );
}

// ===================== LEADERBOARD =====================
function LeaderboardSection() {
  const players = [
    { rank: 1, name: "Ночной_Король", rating: 4250, wins: 892, country: "🇷🇺", streak: 12 },
    { rank: 2, name: "DragonX", rating: 4180, wins: 743, country: "🇩🇪", streak: 7 },
    { rank: 3, name: "Квантовый", rating: 4050, wins: 681, country: "🇺🇸", streak: 5 },
    { rank: 4, name: "Игрок_7742", rating: 3920, wins: 612, country: "🇷🇺", streak: 3 },
    { rank: 5, name: "KnightX", rating: 3850, wins: 589, country: "🇫🇷", streak: 0 },
    { rank: 6, name: "Призрак_54", rating: 3720, wins: 534, country: "🇧🇷", streak: 8 },
    { rank: 7, name: "Борец99", rating: 3650, wins: 498, country: "🇷🇺", streak: 2 },
    { rank: 8, name: "Мастер_шашек", rating: 3580, wins: 467, country: "🇰🇷", streak: 4 },
    { rank: 204, name: "Вы", rating: 2847, wins: 247, country: "🇷🇺", streak: 1, isMe: true },
  ];
  const medalColors: Record<number,string> = {1:"#FFD700",2:"#C0C0C0",3:"#CD7F32"};
  return (
    <div className="p-6 animate-fade-in max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-orbitron text-2xl neon-text tracking-wider">ТАБЛИЦА ЛИДЕРОВ</h2>
        <div className="font-mono text-xs text-muted-foreground">Обновлено: только что</div>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[players[1],players[0],players[2]].map((p,i) => (
          <div key={p.rank} className={`neon-card rounded p-4 flex flex-col items-center gap-2 ${i===1?"neon-border":""}`}>
            <div className="font-orbitron text-2xl">{p.rank===1?"🏆":p.rank===2?"🥈":"🥉"}</div>
            <div className="font-orbitron text-sm font-bold text-white">{p.name}</div>
            <div className="font-mono text-xs text-muted-foreground">{p.country}</div>
            <div className="font-orbitron text-xl font-black" style={{color:medalColors[p.rank]}}>{p.rating}</div>
            <div className="font-mono text-xs text-gray-500">{p.wins} побед</div>
          </div>
        ))}
      </div>
      <div className="neon-card rounded overflow-hidden">
        <div className="grid grid-cols-5 gap-2 px-4 py-3 border-b border-dark-border">
          {["#","ИГРОК","РЕЙТИНГ","ПОБЕДЫ","СЕРИЯ"].map((h) => (
            <div key={h} className="font-orbitron text-xs text-muted-foreground tracking-widest">{h}</div>
          ))}
        </div>
        {players.map((p) => (
          <div key={p.rank} className={`grid grid-cols-5 gap-2 px-4 py-3 border-b border-dark-border/50 transition-all ${
            p.isMe?"bg-neon-cyan/5 border-l-2 border-l-neon-cyan":"hover:bg-dark-border/30"
          }`}>
            <div className="font-orbitron text-sm" style={p.rank<=3?{color:medalColors[p.rank]}:{}}>{p.rank<=3?["🥇","🥈","🥉"][p.rank-1]:`#${p.rank}`}</div>
            <div className="flex items-center gap-2">
              <span>{p.country}</span>
              <span className={`font-rajdhani font-bold ${p.isMe?"text-neon-cyan":"text-white"}`}>
                {p.name}{p.isMe&&<span className="text-[10px] text-neon-cyan ml-1">(ВЫ)</span>}
              </span>
            </div>
            <div className="font-orbitron text-sm font-bold text-neon-cyan">{p.rating}</div>
            <div className="font-mono text-sm text-gray-300">{p.wins}</div>
            <div className="font-mono text-sm">{p.streak>0?<span className="text-neon-green">🔥 {p.streak}</span>:<span className="text-gray-600">—</span>}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ===================== MAIN APP =====================
export default function Index() {
  const [activeSection, setActiveSection] = useState<Section>("menu");
  const renderSection = () => {
    switch (activeSection) {
      case "menu": return <MenuSection onNavigate={setActiveSection} />;
      case "game": return <GameSection />;
      case "profile": return <ProfileSection />;
      case "friends": return <FriendsSection />;
      case "chat": return <ChatSection />;
      case "shop": return <ShopSection />;
      case "settings": return <SettingsSection />;
      case "leaderboard": return <LeaderboardSection />;
    }
  };
  return (
    <div className="min-h-screen flex flex-col" style={{background:"var(--dark-bg)"}}>
      <header className="sticky top-0 z-50 border-b border-dark-border bg-dark-bg/90 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="font-orbitron font-black text-lg neon-text tracking-wider">
            CHECK<span className="text-neon-purple" style={{textShadow:'0 0 10px #9b30ff'}}>MATE</span>
          </div>
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <button key={item.id} onClick={() => setActiveSection(item.id as Section)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all cursor-pointer font-rajdhani text-sm font-semibold tracking-wide ${
                  activeSection===item.id?"text-neon-cyan bg-neon-cyan/10 border border-neon-cyan/30":"text-gray-500 hover:text-gray-300"
                }`}>
                <Icon name={item.icon} fallback="Home" size={14} />
                {item.label}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="glow-dot" style={{width:'6px',height:'6px'}} />
              <span className="font-mono text-xs text-neon-green hidden sm:block">2,847</span>
            </div>
            <div className="flex items-center gap-1.5 neon-card px-2 py-1 rounded">
              <span className="text-neon-yellow text-sm">💎</span>
              <span className="font-orbitron text-xs font-bold text-neon-yellow">2,400</span>
            </div>
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-neon-cyan/30 to-neon-purple/30 border border-neon-cyan/50 flex items-center justify-center text-sm cursor-pointer">🔮</div>
          </div>
        </div>
        <div className="flex md:hidden border-t border-dark-border overflow-x-auto">
          {NAV_ITEMS.map((item) => (
            <button key={item.id} onClick={() => setActiveSection(item.id as Section)}
              className={`flex flex-col items-center gap-0.5 px-3 py-2 flex-shrink-0 transition-all cursor-pointer ${activeSection===item.id?"text-neon-cyan":"text-gray-600"}`}>
              <Icon name={item.icon} fallback="Home" size={16} />
              <span className="font-orbitron text-[9px] tracking-wide">{item.label}</span>
            </button>
          ))}
        </div>
      </header>
      <main className="flex-1 overflow-y-auto">{renderSection()}</main>
    </div>
  );
}
