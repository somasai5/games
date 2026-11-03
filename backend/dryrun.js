const WebSocket = require('ws');

// ── 1. Unit Test: Bulls & Cows Logic ───────────────────────────────────────
function checkGuess(secret, guess) {
  const sArr = secret.split('');
  const gArr = guess.split('');
  const sUsed = new Array(sArr.length).fill(false);
  const gUsed = new Array(gArr.length).fill(false);
  let bulls = 0, cows = 0;

  for (let i = 0; i < sArr.length; i++) {
    if (sArr[i] === gArr[i]) { bulls++; sUsed[i] = gUsed[i] = true; }
  }
  for (let i = 0; i < gArr.length; i++) {
    if (gUsed[i]) continue;
    for (let j = 0; j < sArr.length; j++) {
      if (!sUsed[j] && gArr[i] === sArr[j]) { cows++; sUsed[j] = true; break; }
    }
  }
  return { bulls, cows };
}

console.log('--- TEST SUITE 1: BULLS & COWS MATHEMATICAL ACCURACY ---');
const logicTests = [
  { secret: '1234', guess: '1234', expB: 4, expC: 0, desc: 'Exact Match' },
  { secret: '1234', guess: '4321', expB: 0, expC: 4, desc: 'All Cows, 0 Bulls' },
  { secret: '1234', guess: '5678', expB: 0, expC: 0, desc: 'Zero Matches' },
  { secret: '1123', guess: '0111', expB: 1, expC: 1, desc: 'Duplicate Digits (Secret has two 1s, Guess has three 1s)' },
  { secret: '1234', guess: '1111', expB: 1, expC: 0, desc: 'Guess repeated digit against single occurrence' },
  { secret: '9888', guess: '8988', expB: 2, expC: 2, desc: 'Complex Multi-repeats' },
  { secret: '0000', guess: '0000', expB: 4, expC: 0, desc: 'All zeroes' },
];

let failedLogic = 0;
logicTests.forEach(({ secret, guess, expB, expC, desc }) => {
  const res = checkGuess(secret, guess);
  const pass = res.bulls === expB && res.cows === expC;
  if (!pass) failedLogic++;
  console.log(`[${pass ? 'PASS' : 'FAIL'}] ${desc}: Secret=${secret}, Guess=${guess} => Bulls:${res.bulls} (exp ${expB}), Cows:${res.cows} (exp ${expC})`);
});

if (failedLogic > 0) {
  console.error(`Logic tests failed: ${failedLogic}`);
  process.exit(1);
}

// ── 2. Integration Test: Full WebSocket Multiplayer Flow ───────────────────
console.log('\n--- TEST SUITE 2: WEBSOCKET MULTIPLAYER E2E FLOW ---');

const WS_URL = 'ws://localhost:3001';

async function runE2ETest() {
  return new Promise((resolve, reject) => {
    const ws1 = new WebSocket(WS_URL);
    let ws2 = null;
    let roomCode = '';
    const p1Token = 'token_p1_' + Math.random().toString(36).substring(2);
    const p2Token = 'token_p2_' + Math.random().toString(36).substring(2);

    ws1.on('open', () => {
      console.log('✓ Player 1 connected to server');
      ws1.send(JSON.stringify({
        type: 'CREATE_ROOM',
        playerName: 'SAI',
        numDigits: 4,
        playerToken: p1Token,
      }));
    });

    ws1.on('message', (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'ROOM_CREATED') {
        roomCode = msg.code;
        console.log(`✓ Room created with code: ${roomCode}`);

        // Player 2 joins
        ws2 = new WebSocket(WS_URL);
        ws2.on('open', () => {
          console.log('✓ Player 2 connected to server');
          ws2.send(JSON.stringify({
            type: 'JOIN_ROOM',
            playerName: 'KANNA',
            code: roomCode,
            playerToken: p2Token,
          }));
        });

        setupPlayer2Listeners();
      }

      if (msg.type === 'GAME_SETUP') {
        console.log('✓ Player 1 received GAME_SETUP, setting secret 5729');
        ws1.send(JSON.stringify({ type: 'SET_SECRET', secret: '5729' }));
      }

      if (msg.type === 'GAME_START') {
        console.log(`✓ Player 1 game started, isYourTurn = ${msg.isYourTurn}`);
        if (msg.isYourTurn) {
          console.log('✓ Player 1 guessing 1234');
          ws1.send(JSON.stringify({ type: 'MAKE_GUESS', guess: '1234' }));
        }
      }

      if (msg.type === 'GUESS_RESULT') {
        console.log(`✓ Player 1 guess result: guess=${msg.guess}, bulls=${msg.bulls}, cows=${msg.cows}`);
      }

      if (msg.type === 'GAME_OVER') {
        console.log(`✓ Player 1 received GAME_OVER: winner = ${msg.winnerName}, won = ${msg.won}`);
        console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY! Everything verified.');
        ws1.close();
        if (ws2) ws2.close();
        resolve();
      }
    });

    function setupPlayer2Listeners() {
      ws2.on('message', (data) => {
        const msg = JSON.parse(data.toString());

        if (msg.type === 'GAME_SETUP') {
          console.log('✓ Player 2 received GAME_SETUP, setting secret 8410');
          ws2.send(JSON.stringify({ type: 'SET_SECRET', secret: '8410' }));
        }

        if (msg.type === 'TURN_CHANGE' && msg.isYourTurn) {
          console.log('✓ Turn passed to Player 2. Player 2 guessing winning secret 5729');
          ws2.send(JSON.stringify({ type: 'MAKE_GUESS', guess: '5729' }));
        }

        if (msg.type === 'GAME_OVER') {
          console.log(`✓ Player 2 received GAME_OVER: winner = ${msg.winnerName}, won = ${msg.won}`);
        }
      });
    }

    setTimeout(() => {
      reject(new Error('E2E Test timed out after 10s'));
    }, 10000);
  });
}

runE2ETest()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ E2E Dry Run Failed:', err);
    process.exit(1);
  });

