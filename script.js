/* =========================
   CANVAS SETUP
========================= */

const canvas = document.getElementById("penguinCanvas");
const ctx = canvas.getContext("2d");

const CANVAS_HEIGHT = 140;

function setCanvasSize() {
  canvas.width = window.innerWidth;
  canvas.height = CANVAS_HEIGHT;
}

setCanvasSize();

const FRAME_SIZE = 32;
const SCALE = 2;
const GROUND_HEIGHT = 20;

/* =========================
   ANIMATION ROWS
========================= */

const ROW_IDLE = 0;
const ROW_RUN = 1;
const ROW_JUMP = 2;
const ROW_HURT = 3;
const ROW_SLIDE = 4;

/* =========================
   LOAD SPRITE
========================= */

const sprite = new Image();
sprite.src = "penguin.png";

/* =========================
   PENGUIN STATE
========================= */

let penguin = {
  x: 0,
  y: canvas.height - FRAME_SIZE * SCALE - GROUND_HEIGHT,
  speed: 1.5,
  direction: 1,
  frame: 0,
  frameCount: 4,
  row: ROW_RUN,
  jumping: false,
  sliding: false,
  vy: 0
};

let frameTimer = 0;
const frameInterval = 120;

/* =========================
   MAIN LOOP
========================= */

sprite.onload = () => requestAnimationFrame(animate);

let lastTime = 0;

function animate(timestamp) {
  const delta = timestamp - lastTime;
  lastTime = timestamp;

  updatePenguin(delta);
  drawPenguin();

  requestAnimationFrame(animate);
}

/* =========================
   DRAWING
========================= */

function drawGround() {
  const tileSize = 16;

  for (let i = 0; i < canvas.width; i += tileSize) {
    ctx.fillStyle =
      i % (tileSize * 2) === 0 ? "#ff8fab" : "#ffc2d1";

    ctx.fillRect(
      i,
      canvas.height - GROUND_HEIGHT,
      tileSize,
      GROUND_HEIGHT
    );
  }
}

function drawPenguin() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = false;

  drawGround();

  ctx.save();

  if (penguin.direction === -1) {
    ctx.translate(penguin.x + FRAME_SIZE * SCALE, 0);
    ctx.scale(-1, 1);
    drawSprite(0);
  } else {
    drawSprite(penguin.x);
  }

  ctx.restore();
}

function drawSprite(drawX) {
  ctx.drawImage(
    sprite,
    penguin.frame * FRAME_SIZE,
    penguin.row * FRAME_SIZE,
    FRAME_SIZE,
    FRAME_SIZE,
    drawX,
    penguin.y,
    FRAME_SIZE * SCALE,
    FRAME_SIZE * SCALE
  );
}

/* =========================
   UPDATE LOGIC
========================= */

function updatePenguin(delta) {

  penguin.x += penguin.speed * penguin.direction;

  if (
    penguin.x <= 0 ||
    penguin.x >= canvas.width - FRAME_SIZE * SCALE
  ) {
    penguin.direction *= -1;
  }

  // Jump physics
  if (penguin.jumping) {
    penguin.vy += 0.3;
    penguin.y += penguin.vy;

    if (penguin.y >= canvas.height - FRAME_SIZE * SCALE - GROUND_HEIGHT) {
      penguin.y = canvas.height - FRAME_SIZE * SCALE - GROUND_HEIGHT;
      penguin.jumping = false;
      penguin.row = ROW_RUN;
      penguin.frameCount = 4;
    }
  }

  // Frame animation
  if (!penguin.jumping && !penguin.sliding) {
    frameTimer += delta;

    if (frameTimer > frameInterval) {
      penguin.frame =
        (penguin.frame + 1) % penguin.frameCount;
      frameTimer = 0;
    }
  }
}

/* =========================
   RANDOM ACTION ON CLICK
========================= */

canvas.addEventListener("click", handlePenguinClick);
canvas.addEventListener("touchstart", handlePenguinClick);

function handlePenguinClick(e) {

  const rect = canvas.getBoundingClientRect();

  const clickX = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
  const clickY = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;

  const width = FRAME_SIZE * SCALE;
  const height = FRAME_SIZE * SCALE;

  const inside =
    clickX >= penguin.x &&
    clickX <= penguin.x + width &&
    clickY >= penguin.y &&
    clickY <= penguin.y + height;

  if (!inside) return;

  performRandomAction();
}

function performRandomAction() {

  if (penguin.jumping || penguin.sliding) return;

  const random = Math.floor(Math.random() * 2);

  switch (random) {

    case 0:
      triggerJump();
      break;

    case 1:
      triggerSlide();
      break;
  }
}

/* =========================
   ACTIONS
========================= */

function triggerJump() {
  penguin.jumping = true;
  penguin.row = ROW_JUMP;
  penguin.frame = 0;
  penguin.frameCount = 1;
  penguin.vy = -7;
}

function triggerSlide() {

  penguin.sliding = true;
  penguin.row = ROW_SLIDE;
  penguin.frame = 0;
  penguin.frameCount = 3;

  // Frame 0 → 1
  setTimeout(() => {
    penguin.frame = 1;
  }, 120);

  // Frame 1 → 2
  setTimeout(() => {
    penguin.frame = 2;
  }, 240);

  // HOLD frame 2 longer
  setTimeout(() => {
    penguin.sliding = false;
    penguin.row = ROW_RUN;
    penguin.frame = 0;
    penguin.frameCount = 4;
  }, 900); // ← increased from 600 to 900
}


function playHurtAnimation() {

  penguin.row = ROW_HURT;
  penguin.frame = 0;
  penguin.frameCount = 1;

  let shake = 0;
  const originalX = penguin.x;

  const shakeInterval = setInterval(() => {
    penguin.x += shake % 2 === 0 ? -4 : 4;
    shake++;

    if (shake > 6) {
      clearInterval(shakeInterval);
      penguin.x = originalX;
      penguin.row = ROW_RUN;
      penguin.frameCount = 4;
    }
  }, 60);
}

/* =========================
   SMART RESIZE FIX
========================= */

function handleResize() {

  const oldWidth = canvas.width;
  setCanvasSize();

  penguin.x = (penguin.x / oldWidth) * canvas.width;

  if (penguin.x > canvas.width - FRAME_SIZE * SCALE)
    penguin.x = canvas.width - FRAME_SIZE * SCALE;

  if (penguin.x < 0)
    penguin.x = 0;

  penguin.y =
    canvas.height - FRAME_SIZE * SCALE - GROUND_HEIGHT;
}

window.addEventListener("resize", handleResize);

window.addEventListener("orientationchange", () => {
  setTimeout(handleResize, 200);
});

/* =========================
   VALENTINE COUNTDOWN
========================= */

function updateCountdown() {

  const now = new Date();
  const year = now.getFullYear();

  let valentine = new Date(year, 1, 14);

  if (now > valentine)
    valentine = new Date(year + 1, 1, 14);

  const diff = valentine - now;

  document.getElementById("days").textContent =
    Math.floor(diff / (1000 * 60 * 60 * 24));

  document.getElementById("hours").textContent =
    Math.floor((diff / (1000 * 60 * 60)) % 24);

  document.getElementById("minutes").textContent =
    Math.floor((diff / (1000 * 60)) % 60);

  document.getElementById("seconds").textContent =
    Math.floor((diff / 1000) % 60);
}

setInterval(updateCountdown, 1000);
updateCountdown();

/* =========================
   OTP INPUT LOGIC
========================= */

const inputs = document.querySelectorAll(".otp-input");

inputs.forEach((input, index) => {

  input.addEventListener("input", () => {
    input.value = input.value.replace(/[^0-9]/g, "");

    if (input.value && index < inputs.length - 1) {
      inputs[index + 1].focus();
    }

    // If last box filled → auto check
    if (index === inputs.length - 1 && input.value) {
      checkPassword();
    }
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Backspace" && !input.value && index > 0) {
      inputs[index - 1].focus();
    }
  });

});


/* =========================
   CHECK PASSWORD
========================= */

function checkPassword() {

  let password = "";
  inputs.forEach(input => password += input.value);

  // 140226 → kh.html
  if (password === "140226") {

    startHappyJumpThenRedirect("kh.html");

  }

  // 171208 → valentine.html
  else if (password === "171208") {

    startHappyJumpThenRedirect("valentine.html");

  }

  // Wrong password
  else {

    playHurtAnimation();

    // Optional: clear inputs after wrong attempt
    setTimeout(() => {
      inputs.forEach(input => input.value = "");
      inputs[0].focus();
    }, 800);

  }
}


/* =========================
   HAPPY JUMP + REDIRECT
========================= */

function startHappyJumpThenRedirect(targetPage) {

  // Make penguin jump happily
  triggerJump();

  // Small delay so animation plays
  setTimeout(() => {
    document.body.classList.add("fade-out");

    setTimeout(() => {
      window.location.href = targetPage;
    }, 600);

  }, 800);

}
