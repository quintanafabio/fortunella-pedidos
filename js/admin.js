/* Panel de Patio Fortunella: edita data/menu.json y lo guarda en GitHub. Sin backend.
 *
 * Acceso: una llave de GitHub (fine-grained token, solo "Contents" de este repo) se guarda en el repo
 * cifrada con la contraseña del panel (PBKDF2 + AES-GCM, en data/admin-key.json). Para entrar se baja ese
 * archivo, se descifra con la contraseña y la llave queda en este navegador mientras dure la sesión
 * (o hasta "Salir", si se marcó "Recordarme"). Sin la contraseña, el archivo cifrado no sirve.
 */
(function () {
  "use strict";

  const CFG = window.FORTUNELLA_CONFIG || {};
  const GH = Object.assign({ branch: "main", menuPath: "data/menu.json", keyPath: "data/admin-key.json" }, CFG.github || {});
  const API = `https://api.github.com/repos/${GH.owner}/${GH.repo}`;
  const TOKEN_KEY = "fortunella-admin-llave";
  const PBKDF2_ITER = 600000;

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const nf = new Intl.NumberFormat("es-AR");
  const money = (v) => "$" + nf.format(v);
  const norm = (s) => (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

  function h(tag, attrs, ...children) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k === "class") node.className = v;
      else if (k === "text") node.textContent = v;
      else if (k === "value") node.value = v;
      else if (k.startsWith("on")) node.addEventListener(k.slice(2), v);
      else node.setAttribute(k, v === true ? "" : v);
    }
    for (const c of children.flat()) {
      if (c == null || c === false) continue;
      node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    }
    return node;
  }

  /* ───────── Base64 (UTF-8) ───────── */
  const bytesToB64 = (bytes) => { let bin = ""; bytes.forEach((b) => (bin += String.fromCharCode(b))); return btoa(bin); };
  const b64ToBytes = (b64) => Uint8Array.from(atob(b64.replace(/\s/g, "")), (c) => c.charCodeAt(0));
  const textToB64 = (text) => bytesToB64(new TextEncoder().encode(text));
  const b64ToText = (b64) => new TextDecoder().decode(b64ToBytes(b64));

  /* ───────── Cifrado de la llave ───────── */
  async function deriveKey(password, salt, iter) {
    const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]);
    return crypto.subtle.deriveKey({ name: "PBKDF2", salt, iterations: iter, hash: "SHA-256" }, base,
      { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
  }
  async function encryptToken(token, password) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(password, salt, PBKDF2_ITER);
    const data = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(token)));
    return { v: 1, kdf: "PBKDF2-SHA256", iter: PBKDF2_ITER, salt: bytesToB64(salt), iv: bytesToB64(iv), data: bytesToB64(data),
      note: "Llave del panel de la carta, cifrada con la contraseña del panel. Sin la contraseña no sirve." };
  }
  async function decryptToken(box, password) {
    const key = await deriveKey(password, b64ToBytes(box.salt), box.iter || PBKDF2_ITER);
    const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: b64ToBytes(box.iv) }, key, b64ToBytes(box.data));
    return new TextDecoder().decode(plain);
  }

  /* ───────── GitHub ───────── */
  let token = "";

  class GhError extends Error {
    constructor(status, msg) { super(msg); this.status = status; }
  }
  async function gh(path, opts = {}, auth = true) {
    const headers = { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" };
    if (auth && token) headers.Authorization = `Bearer ${token}`;
    if (opts.body) headers["Content-Type"] = "application/json";
    let res;
    try {
      res = await fetch(API + path, { ...opts, headers, cache: "no-store" });
    } catch (_) {
      throw new GhError(0, "No hay conexión con GitHub. Revisá internet y probá de nuevo.");
    }
    if (!res.ok) {
      let detail = "";
      try { detail = (await res.json()).message || ""; } catch (_) { /* sin cuerpo */ }
      throw new GhError(res.status, detail || "HTTP " + res.status);
    }
    return res.json();
  }
  const contentsPath = (p) => `/contents/${p.split("/").map(encodeURIComponent).join("/")}`;
  async function getFile(path, auth = true) {
    const f = await gh(`${contentsPath(path)}?ref=${encodeURIComponent(GH.branch)}`, {}, auth);
    return { sha: f.sha, text: b64ToText(f.content || "") };
  }
  async function putFile(path, text, sha, message) {
    const body = { message, content: textToB64(text), branch: GH.branch };
    if (sha) body.sha = sha;
    const r = await gh(contentsPath(path), { method: "PUT", body: JSON.stringify(body) });
    return r.content.sha;
  }
  function explain(e) {
    if (e.status === 401) return "La llave de GitHub no es válida o venció. Configurá el acceso de nuevo con una llave nueva.";
    if (e.status === 403) return "La llave no tiene permiso para escribir en el repo. Revisá que tenga Contents: Read and write.";
    if (e.status === 404) return `No se encontró el repo ${GH.owner}/${GH.repo} o la llave no tiene acceso a él.`;
    if (e.status === 409) return "Alguien guardó cambios al mismo tiempo. Recargá la página y volvé a hacer los cambios.";
    return e.message || "Algo salió mal.";
  }

  /* ───────── Vistas ───────── */
  const views = ["bootMsg", "loginView", "setupView", "editorView"];
  function show(id) {
    views.forEach((v) => ($("#" + v).hidden = v !== id));
    $("#logoutBtn").hidden = id !== "editorView";
    if (id !== "editorView") $("#saveBar").hidden = true;
    const f = $("#" + id).querySelector("input");
    if (f) setTimeout(() => f.focus(), 30);
  }
  function setError(id, msg) {
    const el = $("#" + id);
    el.textContent = msg || "";
    el.hidden = !msg;
  }
  function busy(btn, on, label) {
    btn.disabled = on;
    if (on) { btn.dataset.label = btn.textContent; btn.textContent = label; }
    else if (btn.dataset.label) btn.textContent = btn.dataset.label;
  }

  let toastTimer;
  function toast(msg, ms = 3500) {
    const t = $("#toast");
    t.textContent = "";
    t.appendChild(h("span", { class: "toast-msg", text: msg }));
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), ms);
  }

  function storedToken() {
    try { return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY) || ""; } catch (_) { return ""; }
  }
  function keepToken(t, remember) {
    try {
      sessionStorage.setItem(TOKEN_KEY, t);
      if (remember) localStorage.setItem(TOKEN_KEY, t); else localStorage.removeItem(TOKEN_KEY);
    } catch (_) { /* sin almacenamiento: queda solo en memoria */ }
  }
  function forgetToken() {
    try { sessionStorage.removeItem(TOKEN_KEY); localStorage.removeItem(TOKEN_KEY); } catch (_) { /* nada */ }
    token = "";
  }

  // ¿Ya hay una llave guardada en el repo? (se lee sin llave: el repo es público)
  async function loadKeyBox() {
    try {
      const f = await getFile(GH.keyPath, false);
      return JSON.parse(f.text);
    } catch (e) {
      if (e.status === 404) return null;
      // Sin la API (límite de consultas): probar la copia publicada.
      const res = await fetch(`https://raw.githubusercontent.com/${GH.owner}/${GH.repo}/${GH.branch}/${GH.keyPath}`, { cache: "no-store" });
      if (res.status === 404) return null;
      if (!res.ok) throw e;
      return res.json();
    }
  }

  /* Entrar */
  let keyBox = null;
  $("#loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    setError("loginError", "");
    const pass = $("#loginPass").value;
    if (!pass) return setError("loginError", "Escribí la contraseña.");
    const btn = $("#loginBtn");
    busy(btn, true, "Entrando…");
    try {
      if (!keyBox) keyBox = await loadKeyBox();
      if (!keyBox) { show("setupView"); return; }
      let t;
      try { t = await decryptToken(keyBox, pass); } catch (_) {
        setError("loginError", "Contraseña incorrecta.");
        $("#loginPass").select();
        return;
      }
      token = t;
      await openEditor();
      keepToken(t, $("#loginRemember").checked);
      $("#loginPass").value = "";
    } catch (err) {
      token = "";
      setError("loginError", explain(err));
    } finally {
      busy(btn, false);
    }
  });

  /* Configurar el acceso */
  $("#setupForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    setError("setupError", "");
    const t = $("#setupToken").value.trim();
    const p1 = $("#setupPass").value;
    const p2 = $("#setupPass2").value;
    if (!t) return setError("setupError", "Pegá la llave de GitHub.");
    if (p1.length < 10) return setError("setupError", "La contraseña tiene que tener al menos 10 caracteres.");
    if (p1 !== p2) return setError("setupError", "Las contraseñas no coinciden.");
    const btn = $("#setupBtn");
    busy(btn, true, "Guardando…");
    try {
      token = t;
      // Verifica que la llave puede leer la carta y escribir (guardando la llave cifrada).
      await getFile(GH.menuPath);
      let sha = null;
      try { sha = (await getFile(GH.keyPath)).sha; } catch (err) { if (err.status !== 404) throw err; }
      keyBox = await encryptToken(t, p1);
      await putFile(GH.keyPath, JSON.stringify(keyBox, null, 2) + "\n", sha, "Panel: acceso configurado");
      keepToken(t, false);
      $("#setupForm").reset();
      await openEditor();
      toast("Acceso guardado. La próxima vez entrás solo con la contraseña.", 5000);
    } catch (err) {
      token = "";
      setError("setupError", explain(err));
    } finally {
      busy(btn, false);
    }
  });

  $("#toSetup").addEventListener("click", () => { $("#toLogin").hidden = false; show("setupView"); });
  $("#toLogin").addEventListener("click", () => show("loginView"));
  $("#logoutBtn").addEventListener("click", () => {
    if (dirty() && !confirm("Tenés cambios sin guardar. ¿Salir igual?")) return;
    forgetToken();
    original = "";
    location.reload();
  });

  /* ───────── Editor ───────── */
  let data = null; // carta que se está editando
  let original = ""; // JSON tal como está en GitHub
  let menuSha = null;
  const dirty = () => !!data && JSON.stringify(data) !== original;

  async function openEditor() {
    const f = await getFile(GH.menuPath);
    data = JSON.parse(f.text);
    menuSha = f.sha;
    original = JSON.stringify(data);
    renderEditor();
    show("editorView");
    updateSaveBar();
  }

  const LAYOUT_HINT = {
    "pizza-grid": "Pizzas: el grupo define la pestaña (Clásicas, Clásicas reversionadas, Especiales).",
    "emp-table": "Empanadas: precio por unidad.",
    "bebidas-grid": "Bebidas: el tamaño va al final del nombre (ej. “Coca Zero 1L”, “Corona 710ml”). El grupo es el recuadro (Sin Alcohol, Porrones, Tragos…).",
  };
  const usesGroups = (mod) => mod.layout_type === "pizza-grid" || mod.layout_type === "bebidas-grid" || mod.items.some((i) => i.subgroup);

  function renderEditor() {
    const wrap = $("#sections");
    wrap.textContent = "";
    $("#admMeta").textContent = `${data.modules.reduce((s, m) => s + m.items.length, 0)} productos · última actualización: ${data.updated || "—"}`;
    data.modules.forEach((mod, mi) => {
      const groups = [...new Set(mod.items.map((i) => i.subgroup).filter(Boolean))];
      const listId = `groups-${mi}`;
      const sec = h("details", { class: "adm-sec", open: mi === 0 },
        h("summary", null,
          h("span", { class: "adm-sec-name", text: mod.name || "(sin nombre)" }),
          h("span", { class: "adm-sec-count", text: `${mod.items.length} productos` })),
        h("div", { class: "adm-sec-body" },
          LAYOUT_HINT[mod.layout_type] ? h("p", { class: "adm-hint", text: LAYOUT_HINT[mod.layout_type] }) : null,
          h("div", { class: "adm-grid2" },
            field("Nombre de la sección", h("input", { type: "text", value: mod.name, oninput: (e) => { mod.name = e.target.value; sec.querySelector(".adm-sec-name").textContent = mod.name || "(sin nombre)"; changed(); } })),
            field("Subtítulo", h("input", { type: "text", value: mod.subtitle || "", oninput: (e) => { mod.subtitle = e.target.value; changed(); } }))),
          groups.length ? h("datalist", { id: listId }, groups.map((g) => h("option", { value: g }))) : null,
          h("div", { class: "adm-items" }, mod.items.map((it, ii) => itemEditor(mod, it, ii, listId))),
          h("button", { type: "button", class: "btn ghost adm-add", text: "+ Agregar producto", onclick: () => addItem(mod, mi) })));
      wrap.appendChild(sec);
    });
    applyFilter();
  }

  function field(label, input, cls) {
    return h("label", { class: "adm-field" + (cls ? " " + cls : "") }, h("span", { class: "adm-lbl", text: label }), input);
  }

  function itemEditor(mod, it, ii, listId) {
    const card = h("div", { class: "adm-item" + (it.hidden ? " off" : ""), "data-name": norm(it.name) });
    const prices = h("div", { class: "adm-prices" });
    const renderPrices = () => {
      prices.textContent = "";
      it.prices.forEach((p, pi) => {
        prices.appendChild(h("div", { class: "adm-price" },
          h("input", { type: "text", class: "adm-plabel", value: p.label, placeholder: "Tamaño", "aria-label": "Tamaño (opcional)",
            oninput: (e) => { p.label = e.target.value.toUpperCase(); changed(); } }),
          h("span", { class: "adm-dollar", text: "$" }),
          h("input", { type: "text", inputmode: "numeric", class: "adm-pvalue", value: p.value ? String(p.value) : "", placeholder: "0", "aria-label": `Precio${p.label ? " " + p.label : ""}`,
            oninput: (e) => {
              const d = e.target.value.replace(/\D/g, "");
              e.target.value = d;
              p.value = d ? Number(d) : 0;
              e.target.closest(".adm-price").classList.toggle("bad", !p.value);
              changed();
            } }),
          it.prices.length > 1 ? h("button", { type: "button", class: "adm-x", "aria-label": "Quitar este precio", text: "×",
            onclick: () => { it.prices.splice(pi, 1); renderPrices(); changed(); } }) : null));
      });
      prices.appendChild(h("button", { type: "button", class: "adm-mini", text: "+ precio", onclick: () => { it.prices.push({ label: "", value: 0 }); renderPrices(); changed(); } }));
    };
    renderPrices();

    const avail = h("input", { type: "checkbox", checked: !it.hidden, onchange: (e) => {
      if (e.target.checked) delete it.hidden; else it.hidden = true;
      card.classList.toggle("off", !!it.hidden);
      changed();
    } });

    card.append(...[
      h("div", { class: "adm-item-head" },
        h("input", { type: "text", class: "adm-name", value: it.name, placeholder: "Nombre del producto", "aria-label": "Nombre del producto",
          oninput: (e) => { it.name = e.target.value; card.dataset.name = norm(it.name); e.target.classList.toggle("bad", !it.name.trim()); changed(); } }),
        h("label", { class: "adm-avail", title: "Si lo destildás, no aparece en la carta (por ejemplo, sin stock)" }, avail, h("span", { text: "Disponible" }))),
      mod.layout_type === "emp-table" || mod.layout_type === "bebidas-grid" ? null
        : field("Descripción", h("textarea", { rows: 2, value: it.description || "", oninput: (e) => { setOpt(it, "description", e.target.value); changed(); } }), "wide"),
      h("div", { class: "adm-row" },
        usesGroups(mod) ? field("Grupo", h("input", { type: "text", list: listId, value: it.subgroup || "", oninput: (e) => { setOpt(it, "subgroup", e.target.value); changed(); } })) : null,
        mod.layout_type === "pizza-grid" || mod.layout_type === "list"
          ? field("Adicional", h("input", { type: "text", value: it.note || "", placeholder: "+ alioli $600", oninput: (e) => { setOpt(it, "note", e.target.value); changed(); } }))
          : null),
      prices,
      h("div", { class: "adm-item-actions" },
        h("button", { type: "button", class: "adm-mini", text: "↑ Subir", disabled: ii === 0, onclick: () => move(mod, ii, -1) }),
        h("button", { type: "button", class: "adm-mini", text: "↓ Bajar", disabled: ii === mod.items.length - 1, onclick: () => move(mod, ii, 1) }),
        h("span", { class: "adm-spacer" }),
        h("button", { type: "button", class: "adm-mini danger", text: "Eliminar", onclick: () => {
          if (!confirm(`¿Eliminar “${it.name || "este producto"}” de la carta?\n\nSi es por falta de stock, mejor destildá “Disponible”.`)) return;
          mod.items.splice(ii, 1);
          rerender();
        } })),
    ].filter(Boolean)); // append() escribiría "null" con los campos que no corresponden
    return card;
  }

  function setOpt(obj, key, value) {
    if (value && value.trim()) obj[key] = value; else delete obj[key];
  }
  function move(mod, i, d) {
    const [x] = mod.items.splice(i, 1);
    mod.items.splice(i + d, 0, x);
    rerender();
  }
  function addItem(mod, mi) {
    const tpl = mod.items[0];
    const it = { name: "", prices: tpl ? tpl.prices.map((p) => ({ label: p.label, value: 0 })) : [{ label: "", value: 0 }] };
    if (tpl && tpl.subgroup) it.subgroup = tpl.subgroup;
    mod.items.push(it);
    rerender(mi);
    const cards = $$(".adm-sec")[mi].querySelectorAll(".adm-item");
    const last = cards[cards.length - 1];
    last.scrollIntoView({ block: "center", behavior: "smooth" });
    last.querySelector(".adm-name").focus({ preventScroll: true });
  }
  // Vuelve a dibujar manteniendo abiertas las secciones que estaban abiertas.
  function rerender(openIndex) {
    const open = $$(".adm-sec").map((d) => d.open);
    if (openIndex != null) open[openIndex] = true;
    const y = window.scrollY;
    renderEditor();
    $$(".adm-sec").forEach((d, i) => (d.open = !!open[i]));
    window.scrollTo(0, y);
    changed();
  }

  function changed() { updateSaveBar(); }
  function updateSaveBar() {
    const d = dirty();
    $("#saveBar").hidden = !d;
    document.body.classList.toggle("has-savebar", d);
  }

  function applyFilter() {
    const q = norm($("#admSearch").value.trim());
    $$(".adm-sec").forEach((sec) => {
      let any = false;
      $$(".adm-item", sec).forEach((c) => {
        const hit = !q || c.dataset.name.includes(q);
        c.hidden = !hit;
        any = any || hit;
      });
      sec.hidden = !!q && !any;
      if (q && any) sec.open = true;
    });
  }
  $("#admSearch").addEventListener("input", applyFilter);

  // Antes de guardar: nombres y precios completos.
  function firstProblem() {
    for (const [mi, mod] of data.modules.entries()) {
      if (!mod.name.trim()) return { mi, msg: "Hay una sección sin nombre." };
      for (const [ii, it] of mod.items.entries()) {
        if (!it.name.trim()) return { mi, ii, msg: `En “${mod.name}” hay un producto sin nombre.` };
        if (!it.prices.length || it.prices.some((p) => !(p.value > 0))) return { mi, ii, msg: `“${it.name}” tiene un precio vacío o en cero.` };
      }
    }
    return null;
  }

  $("#saveBtn").addEventListener("click", async () => {
    const prob = firstProblem();
    if (prob) {
      toast("⚠ " + prob.msg, 5000);
      const sec = $$(".adm-sec")[prob.mi];
      if (sec) {
        sec.hidden = false; sec.open = true;
        const card = prob.ii != null ? sec.querySelectorAll(".adm-item")[prob.ii] : sec;
        if (card) { card.hidden = false; card.scrollIntoView({ block: "center", behavior: "smooth" }); card.classList.add("flash"); setTimeout(() => card.classList.remove("flash"), 1600); }
      }
      return;
    }
    const btn = $("#saveBtn");
    busy(btn, true, "Guardando…");
    try {
      const current = await getFile(GH.menuPath);
      if (current.sha !== menuSha) {
        toast("⚠ La carta cambió en GitHub mientras editabas (¿otra persona o pestaña?). Recargá la página para ver la versión nueva; tus cambios de acá se van a perder.", 9000);
        return;
      }
      data.modules.forEach((m) => m.items.forEach((it) => { it.name = it.name.trim(); }));
      data.updated = new Date().toISOString().slice(0, 10);
      const text = JSON.stringify(data, null, 2) + "\n";
      menuSha = await putFile(GH.menuPath, text, menuSha, `Carta: cambios desde el panel (${data.updated})`);
      original = JSON.stringify(data);
      updateSaveBar();
      $("#admMeta").textContent = `${data.modules.reduce((s, m) => s + m.items.length, 0)} productos · última actualización: ${data.updated}`;
      toast("✓ ¡Guardado! En unos minutos (hasta 5) se ve en la carta.", 6000);
    } catch (err) {
      toast("⚠ " + explain(err), 8000);
    } finally {
      busy(btn, false);
    }
  });

  $("#discardBtn").addEventListener("click", () => {
    if (!confirm("¿Descartar los cambios que no guardaste?")) return;
    data = JSON.parse(original);
    renderEditor();
    updateSaveBar();
  });

  window.addEventListener("beforeunload", (e) => {
    if (dirty()) { e.preventDefault(); e.returnValue = ""; }
  });

  /* ───────── Inicio ───────── */
  (async function boot() {
    $("#repoName").textContent = `${GH.owner}/${GH.repo}`;
    if (!GH.owner || !GH.repo) { $("#bootMsg").textContent = "Falta configurar el repo en js/config.js (github)."; return; }
    if (!window.crypto || !crypto.subtle) { $("#bootMsg").textContent = "Este navegador no permite el panel. Abrilo con https en Chrome, Safari o Firefox actualizados."; return; }
    const saved = storedToken();
    if (saved) {
      token = saved;
      try { await openEditor(); return; } catch (err) {
        forgetToken();
        if (err.status !== 401) { show("loginView"); setError("loginError", explain(err)); return; }
      }
    }
    try {
      keyBox = await loadKeyBox();
      show(keyBox ? "loginView" : "setupView");
      if (!keyBox) $("#toLogin").hidden = true;
    } catch (err) {
      show("loginView");
      setError("loginError", explain(err));
    }
  })();

  // Para pruebas desde la consola.
  window.FortunellaAdmin = { encryptToken, decryptToken, get data() { return data; } };
})();
