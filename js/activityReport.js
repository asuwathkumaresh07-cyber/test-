// show a simple bar chart of aggregated activity per child
async function renderUsageChart(){
  const parentId = localStorage.getItem('parentId');
  if(!parentId) return;
  // fetch children then logs
  const { data: children } = await supabase.from('children').select('id,name').eq('parent_id', parentId);
  if(!children) return;
  const labels = [];
  const dataPoints = [];
  for(const c of children){
    labels.push(c.name);
    const { data: logs } = await supabase.from('activity_logs').select('duration_seconds').eq('child_id', c.id);
    const total = (logs || []).reduce((s, l) => s + (l.duration_seconds || 0), 0);
    dataPoints.push(Math.round(total/3600 * 100)/100); // hours (rounded)
  }
  const ctx = document.getElementById('usageChart');
  if(!ctx) return;
  // create chart (Chart.js)
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets:[{ label:'Hours (approx)', data:dataPoints, backgroundColor: '#2563EB' }]
    },
    options:{responsive:true,maintainAspectRatio:false}
  });
}
// auto-run on dashboard
if(document.getElementById('usageChart')) renderUsageChart();
