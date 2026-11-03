const WebSocket = require('ws');
const http = require('http');
const express = require('express');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const rooms = new Map();
let clientCounter = 0;

// ── Helpers ────────────────────────────────────────────────────────────────

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

// ── Connection handler ─────────────────────────────────────────────────────

wss.on('connection', (ws) => {
  ws.clientId = `c${++clientCounter}`;
  ws.roomCode = null;
  ws.isAlive = true;

  ws.on('pong', () => {
    ws.isAlive = true;
  });

  ws.on('message', (raw) => {
    try {
      handleMessage(ws, JSON.parse(raw.toString()));
    } catch (e) {
      console.error('Parse error:', e.message);
    }
  });

  ws.on('close', () => handleDisconnect(ws));
  ws.on('error', (e) => console.error('WS error:', e.message));
});

// Ping keep-alive every 25 seconds (prevents proxy / mobile WebSocket timeouts)
const pingInterval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) return ws.terminate();
    ws.isAlive = false;
    ws.ping();
  });
}, 25000);

wss.on('close', () => clearInterval(pingInterval));

// ── Message router ─────────────────────────────────────────────────────────

function handleMessage(ws, msg) {
  const { type, playerToken } = msg;

  // ── RECONNECT ──
  if (type === 'RECONNECT') {
    const code = (msg.code || '').toUpperCase().trim();
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
    });
    return;
  }

  // ── CREATE ROOM ──
  if (type === 'CREATE_ROOM') {
    let code;
    let tries = 0;
    do { code = generateRoomCode(); tries++; } while (rooms.has(code) && tries < 100);

    const room = {
      code,
      hostId: ws.clientId,
      hostToken: playerToken || ws.clientId,
      hostName: msg.playerName,
      guestId: null,
      guestToken: null,
      guestName: null,
      numDigits: msg.numDigits,
      hostSecret: null, guestSecret: null,
      hostReady: false, guestReady: false,
      currentTurn: 'host',
      hostGuesses: [], guestGuesses: [],
      status: 'waiting',
      hostDisconnectTimer: null,
      guestDisconnectTimer: null,
    };
    rooms.set(code, room);
    ws.roomCode = code;

    send(ws, { type: 'ROOM_CREATED', code, numDigits: msg.numDigits });
    return;
  }

  // ── JOIN ROOM ──
  if (type === 'JOIN_ROOM') {
    const code = (msg.code || '').toUpperCase().trim();
    const room = rooms.get(code);

    if (!room)              return send(ws, { type: 'ERROR', message: 'Room not found! Check the code.' });
    if (room.guestId && room.guestToken !== playerToken) {
      return send(ws, { type: 'ERROR', message: 'Room is already full!' });
    }
    if (room.status !== 'waiting' && room.guestToken !== playerToken) {
      return send(ws, { type: 'ERROR', message: 'Game already in progress!' });
    }
    if (room.hostId === ws.clientId) {
      return send(ws, { type: 'ERROR', message: 'You cannot join your own room!' });
    }

    room.guestId = ws.clientId;
    room.guestToken = playerToken || ws.clientId;
    room.guestName = msg.playerName;
    ws.roomCode = code;

    send(ws, { type: 'ROOM_JOINED', code, numDigits: room.numDigits, opponentName: room.hostName });
    const hostWs = findClient(room.hostId);
    if (hostWs) send(hostWs, { type: 'OPPONENT_JOINED', opponentName: room.guestName });

    // Start setup phase
    room.status = 'setup';
    setTimeout(() => {
      send(ws, { type: 'GAME_SETUP', numDigits: room.numDigits });
      if (hostWs) send(hostWs, { type: 'GAME_SETUP', numDigits: room.numDigits });
    }, 600);
    return;
  }

  // All subsequent messages require an active room
  const room = ws.roomCode ? rooms.get(ws.roomCode) : null;
  if (!room) return;

  const isHost = room.hostId === ws.clientId;
  const opponentId = isHost ? room.guestId : room.hostId;
  const opponentWs = opponentId ? findClient(opponentId) : null;

  // ── SET SECRET ──
  if (type === 'SET_SECRET') {
    if (room.status !== 'setup') return;
    if (isHost) { room.hostSecret = msg.secret; room.hostReady = true; }
    else        { room.guestSecret = msg.secret; room.guestReady = true; }

    send(ws, { type: 'SECRET_SET' });
    if (opponentWs) send(opponentWs, { type: 'OPPONENT_READY' });

    if (room.hostReady && room.guestReady) {
      room.status = 'playing';
      room.currentTurn = 'host';
      const hostWs = findClient(room.hostId);
      const guestWs = findClient(room.guestId);
      if (hostWs) send(hostWs,  { type: 'GAME_START', isYourTurn: true,  opponentName: room.guestName });
      if (guestWs) send(guestWs, { type: 'GAME_START', isYourTurn: false, opponentName: room.hostName });
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

    const secret = isHost ? room.guestSecret : room.hostSecret;
    const { bulls, cows } = checkGuess(secret, msg.guess);
    const attempt = (isHost ? room.hostGuesses : room.guestGuesses).length + 1;
    const entry = { guess: msg.guess, bulls, cows, attempt };
    if (isHost) room.hostGuesses.push(entry); else room.guestGuesses.push(entry);

    send(ws, { type: 'GUESS_RESULT', ...entry });
    if (opponentWs) send(opponentWs, { type: 'OPPONENT_GUESSED', ...entry });

    // Win condition
    if (bulls === room.numDigits) {
      room.status = 'finished';
      const winnerName = isHost ? room.hostName : room.guestName;
      room.winnerName = winnerName;
      const hostWs = findClient(room.hostId);
      const guestWs = findClient(room.guestId);
      if (hostWs) send(hostWs, {
        type: 'GAME_OVER', won: isHost, winnerName,
        mySecret: room.hostSecret, opponentSecret: room.guestSecret,
        myGuesses: room.hostGuesses.length, opponentGuesses: room.guestGuesses.length,
      });
      if (guestWs) send(guestWs, {
        type: 'GAME_OVER', won: !isHost, winnerName,
        mySecret: room.guestSecret, opponentSecret: room.hostSecret,
        myGuesses: room.guestGuesses.length, opponentGuesses: room.hostGuesses.length,
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

    // Switch turns when the 60s timer expires
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
    if (hostWs)  send(hostWs,  { type: 'GAME_SETUP', numDigits: room.numDigits });
    if (guestWs) send(guestWs, { type: 'GAME_SETUP', numDigits: room.numDigits });
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

  // If in game or setup, give 45-second reconnection grace period
  if (room.status === 'playing' || room.status === 'setup') {
    if (opponentWs) {
      send(opponentWs, { type: 'OPPONENT_TEMPORARILY_DISCONNECTED', graceSeconds: 45 });
    }

    const timer = setTimeout(() => {
      // Grace period expired
      if ((isHost && !room.hostId) || (!isHost && !room.guestId)) {
        if (opponentWs) send(opponentWs, { type: 'OPPONENT_DISCONNECTED' });
        if (!room.hostId && !room.guestId) rooms.delete(ws.roomCode);
      }
    }, 45000);

    if (isHost) room.hostDisconnectTimer = timer;
    else room.guestDisconnectTimer = timer;
  } else {
    // In waiting lobby or finished
    if (opponentWs) send(opponentWs, { type: 'OPPONENT_DISCONNECTED' });
    if (!room.hostId && !room.guestId) rooms.delete(ws.roomCode);
  }
}

// ── HTTP health check ──────────────────────────────────────────────────────

app.get('/health', (_req, res) =>
  res.json({ status: 'ok', rooms: rooms.size, clients: wss.clients.size })
);

// ── Serve Frontend Production Build ────────────────────────────────────────
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
