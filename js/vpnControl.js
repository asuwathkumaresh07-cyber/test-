// toggle vpn_enabled flag in child_settings
async function setVpn(childId, enabled){
  if(!childId) return alert('No child selected');
  const { error } = await supabase.from('child_settings').upsert({ child_id: childId, vpn_enabled: enabled });
  if(error) return alert('VPN update failed: ' + error.message);
  showToast('VPN ' + (enabled ? 'enabled' : 'disabled'));
}
