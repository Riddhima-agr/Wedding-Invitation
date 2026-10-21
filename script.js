
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

  // Wedding date: 20 November 2027, 6:00 PM local time
  const weddingDate = new Date(2026, 10, 24, 18, 0, 0);

  let gateAnimationRunning = false;
  let isScratching = false;
  let isRevealed = false;
  let countdownInterval = null;
  let gateTimers = [];

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

    // Prepare the gate overlay
    gateIntro.classList.remove("opening", "finished");
    gateIntro.classList.add("active");
    gateIntro.setAttribute("aria-hidden", "false");
    gateIntro.removeAttribute("inert");

    // Show the invitation message first.
    // The gate image remains closed in front of the message.
    addGateTimer(() => {
      gateIntro.classList.add("opening");
    }, 1800);

    // After the doors open, show the date page
    addGateTimer(() => {
      landingPage.classList.add("hidden");
      datePage.classList.remove("hidden");

      setupScratchCard();
      updateCountdown();

      // Fade away the gate overlay
      gateIntro.classList.add("finished");
      gateIntro.setAttribute("aria-hidden", "true");
      gateIntro.setAttribute("inert", "");

      // Allow the CSS fade-out to finish
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
  });

  // =========================
  // SCRATCH CARD SETUP
  // =========================

  function setupScratchCard() {
    const rect = canvas.getBoundingClientRect();

    if (!rect.width || !rect.height) return;

    const pixelRatio = window.devicePixelRatio || 1;

    canvas.width = Math.round(rect.width * pixelRatio);
    canvas.height = Math.round(rect.height * pixelRatio);

    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.globalCompositeOperation = "source-over";
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Sage-green scratch layer
    ctx.fillStyle = "#cbd1bd";
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Scratch card text
    ctx.fillStyle = "#56634b";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.font = "12px Arial";
    ctx.fillText(
      "A LITTLE SURPRISE",
      rect.width / 2,
      rect.height / 2 - 22
    );

    ctx.font = "italic 23px Georgia";
    ctx.fillText(
      "Scratch to reveal",
      rect.width / 2,
      rect.height / 2 + 5
    );

    ctx.font = "20px Georgia";
    ctx.fillText(
      "♡",
      rect.width / 2,
      rect.height / 2 + 37
    );

    isScratching = false;
    isRevealed = false;
    canvas.style.display = "block";
  }

  // =========================
  // SCRATCH INTERACTION
  // =========================

  function scratch(event) {
    if (!isScratching || isRevealed) return;

    const rect = canvas.getBoundingClientRect();

    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fill();
  }

  canvas.addEventListener("pointerdown", event => {
    if (isRevealed) return;

    isScratching = true;
    canvas.setPointerCapture(event.pointerId);
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

  // Reveal date after enough of the scratch layer is removed
  function checkScratchProgress() {
    if (isRevealed) return;

    const imageData = ctx.getImageData(
      0,
      0,
      canvas.width,
      canvas.height
    );

    const pixels = imageData.data;
    let transparentPixels = 0;
    let checkedPixels = 0;

    // Sample pixels for performance
    for (let i = 3; i < pixels.length; i += 16) {
      checkedPixels++;

      if (pixels[i] < 128) {
        transparentPixels++;
      }
    }

    const scratchedPercent = checkedPixels
      ? transparentPixels / checkedPixels
      : 0;

    if (scratchedPercent > 0.35) {
      isRevealed = true;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      canvas.style.display = "none";
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
});
