/* State */
const state = {
  step: 1,
  totalSteps: 6,
  basics: {
    fullName: "",
    email: "",
    location: "",
    yearsExp: 3,
    role: "Interior Designer",
  },
  seniority: {
    projectsCount: 15,
    budgetTierScore: 5,
    budgetTierLabel: "&lt;$10k",
    leadership: [],
    certifications: [],
  },
  domains: [],
  themes: {
    styles: [],
    materials: [],
    palettes: [],
  },
  projects: [],
};

const STORAGE_KEY = "designer_questionnaire_v1";

/* Utilities */
const byId = (id) => document.getElementById(id);
const qs = (sel, el = document) => el.querySelector(sel);
const qsa = (sel, el = document) => Array.from(el.querySelectorAll(sel));

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
function restore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    Object.assign(state, parsed);
  } catch {}
}

function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

function computeSeniorityLevel() {
  const yearsScore = clamp(state.basics.yearsExp * 3, 0, 90);
  const projectsScore = clamp(state.seniority.projectsCount * 0.6, 0, 72);
  const budgetScore = clamp(state.seniority.budgetTierScore, 0, 60);
  const leadershipScore = state.seniority.leadership.reduce((sum, item) => sum + (item.weight || 0), 0);
  const certScore = state.seniority.certifications.reduce((sum, item) => sum + (item.weight || 0), 0);
  const total = yearsScore + projectsScore + budgetScore + leadershipScore + certScore;
  const level = total >= 140 ? "Senior" : total >= 70 ? "Mid-level" : "Junior";
  return { level, total, breakdown: { yearsScore, projectsScore, budgetScore, leadershipScore, certScore } };
}

/* Progress */
function updateProgress() {
  const { step, totalSteps } = state;
  const pct = (step - 1) / (totalSteps - 1) * 100;
  byId("progressBar").style.width = `${pct}%`;
}

function syncStepVisibility() {
  qsa(".step").forEach((s) => s.classList.toggle("is-active", Number(s.dataset.step) === state.step));
  updateProgress();
  byId("prevBtn").disabled = state.step === 1;
  byId("nextBtn").textContent = state.step === state.totalSteps ? "Finish" : "Next";
}

function go(delta) {
  state.step = clamp(state.step + delta, 1, state.totalSteps);
  syncStepVisibility();
  persist();
  if (state.step === 6) renderReview();
}

/* Builders */
function buildSegmentedToggle(container, onChange) {
  container.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    qsa("button", container).forEach((b) => b.classList.remove("is-selected"));
    btn.classList.add("is-selected");
    onChange(btn);
  });
}

function buildPills(container, multi = true, onToggle) {
  container.addEventListener("click", (e) => {
    const pill = e.target.closest(".pill");
    if (!pill) return;
    if (multi) pill.classList.toggle("is-selected");
    else {
      qsa(".pill", container).forEach((p) => p.classList.remove("is-selected"));
      pill.classList.add("is-selected");
    }
    onToggle(pill);
  });
}

function buildCardsForDomains() {
  const data = [
    { key: "Residential", img: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1000&q=60", desc: "Homes, apartments, villas" },
    { key: "Commercial", img: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1000&q=60", desc: "Offices, studios, co-working" },
    { key: "Hospitality", img: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1000&q=60", desc: "Hotels, restaurants, lounges" },
    { key: "Retail", img: "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=1000&q=60", desc: "Stores, pop-ups, showrooms" },
    { key: "Healthcare", img: "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=1000&q=60", desc: "Clinics, wellness centers" },
    { key: "Education", img: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1000&q=60", desc: "Schools, labs, libraries" },
    { key: "Workplace", img: "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=1000&q=60", desc: "Work floors, meeting rooms" },
  ];
  const container = byId("domainCards");
  container.innerHTML = "";
  data.forEach((d) => {
    const card = document.createElement("button");
    card.className = "card-item";
    card.type = "button";
    card.innerHTML = `
      <div class="card-item__media"></div>
      <div class="card-item__body">
        <div class="card-item__title">${d.key}</div>
        <div class="card-item__desc">${d.desc}</div>
      </div>`;
    const media = qs(".card-item__media", card);
    // Preload with fallback
    const testImg = new Image();
    testImg.onload = () => { media.style.backgroundImage = `url('${d.img}')`; };
    testImg.onerror = () => { media.style.backgroundImage = `url('https://placehold.co/1000x600?text=${encodeURIComponent(d.key)}')`; };
    testImg.src = d.img;
    card.addEventListener("click", () => {
      card.classList.toggle("is-selected");
      const selected = new Set(state.domains);
      if (selected.has(d.key)) selected.delete(d.key); else selected.add(d.key);
      state.domains = Array.from(selected);
      persist();
    });
    container.appendChild(card);
  });
}

function buildStyleAndMaterialPills() {
  const styles = [
    "Modern", "Contemporary", "Minimalist", "Scandinavian", "Industrial",
    "Mid-century", "Traditional", "Transitional", "Bohemian", "Japandi",
    "Art Deco", "Rustic", "Eclectic", "Coastal", "Farmhouse"
  ];
  const materials = [
    "Natural wood", "Stone & marble", "Concrete", "Glass", "Metal",
    "Rattan", "Terrazzo", "Textured fabrics", "Reclaimed materials"
  ];
  const palettes = ["#0f172a", "#111827", "#1f2937", "#334155", "#475569", "#64748b", "#a3e635", "#22c55e", "#06b6d4", "#f59e0b", "#ef4444", "#eab308", "#a3a3a3", "#f5f5f5", "#ffffff"]; 

  const styleWrap = byId("stylePills");
  const materialWrap = byId("materialPills");
  const paletteWrap = byId("paletteSwatches");
  styleWrap.innerHTML = materialWrap.innerHTML = paletteWrap.innerHTML = "";

  styles.forEach((s) => {
    const b = document.createElement("button");
    b.className = "pill";
    b.type = "button";
    b.textContent = s;
    b.addEventListener("click", () => {
      b.classList.toggle("is-selected");
      const set = new Set(state.themes.styles);
      if (set.has(s)) set.delete(s); else set.add(s);
      state.themes.styles = Array.from(set);
      persist();
    });
    styleWrap.appendChild(b);
  });

  materials.forEach((m) => {
    const b = document.createElement("button");
    b.className = "pill";
    b.type = "button";
    b.textContent = m;
    b.addEventListener("click", () => {
      b.classList.toggle("is-selected");
      const set = new Set(state.themes.materials);
      if (set.has(m)) set.delete(m); else set.add(m);
      state.themes.materials = Array.from(set);
      persist();
    });
    materialWrap.appendChild(b);
  });

  palettes.forEach((hex) => {
    const sw = document.createElement("button");
    sw.className = "swatch";
    sw.type = "button";
    sw.style.background = hex;
    sw.title = hex;
    sw.addEventListener("click", () => {
      sw.classList.toggle("is-selected");
      const set = new Set(state.themes.palettes);
      if (set.has(hex)) set.delete(hex); else set.add(hex);
      state.themes.palettes = Array.from(set);
      persist();
    });
    paletteWrap.appendChild(sw);
  });
}

/* Projects */
function createProjectCard(initial = {}) {
  const tpl = byId("projectCardTemplate");
  const node = tpl.content.firstElementChild.cloneNode(true);
  const removeBtn = qs(".remove-project", node);
  removeBtn.addEventListener("click", () => {
    node.remove();
    state.projects = qsa(".project-card").map(readProjectCard);
    persist();
  });

  // Inputs
  const inputs = {
    name: qs("[data-field=name]", node),
    year: qs("[data-field=year]", node),
    type: qs("[data-field=type]", node),
    role: qs("[data-field=role]", node),
    budget: qs("[data-field=budget]", node),
    outcomes: qs("[data-field=outcomes]", node),
    tools: qs("[data-field=tools]", node),
    story: qs("[data-field=story]", node),
    storyCount: qs("[data-field=storyCount]", node),
  };

  // Populate
  if (initial.name) inputs.name.value = initial.name;
  if (initial.year) inputs.year.value = initial.year;
  if (initial.type) inputs.type.value = initial.type;
  if (initial.role) inputs.role.value = initial.role;
  if (initial.budget) selectSegmentedValue(inputs.budget, initial.budget);
  if (initial.outcomes) setPills(inputs.outcomes, initial.outcomes);
  if (initial.tools) setPills(inputs.tools, initial.tools);
  if (initial.story) inputs.story.value = initial.story;

  // Bind
  inputs.story.addEventListener("input", () => {
    inputs.storyCount.textContent = `${inputs.story.value.length} / 140`;
    syncProjectsState();
  });

  buildSegmentedToggle(inputs.budget, () => syncProjectsState());
  buildPills(inputs.outcomes, true, () => syncProjectsState());
  buildPills(inputs.tools, true, () => syncProjectsState());
  qsa("input, select", node).forEach((el) => el.addEventListener("input", syncProjectsState));

  inputs.story.dispatchEvent(new Event("input"));
  return node;
}

function selectSegmentedValue(container, value) {
  qsa("button", container).forEach((b) => {
    b.classList.toggle("is-selected", b.dataset.value === value);
  });
}

function setPills(container, values) {
  qsa(".pill", container).forEach((p) => p.classList.toggle("is-selected", values.includes(p.dataset.value)));
}

function readProjectCard(card) {
  const name = qs("[data-field=name]", card).value.trim();
  const year = Number(qs("[data-field=year]", card).value) || null;
  const type = qs("[data-field=type]", card).value;
  const role = qs("[data-field=role]", card).value;
  const budget = qsa("[data-field=budget] button", card).find((b) => b.classList.contains("is-selected"))?.dataset.value || null;
  const outcomes = qsa("[data-field=outcomes] .pill.is-selected", card).map((p) => p.dataset.value);
  const tools = qsa("[data-field=tools] .pill.is-selected", card).map((p) => p.dataset.value);
  const story = qs("[data-field=story]", card).value.trim();
  return { name, year, type, role, budget, outcomes, tools, story };
}

function syncProjectsState() {
  state.projects = qsa(".project-card").map(readProjectCard);
  persist();
}

/* Review */
function renderReview() {
  const review = byId("review");
  const { level, total, breakdown } = computeSeniorityLevel();
  const kv = (k, v) => `<div class="kv"><div class="k">${k}</div><div class="v">${v}</div></div>`;

  const projectsList = state.projects.slice(0, 2).map((p, idx) => `
    <div class="kvs">
      ${kv("Project", `#${idx + 1}: ${p.name || "Untitled"}`)}
      ${kv("Type", p.type || "—")}
      ${kv("Year", p.year || "—")}
      ${kv("Role", p.role || "—")}
      ${kv("Budget", p.budget || "—")}
      ${kv("Outcomes", p.outcomes?.join(", ") || "—")}
      ${kv("Tools", p.tools?.join(", ") || "—")}
      ${kv("Story", p.story || "—")}
    </div>`).join("");

  review.innerHTML = `
    <div class="kvs">
      ${kv("Name", state.basics.fullName || "—")}
      ${kv("Email", state.basics.email || "—")}
      ${kv("Location", state.basics.location || "—")}
      ${kv("Experience", `${state.basics.yearsExp} yrs`)}
      ${kv("Role", state.basics.role)}
      ${kv("Projects", state.seniority.projectsCount)}
      ${kv("Budget tier", state.seniority.budgetTierLabel)}
      ${kv("Leadership", state.seniority.leadershipLabels?.join(", ") || "—")}
      ${kv("Certifications", state.seniority.certificationLabels?.join(", ") || "—")}
      ${kv("Seniority", `${level} (${Math.round(total)} pts)`) }
    </div>
    <div class="kvs">
      ${kv("Domains", state.domains.join(", ") || "—")}
      ${kv("Styles", state.themes.styles.join(", ") || "—")}
      ${kv("Materials", state.themes.materials.join(", ") || "—")}
      ${kv("Palettes", state.themes.palettes.join(", ") || "—")}
    </div>
    ${projectsList || '<div class="kvs">Add at least one project above.</div>'}
  `;
}

/* Export */
function getExportData() {
  const seniority = computeSeniorityLevel();
  return {
    basics: state.basics,
    seniority: {
      ...state.seniority,
      computed: seniority,
      leadershipLabels: state.seniority.leadershipLabels || [],
      certificationLabels: state.seniority.certificationLabels || [],
    },
    domains: state.domains,
    themes: state.themes,
    projects: state.projects.slice(0, 2),
  };
}

function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function copyJsonToClipboard(data) {
  const text = JSON.stringify(data, null, 2);
  try {
    await navigator.clipboard.writeText(text);
    alert("Copied JSON to clipboard.");
  } catch {
    prompt("Copy JSON:", text);
  }
}

/* Init */
function init() {
  restore();

  // Progress dots
  const stepsWrap = byId("progressSteps");
  stepsWrap.innerHTML = "";
  for (let i = 1; i <= state.totalSteps; i++) {
    const dot = document.createElement("div");
    dot.style.flex = 1;
    stepsWrap.appendChild(dot);
  }

  // Basics
  const yearsExp = byId("yearsExp");
  const yearsExpBubble = byId("yearsExpBubble");
  yearsExp.value = state.basics.yearsExp;
  yearsExpBubble.textContent = `${state.basics.yearsExp} yrs`;
  yearsExp.addEventListener("input", () => {
    state.basics.yearsExp = Number(yearsExp.value);
    yearsExpBubble.textContent = `${state.basics.yearsExp} yrs`;
    persist();
  });

  qsa("#fullName, #email, #location").forEach((el) => {
    el.value = state.basics[el.id] || "";
    el.addEventListener("input", () => { state.basics[el.id] = el.value; persist(); });
  });

  buildSegmentedToggle(byId("roleOptions"), (btn) => {
    state.basics.role = btn.dataset.value;
    persist();
  });
  // Restore role selection
  qsa("#roleOptions button").forEach((b) => {
    b.classList.toggle("is-selected", b.dataset.value === state.basics.role);
  });

  // Seniority
  const projectsCount = byId("projectsCount");
  const projectsCountBubble = byId("projectsCountBubble");
  const projectsCountTicks = byId("projectsCountTicks");
  projectsCount.value = state.seniority.projectsCount;
  projectsCountBubble.textContent = String(state.seniority.projectsCount);
  projectsCount.addEventListener("input", () => {
    state.seniority.projectsCount = Number(projectsCount.value);
    projectsCountBubble.textContent = String(state.seniority.projectsCount);
    persist();
    renderTicks();
  });
  // Build aligned ticks at 0, 30, 60, 90+
  function renderTicks() {
    const THUMB_W = 18; // sync with CSS slider thumb size
    const min = Number(projectsCount.min);
    const max = Number(projectsCount.max);
    const rect = projectsCount.getBoundingClientRect();
    const trackWidth = Math.max(0, Math.round(rect.width - THUMB_W));
    projectsCountTicks.style.marginLeft = `${Math.round(THUMB_W / 2)}px`;
    projectsCountTicks.style.width = `${trackWidth}px`;
    const marks = [0, 30, 60, 90];
    projectsCountTicks.innerHTML = marks.map((m, i) => {
      const x = ((m - min) / (max - min)) * trackWidth;
      const label = i === marks.length - 1 ? "90+" : String(m);
      return `<div class="tick" style="left:${Math.round(x)}px">${label}</div>`;
    }).join("");
  }
  renderTicks();
  window.addEventListener("resize", renderTicks);

  buildSegmentedToggle(byId("budgetTier"), (btn) => {
    state.seniority.budgetTierScore = Number(btn.dataset.score || 0);
    state.seniority.budgetTierLabel = String(btn.dataset.value || btn.textContent || "");
    persist();
  });
  // Restore budget selection
  qsa("#budgetTier button").forEach((b) => {
    b.classList.toggle("is-selected", (b.dataset.value || b.textContent) === state.seniority.budgetTierLabel);
  });

  buildPills(byId("leadershipPills"), true, (pill) => {
    const val = pill.dataset.value;
    const wt = Number(pill.dataset.weight || 0);
    const set = new Map(state.seniority.leadership.map((w) => [w.label, w.weight]));
    if (pill.classList.contains("is-selected")) set.set(val, wt); else set.delete(val);
    state.seniority.leadership = Array.from(set, ([label, weight]) => ({ label, weight }));
    state.seniority.leadershipLabels = Array.from(set.keys());
    persist();
  });
  // Restore leadership pills
  if (Array.isArray(state.seniority.leadershipLabels)) {
    qsa("#leadershipPills .pill").forEach((p) => {
      p.classList.toggle("is-selected", state.seniority.leadershipLabels.includes(p.dataset.value));
    });
  }

  buildPills(byId("certPills"), true, (pill) => {
    const val = pill.dataset.value;
    const wt = Number(pill.dataset.weight || 0);
    const set = new Map(state.seniority.certifications.map((w) => [w.label, w.weight]));
    if (pill.classList.contains("is-selected")) set.set(val, wt); else set.delete(val);
    state.seniority.certifications = Array.from(set, ([label, weight]) => ({ label, weight }));
    state.seniority.certificationLabels = Array.from(set.keys());
    persist();
  });
  // Restore certification pills
  if (Array.isArray(state.seniority.certificationLabels)) {
    qsa("#certPills .pill").forEach((p) => {
      p.classList.toggle("is-selected", state.seniority.certificationLabels.includes(p.dataset.value));
    });
  }

  // Domains & Themes
  buildCardsForDomains();
  buildStyleAndMaterialPills();
  // Restore domains
  qsa("#domainCards .card-item").forEach((c) => {
    const title = qs(".card-item__title", c)?.textContent?.trim();
    c.classList.toggle("is-selected", state.domains.includes(title));
  });
  // Restore themes
  qsa("#stylePills .pill").forEach((p) => p.classList.toggle("is-selected", state.themes.styles.includes(p.textContent)));
  qsa("#materialPills .pill").forEach((p) => p.classList.toggle("is-selected", state.themes.materials.includes(p.textContent)));
  qsa("#paletteSwatches .swatch").forEach((s) => s.classList.toggle("is-selected", state.themes.palettes.includes(s.title)));

  // Projects
  const projectContainer = byId("projectContainer");
  const addProjectBtn = byId("addProjectBtn");
  function addProject(initial = {}) {
    if (qsa(".project-card").length >= 2) return;
    const card = createProjectCard(initial);
    projectContainer.appendChild(card);
    syncProjectsState();
  }
  addProjectBtn.addEventListener("click", () => addProject());

  // Restore any saved projects
  if (state.projects.length) {
    state.projects.slice(0, 2).forEach((p) => addProject(p));
  } else {
    addProject();
  }

  // Navigation
  byId("prevBtn").addEventListener("click", () => go(-1));
  byId("nextBtn").addEventListener("click", () => {
    if (state.step === state.totalSteps) {
      renderReview();
      state.step = 1; // return to beginning
      syncStepVisibility();
      persist();
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    go(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  // Export actions
  byId("downloadJsonBtn").addEventListener("click", () => downloadJson("designer_profile.json", getExportData()));
  byId("copyJsonBtn").addEventListener("click", () => copyJsonToClipboard(getExportData()));
  byId("printBtn").addEventListener("click", () => window.print());

  // Initial
  syncStepVisibility();
}

document.addEventListener("DOMContentLoaded", init);


