// authentication handlers (login, register, logout, profile)
document.addEventListener('DOMContentLoaded', () => {
  // Toggle password buttons
  document.getElementById('toggleLoginPassword')?.addEventListener('click', () => {
    toggleInputVisibility('loginPassword');
  });
  document.getElementById('toggleRegPassword')?.addEventListener('click', () => {
    toggleInputVisibility('regPassword');
  });
  document.getElementById('toggleProfilePassword')?.addEventListener('click', () => {
    toggleInputVisibility('profilePassword');
  });

  // Login form
  const loginForm = document.getElementById('loginForm');
  if (loginForm) loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      localStorage.setItem('parentEmail', email);
      // store parent id in local storage by fetching parents table row (simple approach)
      const { data: parents } = await supabase.from('parents').select('id').eq('email', email).single();
      if (parents?.id) localStorage.setItem('parentId', parents.id);
      window.location.href = 'dashboard.html';
    } catch (err) {
      alert('Login error: ' + (err.message || err));
    }
  });

  // Register form
  const registerForm = document.getElementById('registerForm');
  if (registerForm) registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    try {
      // create auth user
      const { data: authData, error: authErr } = await supabase.auth.signUp({ email, password });
      if (authErr) throw authErr;
      // generate family key simple
      const familyKey = Math.random().toString(36).substring(2,8).toUpperCase();
      const { error } = await supabase.from('parents').insert([{ id: authData.user?.id || null, email, password, name, family_key: familyKey }]);
      if (error) throw error;
      alert('Registered. Your Family Key: ' + familyKey);
      window.location.href = 'index.html';
    } catch (err) {
      alert('Registration error: ' + (err.message || err));
    }
  });

  // Logout function available globally
  window.logoutParent = async function(){
    await supabase.auth.signOut();
    localStorage.clear();
    window.location.href = 'index.html';
  };

  // helper
  function toggleInputVisibility(id){
    const el = document.getElementById(id);
    if(!el) return;
    el.type = el.type === 'password' ? 'text' : 'password';
  }
});
