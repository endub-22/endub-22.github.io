// whispers.js - a tiny overlay-text module with fades + personalization
export function createWhispers(gui, getPaletteName) {
  // params local to this module
  const params = {
    textEnabled:  true,
    textSize:     28,
    textColor:    '#FFFFFF',
    textShadow:   true,
    textFadeInMs: 2000,
    textHoldMs:   4500,
    textFadeOutMs:2000,
    useGeolocation: false
  };

  // default templates with tokens
  const DEFAULT_TEMPLATES = [
    "Breathe, {name}. The {partOfDay} is kind.",
    "Hello from {tz}. It is {time}.",
    "It is {weekday}. Tiny steps will do.",
    "Signals from {browser} received. I see you.",
    "Relax your shoulders. Unclench your jaw.",
    "At lat {lat}, lon {lon} the sky drifts with you.",
    "Palette {palette} engaged.",
    "Drink some water. Then some more.",
    "Inhale four, exhale six. I will wait.",
    "You are here, and that is enough."
  ];

  // personalization context
  const ctx = {
    name: localStorage.getItem('viewerName') || 'friend',
    tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
    lat: null,
    lon: null,
    browser: detectBrowser()
  };

  // state
  const state = {
    templates: [...DEFAULT_TEMPLATES],
    current: '',
    phase: 'idle',      // 'fadeIn' | 'hold' | 'fadeOut'
    elapsed: 0,
    lastIndex: -1
  };

  // ---------- GUI ----------
  const folder = gui.addFolder('Text');
  folder.add(params, 'textEnabled').name('Show Text');
  folder.addColor(params, 'textColor').name('Text Color');
  folder.add(params, 'textSize', 14, 72, 1).name('Text Size');
  folder.add(params, 'textFadeInMs', 300, 5000, 50).name('Fade In ms');
  folder.add(params, 'textHoldMs',   500, 8000, 50).name('Hold ms');
  folder.add(params, 'textFadeOutMs',300, 5000, 50).name('Fade Out ms');
  folder.add(params, 'textShadow').name('Shadow');
  folder.add(params, 'useGeolocation').name('Use Geolocation')
    .onChange(v => { if (v) requestGeo(); });

  const actions = {
    setName: () => {
      const v = prompt('What should I call you?', ctx.name || '');
      if (v) { ctx.name = v; localStorage.setItem('viewerName', v); }
    },
    nextNow: () => nextMessage()
  };
  folder.add(actions, 'setName').name('Set Viewer Name');
  folder.add(actions, 'nextNow').name('Next Message Now');
  folder.open();

  // kick off the first line
  nextMessage();

  // ---------- public API ----------
  return {
    update(deltaMs) {
      if (!params.textEnabled) return;
      state.elapsed += deltaMs;
    },
    draw() {
      if (!params.textEnabled || !state.current) return;

      // compute alpha and phase transitions
      const fi = params.textFadeInMs, fh = params.textHoldMs, fo = params.textFadeOutMs;
      let a = 0;
      if (state.phase === 'fadeIn') {
        a = clamp(state.elapsed / fi, 0, 1);
        if (state.elapsed >= fi) { state.phase = 'hold'; state.elapsed = 0; a = 1; }
      } else if (state.phase === 'hold') {
        a = 1;
        if (state.elapsed >= fh) { state.phase = 'fadeOut'; state.elapsed = 0; }
      } else if (state.phase === 'fadeOut') {
        a = 1 - clamp(state.elapsed / fo, 0, 1);
        if (state.elapsed >= fo) { nextMessage(); return; }
      }

      // render bottom-center
      const c = color(params.textColor);
      const r = red(c), g = green(c), b = blue(c);
      const pad = 40, x = width / 2, y = height - pad;

      push();
      textAlign(CENTER, BOTTOM);
      textSize(params.textSize);
      colorMode(RGB, 255);

      if (params.textShadow) {
        fill(0, 0, 0, 160 * a);
        text(state.current, x + 2, y + 2);
      }
      fill(r, g, b, 255 * a);
      text(state.current, x, y);
      pop();
    },
    setTemplates(list) {
      state.templates = Array.isArray(list) && list.length ? list.slice() : [...DEFAULT_TEMPLATES];
      nextMessage();
    },
    addTemplate(t) {
      if (t && typeof t === 'string') state.templates.push(t);
    }
  };

  // ---------- helpers ----------
  function nextMessage() {
    let i;
    if (state.templates.length === 0) state.templates = [...DEFAULT_TEMPLATES];
    do { i = Math.floor(Math.random() * state.templates.length); } while (i === state.lastIndex && state.templates.length > 1);
    state.lastIndex = i;
    state.current = personalize(state.templates[i]);
    state.phase = 'fadeIn';
    state.elapsed = 0;
  }

  function personalize(tpl) {
    const n = nowBits();
    const map = {
      name: ctx.name,
      tz: ctx.tz,
      time: n.time,
      weekday: n.weekday,
      partOfDay: n.partOfDay,
      browser: ctx.browser,
      lat: ctx.lat != null ? ctx.lat.toFixed(2) : 'somewhere',
      lon: ctx.lon != null ? ctx.lon.toFixed(2) : 'nearby',
      palette: typeof getPaletteName === 'function' ? getPaletteName() : 'Unknown'
    };
    return tpl.replace(/\{(\w+)\}/g, (_, k) => map[k] ?? '');
  }

  function requestGeo() {
    if (!navigator.geolocation) { alert('Geolocation not supported'); return; }
    navigator.geolocation.getCurrentPosition(
      pos => { ctx.lat = pos.coords.latitude; ctx.lon = pos.coords.longitude; },
      err => console.warn('Geolocation denied or failed', err),
      { enableHighAccuracy: false, timeout: 5000 }
    );
  }

  function detectBrowser() {
    const ua = navigator.userAgent;
    if (ua.includes('Edg')) return 'Edge';
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    return 'a browser';
  }

  function nowBits() {
    const d = new Date();
    return {
      time: d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
      weekday: d.toLocaleDateString([], { weekday: 'long' }),
      partOfDay: (h => h<5?'night':h<12?'morning':h<18?'afternoon':'evening')(d.getHours())
    };
  }

  // HOISTED version fixes the error
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
}
