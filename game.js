(() => {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const overlay = document.getElementById("overlay");
  const startButton = document.getElementById("startButton");
  const restartButton = document.getElementById("restartButton");
  const levelTitle = document.getElementById("levelTitle");
  const skillStatusEl = document.getElementById("skillStatus");
  const deathCountEl = document.getElementById("deathCount");
  const timerEl = document.getElementById("timer");

  const W = 640;
  const H = 360;
  const TILE = 32;
  const GRAVITY = 1450;
  const MOVE_SPEED = 195;
  const JUMP_SPEED = 520;
  const FRICTION = 0.82;
  const SKILL_KEY_CODES = ["ShiftLeft", "ShiftRight", "KeyJ", "KeyK"];

  const characters = {
    runner: {
      name: "\u75be\u8dd1\u8005",
      skill: "\u51b2\u523a",
      cooldown: 1.6,
      duration: 0.16,
    },
    guard: {
      name: "\u5b88\u5907",
      skill: "\u62a4\u76fe",
      cooldown: 3.2,
      duration: 1.25,
    },
    phase: {
      name: "\u76f8\u4f4d",
      skill: "\u76f8\u4f4d",
      cooldown: 2.4,
      duration: 0.75,
    },
  };

  const atlas = new Image();
  atlas.src = "assets/atlas.png";
  const characterAtlas = new Image();
  characterAtlas.src = "assets/characters.png";

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

  const cell = (cx, cy) => [cx * 128, cy * 128, 128, 128];
  const characterFrames = {
    runner: {
      idle: cell(0, 0),
      run: cell(2, 0),
      jump: cell(5, 0),
      skill: cell(8, 0),
      dead: cell(9, 0),
    },
    guard: {
      idle: cell(0, 2),
      run: cell(1, 2),
      jump: cell(3, 2),
      skill: cell(4, 2),
      dead: cell(5, 2),
    },
    phase: {
      idle: cell(0, 4),
      run: cell(1, 4),
      jump: cell(2, 4),
      skill: cell(4, 4),
      dead: cell(5, 4),
    },
  };

  const keys = {
    left: false,
    right: false,
    jump: false,
    jumpQueued: false,
    skill: false,
  };

  const state = {
    mode: "title",
    levelIndex: 0,
    deaths: 0,
    startedAt: 0,
    levelStartedAt: 0,
    elapsed: 0,
    transition: 0,
    selectedCharacter: "runner",
    skillCooldown: 0,
    skillTime: 0,
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
      shieldGates: [{ x: 352, y: 292, w: 18, h: 36 }],
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
      phaseWalls: [{ x: 382, y: 160, w: 20, h: 86 }],
    },
    {
      name: "\u7b2c 7 \u5173  \u56de\u58f0",
      spawn: [34, 270],
      exit: { x: 568, y: 90, w: 38, h: 64 },
      platforms: [
        [0, 328, 118, 32],
        [158, 286, 78, 24],
        [280, 244, 78, 24],
        [424, 206, 80, 24],
        [546, 164, 82, 24],
        [332, 132, 82, 24],
        [170, 170, 78, 24],
      ],
      spikes: [
        [124, 306, 54, 22],
        [244, 306, 72, 22],
        [364, 306, 84, 22],
        [506, 306, 72, 22],
        [382, 184, 40, 22],
      ],
      movers: [
        { x: 252, y: 188, w: 34, h: 34, axis: "y", range: 56, speed: 62 },
        { x: 458, y: 128, w: 34, h: 34, axis: "x", range: 74, speed: 68 },
      ],
      fallingRocks: [
        { x: 310, y: 10, w: 24, h: 24, minY: 12, maxY: 286, speed: 96, delay: 0.4 },
        { x: 510, y: 10, w: 24, h: 24, minY: 12, maxY: 286, speed: 118, delay: 1.3 },
      ],
    },
    {
      name: "\u7b2c 8 \u5173  \u8ffd\u5f71",
      spawn: [34, 270],
      exit: { x: 572, y: 232, w: 38, h: 64 },
      chase: { startX: -112, width: 84, delay: 0.75, speed: 46 },
      platforms: [
        [0, 328, 640, 32],
        [126, 282, 94, 24],
        [274, 248, 92, 24],
        [432, 284, 100, 24],
      ],
      spikes: [
        [238, 306, 48, 22],
        [374, 306, 58, 22],
        [540, 306, 46, 22],
      ],
      movers: [
        { x: 300, y: 204, w: 34, h: 34, axis: "y", range: 42, speed: 54 },
      ],
      shieldGates: [{ x: 414, y: 284, w: 18, h: 44 }],
    },
    {
      name: "\u7b2c 9 \u5173  \u9ed1\u6f6e",
      spawn: [34, 270],
      exit: { x: 572, y: 232, w: 38, h: 64 },
      chase: { startX: -132, width: 94, delay: 0.65, speed: 44 },
      platforms: [
        [0, 328, 640, 32],
        [132, 284, 96, 24],
        [284, 250, 96, 24],
        [438, 284, 96, 24],
      ],
      spikes: [
        [238, 306, 48, 22],
        [390, 306, 48, 22],
        [538, 306, 36, 22],
      ],
      movers: [
        { x: 318, y: 206, w: 34, h: 34, axis: "y", range: 44, speed: 62 },
      ],
      phaseWalls: [{ x: 456, y: 268, w: 20, h: 60 }],
    },
    {
      name: "\u7b2c 10 \u5173  \u7ec8\u5e55\u8ffd\u730e",
      spawn: [34, 270],
      exit: { x: 574, y: 70, w: 38, h: 64 },
      chase: { startX: -140, width: 104, delay: 0.35, speed: 58 },
      platforms: [
        [0, 328, 112, 32],
        [146, 288, 70, 24],
        [262, 250, 70, 24],
        [388, 292, 68, 24],
        [508, 248, 92, 24],
        [534, 148, 90, 24],
        [392, 168, 76, 24],
        [242, 136, 74, 24],
        [126, 186, 70, 24],
      ],
      spikes: [
        [116, 306, 58, 22],
        [220, 306, 72, 22],
        [336, 306, 52, 22],
        [462, 306, 82, 22],
        [472, 226, 44, 22],
        [320, 148, 42, 22],
      ],
      movers: [
        { x: 206, y: 220, w: 34, h: 34, axis: "y", range: 48, speed: 66 },
        { x: 354, y: 112, w: 34, h: 34, axis: "x", range: 72, speed: 74 },
        { x: 500, y: 182, w: 34, h: 34, axis: "y", range: 56, speed: 70 },
      ],
      shieldGates: [{ x: 470, y: 248, w: 18, h: 58 }],
      phaseWalls: [{ x: 330, y: 178, w: 20, h: 92 }],
      fallingRocks: [
        { x: 250, y: 10, w: 24, h: 24, minY: 12, maxY: 286, speed: 110, delay: 0.2 },
        { x: 548, y: 10, w: 24, h: 24, minY: 12, maxY: 286, speed: 132, delay: 1.1 },
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
      shieldGates: (source.shieldGates || []).map((g) => ({ ...g })),
      phaseWalls: (source.phaseWalls || []).map((w) => ({ ...w })),
      fallingRocks: (source.fallingRocks || []).map((r) => ({ ...r, y: r.minY, phase: r.delay || 0 })),
    };
  }

  function startGame() {
    state.mode = "playing";
    state.levelIndex = 0;
    state.deaths = 0;
    state.skillCooldown = 0;
    state.skillTime = 0;
    state.startedAt = performance.now();
    loadLevel(0);
    overlay.classList.add("hidden");
  }

  function loadLevel(index) {
    state.levelIndex = index;
    state.levelStartedAt = performance.now();
    level = cloneLevel(levels[index]);
    player.spawnX = level.spawn[0];
    player.spawnY = level.spawn[1];
    resetPlayer();
    updateHud();
  }

  function resetPlayer() {
    state.levelStartedAt = performance.now();
    player.x = player.spawnX;
    player.y = player.spawnY;
    player.vx = 0;
    player.vy = 0;
    player.onGround = false;
    player.anim = 0;
    state.skillCooldown = 0;
    state.skillTime = 0;
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
    for (const rock of level.fallingRocks) {
      rock.phase += dt;
      const activeTime = Math.max(0, rock.phase - (rock.delay || 0));
      const span = rock.maxY - rock.minY;
      rock.y = rock.minY + ((activeTime * rock.speed) % span);
    }

    state.skillCooldown = Math.max(0, state.skillCooldown - dt);
    state.skillTime = Math.max(0, state.skillTime - dt);

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

    if (keys.skill) {
      activateSkill();
      keys.skill = false;
    }

    player.vy += GRAVITY * dt;
    moveAndCollide(dt);

    if (player.y > H + 80) die();
    if (level.chase && player.x < getChaseEdge()) die();
    for (const spike of level.spikes) {
      if (rectsOverlap(player, { x: spike[0] + 5, y: spike[1] + 4, w: spike[2] - 10, h: spike[3] - 4 })) die();
    }
    for (const mover of level.movers) {
      if (rectsOverlap(player, mover) && !isShieldActive()) die();
    }
    for (const gate of level.shieldGates) {
      if (rectsOverlap(player, gate) && !isShieldActive()) die();
    }
    for (const rock of level.fallingRocks) {
      if (rectsOverlap(player, rock) && !isShieldActive()) die();
    }
    if (rectsOverlap(player, level.exit)) completeLevel();
    updateHud();
  }

  function activateSkill() {
    if (state.skillCooldown > 0 || state.skillTime > 0) return;
    const character = characters[state.selectedCharacter];
    state.skillCooldown = character.cooldown;
    state.skillTime = character.duration;
    if (state.selectedCharacter === "runner") {
      const direction = player.facing || 1;
      player.vx = direction * 420;
    }
  }

  function isShieldActive() {
    return state.selectedCharacter === "guard" && state.skillTime > 0;
  }

  function isPhaseActive() {
    return state.selectedCharacter === "phase" && state.skillTime > 0;
  }

  function moveAndCollide(dt) {
    const solids = level.platforms.map(([x, y, w, h]) => ({ x, y, w, h }));
    if (!isPhaseActive()) {
      solids.push(...level.phaseWalls);
    }

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
    drawChase();
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
    for (const wall of level.phaseWalls) drawPhaseWall(wall);
    for (const gate of level.shieldGates) drawShieldGate(gate);
    for (const rock of level.fallingRocks) drawFallingRock(rock);
    for (const mover of level.movers) drawSprite(sprites.block, mover.x, mover.y, mover.w, mover.h);
    drawSprite(sprites.door, level.exit.x - 25, level.exit.y - 26, 88, 94);
  }

  function getLevelElapsed() {
    return (performance.now() - state.levelStartedAt) / 1000;
  }

  function getChaseEdge() {
    if (!level.chase) return -Infinity;
    const activeTime = Math.max(0, getLevelElapsed() - level.chase.delay);
    return level.chase.startX + level.chase.width + activeTime * level.chase.speed;
  }

  function drawChase() {
    if (!level.chase || state.mode !== "playing") return;
    const edge = getChaseEdge();
    const x = edge - level.chase.width;
    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = "#070707";
    ctx.fillRect(0, 0, Math.max(0, edge), H);
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#f8f8f0";
    for (let y = 10; y < H; y += 20) {
      ctx.fillRect(Math.round(x + 62 + Math.sin((y + state.elapsed / 30) / 9) * 8), y, 10, 3);
    }
    ctx.restore();
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

  function drawShieldGate(gate) {
    ctx.save();
    ctx.fillStyle = "#070707";
    ctx.fillRect(gate.x, gate.y, gate.w, gate.h);
    ctx.fillStyle = "#f8f8f0";
    for (let y = gate.y + 4; y < gate.y + gate.h - 4; y += 10) {
      ctx.fillRect(gate.x + 4, y, gate.w - 8, 3);
    }
    ctx.restore();
  }

  function drawPhaseWall(wall) {
    ctx.save();
    ctx.globalAlpha = isPhaseActive() ? 0.28 : 0.78;
    ctx.fillStyle = "#070707";
    ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
    ctx.fillStyle = "#f8f8f0";
    for (let y = wall.y + 6; y < wall.y + wall.h; y += 14) {
      ctx.fillRect(wall.x + 3, y, wall.w - 6, 2);
    }
    ctx.restore();
  }

  function drawFallingRock(rock) {
    ctx.save();
    ctx.fillStyle = "#070707";
    ctx.fillRect(Math.round(rock.x), Math.round(rock.y), rock.w, rock.h);
    ctx.fillStyle = "#f8f8f0";
    ctx.fillRect(Math.round(rock.x + 6), Math.round(rock.y + 6), 5, 5);
    ctx.fillRect(Math.round(rock.x + 14), Math.round(rock.y + 13), 4, 4);
    ctx.restore();
  }

  function drawPlayer() {
    const character = state.selectedCharacter;
    let frame = "idle";
    if (state.skillTime > 0) frame = "skill";
    else if (!player.onGround) frame = "jump";
    else if (Math.abs(player.vx) > 20) frame = "run";
    else if (state.mode === "won") frame = "dead";

    const sprite = characterFrames[character][frame];
    const drawW = 36;
    const drawH = 36;
    const drawX = player.x - 8;
    const drawY = player.y - 10;

    ctx.save();
    if (isShieldActive()) {
      ctx.strokeStyle = "#070707";
      ctx.lineWidth = 3;
      ctx.strokeRect(Math.round(player.x - 6), Math.round(player.y - 8), player.w + 12, player.h + 14);
    }
    if (isPhaseActive()) {
      ctx.globalAlpha = 0.45;
    }
    if (player.facing < 0) {
      ctx.translate(drawX + drawW / 2, 0);
      ctx.scale(-1, 1);
      drawCharacterSprite(character, frame, -drawW / 2, drawY, drawW, drawH);
    } else {
      drawCharacterSprite(character, frame, drawX, drawY, drawW, drawH);
    }
    ctx.globalAlpha = 1;
    drawCharacterBadge(drawX + 2, drawY - 6);
    ctx.restore();
  }

  function drawCharacterBadge(x, y) {
    ctx.fillStyle = "#070707";
    ctx.fillRect(Math.round(x), Math.round(y), 12, 12);
    ctx.fillStyle = "#f8f8f0";
    ctx.font = "9px Courier New";
    const label = state.selectedCharacter === "runner" ? "R" : state.selectedCharacter === "guard" ? "G" : "P";
    ctx.fillText(label, Math.round(x + 3), Math.round(y + 9));
  }

  function drawCharacterSprite(character, pose, x, y, w, h) {
    const src = characterFrames[character][pose];
    if (characterAtlas.complete && characterAtlas.naturalWidth) {
      ctx.drawImage(characterAtlas, src[0], src[1], src[2], src[3], Math.round(x), Math.round(y), Math.round(w), Math.round(h));
      return;
    }
    ctx.fillStyle = "#070707";
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
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
    const character = characters[state.selectedCharacter];
    const skillText = state.skillTime > 0
      ? `${character.skill} ${state.skillTime.toFixed(1)}`
      : state.skillCooldown > 0
        ? `${character.skill} ${state.skillCooldown.toFixed(1)}`
        : `${character.skill} OK`;
    skillStatusEl.textContent = skillText;
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
    if (SKILL_KEY_CODES.includes(code) && pressed) {
      keys.skill = true;
    }
  }

  window.addEventListener("keydown", (event) => {
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "Space", "KeyA", "KeyD", "KeyW", ...SKILL_KEY_CODES].includes(event.code)) {
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
    keys.skill = false;
  });

  for (const button of document.querySelectorAll("[data-character]")) {
    button.addEventListener("click", () => {
      state.selectedCharacter = button.dataset.character;
      state.skillCooldown = 0;
      state.skillTime = 0;
      for (const card of document.querySelectorAll("[data-character]")) {
        card.classList.toggle("active", card === button);
      }
      updateHud();
    });
  }

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
      if (control === "skill") keys.skill = true;
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
      if (control === "skill") keys.skill = false;
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
