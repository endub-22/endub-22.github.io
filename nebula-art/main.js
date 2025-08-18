/* main.js - coordinate sketch, whispers, and story */
"use strict";

import {
  setWhispersOverlay,
  setWhispersEnabled,
  getGUI,
  getPaletteName
} from "./sketch.js";

const $switch = document.getElementById("mode-switch");
const $storyUI = document.getElementById("story-ui");

let storyEngine = null;
let whispersLoaded = false;

function waitForGUI() {
  return new Promise(resolve => {
    const check = () => {
      const g = getGUI();
      if (g) resolve(g); else requestAnimationFrame(check);
    };
    check();
  });
}

async function startWhispers() {
  $storyUI.hidden = true;
  setWhispersEnabled(true);
  if (!whispersLoaded) {
    const mod = await import("./whispers.js");
    const gui = await waitForGUI();
    const overlay = mod.createWhispers(gui, getPaletteName);
    setWhispersOverlay(overlay);
    whispersLoaded = true;
  }
}

async function startStory() {
  $storyUI.hidden = false;
  setWhispersEnabled(false);
  if (!storyEngine) {
    await import("./story.js");
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

$switch.addEventListener("click", e => {
  const btn = e.target.closest("button[data-mode]");
  if (!btn) return;
  setMode(btn.dataset.mode);
});

// Hotkey: T toggles modes
window.addEventListener("keydown", e => {
  if (e.key.toLowerCase() === "t" && !e.altKey && !e.ctrlKey && !e.metaKey) {
    const current = localStorage.getItem("nebula_mode") || "story";
    setMode(current === "whispers" ? "story" : "whispers");
  }
});

const preferred = localStorage.getItem("nebula_mode") || "story";
setMode(preferred);

