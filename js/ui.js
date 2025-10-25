// small UI helpers, show alert/toast
function showToast(message, timeout=3000){
  const t = document.createElement('div');
  t.textContent = message;
  t.style.position = 'fixed';
  t.style.right = '18px';
  t.style.bottom = '18px';
  t.style.background = '#2563eb';
  t.style.color = '#fff';
  t.style.padding = '10px 14px';
  t.style.borderRadius = '8px';
  t.style.boxShadow = '0 8px 20px rgba(0,0,0,0.12)';
  t.style.zIndex = 9999;
  document.body.appendChild(t);
  setTimeout(()=> t.remove(), timeout);
}

// set welcome text
(async function setWelcome(){
  const welcome = document.getElementById('welcomeText');
  const parentEmail = localStorage.getItem('parentEmail');
  if(welcome) welcome.textContent = parentEmail ? `Welcome, ${parentEmail}` : 'Welcome';
})();
