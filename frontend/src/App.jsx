import { useState, useRef, useEffect, useCallback } from 'react';
import LoginScreen from './components/LoginScreen';
import LobbyScreen from './components/LobbyScreen';
import WaitingScreen from './components/WaitingScreen';
import SetupScreen from './components/SetupScreen';
import GameScreen from './components/GameScreen';
import ResultScreen from './components/ResultScreen';
import CyberBackground from './components/CyberBackground';
import GamerHUD from './components/GamerHUD';
import FloatingReactions from './components/FloatingReactions';
import CustomCursor from './components/CustomCursor';
import MascotCompanion from './components/MascotCompanion';
import DoodlePad from './components/DoodlePad';
import { sounds } from './utils/audio';

const WS_URL = import.meta.env.VITE_WS_URL || (
  typeof window !== 'undefined'
    ? (window.location.protocol === 'https:'
        ? `wss://${window.location.host}`
        : `ws://${window.location.hostname}:3001`)
    : 'ws://localhost:3001'
);

// Get or create unique player token stored for session recovery
function getPlayerToken() {
  let token = sessionStorage.getItem('sk_token');
  if (!token) {
    token = 'usr_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
    sessionStorage.setItem('sk_token', token);
  }
  return token;
}

export default function App() {
  const [theme, setTheme]                   = useState(() => localStorage.getItem('sk_theme') || 'cyber');
  const [screen, setScreen]                 = useState('login');
  const [playerName, setPlayerName]         = useState('');
  const [playerAvatar, setPlayerAvatar]     = useState(() => localStorage.getItem('sk_avatar') || '⚡');
  const [roomCode, setRoomCode]             = useState('');
  const [numDigits, setNumDigits]           = useState(4);
  const [allowDuplicates, setAllowDuplicates] = useState(true);
  const [isHost, setIsHost]                 = useState(false);
  const [opponentName, setOpponentName]     = useState('');
  const [myGuesses, setMyGuesses]           = useState([]);
  const [oppGuesses, setOppGuesses]         = useState([]);
  const [isMyTurn, setIsMyTurn]             = useState(false);
  const [iAmReady, setIAmReady]             = useState(false);
  const [opponentReady, setOpponentReady]   = useState(false);
  const [gameResult, setGameResult]         = useState(null);
  const [error, setError]                   = useState('');
  const [oppDisconnected, setOppDisc]       = useState(false);
  const [oppReconnecting, setOppRecon]      = useState(false);
  const [incomingReaction, setIncomingReaction] = useState(null);
  const [incomingQuickChat, setIncomingQuickChat] = useState(null);
  const [incomingDoodle, setIncomingDoodle]   = useState(null);
  const [scores, setScores]                 = useState({ hostWins: 0, guestWins: 0, streak: 0, streakHolder: null });

  const wsRef = useRef(null);
  const playerToken = useRef(getPlayerToken()).current;

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('sk_theme', theme);
  }, [theme]);

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
  };

  // ── Send helper ────────────────────────────────────────────
  const sendMsg = useCallback((data) => {
    const ws = wsRef.current;
    if (!ws) return setError('Not connected. Please refresh.');

    const activeRoom = roomCode || sessionStorage.getItem('sk_room');
    const payload = { ...data, playerToken, roomCode: activeRoom, code: activeRoom };

    if (ws.readyState === WebSocket.CONNECTING) {
      ws.addEventListener('open', () => ws.send(JSON.stringify(payload)), { once: true });
    } else if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload));
    } else {
      setError('Connection lost. Please refresh the page.');
    }
  }, [playerToken, roomCode]);

  // ── Server message handler ──────────────────────────────────
  const handleServerMessage = useCallback((msg) => {
    setError('');
    switch (msg.type) {
      case 'ROOM_CREATED':
        setRoomCode(msg.code);
        setNumDigits(msg.numDigits);
        if (msg.allowDuplicates !== undefined) setAllowDuplicates(msg.allowDuplicates);
        setIsHost(true);
        sessionStorage.setItem('sk_room', msg.code);
        setScreen('waiting');
        break;

      case 'ROOM_JOINED':
        setRoomCode(msg.code);
        setNumDigits(msg.numDigits);
        if (msg.allowDuplicates !== undefined) setAllowDuplicates(msg.allowDuplicates);
        setIsHost(false);
        setOpponentName(msg.opponentName);
        if (msg.hostWins !== undefined) setScores({ hostWins: msg.hostWins, guestWins: msg.guestWins, streak: msg.streak, streakHolder: msg.streakHolder });
        sessionStorage.setItem('sk_room', msg.code);
        setScreen('waiting');
        break;

      case 'OPPONENT_JOINED':
        setOpponentName(msg.opponentName);
        if (msg.hostWins !== undefined) setScores(prev => ({ ...prev, hostWins: msg.hostWins, guestWins: msg.guestWins }));
        break;

      case 'GAME_SETUP':
        setNumDigits(msg.numDigits);
        if (msg.allowDuplicates !== undefined) setAllowDuplicates(msg.allowDuplicates);
        setMyGuesses([]);
        setOppGuesses([]);
        setIAmReady(false);
        setOpponentReady(false);
        setGameResult(null);
        setOppDisc(false);
        setOppRecon(false);
        if (msg.hostWins !== undefined) {
          setScores({ hostWins: msg.hostWins, guestWins: msg.guestWins, streak: msg.streak, streakHolder: msg.streakHolder });
        }
        setScreen('setup');
        break;

      case 'SECRET_SET':
        setIAmReady(true);
        break;

      case 'OPPONENT_READY':
        setOpponentReady(true);
        break;

      case 'GAME_START':
        setIsMyTurn(msg.isYourTurn);
        if (msg.isYourTurn) sounds.playTurn();
        setOpponentName(msg.opponentName);
        if (msg.allowDuplicates !== undefined) setAllowDuplicates(msg.allowDuplicates);
        setScreen('game');
        break;

      case 'GUESS_RESULT':
        setMyGuesses(prev => [...prev, msg]);
        sounds.playClick();
        break;

      case 'OPPONENT_GUESSED':
        setOppGuesses(prev => [...prev, msg]);
        sounds.playTurn();
        break;

      case 'OPPONENT_REACTION':
        setIncomingReaction({
          emoji: msg.emoji,
          senderName: msg.senderName,
          timestamp: Date.now(),
        });
        break;

      case 'OPPONENT_QUICK_CHAT':
        setIncomingQuickChat({
          text: msg.text,
          senderName: msg.senderName,
          timestamp: Date.now(),
        });
        break;

      case 'OPPONENT_DOODLE':
        setIncomingDoodle(msg);
        break;

      case 'TURN_CHANGE':
        setIsMyTurn(msg.isYourTurn);
        if (msg.isYourTurn) sounds.playTurn();
        break;

      case 'GAME_OVER':
        setGameResult(msg);
        if (msg.hostWins !== undefined) {
          setScores({ hostWins: msg.hostWins, guestWins: msg.guestWins, streak: msg.streak, streakHolder: msg.streakHolder });
        }
        if (msg.won) sounds.playWin();
        else sounds.playLoss();
        setScreen('result');
        break;

      case 'OPPONENT_TEMPORARILY_DISCONNECTED':
        setOppRecon(true);
        break;

      case 'OPPONENT_RECONNECTED':
        setOppRecon(false);
        break;

      case 'OPPONENT_DISCONNECTED':
        setOppRecon(false);
        setOppDisc(true);
        break;

      case 'RECONNECT_SUCCESS':
        setRoomCode(msg.code);
        setNumDigits(msg.numDigits);
        if (msg.allowDuplicates !== undefined) setAllowDuplicates(msg.allowDuplicates);
        setIsHost(msg.isHost);
        setPlayerName(msg.playerName);
        setOpponentName(msg.opponentName);
        setIAmReady(msg.myReady);
        setOpponentReady(msg.oppReady);
        setMyGuesses(msg.myGuesses || []);
        setOppGuesses(msg.oppGuesses || []);
        setIsMyTurn(msg.isYourTurn);
        setOppDisc(false);
        setOppRecon(false);
        if (msg.hostWins !== undefined) {
          setScores({ hostWins: msg.hostWins, guestWins: msg.guestWins, streak: msg.streak, streakHolder: msg.streakHolder });
        }

        if (msg.status === 'waiting') setScreen('waiting');
        else if (msg.status === 'setup') setScreen('setup');
        else if (msg.status === 'playing') setScreen('game');
        else if (msg.status === 'finished') {
          setGameResult({
            won: msg.winnerName === msg.playerName,
            winnerName: msg.winnerName,
            mySecret: msg.mySecret,
            opponentSecret: msg.opponentSecret,
            myGuesses: (msg.myGuesses || []).length,
            opponentGuesses: (msg.oppGuesses || []).length,
          });
          setScreen('result');
        }
        break;

      case 'ERROR':
        setError(msg.message);
        break;

      default:
        break;
    }
  }, []);

  // ── Connect WebSocket ────────────────────────────────────────
  const connect = useCallback((name) => {
    const ws = new WebSocket(WS_URL);

    ws.onmessage = (e) => {
      try { handleServerMessage(JSON.parse(e.data)); }
      catch (err) { console.error('Parse error:', err); }
    };

    ws.onopen = () => {
      const savedRoom = sessionStorage.getItem('sk_room');
      if (savedRoom) {
        ws.send(JSON.stringify({ type: 'RECONNECT', code: savedRoom, playerToken }));
      }
    };

    ws.onerror = () => setError('Connection error. Make sure the backend is running.');
    ws.onclose = () => console.log('WS closed');

    wsRef.current = ws;
  }, [handleServerMessage, playerToken]);

  useEffect(() => () => wsRef.current?.close(), []);

  // Auto-restore player name from sessionStorage if present
  useEffect(() => {
    const savedName = sessionStorage.getItem('sk_name');
    if (savedName) {
      setPlayerName(savedName);
      connect(savedName);
      const savedRoom = sessionStorage.getItem('sk_room');
      if (!savedRoom) setScreen('lobby');
    }
  }, [connect]);

  // ── Actions ────────────────────────────────────────────────
  const handleStart = (name, avatar = '⚡') => {
    sessionStorage.setItem('sk_name', name);
    localStorage.setItem('sk_avatar', avatar);
    setPlayerName(name);
    setPlayerAvatar(avatar);
    connect(name);
    setScreen('lobby');
  };
  const handleCreateRoom  = (d, dups = true) => {
    setError('');
    sendMsg({ type: 'CREATE_ROOM', playerName, numDigits: d, allowDuplicates: dups });
  };
  const handleJoinRoom    = (code) => { setError(''); sendMsg({ type: 'JOIN_ROOM', playerName, code }); };
  const handleSetSecret   = (s)    => sendMsg({ type: 'SET_SECRET',  secret: s });
  const handleGuess       = (g)    => sendMsg({ type: 'MAKE_GUESS',  guess: g  });
  const handleTimeout     = ()     => sendMsg({ type: 'TURN_TIMEOUT' });
  const handlePlayAgain   = ()     => sendMsg({ type: 'PLAY_AGAIN' });
  const handleSendReaction = (emoji) => sendMsg({ type: 'SEND_REACTION', emoji });
  const handleSendQuickChat = (text)  => sendMsg({ type: 'SEND_QUICK_CHAT', text });
  const handleSendDoodle   = (points, color, clear) => sendMsg({ type: 'LIVE_DOODLE', points, color, clear });
  const handleNewGame     = ()     => {
    sessionStorage.removeItem('sk_room');
    setMyGuesses([]); setOppGuesses([]); setGameResult(null);
    setIAmReady(false); setOpponentReady(false);
    setRoomCode(''); setOpponentName(''); setOppDisc(false); setOppRecon(false); setIsHost(false);
    setScreen('lobby');
  };

  // ── Render ─────────────────────────────────────────────────
  return (
    <>
      <CustomCursor theme={theme} />
      <CyberBackground theme={theme} />
      <GamerHUD
        playerName={playerName}
        playerAvatar={playerAvatar}
        roomCode={roomCode}
        currentTheme={theme}
        onThemeChange={handleThemeChange}
        scores={{ ...scores, isHost }}
      />
      {oppReconnecting && (
        <div style={{
          position: 'fixed', top: '42px', left: 0, right: 0,
          background: 'rgba(255, 170, 0, 0.95)', color: '#000',
          padding: '0.45rem', textAlign: 'center', fontSize: '0.8rem',
          fontWeight: '700', zIndex: 9999, letterSpacing: '0.05em'
        }}>
          ⚠️ Opponent temporarily disconnected — waiting 45s for reconnect…
        </div>
      )}

      {screen === 'login' && (
        <LoginScreen onStart={handleStart} />
      )}
      {screen === 'lobby' && (
        <LobbyScreen
          playerName={playerName}
          error={error}
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
        />
      )}
      {screen === 'waiting' && (
        <WaitingScreen
          roomCode={roomCode}
          isHost={isHost}
          playerName={playerName}
          opponentName={opponentName}
          numDigits={numDigits}
          allowDuplicates={allowDuplicates}
        />
      )}
      {screen === 'setup' && (
        <SetupScreen
          numDigits={numDigits}
          allowDuplicates={allowDuplicates}
          playerName={playerName}
          opponentName={opponentName}
          iAmReady={iAmReady}
          opponentReady={opponentReady}
          onSetSecret={handleSetSecret}
        />
      )}
      {screen === 'game' && (
        <GameScreen
          numDigits={numDigits}
          allowDuplicates={allowDuplicates}
          playerName={playerName}
          opponentName={opponentName}
          myGuesses={myGuesses}
          oppGuesses={oppGuesses}
          isMyTurn={isMyTurn}
          onGuess={handleGuess}
          onTimeout={handleTimeout}
          oppDisconnected={oppDisconnected}
          serverError={error}
        />
      )}
      {screen === 'result' && gameResult && (
        <ResultScreen
          won={gameResult.won}
          winnerName={gameResult.winnerName}
          playerName={playerName}
          opponentName={opponentName}
          mySecret={gameResult.mySecret}
          opponentSecret={gameResult.opponentSecret}
          myGuessCount={gameResult.myGuesses}
          oppGuessCount={gameResult.opponentGuesses}
          onPlayAgain={handlePlayAgain}
          onNewGame={handleNewGame}
          theme={theme}
          scores={{ ...scores, isHost }}
        />
      )}

      {/* Interactive Mascot Companion */}
      {screen !== 'login' && (
        <MascotCompanion
          theme={theme}
          screen={screen}
          isMyTurn={isMyTurn}
          won={gameResult?.won}
        />
      )}

      {/* Live Shared Doodle Pad (in active match) */}
      {roomCode && screen !== 'login' && (
        <DoodlePad
          onSendDoodle={handleSendDoodle}
          incomingDoodle={incomingDoodle}
        />
      )}

      {/* Live real-time reactions and quick chat taunts */}
      {roomCode && screen !== 'login' && (
        <FloatingReactions
          onSendReaction={handleSendReaction}
          incomingReaction={incomingReaction}
          onSendQuickChat={handleSendQuickChat}
          incomingQuickChat={incomingQuickChat}
        />
      )}
    </>
  );
}
