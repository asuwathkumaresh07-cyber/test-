const supabase = createClient();
let currentChildId = null;
let timeUsageChart = null;

async function loadChildData() {
  const parentEmail = localStorage.getItem("parent_email");

  const { data: parent } = await supabase
    .from("parents")
    .select("id")
    .eq("email", parentEmail)
    .single();

  const { data: children } = await supabase
    .from("children")
    .select("*")
    .eq("parent_id", parent.id);

  const childContainer = document.getElementById("childContainer");
  childContainer.innerHTML = "";
  children.forEach((child) => {
    const card = document.createElement("div");
    card.classList.add("card");
    card.innerHTML = `
      <h4>${child.name}</h4>
      <p>Device ID: ${child.device_id || "N/A"}</p>
      <button class="btn" onclick="selectChild('${child.id}')">Manage</button>
    `;
    childContainer.appendChild(card);
  });
}

async function selectChild(childId) {
  currentChildId = childId;
  await loadBlockedSites();
  await loadTimeLimit();
  await loadActivityLogs();
  await loadTimeUsageChart();
}

/* ========== BLOCKED SITES ========== */
async function loadBlockedSites() {
  const { data } = await supabase
    .from("child_settings")
    .select("blocked_sites")
    .eq("child_id", currentChildId)
    .single();

  const sites = data?.blocked_sites || [];
  const list = document.getElementById("blockedSitesList");
  list.innerHTML = "";
  sites.forEach((site, index) => {
    list.innerHTML += `
      <tr>
        <td>${site}</td>
        <td><button class="btn btn-danger" onclick="deleteBlockedSite(${index})">Delete</button></td>
      </tr>
    `;
  });
}

async function addBlockedSite() {
  const siteInput = document.getElementById("blockedSiteInput");
  const newSite = siteInput.value.trim();
  if (!newSite) return alert("Enter a website!");

  const { data } = await supabase
    .from("child_settings")
    .select("blocked_sites")
    .eq("child_id", currentChildId)
    .single();

  const updated = [...(data?.blocked_sites || []), newSite];

  await supabase
    .from("child_settings")
    .update({ blocked_sites: updated })
    .eq("child_id", currentChildId);

  siteInput.value = "";
  loadBlockedSites();
}

async function deleteBlockedSite(index) {
  const { data } = await supabase
    .from("child_settings")
    .select("blocked_sites")
    .eq("child_id", currentChildId)
    .single();

  const updated = data.blocked_sites.filter((_, i) => i !== index);
  await supabase
    .from("child_settings")
    .update({ blocked_sites: updated })
    .eq("child_id", currentChildId);

  loadBlockedSites();
}

/* ========== TIME LIMIT ========== */
async function loadTimeLimit() {
  const { data } = await supabase
    .from("child_settings")
    .select("time_limit_minutes")
    .eq("child_id", currentChildId)
    .single();

  document.getElementById("timeLimitInput").value = data?.time_limit_minutes || 120;
}

async function updateTimeLimit() {
  const newLimit = parseInt(document.getElementById("timeLimitInput").value);
  await supabase
    .from("child_settings")
    .update({ time_limit_minutes: newLimit })
    .eq("child_id", currentChildId);

  document.getElementById("timeLimitStatus").textContent = "Updated!";
  setTimeout(() => (document.getElementById("timeLimitStatus").textContent = ""), 2000);
  loadTimeUsageChart();
}

/* ========== TIME USAGE CHART ========== */
async function loadTimeUsageChart() {
  const { data: settings } = await supabase
    .from("child_settings")
    .select("time_limit_minutes")
    .eq("child_id", currentChildId)
    .single();

  const { data: logs } = await supabase
    .from("activity_logs")
    .select("duration_seconds, timestamp")
    .eq("child_id", currentChildId);

  const totalUsedMinutes = logs.reduce(
    (sum, log) => sum + Math.floor(log.duration_seconds / 60),
    0
  );

  const ctx = document.getElementById("timeUsageChart").getContext("2d");
  if (timeUsageChart) timeUsageChart.destroy();

  timeUsageChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Used", "Remaining"],
      datasets: [
        {
          data: [
            totalUsedMinutes,
            Math.max(settings.time_limit_minutes - totalUsedMinutes, 0),
          ],
          backgroundColor: ["#ff6b6b", "#4caf50"],
        },
      ],
    },
    options: {
      plugins: {
        legend: { position: "bottom" },
      },
    },
  });
}

/* ========== ACTIVITY LOGS ========== */
async function loadActivityLogs() {
  const { data } = await supabase
    .from("activity_logs")
    .select("*")
    .eq("child_id", currentChildId)
    .order("timestamp", { ascending: false });

  const usageBody = document.getElementById("usageBody");
  usageBody.innerHTML = "";
  data.forEach((log) => {
    usageBody.innerHTML += `
      <tr>
        <td>${new Date(log.timestamp).toLocaleString()}</td>
        <td>${log.site_or_app}</td>
        <td>${Math.floor(log.duration_seconds / 60)}</td>
        <td>${log.action}</td>
      </tr>
    `;
  });
}

/* ========== REALTIME SYNC ========== */
supabase
  .channel("child_updates")
  .on("postgres_changes", { event: "*", schema: "public", table: "child_settings" }, () => {
    loadBlockedSites();
    loadTimeUsageChart();
  })
  .subscribe();

document.addEventListener("DOMContentLoaded", loadChildData);
