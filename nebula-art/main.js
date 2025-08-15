/* main.js - Mode switch between Whispers and Story */
(function () {
  "use strict";

  const $switch = document.getElementById("mode-switch");
  const $storyUI = document.getElementById("story-ui");
  const $canvasHolder = document.getElementById("sketch-container");

  let storyEngine = null;

  function tryNoLoop(){ try { typeof noLoop === "function" && noLoop(); } catch {} }
  function tryLoop(){   try { typeof loop   === "function" && loop();   } catch {} }

  function startWhispers() {
    $storyUI.hidden = true;
    $canvasHolder.style.pointerEvents = "auto";
    tryLoop();  // resume p5 global draw if present
  }

  function startStory() {
    $canvasHolder.style.pointerEvents = "none";
    tryNoLoop(); // pause p5 global draw if present
    $storyUI.hidden = false;

    if (!storyEngine) {
      storyEngine = window.NebulaStory.quickBind({
        titleId: "story-title",
        bodyId: "story-body",
        choicesId: "story-choices",
        endingIdEl: "story-ending",
        pathId: "story-path",
        onChoiceSound: null
      });
    } else {
      storyEngine.reset();
    }
  }

  function setMode(mode) {
    const btns = $switch.querySelectorAll("button[data-mode]");
    btns.forEach(b => {
      const active = b.dataset.mode === mode;
      b.classList.toggle("active", active);
      b.setAttribute("aria-pressed", String(active));
    });
    localStorage.setItem("nebula_mode", mode);
    if (mode === "story") startStory(); else startWhispers();
  }

  $switch.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-mode]");
    if (!btn) return;
    setMode(btn.dataset.mode);
  });

  // Hotkey T to toggle
  window.addEventListener("keydown", (e) => {
    if (e.key.toLowerCase() === "t" && !e.altKey && !e.ctrlKey && !e.metaKey) {
      const current = localStorage.getItem("nebula_mode") || "whispers";
      setMode(current === "whispers" ? "story" : "whispers");
    }
  });

  const preferred = localStorage.getItem("nebula_mode") || "whispers";
  setMode(preferred);
})();
