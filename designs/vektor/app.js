/* BlueKite - Vektor concept: interactions */
(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const RM = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isMobile = () => window.innerWidth <= 900;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const pad = (n, l = 2) => String(n).padStart(l, "0");
  const fmt = (n) => Math.round(n).toLocaleString("en-CA");

  /* in-view helper: callback(true/false) */
  function watch(el, cb, opts = {}) {
    if (!el) return;
    const io = new IntersectionObserver((es) => es.forEach((e) => cb(e.isIntersecting, e)), { threshold: opts.threshold ?? 0, rootMargin: opts.rootMargin ?? "0px" });
    io.observe(el);
    return io;
  }

  /* ---------- loader ---------- */
  const loader = $("#loader");
  const hideLoader = () => loader && loader.classList.add("done");
  setTimeout(hideLoader, RM ? 0 : 650);

  /* ---------- clock (Vancouver) ---------- */
  const tf = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Vancouver", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  const now = () => tf.format(new Date()).replace(/^24/, "00");
  function tick() { const t = now(); $("#clock").textContent = t; $("#fclock").textContent = t; }
  tick(); setInterval(tick, 1000);

  /* ---------- word blur headings ---------- */
  $$(".wb").forEach((h) => {
    let i = 0;
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const parts = n.textContent.split(/(\s+)/);
          const frag = document.createDocumentFragment();
          parts.forEach((p) => {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(" ")); return; }
            const s = document.createElement("span");
            s.className = "w"; s.textContent = p; s.style.transitionDelay = (i++ * 70) + "ms";
            frag.appendChild(s);
          });
          n.replaceWith(frag);
        }
      });
    };
    walk(h);
  });

  /* ---------- reveal ---------- */
  const rio = new IntersectionObserver((es) => {
    es.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const sibs = el.parentElement ? [...el.parentElement.children].filter((c) => c.classList.contains("rv")) : [];
      const idx = Math.max(0, sibs.indexOf(el));
      if (el.classList.contains("rv")) el.style.transitionDelay = Math.min(idx, 5) * 80 + "ms";
      el.classList.add("in");
      rio.unobserve(el);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
  $$(".rv, .wb").forEach((el) => (RM ? el.classList.add("in") : rio.observe(el)));

  /* ---------- counters ---------- */
  $$("[data-count]").forEach((el) => {
    const to = +el.dataset.count;
    if (RM || to === 0) return;
    el.textContent = "0";
    watch(el, (v) => {
      if (!v || el.dataset.done) return;
      el.dataset.done = 1;
      const t0 = performance.now(), d = 1400;
      const step = (t) => { const p = clamp((t - t0) / d, 0, 1); const e = 1 - Math.pow(1 - p, 3); el.textContent = Math.round(to * e); if (p < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    });
  });

  /* ---------- nav: crumb, active link, progress, burger ---------- */
  const secs = $$("[data-label]");
  const crumb = $("#crumb"), prog = $("#prog");
  const linkMap = { solutions: "solutions", process: "process", examples: "examples", plans: "plans", faq: "faq" };
  let lastLabel = "";
  function onScroll() {
    const y = window.scrollY;
    const h = document.documentElement.scrollHeight - window.innerHeight;
    prog.style.width = (h > 0 ? (y / h) * 100 : 0) + "%";
    let cur = secs[0];
    for (const s of secs) if (s.getBoundingClientRect().top <= 140) cur = s;
    const lab = cur.dataset.label;
    if (lab !== lastLabel) {
      lastLabel = lab;
      crumb.classList.add("sw");
      setTimeout(() => { crumb.textContent = lab; crumb.classList.remove("sw"); }, 160);
      $$(".links a").forEach((a) => a.classList.toggle("on", a.dataset.s === (linkMap[cur.id] || "")));
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  const burger = $("#burger");
  burger.addEventListener("click", () => { const o = document.body.classList.toggle("menu-open"); burger.setAttribute("aria-expanded", o); });
  $$("#mmenu a").forEach((a) => a.addEventListener("click", () => { document.body.classList.remove("menu-open"); burger.setAttribute("aria-expanded", false); }));

  /* ---------- marquee duplicate ---------- */
  const mq = $("#marq");
  if (mq) mq.innerHTML += mq.innerHTML;

  /* =========================================================
     HERO PIPELINE
     ========================================================= */
  (function pipeline() {
    const pb = $("#pbody"); if (!pb) return;
    const svg = $("#plines");
    const ins = $$(".pnode.in", pb), outs = $$(".pnode.out", pb);
    const core = $("#core"), alab = $("#alab"), steps = $$("#asteps span"), alat = $("#alat");
    const plog = $("#plog"), pcount = $("#pcount");
    for (let i = 0; i < 49; i++) core.appendChild(document.createElement("i"));
    const cells = [...core.children];
    const NS = "http://www.w3.org/2000/svg";
    let inPaths = [], outPaths = [], cx = 0, cy = 0;

    function layout() {
      const W = pb.clientWidth, H = pb.clientHeight, mob = W < 700;
      cx = W / 2; cy = mob ? H / 2 - 4 : H / 2 + 6;
      const ag = $("#agent"); ag.style.top = cy + "px";
      const pos = [];
      if (!mob) {
        ins.forEach((n, i) => { const x = 24, y = 60 + i * 92; n.style.left = x + "px"; n.style.top = y + "px"; pos.push(["in", x + 238, y + 28, cx - 76, cy]); });
        outs.forEach((n, i) => { const x = W - 24 - 238, y = 60 + i * 119.5; n.style.left = x + "px"; n.style.top = y + "px"; pos.push(["out", cx + 76, cy, x, y + 33]); });
      } else {
        const g = (W - 28 - 5 * 56) / 4;
        ins.forEach((n, i) => { const x = 14 + i * (56 + g), y = 52; n.style.left = x + "px"; n.style.top = y + "px"; pos.push(["in", x + 28, y + 56, cx, cy - 64]); });
        const g2 = (W - 28 - 4 * 56) / 3;
        outs.forEach((n, i) => { const x = 14 + i * (56 + g2), y = H - 130; n.style.left = x + "px"; n.style.top = y + "px"; pos.push(["out", cx, cy + 64, x + 28, y]); });
      }
      svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      svg.innerHTML = "";
      inPaths = []; outPaths = [];
      pos.forEach(([k, x1, y1, x2, y2]) => {
        const p = document.createElementNS(NS, "path");
        let d;
        if (!mob) { const dx = (x2 - x1) * 0.55; d = `M${x1},${y1} C${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`; }
        else { const dy = (y2 - y1) * 0.55; d = `M${x1},${y1} C${x1},${y1 + dy} ${x2},${y2 - dy} ${x2},${y2}`; }
        p.setAttribute("d", d); p.setAttribute("fill", "none"); p.setAttribute("stroke", "rgba(30,77,255,.32)"); p.setAttribute("stroke-dasharray", "2 4");
        svg.appendChild(p);
        const m = document.createElementNS(NS, "rect");
        const mx = k === "in" ? x1 : x2, my = k === "in" ? y1 : y2;
        m.setAttribute("x", mx - 3 + (k === "in" && !mob ? 7 : 0)); m.setAttribute("y", my - 3 + (mob && k === "in" ? 6 : 0) - (mob && k === "out" ? 9 : 0));
        if (!mob && k === "out") m.setAttribute("x", mx - 12);
        m.setAttribute("width", 6); m.setAttribute("height", 6); m.setAttribute("fill", k === "in" ? "#444" : "#1e4dff");
        svg.appendChild(m);
        (k === "in" ? inPaths : outPaths).push(p);
      });
      // ruler
      const r = $("#ruler");
      if (r) { r.innerHTML = ""; for (let x = 160; x < W; x += 160) { const s = document.createElement("span"); s.style.left = x + "px"; s.textContent = pad(x, 4); r.appendChild(s); } }
    }
    layout();
    let rt; window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(layout, 120); });

    // packets
    const pkts = [];
    function spawn(path, dur, blue, done) {
      const el = document.createElement("i"); el.className = "pkt" + (blue ? " b" : "");
      pb.appendChild(el);
      pkts.push({ path, len: path.getTotalLength(), t0: performance.now(), dur, el, done });
    }
    function frame(t) {
      for (let i = pkts.length - 1; i >= 0; i--) {
        const k = pkts[i]; const p = clamp((t - k.t0) / k.dur, 0, 1);
        const e = p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
        const pt = k.path.getPointAtLength(e * k.len);
        k.el.style.transform = `translate(${pt.x}px,${pt.y}px)`;
        if (p >= 1) { k.el.remove(); pkts.splice(i, 1); k.done && k.done(); }
      }
      if (running) requestAnimationFrame(frame);
    }
    const logs = [
      "New inquiry answered in 48s · approved by Dana → Outlook",
      "Retainer follow-up drafted · waiting for approval → Clio",
      "T4 chaser ready · 3 clients · waiting for partner → TaxDome",
      "Engagement letter unsigned 7 days · nudge drafted → DocuSign",
      "Seat mismatch · Cedar Dental 52 vs 48 · flagged → HaloPSA",
    ];
    const map = [0, 1, 2, 2, 3];
    const stepNames = ["Read", "Match", "Draft", "Approve"];
    let ci = 0, waiting = 4, running = false, cyc;
    function scramble(on) { cells.forEach((c) => { const r = Math.random(); c.className = on ? (r < .3 ? "b" : r < .42 ? "l" : "") : (r < .06 ? "b" : r < .2 ? "l" : ""); }); }
    scramble(false);
    function typeLog(text) {
      const full = `${now()} - ${text}`; let n = 0;
      clearInterval(plog._t);
      plog._t = setInterval(() => { n += 2; plog.textContent = full.slice(0, n); if (n >= full.length) clearInterval(plog._t); }, 18);
    }
    function cycle() {
      const i = ci % ins.length, o = map[i]; ci++;
      ins.forEach((n, j) => n.classList.toggle("on", j === i));
      spawn(inPaths[i], 1100, true, () => {
        const em = ins[i].querySelector("em"); em.textContent = pad(+em.textContent + 1, 4);
        let s = 0;
        alab.textContent = `Agent 0${(i % 3) + 1} · ${stepNames[0]}`;
        const st = setInterval(() => {
          steps.forEach((x, j) => x.classList.toggle("on", j === s));
          alab.textContent = `Agent 0${(i % 3) + 1} · ${stepNames[s]}`;
          scramble(true);
          s++;
          if (s > 3) {
            clearInterval(st);
            alat.textContent = "Drafted · waiting for approval";
            spawn(outPaths[o], 1100, true, () => {
              outs.forEach((n, j) => n.classList.toggle("on", j === o));
              const bar = outs[o].querySelector(".bar i"); bar.style.width = (35 + Math.random() * 60) + "%";
              const em2 = outs[o].querySelector("em"); em2.textContent = pad(+em2.textContent + 1, 4);
              waiting++; pcount.textContent = waiting;
              typeLog(logs[i]);
              scramble(false);
              const na = (waiting % 4) + 2;
              alat.textContent = `Waiting · ${na} approvals`;
            });
          }
        }, 260);
      });
      // ambient packet
      const r = Math.floor(Math.random() * inPaths.length);
      if (r !== i) spawn(inPaths[r], 2400, false);
    }
    watch($("#pipe"), (v) => {
      if (RM) return;
      if (v && !running) { running = true; requestAnimationFrame(frame); cycle(); cyc = setInterval(cycle, 2600); }
      else if (!v && running) { running = false; clearInterval(cyc); }
    });
    // cursor coords
    const xy = $("#xy");
    pb.addEventListener("mousemove", (e) => { const b = pb.getBoundingClientRect(); xy.textContent = `X ${pad(Math.round(e.clientX - b.left), 4)} · Y ${pad(Math.round(e.clientY - b.top), 4)}`; });
    pb.addEventListener("mouseleave", () => { xy.textContent = "X 0000 · Y 0000"; });
  })();

  /* =========================================================
     SOLUTIONS ACCORDION
     ========================================================= */
  (function acc() {
    const acs = $$("#acc .ac"); if (!acs.length) return;
    const DUR = 7000; let cur = 0, t, inView = false, flowT = [];
    function buildCn(ac) {
      const fl = $(".flow", ac); $$(".cn", fl).forEach((c) => c.remove());
      const fns = $$(".fn", fl), fb = fl.getBoundingClientRect();
      for (let i = 0; i < fns.length - 1; i++) {
        const a = $(".b", fns[i]).getBoundingClientRect(), b = $(".b", fns[i + 1]).getBoundingClientRect();
        const c = document.createElement("span"); c.className = "cn";
        c.style.left = (a.right - fb.left + 12) + "px"; c.style.width = Math.max(0, b.left - a.right - 24) + "px";
        c.style.top = (a.top - fb.top + a.height / 2) + "px";
        c.innerHTML = "<i></i>"; fl.appendChild(c);
      }
    }
    function runFlow(ac) {
      flowT.forEach(clearTimeout); flowT = [];
      const fns = $$(".flow .fn", ac);
      fns.forEach((f) => f.classList.remove("on", "done"));
      buildCn(ac);
      const cns = $$(".flow .cn", ac);
      fns.forEach((f, i) => {
        flowT.push(setTimeout(() => {
          fns.forEach((g, j) => { g.classList.toggle("on", j === i); g.classList.toggle("done", j < i); });
          if (cns[i]) { cns[i].classList.remove("go"); void cns[i].offsetWidth; flowT.push(setTimeout(() => cns[i].classList.add("go"), 500)); }
        }, RM ? 0 : 400 + i * 1500));
      });
    }
    function open(k, fromUser) {
      cur = k;
      acs.forEach((a, i) => a.classList.toggle("open", i === k));
      const ac = acs[k];
      setTimeout(() => runFlow(ac), isMobile() ? 50 : 650);
      const pbar = $(".pbar", ac);
      $$(".pbar").forEach((p) => p.classList.remove("run"));
      void pbar.offsetWidth;
      clearTimeout(t);
      if (!RM && inView && !isMobile()) { pbar.style.setProperty("--dur", DUR + "ms"); pbar.classList.add("run"); t = setTimeout(() => open((cur + 1) % acs.length), DUR); }
    }
    acs.forEach((a, i) => a.addEventListener("click", () => { if (i !== cur) open(i, true); }));
    watch($("#acc"), (v) => { const was = inView; inView = v; if (v && !was) open(cur); if (!v) { clearTimeout(t); } }, { threshold: 0.35 });
    window.addEventListener("resize", () => buildCn(acs[cur]));
  })();

  /* =========================================================
     PROCESS sticky number
     ========================================================= */
  (function proc() {
    const cards = $$("#pr .pc"); if (!cards.length) return;
    const strip = $("#bign .strip"), s = $("#bigs"), segs = $$("#segs i");
    let cur = 0;
    const io = new IntersectionObserver((es) => {
      es.forEach((e) => {
        if (!e.isIntersecting) return;
        const i = cards.indexOf(e.target); if (i === cur) return;
        cur = i;
        cards.forEach((c, j) => c.classList.toggle("on", j === i));
        segs.forEach((g, j) => g.classList.toggle("on", j <= i));
        s.textContent = "/04 · " + e.target.dataset.s;
        strip.style.transform = "translateY(" + (-i * 120) + "px)";
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    cards.forEach((c) => io.observe(c));
  })();

  /* =========================================================
     CALCULATOR
     ========================================================= */
  (function calc() {
    const team = $("#r-team"); if (!team) return;
    const hrs = $("#r-hrs"), wks = $("#r-wks"), chips = $$("#wf button"), sq = $("#sq");
    for (let i = 0; i < 260; i++) sq.appendChild(document.createElement("i"));
    const sqs = [...sq.children];
    function paint(inp) {
      const r = inp.closest(".rng"), p = (inp.value - inp.min) / (inp.max - inp.min) * 100;
      $(".fl", r).style.width = p + "%"; $(".th", r).style.left = p + "%";
    }
    function update() {
      [team, hrs, wks].forEach(paint);
      const T = +team.value, H = +hrs.value, Wk = +wks.value;
      const share = chips.filter((c) => c.classList.contains("on")).reduce((a, c) => a + +c.dataset.w, 0);
      const total = T * H * Wk * share;
      $("#v-team").textContent = T; $("#v-hrs").textContent = H + "h"; $("#v-wks").textContent = Wk;
      $("#o-hrs").textContent = fmt(total);
      const days = total / 7.5;
      $("#o-days").textContent = fmt(days);
      $("#o-fte").textContent = (total / (Wk * 37.5)).toFixed(1);
      $("#o-pp").textContent = (H * share).toFixed(1) + "h";
      $("#o-sh").textContent = Math.round(share * 100) + "%";
      const b = Math.min(260, Math.round(days));
      sqs.forEach((s, i) => { const col = i % 52, row = Math.floor(i / 52); const idx = col * 5 + row; s.classList.toggle("b", idx < b); });
    }
    [team, hrs, wks].forEach((i) => i.addEventListener("input", update));
    chips.forEach((c) => c.addEventListener("click", () => { c.classList.toggle("on"); update(); }));
    update();
  })();

  /* dials */
  $$(".dial").forEach((d) => {
    const g = $(".tks", d), NS = "http://www.w3.org/2000/svg";
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * Math.PI * 2, r1 = 55, r2 = i % 5 ? 59 : 62;
      const l = document.createElementNS(NS, "line");
      l.setAttribute("x1", 64 + Math.cos(a) * r1); l.setAttribute("y1", 64 + Math.sin(a) * r1);
      l.setAttribute("x2", 64 + Math.cos(a) * r2); l.setAttribute("y2", 64 + Math.sin(a) * r2);
      l.setAttribute("stroke", "#1e4dff"); l.setAttribute("stroke-opacity", i % 5 ? .45 : .9); l.setAttribute("stroke-width", 1.2);
      g.appendChild(l);
    }
    const arc = $(".arc", d), p = +d.dataset.p;
    watch(d, (v) => { if (v) arc.style.strokeDashoffset = 276.5 * (1 - p); }, { threshold: .4 });
  });

  /* =========================================================
     BINARY RAIN (cases + footer)
     ========================================================= */
  $$("canvas[data-rain]").forEach((cv) => {
    const sec = cv.parentElement, ctx = cv.getContext("2d");
    const S = 15; let cols, rows, al, base, ch, heads, W, H, run = false, last = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    function size() {
      W = sec.clientWidth; H = sec.clientHeight;
      cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(W / S); rows = Math.ceil(H / S);
      al = new Float32Array(cols * rows); base = new Float32Array(cols * rows); ch = new Uint8Array(cols * rows); heads = [];
      for (let i = 0; i < al.length; i++) { ch[i] = Math.random() < .5 ? 48 : 49; if (Math.random() < .07) base[i] = .12 + Math.random() * .3; }
      ctx.font = "11px 'Geist Mono', monospace"; ctx.textBaseline = "top";
      draw();
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) {
        const i = r * cols + c, a = Math.max(al[i], base[i]); if (a < .03) continue;
        ctx.fillStyle = a > .9 ? "rgba(90,125,255,.95)" : `rgba(255,255,255,${(a * .32).toFixed(3)})`;
        ctx.fillText(String.fromCharCode(ch[i]), c * S + 3, r * S + 2);
      }
    }
    function step(t) {
      if (!run) return;
      requestAnimationFrame(step);
      if (t - last < 90) return; last = t;
      for (let i = 0; i < al.length; i++) if (al[i] > 0) al[i] = Math.max(0, al[i] - .035);
      if (heads.length < cols * .22 && Math.random() < .9) heads.push({ c: Math.floor(Math.random() * cols), r: Math.floor(Math.random() * rows * .6) - 6, len: 8 + Math.random() * 18 });
      heads = heads.filter((h) => {
        h.r++; if (h.r >= 0 && h.r < rows) { const i = h.r * cols + h.c; al[i] = Math.random() < .08 ? 1 : .75; ch[i] = Math.random() < .5 ? 48 : 49; }
        h.len--; return h.len > 0 && h.r < rows;
      });
      draw();
    }
    size();
    let rt; window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(size, 200); });
    watch(sec, (v) => { if (RM) return; if (v && !run) { run = true; requestAnimationFrame(step); } else if (!v) run = false; });
  });

  /* =========================================================
     CASES
     ========================================================= */
  (function cases() {
    const list = $$("#clist .ci"); if (!list.length) return;
    const C = [
      { h: "Case file 01 · Harbour Family Law", m: "Sample firm · law · example", f: "File H-0114",
        big: '3<small>retainers</small>', u: "Signed this month that had gone quiet",
        q: "“Hi Dana, following up on your separation agreement consult last Tuesday. Happy to answer any questions before you sign.”", qm: "Draft · waiting for lawyer approval",
        c: "Consults that didn’t sign the same week went quiet. Nobody had time to follow up, and unsigned retainers sat in Clio.",
        b: "A follow-up drafted for every unsigned consult and retainer, in Outlook, for the lawyer to approve with one click.",
        o: "Every consult gets a follow-up. 3 retainers signed this month that had gone quiet.",
        ba: [["Consults followed up", "4 of 10", "10 of 10", 100], ["Reply to new inquiries", "Next day", "Under 1 min", 92]],
        s: ["Outlook", "Clio", "DocuSign"], mock: "mail" },
      { h: "Case file 02 · Northshore CPA", m: "Sample firm · tax & CPA · example", f: "File N-2026",
        big: '41<small>/52</small>', u: "Engagement letters signed by Jan 15",
        q: "“Hi Priya, we still need your T4 and December bank statements to finish your return.”", qm: "Chaser · approved by partner",
        c: "Letters went out late with last year’s fee. Partners spent February chasing signatures and missing T4s by hand.",
        b: "Letters with each client’s new fee, sent for e-signature with a deposit request, plus document chasers and a morning “waiting on” list.",
        o: "41 of 52 letters signed by Jan 15, new fees applied. The rest are on the list.",
        ba: [["Letters signed by Jan 15", "12", "41 of 52", 79], ["Who are we waiting on?", "Hours", "1 list", 96]],
        s: ["TaxDome", "DocuSign", "QuickBooks"], mock: "letters" },
      { h: "Case file 03 · Cedar IT", m: "Sample firm · MSP · example", f: "File C-0388",
        big: '$1,840<small>/mo</small>', u: "In seats you were not billing",
        q: "“Cedar Dental: 52 Microsoft 365 seats at the vendor, 48 on the agreement. Add 4 seats to the next invoice?”", qm: "Mismatch · waiting for approval",
        c: "Seat counts changed every month. Agreements didn’t, and nobody had time to compare vendor portals with every invoice.",
        b: "A monthly check of vendor licence counts against each agreement in the PSA, with mismatches listed for approval before the invoice run.",
        o: "$1,840 a month in seats that were not being billed, found before invoices went out.",
        ba: [["Agreements checked", "Spot checks", "All 38", 100], ["Time per invoice run", "2 days", "1 hour", 88]],
        s: ["Microsoft 365", "HaloPSA", "QuickBooks"], mock: "table" },
      { h: "Case file 04 · Lionsgate Books", m: "Sample firm · bookkeeping · example", f: "File L-0207",
        big: '5<small>/8</small>', u: "Proposals signed in one month",
        q: "“Hi Marco, just checking you got the proposal for monthly books. Happy to walk through it on a quick call.”", qm: "Nudge · day 3 · approved",
        c: "Inquiries came in at night and on weekends. Proposals went out, then nobody followed up.",
        b: "A reply to every inquiry within a minute, and polite proposal nudges until each one is signed or closed.",
        o: "5 of 8 proposals signed in a month, with a person approving the wording each time.",
        ba: [["Inquiries answered same day", "Half", "All", 100], ["Proposals followed up", "1 of 8", "8 of 8", 100]],
        s: ["Gmail", "QuickBooks", "DocuSign"], mock: "props" },
    ];
    const scr = $("#cf-scr");
    const mocks = {
      mail: () => `<div class="mk-mail"><div class="bar"><i></i><i></i><i></i><span>Outlook · draft</span></div>
        <div class="fl">To <b>Dana Reyes</b></div><div class="fl">Subject <b>Your consult with Harbour Family Law</b></div>
        <div class="bd">Hi Dana,<br><br>Following up on your separation agreement consult last Tuesday. If you’d like to go ahead, the retainer agreement is attached. Happy to answer any questions first.<br><br>Best,<br>Sam Patel</div>
        <div class="ac2"><span class="ap" id="mk-ap">Approve &amp; send</span><span class="ed">Edit</span><small>Waits for lawyer</small></div></div>`,
      letters: () => `<div class="mk-list"><div class="top"><b>Engagement letters 2026</b><span>41 of 52 signed</span></div><div class="pg"><i></i></div>
        ${[["Priya Shah", "T1 · new fee", "Waiting on T4", "rd"], ["Lee Holdings Ltd.", "T2 · new fee", "Signed", "g"], ["Marie Tremblay", "T1 · new fee", "Chased 2x", "bl"], ["Okafor Family", "T1 · new fee", "Signed", "g"], ["Arjun Mehta", "T1 · new fee", "Opened", ""], ["Westside Dental Corp.", "T2 · new fee", "Signed", "g"]].map((r) => `<div class="r"><span><span class="n">${r[0]}</span><br><span class="s">${r[1]}</span></span><span></span><span class="p ${r[3]}">${r[2]}</span></div>`).join("")}</div>`,
      table: () => `<div class="mk-tab"><table><thead><tr><th>Client</th><th class="n">Vendor</th><th class="n">Billed</th><th class="n">Diff</th></tr></thead><tbody>
        ${[["Cedar Dental", 52, 48, "+4", 1], ["Pacific Freight", 31, 31, "0", 0], ["Kits Physio", 18, 15, "+3", 1], ["Lonsdale Law", 12, 12, "0", 0], ["Main St. Vet", 9, 7, "+2", 1], ["Harbourview Realty", 24, 24, "0", 0]].map((r) => `<tr class="${r[4] ? "f" : ""}"><td>${r[0]}</td><td class="n">${r[1]}</td><td class="n">${r[2]}</td><td class="n">${r[3]}</td></tr>`).join("")}
        </tbody></table><div class="sum"><span><b>3 mismatches</b> · before invoice run</span><span class="ap">Approve all</span></div></div>`,
      props: () => `<div class="mk-list"><div class="top"><b>Proposals · March</b><span>5 of 8 signed</span></div><div class="pg"><i></i></div>
        ${[["Marco Bianchi", "Monthly books", "Nudge · day 3", "bl"], ["Dhillon Dental", "Catch-up + monthly", "Signed", "g"], ["Whistler Bike Co.", "Monthly books", "Signed", "g"], ["Nguyen & Co.", "Payroll + books", "Opened", ""], ["Fraser Cafe", "Monthly books", "Signed", "g"], ["Kerrisdale Studio", "Quarterly", "Reply sent · 41s", "bl"]].map((r) => `<div class="r"><span><span class="n">${r[0]}</span><br><span class="s">${r[1]}</span></span><span></span><span class="p ${r[3]}">${r[2]}</span></div>`).join("")}</div>`,
    };
    let cur = 0, t, inView = false, mt = [];
    function animMock(k) {
      mt.forEach(clearTimeout); mt = [];
      const rows = $$(".mk-list .r, .mk-tab tbody tr", scr);
      rows.forEach((r, i) => mt.push(setTimeout(() => r.classList.add("in"), RM ? 0 : 250 + i * 180)));
      const pg = $(".mk-list .pg i", scr);
      if (pg) mt.push(setTimeout(() => (pg.style.width = k === 1 ? "79%" : "62%"), 200));
      const ap = $("#mk-ap");
      if (ap) { mt.push(setTimeout(() => ap.classList.add("pr"), 2600)); mt.push(setTimeout(() => { ap.classList.remove("pr"); ap.classList.add("ok"); ap.textContent = "Approved · sending"; }, 2850)); }
    }
    function show(k) {
      cur = k; const d = C[k];
      list.forEach((l, i) => l.classList.toggle("on", i === k));
      $("#cf-h").textContent = d.h; $("#cf-m").textContent = d.m; $("#cf-f").textContent = d.f;
      $("#cf-big").innerHTML = d.big; $("#cf-u").textContent = d.u;
      $("#cf-q").textContent = d.q; $("#cf-qm").textContent = d.qm;
      $("#cf-c").textContent = d.c; $("#cf-b").textContent = d.b; $("#cf-o").textContent = d.o;
      $("#cf-ba").innerHTML = d.ba.map((r) => `<div class="row"><span>${r[0]}</span><span class="m"><s>${r[1]}</s> → ${r[2]}</span></div><div class="bar"><i data-w="${r[3]}"></i></div>`).join("");
      $("#cf-s").innerHTML = "Stack " + d.s.map((x) => `<span>${x}</span>`).join("");
      scr.classList.add("sw");
      setTimeout(() => { scr.innerHTML = mocks[d.mock](); scr.classList.remove("sw"); animMock(k); }, RM ? 0 : 220);
      const ro = $("#cf-ro"); ro.style.transition = "none"; ro.style.width = "0"; void ro.offsetWidth; ro.style.transition = "";
      setTimeout(() => { $$("#cf-ba .bar i").forEach((b) => (b.style.width = b.dataset.w + "%")); ro.style.width = "100%"; }, 120);
      const ln = $(".ln", list[k]);
      $$("#clist .ln").forEach((l) => l.classList.remove("run")); void ln.offsetWidth;
      clearTimeout(t);
      if (!RM && inView) { ln.style.setProperty("--dur", "8000ms"); ln.classList.add("run"); t = setTimeout(() => show((cur + 1) % C.length), 8000); }
    }
    list.forEach((l, i) => l.addEventListener("click", () => show(i)));
    watch($("#cfile"), (v) => { const was = inView; inView = v; if (v && !was) show(cur); if (!v) clearTimeout(t); }, { threshold: 0.25 });
    show(0);
    // timecode
    let f = 0; const tc = $("#cf-t");
    setInterval(() => { if (!inView || RM) return; f++; const fr = f % 25, s = Math.floor(f / 25); tc.textContent = `00:${pad(Math.floor(s / 60))}:${pad(s % 60)}:${pad(fr)}`; }, 40);
  })();

  /* =========================================================
     INDUSTRIES horizontal scroll
     ========================================================= */
  (function hscroll() {
    const hs = $("#hs"), tr = $("#htrack"), stick = $(".stick", hs), bar = $("#hbar"), hc = $("#hc");
    if (!hs) return;
    const pairs = $$(".pair", tr);
    let dist = 0;
    function setup() {
      if (isMobile()) { hs.style.height = ""; tr.style.transform = ""; $(".kd", hs).textContent = "Swipe"; return; }
      $(".kd", hs).textContent = "Keep scrolling";
      const vw = document.documentElement.clientWidth;
      dist = Math.max(0, tr.scrollWidth - vw + 32);
      hs.style.height = stick.offsetHeight + dist + "px";
      onS();
    }
    function setIdx(p) {
      bar.style.width = Math.max(3, p * 100) + "%";
      hc.textContent = pad(clamp(Math.round(p * (pairs.length - 1)) + 1, 1, pairs.length));
    }
    function onS() {
      if (isMobile()) return;
      const r = hs.getBoundingClientRect();
      const p = clamp(-r.top / Math.max(1, hs.offsetHeight - stick.offsetHeight), 0, 1);
      tr.style.transform = `translate3d(${-p * dist}px,0,0)`;
      setIdx(p);
    }
    window.addEventListener("scroll", onS, { passive: true });
    tr.addEventListener("scroll", () => { if (!isMobile()) return; const m = tr.scrollWidth - tr.clientWidth; setIdx(m > 0 ? tr.scrollLeft / m : 0); }, { passive: true });
    let rt; window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(setup, 150); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(setup);
    setup();
  })();

  /* =========================================================
     STACK live log
     ========================================================= */
  (function stack() {
    const box = $("#lrows"); if (!box) return;
    const tiles = $$(".tl2:not(.ht)");
    const R = [
      ["i-mail", "i-scale", "Retainer chase drafted", "Draft"], ["i-inbox", "i-mail", "Inquiry answered", "Sent"],
      ["i-folder", "i-mail", "T4 reminder approved", "OK"], ["i-server", "i-ticket", "Seat mismatch flagged", "Flag"],
      ["i-sign", "i-folder", "Engagement letter signed", "Signed"], ["i-doc", "i-mail", "Quote nudge queued", "Draft"],
      ["i-book", "i-mail", "Trust top-up drafted", "Draft"], ["i-folder", "i-table", "WFI list updated", "List"],
      ["i-cal", "i-scale", "Consult booked", "Booked"], ["i-ticket", "i-doc", "QBR brief drafted", "Draft"],
    ];
    let k = 0, t;
    const row = (r, fresh) => {
      const d = document.createElement("div"); d.className = "lr" + (fresh ? " new" : "");
      d.innerHTML = `<span class="tm">${now()}</span><span class="ar"><svg class="ico"><use href="#${r[0]}"/></svg>→<svg class="ico"><use href="#${r[1]}"/></svg></span><span class="tx">${r[2]}</span><span class="st">${r[3].toUpperCase()}</span>`;
      return d;
    };
    for (let i = 0; i < 7; i++) box.appendChild(row(R[(i + 3) % R.length], i === 0));
    function add() {
      $$(".lr.new", box).forEach((x) => x.classList.remove("new"));
      const d = row(R[k++ % R.length], true); d.style.opacity = 0; d.style.transform = "translateY(-12px)";
      box.prepend(d); requestAnimationFrame(() => { d.style.opacity = 1; d.style.transform = "none"; });
      while (box.children.length > 9) box.lastElementChild.remove();
      tiles.forEach((x) => x.classList.remove("hi"));
      const a = tiles[Math.floor(Math.random() * tiles.length)]; a.classList.add("hi");
      const b = tiles[Math.floor(Math.random() * tiles.length)]; if (b !== a) b.classList.add("hi");
    }
    watch($("#sgrid"), (v) => { clearInterval(t); if (v && !RM) { add(); t = setInterval(add, 1900); } });
  })();

  /* =========================================================
     COMPARE slider
     ========================================================= */
  (function cmp() {
    const c = $("#cmp"); if (!c) return;
    let x = 92, drag = false, intro = false;
    const set = (v) => { x = clamp(v, 4, 96); c.style.setProperty("--x", x + "%"); };
    set(92);
    const fromE = (e) => { const b = c.getBoundingClientRect(); return ((e.clientX - b.left) / b.width) * 100; };
    c.addEventListener("pointerdown", (e) => { if (isMobile()) return; drag = true; c.setPointerCapture(e.pointerId); set(fromE(e)); });
    c.addEventListener("pointermove", (e) => { if (drag) set(fromE(e)); });
    c.addEventListener("pointerup", () => (drag = false));
    c.addEventListener("pointercancel", () => (drag = false));
    $("#hdl").setAttribute("tabindex", "0");
    $("#hdl").setAttribute("role", "slider"); $("#hdl").setAttribute("aria-label", "Compare");
    $("#hdl").addEventListener("keydown", (e) => { if (e.key === "ArrowLeft") set(x - 4); if (e.key === "ArrowRight") set(x + 4); });
    watch(c, (v) => {
      if (!v || intro) return; intro = true;
      if (RM) { set(50); return; }
      const t0 = performance.now(), from = 92, to = 50, d = 1600;
      const st = (t) => { if (drag) return; const p = clamp((t - t0) / d, 0, 1); const e = 1 - Math.pow(1 - p, 4); set(from + (to - from) * e); if (p < 1) requestAnimationFrame(st); };
      setTimeout(() => requestAnimationFrame(st), 300);
    }, { threshold: .45 });
  })();

  /* =========================================================
     QUESTIONS carousel + row
     ========================================================= */
  (function qs() {
    const Q = [
      ["Asked by law firms", "Does a person see it before a client does?", "Yes. Anything a client will read waits in a queue until someone at your firm approves it. Internal steps, like updating a list, can run on their own."],
      ["Asked by MSPs", "Who owns the accounts and the work?", "Your firm. Every account is in your name and everything we build is yours. If you stop working with us, it keeps running."],
      ["Asked by CPA firms", "Does our client data train anything?", "No. The AI sees only what a task needs, and nothing is used to train public models. We follow PIPEDA and CASL by default."],
      ["Asked by bookkeepers", "What if it isn’t live in 14 days?", "Then the fee is refunded in full. The 14 days start when you approve the written plan."],
      ["Asked by law firms", "Will it sound like us?", "It drafts from your own past emails and templates, and nothing goes out until you approve the wording."],
    ];
    const body = $("#qbody"), dots = $$("#qdots i"); if (!body) return;
    let cur = 0, t, inView = false;
    function show(i) {
      cur = (i + Q.length) % Q.length;
      body.classList.add("sw");
      setTimeout(() => { $("#qtag").textContent = Q[cur][0]; $("#qq").textContent = Q[cur][1]; $("#qa").textContent = Q[cur][2]; body.classList.remove("sw"); }, RM ? 0 : 260);
      dots.forEach((d, j) => { d.classList.remove("on"); if (j === cur) { void d.offsetWidth; d.classList.add("on"); } });
      clearTimeout(t);
      if (inView && !RM) t = setTimeout(() => show(cur + 1), 6000);
    }
    $("#qnext").addEventListener("click", () => show(cur + 1));
    $("#qprev").addEventListener("click", () => show(cur - 1));
    $("#qtag").textContent = Q[0][0]; $("#qq").textContent = Q[0][1]; $("#qa").textContent = Q[0][2];
    watch($("#qw"), (v) => { const was = inView; inView = v; if (v && !was) show(cur); if (!v) clearTimeout(t); }, { threshold: .3 });

    const R = [
      ["Law", "Does it work with Clio?", "Yes. We build inside Clio and Outlook, so your matters and emails stay where they are."],
      ["Accounting", "Can it chase missing T4s?", "Yes. It drafts the chaser, you approve, and the client stays on your morning “waiting on” list until it arrives."],
      ["MSP", "Which PSA do you support?", "ConnectWise, HaloPSA and Autotask. Vendor counts come from the portals you already use."],
      ["Price", "How is the price set?", "Each fix has a fixed price in your written plan, agreed before any work starts."],
      ["Privacy", "Where does our data go?", "Only to the tools a task needs. Canadian privacy (PIPEDA) and anti-spam (CASL) rules are followed by default."],
      ["Agency", "Do you work with agencies?", "Yes. We build these same systems white-label for marketing agencies and their clients."],
      ["Law", "Can it draft our time entries?", "For hourly practices, yes. Entries are drafted from sent mail and the calendar, ready to approve before billing."],
    ];
    const row = $("#qrow");
    const html = R.map((r) => `<div class="qc"><div class="t"><span class="sq3"><i></i><i></i><i></i></span><span>${r[0]}</span></div><h5>${r[1]}</h5><p>${r[2]}</p><div class="f"><i><svg viewBox="2 -3 100 100"><use href="#kite"/></svg></i>BlueKite answer</div></div>`).join("");
    row.innerHTML = html + html;
  })();

  /* =========================================================
     PLANS toggle
     ========================================================= */
  (function plans() {
    const F = {
      law: ["Consult and retainer follow-up", "Replies to new inquiries in a minute", "Time entries drafted for approval", "Trust top-up and overdue chasers", "You own every account"],
      acct: ["Engagement letter renewals", "Document chasing and WFI list", "Proposal follow-up for bookkeepers", "Bill before you e-file", "You own every account"],
      msp: ["Monthly seat and licence reconciliation", "Quote and prospect follow-up", "Account review brief and proposal", "Fast reply to new inquiries", "You own every account"],
    };
    const ul = $("#bfeat"), bs = $$("#tgl button"); if (!ul) return;
    const render = (k, anim) => { ul.innerHTML = F[k].map((f, i) => `<li class="${anim ? "sw" : ""}" style="animation-delay:${i * 50}ms"><svg class="ico"><use href="#i-check"/></svg>${f}</li>`).join(""); };
    bs.forEach((b) => b.addEventListener("click", () => { bs.forEach((x) => { x.classList.toggle("on", x === b); x.setAttribute("aria-selected", x === b); }); render(b.dataset.f, true); }));
    render("law");
  })();

  /* =========================================================
     FAQ
     ========================================================= */
  $$("#fl .fq").forEach((q) => {
    $("button", q).addEventListener("click", () => {
      const o = !q.classList.contains("open");
      $$("#fl .fq").forEach((x) => { x.classList.remove("open"); $("button", x).setAttribute("aria-expanded", false); });
      if (o) { q.classList.add("open"); $("button", q).setAttribute("aria-expanded", true); }
    });
  });

  /* =========================================================
     CONTACT background + chat demo
     ========================================================= */
  (function cbg() {
    const bg = $("#cbg"); if (!bg) return;
    let h = "";
    for (let i = 0; i < 70; i++) { const x = Math.floor(Math.random() * 60) * 24 + 8, y = Math.floor(Math.random() * 40) * 24 + 8; h += `<i style="left:${x}px;top:${y}px;animation-delay:${(Math.random() * 4).toFixed(2)}s;opacity:.3"></i>`; }
    for (let i = 0; i < 9; i++) { const x = Math.floor(Math.random() * 60) * 24; h += `<b style="left:${x}px;top:${Math.floor(Math.random() * 30) * 24}px;height:${40 + Math.random() * 60}px;animation-delay:${(Math.random() * 6).toFixed(2)}s;animation-duration:${(5 + Math.random() * 4).toFixed(2)}s"></b>`; }
    bg.innerHTML = h;
  })();

  (function chat() {
    const ms = $("#cms"), form = $("#cform"), inp = $("#cin"); if (!ms) return;
    const FIRMS = [
      ["law", "Law firm"], ["acct", "Accounting or tax"], ["book", "Bookkeeping"], ["msp", "MSP or IT"], ["agency", "Agency"],
    ];
    const LEAKS = {
      law: [["Consults that didn’t sign", "consult follow-up"], ["Unsigned retainers", "retainer chasing"], ["Unbilled time", "time entries drafted from sent mail"], ["Overdue accounts", "trust top-ups and overdue chasers"]],
      acct: [["Unsigned engagement letters", "engagement letter renewal"], ["Missing T4s and documents", "document chasing with a morning “waiting on” list"], ["Overdue fees", "billing before you e-file"]],
      book: [["Inquiries after hours", "a reply to every inquiry within a minute"], ["Proposals that go quiet", "proposal follow-up"], ["Missing statements", "monthly “still need” reminders"]],
      msp: [["Seats we’re not billing", "monthly billing reconciliation"], ["Quotes that go quiet", "quote follow-up"], ["QBRs that end with nothing", "an account review brief that ends in a proposal"]],
      agency: [["White-label builds for clients", "a white-label build for one of your clients"], ["Our own lead follow-up", "inquiry and proposal follow-up"]],
    };
    let state = "idle", name = "", firm = null, timers = [];
    const later = (fn, ms2) => timers.push(setTimeout(fn, RM ? 0 : ms2));
    const scroll = () => (ms.scrollTop = ms.scrollHeight);
    function bub(cls, text) { const d = document.createElement("div"); d.className = "bub " + cls; d.textContent = text; ms.appendChild(d); scroll(); return d; }
    function bot(text, delay = 700, after) {
      const ty = document.createElement("div"); ty.className = "bub bot typ"; ty.innerHTML = "<i></i><i></i><i></i>";
      later(() => { ms.appendChild(ty); scroll(); }, Math.max(100, delay - 420));
      later(() => { ty.remove(); const b = bub("bot", text); after && after(b); }, delay + 150);
    }
    function opts(list, cb, delay) {
      later(() => {
        const o = document.createElement("div"); o.className = "opts";
        list.forEach(([k, label]) => { const b = document.createElement("button"); b.type = "button"; b.textContent = label; b.addEventListener("click", () => { o.remove(); cb(k, label); }); o.appendChild(b); });
        ms.appendChild(o); scroll();
      }, delay);
    }
    function start() {
      timers.forEach(clearTimeout); timers = []; ms.innerHTML = ""; state = "name"; name = ""; firm = null;
      inp.disabled = false; inp.placeholder = "Type your name...";
      bot("Hi, I’m the BlueKite intake demo. I’ll point you to a good first fix in under a minute.", 600);
      bot("First things first: what’s your name?", 1700);
    }
    function askFirm() {
      state = "firm"; inp.placeholder = "Or type your firm type...";
      bot(`Nice to meet you, ${name}. What kind of firm do you run?`, 700);
      opts(FIRMS, (k, label) => { bub("me", label); pickFirm(k, label); }, 1000);
    }
    function pickFirm(k, label) {
      firm = [k, label]; state = "leak"; inp.placeholder = "Pick one above...";
      bot("What slips through most often?", 700);
      opts(LEAKS[k].map((x, i) => [i, x[0]]), (i, l) => { bub("me", l); finish(LEAKS[k][i][1]); }, 1000);
    }
    function finish(fix) {
      state = "done"; inp.placeholder = "Press restart to try again"; inp.disabled = true;
      bot(`Got it. For a ${firm[1].toLowerCase()}, a good first fix is ${fix}. On a free 30-minute call we map it and send a written plan with three fixes, each with a fixed price.`, 900, (b) => {
        const a = document.createElement("a"); a.className = "bk"; a.href = "/book"; a.textContent = "Book the free call →";
        b.appendChild(document.createElement("br")); b.appendChild(a); scroll();
      });
    }
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const v = inp.value.trim().slice(0, 40); if (!v) return;
      inp.value = "";
      if (state === "name") { name = v.split(/\s+/)[0]; bub("me", v); askFirm(); }
      else if (state === "firm") { $$(".opts", ms).forEach((o) => o.remove()); bub("me", v); const m = FIRMS.find((f) => v.toLowerCase().includes(f[1].split(" ")[0].toLowerCase())); pickFirm(m ? m[0] : "agency", m ? m[1] : v); }
    });
    $("#crst").addEventListener("click", start);
    let started = false;
    watch($("#chat"), (v) => { if (v && !started) { started = true; start(); } }, { threshold: .3 });
  })();

  /* =========================================================
     FOOTER dot-matrix wordmark
     ========================================================= */
  (function dm() {
    const wrap = $("#dm"), cv = $("#dmc"); if (!cv) return;
    const ctx = cv.getContext("2d");
    let W, H, cells = [], packets = [], run = false, mx = -999, my = -999, step = 6, dpr = Math.min(window.devicePixelRatio || 1, 2);
    function build() {
      W = wrap.clientWidth; H = wrap.clientHeight; step = W < 600 ? 3.4 : 6;
      cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const off = document.createElement("canvas"); off.width = W; off.height = H;
      const o = off.getContext("2d");
      let fs = H * 1.0;
      o.font = `700 ${fs}px Archivo, Inter, sans-serif`;
      const tw = o.measureText("BLUEKITE").width;
      fs = Math.min(fs, fs * (W * 0.97) / tw);
      o.font = `700 ${fs}px Archivo, Inter, sans-serif`;
      o.textBaseline = "middle"; o.textAlign = "center"; o.fillStyle = "#fff";
      o.fillText("BLUEKITE", W / 2, H / 2 + fs * 0.04);
      const data = o.getImageData(0, 0, W, H).data;
      cells = [];
      for (let y = step / 2; y < H; y += step) for (let x = step / 2; x < W; x += step) {
        const a = data[(Math.floor(y) * W + Math.floor(x)) * 4 + 3];
        if (a > 120) cells.push({ x, y, b: .25 + .75 * Math.pow(Math.abs(Math.sin(x / W * Math.PI * 1.6 + y / H)), 1.4) * (0.6 + Math.random() * .4) });
      }
      draw(0);
    }
    function draw(t) {
      ctx.clearRect(0, 0, W, H);
      const s = Math.max(1.6, step - 1.6);
      for (const c of cells) {
        const dx = c.x - mx, dy = c.y - my, d = Math.sqrt(dx * dx + dy * dy);
        if (d < 70) { ctx.fillStyle = `rgba(77,115,255,${(1 - d / 70) * .8 + .2})`; ctx.fillRect(c.x - s / 2, c.y - s / 2, s, s); continue; }
        const fl = .85 + .15 * Math.sin(t / 900 + c.x * .02);
        ctx.fillStyle = `rgba(255,255,255,${(c.b * fl * .9).toFixed(3)})`;
        ctx.fillRect(c.x - s / 2, c.y - s / 2, s, s);
      }
      for (const p of packets) {
        const g = ctx.createLinearGradient(p.x - p.len, 0, p.x, 0);
        g.addColorStop(0, "rgba(30,77,255,0)"); g.addColorStop(1, "rgba(30,77,255,.9)");
        ctx.fillStyle = g; ctx.fillRect(p.x - p.len, p.y - 1, p.len, 2);
        ctx.fillStyle = "#1e4dff"; ctx.fillRect(p.x - 4, p.y - 4, 8, 8);
        ctx.fillStyle = "#fff"; ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
      }
    }
    let lt = 0;
    function loop(t) {
      if (!run) return;
      requestAnimationFrame(loop);
      const dt = Math.min(50, t - (lt || t)); lt = t;
      if (packets.length < 6 && Math.random() < .03) { const c = cells[Math.floor(Math.random() * cells.length)]; if (c) packets.push({ x: c.x - 120, y: c.y, v: .08 + Math.random() * .12, len: 60 + Math.random() * 120, to: c.x + 80 + Math.random() * 300 }); }
      packets = packets.filter((p) => { p.x += p.v * dt; return p.x < p.to; });
      draw(t);
    }
    wrap.addEventListener("mousemove", (e) => { const b = cv.getBoundingClientRect(); mx = e.clientX - b.left; my = e.clientY - b.top; if (RM) draw(0); });
    wrap.addEventListener("mouseleave", () => { mx = my = -999; if (RM) draw(0); });
    const go = () => build();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(go); else go();
    let rt; window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(build, 200); });
    watch(wrap, (v) => { if (RM) return; if (v && !run) { run = true; lt = 0; requestAnimationFrame(loop); } else if (!v) run = false; });
  })();
})();
