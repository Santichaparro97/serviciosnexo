// ============================================================
//  NEXO · Servicios (versión pública para clientes)
//  Solo lectura. Lee el mismo contenido de Supabase que el panel
//  interno, con caché local para render inmediato / offline.
// ============================================================

const STORAGE_KEY = "serviciosnexo-cache-v1";

let state = loadCache();
let activeId = state.servicios[0]?.id || null;

function loadCache() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return structuredClone(DATA_DEFAULT);
}

// ---------- Helpers ----------
const $ = (s) => document.querySelector(s);
const esc = (s = "") =>
  String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const getService = (id) => state.servicios.find((s) => s.id === id);

// ---------- Sincronizar desde la nube ----------
async function syncFromCloud() {
  try {
    const remote = await cloudLoad();
    if (remote && remote.servicios) {
      state = remote;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      if (!getService(activeId)) activeId = state.servicios[0]?.id || null;
      render();
    }
  } catch (e) {
    console.error("cloudLoad error", e);
  }
}

// ---------- Render marca ----------
function renderBrand() {
  // La marca pública es fija (NEXO); el contenido de servicios sí viene de la nube.
  $("#brandName").textContent = "NEXO";
  $("#brandSub").textContent = "Servicios de desarrollo web";
}

// ---------- Render tabs ----------
function renderTabs() {
  const tabs = $("#tabs");
  tabs.innerHTML = state.servicios
    .map(
      (s) => `
      <button class="tab ${s.id === activeId ? "active" : ""}" data-id="${s.id}">
        <span class="ic">${esc(s.icono || "•")}</span> ${esc(s.nombre)}
      </button>`
    )
    .join("");
  tabs.querySelectorAll(".tab").forEach((t) =>
    t.addEventListener("click", () => {
      activeId = t.dataset.id;
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
    })
  );
}

// ---------- Render contenido ----------
function renderContent() {
  const s = getService(activeId);
  const content = $("#content");
  if (!s) {
    content.innerHTML = "<p>Sin servicios.</p>";
    return;
  }

  const beneficios = (s.beneficios || [])
    .map(
      (b) => `
      <div class="benefit">
        <span class="b-ic">◆</span>
        <div class="b-text"><b>${esc(b.titulo)}</b><span>${esc(b.detalle)}</span></div>
      </div>`
    )
    .join("");

  const incluye = (s.incluye || []).map((i) => `<li>${esc(i)}</li>`).join("");

  const packs = (s.paquetes || [])
    .map(
      (p) => `
      <div class="pack">
        <div class="p-name">${esc(p.nombre)}</div>
        <div class="p-price">${esc(p.precio)}</div>
        <div class="p-detail">${esc(p.detalle)}</div>
      </div>`
    )
    .join("");

  content.innerHTML = `
    <div class="top-row">
      <section class="hero">
        <div class="ic">${esc(s.icono || "•")}</div>
        <h2>${esc(s.nombre)}</h2>
        <p class="tagline">${esc(s.tagline || "")}</p>
        <p class="desc">${esc(s.descripcion || "")}</p>
      </section>

      <aside class="panel price-col">
        <h3>Paquetes / Precios</h3>
        <div class="packs-vert">${packs || '<p class="ideal">—</p>'}</div>
      </aside>
    </div>

    <div class="grid">
      <div class="panel panel--benef">
        <h3>Beneficios</h3>
        ${beneficios || '<p class="ideal">—</p>'}
      </div>
      <div class="panel panel--incluye">
        <h3>Qué incluye</h3>
        <ul class="list">${incluye || "<li>—</li>"}</ul>
        <h3 style="margin-top:18px">Ideal para</h3>
        <p class="ideal">${esc(s.idealPara || "—")}</p>
      </div>
    </div>
  `;
}

function render() {
  renderBrand();
  renderTabs();
  renderContent();
}

// Init
render();
syncFromCloud();
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") syncFromCloud();
});
