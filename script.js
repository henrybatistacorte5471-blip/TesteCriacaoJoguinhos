const gameContainer = document.getElementById('game-container');
const gameTitle = document.getElementById('game-title');
const gameInstructions = document.getElementById('game-instructions');
const scorePanel = document.getElementById('score-panel');
const controls = document.getElementById('controls');
const gameCards = document.querySelectorAll('[data-game]');

let activeGame = null;
let animationId = null;
let gameState = null;

const gameConfigs = {
  snake: {
    title: 'Jogo da Cobra',
    instructions: 'Use as teclas de direção para controlar a cobra. Coma frutas e evite bater nas paredes ou na própria cauda.',
    controls: '<strong>Controles:</strong> ← ↑ → ↓',
    start: startSnake,
    stop: stopSnake,
  },
  tetris: {
    title: 'Tetris',
    instructions: 'Use as setas para mover e girar as peças. Limpe linhas para ganhar pontos.',
    controls: '<strong>Controles:</strong> ← → ↓ e Espaço para girar',
    start: startTetris,
    stop: stopTetris,
  },
  racing: {
    title: 'Corrida Simples',
    instructions: 'Use A/D ou ←/→ para desviar dos carros e chegar o mais longe possível.',
    controls: '<strong>Controles:</strong> A, D, ←, →',
    start: startRacing,
    stop: stopRacing,
  },
  fps: {
    title: 'Desafio FPS',
    instructions: 'Clique no canvas para atirar nos alvos. Mire bem para marcar muitos pontos antes do tempo acabar.',
    controls: '<strong>Controles:</strong> Clique do mouse',
    start: startFPS,
    stop: stopFPS,
  },
};

function init() {
  gameCards.forEach(button => {
    button.addEventListener('click', () => selectGame(button.dataset.game));
  });
}

function selectGame(gameKey) {
  if (activeGame === gameKey) return;
  if (activeGame) {
    gameConfigs[activeGame].stop();
  }

  activeGame = gameKey;
  const config = gameConfigs[gameKey];
  gameTitle.textContent = config.title;
  gameInstructions.innerHTML = config.instructions;
  controls.innerHTML = config.controls;
  scorePanel.innerHTML = '';
  gameContainer.innerHTML = '';
  config.start();
}

function createCanvas(width = 720, height = 560) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.tabIndex = 0;
  gameContainer.appendChild(canvas);
  return canvas;
}

function createScoreCards(cards) {
  scorePanel.innerHTML = cards
    .map(({ label, value }) => `<div class="score-card"><strong>${label}</strong><span>${value}</span></div>`)
    .join('');
}

function updateScoreCard(label, value) {
  const card = Array.from(scorePanel.children).find(el => el.querySelector('strong')?.textContent === label);
  if (card) card.querySelector('span').textContent = value;
}

function stopCurrentAnimation() {
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
}

function startSnake() {
  const canvas = createCanvas(720, 560);
  const ctx = canvas.getContext('2d');
  const gridSize = 20;
  const cols = canvas.width / gridSize;
  const rows = canvas.height / gridSize;

  const state = {
    snake: [{ x: 8, y: 12 }, { x: 7, y: 12 }, { x: 6, y: 12 }],
    dir: { x: 1, y: 0 },
    fruit: null,
    score: 0,
    speed: 8,
    frame: 0,
    gameOver: false,
  };

  function placeFruit() {
    let position;
    do {
      position = { x: Math.floor(Math.random() * cols), y: Math.floor(Math.random() * rows) };
    } while (state.snake.some(segment => segment.x === position.x && segment.y === position.y));
    state.fruit = position;
  }

  function reset() {
    state.snake = [{ x: 8, y: 12 }, { x: 7, y: 12 }, { x: 6, y: 12 }];
    state.dir = { x: 1, y: 0 };
    state.score = 0;
    state.frame = 0;
    state.gameOver = false;
    placeFruit();
    createScoreCards([{ label: 'Pontuação', value: state.score }, { label: 'Nível', value: 1 }]);
  }

  function draw() {
    ctx.fillStyle = '#07111e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#2dd4bf';
    state.snake.forEach((segment, index) => {
      ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize - 1, gridSize - 1);
      if (index === 0) {
        ctx.fillStyle = '#14b8a6';
        ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize - 1, gridSize - 1);
        ctx.fillStyle = '#2dd4bf';
      }
    });
    ctx.fillStyle = '#fb7185';
    ctx.fillRect(state.fruit.x * gridSize, state.fruit.y * gridSize, gridSize - 1, gridSize - 1);
  }

  function update() {
    if (state.gameOver) return;
    state.frame += 1;
    if (state.frame % Math.max(1, 12 - state.speed) !== 0) return;
    const head = { x: state.snake[0].x + state.dir.x, y: state.snake[0].y + state.dir.y };

    if (head.x < 0 || head.x >= cols || head.y < 0 || head.y >= rows || state.snake.some(seg => seg.x === head.x && seg.y === head.y)) {
      state.gameOver = true;
      gameInstructions.innerHTML = 'Game Over! Clique em qualquer tecla para reiniciar.';
      return;
    }

    state.snake.unshift(head);
    if (head.x === state.fruit.x && head.y === state.fruit.y) {
      state.score += 10;
      state.speed = Math.min(11, state.speed + 0.25);
      updateScoreCard('Pontuação', state.score);
      updateScoreCard('Nível', Math.floor(state.speed));
      placeFruit();
    } else {
      state.snake.pop();
    }
  }

  function loop() {
    update();
    draw();
    if (!state.gameOver) {
      animationId = requestAnimationFrame(loop);
    }
  }

  function handleKey(event) {
    const key = event.key;
    if (state.gameOver) {
      reset();
      gameInstructions.innerHTML = gameConfigs.snake.instructions;
      loop();
      return;
    }
    const directions = {
      ArrowUp: { x: 0, y: -1 },
      ArrowDown: { x: 0, y: 1 },
      ArrowLeft: { x: -1, y: 0 },
      ArrowRight: { x: 1, y: 0 },
    };
    if (directions[key]) {
      const next = directions[key];
      if (state.dir.x === -next.x && state.dir.y === -next.y) return;
      state.dir = next;
    }
  }

  function stop() {
    window.removeEventListener('keydown', handleKey);
    stopCurrentAnimation();
    if (gameState === state) gameState = null;
  }

  state.gameStop = stop;
  gameState = state;
  window.addEventListener('keydown', handleKey);
  reset();
  loop();
}

function startTetris() {
  const canvas = createCanvas(720, 560);
  const ctx = canvas.getContext('2d');
  const cols = 10;
  const rows = 20;
  const blockSize = 28;

  const pieces = {
    I: [[1, 1, 1, 1]],
    J: [[1, 0, 0], [1, 1, 1]],
    L: [[0, 0, 1], [1, 1, 1]],
    O: [[1, 1], [1, 1]],
    S: [[0, 1, 1], [1, 1, 0]],
    T: [[0, 1, 0], [1, 1, 1]],
    Z: [[1, 1, 0], [0, 1, 1]],
  };

  const colors = {
    I: '#38bdf8',
    J: '#818cf8',
    L: '#fb923c',
    O: '#facc15',
    S: '#34d399',
    T: '#a78bfa',
    Z: '#f87171',
  };

  const state = {
    board: Array.from({ length: rows }, () => Array(cols).fill(0)),
    piece: null,
    position: { x: 3, y: 0 },
    next: null,
    score: 0,
    speed: 40,
    dropCounter: 0,
    lastTime: 0,
    gameOver: false,
  };

  function createPiece(type) {
    return pieces[type].map(row => row.slice());
  }

  function randomPiece() {
    const keys = Object.keys(pieces);
    return keys[Math.floor(Math.random() * keys.length)];
  }

  function mergePiece() {
    state.piece.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value) {
          state.board[state.position.y + y][state.position.x + x] = value;
        }
      });
    });
  }

  function collide() {
    return state.piece.some((row, y) => {
      return row.some((value, x) => {
        if (!value) return false;
        const boardY = state.position.y + y;
        const boardX = state.position.x + x;
        return boardY >= rows || boardX < 0 || boardX >= cols || state.board[boardY][boardX];
      });
    });
  }

  function rotate(matrix, dir) {
    const rotated = matrix[0].map((_, i) => matrix.map(row => row[i]));
    if (dir > 0) return rotated.map(row => row.reverse());
    return rotated.reverse();
  }

  function reset() {
    state.board = Array.from({ length: rows }, () => Array(cols).fill(0));
    state.piece = createPiece(randomPiece());
    state.next = randomPiece();
    state.position = { x: 3, y: 0 };
    state.score = 0;
    state.speed = 40;
    state.dropCounter = 0;
    state.lastTime = 0;
    state.gameOver = false;
    createScoreCards([{ label: 'Pontuação', value: state.score }, { label: 'Linhas', value: 0 }]);
  }

  function sweepLines() {
    let lines = 0;
    state.board = state.board.filter(row => {
      if (row.every(value => value !== 0)) {
        lines += 1;
        return false;
      }
      return true;
    });
    while (state.board.length < rows) {
      state.board.unshift(Array(cols).fill(0));
    }
    if (lines > 0) {
      state.score += lines * 100;
      updateScoreCard('Pontuação', state.score);
    }
  }

  function drop() {
    state.position.y += 1;
    if (collide()) {
      state.position.y -= 1;
      mergePiece();
      sweepLines();
      state.piece = createPiece(state.next);
      state.next = randomPiece();
      state.position = { x: 3, y: 0 };
      if (collide()) {
        state.gameOver = true;
        gameInstructions.innerHTML = 'Game Over! Pressione R para reiniciar.';
      }
    }
    state.dropCounter = 0;
  }

  function move(offset) {
    state.position.x += offset;
    if (collide()) state.position.x -= offset;
  }

  function drawMatrix(matrix, offset) {
    matrix.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value) {
          ctx.fillStyle = colors[value];
          ctx.fillRect((offset.x + x) * blockSize, (offset.y + y) * blockSize, blockSize - 2, blockSize - 2);
        }
      });
    });
  }

  function draw() {
    ctx.fillStyle = '#07111e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(20, 20, cols * blockSize + 2, rows * blockSize + 2);
    drawMatrix(state.board, { x: 1, y: 1 });
    drawMatrix(state.piece, { x: state.position.x + 1, y: state.position.y + 1 });
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '20px Inter, sans-serif';
    ctx.fillText(`Próxima:`, 360, 80);
    drawMatrix(createPiece(state.next), { x: 14, y: 3 });
  }

  function update(time) {
    if (state.gameOver) return;
    const deltaTime = time - state.lastTime;
    state.lastTime = time;
    state.dropCounter += deltaTime;
    if (state.dropCounter > state.speed * 10) {
      drop();
    }
    draw();
    animationId = requestAnimationFrame(update);
  }

  function handleKey(event) {
    if (state.gameOver && event.key.toLowerCase() === 'r') {
      reset();
      gameInstructions.innerHTML = gameConfigs.tetris.instructions;
      update(0);
      return;
    }
    switch (event.key) {
      case 'ArrowLeft': move(-1); break;
      case 'ArrowRight': move(1); break;
      case 'ArrowDown': drop(); break;
      case ' ': state.piece = rotate(state.piece, 1); break;
    }
  }

  function stop() {
    window.removeEventListener('keydown', handleKey);
    stopCurrentAnimation();
    if (gameState === state) gameState = null;
  }

  state.gameStop = stop;
  gameState = state;
  window.addEventListener('keydown', handleKey);
  reset();
  animationId = requestAnimationFrame(update);
}

function startRacing() {
  const canvas = createCanvas(720, 560);
  const ctx = canvas.getContext('2d');

  const state = {
    carX: 310,
    carWidth: 100,
    lanes: [160, 310, 460],
    obstacles: [],
    speed: 5,
    distance: 0,
    frame: 0,
    left: false,
    right: false,
    gameOver: false,
  };

  function reset() {
    state.carX = 310;
    state.obstacles = [];
    state.speed = 5;
    state.distance = 0;
    state.frame = 0;
    state.gameOver = false;
    createScoreCards([{ label: 'Distância', value: '0 m' }, { label: 'Velocidade', value: '5' }]);
  }

  function spawnObstacle() {
    const lane = state.lanes[Math.floor(Math.random() * state.lanes.length)];
    state.obstacles.push({ x: lane, y: -120, width: 100, height: 60 });
  }

  function drawRoad() {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(120, 0, 480, canvas.height);
    ctx.fillStyle = '#475569';
    ctx.fillRect(160, 0, 10, canvas.height);
    ctx.fillRect(550, 0, 10, canvas.height);
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 6;
    ctx.setLineDash([24, 18]);
    ctx.beginPath();
    ctx.moveTo(360, 0);
    ctx.lineTo(360, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawRoad();
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(state.carX, 420, state.carWidth, 100);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(state.carX + 16, 440, 68, 40);
    ctx.fillRect(state.carX + 16, 500, 68, 12);
    ctx.fillStyle = '#ef4444';
    state.obstacles.forEach(obstacle => {
      ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
      ctx.fillStyle = '#111827';
      ctx.fillRect(obstacle.x + 16, obstacle.y + 12, 68, 18);
      ctx.fillStyle = '#ef4444';
    });
  }

  function update() {
    if (state.gameOver) return;
    if (state.left) state.carX = Math.max(160, state.carX - 8);
    if (state.right) state.carX = Math.min(460, state.carX + 8);
    state.frame += 1;
    state.distance += 1;
    if (state.frame % 60 === 0) {
      state.speed = Math.min(12, state.speed + 0.2);
      spawnObstacle();
    }
    state.obstacles.forEach(obstacle => {
      obstacle.y += state.speed;
    });
    state.obstacles = state.obstacles.filter(obstacle => obstacle.y < canvas.height + 80);
    const carRect = { x: state.carX, y: 420, width: state.carWidth, height: 100 };
    if (state.obstacles.some(obs => rectIntersect(carRect, obs))) {
      state.gameOver = true;
      gameInstructions.innerHTML = 'Colidiu! Pressione R para tentar de novo.';
    }
    updateScoreCard('Distância', `${Math.floor(state.distance)} m`);
    updateScoreCard('Velocidade', state.speed.toFixed(1));
    draw();
    animationId = requestAnimationFrame(update);
  }

  function rectIntersect(a, b) {
    return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
  }

  function handleKey(event) {
    const isDown = event.type === 'keydown';
    if (event.key.toLowerCase() === 'a' || event.key === 'ArrowLeft') state.left = isDown;
    if (event.key.toLowerCase() === 'd' || event.key === 'ArrowRight') state.right = isDown;
    if (!isDown && event.key.toLowerCase() === 'r' && state.gameOver) {
      reset();
      gameInstructions.innerHTML = gameConfigs.racing.instructions;
      update();
    }
  }

  function stop() {
    window.removeEventListener('keydown', handleKey);
    window.removeEventListener('keyup', handleKey);
    stopCurrentAnimation();
    if (gameState === state) gameState = null;
  }

  state.gameStop = stop;
  gameState = state;
  window.addEventListener('keydown', handleKey);
  window.addEventListener('keyup', handleKey);
  reset();
  animationId = requestAnimationFrame(update);
}

function startFPS() {
  const canvas = createCanvas(720, 560);
  const ctx = canvas.getContext('2d');
  const state = {
    targets: [],
    score: 0,
    timeLeft: 30,
    lastSpawn: 0,
    gameOver: false,
  };

  function reset() {
    state.targets = [];
    state.score = 0;
    state.timeLeft = 30;
    state.lastSpawn = 0;
    state.gameOver = false;
    createScoreCards([{ label: 'Pontos', value: state.score }, { label: 'Tempo', value: `${state.timeLeft}s` }]);
  }

  function spawnTarget() {
    state.targets.push({
      x: Math.random() * canvas.width * 0.7 + canvas.width * 0.15,
      y: Math.random() * canvas.height * 0.5 + 50,
      radius: 16 + Math.random() * 10,
      speed: 0.6 + Math.random() * 1.1,
      scale: 0.7 + Math.random() * 0.8,
    });
  }

  function drawBackground() {
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < 10; i++) {
      const x = canvas.width / 2 + (i - 5) * 55;
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2, canvas.height);
      ctx.lineTo(x, 0);
      ctx.stroke();
    }
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '22px Inter, sans-serif';
    ctx.fillText('Mire e clique nos alvos antes do tempo acabar', 28, 38);
  }

  function drawTargets() {
    state.targets.forEach(target => {
      const gradient = ctx.createRadialGradient(target.x, target.y, 0, target.x, target.y, target.radius * target.scale);
      gradient.addColorStop(0, '#38bdf8');
      gradient.addColorStop(0.5, '#60a5fa');
      gradient.addColorStop(1, 'rgba(59, 130, 246, 0.08)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(target.x, target.y, target.radius * target.scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff55';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(target.x, target.y, target.radius * target.scale * 0.6, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawCrosshair() {
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2 - 12, canvas.height / 2);
    ctx.lineTo(canvas.width / 2 + 12, canvas.height / 2);
    ctx.moveTo(canvas.width / 2, canvas.height / 2 - 12);
    ctx.lineTo(canvas.width / 2, canvas.height / 2 + 12);
    ctx.stroke();
  }

  function update(time) {
    if (state.gameOver) return;
    if (!state.startTime) state.startTime = time;
    if (!state.lastSpawn || time - state.lastSpawn > 1200) {
      spawnTarget();
      state.lastSpawn = time;
    }
    state.targets.forEach(target => {
      target.y += target.speed;
      target.scale += 0.001;
    });
    state.targets = state.targets.filter(target => target.y < canvas.height + 80);

    const elapsed = (time - state.startTime) / 1000;
    state.timeLeft = 30 - Math.floor(elapsed);
    if (state.timeLeft <= 0) {
      state.timeLeft = 0;
      state.gameOver = true;
      gameInstructions.innerHTML = 'Tempo esgotado! Pressione R para jogar novamente.';
    }
    updateScoreCard('Tempo', `${Math.max(0, state.timeLeft)}s`);

    drawBackground();
    drawTargets();
    drawCrosshair();
    if (!state.gameOver) animationId = requestAnimationFrame(update);
  }

  function handleClick(event) {
    if (state.gameOver) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;
    const targetIndex = state.targets.findIndex(target => {
      const dx = clickX - target.x;
      const dy = clickY - target.y;
      return Math.sqrt(dx * dx + dy * dy) < target.radius * target.scale;
    });
    if (targetIndex !== -1) {
      state.targets.splice(targetIndex, 1);
      state.score += 10;
      updateScoreCard('Pontos', state.score);
    }
  }

  function handleKey(event) {
    if (event.key.toLowerCase() === 'r' && state.gameOver) {
      reset();
      gameInstructions.innerHTML = gameConfigs.fps.instructions;
      animationId = requestAnimationFrame(update);
    }
  }

  function stop() {
    canvas.removeEventListener('click', handleClick);
    window.removeEventListener('keydown', handleKey);
    stopCurrentAnimation();
  }

  state.gameStop = stop;
  canvas.addEventListener('click', handleClick);
  window.addEventListener('keydown', handleKey);
  reset();
  animationId = requestAnimationFrame(update);
}

function stopSnake() { if (gameState?.gameStop) gameState.gameStop(); }
function stopTetris() { if (gameState?.gameStop) gameState.gameStop(); }
function stopRacing() { if (gameState?.gameStop) gameState.gameStop(); }
function stopFPS() { if (gameState?.gameStop) gameState.gameStop(); }

init();
