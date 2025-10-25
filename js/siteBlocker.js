// update blocked_sites in child_settings (JSON)
async function setBlockedSites(childId, sitesArray){
  if(!childId) return alert('No child selected');
  // upsert into child_settings
  const payload = { child_id: childId, blocked_sites: sitesArray };
  const { error } = await supabase.from('child_settings').upsert(payload);
  if(error) return alert('Blocked sites update failed: ' + error.message);
  showToast('Blocked sites updated');
}
