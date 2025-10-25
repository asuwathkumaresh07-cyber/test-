// add child & list children
document.addEventListener('DOMContentLoaded', () => {
  const addForm = document.getElementById('addChildForm');
  if(addForm) addForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('childName').value.trim();
    const device_id = document.getElementById('deviceId').value.trim();
    const parentId = localStorage.getItem('parentId');
    if(!parentId) return alert('Please login first');

    const { error } = await supabase.from('children').insert([{ name, parent_id: parentId, device_id }]);
    if(error) return alert('Add child error: ' + error.message);
    showToast('Child added');
    // optional redirect to dashboard
    window.location.href = 'dashboard.html';
  });

  // if on dashboard, load children
  if(document.getElementById('childContainer')){
    loadChildren();
  }
});

async function loadChildren(){
  const parentId = localStorage.getItem('parentId');
  if(!parentId) return;
  const { data, error } = await supabase.from('children').select('*').eq('parent_id', parentId);
  const container = document.getElementById('childContainer');
  container.innerHTML = '';
  if(error) { container.innerHTML = '<p>Error loading children</p>'; return; }
  if(!data || data.length === 0) { container.innerHTML = '<p>No children yet — add one.</p>'; return; }

  data.forEach(child => {
    const el = document.createElement('div');
    el.className = 'card';
    el.innerHTML = `
      <h3>${escapeHtml(child.name)}</h3>
      <p><small>Device ID: ${escapeHtml(child.device_id || '—')}</small></p>
      <div style="display:flex;gap:8px;margin-top:8px">
        <button class="btn" onclick="openChildControls('${child.id}','${child.name}')">Manage</button>
        <button class="btn" onclick="viewLogs('${child.id}')">Logs</button>
      </div>
    `;
    container.appendChild(el);
  });
}

window.openChildControls = function(childId, childName){
  // set selected child in localStorage for other pages to use
  localStorage.setItem('selectedChildId', childId);
  localStorage.setItem('selectedChildName', childName);
  // navigate to settings or open modal (simple: go to settings)
  window.location.href = 'settings.html';
};

window.viewLogs = function(childId){
  localStorage.setItem('selectedChildId', childId);
  window.location.href = 'dashboard.html';
};

// small escape helper
function escapeHtml(s){ return String(s).replace(/[&<>"']/g, m=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" })[m]); }
