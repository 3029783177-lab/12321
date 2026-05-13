(() => {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const overlay = document.getElementById("overlay");
  const startButton = document.getElementById("startButton");
  const restartButton = document.getElementById("restartButton");
  const levelTitle = document.getElementById("levelTitle");
  const deathCountEl = document.getElementById("deathCount");
  const timerEl = document.getElementById("timer");

  const W = 640;
  const H = 360;
  const TILE = 32;
  const GRAVITY = 1450;
  const MOVE_SPEED = 195;
  const JUMP_SPEED = 520;
  const FRICTION = 0.82;

  const atlas = new Image();
  atlas.src = "assets/atlas.png";

  const sprites = {
    player: [
      [56, 40, 52, 64],
      [136, 40, 52, 64],
      [230, 40, 60, 64],
      [324, 40, 60, 64],
      [414, 40, 58, 64],
      [500, 30, 62, 72],
      [613, 40, 58, 62],
    ],
    dead: [766, 48, 82, 42],
    ground: [38, 164, 148, 42],
    brick: [42, 258, 112, 68],
    spike: [42, 354, 35, 52],
    block: [40, 432, 48, 48],
    door: [817, 372, 100, 106],
    restart: [40, 516, 96, 96],
    flag: [158, 516, 96, 96],
    stars: [313, 498, 300, 120],
  };

  const keys = {
    left: false,
    right: false,
    jump: false,
    jumpQueued: false,
  };

  const state = {
    mode: "title",
    levelIndex: 0,
    deaths: 0,
    startedAt: 0,
    elapsed: 0,
    transition: 0,
  };

  const player = {
    x: 0,
    y: 0,
    w: 22,
    h: 31,
    vx: 0,
    vy: 0,
    facing: 1,
    onGround: false,
    spawnX: 0,
    spawnY: 0,
    anim: 0,
  };

  const levels = [
    {
    name: "\u7b2c 1 \u5173  \u521d\u8df3",
      spawn: [38, 270],
      exit: { x: 560, y: 232, w: 38, h: 64 },
      platforms: [
        [0, 328, 640, 32],
        [150, 274, 110, 24],
        [335, 230, 100, 24],
        [498, 264, 88, 24],
      ],
      spikes: [[292, 306, 36, 22]],
      movers: [],
    },
    {
      name: "\u7b2c 2 \u5173  \u95f4\u9694",
      spawn: [34, 270],
      exit: { x: 570, y: 96, w: 38, h: 64 },
      platforms: [
        [0, 328, 176, 32],
        [230, 294, 84, 24],
        [370, 252, 84, 24],
        [512, 208, 112, 24],
        [546, 160, 78, 24],
      ],
      spikes: [
        [184, 306, 36, 22],
        [324, 330, 84, 22],
        [458, 330, 74, 22],
      ],
      movers: [],
    },
    {
      name: "\u7b2c 3 \u5173  \u4f1a\u52a8\u7684\u5899",
      spawn: [34, 270],
      exit: { x: 570, y: 232, w: 38, h: 64 },
      platforms: [
        [0, 328, 640, 32],
        [116, 276, 126, 24],
        [282, 248, 76, 24],
        [404, 276, 126, 24],
      ],
      spikes: [
        [252, 306, 48, 22],
        [364, 306, 42, 22],
      ],
      movers: [
        { x: 270, y: 238, w: 34, h: 34, axis: "x", range: 46, speed: 48 },
        { x: 366, y: 196, w: 34, h: 34, axis: "y", range: 44, speed: 46 },
      ],
    },
    {
      name: "\u7b2c 4 \u5173  \u4f4e\u9876",
      spawn: [34, 270],
      exit: { x: 560, y: 72, w: 38, h: 64 },
      platforms: [
        [0, 328, 116, 32],
        [158, 292, 82, 24],
        [284, 260, 70, 24],
        [398, 222, 78, 24],
        [526, 174, 92, 24],
        [112, 118, 150, 24],
        [360, 120, 90, 24],
      ],
      spikes: [
        [122, 306, 64, 22],
        [248, 306, 64, 22],
        [482, 306, 96, 22],
      ],
      movers: [{ x: 206, y: 178, w: 38, h: 38, axis: "x", range: 120, speed: 92 }],
    },
    {
      name: "\u7b2c 5 \u5173  \u9ed1\u95e8",
      spawn: [34, 270],
      exit: { x: 574, y: 66, w: 38, h: 64 },
      platforms: [
        [0, 328, 106, 32],
        [146, 288, 72, 24],
        [260, 248, 72, 24],
        [390, 292, 72, 24],
        [510, 240, 100, 24],
        [540, 134, 88, 24],
        [368, 166, 82, 24],
        [206, 138, 82, 24],
      ],
      spikes: [
        [112, 306, 62, 22],
        [222, 306, 82, 22],
        [330, 306, 50, 22],
        [466, 306, 102, 22],
        [458, 218, 42, 22],
      ],
      movers: [
        { x: 110, y: 222, w: 38, h: 38, axis: "y", range: 74, speed: 78 },
        { x: 314, y: 112, w: 38, h: 38, axis: "x", range: 112, speed: 88 },
        { x: 486, y: 176, w: 38, h: 38, axis: "y", range: 82, speed: 92 },
      ],
    },
    {
      name: "\u7b2c 6 \u5173  \u7a84\u6865",
      spawn: [34, 270],
      exit: { x: 570, y: 76, w: 38, h: 64 },
      platforms: [
        [0, 328, 126, 32],
        [170, 292, 76, 24],
        [304, 258, 72, 24],
        [446, 292, 72, 24],
        [540, 246, 82, 24],
        [438, 174, 88, 24],
        [282, 134, 80, 24],
        [146, 178, 72, 24],
        [548, 144, 80, 24],
      ],
      spikes: [
        [132, 306, 52, 22],
        [252, 306, 76, 22],
        [382, 306, 56, 22],
        [522, 306, 54, 22],
        [388, 236, 42, 22],
        [226, 156, 40, 22],
      ],
      movers: [
        { x: 258, y: 206, w: 34, h: 34, axis: "x", range: 58, speed: 62 },
        { x: 500, y: 190, w: 34, h: 34, axis: "y", range: 54, speed: 58 },
      ],
    },
  ];

  let level = cloneLevel(levels[0]);
  let lastTime = performance.now();

  function cloneLevel(source) {
    return {
      ...source,
      exit: { ...source.exit },
      platforms: source.platforms.map((p) => [...p]),
      spikes: source.spikes.map((s) => [...s]),
      movers: source.movers.map((m) => ({ ...m, originX: m.x, originY: m.y, phase: 0 })),
    };
  }

  function startGame() {
    state.mode = "playing";
    state.levelIndex = 0;
    state.deaths = 0;
    state.startedAt = performance.now();
    loadLevel(0);
    overlay.classList.add("hidden");
  }

  function loadLevel(index) {
    state.levelIndex = index;
    level = cloneLevel(levels[index]);
    player.spawnX = level.spawn[0];
    player.spawnY = level.spawn[1];
    resetPlayer();
    updateHud();
  }

  function resetPlayer() {
    player.x = player.spawnX;
    player.y = player.spawnY;
    player.vx = 0;
    player.vy = 0;
    player.onGround = false;
    player.anim = 0;
  }

  function die() {
    if (state.mode !== "playing") return;
    state.deaths += 1;
    resetPlayer();
    updateHud();
  }

  function completeLevel() {
    if (state.levelIndex >= levels.length - 1) {
      state.mode = "won";
      overlay.querySelector("h2").textContent = "\u5168\u90e8\u901a\u5173";
      overlay.querySelector("p").textContent = `\u7528\u65f6 ${formatTime(state.elapsed)}\uff0c\u6b7b\u4ea1 ${state.deaths} \u6b21\u3002`;
      startButton.textContent = "\u518d\u73a9\u4e00\u6b21";
      overlay.classList.remove("hidden");
      return;
    }
    loadLevel(state.levelIndex + 1);
  }

  function update(dt) {
    if (state.mode !== "playing") return;
    state.elapsed = performance.now() - state.startedAt;
    player.anim += dt;

    for (const mover of level.movers) {
      mover.phase += dt * mover.speed;
      const offset = Math.sin(mover.phase / 38) * mover.range;
      if (mover.axis === "x") {
        mover.x = mover.originX + offset;
      } else {
        mover.y = mover.originY + offset;
      }
    }

    const wantLeft = keys.left && !keys.right;
    const wantRight = keys.right && !keys.left;
    if (wantLeft) {
      player.vx = -MOVE_SPEED;
      player.facing = -1;
    } else if (wantRight) {
      player.vx = MOVE_SPEED;
      player.facing = 1;
    } else {
      player.vx *= FRICTION;
      if (Math.abs(player.vx) < 4) player.vx = 0;
    }

    if (keys.jumpQueued && player.onGround) {
      player.vy = -JUMP_SPEED;
      player.onGround = false;
    }
    keys.jumpQueued = false;

    player.vy += GRAVITY * dt;
    moveAndCollide(dt);

    if (player.y > H + 80) die();
    for (const spike of level.spikes) {
      if (rectsOverlap(player, { x: spike[0] + 5, y: spike[1] + 4, w: spike[2] - 10, h: spike[3] - 4 })) die();
    }
    for (const mover of level.movers) {
      if (rectsOverlap(player, mover)) die();
    }
    if (rectsOverlap(player, level.exit)) completeLevel();
    updateHud();
  }

  function moveAndCollide(dt) {
    const solids = level.platforms.map(([x, y, w, h]) => ({ x, y, w, h }));

    player.x += player.vx * dt;
    for (const solid of solids) {
      if (!rectsOverlap(player, solid)) continue;
      if (player.vx > 0) player.x = solid.x - player.w;
      if (player.vx < 0) player.x = solid.x + solid.w;
      player.vx = 0;
    }

    player.y += player.vy * dt;
    player.onGround = false;
    for (const solid of solids) {
      if (!rectsOverlap(player, solid)) continue;
      if (player.vy > 0) {
        player.y = solid.y - player.h;
        player.onGround = true;
      } else if (player.vy < 0) {
        player.y = solid.y + solid.h;
      }
      player.vy = 0;
    }

    player.x = Math.max(0, Math.min(W - player.w, player.x));
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#f8f8f0";
    ctx.fillRect(0, 0, W, H);
    drawBackground();
    drawLevel();
    drawPlayer();

    if (state.mode === "title") {
      ctx.fillStyle = "#070707";
      ctx.font = "14px Courier New";
      ctx.fillText("Press Start", 276, 330);
    }
  }

  function drawBackground() {
    ctx.save();
    ctx.globalAlpha = 0.16;
    for (let y = 0; y < H; y += 80) {
      for (let x = 0; x < W; x += 160) {
        drawSprite(sprites.stars, x - ((state.elapsed / 80) % 160), y, 150, 60);
      }
    }
    ctx.restore();
    ctx.fillStyle = "#070707";
    for (let x = 0; x < W; x += TILE) {
      ctx.fillRect(x, H - 1, 18, 1);
    }
  }

  function drawLevel() {
    for (const p of level.platforms) drawPlatform(p[0], p[1], p[2], p[3]);
    for (const s of level.spikes) drawHazard(s[0], s[1], s[2], s[3]);
    for (const mover of level.movers) drawSprite(sprites.block, mover.x, mover.y, mover.w, mover.h);
    drawSprite(sprites.door, level.exit.x - 25, level.exit.y - 26, 88, 94);
  }

  function drawPlatform(x, y, w, h) {
    const sprite = h > 26 ? sprites.ground : sprites.brick;
    for (let px = x; px < x + w; px += 54) {
      const sw = Math.min(56, x + w - px);
      drawSprite(sprite, px, y - 3, sw, h + 6);
    }
  }

  function drawHazard(x, y, w, h) {
    const count = Math.max(1, Math.round(w / 28));
    for (let i = 0; i < count; i++) {
      drawSprite(sprites.spike, x + i * (w / count), y - 17, w / count, h + 22);
    }
  }

  function drawPlayer() {
    let frame = 0;
    if (!player.onGround) frame = 5;
    else if (Math.abs(player.vx) > 20) frame = 2 + (Math.floor(player.anim * 10) % 3);
    else frame = Math.floor(player.anim * 3) % 2;

    const sprite = sprites.player[frame];
    const drawW = 38;
    const drawH = 48;
    const drawX = player.x - 8;
    const drawY = player.y - 17;

    ctx.save();
    if (player.facing < 0) {
      ctx.translate(drawX + drawW / 2, 0);
      ctx.scale(-1, 1);
      drawSprite(sprite, -drawW / 2, drawY, drawW, drawH);
    } else {
      drawSprite(sprite, drawX, drawY, drawW, drawH);
    }
    ctx.restore();
  }

  function drawSprite(src, x, y, w, h) {
    if (atlas.complete && atlas.naturalWidth) {
      ctx.drawImage(atlas, src[0], src[1], src[2], src[3], Math.round(x), Math.round(y), Math.round(w), Math.round(h));
      return;
    }
    ctx.fillStyle = "#070707";
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }

  function updateHud() {
    levelTitle.textContent = levels[state.levelIndex].name;
    deathCountEl.textContent = `\u6b7b\u4ea1 ${state.deaths}`;
    timerEl.textContent = formatTime(state.elapsed);
  }

  function formatTime(ms) {
    const total = Math.floor(ms / 1000);
    const minutes = String(Math.floor(total / 60)).padStart(2, "0");
    const seconds = String(total % 60).padStart(2, "0");
    return `${minutes}:${seconds}`;
  }

  function rectsOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function loop(now) {
    const dt = Math.min(0.033, (now - lastTime) / 1000);
    lastTime = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  function setKey(code, pressed) {
    if (code === "ArrowLeft" || code === "KeyA") keys.left = pressed;
    if (code === "ArrowRight" || code === "KeyD") keys.right = pressed;
    if (code === "ArrowUp" || code === "KeyW" || code === "Space") {
      if (pressed && !keys.jump) keys.jumpQueued = true;
      keys.jump = pressed;
    }
  }

  window.addEventListener("keydown", (event) => {
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "Space", "KeyA", "KeyD", "KeyW"].includes(event.code)) {
      event.preventDefault();
      setKey(event.code, true);
    }
    if (event.code === "KeyR") {
      event.preventDefault();
      if (state.mode === "playing") {
        state.deaths += 1;
        resetPlayer();
        updateHud();
      }
    }
    if (event.code === "Enter" && state.mode !== "playing") startGame();
  });

  window.addEventListener("keyup", (event) => setKey(event.code, false));
  window.addEventListener("blur", () => {
    keys.left = false;
    keys.right = false;
    keys.jump = false;
  });

  startButton.addEventListener("click", startGame);
  restartButton.addEventListener("click", () => {
    if (state.mode === "playing") {
      state.deaths += 1;
      resetPlayer();
      updateHud();
    } else {
      startGame();
    }
  });

  for (const button of document.querySelectorAll("[data-control]")) {
    const control = button.dataset.control;
    const down = (event) => {
      event.preventDefault();
      button.classList.add("active");
      if (control === "left") keys.left = true;
      if (control === "right") keys.right = true;
      if (control === "jump") {
        if (!keys.jump) keys.jumpQueued = true;
        keys.jump = true;
      }
    };
    const up = (event) => {
      event.preventDefault();
      button.classList.remove("active");
      if (control === "left") keys.left = false;
      if (control === "right") keys.right = false;
      if (control === "jump") keys.jump = false;
    };
    button.addEventListener("pointerdown", down);
    button.addEventListener("pointerup", up);
    button.addEventListener("pointercancel", up);
    button.addEventListener("pointerleave", up);
  }

  atlas.addEventListener("load", draw);
  updateHud();
  requestAnimationFrame(loop);
})();
