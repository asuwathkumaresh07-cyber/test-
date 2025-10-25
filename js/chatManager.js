// fetch chat logs for a child
async function fetchChatLogs(childId){
  if(!childId) childId = localStorage.getItem('selectedChildId');
  if(!childId) return [];
  const { data, error } = await supabase.from('chat_logs').select('*').eq('child_id', childId).order('timestamp', { ascending: false });
  if(error) { console.error(error); return []; }
  return data;
}
