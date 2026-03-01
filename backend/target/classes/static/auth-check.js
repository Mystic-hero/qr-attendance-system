/**
 * auth-check.js
 * Shared script to manage authentication and globally sync user data (name, email) in the UI.
 */

document.addEventListener('DOMContentLoaded', () => {
    syncUserData();
});

/**
 * Syncs user data from localStorage to common UI elements like the navbar and greetings.
 */
function syncUserData() {
    const userJson = localStorage.getItem('user');

    console.log(`[AuthCheck] Checking session for: ${window.location.pathname}`);

    if (!userJson || userJson === 'undefined' || userJson === 'null') {
        // Get current filename without query params or hashes
        const path = window.location.pathname;
        let page = path.split('/').pop().split('\\').pop(); // Handle both / and \
        page = page.split('?')[0].split('#')[0].toLowerCase();

        console.log(`[AuthCheck] No valid session. Current page: "${page}"`);

        // List of pages that don't require authentication
        const publicPages = ['login.html', 'register.html', 'index.html', '', 'frontend'];

        // If the current page is not in the public list, redirect to login
        if (!publicPages.includes(page)) {
            console.warn(`[AuthCheck] Redirecting to login.html`);
            window.location.href = 'login.html';
            return;
        }
        return;
    }

    let user;
    try {
        user = JSON.parse(userJson);
        console.log(`[AuthCheck] Active session found for: ${user.name}`);
    } catch (e) {
        console.error(`[AuthCheck] Failed to parse user session:`, e);
        localStorage.removeItem('user');
        window.location.href = 'login.html';
        return;
    }

    // 1. Sync Navbar Name and Profile Pic
    const teacherNameElements = document.querySelectorAll('#teacherName, .user-name');
    const profilePicElements = document.querySelectorAll('#profilePic, .profile-pic');

    teacherNameElements.forEach(el => {
        el.textContent = user.name || 'User';
    });

    if (user.name) {
        const initials = user.name
            .split(' ')
            .map(n => n[0])
            .join('')
            .substring(0, 2)
            .toUpperCase();

        profilePicElements.forEach(el => {
            el.textContent = initials;
        });
    }

    // 2. Sync Dashboard Greetings (e.g., "Welcome, [Name]")
    const welcomeElements = document.querySelectorAll('.welcome-name, #welcomeName');
    welcomeElements.forEach(el => {
        el.textContent = user.name;
    });

    // 3. Sync Staff ID/Email if visible
    const emailElements = document.querySelectorAll('#displayEmail, .info-email');
    emailElements.forEach(el => {
        el.textContent = user.email;
    });
}

/**
 * Public function to clear user session and logout
 */
window.logout = function () {
    console.log('[AuthCheck] Logging out...');
    localStorage.removeItem('user');
    localStorage.removeItem('teacherName'); // For backward compatibility
    window.location.href = 'login.html';
};

