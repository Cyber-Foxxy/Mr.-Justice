const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreText = document.getElementById("scoreText");
const totalText = document.getElementById("totalText");
const messageText = document.getElementById("messageText");

const keys = {};
const sparks = [];
let runes = [];
let gameComplete = false;
let animationTime = 0;

class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 38;
    this.height = 68;
    this.speed = 3.2;
    this.facing = 1;
  }

  update() {
    let moveX = 0;
    let moveY = 0;

    if (keys.ArrowLeft || keys.a || keys.A) moveX -= 1;
    if (keys.ArrowRight || keys.d || keys.D) moveX += 1;
    if (keys.ArrowUp || keys.w || keys.W) moveY -= 1;
    if (keys.ArrowDown || keys.s || keys.S) moveY += 1;

    if (moveX !== 0 || moveY !== 0) {
      const length = Math.hypot(moveX, moveY);
      moveX /= length;
      moveY /= length;
      this.x += moveX * this.speed;
      this.y += moveY * this.speed;
      if (moveX !== 0) this.facing = Math.sign(moveX);
    }

    this.x = Math.max(30, Math.min(canvas.width - 30, this.x));
    this.y = Math.max(80, Math.min(canvas.height - 40, this.y));
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);

    // Lantern glow
   const glow = ctx.createRadialGradient(0, -48, 8, 0, -48, 170);
    glow.addColorStop(0, "rgba(248, 237, 174, 0)"); 
    glow.addColorStop(0.35, "rgba(242, 239, 233, 0)");
    glow.addColorStop(1, "rgba(239, 235, 231, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, -48, 170, 0, Math.PI * 2);
    ctx.fill();
    
    // Body
    ctx.fillStyle = "#aeb7c7";
    ctx.strokeStyle = "#540e1d";
    ctx.lineWidth = 3;
    roundRect(-14, -14, 28, 42, 8, true, true);

    // Legs
    ctx.fillStyle = "#767f91";
    roundRect(-13, 24, 9, 25, 4, true, true);
    roundRect(4, 24, 9, 25, 4, true, true);

    // Arms
    ctx.strokeStyle = "#aeb7c7";
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(-16, -2);
    ctx.lineTo(-28, 18);
    ctx.moveTo(16, -2);
    ctx.lineTo(29, 15);
    ctx.stroke();

    // Lantern head frame
    ctx.fillStyle = "#c9d2df";
    ctx.strokeStyle = "#20242e";
    roundRect(-20, -72, 40, 44, 7, true, true);

    // Glass panels
    ctx.fillStyle = "rgba(185, 232, 255, 0.38)";
    roundRect(-14, -66, 28, 31, 4, true, false);
    ctx.strokeStyle = "rgba(255, 245, 184, 0.5)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -66);
    ctx.lineTo(0, -35);
    ctx.stroke();

    // Flame
    const flamePulse = Math.sin(animationTime * 0.08) * 3;
    ctx.fillStyle = "#ffef8a";
    ctx.beginPath();
    ctx.moveTo(0, -61 - flamePulse);
    ctx.bezierCurveTo(12, -51, 7, -39, 0, -37);
    ctx.bezierCurveTo(-9, -42, -10, -53, 0, -61 - flamePulse);
    ctx.fill();
    ctx.fillStyle = "#ff9b3d";
    ctx.beginPath();
    ctx.moveTo(1, -55);
    ctx.bezierCurveTo(7, -49, 4, -42, 0, -40);
    ctx.bezierCurveTo(-5, -44, -5, -50, 1, -55);
    ctx.fill();

    // Handle
    ctx.strokeStyle = "#d7dce8";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, -73, 14, Math.PI, 0);
    ctx.stroke();

    ctx.restore();
  }
}

class Rune {
  constructor(data) {
    this.x = data.x;
    this.y = data.y;
    this.symbol = data.symbol;
    this.message = data.message;
    this.collected = false;
    this.revealed = false;
    this.radius = 20;
  }

  update(player) {
    const distance = Math.hypot(player.x - this.x, player.y - this.y);

    if (distance < 170) {
      this.revealed = true;
    }

    if (!this.collected && distance < 34) {
      this.collected = true;
      messageText.textContent = this.message;
      createSparkBurst(this.x, this.y, 18);
      updateScore();
    }
  }

  draw() {
    if (!this.revealed || this.collected) return;

    const pulse = 1 + Math.sin(animationTime * 0.07 + this.x) * 0.12;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(pulse, pulse);

    const glow = ctx.createRadialGradient(0, 0, 3, 0, 0, 42);
    glow.addColorStop(0, "rgba(255, 239, 138, 0.9)");
    glow.addColorStop(1, "rgba(255, 239, 138, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, 42, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ffe680";
    ctx.strokeStyle = "#7c5523";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#4f2f12";
    ctx.font = "bold 28px serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(this.symbol, 0, 1);

    ctx.restore();
  }
}

class Spark {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 3.6;
    this.vy = (Math.random() - 0.5) * 3.6;
    this.life = 70 + Math.random() * 40;
    this.maxLife = this.life;
    this.size = 2 + Math.random() * 4;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.01;
    this.life--;
  }

  draw() {
    const alpha = Math.max(this.life / this.maxLife, 0);
    ctx.fillStyle = `rgba(255, 226, 124, ${alpha})`;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

const player = new Player(95, 470);

function roundRect(x, y, width, height, radius, fill, stroke) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

function drawBackground() {
  // Sky
  const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
  sky.addColorStop(0, "#98a9dc");
  sky.addColorStop(0.55, "#b45ff09d");
  sky.addColorStop(1, "#c921cc8f");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawStars();
  drawFloatingIslands();
  drawMoonPortal();
  drawHills();
  drawPath();
  drawRuins();
}

function drawStars() {
  const collected = runes.filter(rune => rune.collected).length;
  const starCount = 20 + collected * 14;

  for (let i = 0; i < starCount; i++) {
    const x = (i * 71) % canvas.width;
    const y = 30 + ((i * 43) % 180);
    const twinkle = 0.35 + Math.sin(animationTime * 0.04 + i) * 0.25;
    ctx.fillStyle = `rgba(255, 245, 191, ${twinkle})`;
    ctx.beginPath();
    ctx.arc(x, y, 1.2 + (i % 3) * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawFloatingIslands() {
  const collected = runes.filter(rune => rune.collected).length;
  const glowAlpha = 0.08 + collected * 0.04;

  const islands = [
    { x: 180, y: 135, w: 115, h: 22 },
    { x: 690, y: 110, w: 150, h: 28 },
    { x: 785, y: 185, w: 90, h: 18 }
  ];

  islands.forEach((island, index) => {
    const bob = Math.sin(animationTime * 0.025 + index) * 5;
    ctx.save();
    ctx.translate(island.x, island.y + bob);

    ctx.fillStyle = `rgba(255, 210, 98, ${glowAlpha})`;
    ctx.beginPath();
    ctx.ellipse(0, 10, island.w * 0.75, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#4f046b";
    ctx.beginPath();
    ctx.ellipse(0, 0, island.w / 2, island.h, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#c86323b7";
    ctx.beginPath();
    ctx.moveTo(-island.w / 2 + 12, 8);
    ctx.lineTo(0, 62);
    ctx.lineTo(island.w / 2 - 12, 8);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  });
}

function drawMoonPortal() {
  const collected = runes.filter(rune => rune.collected).length;
  const needed = runes.length;
  const x = canvas.width / 2;
  const y = 110;

  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = `rgba(255, 226, 124, ${0.15 + collected * 0.12})`;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(0, 0, 34 + Math.sin(animationTime * 0.04) * 4, 0, Math.PI * 2);
  ctx.stroke();

  if (needed > 0 && collected === needed) {
    ctx.fillStyle = "rgba(255, 226, 124, 0.25)";
    ctx.beginPath();
    ctx.arc(0, 0, 72 + Math.sin(animationTime * 0.05) * 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffe680";
    ctx.font = "bold 24px Comic Sans MS";
    ctx.textAlign = "center";
    ctx.fillText("Portal Awake", 0, 96);
  }

  ctx.restore();
}

function drawHills() {
  ctx.fillStyle = "#18291f";
  ctx.beginPath();
  ctx.moveTo(0, 430);
  ctx.quadraticCurveTo(180, 330, 360, 420);
  ctx.quadraticCurveTo(550, 300, 760, 410);
  ctx.quadraticCurveTo(870, 455, 960, 395);
  ctx.lineTo(960, 600);
  ctx.lineTo(0, 600);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#101d18";
  ctx.beginPath();
  ctx.moveTo(0, 505);
  ctx.quadraticCurveTo(200, 430, 410, 500);
  ctx.quadraticCurveTo(620, 390, 960, 492);
  ctx.lineTo(960, 600);
  ctx.lineTo(0, 600);
  ctx.closePath();
  ctx.fill();
}

function drawPath() {
  ctx.fillStyle = "#7b654b";
  ctx.beginPath();
  ctx.moveTo(60, 600);
  ctx.quadraticCurveTo(330, 450, 455, 600);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#91775a";
  ctx.beginPath();
  ctx.moveTo(245, 600);
  ctx.quadraticCurveTo(575, 415, 905, 600);
  ctx.closePath();
  ctx.fill();
}

function drawRuins() {
  const stones = [
    { x: 560, y: 415, w: 24, h: 78 },
    { x: 596, y: 390, w: 28, h: 106 },
    { x: 635, y: 430, w: 20, h: 65 },
    { x: 714, y: 448, w: 52, h: 18 }
  ];

  ctx.fillStyle = "#686c75";
  ctx.strokeStyle = "#30343d";
  ctx.lineWidth = 2;

  stones.forEach(stone => {
    roundRect(stone.x, stone.y, stone.w, stone.h, 3, true, true);
  });
}

function drawDarknessOverlay() {
  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.54)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.globalCompositeOperation = "destination-out";
  const glow = ctx.createRadialGradient(player.x, player.y - 48, 30, player.x, player.y - 48, 185);
  glow.addColorStop(0, "rgba(0,0,0,0.95)");
  glow.addColorStop(0.6, "rgba(0,0,0,0.48)");
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(player.x, player.y - 48, 185, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function createSparkBurst(x, y, amount) {
  for (let i = 0; i < amount; i++) {
    sparks.push(new Spark(x, y));
  }
}

function updateSparks() {
  for (let i = sparks.length - 1; i >= 0; i--) {
    sparks[i].update();
    if (sparks[i].life <= 0) sparks.splice(i, 1);
  }
}

function drawSparks() {
  sparks.forEach(spark => spark.draw());
}

function updateScore() {
  const collected = runes.filter(rune => rune.collected).length;
  scoreText.textContent = collected;
  totalText.textContent = runes.length;

  if (runes.length > 0 && collected === runes.length && !gameComplete) {
    gameComplete = true;
    messageText.textContent = "All runes found! The sky portal has awakened.";
    createSparkBurst(canvas.width / 2, 110, 60);
  }
}

function gameLoop() {
  animationTime++;
  player.update();
  runes.forEach(rune => rune.update(player));
  updateSparks();

  drawBackground();
  runes.forEach(rune => rune.draw());
  drawSparks();
  player.draw();
  drawDarknessOverlay();

  requestAnimationFrame(gameLoop);
}

async function loadRunes() {
  try {
    const response = await fetch("data/runes.json");
    if (!response.ok) throw new Error("Could not load rune data.");
    const runeData = await response.json();
    runes = runeData.map(item => new Rune(item));
    updateScore();
    messageText.textContent = "Explore the scene. Your lantern reveals hidden runes.";
  } catch (error) {
    console.warn(error);
    runes = [
      new Rune({ x: 155, y: 425, symbol: "★", message: "Fallback light found." }),
      new Rune({ x: 480, y: 370, symbol: "✦", message: "Another fallback light found." }),
      new Rune({ x: 810, y: 445, symbol: "✧", message: "The fallback portal awakens." })
    ];
    updateScore();
    messageText.textContent = "Rune data could not load, so fallback runes appeared.";
  }
}

window.addEventListener("keydown", event => {
  const blockedKeys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "];

  // Stops the browser window from scrolling while the player moves.
  if (blockedKeys.includes(event.key)) {
    event.preventDefault();
  }

  keys[event.key] = true;
});

window.addEventListener("keyup", event => {
  const blockedKeys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "];

  if (blockedKeys.includes(event.key)) {
    event.preventDefault();
  }

  keys[event.key] = false;
});

canvas.addEventListener("click", event => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const x = (event.clientX - rect.left) * scaleX;
  const y = (event.clientY - rect.top) * scaleY;
  createSparkBurst(x, y, 10);
});

loadRunes().then(() => gameLoop());
