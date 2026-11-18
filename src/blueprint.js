/* 图纸面板(B 键):筒车正视大轮图 + 竹筒断面详图 + 流量公式 + 尺寸表 */
(function (MECH) {
  var red = "#8C2F1E";

  function arrow(ctx, x1, y1, x2, y2, text, below) {
    ctx.strokeStyle = "rgba(42,38,32,0.4)";
    ctx.fillStyle = "rgba(42,38,32,0.4)";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    var s = 4, dir = x2 >= x1 ? 1 : -1;
    ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x2 - s * dir, y2 - 3); ctx.lineTo(x2 - s * dir, y2 + 3); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1 + s * dir, y1 - 3); ctx.lineTo(x1 + s * dir, y1 + 3); ctx.closePath(); ctx.fill();
    ctx.font = "600 10px Menlo, monospace";
    ctx.textAlign = "center";
    ctx.fillText(text, (x1 + x2) / 2, below ? (y1 + 13) : (y1 - 5));
  }

  MECH.BP = {
    no: "Fig. 02 · 复原总图",
    title: "筒车 · 水轮竹筒自汲(王祯《农书》)",
    src: "王祯《农书》农器图谱 · 筒车卷 · 「随流自有得,加工不假人」",
    draw: function (ctx, w, h) {
      var D = MECH.DIM;
      ctx.clearRect(0, 0, w, h);
      var chainH = 44, chainY = h - chainH - 12, topY = 34;
      var ink = "#2A2620";
      /* 公式横幅 */
      ctx.fillStyle = red;
      ctx.font = "700 11px Menlo, monospace";
      ctx.textAlign = "left";
      ctx.fillText("Q = n·V·ω/2π = 26 × 1.79L × ω/2π  →  ω=0.42: 3.11 L/s · ω=0.62: 4.59 L/s", w * 0.045, topY - 10);

      /* ============ 左:正视大轮(轮平面) ============ */
      var S = Math.min(w * 0.44 / 4.9, (chainY - topY - 24) / 4.9);
      var cx = w * 0.045 + 2.4 * S, cy = chainY - 14 - 2.1 * S;
      ctx.strokeStyle = ink;
      ctx.fillStyle = ink;
      ctx.lineWidth = 1.4;
      ctx.font = "700 11px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("正视 FRONT(顺时针)", w * 0.045, topY + 14);
      /* 水面 */
      var wlY = cy + (D.yCenter - D.waterY) * S;
      ctx.strokeStyle = "rgba(42,38,32,0.45)";
      ctx.setLineDash([6, 4]);
      ctx.beginPath(); ctx.moveTo(cx - D.R * S - 20, wlY); ctx.lineTo(cx + D.R * S + 30, wlY); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(42,38,32,0.55)";
      ctx.font = "600 9px sans-serif";
      ctx.fillText("水面 · 浸深 0.35", cx + D.R * S - 58, wlY + 12);
      /* 轮缘双圈 + 辐条 */
      ctx.beginPath(); ctx.arc(cx, cy, D.R * S, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, cy, (D.R - 0.22) * S, 0, Math.PI * 2); ctx.stroke();
      for (var i = 0; i < 24; i++) {
        var a = i / 24 * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * 0.2 * S, cy + Math.sin(a) * 0.2 * S);
        ctx.lineTo(cx + Math.cos(a) * D.R * S, cy + Math.sin(a) * D.R * S);
        ctx.stroke();
      }
      /* 26 筒(小圆点,口朝向短线) */
      for (var t = 0; t < D.nTubes; t++) {
        var ta = t / D.nTubes * 2 * Math.PI;
        var px = cx - Math.sin(ta) * D.R * S, py = cy + Math.cos(ta) * D.R * S;
        ctx.beginPath(); ctx.arc(px, py, 0.05 * S, 0, Math.PI * 2); ctx.stroke();
        var ax = -Math.cos(ta) * Math.cos(D.tilt), ay = Math.sin(ta) * Math.cos(D.tilt) + Math.sin(D.tilt);
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + ax * 0.2 * S, py - ay * 0.2 * S); ctx.stroke();
      }
      /* 门架 + 笧槽 */
      ctx.strokeRect(cx - 0.12 * S, cy + 0.3 * S, 0.24 * S, (D.yCenter + D.R - 0.3) * S);
      ctx.strokeRect(cx + 0.4 * S, cy - (D.slotY - D.yCenter) * S, D.slotL * S, 0.16 * S);
      ctx.fillText("笧槽", cx + 0.5 * S, cy - (D.slotY - D.yCenter) * S - 4);
      /* 尺寸 */
      arrow(ctx, cx - D.R * S, cy - D.R * S - 12, cx + D.R * S, cy - D.R * S - 12, "轮径 4.2m(径一丈四尺)", false);

      /* ============ 右:竹筒断面详图 ============ */
      var ox = w * 0.56, oy = topY + 40, S2 = Math.min((w - ox - 24) / 2.4, (chainY - oy - 30) / 1.4);
      ctx.font = "700 11px sans-serif";
      ctx.fillStyle = ink;
      ctx.fillText("竹筒详图 TUBE", ox, oy - 10);
      var bcx = ox + 0.7 * S2, bcy = oy + 0.62 * S2;
      /* 底部位置的筒:轴 = (−cos25°, sin25°) */
      var ux = -Math.cos(D.tilt), uy = Math.sin(D.tilt);
      ctx.beginPath();
      ctx.moveTo(bcx + ux * D.tubeL / 2 * S2 + uy * D.tubeR * S2, bcy + uy * D.tubeL / 2 * S2 - ux * D.tubeR * S2);
      ctx.lineTo(bcx - ux * D.tubeL / 2 * S2 + uy * D.tubeR * S2, bcy - uy * D.tubeL / 2 * S2 - ux * D.tubeR * S2);
      ctx.lineTo(bcx - ux * D.tubeL / 2 * S2 - uy * D.tubeR * S2, bcy - uy * D.tubeL / 2 * S2 + ux * D.tubeR * S2);
      ctx.lineTo(bcx + ux * D.tubeL / 2 * S2 - uy * D.tubeR * S2, bcy + uy * D.tubeL / 2 * S2 + ux * D.tubeR * S2);
      ctx.closePath(); ctx.stroke();
      /* 筒内水(满) */
      ctx.fillStyle = "rgba(42,38,32,0.18)";
      ctx.beginPath();
      ctx.moveTo(bcx - ux * D.tubeL / 2 * S2 + uy * D.tubeR * 0.8 * S2, bcy - uy * D.tubeL / 2 * S2 - ux * D.tubeR * 0.8 * S2);
      ctx.lineTo(bcx + ux * (D.tubeL / 2 - D.hFull) * S2 + uy * D.tubeR * 0.8 * S2, bcy + uy * (D.tubeL / 2 - D.hFull) * S2 - ux * D.tubeR * 0.8 * S2);
      ctx.lineTo(bcx + ux * (D.tubeL / 2 - D.hFull) * S2 - uy * D.tubeR * 0.8 * S2, bcy + uy * (D.tubeL / 2 - D.hFull) * S2 + ux * D.tubeR * 0.8 * S2);
      ctx.lineTo(bcx - ux * D.tubeL / 2 * S2 - uy * D.tubeR * 0.8 * S2, bcy - uy * D.tubeL / 2 * S2 + ux * D.tubeR * 0.8 * S2);
      ctx.closePath(); ctx.fill();
      /* 口朝向标注 */
      ctx.fillStyle = ink;
      ctx.beginPath();
      ctx.moveTo(bcx + (ux * 0.42 + 0.18) * S2, bcy + (uy * 0.42 + 0.10) * S2);
      ctx.lineTo(bcx + ux * 0.42 * S2, bcy + uy * 0.42 * S2);
      ctx.lineTo(bcx + (ux * 0.42 + 0.02) * S2, bcy + (uy * 0.42 + 0.16) * S2);
      ctx.stroke();
      ctx.font = "600 9px sans-serif";
      ctx.fillText("口迎水 · 上翘 25°", bcx + 0.5 * S2, bcy - 0.2 * S2);
      ctx.fillStyle = "rgba(42,38,32,0.55)";
      ctx.fillText("口径 0.08 · 长 0.52 · 满水 0.42", ox, oy + 1.25 * S2);
      ctx.fillText("V = π·0.04²·0.42·0.85 = 1.79 L", ox, oy + 1.25 * S2 + 14);

      /* ============ 底部:运转参数链 ============ */
      var boxes = [
        ["水流推轮", "v_w 0.8/1.4 m/s"], ["大轮 26 筒", "R 2.1 · 顺时针"],
        ["底部兜水", "浸深 0.35 · 半角 34°"], ["顶部倾倒", "165°..195° 排空"],
        ["笧槽引水", "入田"], ["流量 Q", "nVω/2π"]
      ];
      var bwid = (w * 0.91) / boxes.length;
      for (var b = 0; b < boxes.length; b++) {
        var bx2 = w * 0.045 + b * bwid;
        ctx.strokeStyle = ink;
        ctx.fillStyle = ink;
        ctx.strokeRect(bx2, chainY, bwid - 10, chainH);
        ctx.font = "700 10px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(boxes[b][0], bx2 + (bwid - 10) / 2, chainY + 17);
        ctx.font = "600 8.5px Menlo, monospace";
        ctx.fillStyle = "rgba(42,38,32,0.55)";
        ctx.fillText(boxes[b][1], bx2 + (bwid - 10) / 2, chainY + 32);
        if (b < boxes.length - 1) {
          ctx.beginPath();
          ctx.moveTo(bx2 + bwid - 10, chainY + 20);
          ctx.lineTo(bx2 + bwid - 2, chainY + 20);
          ctx.stroke();
        }
      }
    },
    table:
      '<h4>轮体尺寸</h4><table>' +
      '<tr><th>大轮</th><td>径一丈四尺 · 双缘 24 辐</td><td>R = 2.10 m</td></tr>' +
      '<tr><th>轮心高</th><td>下缘入水 0.35 m</td><td>y = 2.25 m</td></tr>' +
      '<tr><th>竹筒(×26)</th><td>口径八分 · 长 0.52 · 翘 25°</td><td>等分 13.85°</td></tr>' +
      '<tr><th>笧槽</th><td>长 1.3 · 宽 0.36 · 顶侧承接</td><td>y = 3.72 m</td></tr>' +
      '</table><h4>流量验算</h4><table>' +
      '<tr><th>单筒满水 V</th><td>π·0.04²·0.42·0.85</td><td>1.79 L</td></tr>' +
      '<tr><th>常流 ω</th><td>Q = 26·1.79·0.42/2π</td><td>3.11 L/s</td></tr>' +
      '<tr><th>急流 ω</th><td>Q = 26·1.79·0.62/2π</td><td>4.59 L/s</td></tr>' +
      '<tr><th>倾倒频率</th><td>n·ω/2π(每转 26 次)</td><td>3.4~6.1 次/s</td></tr>' +
      '</table><h4>运行期自检</h4>' +
      '<p>载入即模拟 30s 常速:实测倾倒水量与 Q 公式偏差 > 8% 拒绝启动。</p>' +
      '<p>充水模型:入水边 −34°(浸深半角)、−14° 充满、顶部 165°..195° 线性排空。</p>' +
      '<h4>文献</h4>' +
      '<p>王祯《农书》:筒车「流水转轮,筒自汲水,倾入笧槽,流于亩上」。</p>'
  };
})(window.MECH = window.MECH || {});
