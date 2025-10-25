let parentId = null;
let selectedChildId = null;
let blockedSites = [];

// ------------------ INITIAL LOAD ------------------
document.addEventListener("DOMContentLoaded", async () => {
  const parentData = JSON.parse(localStorage.getItem("parentData"));
  if (!parentData) {
    alert("Login required.");
    window.location.href = "login.html";
    return;
  }

  parentId = parentData.id;
  document.getElementById("welcomeText").textContent = `Welcome, ${parentData.name}!`;

  document.getElementById("addSiteBtn").addEventListener("click", addBlockedSite);
  document.getElementById("saveTimeBtn").addEventListener("click", saveTimeLimit);

  await loadChildAndSettings();
});

// ------------------ LOAD CHILD + SETTINGS ------------------
async function loadChildAndSettings() {
  const { data: children, error: childErr } = await supabase
    .from("children")
    .select("id, name")
    .eq("parent_id", parentId);

  if (childErr || !children || children.length === 0) {
    alert("Please add a child first.");
    return;
  }

  selectedChildId = children[0].id;
  await refreshSettings();
  await loadActivityCharts();
}

// ------------------ REFRESH SETTINGS ------------------
async function refreshSettings() {
  const { data: settings } = await supabase
    .from("child_settings")
    .select("*")
    .eq("child_id", selectedChildId)
    .single();

  blockedSites = settings?.blocked_sites || [];
  renderBlockedSites();

  document.getElementById("timeLimit").value = settings?.time_limit_minutes || 120;
}

// ------------------ BLOCKED SITES ------------------
function renderBlockedSites() {
  const tbody = document.querySelector("#blockedSitesTable tbody");
  tbody.innerHTML = "";

  if (blockedSites.length === 0) {
    tbody.innerHTML = `<tr><td colspan="2" style="text-align:center;color:#999;">No blocked sites</td></tr>`;
    return;
  }

  blockedSites.forEach((site, i) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${site}</td>
      <td><button class="btn-delete" onclick="deleteBlockedSite(${i})">Delete</button></td>`;
    tbody.appendChild(row);
  });
}

async function addBlockedSite() {
  const input = document.getElementById("siteInput");
  const site = input.value.trim().toLowerCase();
  if (!site) return alert("Enter a valid site.");

  if (blockedSites.includes(site)) return alert("Already blocked.");

  blockedSites.push(site);
  await updateBlockedSites();
  input.value = "";
}

async function deleteBlockedSite(index) {
  blockedSites.splice(index, 1);
  await updateBlockedSites();
}

async function updateBlockedSites() {
  const { error } = await supabase
    .from("child_settings")
    .update({ blocked_sites: blockedSites })
    .eq("child_id", selectedChildId);

  if (error) {
    console.error(error);
    alert("Failed to update list.");
  } else {
    renderBlockedSites();
  }
}

// ------------------ TIME LIMIT ------------------
async function saveTimeLimit() {
  const minutes = parseInt(document.getElementById("timeLimit").value);
  const { error } = await supabase
    .from("child_settings")
    .update({ time_limit_minutes: minutes })
    .eq("child_id", selectedChildId);

  if (error) {
    console.error(error);
    alert("Failed to update time limit.");
  } else {
    alert(`Time limit set to ${minutes} minutes.`);
  }
}

// ------------------ ACTIVITY CHARTS ------------------
async function loadActivityCharts() {
  const { data: logs } = await supabase
    .from("activity_logs")
    .select("site_or_app, duration_seconds, timestamp")
    .eq("child_id", selectedChildId)
    .order("timestamp", { ascending: true });

  if (!logs || logs.length === 0) return;

  const usageByApp = {};
  logs.forEach(l => {
    usageByApp[l.site_or_app] = (usageByApp[l.site_or_app] || 0) + l.duration_seconds;
  });

  new Chart(document.getElementById("activityChart"), {
    type: "bar",
    data: {
      labels: Object.keys(usageByApp),
      datasets: [{
        label: "Usage (mins)",
        data: Object.values(usageByApp).map(v => (v / 60).toFixed(1)),
        backgroundColor: "#1a3fa7"
      }]
    },
    options: { plugins: { legend: { display: false } }, responsive: true }
  });

  const hourly = new Array(24).fill(0);
  logs.forEach(l => {
    const hour = new Date(l.timestamp).getHours();
    hourly[hour] += l.duration_seconds / 60;
  });

  new Chart(document.getElementById("timeUsageChart"), {
    type: "line",
    data: {
      labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
      datasets: [{
        label: "Usage (mins)",
        data: hourly,
        fill: true,
        backgroundColor: "rgba(26, 63, 167, 0.2)",
        borderColor: "#1a3fa7",
        tension: 0.4
      }]
    },
    options: { scales: { y: { beginAtZero: true } } }
  });
}

// ------------------ LOGOUT ------------------
function logoutParent() {
  localStorage.removeItem("parentData");
  window.location.href = "login.html";
}
