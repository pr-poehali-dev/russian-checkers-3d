import { useState, useEffect, useCallback, useRef } from "react";
import Icon from "@/components/ui/icon";

type Section = "menu" | "game" | "profile" | "friends" | "chat" | "shop" | "settings" | "leaderboard";
type Pieces = Record<string, "white" | "black" | "white-queen" | "black-queen">;

interface ProfileData {
  nickname: string;
  avatar: string; // emoji or data-url
  wins: number;
  losses: number;
  draws: number;
  rating: number;
  gems: number;
}

const DEFAULT_PROFILE: ProfileData = {
  nickname: "Игрок",
  avatar: "🔮",
  wins: 0,
  losses: 0,
  draws: 0,
  rating: 1000,
  gems: 500,
};

function loadProfile(): ProfileData {
  try {
    const s = localStorage.getItem("checkmate_profile");
    if (s) return { ...DEFAULT_PROFILE, ...JSON.parse(s) };
  } catch (e) { console.warn(e); }
  return { ...DEFAULT_PROFILE };
}

function saveProfile(p: ProfileData) {
  localStorage.setItem("checkmate_profile", JSON.stringify(p));
}

// ===================== WEB AUDIO =====================
let audioCtx: AudioContext | null = null;
function getAudioCtx(): AudioContext {
  if (!audioCtx) audioCtx = new (window.AudioContext || (window as unknown as {webkitAudioContext: typeof AudioContext}).webkitAudioContext)();
  return audioCtx;
}
function playTone(freq: number, duration: number, type: OscillatorType = "sine", vol = 0.15) {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value = freq;
    osc.type = type;
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch (err) { console.warn(err); }
}
function playMove() { playTone(440, 0.08, "triangle", 0.1); }
function playCapture() {
  playTone(200, 0.1, "sawtooth", 0.12);
  setTimeout(() => playTone(150, 0.15, "sawtooth", 0.1), 80);
}
function playWin() {
  [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => playTone(f, 0.25, "sine", 0.15), i * 120));
}
function playLose() {
  [523, 440, 370, 294].forEach((f, i) => setTimeout(() => playTone(f, 0.3, "triangle", 0.12), i * 130));
}
function playPromote() {
  playTone(880, 0.15, "sine", 0.2);
  setTimeout(() => playTone(1047, 0.25, "sine", 0.18), 100);
}

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
function MenuSection({ onNavigate, profile }: { onNavigate: (s: Section) => void; profile: ProfileData }) {
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
        <span className="font-mono text-xs text-neon-cyan">{profile.nickname}</span>
        <span className="font-mono text-xs text-muted-foreground">⭐ {profile.rating}</span>
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
function colorOf(p: string): "white" | "black" { return p.startsWith("white") ? "white" : "black"; }
function isQueen(p: string): boolean { return p.endsWith("-queen"); }

function getSimpleMoves(pieces: Pieces, key: string): string[] {
  const piece = pieces[key]; if (!piece) return [];
  const color = colorOf(piece); const queen = isQueen(piece);
  const [r, c] = key.split("-").map(Number);
  const dirs = queen ? [[-1,-1],[-1,1],[1,-1],[1,1]] : color === "white" ? [[-1,-1],[-1,1]] : [[1,-1],[1,1]];
  return dirs.map(([dr, dc]) => `${r+dr}-${c+dc}`).filter((k) => {
    const [nr, nc] = k.split("-").map(Number);
    return nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && !pieces[k];
  });
}

function getCaptures(pieces: Pieces, key: string): { to: string; captured: string }[] {
  const piece = pieces[key]; if (!piece) return [];
  const color = colorOf(piece); const queen = isQueen(piece);
  const [r, c] = key.split("-").map(Number);
  const dirs = queen ? [[-1,-1],[-1,1],[1,-1],[1,1]] : color === "white" ? [[-1,-1],[-1,1]] : [[1,-1],[1,1]];
  const result: { to: string; captured: string }[] = [];
  for (const [dr, dc] of dirs) {
    const midKey = `${r+dr}-${c+dc}`; const landKey = `${r+dr*2}-${c+dc*2}`;
    const [lr, lc] = [r+dr*2, c+dc*2]; const midPiece = pieces[midKey];
    if (midPiece && colorOf(midPiece) !== color && lr >= 0 && lr < 8 && lc >= 0 && lc < 8 && !pieces[landKey])
      result.push({ to: landKey, captured: midKey });
  }
  return result;
}

function promoteIfNeeded(pieces: Pieces, key: string): [Pieces, boolean] {
  const p = pieces[key]; if (!p) return [pieces, false];
  const [r] = key.split("-").map(Number);
  if (p === "white" && r === 0) return [{ ...pieces, [key]: "white-queen" }, true];
  if (p === "black" && r === 7) return [{ ...pieces, [key]: "black-queen" }, true];
  return [pieces, false];
}

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

// ===================== 3D CHECKER =====================
function Checker3D({ color, isSelected, queen }: { color: "white" | "black"; isSelected: boolean; queen: boolean }) {
  const w = color === "white";
  return (
    <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{
        width:'76%', height:'76%', position:'relative',
        transform: isSelected ? 'translateY(-6px) scale(1.12)' : 'translateY(0)',
        transition:'transform 0.15s ease',
      }}>
        {/* тень */}
        <div style={{
          position:'absolute', bottom:'-10px', left:'10%', width:'80%', height:'20%',
          borderRadius:'50%', background:'rgba(0,0,0,0.6)', filter:'blur(5px)',
          transform: isSelected ? 'scaleX(0.7) translateY(6px)' : 'scaleX(1)',
          transition:'transform 0.15s ease',
        }}/>
        {/* толщина — нижний слой */}
        <div style={{
          position:'absolute', top:'6px', left:0, right:0, bottom:'-5px',
          borderRadius:'50%',
          background: w ? 'linear-gradient(180deg,#003d4d,#001a22)' : 'linear-gradient(180deg,#2a005a,#100020)',
          boxShadow: w ? '0 4px 16px rgba(0,255,255,0.35)' : '0 4px 16px rgba(155,48,255,0.35)',
        }}/>
        {/* боковая полоска */}
        <div style={{
          position:'absolute', top:'3px', left:'2px', right:'2px', bottom:'-2px',
          borderRadius:'50%',
          background: w
            ? 'linear-gradient(180deg,#008aaa 0%,#00404d 60%,#001a22 100%)'
            : 'linear-gradient(180deg,#6010b0 0%,#2a005a 60%,#100020 100%)',
        }}/>
        {/* верхняя поверхность */}
        <div style={{
          position:'absolute', top:0, left:0, right:0,
          height:'calc(100% - 4px)',
          borderRadius:'50%',
          background: w
            ? 'radial-gradient(ellipse at 38% 32%, #aaffff 0%, #00e5ff 25%, #00b0cc 55%, #003a4a 100%)'
            : 'radial-gradient(ellipse at 38% 32%, #e0aaff 0%, #b040ff 25%, #7010c0 55%, #2a0050 100%)',
          boxShadow: isSelected
            ? w ? '0 0 0 3px #00ffff,0 0 25px #00ffff,0 0 50px rgba(0,255,255,0.3)' : '0 0 0 3px #9b30ff,0 0 25px #9b30ff,0 0 50px rgba(155,48,255,0.3)'
            : w ? '0 -2px 6px rgba(0,255,255,0.2),inset 0 1px 4px rgba(255,255,255,0.25)' : '0 -2px 6px rgba(155,48,255,0.2),inset 0 1px 4px rgba(255,255,255,0.15)',
        }}>
          {/* блик */}
          <div style={{
            position:'absolute', top:'10%', left:'15%', width:'38%', height:'28%',
            borderRadius:'50%', background:'rgba(255,255,255,0.38)', filter:'blur(2px)',
          }}/>
          {/* дамка */}
          {queen && (
            <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px',filter:'drop-shadow(0 0 5px gold)'}}>
              👑
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ===================== GAME SECTION =====================
function GameSection({ onGameEnd }: { onGameEnd: (result: "win"|"loss"|"draw") => void }) {
  const [pieces, setPieces] = useState<Pieces>(initBoard);
  const [selected, setSelected] = useState<string | null>(null);
  const [turn, setTurn] = useState<"white"|"black">("white");
  const [autoMode, setAutoMode] = useState(false);
  const [botThinking, setBotThinking] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [gameOver, setGameOver] = useState<"win"|"loss"|null>(null);
  const autoRef = useRef(autoMode);
  autoRef.current = autoMode;
  const gameOverRef = useRef(gameOver);
  gameOverRef.current = gameOver;

  const countOf = (color: "white"|"black") => Object.values(pieces).filter(v => colorOf(v) === color).length;

  const applyMove = useCallback((from: string, to: string, captured: string|undefined, board: Pieces): Pieces => {
    const next = { ...board };
    next[to] = next[from];
    delete next[from];
    if (captured) delete next[captured];
    const [promoted, wasPromoted] = promoteIfNeeded(next, to);
    if (wasPromoted) { playPromote(); }
    return promoted;
  }, []);

  const checkGameOver = useCallback((board: Pieces, nextTurn: "white"|"black"): "win"|"loss"|null => {
    const wc = Object.values(board).filter(v => colorOf(v) === "white").length;
    const bc = Object.values(board).filter(v => colorOf(v) === "black").length;
    if (bc === 0 || getAllMovesForColor(board, "black").length === 0) return "win";
    if (wc === 0 || getAllMovesForColor(board, nextTurn).length === 0) return "loss";
    return null;
  }, []);

  const makeBotMove = useCallback((board: Pieces) => {
    const moves = getAllMovesForColor(board, "black");
    if (!moves.length) return;
    setBotThinking(true);
    setTimeout(() => {
      if (gameOverRef.current) return;
      const move = moves[Math.floor(Math.random() * moves.length)];
      const next = applyMove(move.from, move.to, move.captured, board);
      if (move.captured) playCapture(); else playMove();
      setPieces(next);
      setHistory(h => [`${move.from}→${move.to}`, ...h].slice(0, 8));
      setBotThinking(false);
      const result = checkGameOver(next, "white");
      if (result) { setGameOver(result); onGameEnd(result); if (result === "win") playWin(); else playLose(); return; }
      setTurn("white");
    }, 700 + Math.random() * 600);
  }, [applyMove, checkGameOver, onGameEnd]);

  useEffect(() => {
    if (turn === "black" && !botThinking && !gameOver) makeBotMove(pieces);
  }, [turn, botThinking, pieces, gameOver, makeBotMove]);

  useEffect(() => {
    if (!autoMode || turn !== "white" || botThinking || gameOver) return;
    const moves = getAllMovesForColor(pieces, "white");
    if (!moves.length) return;
    const t = setTimeout(() => {
      if (!autoRef.current || gameOverRef.current) return;
      const move = moves[Math.floor(Math.random() * moves.length)];
      const next = applyMove(move.from, move.to, move.captured, pieces);
      if (move.captured) playCapture(); else playMove();
      setPieces(next);
      setHistory(h => [`${move.from}→${move.to}`, ...h].slice(0, 8));
      const result = checkGameOver(next, "black");
      if (result) { setGameOver(result); onGameEnd(result); if (result === "win") playWin(); else playLose(); return; }
      setTurn("black");
    }, 700 + Math.random() * 500);
    return () => clearTimeout(t);
  }, [autoMode, turn, pieces, botThinking, gameOver, applyMove, checkGameOver, onGameEnd]);

  const allMoves = gameOver ? [] : getAllMovesForColor(pieces, "white");
  const hasMandatory = allMoves.some(m => m.captured);
  const cellMoves = selected ? allMoves.filter(m => m.from === selected) : [];
  const validTargets = cellMoves.map(m => m.to);

  const handleCell = (key: string) => {
    if (turn !== "white" || botThinking || autoMode || gameOver) return;
    if (validTargets.includes(key) && selected) {
      const move = cellMoves.find(m => m.to === key)!;
      const next = applyMove(move.from, move.to, move.captured, pieces);
      if (move.captured) playCapture(); else playMove();
      setPieces(next); setSelected(null);
      const result = checkGameOver(next, "black");
      if (result) { setGameOver(result); onGameEnd(result); if (result === "win") playWin(); else playLose(); return; }
      setTurn("black");
      return;
    }
    const piece = pieces[key];
    if (piece && colorOf(piece) === "white") {
      if (hasMandatory && !allMoves.filter(m => m.captured && m.from === key).length) return;
      setSelected(key === selected ? null : key);
    } else setSelected(null);
  };

  const reset = () => { setPieces(initBoard()); setSelected(null); setTurn("white"); setHistory([]); setBotThinking(false); setGameOver(null); };
  const wc = countOf("white"); const bc = countOf("black");

  return (
    <div className="p-4 animate-fade-in">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="neon-card p-3 rounded flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-purple/60 to-purple-900 border-2 border-neon-purple flex items-center justify-center text-xs font-bold text-white">AI</div>
            <div>
              <div className="font-rajdhani font-bold text-white">Бот ALPHA-7</div>
              <div className={`font-mono text-xs ${botThinking ? "text-neon-yellow animate-pulse-neon" : "text-gray-500"}`}>{botThinking ? "● думает..." : "● ждёт"}</div>
            </div>
            <div className="ml-2 font-orbitron text-xl text-neon-purple font-bold">{bc}</div>
          </div>
          <div className={`px-4 py-1 rounded font-orbitron text-xs font-bold ${
            gameOver ? "bg-neon-yellow/20 text-neon-yellow border border-neon-yellow"
              : turn === "white" ? "bg-neon-cyan/20 text-neon-cyan border border-neon-cyan"
              : "bg-neon-purple/20 text-neon-purple border border-neon-purple"
          }`}>
            {gameOver ? (gameOver === "win" ? "ВЫ ПОБЕДИЛИ! 🏆" : "БОТ ПОБЕДИЛ") : turn === "white" ? (autoMode ? "АВТО" : hasMandatory ? "⚡ БЕЙ!" : "ВАШ ХОД") : "БОТ ДУМАЕТ"}
          </div>
          <div className="neon-card p-3 rounded flex items-center gap-3">
            <div className="font-orbitron text-xl text-neon-cyan font-bold">{wc}</div>
            <div>
              <div className="font-rajdhani font-bold text-white">Вы</div>
              <div className="font-mono text-xs text-neon-green">● играете</div>
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-cyan/40 to-neon-purple/40 border-2 border-neon-cyan flex items-center justify-center text-xs font-bold text-white">ВЫ</div>
          </div>
        </div>

        <div className="flex gap-4">
          {/* 3D Board */}
          <div className="flex-1 relative" style={{perspective:'800px', perspectiveOrigin:'50% 20%'}}>
            <div
              style={{
                background:'linear-gradient(160deg,#0a1825 0%,#060c14 100%)',
                border:'1px solid rgba(0,255,255,0.25)',
                boxShadow:'0 30px 80px rgba(0,0,0,0.9), 0 0 40px rgba(0,255,255,0.08)',
                borderRadius:'6px',
                padding:'10px',
                transform:'rotateX(30deg)',
                transformStyle:'preserve-3d',
              }}
            >
              {/* Метки колонок */}
              <div style={{display:'grid',gridTemplateColumns:'repeat(8,1fr)',marginBottom:'2px'}}>
                {['A','B','C','D','E','F','G','H'].map(l => (
                  <div key={l} style={{textAlign:'center',fontFamily:'monospace',fontSize:'9px',color:'rgba(0,255,255,0.3)'}}>{l}</div>
                ))}
              </div>
              {/* Клетки */}
              <div style={{display:'grid',gridTemplateColumns:'repeat(8,1fr)',gap:0}}>
                {Array.from({length:8}, (_,row) =>
                  Array.from({length:8}, (_,col) => {
                    const key = `${row}-${col}`;
                    const dark = (row+col)%2===1;
                    const piece = pieces[key];
                    const isSel = selected === key;
                    const isTarget = validTargets.includes(key);
                    const isCapturable = cellMoves.some(m => m.captured === key);
                    return (
                      <div
                        key={key}
                        onClick={() => handleCell(key)}
                        style={{
                          aspectRatio:'1',
                          position:'relative',
                          display:'flex',alignItems:'center',justifyContent:'center',
                          cursor:'pointer',
                          background: dark
                            ? isSel ? 'linear-gradient(135deg,#004455,#001a22)'
                              : isCapturable ? 'linear-gradient(135deg,#3d0010,#1a0005)'
                              : 'linear-gradient(135deg,#0d2030,#07101a)'
                            : 'linear-gradient(135deg,#0a1820,#060c14)',
                          boxShadow: isSel ? 'inset 0 0 18px rgba(0,255,255,0.35)' : 'none',
                          transition:'background 0.15s',
                        }}
                      >
                        {isTarget && dark && (
                          <div style={{
                            position:'absolute',width:'32%',height:'32%',borderRadius:'50%',
                            background:'rgba(0,255,255,0.2)',border:'2px solid rgba(0,255,255,0.7)',
                            boxShadow:'0 0 10px rgba(0,255,255,0.5)',
                            animation:'pulseNeon 1s ease-in-out infinite',zIndex:1,
                          }}/>
                        )}
                        {isCapturable && piece && (
                          <div style={{
                            position:'absolute',inset:'1px',borderRadius:'50%',
                            border:'2px solid rgba(255,51,102,0.9)',
                            boxShadow:'0 0 14px rgba(255,51,102,0.7)',zIndex:5,pointerEvents:'none',
                          }}/>
                        )}
                        {piece && (
                          <div style={{position:'relative',width:'100%',height:'100%',zIndex:2}}>
                            <Checker3D color={colorOf(piece)} isSelected={isSel} queen={isQueen(piece)} />
                          </div>
                        )}
                        {col===0 && (
                          <span style={{position:'absolute',top:2,left:2,fontSize:'8px',fontFamily:'monospace',color:'rgba(0,255,255,0.2)',lineHeight:1}}>{8-row}</span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* АВТО кнопка */}
            <button
              onClick={() => setAutoMode(v => !v)}
              style={{
                position:'absolute',bottom:'-40px',left:0,
                display:'flex',alignItems:'center',gap:'6px',
                padding:'6px 12px',borderRadius:'4px',
                fontFamily:"'Orbitron',monospace",fontSize:'11px',fontWeight:'700',
                cursor:'pointer',transition:'all 0.2s',zIndex:10,
                ...(autoMode
                  ? {background:'rgba(255,255,0,0.15)',border:'1px solid #ffff00',color:'#ffff00',boxShadow:'0 0 15px rgba(255,255,0,0.3)'}
                  : {background:'rgba(10,18,32,0.9)',border:'1px solid #0d3350',color:'#555'}),
              }}
            >
              <Icon name="Zap" fallback="Play" size={11} />
              АВТО РЕЖИМ
            </button>

            {/* Game over overlay */}
            {gameOver && (
              <div style={{
                position:'absolute',inset:0,background:'rgba(6,12,20,0.9)',
                display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
                borderRadius:'6px',zIndex:20,backdropFilter:'blur(4px)',
              }}>
                <div style={{
                  fontFamily:"'Orbitron',monospace",fontSize:'28px',fontWeight:'900',marginBottom:'16px',
                  color: gameOver==="win"?'#00ffff':'#9b30ff',
                  textShadow: gameOver==="win"?'0 0 30px #00ffff':'0 0 30px #9b30ff',
                }}>
                  {gameOver==="win"?"ВЫ ПОБЕДИЛИ! 🏆":"БОТ ПОБЕДИЛ 🤖"}
                </div>
                <button onClick={reset} className="neon-btn-primary px-8 py-3 rounded font-orbitron text-sm cursor-pointer">НОВАЯ ИГРА</button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="w-44 flex flex-col gap-3">
            <div className="neon-card p-3 rounded">
              <div className="font-orbitron text-xs text-neon-cyan mb-2 tracking-widest">ФИШКИ</div>
              <div className="flex justify-between items-center">
                <div className="text-center"><div className="font-orbitron text-2xl font-bold text-neon-cyan">{wc}</div><div className="text-xs text-gray-500 font-rajdhani">вы</div></div>
                <div className="text-neon-cyan font-bold text-xl">:</div>
                <div className="text-center"><div className="font-orbitron text-2xl font-bold text-neon-purple">{bc}</div><div className="text-xs text-gray-500 font-rajdhani">бот</div></div>
              </div>
            </div>
            <div className="neon-card p-3 rounded">
              <div className="font-orbitron text-xs text-neon-cyan mb-2 tracking-widest">ХОДЫ</div>
              <div className="flex flex-col gap-1 font-mono text-xs text-gray-400">
                {history.length===0 && <div className="text-gray-600">нет ходов</div>}
                {history.map((m,i) => (
                  <div key={i} className={`flex gap-1 ${i===0?"text-neon-cyan":""}`}>
                    <span className="text-gray-600">{history.length-i}.</span><span>{m}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="neon-card p-3 rounded">
              <div className="font-orbitron text-xs text-neon-cyan mb-2 tracking-widest">ДЕЙСТВИЯ</div>
              <div className="flex flex-col gap-2">
                <button onClick={reset} className="neon-btn text-xs py-2 px-3 rounded w-full cursor-pointer">НОВАЯ ИГРА</button>
                <button className="neon-btn-purple text-xs py-2 px-3 rounded w-full cursor-pointer">НИЧЬЯ</button>
                <button onClick={reset} className="neon-btn text-xs py-2 px-3 rounded w-full cursor-pointer">СДАТЬСЯ</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===================== PROFILE =====================
const AVATARS = ["🤖","🦊","🐉","💀","🦅","🔮","⚡","🛸","🎯","🌟","🔥","💎"];

function ProfileSection({ profile, onUpdate }: { profile: ProfileData; onUpdate: (p: ProfileData) => void }) {
  const [editing, setEditing] = useState(false);
  const [editNick, setEditNick] = useState(profile.nickname);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const save = () => { onUpdate({ ...profile, nickname: editNick.trim() || profile.nickname }); setEditing(false); };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      onUpdate({ ...profile, avatar: dataUrl });
      setShowAvatarPicker(false);
    };
    reader.readAsDataURL(file);
  };

  const isPhotoAvatar = profile.avatar.startsWith("data:");

  const stats = [
    { label: "ПОБЕДЫ", value: profile.wins, color: "text-neon-green" },
    { label: "ПОРАЖЕНИЯ", value: profile.losses, color: "text-neon-red" },
    { label: "НИЧЬИ", value: profile.draws, color: "text-neon-yellow" },
    { label: "РЕЙТИНГ", value: profile.rating, color: "text-neon-cyan" },
  ];

  const totalGames = profile.wins + profile.losses + profile.draws;
  const winRate = totalGames > 0 ? Math.round((profile.wins / totalGames) * 100) : 0;
  const rankProgress = ((profile.rating % 500) / 500) * 100;
  const rankName = profile.rating < 1200 ? "НОВИЧОК" : profile.rating < 1600 ? "ЛЮБИТЕЛЬ" : profile.rating < 2000 ? "ОПЫТНЫЙ" : profile.rating < 2500 ? "МАСТЕР" : "ЧЕМПИОН";

  return (
    <div className="p-6 animate-fade-in max-w-4xl mx-auto">
      <h2 className="font-orbitron text-2xl neon-text mb-6 tracking-wider">ПРОФИЛЬ ИГРОКА</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Левая карточка */}
        <div className="neon-card rounded p-6 flex flex-col items-center gap-4">
          {/* Аватар */}
          <div className="relative">
            <div className="w-24 h-24 rounded-full border-2 border-neon-cyan overflow-hidden flex items-center justify-center"
              style={{background:'linear-gradient(135deg,rgba(0,255,255,0.15),rgba(155,48,255,0.15))'}}>
              {isPhotoAvatar
                ? <img src={profile.avatar} alt="avatar" className="w-full h-full object-cover" />
                : <span className="text-5xl">{profile.avatar}</span>
              }
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-neon-green rounded-full border-2 border-dark-bg" style={{boxShadow:'0 0 10px #00ff88'}}/>
          </div>

          {/* Кнопка смены аватара */}
          <button onClick={() => setShowAvatarPicker(v => !v)} className="flex items-center gap-2 neon-btn px-3 py-1.5 text-xs rounded cursor-pointer w-full justify-center">
            <Icon name="Camera" fallback="Image" size={12} />
            СМЕНИТЬ АВАТАР
          </button>

          {/* Пикер аватара */}
          {showAvatarPicker && (
            <div className="w-full p-3 bg-dark-bg rounded border border-dark-border animate-fade-in flex flex-col gap-3">
              {/* Загрузка фото */}
              <button
                onClick={() => fileRef.current?.click()}
                className="flex items-center justify-center gap-2 w-full py-2 rounded border border-dashed border-neon-cyan/40 text-neon-cyan font-rajdhani text-xs hover:border-neon-cyan hover:bg-neon-cyan/5 transition-all cursor-pointer"
              >
                <Icon name="Upload" fallback="Image" size={12} />
                ЗАГРУЗИТЬ ФОТО
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
              {/* Эмодзи */}
              <div className="grid grid-cols-4 gap-2">
                {AVATARS.map((em) => (
                  <button key={em} onClick={() => { onUpdate({...profile,avatar:em}); setShowAvatarPicker(false); }}
                    className={`text-2xl p-1.5 rounded hover:bg-neon-cyan/10 transition-all cursor-pointer ${profile.avatar===em?"border border-neon-cyan":""}`}>{em}</button>
                ))}
              </div>
            </div>
          )}

          {/* Ник */}
          {editing ? (
            <div className="flex flex-col gap-2 w-full">
              <input value={editNick} onChange={(e) => setEditNick(e.target.value)} maxLength={20}
                className="bg-dark-bg border border-neon-cyan/50 rounded px-3 py-1.5 font-rajdhani text-white text-sm outline-none text-center" />
              <div className="flex gap-2">
                <button onClick={save} className="neon-btn-primary flex-1 text-xs py-1.5 rounded cursor-pointer">✓</button>
                <button onClick={() => setEditing(false)} className="neon-btn flex-1 text-xs py-1.5 rounded cursor-pointer">✕</button>
              </div>
            </div>
          ) : (
            <div className="text-center w-full">
              <div className="font-orbitron text-xl font-bold text-white">{profile.nickname}</div>
              <div className="font-mono text-xs text-neon-purple mt-1">РАНГ: {rankName}</div>
              <div className="font-mono text-xs text-muted-foreground mt-0.5">
                {totalGames > 0 ? `${winRate}% побед · ${totalGames} игр` : "Нет сыгранных игр"}
              </div>
            </div>
          )}

          {!editing && (
            <button onClick={() => { setEditNick(profile.nickname); setEditing(true); }}
              className="flex items-center gap-2 neon-btn-purple px-3 py-1.5 text-xs rounded cursor-pointer w-full justify-center">
              <Icon name="Pencil" fallback="Edit" size={12} />РЕДАКТИРОВАТЬ
            </button>
          )}

          <div className="w-full">
            <div className="flex justify-between text-xs font-mono mb-1">
              <span className="text-gray-500">До след. ранга</span>
              <span className="text-neon-cyan">{Math.round(rankProgress)}%</span>
            </div>
            <div className="h-1.5 bg-dark-border rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-neon-cyan to-neon-purple rounded-full transition-all" style={{width:`${rankProgress}%`}} />
            </div>
          </div>

          <div className="flex gap-2">
            {profile.wins >= 1 && <div className="w-8 h-8 neon-card rounded flex items-center justify-center text-sm cursor-pointer" title="Первая победа">🏆</div>}
            {profile.wins >= 10 && <div className="w-8 h-8 neon-card rounded flex items-center justify-center text-sm cursor-pointer" title="10 побед">⚡</div>}
            {profile.wins >= 50 && <div className="w-8 h-8 neon-card rounded flex items-center justify-center text-sm cursor-pointer" title="50 побед">🔥</div>}
            {profile.rating >= 1500 && <div className="w-8 h-8 neon-card rounded flex items-center justify-center text-sm cursor-pointer" title="Рейтинг 1500+">💎</div>}
            {profile.wins === 0 && profile.losses === 0 && (
              <span className="font-mono text-xs text-gray-600">Достижения откроются в игре</span>
            )}
          </div>
        </div>

        {/* Статы */}
        <div className="md:col-span-2 grid grid-cols-2 gap-3">
          {stats.map((stat) => (
            <div key={stat.label} className="neon-card rounded p-4">
              <div className="font-orbitron text-xs text-muted-foreground tracking-widest mb-2">{stat.label}</div>
              <div className={`font-orbitron text-3xl font-black ${stat.color}`}>{stat.value}</div>
            </div>
          ))}
          <div className="col-span-2 neon-card rounded p-4">
            <div className="font-orbitron text-xs text-muted-foreground tracking-widest mb-3">
              {totalGames === 0 ? "ИСТОРИЯ ИГР ПУСТА" : "СТАТИСТИКА"}
            </div>
            {totalGames === 0 ? (
              <div className="text-center py-6 flex flex-col items-center gap-2">
                <div className="text-4xl opacity-20">🎮</div>
                <div className="font-rajdhani text-sm text-gray-500">Сыграйте первую партию,<br/>чтобы увидеть историю!</div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <span className="font-rajdhani text-sm text-gray-400 w-20">Побед</span>
                  <div className="flex-1 h-2 bg-dark-border rounded-full overflow-hidden">
                    <div className="h-full bg-neon-green rounded-full" style={{width:`${winRate}%`,transition:'width 0.5s'}}/>
                  </div>
                  <span className="font-mono text-xs text-neon-green w-8 text-right">{winRate}%</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-rajdhani text-sm text-gray-400 w-20">Поражений</span>
                  <div className="flex-1 h-2 bg-dark-border rounded-full overflow-hidden">
                    <div className="h-full bg-neon-red rounded-full" style={{width:`${totalGames>0?Math.round((profile.losses/totalGames)*100):0}%`,transition:'width 0.5s'}}/>
                  </div>
                  <span className="font-mono text-xs text-neon-red w-8 text-right">{totalGames>0?Math.round((profile.losses/totalGames)*100):0}%</span>
                </div>
                <div className="mt-2 p-3 bg-dark-bg rounded border border-dark-border flex items-center justify-between">
                  <span className="font-rajdhani text-sm text-gray-400">Кристаллов заработано</span>
                  <span className="font-orbitron text-neon-yellow font-bold">💎 {profile.gems}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ===================== FRIENDS =====================
function FriendsSection() {
  const [search, setSearch] = useState("");
  const [friends, setFriends] = useState<{name:string;rank:string;status:string;game:string;rating:number}[]>([]);
  const [requests, setRequests] = useState<string[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const filtered = friends.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="p-6 animate-fade-in max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-orbitron text-2xl neon-text tracking-wider">ДРУЗЬЯ</h2>
        <div className="flex gap-2">
          <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Никнейм..." onKeyDown={(e)=>e.key==="Enter"&&searchInput.trim()&&(setFriends(f=>[...f,{name:searchInput.trim(),rank:"Новичок",status:"offline",game:"Нет",rating:1000}]),setSearchInput(""))}
            className="bg-dark-card border border-dark-border focus:border-neon-cyan/50 rounded px-3 py-1.5 font-rajdhani text-white text-xs placeholder:text-gray-600 outline-none transition-colors w-32"/>
          <button onClick={() => { if (searchInput.trim()) { setFriends(f=>[...f,{name:searchInput.trim(),rank:"Новичок",status:"offline",game:"Нет",rating:1000}]); setSearchInput(""); }}} className="neon-btn px-3 py-1.5 text-xs rounded cursor-pointer">+ ДОБАВИТЬ</button>
        </div>
      </div>
      {friends.length>0 && (
        <div className="relative mb-4">
          <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neon-cyan/50"/>
          <input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Поиск в списке..."
            className="w-full bg-dark-card border border-dark-border focus:border-neon-cyan/50 rounded px-9 py-2.5 font-rajdhani text-white placeholder:text-gray-600 outline-none transition-colors"/>
        </div>
      )}
      {filtered.length===0 && (
        <div className="text-center py-16 flex flex-col items-center gap-4">
          <div className="text-5xl opacity-30">👥</div>
          <div className="font-orbitron text-sm text-muted-foreground tracking-wide">{friends.length===0?"СПИСОК ПУСТ":"НИКТО НЕ НАЙДЕН"}</div>
          {friends.length===0 && <div className="font-rajdhani text-sm text-gray-600">Введите никнейм и нажмите + ДОБАВИТЬ</div>}
        </div>
      )}
      <div className="flex flex-col gap-2">
        {filtered.map((f) => (
          <div key={f.name} className="neon-card rounded p-4 flex items-center gap-4">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-purple/40 to-neon-cyan/20 border border-neon-purple/50 flex items-center justify-center font-orbitron text-sm font-bold text-neon-purple">{f.name[0].toUpperCase()}</div>
              <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-dark-bg ${f.status==="online"?"bg-neon-green":f.status==="away"?"bg-neon-yellow":"bg-gray-600"}`}/>
            </div>
            <div className="flex-1">
              <div className="font-rajdhani font-bold text-white">{f.name}</div>
              <span className="font-mono text-xs text-muted-foreground">{f.rank}</span>
            </div>
            <div className="font-orbitron text-sm font-bold text-neon-cyan">{f.rating}</div>
            <div className="flex gap-2">
              <button className="neon-btn px-3 py-1.5 text-xs rounded cursor-pointer">ВЫЗОВ</button>
              <button onClick={()=>setFriends(prev=>prev.filter(x=>x.name!==f.name))} className="neon-card px-3 py-1.5 text-xs rounded cursor-pointer text-gray-400 hover:text-neon-red"><Icon name="UserMinus" fallback="X" size={12}/></button>
            </div>
          </div>
        ))}
      </div>
      {requests.length>0 && (
        <div className="mt-6">
          <div className="font-orbitron text-xs text-muted-foreground tracking-widest mb-3">ЗАПРОСЫ ({requests.length})</div>
          {requests.map(name=>(
            <div key={name} className="neon-card rounded p-3 flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 border border-neon-cyan/30 flex items-center justify-center font-orbitron text-xs text-neon-cyan">{name[0]}</div>
              <span className="flex-1 font-rajdhani text-white">{name}</span>
              <button onClick={()=>{setFriends(f=>[...f,{name,rank:"Новичок",status:"online",game:"Нет",rating:1500}]);setRequests(r=>r.filter(x=>x!==name));}} className="neon-btn-primary px-3 py-1.5 text-xs rounded cursor-pointer">✓</button>
              <button onClick={()=>setRequests(r=>r.filter(x=>x!==name))} className="neon-btn px-3 py-1.5 text-xs rounded cursor-pointer">✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ===================== CHAT =====================
function ChatSection() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<{user:string;text:string;time:string;isMe:boolean}[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({behavior:"smooth"}); }, [messages]);
  const send = () => {
    if (!message.trim()) return;
    const now = new Date();
    setMessages(m=>[...m,{user:"Вы",text:message.trim(),time:`${now.getHours()}:${String(now.getMinutes()).padStart(2,"0")}`,isMe:true}]);
    setMessage("");
  };
  return (
    <div className="p-6 animate-fade-in max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-orbitron text-2xl neon-text tracking-wider">ЧАТ</h2>
        <div className="flex items-center gap-2"><div className="glow-dot" style={{width:'6px',height:'6px'}}/><span className="font-mono text-xs text-neon-green">Общий чат</span></div>
      </div>
      <div className="neon-card rounded p-4 mb-3" style={{minHeight:'360px',maxHeight:'360px',overflowY:'auto',display:'flex',flexDirection:'column',gap:'12px'}}>
        {messages.length===0 && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center" style={{minHeight:'300px'}}>
            <div className="text-5xl opacity-20">💬</div>
            <div className="font-orbitron text-sm text-muted-foreground tracking-wide">ЧАТА ЕЩЁ НЕТ</div>
            <div className="font-rajdhani text-sm text-gray-600">Напишите первое сообщение!</div>
          </div>
        )}
        {messages.map((msg,i)=>(
          <div key={i} className={`flex gap-3 ${msg.isMe?"flex-row-reverse":""}`}>
            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center font-orbitron text-xs font-bold border ${msg.isMe?"bg-neon-cyan/20 border-neon-cyan/50 text-neon-cyan":"bg-neon-purple/20 border-neon-purple/50 text-neon-purple"}`}>{msg.user[0]}</div>
            <div className={`flex flex-col gap-1 max-w-xs ${msg.isMe?"items-end":""}`}>
              <div className="flex items-center gap-2"><span className="font-rajdhani text-xs font-bold text-white">{msg.user}</span><span className="font-mono text-[10px] text-gray-600">{msg.time}</span></div>
              <div className={`px-3 py-2 rounded font-rajdhani text-sm ${msg.isMe?"bg-neon-cyan/15 border border-neon-cyan/30 text-white":"bg-dark-border/50 border border-dark-border text-gray-300"}`}>{msg.text}</div>
            </div>
          </div>
        ))}
        <div ref={bottomRef}/>
      </div>
      <div className="flex gap-2">
        <input value={message} onChange={e=>setMessage(e.target.value)} placeholder="Введите сообщение..." onKeyDown={e=>e.key==="Enter"&&send()}
          className="flex-1 bg-dark-card border border-dark-border focus:border-neon-cyan/50 rounded px-4 py-2.5 font-rajdhani text-white placeholder:text-gray-600 outline-none transition-colors"/>
        <button onClick={send} className="neon-btn-primary px-4 py-2.5 rounded cursor-pointer"><Icon name="Send" fallback="ArrowRight" size={16}/></button>
      </div>
    </div>
  );
}

// ===================== SHOP =====================
function ShopSection({ profile, onUpdate }: { profile: ProfileData; onUpdate: (p: ProfileData) => void }) {
  const [activeTab, setActiveTab] = useState<"checkers"|"boards"|"effects">("checkers");
  const items = {
    checkers: [
      { name: "Неоновый Киберпанк", price: 500, preview: "🔵", tag: "NEW" },
      { name: "Огненный Дракон", price: 750, preview: "🔴", tag: "HOT" },
      { name: "Ледяной Кристалл", price: 600, preview: "❄️", tag: "" },
      { name: "Золотой Мастер", price: 1200, preview: "🟡", tag: "" },
      { name: "Тёмная Материя", price: 900, preview: "⚫", tag: "" },
      { name: "Плазменный Шар", price: 450, preview: "🟣", tag: "" },
    ],
    boards: [
      { name: "Звёздная Карта", price: 800, preview: "🌌", tag: "NEW" },
      { name: "Неоновая Сетка", price: 650, preview: "🔷", tag: "" },
      { name: "Каменная Крепость", price: 500, preview: "🗿", tag: "" },
      { name: "Цифровой Лабиринт", price: 1000, preview: "💠", tag: "HOT" },
    ],
    effects: [
      { name: "Взрыв при ударе", price: 300, preview: "💥", tag: "" },
      { name: "След из искр", price: 250, preview: "✨", tag: "" },
      { name: "Голографик", price: 700, preview: "🌀", tag: "" },
    ],
  };
  const currentItems = items[activeTab];
  return (
    <div className="p-6 animate-fade-in max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-orbitron text-2xl neon-text tracking-wider">МАГАЗИН</h2>
        <div className="flex items-center gap-2 neon-card px-4 py-2 rounded">
          <span className="text-neon-yellow text-lg">💎</span>
          <span className="font-orbitron font-bold text-neon-yellow">{profile.gems}</span>
          <button onClick={() => onUpdate({...profile, gems: profile.gems + 500})} className="neon-btn-primary text-xs px-3 py-1 rounded cursor-pointer ml-2">+ 500</button>
        </div>
      </div>
      <div className="flex gap-2 mb-6">
        {(["checkers","boards","effects"] as const).map(tab=>(
          <button key={tab} onClick={()=>setActiveTab(tab)} className={`px-4 py-2 font-orbitron text-xs rounded transition-all cursor-pointer ${activeTab===tab?"bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/50":"text-gray-500 border border-dark-border hover:border-neon-cyan/20"}`}>
            {tab==="checkers"?"ФИШКИ":tab==="boards"?"ДОСКИ":"ЭФФЕКТЫ"}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {currentItems.map(item=>(
          <div key={item.name} className="neon-card rounded p-4 flex flex-col gap-3">
            <div className="relative">
              <div className="h-24 bg-gradient-to-br from-dark-border to-dark-bg rounded flex items-center justify-center text-5xl">{item.preview}</div>
              {item.tag && <span className={`absolute top-1 right-1 font-orbitron text-[9px] px-1.5 py-0.5 font-bold rounded ${item.tag==="NEW"?"bg-neon-green text-dark-bg":"bg-neon-red text-white"}`}>{item.tag}</span>}
            </div>
            <div className="font-rajdhani font-bold text-white text-sm">{item.name}</div>
            <button
              onClick={() => { if (profile.gems >= item.price) onUpdate({...profile, gems: profile.gems - item.price}); }}
              disabled={profile.gems < item.price}
              className={`text-xs py-2 rounded cursor-pointer flex items-center justify-center gap-2 ${profile.gems>=item.price?"neon-btn-primary":"border border-gray-700 text-gray-600 cursor-not-allowed"}`}
            ><span>💎</span>{item.price}</button>
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
  const toggle = (key:keyof typeof toggles)=>setToggles(t=>({...t,[key]:!t[key]}));
  return (
    <div className="p-6 animate-fade-in max-w-3xl mx-auto">
      <h2 className="font-orbitron text-2xl neon-text mb-6 tracking-wider">НАСТРОЙКИ</h2>
      <div className="flex flex-col gap-4">
        <div className="neon-card rounded p-5">
          <div className="font-orbitron text-sm text-neon-cyan mb-4 tracking-widest">АУДИО</div>
          <div className="flex flex-col gap-4">
            {[{label:"Музыка",value:volume,setter:setVolume},{label:"Звуковые эффекты",value:sfx,setter:setSfx}].map(({label,value,setter})=>(
              <div key={label}>
                <div className="flex justify-between mb-2"><span className="font-rajdhani text-gray-300">{label}</span><span className="font-mono text-neon-cyan text-sm">{value}%</span></div>
                <input type="range" min={0} max={100} value={value} onChange={e=>setter(Number(e.target.value))} className="w-full h-1.5 rounded-full appearance-none cursor-pointer" style={{background:`linear-gradient(to right,#00ffff ${value}%,#0d3350 ${value}%)`}}/>
              </div>
            ))}
          </div>
        </div>
        <div className="neon-card rounded p-5">
          <div className="font-orbitron text-sm text-neon-cyan mb-4 tracking-widest">УРОВЕНЬ СЛОЖНОСТИ</div>
          <div className="grid grid-cols-4 gap-2">
            {(["easy","medium","hard","impossible"] as const).map(d=>(
              <button key={d} onClick={()=>setDifficulty(d)} className={`py-2 rounded font-orbitron text-xs cursor-pointer transition-all ${difficulty===d?"bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/50":"border border-dark-border text-gray-500 hover:border-neon-cyan/20"}`}>
                {d==="easy"?"ЛЕГКО":d==="medium"?"СРЕДНЕ":d==="hard"?"СЛОЖНО":"💀 БОЛЬ"}
              </button>
            ))}
          </div>
        </div>
        <div className="neon-card rounded p-5">
          <div className="font-orbitron text-sm text-neon-cyan mb-4 tracking-widest">ИГРОВЫЕ ОПЦИИ</div>
          <div className="flex flex-col gap-4">
            {[{key:"animations",label:"Анимации"},{key:"notifications",label:"Уведомления"},{key:"sounds",label:"Звуки ходов"},{key:"hints",label:"Подсказки"},{key:"autoQueen",label:"Авто-дамка"}].map(({key,label})=>(
              <div key={key} className="flex items-center justify-between">
                <span className="font-rajdhani text-gray-300">{label}</span>
                <button onClick={()=>toggle(key as keyof typeof toggles)} className={`w-12 h-6 rounded-full relative transition-all cursor-pointer ${toggles[key as keyof typeof toggles]?"bg-neon-cyan/30 border border-neon-cyan/50":"bg-dark-border border border-dark-border"}`}>
                  <div className={`absolute top-0.5 w-5 h-5 rounded-full transition-all ${toggles[key as keyof typeof toggles]?"left-6 bg-neon-cyan":"left-0.5 bg-gray-600"}`} style={toggles[key as keyof typeof toggles]?{boxShadow:'0 0 10px #00ffff'}:{}}/>
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
function LeaderboardSection({ profile }: { profile: ProfileData }) {
  const players = [
    { rank:1, name:"Ночной_Король", rating:4250, wins:892, country:"🇷🇺", streak:12 },
    { rank:2, name:"DragonX", rating:4180, wins:743, country:"🇩🇪", streak:7 },
    { rank:3, name:"Квантовый", rating:4050, wins:681, country:"🇺🇸", streak:5 },
    { rank:4, name:"Игрок_7742", rating:3920, wins:612, country:"🇷🇺", streak:3 },
    { rank:5, name:"KnightX", rating:3850, wins:589, country:"🇫🇷", streak:0 },
    { rank:6, name:"Призрак_54", rating:3720, wins:534, country:"🇧🇷", streak:8 },
    { rank:7, name:"Борец99", rating:3650, wins:498, country:"🇷🇺", streak:2 },
    { rank:8, name:"Мастер_шашек", rating:3580, wins:467, country:"🇰🇷", streak:4 },
    { rank:999, name:profile.nickname, rating:profile.rating, wins:profile.wins, country:"🇷🇺", streak:0, isMe:true },
  ];
  const sorted = [...players].sort((a,b)=>b.rating-a.rating).map((p,i)=>({...p,rank:i+1}));
  const me = sorted.find(p=>p.isMe);
  const top8 = sorted.filter(p=>!p.isMe).slice(0,8);
  const medalColors: Record<number,string>={1:"#FFD700",2:"#C0C0C0",3:"#CD7F32"};
  return (
    <div className="p-6 animate-fade-in max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-orbitron text-2xl neon-text tracking-wider">ТАБЛИЦА ЛИДЕРОВ</h2>
        <div className="font-mono text-xs text-muted-foreground">Обновлено: только что</div>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[sorted[1],sorted[0],sorted[2]].map((p,i)=>(
          <div key={p.rank} className={`neon-card rounded p-4 flex flex-col items-center gap-2 ${i===1?"neon-border":""}`}>
            <div className="font-orbitron text-2xl">{p.rank===1?"🏆":p.rank===2?"🥈":"🥉"}</div>
            <div className="font-orbitron text-sm font-bold text-white">{p.name}</div>
            <div className="font-mono text-xs text-muted-foreground">{p.country}</div>
            <div className="font-orbitron text-xl font-black" style={{color:medalColors[p.rank]||'#00ffff'}}>{p.rating}</div>
          </div>
        ))}
      </div>
      <div className="neon-card rounded overflow-hidden">
        <div className="grid grid-cols-5 gap-2 px-4 py-3 border-b border-dark-border">
          {["#","ИГРОК","РЕЙТИНГ","ПОБЕДЫ","СЕРИЯ"].map(h=><div key={h} className="font-orbitron text-xs text-muted-foreground tracking-widest">{h}</div>)}
        </div>
        {[...top8, ...(me?[me]:[])].map(p=>(
          <div key={p.name} className={`grid grid-cols-5 gap-2 px-4 py-3 border-b border-dark-border/50 transition-all ${p.isMe?"bg-neon-cyan/5 border-l-2 border-l-neon-cyan":"hover:bg-dark-border/30"}`}>
            <div className="font-orbitron text-sm" style={p.rank<=3?{color:medalColors[p.rank]}:{}}>{p.rank<=3?["🥇","🥈","🥉"][p.rank-1]:`#${p.rank}`}</div>
            <div className="flex items-center gap-2">
              <span>{p.country}</span>
              <span className={`font-rajdhani font-bold ${p.isMe?"text-neon-cyan":"text-white"}`}>{p.name}{p.isMe&&<span className="text-[10px] text-neon-cyan ml-1">(ВЫ)</span>}</span>
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
  const [profile, setProfile] = useState<ProfileData>(loadProfile);

  const updateProfile = (p: ProfileData) => {
    setProfile(p);
    saveProfile(p);
  };

  const handleGameEnd = useCallback((result: "win"|"loss"|"draw") => {
    setProfile(prev => {
      const ratingDelta = result === "win" ? 18 : result === "loss" ? -12 : 2;
      const gemsDelta = result === "win" ? 50 : result === "draw" ? 10 : 5;
      const next: ProfileData = {
        ...prev,
        wins: prev.wins + (result === "win" ? 1 : 0),
        losses: prev.losses + (result === "loss" ? 1 : 0),
        draws: prev.draws + (result === "draw" ? 1 : 0),
        rating: Math.max(100, prev.rating + ratingDelta),
        gems: prev.gems + gemsDelta,
      };
      saveProfile(next);
      return next;
    });
  }, []);

  const renderSection = () => {
    switch (activeSection) {
      case "menu": return <MenuSection onNavigate={setActiveSection} profile={profile} />;
      case "game": return <GameSection onGameEnd={handleGameEnd} />;
      case "profile": return <ProfileSection profile={profile} onUpdate={updateProfile} />;
      case "friends": return <FriendsSection />;
      case "chat": return <ChatSection />;
      case "shop": return <ShopSection profile={profile} onUpdate={updateProfile} />;
      case "settings": return <SettingsSection />;
      case "leaderboard": return <LeaderboardSection profile={profile} />;
    }
  };

  const isPhotoAvatar = profile.avatar.startsWith("data:");

  return (
    <div className="min-h-screen flex flex-col" style={{background:"var(--dark-bg)"}}>
      <header className="sticky top-0 z-50 border-b border-dark-border bg-dark-bg/90 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="font-orbitron font-black text-lg neon-text tracking-wider">
            CHECK<span className="text-neon-purple" style={{textShadow:'0 0 10px #9b30ff'}}>MATE</span>
          </div>
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map(item=>(
              <button key={item.id} onClick={()=>setActiveSection(item.id as Section)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all cursor-pointer font-rajdhani text-sm font-semibold tracking-wide ${activeSection===item.id?"text-neon-cyan bg-neon-cyan/10 border border-neon-cyan/30":"text-gray-500 hover:text-gray-300"}`}>
                <Icon name={item.icon} fallback="Home" size={14}/>
                {item.label}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="glow-dot" style={{width:'6px',height:'6px'}}/>
              <span className="font-mono text-xs text-neon-green hidden sm:block">2,847</span>
            </div>
            <div className="flex items-center gap-1.5 neon-card px-2 py-1 rounded">
              <span className="text-neon-yellow text-sm">💎</span>
              <span className="font-orbitron text-xs font-bold text-neon-yellow">{profile.gems}</span>
            </div>
            <button onClick={()=>setActiveSection("profile")} className="w-7 h-7 rounded-full border border-neon-cyan/50 overflow-hidden flex items-center justify-center cursor-pointer"
              style={{background:'linear-gradient(135deg,rgba(0,255,255,0.15),rgba(155,48,255,0.15))'}}>
              {isPhotoAvatar
                ? <img src={profile.avatar} alt="av" className="w-full h-full object-cover"/>
                : <span className="text-sm">{profile.avatar}</span>
              }
            </button>
          </div>
        </div>
        <div className="flex md:hidden border-t border-dark-border overflow-x-auto">
          {NAV_ITEMS.map(item=>(
            <button key={item.id} onClick={()=>setActiveSection(item.id as Section)}
              className={`flex flex-col items-center gap-0.5 px-3 py-2 flex-shrink-0 transition-all cursor-pointer ${activeSection===item.id?"text-neon-cyan":"text-gray-600"}`}>
              <Icon name={item.icon} fallback="Home" size={16}/>
              <span className="font-orbitron text-[9px] tracking-wide">{item.label}</span>
            </button>
          ))}
        </div>
      </header>
      <main className="flex-1 overflow-y-auto">{renderSection()}</main>
    </div>
  );
}