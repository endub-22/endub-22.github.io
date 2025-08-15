/* story.js - Whispers from the Nebula: CYOA core */
(function (global) {
  "use strict";

  const nodes = [
    { id:1, title:"The Echo Gate",
      text:"A ring of cold light waits. A whisper on glass asks, \"Do you cross by voice or by listening?\"",
      choices:[ { key:"A", label:"Step through", whisper:"Answer with motion." },
                { key:"B", label:"Listen longer", whisper:"Answer with patience." } ] },
    { id:2, title:"The Glass River",
      text:"Reflections blink out then return. The current hums in a tuning you almost remember.",
      choices:[ { key:"A", label:"Cross the current", whisper:"Trust your footing." },
                { key:"B", label:"Follow the bank", whisper:"Trace for patterns." } ] },
    { id:3, title:"The Archive of Motes",
      text:"Dust lights assemble into living letters when you breathe.",
      choices:[ { key:"A", label:"Read the sigils", whisper:"Let meaning settle." },
                { key:"B", label:"Blow the dust away", whisper:"Keep only what stays." } ] },
    { id:4, title:"The Split Star",
      text:"A cleaved star offers routes and secrets.",
      choices:[ { key:"A", label:"Ask for a guide", whisper:"Accept a companion frequency." },
                { key:"B", label:"Go alone", whisper:"Keep your signal single." } ] },
    { id:5, title:"The Human Frequency",
      text:"Silence answers with your pulse. The final whisper is your own.",
      choices:[ { key:"A", label:"Speak your name", whisper:"Declare presence." },
                { key:"B", label:"Hold your breath", whisper:"Dissolve into listening." } ] },
  ];

  const endings = {
    E1:{ title:"Drifter's Return", text:"You circle home without proof, only a new quiet that fits behind your ribs. The nebula signed you.", whisper:"Some maps live in lungs." },
    E2:{ title:"Signal in the Shallows", text:"A faint tone nests in your pocket. You stop fearing the pause between thoughts.", whisper:"The gap is a doorway, not a loss." },
    E3:{ title:"Archive Key", text:"Three sigils never smudge. Ordinary doors open with strange kindness.", whisper:"Write gently, the letters are alive." },
    E4:{ title:"Cartographer of Silence", text:"You measure quiet by how far it carries you. You listen like a deep lake.", whisper:"Depth is not distance." },
    E5:{ title:"River Custodian", text:"You know where the current hides its shoals. Others cross because you point without pushing.", whisper:"Guidance is a soft verb." },
    E6:{ title:"Star-bond", text:"A companion frequency finishes your sentences in light. Alone never quite means alone.", whisper:"Two notes, one chord." },
    E7:{ title:"The Door Remembers", text:"Total commitment flips the hinge. The gate opens on sight.", whisper:"All in, and the world answers." },
    E8:{ title:"Between Heartbeats", text:"You learn syncopation. Step, still, speak, hush. The nebula smiles off beat.", whisper:"Life is not 4-on-the-floor." },
    E9:{ title:"Lumen Bearer", text:"You begin and end in voice. The city looks brighter because you do.", whisper:"Carry light without burning." },
    E10:{ title:"Listener's Crown", text:"You begin and end in quiet. People lean in when you say nothing.", whisper:"Silence is a tool, not a tomb." }
  };

  function endingId(path) {
    const codes = String(path||"").toUpperCase().replace(/[^AB]/g,"");
    if (codes.length !== 5) throw new Error("Path must be exactly 5 choices, each A or B.");
    const aCount = (codes.match(/A/g) || []).length;

    if (codes === "BBBBB" || codes === "AAAAA") return "E7";           // total commitment
    if (codes === "ABABA" || codes === "BABAB") return "E8";           // alternating cadence
    if (codes[0] === "A" && codes[4] === "A" && aCount >= 4) return "E9";
    if (codes[0] === "B" && codes[4] === "B" && aCount <= 1) return "E10";
    if (aCount === 4 && codes[3] === "A" && codes[4] === "A") return "E6";

    switch (aCount) {
      case 0: return "E1";
      case 1: return "E2";
      case 2: return "E3";
      case 3: return "E4";
      case 4: return "E5";
      case 5: return "E6";
      default: return "E1";
    }
  }

  function createStoryEngine(opts) {
    const onRenderNode    = opts && opts.onRenderNode    ? opts.onRenderNode    : function(){};
    const onRenderEnding  = opts && opts.onRenderEnding  ? opts.onRenderEnding  : function(){};
    const onChoice        = opts && opts.onChoice        ? opts.onChoice        : function(){};
    const onReset         = opts && opts.onReset         ? opts.onReset         : function(){};

    let step = 0;
    let path = "";

    function start(){ step = 0; path = ""; onRenderNode(nodes[step], step, path); }
    function choose(key){
      const k = String(key||"").toUpperCase();
      if (k !== "A" && k !== "B") throw new Error("Choice must be 'A' or 'B'.");
      if (step >= nodes.length) return;
      path += k; onChoice(k, step, path); step += 1;

      if (step < nodes.length) onRenderNode(nodes[step], step, path);
      else {
        const id = endingId(path);
        const end = endings[id];
        onRenderEnding(end, id, path);
      }
    }
    function reset(){ step = 0; path = ""; onReset(); onRenderNode(nodes[0], 0, ""); }
    function getState(){ return { step, path, nodesCount: nodes.length }; }

    return {
      start, choose, reset, getState,
      getPath: () => path, getStep: () => step,
      nodes, endings, endingId,
      computeEndingForPath: (p) => { const id = endingId(p); return { id, ending: endings[id] }; }
    };
  }

  // Public API
  global.NebulaStory = { nodes, endings, endingId, createStoryEngine };

  // Quick DOM binding
  function quickBind(cfg){
    const {
      titleId="story-title", bodyId="story-body", choicesId="story-choices",
      endingIdEl="story-ending", pathId="story-path", onChoiceSound
    } = cfg || {};
    const $title = document.getElementById(titleId);
    const $body = document.getElementById(bodyId);
    const $choices = document.getElementById(choicesId);
    const $ending = document.getElementById(endingIdEl);
    const $path = document.getElementById(pathId);

    const engine = createStoryEngine({
      onRenderNode: (node, step, path) => {
        if ($ending) $ending.textContent = "";
        if ($title) $title.textContent = node.title;
        if ($body) $body.textContent = node.text;
        if ($path) $path.textContent = path;
        if ($choices) {
          $choices.innerHTML = "";
          node.choices.forEach(c => {
            const btn = document.createElement("button");
            btn.className = `btn choice btn--${c.key}`;
            btn.textContent = c.label;
            btn.title = c.whisper;
            btn.onclick = () => {
              btn.classList.add("picked");
              setTimeout(() => btn.classList.remove("picked"), 350);
              if (typeof onChoiceSound === "function") onChoiceSound(c.key);
              engine.choose(c.key);
            };
            $choices.appendChild(btn);
          });
          // focus first choice for keyboard users
          const first = $choices.querySelector(".choice");
          if (first) first.focus();
        }
      },
      onRenderEnding: (end, id, fullPath) => {
        if ($title) $title.textContent = end.title;
        if ($body) $body.textContent = end.text;
        if ($path) $path.textContent = fullPath + " → " + id;
        if ($choices) {
          $choices.innerHTML = "";
          const hint = document.createElement("div");
          hint.className = "whisper";
          hint.textContent = end.whisper;
          $choices.appendChild(hint);

          const again = document.createElement("button");
          again.className = "btn again";
          again.textContent = "Try a different cadence";
          again.onclick = () => engine.reset();
          $choices.appendChild(again);
        }
        if ($ending) $ending.textContent = id;
      }
    });

    engine.start();
    return engine;
  }

  global.NebulaStory.quickBind = quickBind;

})(typeof window !== "undefined" ? window : this);
