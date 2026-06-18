const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');
const startBtn = document.getElementById('startBtn');

let audioContext = null;

function initAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
}

function playSound(frequency, duration, type = 'square') {
    if (!audioContext) return;
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.frequency.value = frequency;
    oscillator.type = type;
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
}

function playPaddleHit() {
    playSound(440, 0.1);
}

function playWallHit() {
    playSound(330, 0.08);
}

function playScore() {
    playSound(880, 0.2);
}

function playGameOver() {
    playSound(660, 0.15);
    setTimeout(() => playSound(550, 0.15), 150);
    setTimeout(() => playSound(440, 0.2), 300);
}

const WINNING_SCORE = 11;
const GAME_DURATION = 6000;

let gameState = {
    leftPaddle: 150,
    rightPaddle: 150,
    ball: { x: 300, y: 200, dx: 4, dy: 2 },
    leftScore: 0,
    rightScore: 0,
    gameTime: 0,
    inGame: false,
    gameOver: false
};

const keys = {};

document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (e.key === ' ' && !gameState.inGame) {
        startGame();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

startBtn.addEventListener('click', startGame);

function startGame() {
    initAudio();
    gameState.leftPaddle = 150;
    gameState.rightPaddle = 150;
    gameState.ball = { x: 300, y: 200, dx: 4 * (Math.random() > 0.5 ? 1 : -1), dy: 2 * (Math.random() - 0.5) * 2 };
    gameState.leftScore = 0;
    gameState.rightScore = 0;
    gameState.gameTime = 0;
    gameState.inGame = true;
    gameState.gameOver = false;
    statusEl.textContent = 'Game in progress...';
    startBtn.style.display = 'none';
}

function resetBall(direction) {
    gameState.ball.x = 300;
    gameState.ball.y = 200;
    gameState.ball.dx = 4 * direction;
    gameState.ball.dy = 2 * (Math.random() - 0.5) * 2;
}

function updatePaddles() {
    const speed = 5;
    
    if (keys['w'] || keys['W']) {
        gameState.leftPaddle = Math.max(0, gameState.leftPaddle - speed);
    }
    if (keys['s'] || keys['S']) {
        gameState.leftPaddle = Math.min(300, gameState.leftPaddle + speed);
    }
    
    if (keys['o'] || keys['O']) {
        gameState.rightPaddle = Math.max(0, gameState.rightPaddle - speed);
    }
    if (keys['l'] || keys['L']) {
        gameState.rightPaddle = Math.min(300, gameState.rightPaddle + speed);
    }
}

function updateBall() {
    gameState.ball.x += gameState.ball.dx;
    gameState.ball.y += gameState.ball.dy;
    
    if (gameState.ball.y <= 5 || gameState.ball.y >= 395) {
        gameState.ball.dy *= -1;
        gameState.ball.y = Math.max(5, Math.min(395, gameState.ball.y));
        playWallHit();
    }
    
    if (gameState.ball.x <= 35 && 
        gameState.ball.x >= 20 &&
        gameState.ball.y >= gameState.leftPaddle && 
        gameState.ball.y <= gameState.leftPaddle + 100) {
        gameState.ball.dx = Math.abs(gameState.ball.dx) * 1.03;
        const hitPos = (gameState.ball.y - gameState.leftPaddle - 50) / 50;
        gameState.ball.dy = hitPos * 5;
        gameState.ball.x = 36;
        playPaddleHit();
    }
    
    if (gameState.ball.x >= 565 && 
        gameState.ball.x <= 580 &&
        gameState.ball.y >= gameState.rightPaddle && 
        gameState.ball.y <= gameState.rightPaddle + 100) {
        gameState.ball.dx = -Math.abs(gameState.ball.dx) * 1.03;
        const hitPos = (gameState.ball.y - gameState.rightPaddle - 50) / 50;
        gameState.ball.dy = hitPos * 5;
        gameState.ball.x = 564;
        playPaddleHit();
    }
    
    if (gameState.ball.x <= 0) {
        gameState.rightScore++;
        playScore();
        checkWin();
        if (gameState.inGame) {
            resetBall(-1);
        }
    }
    
    if (gameState.ball.x >= 600) {
        gameState.leftScore++;
        playScore();
        checkWin();
        if (gameState.inGame) {
            resetBall(1);
        }
    }
}

function checkWin() {
    if (gameState.leftScore >= WINNING_SCORE || gameState.rightScore >= WINNING_SCORE) {
        endGame();
    }
}

function endGame() {
    gameState.inGame = false;
    gameState.gameOver = true;
    playGameOver();
    
    if (gameState.leftScore > gameState.rightScore) {
        statusEl.textContent = `Player 1 Wins! ${gameState.leftScore} - ${gameState.rightScore}`;
    } else {
        statusEl.textContent = `Player 2 Wins! ${gameState.leftScore} - ${gameState.rightScore}`;
    }
    startBtn.style.display = 'block';
    startBtn.textContent = 'PLAY AGAIN';
}

function render() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    
    for (let y = 10; y < canvas.height; y += 20) {
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2, y);
        ctx.lineTo(canvas.width / 2, y + 10);
        ctx.stroke();
    }
    
    ctx.fillStyle = '#fff';
    
    ctx.fillRect(20, gameState.leftPaddle, 10, 100);
    ctx.fillRect(570, gameState.rightPaddle, 10, 100);
    ctx.fillRect(gameState.ball.x - 5, gameState.ball.y - 5, 10, 10);
    
    ctx.font = '40px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText(gameState.leftScore, 200, 60);
    ctx.fillText(gameState.rightScore, 400, 60);
    
    if (gameState.inGame) {
        gameState.gameTime++;
        const timeLeft = Math.max(0, Math.floor((GAME_DURATION - gameState.gameTime) / 60));
        ctx.font = '16px Courier New';
        ctx.fillText(`Time: ${timeLeft}s`, canvas.width / 2, 30);
        
        if (gameState.gameTime >= GAME_DURATION) {
            endGame();
        }
    }
}

function gameLoop() {
    if (gameState.inGame) {
        updatePaddles();
        updateBall();
    }
    render();
    requestAnimationFrame(gameLoop);
}

gameLoop();
