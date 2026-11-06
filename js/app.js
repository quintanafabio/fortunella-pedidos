/* Fortunella — carta con pedido online por WhatsApp. Sin dependencias, sin backend. */
(function () {
  "use strict";

  const CFG = Object.assign(
    { whatsapp: "", halfAndHalfPrice: "max", halfAndHalfSize: "GRANDE", deliveryFee: null, paymentMethods: ["Efectivo", "Transferencia"] },
    window.FORTUNELLA_CONFIG || {}
  );
  const HALF_SIZE = CFG.halfAndHalfSize;
  const STORE_KEY = "fortunella-pedido-v1";
  const nf = new Intl.NumberFormat("es-AR");
  const money = (v) => "$" + nf.format(Math.round(v));
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const SIZE_NAMES = { "CHICA": "Chica", "GRANDE": "Grande", "UNID.": "Unidad", "½ DOC.": "½ docena", "DOC.": "Docena" };
  const sizeName = (label) => {
    if (!label) return "";
    if (SIZE_NAMES[label]) return SIZE_NAMES[label];
    const s = label.toLowerCase();
    return s.charAt(0).toUpperCase() + s.slice(1);
  };
  const norm = (s) => (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

  // Construye nodos sin innerHTML (todo el texto pasa por textContent).
  function h(tag, attrs, ...children) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k === "class") node.className = v;
      else if (k === "text") node.textContent = v;
      else if (k.startsWith("on")) node.addEventListener(k.slice(2), v);
      else if (k === "dataset") Object.assign(node.dataset, v);
      else node.setAttribute(k, v === true ? "" : v);
    }
    for (const c of children.flat()) {
      if (c == null || c === false) continue;
      node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    }
    return node;
  }

  /* ───────────────────── DATOS ───────────────────── */

  let MODULES = [];
  const ITEMS = new Map();

  // "+ alioli $600" → { name: "alioli", price: 600 }
  function parseExtras(note) {
    if (!note) return [];
    const out = [];
    const re = /\+\s*([^$+]+?)\s*\$\s*([\d.,]+)/g;
    let m;
    while ((m = re.exec(note))) out.push({ name: m[1].trim(), price: Number(m[2].replace(/[.,]/g, "")) });
    return out;
  }

  function prepare(modules) {
    MODULES = modules.map((mod, mi) => {
      const items = (mod.items || []).map((it, ii) => {
        const prices = (it.prices || []).filter((p) => typeof p.value === "number");
        const extras = parseExtras(it.note);
        const item = {
          id: `m${mi}i${ii}`,
          name: it.name,
          description: it.description || "",
          note: extras.length ? "" : it.note || "",
          extras,
          prices,
          featured: !!it.featured,
          subgroup: it.subgroup || null,
          cat: mod.name,
          layout: mod.layout_type,
        };
        // Mitad y mitad: solo pizzas comunes que vienen en tamaño grande (no la de molde ni el box).
        item.halfEligible = mod.layout_type === "pizza-grid" && !item.featured && prices.length >= 2 &&
          prices.some((p) => p.label === HALF_SIZE);
        ITEMS.set(item.id, item);
        return item;
      });
      return { id: `cat${mi}`, name: mod.name, subtitle: mod.subtitle, variant: mod.title_variant, layout: mod.layout_type, items };
    });
  }

  async function loadMenu() {
    if (CFG.supabaseUrl && CFG.supabaseAnonKey) {
      try {
        const url = `${CFG.supabaseUrl.replace(/\/$/, "")}/rest/v1/modules?select=*,items(*)&menu=eq.${encodeURIComponent(CFG.menuName || "fortunella")}&order=position.asc`;
        const res = await fetch(url, { headers: { apikey: CFG.supabaseAnonKey, Authorization: `Bearer ${CFG.supabaseAnonKey}` } });
        if (!res.ok) throw new Error("HTTP " + res.status);
        const data = await res.json();
        if (Array.isArray(data) && data.length) {
          return data.map((m) => ({ ...m, items: (m.items || []).slice().sort((a, b) => a.position - b.position) }));
        }
      } catch (e) {
        console.warn("[fortunella] No se pudo leer Supabase, uso data/menu.js:", e.message);
      }
    }
    if (window.FORTUNELLA_MENU && window.FORTUNELLA_MENU.modules) return window.FORTUNELLA_MENU.modules;
    throw new Error("No hay datos de la carta");
  }

  /* ───────────────────── ESTADO ───────────────────── */

  const state = {
    lines: [],
    generalNotes: "",
    info: { name: "", mode: "", addressRef: "", when: "asap", time: "", pay: "", cash: "" },
  };

  let halfFirst = null; // id de la pizza elegida como primera mitad (modo mitad y mitad activo)

  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (_) { /* modo privado */ }
  }
  function restore() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORE_KEY) || "null");
      if (!raw) return;
      state.generalNotes = raw.generalNotes || "";
      for (const k of Object.keys(state.info)) if (raw.info && raw.info[k] != null) state.info[k] = raw.info[k];
      state.lines = (raw.lines || []).filter(validLine);
    } catch (_) { /* datos corruptos: se ignoran */ }
  }

  // Una línea guardada sigue siendo válida si el producto, el tamaño y la mitad todavía existen en la carta.
  function validLine(l) {
    const it = l && ITEMS.get(l.itemId);
    if (!it || it.name !== l.name) return false;
    if (l.size && !it.prices.some((p) => p.label === l.size)) return false;
    if (l.halfId && (!ITEMS.get(l.halfId) || l.size !== HALF_SIZE)) return false;
    return l.qty > 0;
  }

  function priceFor(item, size) {
    const p = item.prices.find((x) => (x.label || null) === (size || null)) || item.prices[0];
    return p ? p.value : 0;
  }
  function halfPrice(a, b) {
    const pa = priceFor(a, HALF_SIZE);
    const pb = priceFor(b, HALF_SIZE);
    return CFG.halfAndHalfPrice === "avg" ? Math.ceil((pa + pb) / 2) : Math.max(pa, pb);
  }
  function unitPrice(line) {
    const item = ITEMS.get(line.itemId);
    const base = line.halfId ? halfPrice(item, ITEMS.get(line.halfId)) : priceFor(item, line.size);
    const extras = (line.extras || []).reduce((s, name) => {
      const ex = item.extras.find((e) => e.name === name);
      return s + (ex ? ex.price : 0);
    }, 0);
    return base + extras;
  }
  const lineTotal = (l) => unitPrice(l) * l.qty;
  const subtotal = () => state.lines.reduce((s, l) => s + lineTotal(l), 0);
  const itemCount = () => state.lines.reduce((s, l) => s + l.qty, 0);
  const hasFee = () => state.info.mode === "delivery" && typeof CFG.deliveryFee === "number" && CFG.deliveryFee > 0;
  const total = () => subtotal() + (hasFee() ? CFG.deliveryFee : 0);

  function lineTitle(l) {
    const it = ITEMS.get(l.itemId);
    if (l.halfId) return `½ ${it.name} + ½ ${ITEMS.get(l.halfId).name}`;
    return it.name;
  }
  function lineMeta(l) {
    const parts = [];
    if (l.size) parts.push(sizeName(l.size));
    if (l.extras && l.extras.length) parts.push("con " + l.extras.join(", "));
    return parts.join(" · ");
  }
  const lineKey = (l) => [l.itemId, l.size, l.halfId, (l.extras || []).slice().sort().join("|"), (l.notes || "").trim().toLowerCase()].join("§");

  function addLine(line) {
    const key = lineKey(line);
    const existing = state.lines.find((l) => lineKey(l) === key);
    if (existing) existing.qty += line.qty;
    else state.lines.push(line);
  }

  /* ───────────────────── CARTA ───────────────────── */

  const menuEl = $("#menu");
  const catsEl = $("#cats");

  function itemCard(item) {
    const compact = !item.description && item.prices.length === 1 && !item.featured;
    const card = h(
      "article",
      { class: "item" + (item.featured ? " featured" : "") + (compact ? " compact" : ""), dataset: { id: item.id } },
      h("div", { class: "item-main" },
        h("h3", { class: "item-name" }, item.featured ? `✦ ${item.name} ✦` : item.name,
          item.note ? h("span", { class: "item-note", text: " " + item.note }) : null),
        item.description ? h("p", { class: "item-desc", text: item.description }) : null,
        compact ? h("p", { class: "item-prices", text: money(item.prices[0].value) }) : null
      ),
      h("div", { class: "item-actions" }),
      h("p", { class: "item-halves", hidden: true })
    );
    renderActions(card, item);
    return card;
  }

  /* Botones de cada tarjeta: agregar por tamaño, contador, mitad y mitad */
  const extrasPick = new Map(); // itemId → Set de adicionales tildados en la tarjeta
  const plainLines = (id, size) => state.lines.filter((l) => l.itemId === id && !l.halfId && (l.size || null) === (size || null));

  function renderActions(card, item = ITEMS.get(card.dataset.id)) {
    const box = $(".item-actions", card);
    const halvesEl = $(".item-halves", card);
    const compact = card.classList.contains("compact");
    box.textContent = "";
    card.classList.remove("dim", "half-first");
    card.inert = false;
    card.classList.toggle("in-cart", !halfFirst && state.lines.some((l) => l.itemId === item.id || l.halfId === item.id));

    if (halfFirst) {
      halvesEl.hidden = true;
      if (item.id === halfFirst) {
        card.classList.add("half-first");
        box.appendChild(h("div", { class: "half-chosen" },
          h("span", { text: "✓ Primera mitad" }),
          h("button", { type: "button", class: "text-btn", text: "Cancelar", onclick: cancelHalf })));
      } else if (item.halfEligible) {
        box.appendChild(h("button", { type: "button", class: "pick-btn", onclick: () => pickHalf(item),
          "aria-label": `Elegir ${item.name} como otra mitad, total ${money(halfPrice(ITEMS.get(halfFirst), item))}` },
          h("span", { text: "Elegir como otra mitad" }),
          h("b", { text: money(halfPrice(ITEMS.get(halfFirst), item)) })));
      } else {
        card.classList.add("dim");
        card.inert = true;
      }
      return;
    }

    item.prices.forEach((p) => {
      const size = p.label || null;
      const n = plainLines(item.id, size).reduce((s, l) => s + l.qty, 0);
      const label = size ? sizeName(size) : compact ? "" : "Agregar";
      const what = item.name + (size ? " " + sizeName(size) : "");
      if (n > 0) {
        box.appendChild(h("div", { class: "qty-group", role: "group", "aria-label": `${what}: ${n} en tu pedido` },
          h("button", { type: "button", "aria-label": `Restar un ${what}`, text: "−", onclick: () => quickRemove(item, size) }),
          h("span", { class: "qg-label" }, h("b", { text: String(n) }), label ? h("small", { text: label }) : null),
          h("button", { type: "button", "aria-label": `Sumar un ${what}`, text: "+", onclick: () => quickAdd(item, size) })));
      } else {
        box.appendChild(h("button", { type: "button", class: "add-btn", "aria-label": `Agregar ${what}, ${money(p.value)}`, onclick: () => quickAdd(item, size) },
          h("span", { class: "ab-size", text: "+ " + label }),
          compact ? null : h("span", { class: "ab-price", text: money(p.value) })));
      }
    });

    if (item.halfEligible) {
      box.appendChild(h("button", { type: "button", class: "half-btn", "aria-label": `Pedir mitad y mitad ${sizeName(HALF_SIZE).toLowerCase()} con ${item.name}`, onclick: () => startHalf(item) },
        h("span", { class: "ab-size", text: "½ y ½" }),
        h("span", { class: "ab-price", text: sizeName(HALF_SIZE) })));
    }

    if (item.extras.length) {
      const picked = extrasPick.get(item.id) || new Set();
      const wrap = h("div", { class: "extra-chips" });
      item.extras.forEach((ex) => {
        wrap.appendChild(h("label", { class: "chip-check" },
          h("input", { type: "checkbox", checked: picked.has(ex.name), onchange: (e) => {
            const set = extrasPick.get(item.id) || new Set();
            if (e.target.checked) set.add(ex.name); else set.delete(ex.name);
            extrasPick.set(item.id, set);
          } }),
          h("span", { text: `Con ${ex.name} +${money(ex.price)}` })));
      });
      box.appendChild(wrap);
    }

    const halves = state.lines.filter((l) => l.halfId && (l.itemId === item.id || l.halfId === item.id));
    halvesEl.hidden = !halves.length;
    halvesEl.textContent = halves.length
      ? "En tu pedido: " + halves.map((l) => `½ y ½ con ${ITEMS.get(l.itemId === item.id ? l.halfId : l.itemId).name}${l.qty > 1 ? ` (×${l.qty})` : ""}`).join(" · ")
      : "";
  }

  function refreshCards() {
    $$(".item", menuEl).forEach((c) => renderActions(c));
  }

  function afterAdd(line, msg) {
    const key = lineKey(line);
    changed();
    bumpBar();
    toast(msg, { label: "Aclarar", fn: () => {
      const idx = state.lines.findIndex((l) => lineKey(l) === key);
      if (idx >= 0) openItem(state.lines[idx].itemId, idx);
    } });
  }

  function quickAdd(item, size) {
    const extras = Array.from(extrasPick.get(item.id) || []);
    const line = { itemId: item.id, name: item.name, size, halfId: null, extras, notes: "", qty: 1 };
    addLine(line);
    afterAdd(line, `Agregaste ${item.name}${size ? " " + sizeName(size).toLowerCase() : ""}${extras.length ? " con " + extras.join(", ") : ""}`);
  }

  function quickRemove(item, size) {
    const lines = plainLines(item.id, size);
    const last = lines[lines.length - 1];
    if (!last) return;
    if (last.qty > 1) last.qty--;
    else state.lines.splice(state.lines.indexOf(last), 1);
    changed();
  }

  /* Mitad y mitad: se elige la primera mitad y después la otra desde la carta */
  const halfBar = $("#halfBar");

  function startHalf(item) {
    halfFirst = item.id;
    document.body.classList.add("half-mode");
    $("#halfBarText").textContent = `½ ${item.name} + ½ … elegí la otra mitad en la carta`;
    halfBar.hidden = false;
    refreshCards();
    updateBar();
  }

  function cancelHalf() {
    const id = halfFirst;
    halfFirst = null;
    document.body.classList.remove("half-mode");
    halfBar.hidden = true;
    refreshCards();
    updateBar();
    const card = id && menuEl.querySelector(`.item[data-id="${id}"] .half-btn`);
    if (card) card.focus({ preventScroll: true });
  }

  function pickHalf(item) {
    const first = ITEMS.get(halfFirst);
    const line = { itemId: first.id, name: first.name, size: HALF_SIZE, halfId: item.id, extras: [], notes: "", qty: 1 };
    cancelHalf();
    addLine(line);
    afterAdd(line, `Agregaste ½ ${first.name} + ½ ${item.name}`);
  }

  $("#halfCancel").addEventListener("click", cancelHalf);

  function renderMenu() {
    menuEl.textContent = "";
    catsEl.textContent = "";
    MODULES.forEach((mod, i) => {
      catsEl.appendChild(h("button", { type: "button", class: "cat-chip", dataset: { target: mod.id }, text: mod.name, onclick: () => goTo(mod.id) }));
      if (i) menuEl.appendChild(h("div", { class: "divider", "aria-hidden": "true", text: "✦ · ✦ · ✦" }));
      const section = h("section", { class: "section", id: mod.id, "aria-labelledby": mod.id + "-t" });
      const head = h("div", { class: "sec-head" + (mod.variant === "valientes" ? " valientes" : "") },
        h("h2", { class: "sec-title" + (mod.variant === "orange" ? " orange" : ""), id: mod.id + "-t", text: mod.name }),
        mod.subtitle ? h("p", { class: "sec-sub", text: mod.subtitle }) : null
      );
      section.appendChild(head);
      let currentGroup;
      let grid;
      mod.items.forEach((item) => {
        if (!grid || item.subgroup !== currentGroup) {
          currentGroup = item.subgroup;
          if (item.subgroup) section.appendChild(h("h3", { class: "subgroup", text: item.subgroup }));
          grid = h("div", { class: "grid" });
          section.appendChild(grid);
        }
        grid.appendChild(itemCard(item));
      });
      menuEl.appendChild(section);
    });
    menuEl.appendChild(h("p", { class: "no-results", id: "noResults", hidden: true, text: "No encontramos nada con ese nombre." }));
    setupScrollSpy();
  }

  function goTo(id) {
    const search = $("#search");
    if (search.value) { search.value = ""; applySearch(""); }
    document.getElementById(id).scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }

  function setActiveChip(id) {
    $$(".cat-chip", catsEl).forEach((c) => {
      const on = c.dataset.target === id;
      c.setAttribute("aria-current", on ? "true" : "false");
      if (on) {
        const left = c.offsetLeft - catsEl.clientWidth / 2 + c.clientWidth / 2;
        catsEl.scrollTo({ left, behavior: "smooth" });
      }
    });
  }

  function setupScrollSpy() {
    const sections = $$(".section", menuEl);
    if (!("IntersectionObserver" in window)) return;
    const visible = new Map();
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => visible.set(e.target.id, e.isIntersecting ? e.boundingClientRect.top : null));
      const first = sections.find((s) => visible.get(s.id) != null);
      if (first) setActiveChip(first.id);
    }, { rootMargin: "-130px 0px -55% 0px" });
    sections.forEach((s) => io.observe(s));
    setActiveChip(sections[0] && sections[0].id);
  }

  function applySearch(q) {
    const nq = norm(q.trim());
    let any = false;
    $$(".section", menuEl).forEach((sec) => {
      let secHas = false;
      $$(".grid", sec).forEach((grid) => {
        let gridHas = false;
        $$(".item", grid).forEach((card) => {
          const it = ITEMS.get(card.dataset.id);
          const hit = !nq || norm(it.name + " " + it.description + " " + it.cat).includes(nq);
          card.hidden = !hit;
          gridHas = gridHas || hit;
        });
        grid.hidden = !gridHas;
        const prev = grid.previousElementSibling;
        if (prev && prev.classList.contains("subgroup")) prev.hidden = !gridHas;
        secHas = secHas || gridHas;
      });
      sec.hidden = !secHas;
      any = any || secHas;
    });
    $$(".divider", menuEl).forEach((d) => (d.hidden = !!nq));
    $("#noResults").hidden = any;
  }

  /* ───────────────────── DIÁLOGOS ───────────────────── */

  const scrim = $("#scrim");
  const stack = [];
  const Z = { itemSheet: 56, drawer: 50, sentSheet: 58 };

  function openDialog(el) {
    if (stack.some((s) => s.el === el)) return;
    stack.push({ el, returnTo: document.activeElement });
    el.hidden = false;
    el.style.zIndex = Z[el.id];
    scrim.hidden = false;
    scrim.style.zIndex = Z[el.id] - 1;
    document.body.classList.add("locked");
    const f = el.querySelector("[autofocus]") || el.querySelector("button:not([data-close]):not([disabled]), input, textarea, select");
    setTimeout(() => f && f.focus({ preventScroll: true }), 30);
  }
  function closeTop() {
    const top = stack.pop();
    if (!top) return;
    top.el.hidden = true;
    if (stack.length) {
      scrim.style.zIndex = Z[stack[stack.length - 1].el.id] - 1;
    } else {
      scrim.hidden = true;
      document.body.classList.remove("locked");
    }
    if (top.returnTo && document.contains(top.returnTo)) top.returnTo.focus({ preventScroll: true });
  }
  scrim.addEventListener("click", closeTop);
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (stack.length) { e.preventDefault(); closeTop(); }
    else if (halfFirst) { e.preventDefault(); cancelHalf(); }
  });
  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-close]")) closeTop();
  });

  /* ───────────────────── HOJA DE PRODUCTO ───────────────────── */

  const sheet = $("#itemSheet");
  const sheetState = { item: null, editIndex: -1, qty: 1, size: null, halfId: null };

  function openItem(itemId, editIndex = -1) {
    const item = ITEMS.get(itemId);
    const line = editIndex >= 0 ? state.lines[editIndex] : null;
    const half = line && line.halfId ? ITEMS.get(line.halfId) : null;
    sheetState.item = item;
    sheetState.editIndex = editIndex;
    sheetState.qty = line ? line.qty : 1;
    sheetState.halfId = half ? half.id : null;

    $("#sheetCat").textContent = item.cat + (item.subgroup ? " · " + item.subgroup : "");
    $("#sheetTitle").textContent = half ? `½ ${item.name} + ½ ${half.name}` : item.name;
    $("#sheetDesc").textContent = half
      ? `Mitad y mitad ${sizeName(HALF_SIZE).toLowerCase()}. ` + (CFG.halfAndHalfPrice === "avg" ? "Se cobra el promedio de las dos mitades." : "Se cobra el precio de la mitad más cara.")
      : item.description;
    $("#sheetDesc").hidden = !half && !item.description;

    // Tamaños (una mitad y mitad siempre es grande)
    const pills = $("#sizePills");
    pills.textContent = "";
    const multi = item.prices.length > 1 && !half;
    $("#sizeField").hidden = !multi;
    $("#sizeField legend").textContent = item.layout === "emp-table" ? "Presentación" : "Tamaño";
    const preferred = line ? line.size : (item.prices.find((p) => p.label === "GRANDE") || item.prices[0] || {}).label || null;
    sheetState.size = half ? HALF_SIZE : multi ? preferred : (item.prices[0] && item.prices[0].label) || null;
    if (multi) {
      item.prices.forEach((p) => {
        pills.appendChild(h("label", { class: "pill" },
          h("input", { type: "radio", name: "size", value: p.label, checked: p.label === sheetState.size,
            onchange: () => { sheetState.size = p.label; updateSheetPrice(); } }),
          h("span", null, sizeName(p.label), h("small", { text: money(p.value) }))
        ));
      });
    }

    // Adicionales
    const extras = $("#extrasList");
    extras.textContent = "";
    $("#extrasField").hidden = !item.extras.length;
    item.extras.forEach((ex) => {
      extras.appendChild(h("label", { class: "check-row" },
        h("input", { type: "checkbox", value: ex.name, checked: !!(line && line.extras.includes(ex.name)), onchange: updateSheetPrice }),
        h("span", { text: "Agregar " + ex.name }),
        h("b", { text: "+" + money(ex.price) })
      ));
    });

    $("#itemNotes").value = line ? line.notes || "" : "";
    $("#addBtn").firstChild.nodeValue = line ? "Guardar " : "Agregar ";
    updateSheetPrice();
    openDialog(sheet);
    sheet.querySelector(".sheet-body").scrollTop = 0;
  }

  function readSheetLine() {
    const item = sheetState.item;
    return {
      itemId: item.id,
      name: item.name,
      size: sheetState.size,
      halfId: sheetState.halfId,
      extras: $$("#extrasList input:checked").map((i) => i.value),
      notes: $("#itemNotes").value.trim(),
      qty: sheetState.qty,
    };
  }

  function updateSheetPrice() {
    $("#qtyOut").textContent = sheetState.qty;
    $("#qtyMinus").disabled = sheetState.qty <= 1;
    $("#addPrice").textContent = money(lineTotal(readSheetLine()));
  }

  $("#qtyMinus").addEventListener("click", () => { sheetState.qty = Math.max(1, sheetState.qty - 1); updateSheetPrice(); });
  $("#qtyPlus").addEventListener("click", () => { sheetState.qty = Math.min(99, sheetState.qty + 1); updateSheetPrice(); });

  $("#addBtn").addEventListener("click", () => {
    const line = readSheetLine();
    if (sheetState.editIndex >= 0) {
      state.lines.splice(sheetState.editIndex, 1);
      addLine(line);
      closeTop();
      renderCart();
    } else {
      addLine(line);
      closeTop();
      toast(`Agregaste ${line.qty > 1 ? line.qty + "× " : ""}${lineTitle(line)}`);
      bumpBar();
    }
    changed();
    if (sheetState.editIndex >= 0 && drawer.hidden) toast("Aclaración guardada");
  });

  /* ───────────────────── BARRA + TOAST ───────────────────── */

  const bar = $("#cartBar");
  bar.addEventListener("click", () => openDrawer("cart"));

  function updateBar() {
    const n = itemCount();
    bar.hidden = n === 0 || !!halfFirst;
    $("#cartBarCount").textContent = n;
    $("#cartBarTotal").textContent = money(subtotal());
    bar.setAttribute("aria-label", `Ver mi pedido: ${n} ${n === 1 ? "producto" : "productos"}, ${money(subtotal())}`);
  }
  function bumpBar() {
    bar.classList.remove("bump");
    void bar.offsetWidth;
    bar.classList.add("bump");
  }
  let toastTimer;
  // Aviso breve; con `action` muestra un botón (ej. "Aclarar") y dura un poco más.
  function toast(msg, action) {
    const t = $("#toast");
    t.textContent = "";
    t.appendChild(h("span", { class: "toast-msg", text: "✓ " + msg }));
    if (action) {
      t.appendChild(h("button", { type: "button", class: "toast-btn", text: action.label, onclick: () => {
        t.classList.remove("show");
        action.fn();
      } }));
    }
    t.classList.toggle("has-action", !!action);
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), action ? 4500 : 2200);
  }

  function changed() {
    save();
    updateBar();
    refreshCards();
    updateTotals();
    renderAgain();
  }

  /* ───────────────────── HORARIOS ───────────────────── */

  const WEEK = 7 * 1440;
  const DAY_NAMES = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
  const toMin = (s) => { const [hh, mm] = s.split(":").map(Number); return hh * 60 + mm; };
  const hhmm = (min) => {
    const m = ((min % 1440) + 1440) % 1440;
    return String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0");
  };

  // Turnos como intervalos en "minutos desde el domingo 00:00".
  const SHIFTS = [];
  (CFG.hours || []).forEach((s) => s.days.forEach((d) => {
    const start = d * 1440 + toMin(s.open);
    let end = d * 1440 + toMin(s.close);
    if (end <= start) end += 1440; // cierra después de medianoche
    SHIFTS.push({ start, end });
  }));
  const hasHours = SHIFTS.length > 0;

  // Minuto actual de la semana en la hora del local (aunque el teléfono esté en otra zona horaria).
  function weekNow() {
    try {
      const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: CFG.timeZone || undefined, weekday: "short", hour: "numeric", minute: "numeric", hourCycle: "h23",
      }).formatToParts(new Date());
      const get = (type) => parts.find((p) => p.type === type).value;
      const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
      return day * 1440 + (Number(get("hour")) % 24) * 60 + Number(get("minute"));
    } catch (_) {
      const d = new Date();
      return d.getDay() * 1440 + d.getHours() * 60 + d.getMinutes();
    }
  }

  function currentShift(t) {
    for (const s of SHIFTS) {
      for (const off of [0, -WEEK]) { // -WEEK: turno del sábado que sigue abierto el domingo de madrugada
        if (t >= s.start + off && t < s.end + off) return { start: s.start + off, end: s.end + off };
      }
    }
    return null;
  }
  function nextShift(t) {
    let best = null;
    for (const s of SHIFTS) {
      for (const off of [0, WEEK]) {
        const start = s.start + off;
        if (start > t && (!best || start < best.start)) best = { start, end: s.end + off };
      }
    }
    return best;
  }
  function dayLabel(min, t) {
    const diff = Math.floor(min / 1440) - Math.floor(t / 1440);
    if (diff === 0) return "hoy";
    if (diff === 1) return "mañana";
    return "el " + DAY_NAMES[Math.floor(min / 1440) % 7];
  }

  // { open, soon, closesAt } o { open: false, opensAt }; null si no hay horarios cargados.
  function storeState() {
    if (!hasHours) return null;
    const t = weekNow();
    const cur = currentShift(t);
    if (cur) return { open: true, soon: cur.end - t <= 45, closesAt: hhmm(cur.end), t };
    const nx = nextShift(t);
    return { open: false, opensAt: `${dayLabel(nx.start, t)} a las ${hhmm(nx.start)}`, t };
  }

  function renderStatus() {
    const el = $("#storeStatus");
    const st = storeState();
    if (!st) { el.hidden = true; return; }
    el.hidden = false;
    el.className = "status " + (st.open ? (st.soon ? "soon" : "open") : "closed");
    el.textContent = st.open
      ? (st.soon ? `Cierra pronto · a las ${st.closesAt}` : `Abierto ahora · hasta las ${st.closesAt}`)
      : `Cerrado · abrimos ${st.opensAt}`;
    const notice = $("#closedNotice");
    notice.hidden = st.open;
    if (!st.open) $("#closedText").textContent = `Abrimos ${st.opensAt}. Podés enviar tu pedido igual: lo preparamos cuando abramos.`;
  }

  // Horarios de retiro cada 15 min dentro del turno actual o el próximo.
  function pickupSlots() {
    const lead = CFG.pickupLeadMinutes || 30;
    const round = (m) => Math.ceil(m / 15) * 15;
    const t = weekNow();
    if (!hasHours) {
      const out = [];
      for (let m = round(t + lead), n = 0; n < 16; m += 15, n++) out.push(hhmm(m));
      return { slots: out, note: "" };
    }
    let shift = currentShift(t);
    let from = shift ? round(t + lead) : 0;
    let note = "";
    if (!shift || from > shift.end - 15) {
      const closingSoon = !!shift;
      shift = nextShift(t);
      from = round(shift.start + lead);
      note = `${closingSoon ? "Estamos por cerrar" : "Ahora estamos cerrados"}: estos horarios son para cuando abramos (${dayLabel(shift.start, t)} a las ${hhmm(shift.start)}).`;
    }
    const day = dayLabel(shift.start, t);
    const prefix = shift.start > t && day !== "hoy" ? day + " " : "";
    const slots = [];
    for (let m = from; m <= shift.end - 15; m += 15) slots.push(prefix + hhmm(m));
    return { slots, note };
  }

  (function renderStoreInfo() {
    const list = $("#footerHours");
    (CFG.hours || []).forEach((s) => list.appendChild(h("li", null, h("b", { text: s.label }), ` ${s.open} a ${s.close} hs`)));
    const store = CFG.store || {};
    const map = $("#footerMap");
    const link = $("#storeLink");
    if (store.address) {
      map.textContent = store.address + (store.mapsUrl ? " · Ver en el mapa" : "");
      $("#storeAddress").textContent = store.address;
    }
    if (store.mapsUrl) { map.href = store.mapsUrl; link.href = store.mapsUrl; }
    else { map.removeAttribute("href"); link.removeAttribute("href"); }
    link.hidden = !store.address;
    renderStatus();
    setInterval(renderStatus, 60000);
  })();

  /* ───────────────────── REPETIR EL ÚLTIMO PEDIDO ───────────────────── */

  const LAST_KEY = "fortunella-ultimo-pedido-v1";
  let againDismissed = false;

  function saveLastOrder() {
    try {
      localStorage.setItem(LAST_KEY, JSON.stringify({ at: Date.now(), lines: state.lines.map((l) => ({ ...l })) }));
    } catch (_) { /* sin almacenamiento */ }
  }
  function loadLastOrder() {
    try {
      const raw = JSON.parse(localStorage.getItem(LAST_KEY) || "null");
      if (!raw || !Array.isArray(raw.lines)) return null;
      const lines = raw.lines.filter(validLine);
      return lines.length ? { at: raw.at, lines } : null;
    } catch (_) { return null; }
  }

  function renderAgain() {
    const card = $("#againCard");
    const last = !againDismissed && state.lines.length === 0 ? loadLastOrder() : null;
    card.hidden = !last;
    if (!last) return;
    const names = last.lines.map((l) => `${l.qty}× ${lineTitle(l)}${l.size && !l.halfId ? " " + sizeName(l.size).toLowerCase() : ""}`);
    const shown = names.slice(0, 4).join(" · ") + (names.length > 4 ? ` y ${names.length - 4} más` : "");
    let when = "";
    try { when = new Date(last.at).toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "numeric" }); } catch (_) { /* fecha opcional */ }
    $("#againItems").textContent = (when ? `Tu pedido del ${when}: ` : "") + shown;
    $("#againTotal").textContent = money(last.lines.reduce((s, l) => s + lineTotal(l), 0));
  }

  $("#againBtn").addEventListener("click", () => {
    const last = loadLastOrder();
    if (!last) return;
    last.lines.forEach((l) => addLine({ ...l }));
    againDismissed = true;
    changed();
    openDrawer("cart");
  });
  $("#againClose").addEventListener("click", () => { againDismissed = true; renderAgain(); });

  /* ───────────────────── PANEL DEL PEDIDO ───────────────────── */

  const drawer = $("#drawer");
  const STEPS = ["cart", "delivery", "review"];
  const TITLES = { cart: "Tu pedido", delivery: "Entrega", review: "Confirmar" };
  let step = "cart";

  function openDrawer(s) {
    $("#toast").classList.remove("show");
    setStep(s || "cart");
    openDialog(drawer);
  }

  function setStep(s) {
    step = s;
    const idx = STEPS.indexOf(s);
    $$(".step", drawer).forEach((p) => (p.hidden = p.dataset.panel !== s));
    $$(".steps li", drawer).forEach((li, i) => {
      li.classList.toggle("current", i === idx);
      li.classList.toggle("done", i < idx);
      if (i === idx) li.setAttribute("aria-current", "step"); else li.removeAttribute("aria-current");
    });
    $("#drawerTitle").textContent = TITLES[s];
    $("#drawerBack").classList.toggle("show", idx > 0);
    if (s === "cart") renderCart();
    if (s === "delivery") fillDeliveryForm();
    if (s === "review") renderReview();
    renderStatus();
    updateTotals();
    $(".drawer-body", drawer).scrollTop = 0;
  }

  $("#drawerBack").addEventListener("click", () => {
    const idx = STEPS.indexOf(step);
    if (idx > 0) setStep(STEPS[idx - 1]);
  });

  const WA_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2Zm0 18.15c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 4.54 0 8.24 3.7 8.24 8.24 0 4.55-3.7 8.24-8.24 8.24Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.78.97-.14.16-.29.18-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.13-.15.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48a.92.92 0 0 0-.66.31c-.23.25-.87.85-.87 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.06-.1-.22-.16-.47-.28Z"/></svg>';

  function updateTotals() {
    const strong = $("#drawerTotal");
    strong.textContent = money(total());
    let note = $(".totals small", drawer);
    const needNote = state.info.mode === "delivery" && step !== "cart";
    const text = hasFee() ? `Incluye envío ${money(CFG.deliveryFee)}` : "+ envío a confirmar";
    if (needNote) {
      if (!note) { note = h("small"); strong.after(note); }
      note.textContent = text;
    } else if (note) note.remove();

    const btn = $("#nextBtn");
    btn.classList.toggle("whatsapp", step === "review");
    if (step === "cart") btn.textContent = "Continuar";
    else if (step === "delivery") btn.textContent = "Revisar pedido";
    else btn.innerHTML = WA_ICON + "<span>Enviar pedido</span>";
    btn.disabled = state.lines.length === 0;
  }

  function renderCart() {
    const ul = $("#lines");
    ul.textContent = "";
    const empty = state.lines.length === 0;
    $("#emptyCart").hidden = !empty;
    $("#generalNotesField").hidden = empty;
    $("#generalNotes").value = state.generalNotes;
    state.lines.forEach((l, idx) => {
      const meta = lineMeta(l);
      ul.appendChild(h("li", { class: "line" },
        h("p", { class: "line-name", text: lineTitle(l) }),
        h("p", { class: "line-price", text: money(lineTotal(l)) }),
        meta ? h("p", { class: "line-meta", text: meta + (l.qty > 1 ? ` · ${money(unitPrice(l))} c/u` : "") }) :
          l.qty > 1 ? h("p", { class: "line-meta", text: `${money(unitPrice(l))} c/u` }) : null,
        l.notes ? h("p", { class: "line-notes", text: "“" + l.notes + "”" }) : null,
        h("div", { class: "line-actions" },
          h("div", { class: "stepper sm", role: "group", "aria-label": "Cantidad de " + lineTitle(l) },
            h("button", { type: "button", "aria-label": l.qty === 1 ? "Quitar" : "Restar uno", text: l.qty === 1 ? "🗑" : "−",
              onclick: () => { if (l.qty === 1) removeLine(idx); else { l.qty--; changed(); renderCart(); } } }),
            h("output", { text: String(l.qty) }),
            h("button", { type: "button", "aria-label": "Sumar uno", text: "+", onclick: () => { l.qty = Math.min(99, l.qty + 1); changed(); renderCart(); } })
          ),
          h("span", { class: "spacer" }),
          h("button", { type: "button", class: "text-btn", text: l.notes ? "Editar" : "Editar / Aclarar", onclick: () => openItem(l.itemId, idx) }),
          h("button", { type: "button", class: "text-btn danger", text: "Quitar", onclick: () => removeLine(idx) })
        )
      ));
    });
    renderUpsell();
  }

  // "¿Le sumás algo?": sugerencias de categorías (bebidas, postres) que todavía no están en el pedido.
  function renderUpsell() {
    const box = $("#upsell");
    const list = $("#upsellList");
    list.textContent = "";
    const inCart = new Set(state.lines.map((l) => ITEMS.get(l.itemId).cat));
    const all = Array.from(ITEMS.values());
    const candidates = (CFG.suggestions || [])
      .map((name) => all.find((it) => it.name === name))
      .filter((it) => it && !inCart.has(it.cat));
    // Alternar categorías: si faltan bebida y postre, mostrar de las dos.
    const byCat = new Map();
    candidates.forEach((it) => { if (!byCat.has(it.cat)) byCat.set(it.cat, []); byCat.get(it.cat).push(it); });
    const picks = [];
    for (let round = 0; picks.length < 3 && round < 5; round++) {
      for (const group of byCat.values()) if (group[round] && picks.length < 3) picks.push(group[round]);
    }
    box.hidden = !state.lines.length || !picks.length;
    picks.forEach((it) => {
      const size = (it.prices[0] && it.prices[0].label) || null;
      list.appendChild(h("button", { type: "button", class: "upsell-item", "aria-label": `Agregar ${it.name}, ${money(priceFor(it, size))}`,
        onclick: () => { quickAdd(it, size); renderCart(); } },
        h("span", { class: "ui-name", text: it.name }),
        h("span", { class: "ui-price", text: money(priceFor(it, size)) }),
        h("span", { class: "ui-add", "aria-hidden": "true", text: "+" })));
    });
  }

  function removeLine(idx) {
    const [l] = state.lines.splice(idx, 1);
    changed();
    renderCart();
    if (l) toast(`Quitaste ${lineTitle(l)}`);
  }

  $("#generalNotes").addEventListener("input", (e) => { state.generalNotes = e.target.value; save(); });

  /* Paso 2: entrega */
  const form = $("#deliveryForm");

  (function buildPayments() {
    const wrap = $("#payPills");
    CFG.paymentMethods.forEach((m) => {
      wrap.appendChild(h("label", { class: "pill" },
        h("input", { type: "radio", name: "pay", value: m }),
        h("span", { text: m })
      ));
    });
  })();

  // Datos de transferencia
  (function setupTransfer() {
    const tr = CFG.transfer;
    if (!tr) return;
    $("#trAlias").textContent = tr.alias;
    const dl = $("#trData");
    [["Titular", tr.holder], ["CUIT/CUIL", tr.cuit], ["Cuenta", tr.bank]].forEach(([k, v]) => {
      if (v) dl.append(h("dt", { text: k }), h("dd", { text: v }));
    });
    const btn = $("#trCopy");
    btn.addEventListener("click", async () => {
      let ok = false;
      try { await navigator.clipboard.writeText(tr.alias); ok = true; } catch (_) {
        const range = document.createRange();
        range.selectNodeContents($("#trAlias"));
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        ok = document.execCommand && document.execCommand("copy");
      }
      btn.textContent = ok ? "¡Copiado!" : "Copialo a mano";
      btn.classList.toggle("done", ok);
      setTimeout(() => { btn.textContent = "Copiar"; btn.classList.remove("done"); }, 2200);
    });
  })();

  function transferText(forSent) {
    const tr = CFG.transfer;
    if (!tr) return "";
    const waitFee = state.info.mode === "delivery" && !hasFee();
    if (waitFee) return `Esperá que te confirmemos el total con el envío y transferí al alias ${tr.alias}. Después mandá el comprobante por el chat.`;
    return forSent
      ? `Transferí ${money(total())} al alias ${tr.alias} (${tr.bank}, a nombre de ${tr.holder}) y mandá el comprobante por el chat.`
      : "Mandá el comprobante por WhatsApp después de enviar el pedido.";
  }

  function fillPickupTimes() {
    const sel = $("#pickupTime");
    const { slots, note } = pickupSlots();
    sel.textContent = "";
    slots.forEach((s) => sel.appendChild(h("option", { value: s, text: s.charAt(0).toUpperCase() + s.slice(1) + " hs" })));
    if (slots.includes(state.info.time)) sel.value = state.info.time;
    $("#pickupHint").textContent = note;
    $("#pickupHint").hidden = !note;
  }

  function fillDeliveryForm() {
    const i = state.info;
    $("#custName").value = i.name;
    $("#addressRef").value = i.addressRef;
    fillPickupTimes();
    $("#cashAmount").value = i.cash ? money(Number(i.cash)) : "";
    $$('input[name="mode"]', form).forEach((r) => (r.checked = r.value === i.mode));
    $$('input[name="when"]', form).forEach((r) => (r.checked = r.value === (i.when || "asap")));
    $$('input[name="pay"]', form).forEach((r) => (r.checked = r.value === i.pay));
    syncDeliveryUI();
    $$(".invalid", form).forEach((n) => n.classList.remove("invalid"));
    $("#feeHint").textContent = hasFeeConfigured()
      ? `El envío cuesta ${money(CFG.deliveryFee)} y se suma al total.`
      : "El costo del envío te lo confirmamos por WhatsApp.";
  }
  const hasFeeConfigured = () => typeof CFG.deliveryFee === "number" && CFG.deliveryFee > 0;

  function readDeliveryForm() {
    const i = state.info;
    i.name = $("#custName").value.trim();
    i.mode = (form.querySelector('input[name="mode"]:checked') || {}).value || "";
    i.addressRef = $("#addressRef").value.trim();
    i.when = (form.querySelector('input[name="when"]:checked') || {}).value || "asap";
    i.time = $("#pickupTime").value;
    i.pay = (form.querySelector('input[name="pay"]:checked') || {}).value || "";
    i.cash = $("#cashAmount").value.replace(/\D/g, "");
  }

  function syncDeliveryUI() {
    const mode = (form.querySelector('input[name="mode"]:checked') || {}).value;
    $$(".mode-panel", form).forEach((p) => (p.hidden = p.dataset.mode !== mode));
    const when = (form.querySelector('input[name="when"]:checked') || {}).value;
    $("#timePick").hidden = when !== "time";
    const pay = (form.querySelector('input[name="pay"]:checked') || {}).value;
    $("#cashField").hidden = pay !== "Efectivo";
    $("#transferField").hidden = pay !== "Transferencia" || !CFG.transfer;
    if (pay === "Transferencia") {
      state.info.mode = mode || "";
      $("#trHint").textContent = transferText(false);
    }
  }

  form.addEventListener("change", (e) => {
    syncDeliveryUI();
    readDeliveryForm();
    const f = e.target.closest(".field");
    if (f) f.classList.remove("invalid");
    save();
    updateTotals();
  });
  form.addEventListener("input", (e) => {
    if (e.target.id === "cashAmount") {
      const d = e.target.value.replace(/\D/g, "");
      e.target.value = d ? money(Number(d)) : "";
    }
    const f = e.target.closest(".field");
    if (f) f.classList.remove("invalid");
    readDeliveryForm();
    save();
  });
  form.addEventListener("submit", (e) => { e.preventDefault(); next(); });

  function validateDelivery() {
    readDeliveryForm();
    const i = state.info;
    const bad = [];
    const mark = (id, cond) => {
      const fieldEl = document.querySelector(`[data-error-for="${id}"]`).closest(".field, .time-pick");
      fieldEl.classList.toggle("invalid", !cond);
      if (!cond) bad.push(fieldEl);
    };
    mark("custName", i.name.length >= 2);
    mark("mode", !!i.mode);
    if (i.mode === "pickup" && i.when === "time") mark("pickupTime", !!i.time);
    if (bad.length) {
      bad[0].scrollIntoView({ block: "center", behavior: "smooth" });
      const input = bad[0].querySelector("input");
      if (input) input.focus({ preventScroll: true });
      return false;
    }
    return true;
  }

  /* Paso 3: resumen */
  function whenText() {
    const i = state.info;
    if (i.mode !== "pickup") return "";
    return i.when === "time" && i.time ? `${i.time} hs` : "Que el local me avise cuándo está listo";
  }

  function renderReview() {
    const r = $("#review");
    r.textContent = "";
    const i = state.info;
    const editBtn = (target, label = "Editar") => h("button", { type: "button", text: label, onclick: () => setStep(target) });

    const items = h("div", { class: "review-block" }, h("h3", null, "Tu pedido", editBtn("cart")));
    state.lines.forEach((l) => {
      const meta = lineMeta(l);
      items.appendChild(h("div", { class: "review-row" },
        h("div", null,
          h("b", { text: `${l.qty}× ${lineTitle(l)}` }),
          meta ? h("span", { class: "sub", text: meta }) : null,
          l.notes ? h("span", { class: "sub" }, h("i", { text: "Obs: " + l.notes })) : null
        ),
        h("span", { class: "price", text: money(lineTotal(l)) })
      ));
    });
    if (hasFee()) items.appendChild(h("div", { class: "review-row" }, h("b", { text: "Envío" }), h("span", { class: "price", text: money(CFG.deliveryFee) })));
    r.appendChild(items);

    const kv = h("dl", { class: "review-kv" });
    const add = (k, v) => { if (v) kv.append(h("dt", { text: k }), h("dd", { text: v })); };
    add("A nombre de", i.name);
    add("Entrega", i.mode === "delivery" ? "Delivery" : "Retiro en el local");
    if (i.mode === "delivery") {
      add("Ubicación", "La mandás por WhatsApp después del pedido");
      add("Indicaciones", i.addressRef);
      add("Envío", hasFee() ? money(CFG.deliveryFee) : "A confirmar");
    } else {
      add("Horario", whenText());
    }
    add("Pago", payText());
    r.appendChild(h("div", { class: "review-block" }, h("h3", null, "Entrega", editBtn("delivery")), kv));

    if (state.generalNotes.trim()) {
      r.appendChild(h("div", { class: "review-block" }, h("h3", null, "Comentario", editBtn("cart")),
        h("p", { text: state.generalNotes.trim() })));
    }

    $("#reviewHint").textContent = i.mode === "delivery"
      ? "Al tocar “Enviar pedido” se abre WhatsApp con el mensaje listo. Envialo y después mandanos tu ubicación en el mismo chat."
      : "Al tocar “Enviar pedido” se abre WhatsApp con el mensaje listo. Solo tenés que enviarlo.";
  }

  function payText() {
    const i = state.info;
    if (!i.pay) return "A coordinar";
    if (i.pay === "Efectivo" && i.cash) return `Efectivo (abona con ${money(Number(i.cash))})`;
    if (i.pay === "Transferencia" && CFG.transfer) return `Transferencia al alias ${CFG.transfer.alias}`;
    return i.pay;
  }

  function buildMessage() {
    const i = state.info;
    const L = [];
    const st = storeState();
    L.push("🍕 *NUEVO PEDIDO · FORTUNELLA*");
    L.push(`A nombre de: *${i.name}*`);
    if (st && !st.open) L.push("⏰ _Pedido hecho con el local cerrado, para cuando abran._");
    L.push("");
    L.push("*Detalle*");
    state.lines.forEach((l) => {
      const meta = lineMeta(l);
      L.push(`• ${l.qty}x ${lineTitle(l)}${meta ? " (" + meta + ")" : ""} — ${money(lineTotal(l))}`);
      if (l.notes) L.push(`   _Obs: ${l.notes}_`);
    });
    if (hasFee()) L.push(`• Envío — ${money(CFG.deliveryFee)}`);
    L.push("");
    L.push(`*TOTAL: ${money(total())}*` + (i.mode === "delivery" && !hasFee() ? " + envío a confirmar" : ""));
    L.push("");
    if (i.mode === "delivery") {
      L.push("🛵 *Delivery*");
      if (i.addressRef) L.push(`Indicaciones: ${i.addressRef}`);
      L.push("📍 _Te comparto mi ubicación a continuación._");
    } else {
      L.push("🏠 *Retiro en el local*");
      L.push(`Horario: ${whenText()}`);
    }
    L.push("");
    if (i.pay === "Efectivo") L.push(`💵 Pago: Efectivo${i.cash ? ` (abono con ${money(Number(i.cash))})` : ""}`);
    else if (i.pay === "Transferencia") L.push("💵 Pago: Transferencia (te mando el comprobante)");
    else L.push(`💵 Pago: ${i.pay || "a coordinar"}`);
    if (state.generalNotes.trim()) {
      L.push("");
      L.push(`📝 Comentario: ${state.generalNotes.trim()}`);
    }
    return L.join("\n");
  }

  function waUrl() {
    return `https://wa.me/${CFG.whatsapp}?text=${encodeURIComponent(buildMessage())}`;
  }

  function send() {
    const url = waUrl();
    $("#retryLink").href = url;
    $("#sentLocTip").hidden = state.info.mode !== "delivery";
    const isTransfer = state.info.pay === "Transferencia" && !!CFG.transfer;
    $("#sentPayTip").hidden = !isTransfer;
    if (isTransfer) $("#sentPayText").textContent = transferText(true);
    saveLastOrder();
    const w = window.open(url, "_blank", "noopener");
    if (!w) window.location.href = url;
    openDialog($("#sentSheet"));
  }

  function next() {
    if (!state.lines.length) return;
    if (step === "cart") setStep("delivery");
    else if (step === "delivery") { if (validateDelivery()) { save(); setStep("review"); } }
    else send();
  }
  $("#nextBtn").addEventListener("click", next);

  $("#newOrderBtn").addEventListener("click", () => {
    state.lines = [];
    state.generalNotes = "";
    againDismissed = true; // recién lo envió: no ofrecer repetirlo enseguida
    changed();
    while (stack.length) closeTop();
    toast("Listo, podés armar un pedido nuevo");
    window.scrollTo({ top: 0 });
  });

  // Exponer para pruebas desde la consola.
  window.Fortunella = { buildMessage, waUrl, state, storeState, pickupSlots };

  /* ───────────────────── INICIO ───────────────────── */

  $("#search").addEventListener("input", (e) => applySearch(e.target.value));

  loadMenu()
    .then((mods) => {
      prepare(mods);
      restore();
      renderMenu();
      updateBar();
      renderAgain();
    })
    .catch((e) => {
      console.error(e);
      menuEl.textContent = "";
      menuEl.appendChild(h("p", { class: "loading", text: "No pudimos cargar la carta. Probá recargar la página." }));
    });
})();
