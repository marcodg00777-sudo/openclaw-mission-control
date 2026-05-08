// === LOGIN/AUTH GATE ===
        async function validateGitHubToken(token) {
            const authHeaders = [
                { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github+json' },
                { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github+json' }
            ];

            let lastError = null;
            for (const headers of authHeaders) {
                try {
                    const response = await fetch('https://api.github.com/user', {
                        headers,
                        mode: 'cors',
                        cache: 'no-store'
                    });

                    if (response.ok) {
                        return { ok: true, user: await response.json() };
                    }

                    const body = await response.text().catch(() => '');
                    lastError = `GitHub ${response.status}${body ? `: ${body.slice(0, 180)}` : ''}`;
                } catch (e) {
                    lastError = e?.message || String(e);
                }
            }

            return { ok: false, error: lastError || 'Unknown validation error' };
        }

        async function checkAuth() {
            // Check both old and new token keys, migrate if needed
            let token = localStorage.getItem('gh_token');
            if (!token) {
                const oldToken = localStorage.getItem('github_token');
                if (oldToken) {
                    // Migrate old token to new key
                    localStorage.setItem('gh_token', oldToken);
                    localStorage.removeItem('github_token');
                    localStorage.removeItem('github_user'); // Clean up old user data
                    token = oldToken;
                    console.log('Migrated token from github_token to gh_token');
                }
            }

            if (!token) {
                showLoginScreen();
                return;
            }

            try {
                const result = await validateGitHubToken(token);

                if (result.ok) {
                    STATE.token = token;
                    STATE.user = result.user;
                    showDashboard();
                    await loadTasksFromGitHub();
                    if (!(await loadCronsFromGateway())) await loadCronsFromGitHub(); // Load data after auth
                    await loadSkillsFromGitHub(); // Load skills for skill column
                    
                    // Auto-probe Gateway if not already configured
                    if (!getGatewayUrl()) {
                        autoProbeGateway().then(url => {
                            if (url) {
                                showToast('success', `Gateway connected: ${url.split('//')[1]}`);
                            }
                        });
                    }
                } else {
                    console.error('Auth check failed:', result.error);
                    localStorage.removeItem('gh_token');
                    showLoginScreen();
                }
            } catch (e) {
                console.error('Auth check failed:', e);
                showLoginScreen();
            }
        }

        function showLoginScreen() {
            document.getElementById('login-screen').style.display = 'flex';
            document.getElementById('dashboard').style.display = 'none';
        }

        function showDashboard() {
            document.getElementById('login-screen').style.display = 'none';
            document.getElementById('dashboard').style.display = 'block';

            // Update UI with user info
            if (STATE.user) {
                document.getElementById('btn-connect').style.display = 'none';
                document.getElementById('user-profile').style.display = 'flex';
                document.getElementById('user-avatar').src = STATE.user.avatar_url;
                document.getElementById('user-name').textContent = STATE.user.login;
            }
        }

        async function handleLogin() {
            const tokenInput = document.getElementById('login-token-input');
            const token = tokenInput.value.trim();
            const errorDiv = document.getElementById('login-error');
            const loadingDiv = document.getElementById('login-loading');
            const btn = document.getElementById('login-btn');

            if (!token) {
                errorDiv.textContent = 'Please enter a token';
                errorDiv.style.display = 'block';
                return;
            }

            errorDiv.style.display = 'none';
            loadingDiv.style.display = 'flex';
            btn.disabled = true;

            try {
                const result = await validateGitHubToken(token);

                if (result.ok) {
                    localStorage.setItem('gh_token', token);
                    STATE.token = token;
                    STATE.user = result.user;
                    showDashboard();
                    await loadTasksFromGitHub();
                    if (!(await loadCronsFromGateway())) await loadCronsFromGitHub();
                } else {
                    errorDiv.textContent = `Login failed: ${result.error}`;
                    errorDiv.style.display = 'block';
                }
            } catch (e) {
                errorDiv.textContent = `Connection error: ${e?.message || e}`;
                errorDiv.style.display = 'block';
            } finally {
                loadingDiv.style.display = 'none';
                btn.disabled = false;
            }
        }

        // Handle Enter key on login input
        document.getElementById('login-token-input').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') handleLogin();
        });

        // Check auth on page load
        checkAuth();