// set time limit (minutes)
async function setTimeLimit(childId, minutes){
  if(!childId) return alert('No child selected');
  const { error } = await supabase.from('child_settings').upsert({ child_id: childId, time_limit_minutes: minutes });
  if(error) return alert('Time limit update failed: ' + error.message);
  showToast('Time limit updated');
}
