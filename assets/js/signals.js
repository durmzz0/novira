// NoviraTrade — Canli sinyal vitrini
// Kaynak: live_scores/current (bulut yazar, uygulama ile BIREBIR ayni skorlar)
// Tier: uygulama canViewScore ile ayni (constants.dart:74)
import { db, auth } from "./firebase.js";
import { doc, getDoc, collection, query, orderBy, limit, getDocs }
  from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { onAuthStateChanged }
  from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

const TIERS = {
  GUEST: { min: 51, max: 60,  label: "GUEST" },
  FREE:  { min: 51, max: 60,  label: "FREE"  },
  PRO:   { min: 51, max: 85,  label: "PRO"   },
  ELITE: { min: 51, max: 100, label: "ELITE" },
  ADMIN: { min: 51, max: 100, label: "ADMIN" },
};

let activeTier = "GUEST";
let allSignals = [];
let ivFilter = "ALL";
let dirFilter = "ALL";
let stats = { wins: 0, losses: 0, pending: 0 };

const canView = (score) => {
  const t = TIERS[activeTier] || TIERS.GUEST;
  return score >= t.min && score <= t.max;
};

const IV_ORDER = ["15m", "1h", "4h", "1d", "1w"];
const IV_NAME  = { "15m":"15 Minutes", "1h":"1 Hour", "4h":"4 Hours", "1d":"1 Day", "1w":"1 Week" };
const IV_SHORT = { "15m":"15m", "1h":"1H", "4h":"4H", "1d":"1D", "1w":"1W" };

function card(s, blurred = false) {
  const dir = s.direction || "LONG";
  const iv = IV_SHORT[s.interval] || s.interval;
  const sym = blurred ? "•••••" : (s.symbol || "").replace("USDT", "");
  const score = blurred ? "??" : (s.score || 0);
  return `<div class="sig-row${blurred ? " sig-blur" : ""}">
    <span class="sig-dir sig-${dir}">${dir === "LONG" ? "BUY" : "SELL"}</span>
    <span class="sig-coin">${sym}<em>USDT · ${iv}</em></span>
    <span class="sig-score${!blurred && score >= 90 ? " sig-hot" : ""}">${score}<em>score</em></span>
  </div>`;
}

function render() {
  const box = document.getElementById("liveSignalsList");
  if (!box) return;

  let list = allSignals.slice();
  if (dirFilter !== "ALL") list = list.filter(s => s.direction === dirFilter);

  const groups = ivFilter === "ALL" ? IV_ORDER : [ivFilter];
  let html = "";
  let lockedTotal = 0;

  for (const iv of groups) {
    const g = list.filter(s => s.interval === iv).sort((a, b) => (b.score || 0) - (a.score || 0));
    if (!g.length) continue;
    let open = g.filter(s => canView(s.score));
    let locked = g.filter(s => !canView(s.score));
    lockedTotal += locked.length;
    // Ziyaretci bos ekran gormesin: hicbiri gorunmuyorsa en dusuk 3'u ac
    if (!open.length && locked.length) {
      open = locked.slice(-3);
      locked = locked.slice(0, locked.length - open.length);
    }
    html += `<div class="sig-group">
      <div class="sig-group-head">${IV_NAME[iv] || iv}<span class="sig-count">${g.length} signals</span></div>
      ${open.map(s => card(s)).join("")}`;
    if (locked.length) {
      html += locked.slice(0, 2).map(s => card(s, true)).join("");
      html += `<button type="button" class="sig-unlock" data-auth-open="signup">
        🔒 ${locked.length} higher-score signal${locked.length > 1 ? "s" : ""} locked — create a free account
      </button>`;
    }
    html += `</div>`;
  }

  box.innerHTML = html || `<p class="sig-empty">No active signals in this filter.</p>`;

  const banner = document.getElementById("liveLockBanner");
  if (banner) {
    if (lockedTotal > 0) {
      banner.innerHTML = `🔒 <strong>${lockedTotal}</strong> premium signals locked · <span class="sig-link">Create a free account to unlock</span>`;
      banner.style.display = "block";
    } else banner.style.display = "none";
  }

  const badge = document.getElementById("liveTierBadge");
  if (badge) badge.textContent = (TIERS[activeTier] || TIERS.GUEST).label;
}

function updateStats() {
  const total = stats.wins + stats.losses + stats.pending;
  const rate = stats.wins + stats.losses > 0
    ? ((stats.wins / (stats.wins + stats.losses)) * 100).toFixed(1) : "—";
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set("liveWinRate", rate === "—" ? "—" : "%" + rate);
  set("liveTotal", total);
  set("liveWins", stats.wins);
  set("liveLosses", stats.losses);
  set("livePending", stats.pending);
}

async function loadStats() {
  // live_stats/current — bulutun GERCEK sayimi (sayac kacirmasin diye).
  // Tek okuma, 6000 kayit cekmeye gerek yok.
  try {
    const snap = await getDoc(doc(db, "live_stats", "current"));
    if (snap.exists()) {
      const d = snap.data();
      stats.wins = d.wins || 0;
      stats.losses = d.losses || 0;
      stats.pending = d.pending || 0;
      updateStats();
    }
  } catch (e) { console.error("stats", e); }
}

async function loadSignals() {
  try {
    const snap = await getDoc(doc(db, "live_scores", "current"));
    if (!snap.exists()) return;
    allSignals = (snap.data().sinyaller || []).map(x => ({
      symbol: x.symbol, direction: x.direction, interval: x.interval, score: x.score,
    }));
    render();
  } catch (e) { console.error("signals", e); }
}

export function initLiveSignals() {
  if (!document.getElementById("liveSignalsList")) return;

  document.getElementById("liveIvFilters")?.addEventListener("click", (e) => {
    const b = e.target.closest("[data-iv]"); if (!b) return;
    document.querySelectorAll("#liveIvFilters [data-iv]").forEach(x => x.classList.remove("active"));
    b.classList.add("active"); ivFilter = b.dataset.iv; render();
  });
  document.getElementById("liveDirFilters")?.addEventListener("click", (e) => {
    const b = e.target.closest("[data-dir]"); if (!b) return;
    document.querySelectorAll("#liveDirFilters [data-dir]").forEach(x => x.classList.remove("active"));
    b.classList.add("active"); dirFilter = b.dataset.dir; render();
  });
  document.getElementById("liveLockBanner")?.addEventListener("click", () => {
    if (!auth.currentUser && window.openAuthModal) window.openAuthModal("signup");
  });

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      activeTier = "FREE";
      try {
        const u = await getDoc(doc(db, "users", user.uid));
        if (u.exists() && u.data().tier) activeTier = String(u.data().tier).toUpperCase();
      } catch (_) {}
    } else activeTier = "GUEST";
    render();
  });

  loadStats(); loadSignals();
  setInterval(() => { loadStats(); loadSignals(); }, 5 * 60 * 1000);
}
