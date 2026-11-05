/* Fortunella — carta con pedido online por WhatsApp. Sin dependencias, sin backend. */
(function () {
  "use strict";

  const CFG = Object.assign(
    { whatsapp: "", halfAndHalfPrice: "max", deliveryFee: null, paymentMethods: ["Efectivo", "Transferencia"] },
    window.FORTUNELLA_CONFIG || {}
  );
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
        item.halfEligible = mod.layout_type === "pizza-grid" && !item.featured && prices.length >= 2;
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
    info: { name: "", mode: "", address: "", addressRef: "", when: "asap", time: "", pay: "", cash: "" },
  };

  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (_) { /* modo privado */ }
  }
  function restore() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORE_KEY) || "null");
      if (!raw) return;
      state.generalNotes = raw.generalNotes || "";
      Object.assign(state.info, raw.info || {});
      state.lines = (raw.lines || []).filter((l) => {
        const it = ITEMS.get(l.itemId);
        if (!it || it.name !== l.name) return false;
        if (l.size && !it.prices.some((p) => p.label === l.size)) return false;
        if (l.halfId && !ITEMS.get(l.halfId)) return false;
        return l.qty > 0;
      });
    } catch (_) { /* datos corruptos: se ignoran */ }
  }

  function priceFor(item, size) {
    const p = item.prices.find((x) => (x.label || null) === (size || null)) || item.prices[0];
    return p ? p.value : 0;
  }
  function unitPrice(line) {
    const item = ITEMS.get(line.itemId);
    let base = priceFor(item, line.size);
    if (line.halfId) {
      const other = priceFor(ITEMS.get(line.halfId), line.size);
      base = CFG.halfAndHalfPrice === "avg" ? Math.ceil((base + other) / 2) : Math.max(base, other);
    }
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

  function priceLine(item) {
    const node = h("p", { class: "item-prices" });
    item.prices.forEach((p, i) => {
      if (i) node.appendChild(h("span", { class: "sep", "aria-hidden": "true", text: "·" }));
      node.appendChild(document.createTextNode(p.label ? `${sizeName(p.label)} ${money(p.value)}` : money(p.value)));
    });
    return node;
  }

  function itemCard(item) {
    const compact = !item.description && item.prices.length === 1 && !item.featured;
    const card = h(
      "button",
      {
        type: "button",
        class: "item" + (item.featured ? " featured" : "") + (compact ? " compact" : ""),
        dataset: { id: item.id },
        "aria-label": `Agregar ${item.name}`,
        onclick: () => openItem(item.id),
      },
      h(
        "span",
        { class: "item-main" },
        h("span", { class: "item-name" }, item.featured ? `✦ ${item.name} ✦` : item.name,
          item.note ? h("span", { class: "item-note", text: " " + item.note }) : null,
          item.extras.length ? h("span", { class: "item-note", text: " " + item.extras.map((e) => `+ ${e.name} ${money(e.price)}`).join(" ") }) : null),
        item.description ? h("span", { class: "item-desc", text: item.description }) : null,
        priceLine(item)
      ),
      h("span", { class: "item-add", "aria-hidden": "true", text: "+" })
    );
    return card;
  }

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
    refreshBadges();
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

  function refreshBadges() {
    const counts = {};
    state.lines.forEach((l) => {
      counts[l.itemId] = (counts[l.itemId] || 0) + l.qty;
      if (l.halfId) counts[l.halfId] = counts[l.halfId] || 0;
    });
    $$(".item", menuEl).forEach((card) => {
      const n = counts[card.dataset.id] || 0;
      card.classList.toggle("in-cart", n > 0);
      let b = $(".item-badge", card);
      if (n > 0) {
        if (!b) { b = h("span", { class: "item-badge" }); card.appendChild(b); }
        b.textContent = n;
        b.setAttribute("aria-label", `${n} en tu pedido`);
      } else if (b) b.remove();
    });
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
    if (e.key === "Escape" && stack.length) { e.preventDefault(); closeTop(); }
  });
  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-close]")) closeTop();
  });

  /* ───────────────────── HOJA DE PRODUCTO ───────────────────── */

  const sheet = $("#itemSheet");
  const sheetState = { item: null, editIndex: -1, qty: 1, size: null };

  function openItem(itemId, editIndex = -1) {
    const item = ITEMS.get(itemId);
    const line = editIndex >= 0 ? state.lines[editIndex] : null;
    sheetState.item = item;
    sheetState.editIndex = editIndex;
    sheetState.qty = line ? line.qty : 1;

    $("#sheetCat").textContent = item.cat + (item.subgroup ? " · " + item.subgroup : "");
    $("#sheetTitle").textContent = item.name;
    $("#sheetDesc").textContent = item.description;
    $("#sheetDesc").hidden = !item.description;

    // Tamaños
    const pills = $("#sizePills");
    pills.textContent = "";
    const multi = item.prices.length > 1;
    $("#sizeField").hidden = !multi;
    $("#sizeField legend").textContent = item.layout === "emp-table" ? "Presentación" : "Tamaño";
    const preferred = line ? line.size : (item.prices.find((p) => p.label === "GRANDE") || item.prices[0] || {}).label || null;
    sheetState.size = multi ? preferred : (item.prices[0] && item.prices[0].label) || null;
    if (multi) {
      item.prices.forEach((p) => {
        pills.appendChild(h("label", { class: "pill" },
          h("input", { type: "radio", name: "size", value: p.label, checked: p.label === sheetState.size,
            onchange: () => { sheetState.size = p.label; buildHalfOptions(); updateSheetPrice(); } }),
          h("span", null, sizeName(p.label), h("small", { text: money(p.value) }))
        ));
      });
    }

    // Mitad y mitad
    $("#halfField").hidden = !item.halfEligible;
    $("#halfToggle").checked = !!(line && line.halfId);
    $("#halfPick").hidden = !$("#halfToggle").checked;
    buildHalfOptions(line && line.halfId);

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

  function buildHalfOptions(selectedId) {
    const item = sheetState.item;
    if (!item || !item.halfEligible) return;
    const sel = $("#halfSelect");
    const keep = selectedId || sel.value;
    sel.textContent = "";
    const size = sheetState.size;
    for (const it of ITEMS.values()) {
      if (!it.halfEligible || it.id === item.id) continue;
      const p = it.prices.find((x) => x.label === size);
      if (!p) continue;
      sel.appendChild(h("option", { value: it.id, text: `${it.name} — ${money(p.value)}`, selected: it.id === keep }));
    }
    $("#halfHint").textContent = CFG.halfAndHalfPrice === "avg"
      ? "Se cobra el promedio de las dos mitades."
      : "Se cobra el precio de la mitad más cara.";
  }

  function readSheetLine() {
    const item = sheetState.item;
    const half = item.halfEligible && $("#halfToggle").checked ? $("#halfSelect").value || null : null;
    return {
      itemId: item.id,
      name: item.name,
      size: sheetState.size,
      halfId: half,
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
  $("#halfToggle").addEventListener("change", (e) => { $("#halfPick").hidden = !e.target.checked; updateSheetPrice(); });
  $("#halfSelect").addEventListener("change", updateSheetPrice);

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
  });

  /* ───────────────────── BARRA + TOAST ───────────────────── */

  const bar = $("#cartBar");
  bar.addEventListener("click", () => openDrawer("cart"));

  function updateBar() {
    const n = itemCount();
    bar.hidden = n === 0;
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
  function toast(msg) {
    const t = $("#toast");
    t.textContent = "✓ " + msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 2200);
  }

  function changed() {
    save();
    updateBar();
    refreshBadges();
    updateTotals();
  }

  /* ───────────────────── PANEL DEL PEDIDO ───────────────────── */

  const drawer = $("#drawer");
  const STEPS = ["cart", "delivery", "review"];
  const TITLES = { cart: "Tu pedido", delivery: "Entrega", review: "Confirmar" };
  let step = "cart";

  function openDrawer(s) {
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

  function defaultPickupTime() {
    const d = new Date(Date.now() + 40 * 60000);
    const mins = Math.ceil(d.getMinutes() / 15) * 15;
    d.setMinutes(mins, 0, 0);
    return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
  }

  function fillDeliveryForm() {
    const i = state.info;
    $("#custName").value = i.name;
    $("#address").value = i.address;
    $("#addressRef").value = i.addressRef;
    $("#pickupTime").value = i.time || defaultPickupTime();
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
    i.address = $("#address").value.trim();
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
    if (i.mode === "delivery") mark("address", i.address.length >= 4);
    if (i.mode === "pickup" && i.when === "time") mark("pickupTime", /^\d{2}:\d{2}$/.test(i.time));
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
      add("Dirección", i.address);
      add("Referencia", i.addressRef);
      add("Envío", hasFee() ? money(CFG.deliveryFee) : "A confirmar");
    } else {
      add("Horario", whenText());
    }
    add("Pago", i.pay ? i.pay + (i.pay === "Efectivo" && i.cash ? ` (abona con ${money(Number(i.cash))})` : "") : "A coordinar");
    r.appendChild(h("div", { class: "review-block" }, h("h3", null, "Entrega", editBtn("delivery")), kv));

    if (state.generalNotes.trim()) {
      r.appendChild(h("div", { class: "review-block" }, h("h3", null, "Comentario", editBtn("cart")),
        h("p", { text: state.generalNotes.trim() })));
    }
  }

  function buildMessage() {
    const i = state.info;
    const L = [];
    L.push("🍕 *NUEVO PEDIDO · FORTUNELLA*");
    L.push(`A nombre de: *${i.name}*`);
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
      L.push(`Dirección: ${i.address}`);
      if (i.addressRef) L.push(`Referencia: ${i.addressRef}`);
    } else {
      L.push("🏠 *Retiro en el local*");
      L.push(`Horario: ${whenText()}`);
    }
    L.push("");
    L.push(`💵 Pago: ${i.pay || "a coordinar"}${i.pay === "Efectivo" && i.cash ? ` (abono con ${money(Number(i.cash))})` : ""}`);
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
    changed();
    while (stack.length) closeTop();
    toast("Listo, podés armar un pedido nuevo");
    window.scrollTo({ top: 0 });
  });

  // Exponer para pruebas desde la consola.
  window.Fortunella = { buildMessage, waUrl, state };

  /* ───────────────────── INICIO ───────────────────── */

  $("#search").addEventListener("input", (e) => applySearch(e.target.value));

  loadMenu()
    .then((mods) => {
      prepare(mods);
      restore();
      renderMenu();
      updateBar();
    })
    .catch((e) => {
      console.error(e);
      menuEl.textContent = "";
      menuEl.appendChild(h("p", { class: "loading", text: "No pudimos cargar la carta. Probá recargar la página." }));
    });
})();
