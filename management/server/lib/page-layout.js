/**
 * Ultimul pas înaintea PDF-ului (și a imaginilor de pagină), rulat în pagina Chromium a serverului
 * cu `page.evaluate`, după încărcarea HTML-ului paginat: `.pg` = pagina A4, `.pc` = zona de text,
 * `.ftr` = footerul. Scripturile documentului sunt dezactivate; rulează doar acesta. Fișierul e o
 * singură expresie (o funcție), citită ca text de `pdf.ts`.
 *
 * 1. La semnare, locurile de semnare ale Beneficiarului primesc semnătura desenată, numele și data:
 *    coloana BENEFICIAR din tabelele PRESTATOR/BENEFICIAR (fără modelul gol de proces-verbal din
 *    contract) și acceptarea expresă a clauzelor („Beneficiar – semnătura … :”). Semnătura crește
 *    doar cât spațiu liber are pagina, ca textul să nu coboare spre footer.
 * 2. Garanția de pagină: conținutul fiecărei pagini se termină la limita zonei de text, deasupra
 *    footerului. Paginarea se face în browserul celui care generează documentul; alt sistem randează
 *    fontul puțin diferit, iar o pagină poate ieși mai lungă aici. O astfel de pagină e micșorată
 *    uniform cât să încapă (de obicei sub 2%, invizibil), pe toată lățimea zonei de text.
 * 3. La semnare, pe fiecare pagină, între text și footer: semnătura, numele semnatarului și data.
 *
 * Întoarce un raport: paginile micșorate, locurile semnate și paginile marcate.
 */
(async function esaPageLayout(opts) {
  "use strict";

  const MM = 96 / 25.4;
  const report = { fitted: [], spots: 0, marks: 0 };
  const pages = Array.from(document.querySelectorAll(".pg"));
  const contentOf = (pg) => pg.querySelector(":scope > .pc");
  const footerOf = (pg) => pg.querySelector(":scope > .ftr");

  /** Limita de jos a textului pe pagină (px, ca `getBoundingClientRect`). */
  function limitOf(pg) {
    let limit = contentOf(pg).getBoundingClientRect().top + opts.limitMm * MM;
    const ftr = footerOf(pg);
    if (ftr) limit = Math.min(limit, ftr.getBoundingClientRect().top - opts.gapMm * MM);
    return limit;
  }

  /** Cât de jos și cât de la dreapta ajunge ce se vede din `.pc`: elementele și textul lor. */
  function extentOf(pc) {
    let bottom = -Infinity;
    let right = -Infinity;
    const add = (rect) => {
      if (rect.width <= 0 && rect.height <= 0) return;
      if (rect.bottom > bottom) bottom = rect.bottom;
      if (rect.right > right) right = rect.right;
    };
    for (const el of pc.querySelectorAll("*")) add(el.getBoundingClientRect());
    const range = document.createRange();
    range.selectNodeContents(pc);
    for (const rect of range.getClientRects()) add(rect);
    return { bottom, right };
  }

  const fitsPage = (pg) => extentOf(contentOf(pg)).bottom <= limitOf(pg) + 0.25;

  /* ---------- 1. semnătura Beneficiarului ---------- */

  /**
   * Semnătura desenată, decupată la ce s-a desenat și cu fundalul transparent. Punctele izolate
   * (atingeri scăpate pe pad) nu lărgesc decupajul. `null` dacă imaginea nu se poate citi.
   */
  async function inkOf(src) {
    try {
      const img = new Image();
      img.src = src;
      await img.decode();
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      if (!w || !h) return null;
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      const px = ctx.getImageData(0, 0, w, h).data;

      // Cerneala: cât de închis e pixelul față de fundalul alb (sau cât de opac, pe fundal transparent).
      const ink = new Float32Array(w * h);
      for (let i = 0; i < w * h; i += 1) {
        const k = i * 4;
        const lum = (0.299 * px[k] + 0.587 * px[k + 1] + 0.114 * px[k + 2]) / 255;
        ink[i] = (px[k + 3] / 255) * (1 - lum);
      }

      // Grilă grosieră și componente conexe (cu toleranță de câteva celule între trăsături).
      const cell = Math.max(2, Math.ceil(Math.max(w, h) / 160));
      const gw = Math.ceil(w / cell);
      const gh = Math.ceil(h / cell);
      const mass = new Float32Array(gw * gh);
      for (let y = 0; y < h; y += 1) {
        for (let x = 0; x < w; x += 1) {
          const v = ink[y * w + x];
          if (v > 0.2) mass[((y / cell) | 0) * gw + ((x / cell) | 0)] += v;
        }
      }
      const label = new Int32Array(gw * gh).fill(-1);
      const totals = [];
      const R = 3;
      for (let start = 0; start < gw * gh; start += 1) {
        if (!mass[start] || label[start] >= 0) continue;
        const id = totals.length;
        let total = 0;
        const stack = [start];
        label[start] = id;
        while (stack.length) {
          const c = stack.pop();
          total += mass[c];
          const cx = c % gw;
          const cy = (c / gw) | 0;
          for (let dy = -R; dy <= R; dy += 1) {
            for (let dx = -R; dx <= R; dx += 1) {
              const nx = cx + dx;
              const ny = cy + dy;
              if (nx < 0 || ny < 0 || nx >= gw || ny >= gh) continue;
              const n = ny * gw + nx;
              if (mass[n] && label[n] < 0) {
                label[n] = id;
                stack.push(n);
              }
            }
          }
        }
        totals.push(total);
      }
      if (!totals.length) return null;

      const biggest = Math.max(...totals);
      let x0 = gw;
      let y0 = gh;
      let x1 = -1;
      let y1 = -1;
      for (let c = 0; c < gw * gh; c += 1) {
        if (label[c] < 0 || totals[label[c]] < biggest * 0.04) continue;
        const cx = c % gw;
        const cy = (c / gw) | 0;
        if (cx < x0) x0 = cx;
        if (cx > x1) x1 = cx;
        if (cy < y0) y0 = cy;
        if (cy > y1) y1 = cy;
      }
      const left = Math.max(0, (x0 - 1) * cell);
      const top = Math.max(0, (y0 - 1) * cell);
      const cw = Math.min(w, (x1 + 2) * cell) - left;
      const ch = Math.min(h, (y1 + 2) * cell) - top;

      // Decupajul, cu cerneala închisă a padului (#1d1d1f) și transparență după intensitate.
      const out = document.createElement("canvas");
      out.width = cw;
      out.height = ch;
      const octx = out.getContext("2d");
      const data = octx.createImageData(cw, ch);
      for (let y = 0; y < ch; y += 1) {
        for (let x = 0; x < cw; x += 1) {
          const k = (y * cw + x) * 4;
          data.data[k] = 29;
          data.data[k + 1] = 29;
          data.data[k + 2] = 31;
          data.data[k + 3] = Math.min(255, Math.round((ink[(top + y) * w + left + x] * 255) / 0.885));
        }
      }
      octx.putImageData(data, 0, 0);
      return { url: out.toDataURL("image/png"), ratio: cw / ch };
    } catch {
      return null;
    }
  }

  /** Celula, sau blocul unic din ea (un `<p>`/`<div>` care ține toate rândurile). */
  function hostOf(cell) {
    let host = cell;
    for (;;) {
      const only = host.children.length === 1 ? host.firstElementChild : null;
      const loose = Array.from(host.childNodes).some((n) => n.nodeType === 3 && n.data.trim());
      if (!only || loose || !/^(P|DIV)$/.test(only.tagName)) return host;
      host = only;
    }
  }

  /** Rândurile unei celule: nodurile dintre `<br>`-uri, fără rândurile goale. */
  function linesOf(host) {
    const lines = [[]];
    for (const node of Array.from(host.childNodes)) {
      if (node.nodeType === 1 && node.tagName === "BR") lines.push([]);
      else lines[lines.length - 1].push(node);
    }
    return lines.filter((nodes) => nodes.some((n) => (n.textContent || "").trim() || n.nodeType === 1));
  }

  /** Înlocuiește un rând cu `eticheta valoare`, în același loc (între aceleași `<br>`-uri). */
  function setLine(nodes, label, value) {
    const parent = nodes[0].parentNode;
    const anchor = nodes[nodes.length - 1].nextSibling;
    for (const node of nodes) node.remove();
    parent.insertBefore(document.createTextNode(`${label} `), anchor);
    parent.insertBefore(value, anchor);
  }

  /** Imaginea semnăturii, ca element al unui loc de semnare. */
  function sigImage(ink, css) {
    const img = document.createElement("img");
    img.alt = "Semnătura Beneficiarului";
    img.src = ink.url;
    img.style.cssText = css;
    return img;
  }

  /**
   * Locul din celulă: o ancoră inline după „Semnătura: ”, cât un rând de text, cu imaginea
   * poziționată absolut față de ea. Imaginea folosește spațiul liber din celulă (rândurile goale
   * din jur), deci etichetele rămân la aceeași înălțime ca în coloana PRESTATOR.
   */
  function cellSpot(cell, ink) {
    const anchor = document.createElement("span");
    anchor.className = "esa-sig";
    anchor.style.cssText = "display:inline-block;position:relative;width:0;vertical-align:top;line-height:0";
    const img = sigImage(ink, "position:absolute;left:0.8mm;top:0;display:block;object-fit:contain;object-position:left center");
    anchor.appendChild(img);
    return { kind: "cell", el: anchor, cell, img };
  }

  /** Locul din text (acceptarea clauzelor): o casetă inline cu imaginea, crescută cât permite pagina. */
  function inlineSpot(ink) {
    const box = document.createElement("span");
    box.className = "esa-sig";
    box.style.cssText = "display:inline-block;vertical-align:middle;line-height:0;text-indent:0";
    box.appendChild(sigImage(ink, "display:block;width:100%;height:100%;object-fit:contain;object-position:left center"));
    return { kind: "inline", el: box };
  }

  /** Celula BENEFICIAR: „Prin:” primește numele (și funcția), „Semnătura:” imaginea, „Data:” goală data. */
  function signCell(cell, sign, ink, spots) {
    const who = sign.role ? `${sign.name}, ${sign.role}` : sign.name;
    for (const nodes of linesOf(hostOf(cell))) {
      const text = nodes.map((n) => n.textContent || "").join("").replace(/\s+/g, " ").trim();
      const labels = text.match(/(Prin|Semn[ăa]tura|Data)\s*:/gi) || [];
      if (labels.length !== 1 || !/^(Prin|Semn[ăa]tura|Data)\s*:/i.test(text)) continue;
      const label = text.slice(0, text.indexOf(":") + 1);
      if (/^Prin/i.test(label)) {
        setLine(nodes, label, document.createTextNode(who));
      } else if (/^Semn/i.test(label)) {
        if (!ink) continue;
        const spot = cellSpot(cell, ink);
        setLine(nodes, label, spot.el);
        spots.push(spot);
      } else if (/^Data\s*:\s*(conform certificatului|[.…_\s]*)$/i.test(text)) {
        setLine(nodes, label, document.createTextNode(sign.date));
      }
    }
  }

  /** Punctele de la finalul paragrafului de acceptare devin semnătura. */
  function signAcceptance(p, ink, spots) {
    const walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
    let last = null;
    for (let node = walker.nextNode(); node; node = walker.nextNode()) if (node.data.trim()) last = node;
    const dots = last && /[.…_]{3,}\s*$/.exec(last.data);
    if (!dots) return;
    const spot = inlineSpot(ink);
    const parent = last.parentNode;
    if (parent !== p && parent.childNodes.length === 1 && /^[.…_\s]+$/.test(parent.textContent || "")) {
      parent.replaceWith(spot.el);
    } else {
      last.splitText(dots.index).replaceWith(spot.el);
    }
    spots.push(spot);
  }

  /** Înălțimea unui rând de text din elementul dat (fără să-l schimbe). */
  function lineOf(el) {
    const probe = document.createElement("span");
    probe.textContent = "Ag";
    el.appendChild(probe);
    const h = probe.getBoundingClientRect().height;
    probe.remove();
    return h || 12;
  }

  /** Lățimea maximă și proporția: înălțimea `h` scade dacă semnătura ar ieși prea lată. */
  function sizeFor(h, maxWidth, ink) {
    const height = Math.min(h, maxWidth / ink.ratio);
    return { height, width: height * ink.ratio };
  }

  /**
   * Banda liberă din celulă în jurul rândului ancorei: de sub textul de deasupra până la textul de
   * dedesubt (doar textul contează; rândurile goale dintre `<br>`-uri sunt spațiu liber).
   */
  function bandOf(spot, lineH) {
    const { cell, el } = spot;
    const a = el.getBoundingClientRect();
    const c = cell.getBoundingClientRect();
    const cs = getComputedStyle(cell);
    let top = c.top + parseFloat(cs.borderTopWidth) + parseFloat(cs.paddingTop) / 2;
    let bottom = c.bottom - parseFloat(cs.borderBottomWidth) - parseFloat(cs.paddingBottom) / 2;
    const walker = document.createTreeWalker(cell, NodeFilter.SHOW_TEXT);
    const range = document.createRange();
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (!node.data.trim()) continue;
      range.selectNodeContents(node);
      for (const r of range.getClientRects()) {
        if (r.width <= 0 || r.height <= 0) continue;
        if (r.bottom <= a.top + 0.5) top = Math.max(top, r.bottom);
        else if (r.top >= a.top + lineH - 0.5) bottom = Math.min(bottom, r.top);
      }
    }
    const right = c.right - parseFloat(cs.borderRightWidth) - parseFloat(cs.paddingRight);
    return { top, bottom, left: a.left, right };
  }

  /** Așază semnătura dintr-o celulă: în banda liberă; dacă e prea joasă, rândul crește cât permite pagina. */
  function placeCellSpot(spot, pg, ink, target) {
    const GAP = 0.6 * MM;
    const lineH = lineOf(spot.cell);
    spot.el.style.height = `${lineH}px`;
    let band = bandOf(spot, lineH);
    const room = () => band.bottom - band.top - 2 * GAP;

    // Banda aproape suficientă (ex. rândurile goale din jurul semnăturii, în anexe) se folosește ca atare:
    // rândul nu crește, iar etichetele rămân exact la înălțimea celor din coloana PRESTATOR.
    if (room() < target * 0.8 && fitsPage(pg)) {
      // Rândul etichetei crește în jos (cu tot ce urmează în celulă), doar cât spațiu liber are pagina.
      let lo = 0;
      let hi = target - room();
      spot.el.style.height = `${lineH + hi}px`;
      if (!fitsPage(pg)) {
        for (let step = 0; step < 8; step += 1) {
          const mid = (lo + hi) / 2;
          spot.el.style.height = `${lineH + mid}px`;
          if (fitsPage(pg)) lo = mid;
          else hi = mid;
        }
        spot.el.style.height = `${lineH + lo}px`;
      }
      band = bandOf(spot, lineH);
    }

    const a = spot.el.getBoundingClientRect();
    const maxWidth = Math.min(opts.sign.maxWidthMm * MM, band.right - a.left - 1.6 * MM);
    const { height, width } = sizeFor(Math.max(lineH, Math.min(target, room())), maxWidth, ink);
    const center = a.top + lineH / 2;
    const top = Math.min(Math.max(center - height / 2, band.top + GAP), band.bottom - GAP - height);
    Object.assign(spot.img.style, { top: `${top - a.top}px`, width: `${width}px`, height: `${height}px` });
  }

  /** Așază semnătura din text: caseta inline crește până la înălțimea dorită, cât permite pagina. */
  function placeInlineSpot(spot, pg, ink, target) {
    const lineH = lineOf(spot.el.parentNode);
    const maxWidth = opts.sign.maxWidthMm * MM;
    const set = (h) => {
      const { height, width } = sizeFor(h, maxWidth, ink);
      spot.el.style.height = `${height}px`;
      spot.el.style.width = `${width}px`;
    };
    set(target);
    if (fitsPage(pg)) return;
    let lo = lineH;
    let hi = target;
    for (let step = 0; step < 8; step += 1) {
      const mid = (lo + hi) / 2;
      set(mid);
      if (fitsPage(pg)) lo = mid;
      else hi = mid;
    }
    set(lo);
  }

  async function applySignature(sign) {
    const ink = await inkOf(sign.png);
    const spots = [];

    // Tabelele PRESTATOR/BENEFICIAR, în ordinea documentului; titlul curent decide dacă e doar un model.
    let heading = "";
    for (const el of document.querySelectorAll(".pg .pc h1, .pg .pc h2, .pg .pc h3, .pg .pc table")) {
      if (el.tagName !== "TABLE") {
        heading = el.textContent || "";
        continue;
      }
      if (/model de proces-verbal/i.test(heading)) continue;
      const head = el.rows[0];
      if (!head) continue;
      const names = Array.from(head.cells).map((c) => (c.textContent || "").toUpperCase());
      const col = names.findIndex((t) => /\bBENEFICIAR\b/.test(t));
      if (col < 0 || !names.some((t) => /\bPRESTATOR\b/.test(t))) continue;
      for (const row of Array.from(el.rows).slice(1)) {
        const cell = row.cells[col];
        if (cell) signCell(cell, sign, ink, spots);
      }
    }

    // Acceptarea expresă a clauzelor (art. 1203 C. civ.): „Beneficiar – semnătura … : …………”.
    if (ink) {
      for (const p of document.querySelectorAll(".pg .pc p")) {
        if (/Beneficiar\b[^:]*semn[ăa]tur[^:]*:\s*[.…_]{3,}\s*$/i.test(p.textContent || "")) signAcceptance(p, ink, spots);
      }
    }
    report.spots = spots.length;
    if (!ink) return null;

    // Întâi toate locurile cât un rând de text (nu schimbă paginile), apoi fiecare, în ordine,
    // ia cât îi trebuie din spațiul liber al paginii lui, până la înălțimea dorită.
    for (const spot of spots) {
      if (spot.kind === "cell") spot.el.style.height = `${lineOf(spot.cell)}px`;
      else {
        const { height, width } = sizeFor(lineOf(spot.el.parentNode), opts.sign.maxWidthMm * MM, ink);
        spot.el.style.height = `${height}px`;
        spot.el.style.width = `${width}px`;
      }
    }
    const target = opts.sign.heightMm * MM;
    for (const spot of spots) {
      const pg = spot.el.closest(".pg");
      if (!pg || !contentOf(pg)) continue;
      if (spot.kind === "cell") placeCellSpot(spot, pg, ink, target);
      else placeInlineSpot(spot, pg, ink, target);
    }
    return ink;
  }

  /* ---------- 2. nimic peste footer ---------- */

  function fit(pg, index) {
    const pc = contentOf(pg);
    const box = pc.getBoundingClientRect();
    const limit = limitOf(pg);
    let ext = extentOf(pc);
    if (ext.bottom === -Infinity) return;
    const over = ext.bottom - limit;
    const wide = ext.right - box.right;
    if (over <= 0.5 && wide <= 0.5) return;

    // Lățimea zonei de text rămâne aceeași: conținutul se așază pe o lățime mărită cu 1/scale,
    // apoi se micșorează. Doar conținutul mai lat decât zona (rar) se micșorează fără relayout.
    let scale = 1;
    pc.style.transformOrigin = "0 0";
    for (let step = 0; step < 6; step += 1) {
      const factor = Math.min(
        (limit - box.top) / (ext.bottom - box.top),
        box.width / (ext.right - box.left),
      );
      if (factor >= 1 && step > 0) break;
      scale *= Math.min(1, factor) * 0.999;
      pc.style.transform = `scale(${scale})`;
      if (wide <= 0.5) {
        pc.style.right = "auto";
        pc.style.width = `${box.width / scale}px`;
      }
      ext = extentOf(pc);
      if (ext.bottom <= limit + 0.25 && ext.right <= box.right + 0.5) break;
    }
    report.fitted.push({
      page: index + 1,
      scale: Math.round(scale * 10000) / 10000,
      overMm: Math.round((over / MM) * 10) / 10,
    });
  }

  /* ---------- 3. semnătura pe fiecare pagină ---------- */

  function mark(pg, sign, ink) {
    const ftr = footerOf(pg);
    if (!contentOf(pg) || !ftr) return;
    const page = pg.getBoundingClientRect();
    const foot = ftr.getBoundingClientRect();
    const h = opts.sign.markMm * MM;

    const el = document.createElement("div");
    el.className = "esa-sign-mark";
    el.style.cssText = [
      "position:absolute",
      `right:${page.right - foot.right}px`,
      `top:${foot.top - page.top - h - 1.2 * MM}px`,
      `height:${h}px`,
      "display:flex",
      "align-items:center",
      "gap:2.2mm",
      "font-size:6.6pt",
      "line-height:1.3",
      "color:#555",
      "text-align:right",
      "white-space:nowrap",
    ].join(";");

    const caption = document.createElement("div");
    const name = document.createElement("b");
    name.style.color = "#111";
    name.textContent = sign.name;
    caption.append("Semnat electronic de Beneficiar", document.createElement("br"), name, ` · ${sign.date}`);
    el.appendChild(caption);

    if (ink) {
      const img = document.createElement("img");
      img.alt = "";
      img.src = ink.url;
      img.style.cssText = `display:block;height:${h}px;width:${Math.min(opts.sign.markWidthMm * MM, h * ink.ratio)}px;object-fit:contain;object-position:right center`;
      el.appendChild(img);
    }
    pg.appendChild(el);
    report.marks += 1;
  }

  const ink = opts.sign ? await applySignature(opts.sign) : null;
  pages.forEach((pg, index) => {
    if (contentOf(pg)) fit(pg, index);
  });
  if (opts.sign) for (const pg of pages) mark(pg, opts.sign, ink);

  await Promise.all(Array.from(document.images).map((img) => img.decode().catch(() => undefined)));
  return report;
})
