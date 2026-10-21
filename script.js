
document.addEventListener("DOMContentLoaded", () => {
  // =========================
  // GET HTML ELEMENTS
  // =========================

  const landingPage = document.getElementById("landingPage");
  const datePage = document.getElementById("datePage");
  const openButton = document.getElementById("openButton");
  const backButton = document.getElementById("backButton");

  const gateIntro = document.getElementById("gateIntro");
  const canvas = document.getElementById("scratchCanvas");
  const ctx = canvas.getContext("2d");

  // Wedding date: 24 November 2026, 6:00 PM local time
  const weddingDate = new Date(2026, 10, 24, 18, 0, 0);

  let gateAnimationRunning = false;
  let isScratching = false;
  let isRevealed = false;
  let countdownInterval = null;
  let gateTimers = [];

  // =========================
  // HEART SHAPE
  // Keep this shape aligned with #smoothHeartClip in index.html
  // =========================

  function traceHeart(context, w, h) {
    context.beginPath();

    context.moveTo(w * 0.5, h * 0.96);

    context.bezierCurveTo(
      w * 0.43, h * 0.89,
      w * 0.04, h * 0.62,
      w * 0.04, h * 0.31
    );

    context.bezierCurveTo(
      w * 0.04, h * 0.12,
      w * 0.17, h * 0.02,
      w * 0.32, h * 0.04
    );

    context.bezierCurveTo(
      w * 0.40, h * 0.045,
      w * 0.46, h * 0.10,
      w * 0.5, h * 0.19
    );

    context.bezierCurveTo(
      w * 0.54, h * 0.10,
      w * 0.60, h * 0.045,
      w * 0.68, h * 0.04
    );

    context.bezierCurveTo(
      w * 0.83, h * 0.02,
      w * 0.96, h * 0.12,
      w * 0.96, h * 0.31
    );

    context.bezierCurveTo(
      w * 0.96, h * 0.62,
      w * 0.57, h * 0.89,
      w * 0.5, h * 0.96
    );

    context.closePath();
  }

  // =========================
  // CLEAR PENDING ANIMATIONS
  // =========================

  function clearGateTimers() {
    gateTimers.forEach(timer => clearTimeout(timer));
    gateTimers = [];
  }

  function addGateTimer(callback, delay) {
    const timer = setTimeout(callback, delay);
    gateTimers.push(timer);
  }

  // =========================
  // OPEN ME: GATE ANIMATION
  // =========================

  openButton.addEventListener("click", () => {
    if (gateAnimationRunning) return;

    gateAnimationRunning = true;
    clearGateTimers();

    gateIntro.classList.remove("opening", "finished");
    gateIntro.classList.add("active");
    gateIntro.setAttribute("aria-hidden", "false");
    gateIntro.removeAttribute("inert");

    addGateTimer(() => {
      gateIntro.classList.add("opening");
    }, 1800);

    addGateTimer(() => {
      landingPage.classList.add("hidden");
      datePage.classList.remove("hidden");

      requestAnimationFrame(() => {
        setupScratchCard();
      });

      updateCountdown();

      gateIntro.classList.add("finished");
      gateIntro.setAttribute("aria-hidden", "true");
      gateIntro.setAttribute("inert", "");

      addGateTimer(() => {
        gateIntro.classList.remove(
          "active",
          "opening",
          "finished"
        );

        gateAnimationRunning = false;
      }, 750);
    }, 5000);
  });

  // =========================
  // BACK TO LANDING PAGE
  // =========================

  backButton.addEventListener("click", () => {
    clearGateTimers();

    datePage.classList.add("hidden");
    landingPage.classList.remove("hidden");

    gateIntro.classList.remove(
      "active",
      "opening",
      "finished"
    );

    gateIntro.setAttribute("aria-hidden", "true");
    gateIntro.setAttribute("inert", "");

    gateAnimationRunning = false;
    isScratching = false;
  });

  // =========================
  // HEART SCRATCH CARD SETUP
  // =========================

  function setupScratchCard() {
    const rect = canvas.getBoundingClientRect();

    if (!rect.width || !rect.height) return;

    const pixelRatio = window.devicePixelRatio || 1;

    canvas.width = Math.round(rect.width * pixelRatio);
    canvas.height = Math.round(rect.height * pixelRatio);

    // Draw in CSS pixel coordinates
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.globalCompositeOperation = "source-over";
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Draw ONLY a smooth heart-shaped coating
    ctx.save();
    traceHeart(ctx, rect.width, rect.height);

    ctx.fillStyle = "#cbd1bd";
    ctx.fill();

    ctx.clip();

    // Text on the scratch coating
    ctx.fillStyle = "#56634b";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.font = "12px Arial";
    ctx.fillText(
      "A LITTLE SURPRISE",
      rect.width / 2,
      rect.height * 0.42
    );

    ctx.font = "italic 22px Georgia";
    ctx.fillText(
      "Scratch to reveal",
      rect.width / 2,
      rect.height * 0.52
    );

    ctx.font = "22px Georgia";
    ctx.fillText(
      "♡",
      rect.width / 2,
      rect.height * 0.62
    );

    ctx.restore();

    isScratching = false;
    isRevealed = false;
    canvas.style.display = "block";
    canvas.style.pointerEvents = "auto";
  }

  // =========================
  // SCRATCH INTERACTION
  // =========================

  function scratch(event) {
    if (!isScratching || isRevealed) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Erase the coating in a circular brush
    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  canvas.addEventListener("pointerdown", event => {
    if (isRevealed) return;

    isScratching = true;

    if (canvas.setPointerCapture) {
      canvas.setPointerCapture(event.pointerId);
    }

    scratch(event);
  });

  canvas.addEventListener("pointermove", scratch);

  function stopScratching() {
    if (!isScratching) return;

    isScratching = false;
    checkScratchProgress();
  }

  canvas.addEventListener("pointerup", stopScratching);
  canvas.addEventListener("pointercancel", stopScratching);
  canvas.addEventListener("lostpointercapture", stopScratching);

  // =========================
  // CHECK SCRATCH PROGRESS
  // Count only pixels inside the heart
  // =========================

  function checkScratchProgress() {
    if (isRevealed) return;

    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const pixelRatio = window.devicePixelRatio || 1;
    const pixels = ctx.getImageData(
      0, 0, canvas.width, canvas.height
    ).data;

    let heartPixels = 0;
    let erasedPixels = 0;

    // Sample the canvas for performance
    for (let y = 2; y < rect.height; y += 5) {
      for (let x = 2; x < rect.width; x += 5) {
        const px = Math.round(x * pixelRatio);
        const py = Math.round(y * pixelRatio);

        // Test whether this point belongs to the heart
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        traceHeart(ctx, canvas.width, canvas.height);

        const inside = ctx.isPointInPath(px, py);
        ctx.restore();

        if (!inside) continue;

        const index = (py * canvas.width + px) * 4 + 3;

        heartPixels++;

        if (pixels[index] < 128) {
          erasedPixels++;
        }
      }
    }

    const scratchedPercent = heartPixels
      ? erasedPixels / heartPixels
      : 0;

    // Reveal the full invitation after 35% is scratched
    if (scratchedPercent >= 0.35) {
      isRevealed = true;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      canvas.style.display = "none";
      canvas.style.pointerEvents = "none";
    }
  }

  // =========================
  // LIVE WEDDING COUNTDOWN
  // =========================

  function updateCountdown() {
    const countdown = document.getElementById("countdown");

    const difference =
      weddingDate.getTime() - new Date().getTime();

    if (difference <= 0) {
      countdown.innerHTML =
        "<p>Today is the special day! ♡</p>";

      if (countdownInterval !== null) {
        clearInterval(countdownInterval);
        countdownInterval = null;
      }

      return;
    }

    const days = Math.floor(
      difference / (1000 * 60 * 60 * 24)
    );

    const hours = Math.floor(
      (difference / (1000 * 60 * 60)) % 24
    );

    const minutes = Math.floor(
      (difference / (1000 * 60)) % 60
    );

    const seconds = Math.floor(
      (difference / 1000) % 60
    );

    document.getElementById("days").textContent =
      String(days).padStart(3, "0");

    document.getElementById("hours").textContent =
      String(hours).padStart(2, "0");

    document.getElementById("minutes").textContent =
      String(minutes).padStart(2, "0");

    document.getElementById("seconds").textContent =
      String(seconds).padStart(2, "0");
  }

  // Start countdown
  updateCountdown();
  countdownInterval = setInterval(updateCountdown, 1000);

  // Rebuild the coating when the page is resized
  window.addEventListener("resize", () => {
    if (!datePage.classList.contains("hidden") && !isRevealed) {
      setupScratchCard();
    }
  });
});
