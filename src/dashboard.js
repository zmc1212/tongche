/* 仪表盘:①转速+流量 ②单筒水位曲线 ③倾倒节奏 ④轮盘水位环 */
(function (MECH) {
  var el = {}, D = MECH.DIM;
  var soft = "rgba(233,238,242,0.5)";

  MECH.DASH = { panels: [
    { title: "FLOW · 流量", meta: "Q = nVω/2π", dot: "teal",
      html: '<div class="big" id="d-q">0.00</div><div class="k">L/s · 公式值</div>' +
            '<div class="bar"><i id="d-bar"></i></div>' +
            '<div class="rowline"><span>转速</span><b id="d-rpm">0.0 RPM</b></div>' +
            '<div class="chip" id="d-chip">—</div>',
      init: initFlow, draw: drawFlow },
    { title: "TUBE LEVEL · 单筒水位", meta: "筒 #1 · 角度扫描", dot: "blue", canvasH: 92, draw: drawLevel },
    { title: "DUMP · 倾倒节奏", meta: "n·ω/2π 次/分", dot: "yellow", canvasH: 92, draw: drawDump },
    { title: "WHEEL MAP · 轮盘水位", meta: "26 筒实时", dot: "green", canvasH: 92, draw: drawWheelMap }
  ] };

  function initFlow(sec) {
    el.q = sec.querySelector("#d-q");
    el.bar = sec.querySelector("#d-bar");
    el.rpm = sec.querySelector("#d-rpm");
    el.chip = sec.querySelector("#d-chip");
  }

  function drawFlow(st, ph, pt, ctx, w, h) {
    var q = D.Qof(st.omega) * 1000;
    if (el.q) el.q.textContent = q.toFixed(2);
    if (el.bar) el.bar.style.width = Math.min(100, q / 5 * 100) + "%";
    if (el.rpm) el.rpm.textContent = (st.omega / (2 * Math.PI) * 60).toFixed(1) + " RPM";
    if (el.chip) {
      if (st.omega > 0.15 && st.qMeas > 0) {
        var qm = st.qMeas * 1000;
        var dev = Math.abs(qm - q) / Math.max(q, 1e-6);
        var ok = dev < 0.08;
        el.chip.textContent = "实测 " + qm.toFixed(2) + " L/s · " + (ok ? "合公式 ✓" : "偏差 " + (dev * 100).toFixed(1) + "%");
        el.chip.className = "chip" + (ok ? " on" : " warn");
      } else {
        el.chip.textContent = st.omega > 0.05 ? "计量中…" : "停轮";
        el.chip.className = "chip";
      }
    }
  }

  /* ② 单筒水位-角度曲线:横轴 α 0..360°,曲线为充水模型,动点 = 筒#1 当前 α */
  function drawLevel(st, ph, pt, ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    var mid = h - 14, top = 8;
    ctx.strokeStyle = "rgba(233,238,242,0.16)";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, mid); ctx.lineTo(w, mid); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, top); ctx.lineTo(w, top); ctx.stroke();
    ctx.fillStyle = soft;
    ctx.font = "600 7.5px Menlo, monospace";
    ctx.textAlign = "left";
    ctx.fillText("底 0°", 2, mid - 3);
    ctx.fillText("顶 180°", w / 2 - 14, top + 8);
    ctx.fillText("水满", 2, top + 8);
    /* 充水模型曲线 */
    ctx.strokeStyle = "#6FA8DC";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    for (var px = 0; px <= w; px += 2) {
      var a = px / w * 2 * Math.PI;
      var r = MECH.KS.tubeWater(a, a - 0.001);
      var y = mid - r.lvl / D.hFull * (mid - top);
      if (px === 0) ctx.moveTo(px, y); else ctx.lineTo(px, y);
    }
    ctx.stroke();
    /* 动点(筒#1) */
    var a1 = MECH.KS.norm(0 + st.phi);
    var r1 = MECH.KS.tubeWater(a1, a1 - 0.01);
    var x1 = a1 / (2 * Math.PI) * w, y1 = mid - r1.lvl / D.hFull * (mid - top);
    ctx.fillStyle = "#E9C93C";
    ctx.beginPath(); ctx.arc(x1, y1, 3.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = soft;
    ctx.textAlign = "right";
    ctx.fillText("α " + Math.round(a1 * 180 / Math.PI) + "°", w - 4, top + 8);
  }

  /* ③ 倾倒节奏:时间轴上每次倾倒画一个金点 + 频率读数 */
  var dumpMarks = [];
  function drawDump(st, ph, pt, ctx, w, h) {
    if (st.dumps > (drawDump._last || 0)) {
      dumpMarks.push({ t: st.time });
      if (dumpMarks.length > 90) dumpMarks.shift();
    }
    drawDump._last = st.dumps;
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(233,238,242,0.16)";
    ctx.beginPath(); ctx.moveTo(0, h - 16); ctx.lineTo(w, h - 16); ctx.stroke();
    var span = 12;   // 显示最近 12s
    for (var i = 0; i < dumpMarks.length; i++) {
      var dt = st.time - dumpMarks[i].t;
      if (dt > span) continue;
      var x = w - dt / span * w;
      ctx.fillStyle = "#E9C93C";
      ctx.beginPath(); ctx.arc(x, h - 22, 2.6, 0, Math.PI * 2); ctx.fill();
    }
    var rate = st.omega > 0.05 ? D.nTubes * st.omega / (2 * Math.PI) * 60 : 0;
    ctx.fillStyle = "#E9EEF2";
    ctx.font = "800 15px Menlo, monospace";
    ctx.textAlign = "left";
    ctx.fillText(rate.toFixed(1), 4, 20);
    ctx.fillStyle = soft;
    ctx.font = "600 8px Menlo, monospace";
    ctx.fillText("次/分", 52, 20);
    ctx.fillText("窗口 12s · 每转 26 次", 4, 34);
  }

  /* ④ 轮盘水位环:侧视圆 + 26 筒色点(蓝=水量) + 笧槽标记 */
  function drawWheelMap(st, ph, pt, ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    var cx = w * 0.5, cy = h * 0.52, R = Math.min(cx, cy) - 8;
    ctx.strokeStyle = "rgba(233,238,242,0.30)";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = "rgba(233,238,242,0.14)";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(cx, cy, R * 0.91, 0, Math.PI * 2); ctx.stroke();
    /* 水面线(浸深) */
    var wy = cy - (D.waterY - (D.yCenter - D.R)) / (2 * D.R) * 2 * R * 0.5;  // 近似
    var wline = cy + (D.yCenter + D.R - D.waterY) / (2 * D.R) * 2 * R - R;
    ctx.strokeStyle = "rgba(127,196,224,0.5)";
    ctx.setLineDash([4, 3]);
    ctx.beginPath(); ctx.moveTo(cx - R, cy + (D.yCenter - D.waterY) / D.R * R); ctx.lineTo(cx + R, cy + (D.yCenter - D.waterY) / D.R * R); ctx.stroke();
    ctx.setLineDash([]);
    /* 26 筒点 */
    for (var i = 0; i < D.nTubes; i++) {
      var a = MECH.KS.norm(i / D.nTubes * 2 * Math.PI + st.phi);
      var px = cx - Math.sin(a) * R, py = cy + Math.cos(a) * R;
      var lvl = (st.levels[i] || 0) / D.hFull;
      ctx.fillStyle = "rgba(79,163,199," + (0.15 + lvl * 0.85).toFixed(2) + ")";
      ctx.beginPath(); ctx.arc(px, py, 3.6, 0, Math.PI * 2); ctx.fill();
      if (a > D.dumpA0 && a < D.dumpA1) {
        ctx.strokeStyle = "#E9C93C";
        ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.arc(px, py, 5.6, 0, Math.PI * 2); ctx.stroke();
      }
    }
    /* 笧槽标记(+x 侧) */
    ctx.fillStyle = "#B08D57";
    ctx.fillRect(cx + R + 4, cy - 6, 12, 5);
    ctx.fillStyle = soft;
    ctx.font = "600 7.5px Menlo, monospace";
    ctx.textAlign = "left";
    ctx.fillText("笧槽", cx + R + 4, cy - 9);
  }
})(window.MECH = window.MECH || {});
