/* main.js - keep sketch running; center Story UI */
(function () {
  "use strict";

  const $switch = document.getElementById("mode-switch");
  const $storyUI = document.getElementById("story-ui");

  let storyEngine = null;

  function startWhispers() {
    $storyUI.hidden = true;
    // sketch keeps running underneath
  }

  function startStory() {
    $storyUI.hidden = false;
    // sketch keeps running underneath
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

  // Hotkey: T toggles modes
  window.addEventListener("keydown", (e) => {
    if (e.key.toLowerCase() === "t" && !e.altKey && !e.ctrlKey && !e.metaKey) {
      const current = localStorage.getItem("nebula_mode") || "whispers";
      setMode(current === "whispers" ? "story" : "whispers");
    }
  });

  const preferred = localStorage.getItem("nebula_mode") || "whispers";
  setMode(preferred);
})();
