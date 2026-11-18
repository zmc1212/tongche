/* 时间线(49s 循环):门架 → 横轴 → 大轮 → 26 筒逐只绑装 → 笧槽水池 →
   常流运转 → 过顶特写 → 急流运转 → 总结 */
(function (MECH) {
  var KS = MECH.KS, D = MECH.DIM;

  MECH.PHASES = [
    { id: "frame", name: "FRAME · 门架横轴", dur: 3.5, dot: "yellow", mode: "ASSEMBLING",
      cam: { theta: 0.55, phi: 1.20, r: 8.2, target: [0, 1.5, 0] }, drift: 0.03 },
    { id: "wheel", name: "WHEEL · 大轮 24 辐", dur: 4.5, dot: "orange", mode: "ASSEMBLING",
      cam: { theta: 0.30, phi: 1.18, r: 7.0, target: [0, 2.3, 0] }, drift: 0.015 },
    { id: "tubes", name: "TUBES · 26 筒绑装", dur: 8, dot: "teal", mode: "ASSEMBLING",
      cam: { theta: 0.62, phi: 1.22, r: 7.6, target: [0, 2.3, 0] }, drift: 0.02 },
    { id: "slot", name: "TROUGH · 笧槽水池", dur: 4.5, dot: "blue", mode: "ASSEMBLING",
      cam: { theta: -0.45, phi: 1.14, r: 8.0, target: [0.6, 2.2, 0] }, drift: 0.02 },
    { id: "flow", name: "FLOW · 常流运转 0.42 rad/s", dur: 7, dot: "green", mode: "RUNNING",
      cam: { theta: 0.75, phi: 1.22, r: 9.2, target: [0, 2.3, 0] }, drift: 0.012 },
    { id: "top", name: "TOP DUMP · 过顶倾泻特写", dur: 6, dot: "yellow", mode: "RUNNING",
      cam: { theta: 0.15, phi: 1.10, r: 4.4, target: [0.7, 4.0, 0] }, drift: 0.008 },
    { id: "rush", name: "RUSH · 急流 0.62 rad/s", dur: 7, dot: "pink", mode: "RUSHING",
      cam: { theta: -0.6, phi: 1.18, r: 9.6, target: [0, 2.3, 0] }, drift: 0.02 },
    { id: "summary", name: "SUMMARY · 流量总结", dur: 6, dot: "green", mode: "REVIEW",
      cam: { theta: 0.0, phi: 1.12, r: 10.2, target: [0, 2.3, 0] }, drift: 0.05 }
  ];
  MECH.PHASE_IDS = ["frame", "wheel", "tubes", "slot", "flow", "top", "rush", "summary"];

  MECH.newState = KS.newState;

  MECH.tick = function (st, ph, pt, dt) {
    if (ph.id !== st.lastPhase) {
      st.lastPhase = ph.id;
      st.dumpWater = 0; st.dumpT = 0; st.qMeas = 0;   // 流量窗口按阶段清零
    }
    if (ph.id === "flow" || ph.id === "top") st.omegaTarget = D.k.slow;
    else if (ph.id === "rush") st.omegaTarget = D.k.fast;
    else st.omegaTarget = 0;
    var dumps0 = st.dumps;
    KS.step(st, dt);
    /* 倾倒事件 → 水粒子(从筒口抛物线落入笧槽) */
    if (st.dumps > dumps0 && ph.id !== "summary") {
      var n = Math.min(3, st.dumps - dumps0);
      for (var i = 0; i < n; i++) {
        MECH.Scene3D.spawnPuff(0.30 + Math.random() * 0.10, 4.40, 0.16 + (Math.random() - 0.5) * 0.2, {
          max: 0.85, base: 0.26, vx: 1.25 + Math.random() * 0.3, vy: -0.25 - Math.random() * 0.15, vz: (Math.random() - 0.5) * 0.12,
          opacity: 0.62, tint: 0x7FC4E0, grow: 1.1
        });
      }
    }
    /* 水面缓移粒子(指示流向 −x,推轮) */
    if (ph.id === "flow" || ph.id === "rush") {
      if (Math.random() < dt * (ph.id === "rush" ? 7 : 4)) {
        MECH.Scene3D.spawnPuff(-2.5 + Math.random() * 3.5, 0.55, 1.6 + Math.random() * 0.8, {
          max: 1.6, base: 0.4, vx: -1.1, vy: 0.05, vz: 0, opacity: 0.3, tint: 0x9FD4E8, grow: 1.2
        });
      }
    }
  };

  MECH.status = function (st, ph, pt) {
    var rpm = st.omega / (2 * Math.PI) * 60;
    var pill = ph.name;
    if (ph.id === "flow" || ph.id === "rush" || ph.id === "top") {
      pill = ph.name + " · " + rpm.toFixed(1) + " RPM";
    }
    return {
      mode: ph.mode,
      hot: ph.id === "rush",
      pill: pill,
      a: rpm.toFixed(1) + " RPM",
      b: (st.omega > 0.05 ? (MECH.DIM.Qof(st.omega) * 1000).toFixed(2) + " L/s" : "—"),
      c: (st.dumpWater * 1000).toFixed(0) + " L"
    };
  };

  MECH.pinnedFor = function (ph) {
    function E(id) { var e = MECH.Parts.entry(id); return e ? (e.anchor || e.group) : null; }
    if (ph.id === "wheel") return [{ id: "p-w", obj: E("wheel"), text: "大轮 · 径 4.2m · 24 辐" }];
    if (ph.id === "tubes") return [
      { id: "p-t", obj: E("tube0"), text: "竹筒 · 口迎水上翘 25°" },
      { id: "p-t2", obj: E("tube13"), text: "26 筒等分 13.85°", tone: "white" }
    ];
    if (ph.id === "slot") return [{ id: "p-s", obj: E("slot"), text: "笧槽 · 承顶部倾泻" }];
    if (ph.id === "flow" || ph.id === "top" || ph.id === "rush" || ph.id === "summary") return [
      { id: "p-s", obj: E("slot"), text: "笧槽 · Q = nVω/2π", tone: "white" },
      { id: "p-w", obj: E("wheel"), text: "水推轮 · 筒自汲自倾" }
    ];
    return [];
  };
})(window.MECH = window.MECH || {});
