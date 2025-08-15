/* story.js - Whispers from the Nebula: CYOA core
   Drop this in your page with:
   <script src="story.js"></script>
   Then wire it up with your UI.
*/
(function (global) {
  "use strict";

  // ---------- Story graph ----------
  const nodes = [
    {
      id: 1,
      title: "The Echo Gate",
      text: "A ring of cold light waits. A whisper on glass asks, \"Do you cross by voice or by listening?\"",
      choices: [
        { key: "A", label: "Step through", whisper: "Answer with motion." },
        { key: "B", label: "Listen longer", whisper: "Answer with patience." }
      ]
    },
    {
      id: 2,
      title: "The Glass River",
      text: "Reflections blink out then return. The current hums in a tuning you almost remember.",
      choices: [
        { key: "A", label: "Cross the current", whisper: "Trust your footing." },
        { key: "B", label: "Follow the bank", whisper: "Trace for patterns." }
      ]
    },
    {
      id: 3,
      title: "The Archive of Motes",
      text: "Dust lights assemble into living letters when you breathe.",
      choices: [
        { key: "A", label: "Read the sigils", whisper: "Let meaning settle." },
        { key: "B", label: "Blow the dust away", whisper: "Keep only what stays." }
      ]
    },
    {
      id: 4,
      title: "The Split Star",
      text: "A cleaved star offers routes and secrets.",
      choices: [
        { key: "A", label: "Ask for a guide", whisper: "Accept a companion frequency." },
        { key: "B", label: "Go alone", whisper: "Keep your signal single." }
      ]
    },
    {
      id: 5,
      title: "The Human Frequency",
      text: "Silence answers with your pulse. The final whisper is your own.",
      choices: [
        { key: "A", label: "Speak your name", whisper: "Declare presence." },
        { key: "B", label: "Hold your breath", whisper: "Dissolve into listening." }
      ]
    }
  ];

  // Ten consolidated endings
  const endings = {
    E1:  { title: "Drifter's Return", text: "You circle home without proof, only a new quiet that fits behind your ribs. The nebula signed you.", whisper: "Some maps live in lungs." },
    E2:  { title: "Signal in the Shallows", text: "A faint tone nests in your pocket. You stop fearing the pause between thoughts.", whisper: "The gap is a doorway, not a loss." },
    E3:  { title: "Archive Key", text: "Three sigils never smudge. Ordinary doors open with strange kindness.", whisper: "Write gently, the letters are alive." },
    E4:  { title: "Cartographer of Silence", text: "You measure quiet by how far it carries you. You listen like a deep lake.", whisper: "Depth is not distance." },
    E5:  { title: "River Custodian", text: "You know where the current hides its shoals. Others cross because you point without pushing.", whisper: "Guidance is a soft verb." },
    E6:  { title: "Star-bond", text: "A companion frequency finishes your sentences in light. Alone never quite means alone.", whisper: "Two notes, one chord." },
    E7:  { title: "The Door Remembers", text: "Total commitment flips the hinge. The gate opens on sight.", whisper: "All in, and the world answers." },
    E8:  { title: "Between Heartbeats", text: "You learn syncopation. Step, still, speak, hush. The nebula smiles off beat.", whisper: "Life is not 4-on-the-floor." },
    E9:  { title: "Lumen Bearer", text: "You begin and end in voice. The city looks brighter because you do.", whisper: "Carry light without burning." },
    E10: { title: "Listener's Crown", text: "You begin and end in quiet. People lean in when you say nothing.", whisper: "Silence is a tool, not a tomb." }
  };

  // ---------- Path -> ending consolidation ----------
  // Path is a 5-letter string of A or B, like "AABBA".
  // Consolidation rules:
  // - BBBBB -> E7 (total quiet)
  // - AAAAA -> E7 (total motion)  [special total-commitment door]
  // - ABABA or BABAB -> E8 (alternating cadence)
  // - Start and end A, with 4 or 5 total As -> E9
  // - Start and end B, with 0 or 1 total As -> E10
  // - Special star-bond: 4 As where Node 4 and Node 5 are A -> E6
  // - Otherwise base by A-count: 0->E1, 1->E2, 2->E3, 3->E4, 4->E5, 5->E6
  function endingId(path) {
    const codes = String(path || "").toUpperCase().replace(/[^AB]/g, "");
    if (codes.length !== 5) throw new Error("Path must be exactly 5 choices, each A or B.");
    const aCount = (codes.match(/A/g) || []).length;

    // Total commitment door
    if (codes === "BBBBB" || codes === "AAAAA") return "E7";

    // Alternating cadence
    if (codes === "ABABA" || codes === "BABAB") return "E8";

    // Voice at begin and end, strongly A
    if (codes[0] === "A" && codes[4] === "A" && aCount >= 4) return "E9";

    // Quiet at begin and end, almost all B
    if (codes[0] === "B" && codes[4] === "B" && aCount <= 1) return "E10";

    // Star-bond nuance: 4 As and last two are A
    if (aCount === 4 && codes[3] === "A" && codes[4] === "A") return "E6";

    // Base mapping by A-count
    switch (aCount) {
      case 0: return "E1";
      case 1: return "E2";
      case 2: return "E3";
      case 3: return "E4";
      case 4: return "E5";
      case 5: return "E6"; // will not hit due to AAAAA special above, kept for completeness
      default: return "E1";
    }
  }

  // ---------- Engine ----------
  /**
   * @typedef {Object} RenderNode
   * @property {number} id
   * @property {string} title
   * @property {string} text
   * @property {{key:"A"|"B",label:string,whisper:string}[]} choices
   */

  /**
   * @typedef {Object} Ending
   * @property {string} title
   * @property {string} text
   * @property {string} whisper
   */

  /**
   * Create a story engine.
   * @param {Object} opts
   * @param {(node: RenderNode, step: number, path: string) => void} opts.onRenderNode
   * @param {(ending: Ending, endingId: string, fullPath: string) => void} opts.onRenderEnding
   * @param {(choiceKey: "A"|"B", step: number, path: string) => void} [opts.onChoice]
   * @param {() => void} [opts.onReset]
   */
  function createStoryEngine(opts) {
    const onRenderNode = opts && opts.onRenderNode ? opts.onRenderNode : function(){};
    const onRenderEnding = opts && opts.onRenderEnding ? opts.onRenderEnding : function(){};
    const onChoice = opts && opts.onChoice ? opts.onChoice : function(){};
    const onReset = opts && opts.onReset ? opts.onReset : function(){};

    let step = 0;         // 0..5, 5 means show ending
    let path = "";        // string of choices like "ABABA"

    function start() {
      step = 0;
      path = "";
      onRenderNode(nodes[step], step, path);
    }

    function choose(key) {
      const k = String(key || "").toUpperCase();
      if (k !== "A" && k !== "B") throw new Error("Choice must be 'A' or 'B'.");
      if (step >= nodes.length) return; // already at ending

      path += k;
      onChoice(k, step, path);
      step += 1;

      if (step < nodes.length) {
        onRenderNode(nodes[step], step, path);
      } else {
        const id = endingId(path);
        const end = endings[id];
        onRenderEnding(end, id, path);
      }
    }

    function reset() {
      step = 0;
      path = "";
      onReset();
      onRenderNode(nodes[0], 0, "");
    }

    function getState() {
      return { step, path, nodesCount: nodes.length };
    }

    function computeEndingForPath(p) {
      const id = endingId(p);
      return { id, ending: endings[id] };
    }

    return {
      start,
      choose,
      reset,
      getState,
      getPath: () => path,
      getStep: () => step,
      nodes,
      endings,
      endingId,
      computeEndingForPath
    };
  }

  // ---------- Public API ----------
  global.NebulaStory = {
    nodes,
    endings,
    endingId,
    createStoryEngine
  };

  // ---------- Optional quick DOM binding helper ----------
  // Call NebulaStory.quickBind({ ...ids }) to wire into simple HTML
  function quickBind(cfg) {
    const {
      titleId = "story-title",
      bodyId = "story-body",
      choicesId = "story-choices",
      endingIdEl = "story-ending",
      pathId = "story-path",
      onChoiceSound, // optional function(key) to play SFX
      textDefaults  // optional styling overrides
    } = cfg || {};

    const $title = document.getElementById(titleId);
    const $body = document.getElementById(bodyId);
    const $choices = document.getElementById(choicesId);
    const $ending = document.getElementById(endingIdEl);
    const $path = document.getElementById(pathId);
    const $container = $title ? $title.parentElement : null;

    // apply text defaults if provided
    if (textDefaults) {
      const { textFont, textSize, textColor, textStyle, textShadow, textBoxWidth } = textDefaults;
      const targets = [$title, $body, $choices, $ending, $path];
      targets.forEach(el => {
        if (!el) return;
        if (textFont) el.style.fontFamily = textFont;
        if (textSize) el.style.fontSize = textSize + 'px';
        if (textColor) el.style.color = textColor;
        if (textStyle === 'Italic') {
          el.style.fontStyle = 'italic';
          el.style.fontWeight = 'normal';
        } else if (textStyle === 'Bold') {
          el.style.fontWeight = 'bold';
          el.style.fontStyle = 'normal';
        } else {
          el.style.fontStyle = 'normal';
          el.style.fontWeight = 'normal';
        }
        el.style.textShadow = textShadow ? '2px 2px 4px rgba(0,0,0,0.6)' : 'none';
      });
      if ($container && textBoxWidth) {
        $container.style.maxWidth = (textBoxWidth * 100) + '%';
      }
    }

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
  btn.className = `btn choice btn--${c.key}`;  // <-- A or B accent
  btn.textContent = c.label;
  btn.title = c.whisper;
  btn.onclick = () => {
    // mark picked for a moment
    btn.classList.add("picked");
    setTimeout(() => btn.classList.remove("picked"), 350);
    if (typeof onChoiceSound === "function") onChoiceSound(c.key);
    engine.choose(c.key);
  };
  $choices.appendChild(btn);
});

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
          again.className = "again";
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

/* Example usage in your HTML:
   <div id="story-title"></div>
   <div id="story-body"></div>
   <div id="story-choices"></div>
   <div id="story-path"></div>
   <script src="story.js"></script>
   <script>
     // Optional: simple chime for A and exhale for B
     const engine = NebulaStory.quickBind({
       onChoiceSound: (k) => {
         // hook your audio here
       }
     });
     // Or control manually:
     // const engine = NebulaStory.createStoryEngine({...});
     // engine.start(); engine.choose("A");
   </script>
*/
