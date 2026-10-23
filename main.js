(function () {
  "use strict";

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  function safe(fn, name) { try { fn(); } catch (e) { console.warn("[" + name + "]", e); } }

  // Textos que genera el JavaScript, en el idioma de la página
  var EN = document.documentElement.lang === "en";
  var T = EN ? {
    copied: "email copied", copyFail: "couldn't copy",
    alta: "Issue", anulacion: "Cancellation", anula: "cancels", importe: "total amount", importeAria: "Total amount of record 1",
    prev: "previous hash", first: "(first record)", huella: "hash",
    badData: "✗ the data no longer matches its stored hash", badLink: "✗ no longer links to the previous record",
    okOfficial: "✓ same as the official example", okNotOriginal: "✓ consistent, but not the original hash",
    allOk: "3/3 match the AEAT", chainOk: "the chain is consistent", broken: "chain broken",
    hint0: "Change the amount of record 1 and see what happens to the chain.",
    hint1: "Record 1 no longer matches its hash. What if someone recalculates it to cover it up?",
    hint2: "Now record 1 is consistent, but record 2 kept the original hash, so the chain breaks there. That's why VeriFactu sends every record to the AEAT right away.",
    flow: ["contact from a form", "message from the website chat", "contact with fields no rule recognises", "contact from a site that isn't a client's"]
  } : {
    copied: "email copiado", copyFail: "no se ha podido copiar",
    alta: "Alta", anulacion: "Anulación", anula: "anula", importe: "importe total", importeAria: "Importe total del registro 1",
    prev: "huella anterior", first: "(primer registro)", huella: "huella",
    badData: "✗ los datos no cuadran con su huella registrada", badLink: "✗ ya no enlaza con el registro anterior",
    okOfficial: "✓ igual que el ejemplo oficial", okNotOriginal: "✓ cuadra, pero no es la huella original",
    allOk: "3/3 iguales a la AEAT", chainOk: "la cadena cuadra", broken: "cadena rota",
    hint0: "Cambia el importe del registro 1 y mira qué pasa con la cadena.",
    hint1: "El registro 1 ya no cuadra con su huella. ¿Y si alguien la recalcula para taparlo?",
    hint2: "Ahora el registro 1 cuadra, pero el 2 guardaba la huella original y la cadena se rompe ahí. Por eso VeriFactu envía cada registro a la AEAT al momento.",
    flow: ["contacto de un formulario", "mensaje desde el chat de la web", "contacto con campos que ninguna regla reconoce", "contacto de una web que no es de ningún cliente"]
  };

  // ---------- Tema claro / oscuro ----------
  function initTheme() {
    var root = document.documentElement;
    var dark = matchMedia("(prefers-color-scheme: dark)");
    $(".theme").addEventListener("click", function () {
      var next = (root.dataset.theme || (dark.matches ? "dark" : "light")) === "dark" ? "light" : "dark";
      root.dataset.theme = next;
      try { localStorage.setItem("tema", next); } catch (e) {}
    });
  }

  // ---------- Nombre: letras en 3D ----------
  var letters = [];
  function initMasthead() {
    $$(".masthead .ln > span").forEach(function (line) {
      var text = line.textContent;
      line.textContent = "";
      Array.prototype.forEach.call(text, function (c) {
        var s = document.createElement("span");
        s.className = "ch";
        s.textContent = c;
        line.appendChild(s);
        letters.push(s);
      });
    });
    requestAnimationFrame(function () { document.body.classList.add("ready"); });
    if (!finePointer) return;

    // Al acercar el puntero, las letras cercanas se levantan y giran hacia él
    var hero = $(".hero");
    hero.addEventListener("pointermove", function (e) {
      letters.forEach(function (l) {
        var r = l.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
        var d = Math.sqrt(dx * dx + dy * dy), f = Math.max(0, 1 - d / 260);
        l.style.setProperty("--tz", (f * 90).toFixed(1) + "px");
        l.style.setProperty("--ty", (-f * 14).toFixed(1) + "px");
        l.style.setProperty("--ry", (clamp(dx / 8, -28, 28) * f).toFixed(1) + "deg");
        l.style.setProperty("--rx", (clamp(-dy / 8, -28, 28) * f).toFixed(1) + "deg");
        l.classList.toggle("hot", f > .55);
      });
    });
    hero.addEventListener("pointerleave", function () {
      letters.forEach(function (l) { ["--tz", "--ty", "--ry", "--rx"].forEach(function (p) { l.style.removeProperty(p); }); l.classList.remove("hot"); });
    });
  }

  // ---------- Pila 3D de proyectos ----------
  var deck;
  function initDeck() {
    deck = $("#deck");
    if (!deck) return;
    var rx = 10, ry = -18, start = null;
    function set(x, y) { deck.style.setProperty("--drx", x.toFixed(1) + "deg"); deck.style.setProperty("--dry", y.toFixed(1) + "deg"); }

    // Ratón: la pila sigue al puntero
    if (finePointer) {
      deck.addEventListener("pointermove", function (e) {
        if (start) return;
        var r = deck.getBoundingClientRect();
        set(10 - ((e.clientY - r.top) / r.height - .5) * 16, -18 + ((e.clientX - r.left) / r.width - .5) * 30);
      });
      deck.addEventListener("pointerleave", function () { if (!start) set(rx, ry); });
    }
    // Arrastrar (dedo o ratón): girar la pila; al soltar vuelve suave
    var moved = false;
    deck.addEventListener("pointerdown", function (e) {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      start = { x: e.clientX, y: e.clientY }; moved = false;
      deck.classList.add("dragging");
    });
    window.addEventListener("pointermove", function (e) {
      if (!start) return;
      var dx = e.clientX - start.x, dy = e.clientY - start.y;
      if (Math.abs(dx) > 6) moved = true;
      set(clamp(rx - dy * .15, -20, 35), clamp(ry + dx * .35, -70, 50));
    });
    window.addEventListener("pointerup", function () {
      if (!start) return;
      start = null; deck.classList.remove("dragging"); set(rx, ry);
    });
    // Si se ha arrastrado, no abrir el enlace de la tarjeta
    deck.addEventListener("click", function (e) { if (moved) { e.preventDefault(); moved = false; } }, true);
  }

  // ---------- Cinta de commits (bucle continuo; se pausa al pasar o tocar) ----------
  function initTicker() {
    var t = $(".ticker"), list = $(".ticker-list");
    if (!t || !list) return;
    var copy = list.cloneNode(true);
    copy.setAttribute("aria-hidden", "true");
    list.parentNode.appendChild(copy);
    t.addEventListener("click", function () { t.classList.toggle("paused"); });
  }

  // ---------- Títulos que suben palabra a palabra ----------
  function initSplit() {
    $$(".sec-head h2, .case h3").forEach(function (h) {
      var words = h.textContent.trim().split(/\s+/);
      h.setAttribute("aria-label", h.textContent.trim());
      h.textContent = "";
      words.forEach(function (w, i) {
        var o = document.createElement("span"); o.className = "w"; o.setAttribute("aria-hidden", "true");
        var inner = document.createElement("span"); inner.textContent = w; inner.style.setProperty("--i", i);
        o.appendChild(inner); h.appendChild(o);
        if (i < words.length - 1) h.appendChild(document.createTextNode(" "));
      });
      h.classList.add("split");
      h.setAttribute("data-in", "");
    });
    $$(".strip").forEach(function (s) { $$("figure", s).forEach(function (f, i) { f.style.setProperty("--i", i); }); });
  }

  // ---------- Aparición al hacer scroll ----------
  function initReveal() {
    var els = $$("[data-in]");
    if (!("IntersectionObserver" in window)) { els.forEach(function (e) { e.classList.add("in"); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { threshold: 0.01, rootMargin: "0px 0px -6% 0px" });
    els.forEach(function (e) { io.observe(e); });
    setTimeout(function () { $$("[data-in]:not(.in)").forEach(function (e) { if (e.getBoundingClientRect().top < innerHeight) e.classList.add("in"); }); }, 4000);
  }

  // ---------- Contadores que suben al verse ----------
  function initCounters() {
    var els = $$("[data-count]");
    if (!els.length || !("IntersectionObserver" in window) || reduced) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        var el = en.target, to = +el.dataset.count, t0 = performance.now(), dur = 1200;
        (function step(now) {
          var p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(e * to);
          if (p < 1) requestAnimationFrame(step);
        })(t0);
      });
    }, { threshold: 0.5 });
    els.forEach(function (e) { e.textContent = "0"; io.observe(e); });
  }

  // ---------- Tiras de capturas: giro 3D al deslizar ----------
  function initStrips() {
    $$(".strip").forEach(function (strip) {
      var figs = $$("figure > button, figure > video", strip);
      function update() {
        var r = strip.getBoundingClientRect(), mid = r.left + r.width / 2;
        figs.forEach(function (b) {
          var fr = b.getBoundingClientRect();
          var d = clamp(((fr.left + fr.width / 2) - mid) / r.width, -1, 1);
          b.style.setProperty("--fy", (-d * 16).toFixed(2) + "deg");
          b.style.setProperty("--fs", (1 - Math.abs(d) * .06).toFixed(3));
        });
      }
      strip.addEventListener("scroll", function () { requestAnimationFrame(update); }, { passive: true });
      window.addEventListener("resize", update);
      update();
    });
  }

  // ---------- Un solo bucle para todo lo que depende del scroll vertical ----------
  function initScroll() {
    var bar = $("#progress"), lab = $("#lab"), ticking = false;
    function update() {
      ticking = false;
      var y = window.scrollY, vh = innerHeight, max = document.documentElement.scrollHeight - vh;
      if (bar) bar.style.setProperty("--p", max > 0 ? (y / max).toFixed(4) : 0);
      var h = clamp(y / (vh * .9), 0, 1);
      if (deck) deck.style.setProperty("--spread", h.toFixed(3));
      // Las letras del nombre se separan en profundidad al bajar
      if (!reduced && h < 1) letters.forEach(function (l, i) {
        if (l.matches(":hover")) return;
        l.style.transform = h > 0 ? "translate3d(0," + (-h * (20 + (i % 4) * 22)).toFixed(1) + "px," + (h * (i % 3) * 40).toFixed(1) + "px) rotateX(" + (h * 25).toFixed(1) + "deg)" : "";
      });
      if (lab) {
        var r = lab.getBoundingClientRect();
        lab.style.setProperty("--lp", clamp((vh - r.top) / (vh * .6), 0, 1).toFixed(3));
      }
    }
    window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  // ---------- Visor de capturas ----------
  function initViewer() {
    var visor = $("#visor");
    if (!visor || typeof visor.showModal !== "function") return;
    var img = document.createElement("img");
    var cap = $("p", visor);
    visor.insertBefore(img, cap);
    $$("[data-zoom]").forEach(function (b) {
      b.addEventListener("click", function () {
        var src = $("img", b);
        img.src = src.currentSrc || src.src; img.alt = src.alt;
        cap.textContent = b.parentElement.querySelector("figcaption").textContent;
        visor.showModal();
      });
    });
    $(".close", visor).addEventListener("click", function () { visor.close(); });
    visor.addEventListener("click", function (e) { if (e.target === visor) visor.close(); });
  }

  // ---------- Copiar el email ----------
  function initCopy() {
    var btn = $("#copy"), out = $("#copied");
    if (!btn || !navigator.clipboard) return;
    btn.hidden = false;
    btn.addEventListener("click", function () {
      navigator.clipboard.writeText("alejandrocorral509@gmail.com").then(function () {
        out.textContent = T.copied;
        setTimeout(function () { out.textContent = ""; }, 2500);
      }, function () { out.textContent = T.copyFail; });
    });
  }

  // ---------- Motor VeriFactu en vivo ----------
  // Datos: los 3 casos del documento oficial de la AEAT (los mismos que usan los tests del repo).
  function initLab() {
    var V = window.Verifactu;
    var box = $("#regs");
    if (!V || !box || !(window.crypto && crypto.subtle)) return;

    var OFICIAL = [
      "3C464DAF61ACB827C65FDA19F352A4E3BDC2C640E9E9FC4CC058073F38F12F60",
      "F7B94CFD8924EDFF273501B01EE5153E4CE8F259766F88CF6ACB8935802A2B97",
      "177547C0D57AC74748561D054A9CEC14B4C4EA23D1BEFD6F2E69E3A388F90C68"
    ];
    function originales() {
      return [
        { clase: "alta", nif: "89890001K", numSerie: "12345678/G33", fecha: "01-01-2024", tipo: "F1", cuotaTotal: "12.35", importeTotal: "123.45", huellaAnterior: "", fechaHoraGen: "2024-01-01T19:20:30+01:00", huella: OFICIAL[0] },
        { clase: "alta", nif: "89890001K", numSerie: "12345679/G34", fecha: "01-01-2024", tipo: "F1", cuotaTotal: "12.35", importeTotal: "123.45", huellaAnterior: OFICIAL[0], fechaHoraGen: "2024-01-01T19:20:35+01:00", huella: OFICIAL[1] },
        { clase: "anulacion", nif: "89890001K", numSerie: "12345679/G34", fecha: "01-01-2024", huellaAnterior: OFICIAL[1], fechaHoraGen: "2024-01-01T19:20:40+01:00", huella: OFICIAL[2] }
      ];
    }
    var regs = originales();
    var state = $("#lab-state"), hint = $("#lab-hint"), cover = $("#lab-cover"), reset = $("#lab-reset");

    box.innerHTML = regs.map(function (r, i) {
      var importe = r.clase === "anulacion"
        ? "<dt>" + T.anula + "</dt><dd>" + r.numSerie + "</dd>"
        : "<dt>" + T.importe + "</dt><dd>" + (i === 0
            ? '<span class="amount"><input id="importe-1" type="text" inputmode="decimal" autocomplete="off" spellcheck="false" value="' + r.importeTotal + '" aria-label="' + T.importeAria + '"> €</span>'
            : r.importeTotal + " €") + "</dd>";
      return '<div class="reg" data-i="' + i + '">' +
        '<div class="reg-top"><span class="mono muted">#' + (i + 1) + '</span><b>' + (r.clase === "alta" ? T.alta : T.anulacion) + '</b>' +
        '<span class="mono">' + r.numSerie + '</span><span class="check" aria-live="polite"></span></div>' +
        '<dl class="kv">' + importe +
        '<dt>' + T.prev + '</dt><dd class="prev">' + (r.huellaAnterior || T.first) + '</dd>' +
        '<dt>' + T.huella + '</dt><dd class="hash"></dd></dl></div>';
    }).join("");

    var cells = $$(".reg", box);
    var lastHash = ["", "", ""], wasBad = [false, false, false];

    // Efecto de "cálculo": los caracteres se resuelven hasta la huella real
    function showHash(el, value, i) {
      if (reduced || lastHash[i] === value) { el.textContent = value; lastHash[i] = value; return; }
      lastHash[i] = value;
      var HEX = "0123456789ABCDEF", t0 = performance.now(), dur = 420;
      el.classList.add("changing");
      (function frame(now) {
        var p = Math.min(1, (now - t0) / dur), fixed = Math.floor(p * value.length), out = value.slice(0, fixed);
        for (var k = fixed; k < value.length; k++) out += HEX[(Math.random() * 16) | 0];
        el.textContent = out;
        if (p < 1 && lastHash[i] === value) requestAnimationFrame(frame);
        else { el.textContent = lastHash[i]; el.classList.remove("changing"); }
      })(t0);
    }

    function render() {
      return Promise.all(regs.map(function (r) { return V.calcularHuella(r); })).then(function (calc) {
        return V.verificarCadena(regs).then(function (res) {
          var todoOk = true, igualesOficial = 0;
          res.forEach(function (v, i) {
            var cell = cells[i], check = $(".check", cell);
            showHash($(".hash", cell), calc[i], i);
            $(".prev", cell).textContent = regs[i].huellaAnterior || T.first;
            if (calc[i] === OFICIAL[i]) igualesOficial++;
            cell.classList.toggle("bad", !v.ok);
            if (!v.ok && !wasBad[i] && !reduced) { cell.classList.remove("shake"); void cell.offsetWidth; cell.classList.add("shake"); }
            wasBad[i] = !v.ok;
            check.classList.toggle("bad", !v.ok);
            if (!v.huellaOk) check.textContent = T.badData;
            else if (!v.enlaceOk) check.textContent = T.badLink;
            else check.textContent = calc[i] === OFICIAL[i] ? T.okOfficial : T.okNotOriginal;
            if (!v.ok) todoOk = false;
          });
          var tocado = regs[0].importeTotal !== "123.45";
          state.classList.toggle("bad", !todoOk);
          state.textContent = todoOk ? (igualesOficial === 3 ? T.allOk : T.chainOk) : T.broken;
          cover.hidden = !(tocado && !res[0].huellaOk);
          reset.hidden = !tocado && regs[0].huella === OFICIAL[0];
          if (!tocado) hint.textContent = T.hint0;
          else if (!res[0].huellaOk) hint.textContent = T.hint1;
          else hint.textContent = T.hint2;
        });
      });
    }

    var input = $("#importe-1"), timer;
    input.addEventListener("input", function () {
      clearTimeout(timer);
      timer = setTimeout(function () {
        regs[0].importeTotal = input.value.trim();
        regs[0].huella = OFICIAL[0];   // la huella registrada no cambia: eso es lo que delata el cambio
        render();
      }, 140);
    });
    cover.addEventListener("click", function () {
      V.calcularHuella(regs[0]).then(function (h) { regs[0].huella = h; render(); });
    });
    reset.addEventListener("click", function () { regs = originales(); input.value = "123.45"; render(); });
    render();
  }

  // ---------- Vídeos: se reproducen en silencio solo mientras se ven; al tocarlos, pausa ----------
  function initVideos() {
    var vids = $$(".strip video");
    if (!vids.length) return;
    if (reduced || !("IntersectionObserver" in window)) {
      vids.forEach(function (v) { v.controls = true; v.preload = "metadata"; });
      return;
    }
    var manual = new WeakSet();
    function mark(v) { v.parentElement.classList.toggle("paused", v.paused); }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var v = en.target;
        if (en.isIntersecting && en.intersectionRatio >= 0.55 && !manual.has(v)) {
          var p = v.play(); if (p && p.catch) p.catch(function () { v.controls = true; });
        } else if (!en.isIntersecting || en.intersectionRatio < 0.55) v.pause();
      });
    }, { threshold: [0, 0.55] });
    vids.forEach(function (v) {
      v.addEventListener("play", function () { mark(v); });
      v.addEventListener("pause", function () { mark(v); });
      v.addEventListener("click", function () {
        if (v.paused) { manual.delete(v); v.play(); } else { manual.add(v); v.pause(); }
      });
      io.observe(v);
    });
  }

  // ---------- Estadísticas sin cookies (GoatCounter) ----------
  // Se activa poniendo el código de la cuenta en <body data-goatcounter="CODIGO">.
  // Cuenta visitas y los clics marcados con data-goatcounter-click; no guarda datos personales.
  function initStats() {
    var code = (document.body.dataset.goatcounter || "").trim();
    if (!/^[a-z0-9-]+$/.test(code)) return;
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://gc.zgo.at/count.js";
    s.dataset.goatcounter = "https://" + code + ".goatcounter.com/count";
    document.head.appendChild(s);
  }

  // ---------- QR de la web: para que lo escaneen desde mi móvil ----------
  function initQR() {
    var d = $("#qr");
    if (!d || typeof d.showModal !== "function") return;
    $$(".qr-open").forEach(function (b) { b.addEventListener("click", function () { d.showModal(); }); });
    $("[data-close]", d).addEventListener("click", function () { d.close(); });
    d.addEventListener("click", function (e) { if (e.target === d) d.close(); });
  }

  // ---------- Diagrama del centralizador: un contacto de ejemplo recorre el sistema ----------
  function initFlow() {
    var flow = $("#flow");
    if (!flow) return;
    var srcs = $$(".flow-src", flow), rules = $$(".rules li", flow),
        ok = $('[data-dest="ok"]', flow), unk = $('[data-dest="unk"]', flow), label = $("#flow-lead");
    // src: de dónde llega; hit: regla que lo identifica (0 = ninguna)
    var EJEMPLOS = [
      { txt: T.flow[0], src: 0, hit: 1 },
      { txt: T.flow[1], src: 1, hit: 1 },
      { txt: T.flow[2], src: 0, hit: 2 },
      { txt: T.flow[3], src: 0, hit: 0 }
    ];
    var i = 0, timers = [];
    function clear() {
      timers.forEach(clearTimeout); timers = [];
      srcs.concat(rules, [ok, unk]).forEach(function (el) { el.classList.remove("on", "miss"); });
    }
    function at(ms, fn) { timers.push(setTimeout(fn, reduced ? 0 : ms)); }
    function play() {
      clear();
      var e = EJEMPLOS[i % EJEMPLOS.length]; i++;
      label.textContent = e.txt;
      srcs[e.src].classList.add("on");
      var last = e.hit || rules.length;
      for (var r = 1; r <= last; r++) (function (r) {
        at(500 * r, function () {
          if (r > 1) rules[r - 2].classList.replace("on", "miss");
          rules[r - 1].classList.add("on");
          if (!e.hit && r === last) at(450, function () { rules[r - 1].classList.replace("on", "miss"); });
        });
      })(r);
      at(500 * last + 600, function () { (e.hit ? ok : unk).classList.add("on"); });
    }
    // Solo se anima mientras se ve
    var loop = null;
    function start() { if (!loop) { play(); loop = setInterval(play, 3600); } }
    function stop() { clearInterval(loop); loop = null; }
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (en) { en[0].isIntersecting ? start() : stop(); }, { threshold: 0.2 }).observe(flow);
    } else start();
  }

  function boot() {
    safe(initTheme, "theme");
    safe(initMasthead, "masthead");
    safe(initDeck, "deck");
    safe(initTicker, "ticker");
    safe(initSplit, "split");
    safe(initReveal, "reveal");
    safe(initCounters, "counters");
    safe(initStrips, "strips");
    safe(initScroll, "scroll");
    safe(initViewer, "viewer");
    safe(initCopy, "copy");
    safe(initLab, "lab");
    safe(initFlow, "flow");
    safe(initQR, "qr");
    safe(initStats, "stats");
    safe(initVideos, "videos");
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
