// ── CoastiesBinder Shared Auth ──

const SUPA_URL = 'https://czkzlkfnwsvsfpxjpscs.supabase.co';
const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6a3psa2Zud3N2c2ZweGpwc2NzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3ODA3OTEsImV4cCI6MjA5MDM1Njc5MX0.PJqknz3zikYq65y0ekb1EFmDwda8DRU8SUFSK3c_yDU';
const sb = window.supabase.createClient(SUPA_URL, SUPA_KEY);

// Pages that require login — redirect if not authenticated
const PROTECTED = ['binders.html', 'setview.html', 'setview-me03.html'];
// Pages that redirect away if already logged in
const AUTH_PAGES = ['login.html'];

const currentPage = window.location.pathname.split('/').pop() || 'index.html';

function updateNav(user) {
  // Update cookie to match real auth state (for instant nav on next page load)
  if (user) {
    document.cookie = 'sb-logged-in=1;path=/;max-age=604800';
  } else {
    document.cookie = 'sb-logged-in=;path=/;max-age=0';
  }
  // Remove preload style now that real state is set
  if (window._navPreload) { window._navPreload.remove(); window._navPreload = null; }
  const navLogin   = document.getElementById('navLogin');
  const navSignup  = document.getElementById('navSignup');
  const navSignout = document.getElementById('navSignout');
  const navUser    = document.getElementById('navUser');
  if (user) {
    if (navLogin)   navLogin.style.display   = 'none';
    if (navSignup)  navSignup.style.display  = 'none';
    if (navSignout) navSignout.style.display = '';
    if (navUser)    { navUser.style.display  = ''; navUser.textContent = user.email.split('@')[0]; }
  } else {
    if (navLogin)   navLogin.style.display   = '';
    if (navSignup)  navSignup.style.display  = '';
    if (navSignout) navSignout.style.display = 'none';
    if (navUser)    navUser.style.display    = 'none';
  }
}

async function signOut() {
  await sb.auth.signOut();
  window.location.href = 'index.html';
}

// Wire signout button if present
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('navSignout');
  if (btn) btn.addEventListener('click', signOut);
});

// Boot — runs on every page
window._sbSession = null;
window._sbReady = (async () => {
  const { data: { session } } = await sb.auth.getSession();
  window._sbSession = session;
  const user = session?.user || null;

  // Handle redirects
  const isProtected = PROTECTED.some(p => currentPage === p || currentPage === p.replace('.html',''));
  const isAuthPage  = AUTH_PAGES.some(p => currentPage === p || currentPage === p.replace('.html',''));

  if (isProtected && !user) {
    window.location.href = 'login.html';
    return null;
  }
  if (isAuthPage && user) {
    window.location.href = 'binders.html';
    return null;
  }

  // Fetch username from profiles
  if (user) {
    const { data: profile } = await sb.from('profiles').select('username').eq('id', user.id).maybeSingle();
    user._username = profile?.username || user.email.split('@')[0];
  }
  updateNav(user);
  return user;
})();