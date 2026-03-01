// Profile Page Logic

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Components
    loadStaffInfo();
    initMobileMenu();
    initParticles();
    initPasswordToggles();
    initProfileForm();
});

// --- Load Staff Information ---
async function loadStaffInfo() {
    // Get user from localStorage (set during login)
    const storedUser = JSON.parse(localStorage.getItem('user'));

    if (!storedUser) {
        console.warn('DEBUG: profile.js - No user session found. (Redirect suppressed)');
        // window.location.href = 'login.html';
        // return;
    }

    try {
        const backendHost = window.location.hostname || '127.0.0.1';
        const response = await fetch(`http://${backendHost}:8080/api/users/${storedUser.id}`);

        if (!response.ok) throw new Error('Failed to fetch user profile');

        const userData = await response.json();

        // Update read-only display section
        document.getElementById('displayStaffId').textContent = userData.id || 'N/A';
        document.getElementById('displayName').textContent = userData.name;
        document.getElementById('displayDepartment').textContent = 'Computer Science'; // Static for now as not in DB
        document.getElementById('displayEmail').textContent = userData.email;

        // Populate edit form with current values
        document.getElementById('editName').value = userData.name;
        document.getElementById('editEmail').value = userData.email;

    } catch (error) {
        console.error('Error loading profile:', error);
        showToast('Error loading profile data');
    }
}

// --- Mobile Menu Toggle ---
function initMobileMenu() {
    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.getElementById('navLinks');
    const icon = menuToggle ? menuToggle.querySelector('i') : null;

    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('show');

            // Toggle icon
            if (navLinks.classList.contains('show')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-xmark');
            } else {
                icon.classList.remove('fa-xmark');
                icon.classList.add('fa-bars');
            }
        });
    }
}

// --- Password Toggle Visibility ---
function initPasswordToggles() {
    const toggleCurrent = document.getElementById('toggleCurrent');
    const toggleNew = document.getElementById('toggleNew');
    const toggleConfirm = document.getElementById('toggleConfirm');

    const currentPassword = document.getElementById('currentPassword');
    const newPassword = document.getElementById('newPassword');
    const confirmPassword = document.getElementById('confirmPassword');

    if (toggleCurrent && currentPassword) {
        toggleCurrent.addEventListener('click', () => {
            togglePasswordVisibility(currentPassword, toggleCurrent);
        });
    }

    if (toggleNew && newPassword) {
        toggleNew.addEventListener('click', () => {
            togglePasswordVisibility(newPassword, toggleNew);
        });
    }

    if (toggleConfirm && confirmPassword) {
        toggleConfirm.addEventListener('click', () => {
            togglePasswordVisibility(confirmPassword, toggleConfirm);
        });
    }
}

function togglePasswordVisibility(input, icon) {
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// --- Profile Form Handling ---
function initProfileForm() {
    const form = document.getElementById('profileForm');
    const cancelBtn = document.getElementById('cancelBtn');

    // Form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Clear previous errors
        clearErrors();

        // Validate form
        if (validateForm()) {
            await updateProfile();
        }
    });

    // Cancel button
    cancelBtn.addEventListener('click', () => {
        // Reset form to original values
        loadStaffInfo();
        clearErrors();
        document.getElementById('currentPassword').value = '';
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmPassword').value = '';
    });
}

// --- Form Validation ---
function validateForm() {
    let isValid = true;

    const name = document.getElementById('editName').value.trim();
    const email = document.getElementById('editEmail').value.trim();
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Validate name
    if (!name) {
        showError('nameError', 'Name is required');
        isValid = false;
    } else if (name.length < 2) {
        showError('nameError', 'Name must be at least 2 characters');
        isValid = false;
    }

    // Validate email
    if (!email) {
        showError('emailError', 'Email is required');
        isValid = false;
    } else if (!isValidEmail(email)) {
        showError('emailError', 'Please enter a valid email address');
        isValid = false;
    }

    // Validate password change (if attempting to change)
    if (currentPassword || newPassword || confirmPassword) {
        if (!currentPassword) {
            showError('currentPasswordError', 'Current password is required');
            isValid = false;
        }

        if (!newPassword) {
            showError('newPasswordError', 'New password is required');
            isValid = false;
        } else if (newPassword.length < 6) {
            showError('newPasswordError', 'Password must be at least 6 characters');
            isValid = false;
        }

        if (!confirmPassword) {
            showError('confirmPasswordError', 'Please confirm your new password');
            isValid = false;
        } else if (newPassword !== confirmPassword) {
            showError('confirmPasswordError', 'New passwords do not match');
            isValid = false;
        }
    }

    return isValid;
}

// --- Email Validation Helper ---
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// --- Show Error Message ---
function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = message;
    }
}

// --- Clear All Errors ---
function clearErrors() {
    const errorElements = document.querySelectorAll('.error-message');
    errorElements.forEach(element => {
        element.textContent = '';
    });
}

// --- Update Profile ---
async function updateProfile() {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    const name = document.getElementById('editName').value.trim();
    const email = document.getElementById('editEmail').value.trim();
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    const submitBtn = document.querySelector('#profileForm .btn-primary');
    const originalBtnText = submitBtn.innerHTML;

    try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Updating...';

        const backendHost = window.location.hostname || '127.0.0.1';
        let profileSuccess = false;
        let passwordSuccess = false;

        // 1. Update Profile Information (Name, Email)
        const profileResponse = await fetch(`http://${backendHost}:8080/api/users/${storedUser.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email })
        });

        const profileResult = await profileResponse.json();
        if (profileResult.success) {
            profileSuccess = true;
            // Update global session
            if (window.updateLocalUser) {
                window.updateLocalUser(profileResult.user);
            }
        } else {
            showToast(profileResult.message || 'Failed to update profile info');
            return; // Stop if profile update fails
        }

        // 2. Update Password (if fields are filled)
        if (currentPassword && newPassword) {
            const passwordResponse = await fetch(`http://${backendHost}:8080/api/users/${storedUser.id}/password`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currentPassword: currentPassword,
                    newPassword: newPassword,
                    confirmPassword: confirmPassword
                })
            });

            const passwordResult = await passwordResponse.json();
            if (passwordResult.success) {
                passwordSuccess = true;
                // Clear fields
                document.getElementById('currentPassword').value = '';
                document.getElementById('newPassword').value = '';
                document.getElementById('confirmPassword').value = '';
            } else {
                showToast(passwordResult.message || 'Failed to update password');
                if (passwordResult.message.toLowerCase().includes('current password')) {
                    showError('currentPasswordError', 'Incorrect current password');
                }
                return;
            }
        }

        // Final Feedback
        if (profileSuccess && (!currentPassword || passwordSuccess)) {
            showToast('Profile updated successfully!');
            await loadStaffInfo(); // Refresh display
        }

    } catch (error) {
        console.error('Error updating profile:', error);
        showToast('Unable to connect to server');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
    }
}

// --- Toast Notification ---
function showToast(message) {
    const toast = document.getElementById('successToast');
    const toastMessage = document.getElementById('toastMessage');

    toastMessage.textContent = message;
    toast.classList.add('show');

    // Hide after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// --- Particle Background (Same as home.js) ---
function initParticles() {
    const canvas = document.getElementById('particle-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    let width, height;
    let particles = [];

    // Configuration
    const particleCount = 60;
    const connectionDistance = 150;
    const mouseDistance = 200;

    // Resize handling
    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }

    window.addEventListener('resize', resize);
    resize();

    // Mouse tracking
    let mouse = { x: null, y: null };
    window.addEventListener('mousemove', (e) => {
        mouse.x = e.x;
        mouse.y = e.y;
    });

    // Clear mouse when leaving window
    window.addEventListener('mouseout', () => {
        mouse.x = null;
        mouse.y = null;
    });

    // Particle Class
    class Particle {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.vx = (Math.random() - 0.5) * 0.5;
            this.vy = (Math.random() - 0.5) * 0.5;
            this.size = Math.random() * 2 + 1;
            this.color = `rgba(59, 130, 246, ${Math.random() * 0.5})`;
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;

            // Bounce off edges
            if (this.x < 0 || this.x > width) this.vx *= -1;
            if (this.y < 0 || this.y > height) this.vy *= -1;

            // Mouse interaction
            if (mouse.x != null) {
                let dx = mouse.x - this.x;
                let dy = mouse.y - this.y;
                let distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < mouseDistance) {
                    const forceDirectionX = dx / distance;
                    const forceDirectionY = dy / distance;
                    const force = (mouseDistance - distance) / mouseDistance;

                    // Gentle push away
                    const directionX = forceDirectionX * force * 0.6;
                    const directionY = forceDirectionY * force * 0.6;

                    this.x -= directionX;
                    this.y -= directionY;
                }
            }
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
        }
    }

    // Initialize particles
    function createParticles() {
        particles = [];
        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle());
        }
    }

    // Animation Loop
    function animate() {
        requestAnimationFrame(animate);
        ctx.clearRect(0, 0, width, height);

        for (let i = 0; i < particles.length; i++) {
            particles[i].update();
            particles[i].draw();

            // Draw connections
            for (let j = i; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < connectionDistance) {
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(59, 130, 246, ${1 - distance / connectionDistance * 0.8})`;
                    ctx.lineWidth = 1;
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }
        }
    }

    createParticles();
    animate();
}
