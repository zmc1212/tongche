/* 筒车部件建模与注册(约 34 件:支架/轴/大轮/26 竹筒/笧槽/水池)。
   轮平面 XY(法线 Z),水平轴沿 Z,轮顺时针(自 +z 视)→ rotation.z = −φ。
   每只竹筒为独立部件(几何以轮心为原点摆放于 α0 方位),筒内水柱随充水模型缩放。 */
(function (MECH) {
  var P = MECH.P, M3 = null, D = MECH.DIM;

  function group() { return new THREE.Group(); }

  /* 竹筒在 α 方位的切向轴(顺时针前进方向抬起 25°,口迎水) */
  function tubeAxis(alpha) {
    var tx = -Math.cos(alpha), ty = Math.sin(alpha);   // d/dα(−sinα,−cosα)
    var ax = tx * Math.cos(D.tilt), ay = ty * Math.cos(D.tilt) + Math.sin(D.tilt);
    return new THREE.Vector3(ax, ay, 0).normalize();
  }

  function buildFrame() {
    var g = group();
    [-1, 1].forEach(function (s) {
      g.add(P.box(0.22, D.postH, 0.22, M3.woodD, 0, D.postH / 2, s * D.postZ));
      g.add(P.box(0.34, 0.12, 0.5, M3.stone, 0, 0.06, s * D.postZ));        // 柱础
      g.add(P.cyl(0.10, 0.10, 0.16, M3.iron, 0, D.postH + 0.02, s * D.postZ, 14));  // 轴承
    });
    g.add(P.box(0.30, 0.24, 0.5, M3.stone, 0, 0.12, 0));                    // 中间垫墩
    return g;
  }

  function buildAxle() {
    var g = group();
    var axle = P.cyl(D.axleR, D.axleR, D.axleLen, M3.woodD, 0, D.yCenter, 0, 16);
    axle.rotation.x = P.ROTX;                                              // 轴沿 Z
    g.add(axle);
    [0.5, -0.5].forEach(function (z) {
      var lock = P.torus(D.axleR + 0.02, 0.025, M3.iron, 0, D.yCenter, z, 18);
      g.add(lock);
    });
    return g;
  }

  /* 大轮:双轮缘 + 24 辐 + 毂(轮平面 XY,几何绕原点=轮心) */
  function buildWheel() {
    var g = group();
    g.position.set(0, 0, 0);
    g.add(P.torus(D.R, 0.07, M3.woodD, 0, 0, 0, 60));
    g.add(P.torus(D.R - 0.22, 0.05, M3.wood, 0, 0, 0, 56));
    for (var i = 0; i < D.spokes; i++) {
      var a = i / D.spokes * Math.PI * 2;
      var s = P.box(0.075, D.R - 0.2, 0.06, M3.wood, 0, 0, 0);
      s.position.set(Math.cos(a) * (0.16 + (D.R - 0.2) / 2 - 0.05), Math.sin(a) * (0.16 + (D.R - 0.2) / 2 - 0.05), 0);
      s.rotation.z = a - Math.PI / 2;
      g.add(s);
    }
    var hub = P.cyl(0.20, 0.20, 0.34, M3.woodD, 0, 0, 0, 18);
    hub.rotation.x = P.ROTX;
    g.add(hub);
    var cap = P.torus(0.20, 0.03, M3.iron, 0, 0, 0.19, 20);
    g.add(cap);
    var cap2 = P.torus(0.20, 0.03, M3.iron, 0, 0, -0.19, 20);
    g.add(cap2);
    return { group: g };
  }

  /* 单只竹筒(α0 方位)+ 筒内水柱;target = 轮心 */
  function buildTube(idx) {
    var g = group();
    var a0 = idx / D.nTubes * 2 * Math.PI;
    var holder = group();
    var pos = MECH.KS.tubePos(a0);
    holder.position.set(pos.x, pos.y, 0.16);
    /* 筒体:cyl 沿局部 Y,定向 = tubeAxis(α0);原点在筒中段 */
    var body = P.cyl(D.tubeR, D.tubeR * 0.92, D.tubeL, M3.woodL, 0, 0, 0, 14);
    holder.add(body);
    var rim1 = P.torus(D.tubeR + 0.006, 0.008, M3.iron, 0, D.tubeL * 0.32, 0, 14);
    rim1.rotation.x = P.ROTX;
    holder.add(rim1);
    var rim2 = P.torus(D.tubeR + 0.006, 0.008, M3.iron, 0, -D.tubeL * 0.32, 0, 14);
    rim2.rotation.x = P.ROTX;
    holder.add(rim2);
    var axis = tubeAxis(a0);
    holder.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), axis);
    /* 水柱:单位高圆柱,按水位缩放(局部 Y,筒底 = −tubeL/2) */
    var water = P.mesh(new THREE.CylinderGeometry(D.tubeR * 0.8, D.tubeR * 0.8, 1, 12),
      new THREE.MeshStandardMaterial({ color: 0x4FA3C7, transparent: true, opacity: 0.66, roughness: 0.3 }),
      0, -D.tubeL / 2, 0, false, false);
    water.scale.y = 0.001;
    holder.add(water);
    g.add(holder);
    g.userData.idx = idx;
    g.userData.water = water;
    return { group: g };
  }

  /* 笧槽(顶部接水)+ 支柱 */
  function buildSlot() {
    var g = group();
    var L = D.slotL, W = D.slotW, H = 0.22;
    g.add(P.box(L, 0.05, W, M3.woodD, 0, 0, 0));
    for (var s = -1; s <= 1; s += 2) {
      g.add(P.box(L, H, 0.045, M3.wood, 0, H / 2, s * W / 2));
    }
    g.add(P.box(0.045, H, W, M3.wood, -L / 2, H / 2, 0));     // 封头
    g.add(P.box(0.10, D.slotY - 0.4, 0.10, M3.woodD, -L / 2 + 0.2, -(D.slotY - 0.4) / 2, 0));  // 支柱
    g.add(P.box(0.10, D.slotY - 0.4, 0.10, M3.woodD, L / 2 - 0.2, -(D.slotY - 0.4) / 2, 0));
    /* 出水短槽(引向右下) */
    var spout = P.box(0.5, 0.05, W * 0.8, M3.wood, L / 2 + 0.24, -0.14, 0);
    spout.rotation.z = -0.18;
    g.add(spout);
    return g;
  }

  /* 水池(world 固定):水面 + 石沿 */
  function buildPond() {
    var g = group();
    var water = P.mesh(new THREE.PlaneGeometry(7.5, 4.6),
      new THREE.MeshStandardMaterial({ color: 0x2E6E8E, transparent: true, opacity: 0.62, roughness: 0.24, metalness: 0.1 }),
      -0.6, D.waterY, 0, false, true);
    water.rotation.x = -Math.PI / 2;
    g.add(water);
    for (var i = -3; i <= 3; i++) {
      g.add(P.box(0.5, 0.55, 0.3, M3.stone, i * 1.1, 0.27, 2.28));
    }
    g.add(P.box(0.3, 0.55, 4.7, M3.stone, -3.85, 0.27, 0));
    return g;
  }

  /* —— 注册 —— */
  MECH.PART_DEFS = function () {
    M3 = MECH.Scene3D.M;
    function def(o) { return MECH._def(o); }

    def({ id: "pond", name: "POND · 水池", sub: "world 固定 · 水面 y=0.5", phase: 0, kind: "none", world: true,
      build: buildPond, target: [0, 0, 0] });
    def({ id: "frame", name: "FRAME · 门架", sub: "双柱石础轴承", phase: 0, at: 0.15, dur: 1.2,
      build: buildFrame, target: [0, 0, 0], start: [0, 4.8, 3.2], mid: [0, 2.8, 1.4], anchor: [0, 1.4, 0.5] });
    def({ id: "axle", name: "AXLE · 横轴", sub: "沿 Z · y=2.25", phase: 0, at: 1.3, dur: 1.1,
      build: buildAxle, target: [0, 0, 0], start: [0, 5.4, 0], mid: [0, 3.6, 0], anchor: [0, 0.15, 0.6] });

    def({ id: "wheel", name: "WHEEL · 大轮", sub: "径一丈四尺 · 24 辐", phase: 1, at: 3.7, dur: 1.8, kind: "kine",
      build: buildWheel, target: [0, D.yCenter, 0], off: [0, 0.8, 8.5] });

    /* 26 只竹筒逐只绑装(阶段 3) */
    var _tubeBuild = function (idx) { return function () { return buildTube(idx); }; };
    for (var t = 0; t < D.nTubes; t++) {
      def({ id: "tube" + t, name: "TUBE · 竹筒 " + (t + 1 < 10 ? "0" + (t + 1) : t + 1),
        sub: "口径八分 · 长 0.52 · 翘 25°", phase: 2, at: 8.15 + t * 0.28, dur: 0.6, kind: "kine",
        build: _tubeBuild(t), target: [0, D.yCenter, 0], off: [(t % 3 - 1) * 0.9, 1.1, 7.5] });
    }

    def({ id: "slot", name: "LAUNCH TROUGH · 笧槽", sub: "接顶部倾泻 · 引水入渠", phase: 3, at: 16.3, dur: 1.3,
      build: buildSlot, target: [D.slotX, D.slotY, 0], start: [D.slotX + 3.4, D.slotY + 2.4, 0], mid: [D.slotX + 1.6, D.slotY + 1.0, 0], anchor: [0, 0.2, 0.4] });
  };

  /* —— 运动学分发 —— */
  MECH.KINE = function (st) {
    var w = MECH.Parts.entry("wheel");
    if (w && w.shown) w.group.rotation.z = -st.phi;
    for (var t = 0; t < D.nTubes; t++) {
      var e = MECH.Parts.entry("tube" + t);
      if (!e || !e.shown) continue;
      e.group.rotation.z = -st.phi;
      var water = e.group.userData.water;
      var lvl = st.levels[t] || 0;
      water.scale.y = Math.max(0.001, lvl);
      water.position.y = -D.tubeL / 2 + lvl / 2;
    }
  };
})(window.MECH = window.MECH || {});
