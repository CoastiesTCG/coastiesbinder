// Login page logic — supabase.js already handles redirect if logged in

function switchTab(tab) {
  const isLogin = tab === 'login';
  document.getElementById('loginForm').style.display  = isLogin ? '' : 'none';
  document.getElementById('signupForm').style.display = isLogin ? 'none' : '';
  document.getElementById('formTitle').textContent    = isLogin ? 'Welcome Back' : 'Create Account';
  document.getElementById('formSubtitle').textContent = isLogin ? 'Sign in to access your binders' : 'Start tracking your collection';
  document.querySelectorAll('.tab').forEach((t, i) => t.classList.toggle('active', isLogin ? i === 0 : i === 1));
  clearMessages();
}

function showError(msg) {
  document.getElementById('errorMsg').textContent = msg;
  document.getElementById('errorMsg').classList.add('show');
  document.getElementById('successMsg').classList.remove('show');
}

function showSuccess(msg) {
  document.getElementById('successMsg').textContent = msg;
  document.getElementById('successMsg').classList.add('show');
  document.getElementById('errorMsg').classList.remove('show');
}

function clearMessages() {
  document.getElementById('errorMsg').classList.remove('show');
  document.getElementById('successMsg').classList.remove('show');
}

async function login() {
  const email    = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  if (!email || !password) { showError('Please fill in all fields'); return; }
  const btn = document.getElementById('loginBtn');
  btn.disabled = true; btn.textContent = 'Signing in...';
  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) { showError(error.message); btn.disabled = false; btn.textContent = 'Sign In'; return; }
  window.location.href = 'binders.html';
}

async function signup() {
  const username = document.getElementById('signupUsername').value.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
  const email    = document.getElementById('signupEmail').value.trim();
  const password = document.getElementById('signupPassword').value;
  const confirm  = document.getElementById('signupConfirm').value;
  if (!username) { showError('Please choose a username'); return; }
  if (username.length < 3) { showError('Username must be at least 3 characters'); return; }
  if (!email || !password || !confirm) { showError('Please fill in all fields'); return; }
  if (password.length < 8) { showError('Password must be at least 8 characters'); return; }
  if (password !== confirm) { showError('Passwords do not match'); return; }
  const btn = document.getElementById('signupBtn');
  btn.disabled = true; btn.textContent = 'Creating account...';
  // Check username not taken
  const { data: existing } = await sb.from('profiles').select('id').eq('username', username).maybeSingle();
  if (existing) { showError('Username already taken'); btn.disabled = false; btn.textContent = 'Create Account'; return; }
  const { data, error } = await sb.auth.signUp({ email, password });
  if (error) { showError(error.message); btn.disabled = false; btn.textContent = 'Create Account'; return; }
  // Create profile
  if (data.user) {
    await sb.from('profiles').insert({ id: data.user.id, username });
  }
  showSuccess('Account created! Check your email to confirm, then sign in.');
  btn.disabled = false; btn.textContent = 'Create Account';
}

// Wire buttons after DOM ready — wait for supabase.js boot first
window._sbReady.then(() => {
  document.getElementById('loginBtn').addEventListener('click', login);
  document.getElementById('signupBtn').addEventListener('click', signup);
  document.querySelectorAll('[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });
  document.addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    if (document.getElementById('loginForm').style.display !== 'none') login();
    else signup();
  });
  // Show page — only reached if not already logged in
  document.body.style.opacity = '1';
});