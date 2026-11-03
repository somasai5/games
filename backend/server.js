const WebSocket = require('ws');
const http = require('http');
const express = require('express');
const path = require('path');

const app = express();

// ── HTTP Security Headers (OWASP Hardening) ────────────────────────────────
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  next();
});

const server = http.createServer(app);

// Enforce 16KB max payload on WebSockets to prevent memory exhaustion attacks
const wss = new WebSocket.Server({ server, maxPayload: 16384 });

const rooms = new Map();
let clientCounter = 0;

// ── Input Sanitization & Helpers ───────────────────────────────────────────

function sanitizeString(str, maxLen = 20) {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/<[^>]*>?/gm, '').trim().substring(0, maxLen);
}

function sanitizeDigits(digits, maxLen = 6) {
  if (!digits || typeof digits !== 'string') return '';
  return digits.replace(/\D/g, '').substring(0, maxLen);
}

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

/**
 * Bulls & Cows checker
 * Bulls = correct digit in correct position
 * Cows  = correct digit in wrong position
 */
function checkGuess(secret, guess) {
  const sArr = secret.split('');
  const gArr = guess.split('');
  const sUsed = new Array(sArr.length).fill(false);
  const gUsed = new Array(gArr.length).fill(false);
  let bulls = 0, cows = 0;

  // Pass 1 – bulls
  for (let i = 0; i < sArr.length; i++) {
    if (sArr[i] === gArr[i]) { bulls++; sUsed[i] = gUsed[i] = true; }
  }
  // Pass 2 – cows
  for (let i = 0; i < gArr.length; i++) {
    if (gUsed[i]) continue;
    for (let j = 0; j < sArr.length; j++) {
      if (!sUsed[j] && gArr[i] === sArr[j]) { cows++; sUsed[j] = true; break; }
    }
  }
  return { bulls, cows };
}

function send(ws, data) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  }
}

function findClient(clientId) {
  for (const client of wss.clients) {
    if (client.clientId === clientId) return client;
  }
  return null;
}

// ── Connection Handler & Rate Limiter ──────────────────────────────────────

wss.on('connection', (ws) => {
  ws.clientId = `c${++clientCounter}`;
  ws.roomCode = null;
  ws.isAlive = true;

  // Token bucket rate limiting: max 12 messages per second per connection
  ws.msgCount = 0;
  ws.lastReset = Date.now();

  ws.on('pong', () => {
    ws.isAlive = true;
  });

  ws.on('message', (raw) => {
    try {
      const now = Date.now();
      if (now - ws.lastReset > 1000) {
        ws.msgCount = 0;
        ws.lastReset = now;
      }
      ws.msgCount++;
      if (ws.msgCount > 14) {
        return send(ws, { type: 'ERROR', message: 'Rate limit exceeded. Please slow down.' });
      }

      handleMessage(ws, JSON.parse(raw.toString()));
    } catch (e) {
      console.error('Parse error:', e.message);
    }
  });

  ws.on('close', () => handleDisconnect(ws));
  ws.on('error', (e) => console.error('WS error:', e.message));
});

// Ping keep-alive every 25 seconds
const pingInterval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) return ws.terminate();
    ws.isAlive = false;
    ws.ping();
  });
}, 25000);

wss.on('close', () => clearInterval(pingInterval));

// ── Message Router ─────────────────────────────────────────────────────────

function handleMessage(ws, msg) {
  const { type, playerToken } = msg;

  // ── RECONNECT ──
  if (type === 'RECONNECT') {
    const code = sanitizeString(msg.code, 8).toUpperCase();
    const room = rooms.get(code);
    if (!room) {
      return send(ws, { type: 'RECONNECT_FAILED', message: 'Room no longer exists.' });
    }

    const isHost = room.hostToken === playerToken;
    const isGuest = room.guestToken === playerToken;

    if (!isHost && !isGuest) {
      return send(ws, { type: 'RECONNECT_FAILED', message: 'Session token expired.' });
    }

    // Cancel pending disconnect grace timer
    if (isHost && room.hostDisconnectTimer) {
      clearTimeout(room.hostDisconnectTimer);
      room.hostDisconnectTimer = null;
    }
    if (isGuest && room.guestDisconnectTimer) {
      clearTimeout(room.guestDisconnectTimer);
      room.guestDisconnectTimer = null;
    }

    if (isHost) room.hostId = ws.clientId;
    if (isGuest) room.guestId = ws.clientId;
    ws.roomCode = code;

    const opponentId = isHost ? room.guestId : room.hostId;
    const opponentWs = opponentId ? findClient(opponentId) : null;
    if (opponentWs) {
      send(opponentWs, { type: 'OPPONENT_RECONNECTED' });
    }

    // Send full current state to reconnected player
    send(ws, {
      type: 'RECONNECT_SUCCESS',
      code: room.code,
      numDigits: room.numDigits,
      allowDuplicates: room.allowDuplicates !== false,
      isHost,
      status: room.status,
      playerName: isHost ? room.hostName : room.guestName,
      opponentName: isHost ? room.guestName : room.hostName,
      myReady: isHost ? room.hostReady : room.guestReady,
      oppReady: isHost ? room.guestReady : room.hostReady,
      isYourTurn: room.status === 'playing' ? (room.currentTurn === (isHost ? 'host' : 'guest')) : false,
      myGuesses: isHost ? room.hostGuesses : room.guestGuesses,
      oppGuesses: isHost ? room.guestGuesses : room.hostGuesses,
      winnerName: room.winnerName || null,
      mySecret: isHost ? room.hostSecret : room.guestSecret,
      opponentSecret: room.status === 'finished' ? (isHost ? room.guestSecret : room.hostSecret) : null,
      hostWins: room.hostWins || 0,
      guestWins: room.guestWins || 0,
      streak: room.streak || 0,
      streakHolder: room.streakHolder || null,
    });
    return;
  }

  // ── CREATE ROOM ──
  if (type === 'CREATE_ROOM') {
    let code;
    let tries = 0;
    do { code = generateRoomCode(); tries++; } while (rooms.has(code) && tries < 100);

    const safeDigits = Math.max(1, Math.min(6, parseInt(msg.numDigits) || 4));
    const safeName = sanitizeString(msg.playerName, 18) || 'PLAYER 1';

    const room = {
      code,
      hostId: ws.clientId,
      hostToken: playerToken || ws.clientId,
      hostName: safeName,
      guestId: null,
      guestToken: null,
      guestName: null,
      numDigits: safeDigits,
      allowDuplicates: msg.allowDuplicates !== false,
      hostSecret: null, guestSecret: null,
      hostReady: false, guestReady: false,
      currentTurn: 'host',
      hostGuesses: [], guestGuesses: [],
      status: 'waiting',
      hostWins: 0,
      guestWins: 0,
      streak: 0,
      streakHolder: null,
      hostDisconnectTimer: null,
      guestDisconnectTimer: null,
    };
    rooms.set(code, room);
    ws.roomCode = code;

    send(ws, { type: 'ROOM_CREATED', code, numDigits: room.numDigits, allowDuplicates: room.allowDuplicates, hostWins: 0, guestWins: 0 });
    return;
  }

  // ── JOIN ROOM ──
  if (type === 'JOIN_ROOM') {
    const code = sanitizeString(msg.code, 8).toUpperCase();
    const room = rooms.get(code);

    if (!room) return send(ws, { type: 'ERROR', message: 'Room not found! Check the code.' });
    if (room.guestId && room.guestToken !== playerToken) {
      return send(ws, { type: 'ERROR', message: 'Room is already full!' });
    }
    if (room.status !== 'waiting' && room.guestToken !== playerToken) {
      return send(ws, { type: 'ERROR', message: 'Game already in progress!' });
    }
    if (room.hostId === ws.clientId) {
      return send(ws, { type: 'ERROR', message: 'You cannot join your own room!' });
    }

    const safeName = sanitizeString(msg.playerName, 18) || 'PLAYER 2';
    room.guestId = ws.clientId;
    room.guestToken = playerToken || ws.clientId;
    room.guestName = safeName;
    ws.roomCode = code;

    send(ws, {
      type: 'ROOM_JOINED',
      code,
      numDigits: room.numDigits,
      allowDuplicates: room.allowDuplicates,
      opponentName: room.hostName,
      hostWins: room.hostWins || 0,
      guestWins: room.guestWins || 0,
      streak: room.streak || 0,
      streakHolder: room.streakHolder || null,
    });
    const hostWs = findClient(room.hostId);
    if (hostWs) send(hostWs, {
      type: 'OPPONENT_JOINED',
      opponentName: room.guestName,
      hostWins: room.hostWins || 0,
      guestWins: room.guestWins || 0,
    });

    // Start setup phase
    room.status = 'setup';
    setTimeout(() => {
      send(ws, { type: 'GAME_SETUP', numDigits: room.numDigits, allowDuplicates: room.allowDuplicates });
      if (hostWs) send(hostWs, { type: 'GAME_SETUP', numDigits: room.numDigits, allowDuplicates: room.allowDuplicates });
    }, 600);
    return;
  }

  // All subsequent messages require an active room
  const targetCode = ws.roomCode || (msg.roomCode ? sanitizeString(msg.roomCode, 8).toUpperCase() : (msg.code ? sanitizeString(msg.code, 8).toUpperCase() : null));
  const room = targetCode ? rooms.get(targetCode) : null;
  if (!room) {
    return send(ws, { type: 'ERROR', message: 'Room not found. Please refresh.' });
  }

  // Ensure ws is bound to room
  if (!ws.roomCode) ws.roomCode = room.code;

  // Resilient session token matching
  let isHost = false;
  if (playerToken && room.hostToken === playerToken) {
    isHost = true;
    room.hostId = ws.clientId;
  } else if (playerToken && room.guestToken === playerToken) {
    isHost = false;
    room.guestId = ws.clientId;
  } else {
    isHost = room.hostId === ws.clientId;
  }

  // Keep socket references up to date
  if (isHost) {
    room.hostId = ws.clientId;
  } else if (room.guestToken === playerToken || room.guestId === ws.clientId) {
    room.guestId = ws.clientId;
  }

  const opponentId = isHost ? room.guestId : room.hostId;
  const opponentWs = opponentId ? findClient(opponentId) : null;

  // ── SET SECRET ──
  if (type === 'SET_SECRET') {
    if (room.status !== 'setup') return;
    const safeSecret = sanitizeDigits(msg.secret, room.numDigits);

    if (safeSecret.length !== room.numDigits) {
      return send(ws, { type: 'ERROR', message: `Secret must be exactly ${room.numDigits} digits!` });
    }

    if (!room.allowDuplicates && new Set(safeSecret.split('')).size !== safeSecret.length) {
      return send(ws, { type: 'ERROR', message: 'Duplicate digits are not allowed in this room!' });
    }

    if (isHost) { room.hostSecret = safeSecret; room.hostReady = true; }
    else        { room.guestSecret = safeSecret; room.guestReady = true; }

    send(ws, { type: 'SECRET_SET' });
    if (opponentWs) send(opponentWs, { type: 'OPPONENT_READY' });

    if (room.hostReady && room.guestReady) {
      room.status = 'playing';
      room.currentTurn = 'host';
      const hostWs = findClient(room.hostId);
      const guestWs = findClient(room.guestId);
      if (hostWs) send(hostWs,  { type: 'GAME_START', isYourTurn: true,  opponentName: room.guestName, allowDuplicates: room.allowDuplicates });
      if (guestWs) send(guestWs, { type: 'GAME_START', isYourTurn: false, opponentName: room.hostName, allowDuplicates: room.allowDuplicates });
    }
    return;
  }

  // ── MAKE GUESS ──
  if (type === 'MAKE_GUESS') {
    if (room.status !== 'playing') return;
    const role = isHost ? 'host' : 'guest';
    if (room.currentTurn !== role) {
      return send(ws, { type: 'ERROR', message: "It's not your turn!" });
    }

    const safeGuess = sanitizeDigits(msg.guess, room.numDigits);
    if (safeGuess.length !== room.numDigits) {
      return send(ws, { type: 'ERROR', message: `Guess must be exactly ${room.numDigits} digits!` });
    }

    if (!room.allowDuplicates && new Set(safeGuess.split('')).size !== safeGuess.length) {
      return send(ws, { type: 'ERROR', message: 'Duplicate digits are not allowed in this room!' });
    }

    const secret = isHost ? room.guestSecret : room.hostSecret;
    const { bulls, cows } = checkGuess(secret, safeGuess);
    const attempt = (isHost ? room.hostGuesses : room.guestGuesses).length + 1;
    const entry = { guess: safeGuess, bulls, cows, attempt };
    if (isHost) room.hostGuesses.push(entry); else room.guestGuesses.push(entry);

    send(ws, { type: 'GUESS_RESULT', ...entry });
    if (opponentWs) send(opponentWs, { type: 'OPPONENT_GUESSED', ...entry });

    // Win condition
    if (bulls === room.numDigits) {
      room.status = 'finished';
      const winnerName = isHost ? room.hostName : room.guestName;
      room.winnerName = winnerName;

      // Update head-to-head score and win streak
      if (isHost) {
        room.hostWins = (room.hostWins || 0) + 1;
        if (room.streakHolder === 'host') {
          room.streak = (room.streak || 1) + 1;
        } else {
          room.streakHolder = 'host';
          room.streak = 1;
        }
      } else {
        room.guestWins = (room.guestWins || 0) + 1;
        if (room.streakHolder === 'guest') {
          room.streak = (room.streak || 1) + 1;
        } else {
          room.streakHolder = 'guest';
          room.streak = 1;
        }
      }

      const scorePayload = {
        hostWins: room.hostWins,
        guestWins: room.guestWins,
        streak: room.streak,
        streakHolder: room.streakHolder,
      };

      const hostWs = findClient(room.hostId);
      const guestWs = findClient(room.guestId);
      if (hostWs) send(hostWs, {
        type: 'GAME_OVER', won: isHost, winnerName,
        mySecret: room.hostSecret, opponentSecret: room.guestSecret,
        myGuesses: room.hostGuesses.length, opponentGuesses: room.guestGuesses.length,
        ...scorePayload,
      });
      if (guestWs) send(guestWs, {
        type: 'GAME_OVER', won: !isHost, winnerName,
        mySecret: room.guestSecret, opponentSecret: room.hostSecret,
        myGuesses: room.guestGuesses.length, opponentGuesses: room.hostGuesses.length,
        ...scorePayload,
      });
      return;
    }

    // Switch turns
    room.currentTurn = room.currentTurn === 'host' ? 'guest' : 'host';
    const hostWs = findClient(room.hostId);
    const guestWs = findClient(room.guestId);
    if (hostWs)  send(hostWs,  { type: 'TURN_CHANGE', isYourTurn: room.currentTurn === 'host' });
    if (guestWs) send(guestWs, { type: 'TURN_CHANGE', isYourTurn: room.currentTurn === 'guest' });
    return;
  }

  // ── TURN TIMEOUT ──
  if (type === 'TURN_TIMEOUT') {
    if (room.status !== 'playing') return;
    const role = isHost ? 'host' : 'guest';
    if (room.currentTurn !== role) return;

    room.currentTurn = room.currentTurn === 'host' ? 'guest' : 'host';
    const hostWs = findClient(room.hostId);
    const guestWs = findClient(room.guestId);
    if (hostWs)  send(hostWs,  { type: 'TURN_CHANGE', isYourTurn: room.currentTurn === 'host', timedOut: true });
    if (guestWs) send(guestWs, { type: 'TURN_CHANGE', isYourTurn: room.currentTurn === 'guest', timedOut: true });
    return;
  }

  // ── PLAY AGAIN ──
  if (type === 'PLAY_AGAIN') {
    if (room.status !== 'finished') return;
    Object.assign(room, {
      hostSecret: null, guestSecret: null,
      hostReady: false, guestReady: false,
      currentTurn: 'host',
      hostGuesses: [], guestGuesses: [],
      winnerName: null,
      status: 'setup',
    });
    const hostWs = findClient(room.hostId);
    const guestWs = findClient(room.guestId);
    if (hostWs)  send(hostWs,  { type: 'GAME_SETUP', numDigits: room.numDigits, allowDuplicates: room.allowDuplicates });
    if (guestWs) send(guestWs, { type: 'GAME_SETUP', numDigits: room.numDigits, allowDuplicates: room.allowDuplicates });
    return;
  }

  // ── SEND REACTION (Real-time live cute emojis) ──
  if (type === 'SEND_REACTION') {
    const allowed = ['🧸', '💖', '✨', '🥺', '💌', '🌸', '🎉', '🐱', '🍬', '🐰'];
    const emoji = typeof msg.emoji === 'string' && allowed.includes(msg.emoji) ? msg.emoji : '💖';
    const opponentId = isHost ? room.guestId : room.hostId;
    const opponentWs = opponentId ? findClient(opponentId) : null;
    if (opponentWs) {
      send(opponentWs, {
        type: 'OPPONENT_REACTION',
        emoji,
        senderName: isHost ? room.hostName : room.guestName,
      });
    }
    return;
  }

  // ── QUICK CHAT & TAUNTS ──
  if (type === 'SEND_QUICK_CHAT') {
    const text = sanitizeString(msg.text, 45);
    const opponentId = isHost ? room.guestId : room.hostId;
    const opponentWs = opponentId ? findClient(opponentId) : null;
    if (opponentWs && text) {
      send(opponentWs, {
        type: 'OPPONENT_QUICK_CHAT',
        text,
        senderName: isHost ? room.hostName : room.guestName,
      });
    }
    return;
  }

  // ── LIVE DOODLE (Draw in real-time to opponent) ──
  if (type === 'LIVE_DOODLE') {
    const opponentId = isHost ? room.guestId : room.hostId;
    const opponentWs = opponentId ? findClient(opponentId) : null;
    if (opponentWs) {
      send(opponentWs, {
        type: 'OPPONENT_DOODLE',
        points: Array.isArray(msg.points) ? msg.points.slice(0, 50) : [],
        color: sanitizeString(msg.color, 16) || '#00ffcc',
        clear: Boolean(msg.clear),
      });
    }
    return;
  }
}

// ── Disconnect handler with 45s Grace Period ────────────────────────────────

function handleDisconnect(ws) {
  if (!ws.roomCode) return;
  const room = rooms.get(ws.roomCode);
  if (!room) return;

  const isHost = room.hostId === ws.clientId;
  const opponentId = isHost ? room.guestId : room.hostId;
  const opponentWs = opponentId ? findClient(opponentId) : null;

  if (isHost) room.hostId = null; else room.guestId = null;

  if (room.status === 'playing' || room.status === 'setup') {
    if (opponentWs) {
      send(opponentWs, { type: 'OPPONENT_TEMPORARILY_DISCONNECTED', graceSeconds: 45 });
    }

    const timer = setTimeout(() => {
      if ((isHost && !room.hostId) || (!isHost && !room.guestId)) {
        if (opponentWs) send(opponentWs, { type: 'OPPONENT_DISCONNECTED' });
        if (!room.hostId && !room.guestId) rooms.delete(ws.roomCode);
      }
    }, 45000);

    if (isHost) room.hostDisconnectTimer = timer;
    else room.guestDisconnectTimer = timer;
  } else {
    if (opponentWs) send(opponentWs, { type: 'OPPONENT_DISCONNECTED' });
    if (!room.hostId && !room.guestId) rooms.delete(ws.roomCode);
  }
}

// ── HTTP Health Check & Static Serving ─────────────────────────────────────

app.get('/health', (_req, res) =>
  res.json({ status: 'ok', rooms: rooms.size, clients: wss.clients.size })
);

const distPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(distPath));
app.get('*', (req, res) => {
  if (req.path.startsWith('/health')) return;
  res.sendFile(path.join(distPath, 'index.html'));
});

// ── Start ──────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`\n🎮  SAI & KANNA server running on ws://localhost:${PORT}\n`);
});
