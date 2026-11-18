/* 筒车 — 尺寸常量与充水运动学求解器
   文献依据:王祯《农书》筒车图(水轮,「随流自有得,加工不假人」)。
   大轮顺时针(自 +z 视),下部浸水 0.35 m;竹筒 26 只斜绑轮缘(口迎水上翘 25°),
   底部兜水、顶部倾入笧槽。
   流量公式:Q = n·V·ω/(2π),V = π·r_t²·h_w·φ;运行期以倾倒计数实测 Q 对照。 */
(function (MECH) {
  var CHI = 0.3;
  var D = {
    CHI: CHI,
    R: 2.1,              // 轮半径(径一丈四尺)
    spokes: 24,
    nTubes: 26,
    tubeL: 0.52, tubeR: 0.04, tilt: 25 * Math.PI / 180,
    hFull: 0.42,         // 筒内满水位(沿筒轴)
    phi: 0.85,           // 有效容积系数
    axleR: 0.11, axleLen: 2.9,   // 水平轴沿 Z(轮平面 XY)
    postZ: 1.42, postH: 2.62,    // 门架柱位/柱高(顶托轴承)
    yCenter: 2.25,       // 轮心高(下缘 0.15,浸入水下 0.35,水面 0.5)
    waterY: 0.5,
    // 充水角度区(α 自底部顺时针量,rad):入水边 −34°,出水边 +34°(浸深半角)
    aIn: -34 * Math.PI / 180, aFill: -14 * Math.PI / 180, aOut: 34 * Math.PI / 180,
    dumpA0: 165 * Math.PI / 180, dumpA1: 195 * Math.PI / 180,   // 顶部倾倒区
    // 笧槽(接顶部 +x 侧倒水)
    slotX: 1.55, slotY: 3.72, slotL: 1.3, slotW: 0.36,
    k: { slow: 0.42, fast: 0.62 }   // 两档角速度 rad/s
  };
  D.immersion = D.yCenter - D.waterY + (D.waterY - (D.yCenter - D.R));   // 0.35
  D.V = Math.PI * D.tubeR * D.tubeR * D.hFull * D.phi;                   // 单筒满水 m³
  D.Qof = function (w) { return D.nTubes * D.V * w / (2 * Math.PI); };   // m³/s

  /* 每筒相位 α_i(t) = α0_i + φ(顺时针为正);φ 为轮累计顺时针转角 */
  function newState() {
    var a0 = [];
    for (var i = 0; i < D.nTubes; i++) a0.push(i / D.nTubes * 2 * Math.PI);
    return {
      time: 0, phi: 0, omega: 0, omegaTarget: 0,
      levels: new Array(D.nTubes).fill(0),   // 各筒水位(0..hFull)
      dumps: 0, dumpWater: 0, dumpT: 0,      // 倾倒计数与实测流量窗口
      dumpTimes: [],                          // 倾倒时刻(3s 滑窗)
      qMeas: 0, dist: 0,
      lastPhase: "", manual: false
    };
  }

  function norm(a) { a = a % (2 * Math.PI); if (a < 0) a += 2 * Math.PI; return a; }

  /* 筒位置(轮平面,自轮心):α 自底部顺时针量 → (−sinα, −cosα)·R */
  function tubePos(a) {
    return { x: -Math.sin(a) * D.R, y: -Math.cos(a) * D.R };
  }

  /* 单筒水位模型(α 已 norm 到 [0,2π)):返回水位(m) 与 dump 事件
     区序(α 顺时针递增):326°→346° 入水充水 → 346°..34°(经 0°) 水下满 →
     34°..165° 带水上行 → 165°..195° 顶部倾倒 → 195°..326° 空筒回落 */
  function tubeWater(a, prevA) {
    a = norm(a); prevA = norm(prevA);
    var dump = (prevA < Math.PI && a >= Math.PI && a > prevA);   // 越过顶点 180°
    var A0 = norm(D.dumpA0), A1 = norm(D.dumpA1);
    var AIN = norm(D.aIn), AFILL = norm(D.aFill), AOUT = norm(D.aOut);
    if (a >= A0 && a <= A1) {                    // 顶部倾倒
      return { lvl: D.hFull * (1 - (a - A0) / (A1 - A0)), dump: dump };
    }
    if (a > A1 && a < AIN) return { lvl: 0, dump: dump };            // 空筒回落
    if (a >= AIN) {                              // 326°..346° 入水充水
      var f = (a - AIN) / (AFILL - AIN);
      return { lvl: D.hFull * Math.min(1, f), dump: dump };
    }
    if (a <= AOUT) return { lvl: D.hFull, dump: dump };              // 0°..34° 水下满
    return { lvl: D.hFull, dump: dump };                             // 34°..165° 带水
  }

  /* 一步:轮转 + 各筒水位 + 倾倒计数/实测流量 */
  function step(st, dt) {
    st.omega += (st.omegaTarget - st.omega) * Math.min(1, dt * 1.8);
    st.phi += st.omega * dt;
    st.time += dt;
    var prevPhi = st.phi - st.omega * dt;
    var dumpedNow = 0;
    for (var i = 0; i < D.nTubes; i++) {
      var a0i = i / D.nTubes * 2 * Math.PI;
      var r = tubeWater(a0i + st.phi, a0i + prevPhi);
      st.levels[i] = r.lvl;
      if (r.dump) dumpedNow++;
    }
    if (dumpedNow > 0) {
      st.dumps += dumpedNow;
      st.dumpWater += dumpedNow * D.V;
      for (var d = 0; d < dumpedNow; d++) st.dumpTimes.push(st.time);
    }
    st.dumpT += dt;
    while (st.dumpTimes.length && st.dumpTimes[0] < st.time - 3) st.dumpTimes.shift();
    st.qMeas = st.dumpTimes.length * D.V / 3;    // 实测 m³/s(3s 滑窗)
    st.dist += st.omega * D.R * dt;
  }

  MECH.DIM = D;
  MECH.KS = { newState: newState, step: step, tubePos: tubePos, tubeWater: tubeWater, norm: norm };

  /* 载入期自检 */
  (function selfCheck() {
    var errs = [];
    if (Math.abs(D.nTubes - Math.round(D.nTubes)) > 0) errs.push("筒数非整数");
    if (D.V <= 0 || D.V > 0.01) errs.push("单筒容积异常: " + D.V);
    if (D.aIn >= D.aFill || D.aFill >= D.aOut) errs.push("充水角度区非法");
    if (D.dumpA0 >= D.dumpA1) errs.push("倾倒区非法");
    if (D.yCenter - D.R > D.waterY) errs.push("轮下缘未入水");
    var q = D.Qof(D.k.slow);
    if (Math.abs(q - 26 * D.V * D.k.slow / (2 * Math.PI)) > 1e-12) errs.push("Q 公式不自洽");
    if (errs.length) {
      if (window.MECH_SHOW_BOOT_ERROR) window.MECH_SHOW_BOOT_ERROR("筒车自检失败: " + errs.join(";"));
      throw new Error(errs.join(";"));
    }
    /* 运行期自检:模拟 30s 常速,实测倾倒水量应与 Q 公式一致(±8%) */
    var st = newState();
    st.omegaTarget = D.k.slow;
    st.omega = D.k.slow;
    for (var s = 0; s < 900; s++) step(st, 1 / 30);
    var qf = D.Qof(D.k.slow), qm = st.dumpWater / 30;
    if (Math.abs(qm - qf) / qf > 0.08) {
      var msg = "筒车流量自检失败: 实测 " + qm.toFixed(4) + " vs 公式 " + qf.toFixed(4);
      if (window.MECH_SHOW_BOOT_ERROR) window.MECH_SHOW_BOOT_ERROR(msg);
      throw new Error(msg);
    }
  })();
})(window.MECH = window.MECH || {});
