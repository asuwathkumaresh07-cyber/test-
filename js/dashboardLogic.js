// ------------------ GLOBALS ------------------
let parentId = null;
let selectedChildId = null;
let blockedSites = [];

// ------------------ ON LOAD ------------------
document.addEventListener("DOMContentLoaded", async () => {
  const parentData = JSON.parse(localStorage.getItem("parentData"));
  if (!parentData) {
    window.location.href = "login.html";
    return;
  }

  parentId = parentData.id;
  document.getElementById("welcomeText").textContent = `Welcome, ${parentData.name}!`;

  await loadChildData();
  setupEventListeners();
});

// ------------------ EVENT HANDLERS ------------------
function setupEventListeners() {
  document.getElementById("addSiteBtn").addEventListener("click", addBlockedSite);
  document.getElementById("saveTimeBtn").addEventListener("click", saveTimeLimit);
}

// ------------------ LOAD CHILD SETTINGS ------------------
async function loadChildData() {
  const { data: children } = await supabase
    .from("children")
    .select("id, name")
    .eq("parent_id", parentId);

  if (!children || children.length === 0) {
    alert("No children added yet. Please add a child first.");
    return;
  }

  selectedChildId = children[0].id;

  const { data: settings } = await supabase
    .from("child_settings")
    .select("*")
    .eq("child_id", selectedChildId)
    .single();

  blockedSites = settings?.blocked_sites || [];
  renderBlockedSites();

  document.getElementById("timeLimit").value = settings?.time_limit_minutes || 120;

  await loadActivityLogs();
}

// ------------------ BLOCKED SITES ------------------
function renderBlockedSites() {
  const tbody = document.querySelector("#blockedSitesTable tbody");
  tbody.innerHTML = "";

  blockedSites.forEach((site, idx) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${site}</td>
      <td><button class="btn-delete" onclick="deleteBlockedSite(${idx})">Delete</button></td>
    `;
    tbody.appendChild(row);
  });
}

async function addBlockedSite() {
  const input = document.getElementById("siteInput");
  const site = input.value.trim();

  if (!site) {
    alert("Please enter a website.");
    return;
  }

  if (blockedSites.includes(site)) {
    alert("This site is already blocked.");
    return;
  }

  blockedSites.push(site);
  renderBlockedSites();

  const { error } = await supabase
    .from("child_settings")
    .update({ blocked_sites: blockedSites })
    .eq("child_id", selectedChildId);

  if (error) console.error(error);
  else input.value = "";
}

async function deleteBlockedSite(index) {
  blockedSites.splice(index, 1);
  renderBlockedSites();

  const { error } = await supabase
    .from("child_settings")
    .update({ blocked_sites: blockedSites })
    .eq("child_id", selectedChildId);

  if (error) console.error(error);
}

// ------------------ TIME MANAGEMENT ------------------
async function saveTimeLimit() {
  const limit = parseInt(document.getElementById("timeLimit").value);
  const { error } = await supabase
    .from("child_settings")
    .update({ time_limit_minutes: limit })
    .eq("child_id", selectedChildId);

  if (error) {
    alert("Failed to update time limit.");
    console.error(error);
  } else {
    alert("Time limit updated successfully!");
  }
}

// ------------------ ACTIVITY & USAGE CHARTS ------------------
async function loadActivityLogs() {
  const { data: logs } = await supabase
    .from("activity_logs")
    .select("site_or_app, duration_seconds, timestamp")
    .eq("child_id", selectedChildId)
    .order("timestamp", { ascending: false });

  if (!logs || logs.length === 0) return;

  // Aggregate durations by site/app
  const usageMap = {};
  logs.forEach(log => {
    usageMap[log.site_or_app] = (usageMap[log.site_or_app] || 0) + log.duration_seconds;
  });

  const activityCtx = document.getElementById("activityChart").getContext("2d");
  new Chart(activityCtx, {
    type: "bar",
    data: {
      labels: Object.keys(usageMap),
      datasets: [{
        label: "Usage (minutes)",
        data: Object.values(usageMap).map(v => (v / 60).toFixed(1)),
        backgroundColor: "#1a3fa7",
      }],
    },
    options: { responsive: true, plugins: { legend: { display: false } } },
  });

  // Chart 2: Time Usage per Hour
  const today = new Date().toISOString().split("T")[0];
  const todayLogs = logs.filter(l => l.timestamp.startsWith(today));

  const hourlyData = new Array(24).fill(0);
  todayLogs.forEach(log => {
    const hour = new Date(log.timestamp).getHours();
    hourlyData[hour] += log.duration_seconds / 60;
  });

  const timeCtx = document.getElementById("timeUsageChart").getContext("2d");
  new Chart(timeCtx, {
    type: "line",
    data: {
      labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
      datasets: [{
        label: "Usage (minutes)",
        data: hourlyData,
        fill: true,
        backgroundColor: "rgba(26, 63, 167, 0.2)",
        borderColor: "#1a3fa7",
        tension: 0.4,
      }],
    },
    options: { responsive: true, scales: { y: { beginAtZero: true } } },
  });
}

// ------------------ LOGOUT ------------------
function logoutParent() {
  localStorage.removeItem("parentData");
  window.location.href = "login.html";
}
