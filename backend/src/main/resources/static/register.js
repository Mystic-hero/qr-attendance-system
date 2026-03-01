document.addEventListener('DOMContentLoaded', () => {
    // === Variables ===
    const registerForm = document.getElementById('register-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmInput = document.getElementById('confirm-password');
    const togglePasswordBtn = document.getElementById('togglePassword');
    const toggleConfirmBtn = document.getElementById('toggleConfirmPassword');

    // Requirements
    const reqLength = document.getElementById('req-length');
    const reqCase = document.getElementById('req-case');
    const reqSpecial = document.getElementById('req-special');

    // === Password Toggle ===
    function setupToggle(btn, input) {
        btn.addEventListener('click', () => {
            const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
            input.setAttribute('type', type);
            btn.className = type === 'password'
                ? 'fa-regular fa-eye toggle-password'
                : 'fa-regular fa-eye-slash toggle-password';
        });
    }

    setupToggle(togglePasswordBtn, passwordInput);
    setupToggle(toggleConfirmBtn, confirmInput);

    // === Password Validation ===
    passwordInput.addEventListener('input', () => {
        const password = passwordInput.value;

        // Length Check
        if (password.length >= 8) {
            reqLength.classList.add('valid');
        } else {
            reqLength.classList.remove('valid');
        }

        // Case Check
        if (/[A-Z]/.test(password) && /[a-z]/.test(password)) {
            reqCase.classList.add('valid');
        } else {
            reqCase.classList.remove('valid');
        }

        // Number/Special Check
        if (/[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password)) {
            reqSpecial.classList.add('valid');
        } else {
            reqSpecial.classList.remove('valid');
        }
    });

    // === Form Submission ===
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nameInput = document.getElementById('name') || { value: 'User' }; // Fallback if name field is missing
        const name = nameInput.value;
        const email = emailInput.value;
        const password = passwordInput.value;
        const confirm = confirmInput.value;

        // Basic Empty Check
        if (!email || !password || !confirm) {
            shakeForm();
            return;
        }

        // Match Check
        if (password !== confirm) {
            showError("Passwords do not match!");
            startShake(confirmInput.parentElement);
            return;
        }

        // Requirements Check
        if (!reqLength.classList.contains('valid') ||
            !reqCase.classList.contains('valid') ||
            !reqSpecial.classList.contains('valid')) {
            showError("Please meet all password requirements.");
            shakeForm();
            return;
        }

        // Show loading state
        const btn = registerForm.querySelector('.btn-primary');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Creating Account...';
        btn.style.opacity = '0.8';
        btn.disabled = true;

        try {
            // Call backend API (Relative path for deployment)
            const response = await fetch(`/api/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: name,
                    email: email,
                    password: password
                })
            });

            const data = await response.json();

            if (data.success) {
                alert("Account created successfully!");
                // Redirect to login
                window.location.href = 'login.html';
            } else {
                // Show error message
                showError(data.message || 'Registration failed. Please try again.');

                // Reset button
                btn.innerHTML = originalText;
                btn.style.opacity = '1';
                btn.disabled = false;

                shakeForm();
            }
        } catch (error) {
            console.error('Registration full error:', error);
            showError(`Unable to connect to server. Error: ${error.message}`);

            // Reset button
            btn.innerHTML = originalText;
            btn.style.opacity = '1';
            btn.disabled = false;

            shakeForm();
        }
    });

    function shakeForm() {
        const card = document.querySelector('.login-card');
        card.style.animation = 'shake 0.4s ease-in-out';
        setTimeout(() => {
            card.style.animation = 'none';
        }, 400);
    }

    function showError(message) {
        // Remove existing error if any
        const existingError = document.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }

        // Create error element
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> ${message}`;
        errorDiv.style.cssText = `
            background: rgba(239, 68, 68, 0.1);
            border: 1px solid rgba(239, 68, 68, 0.3);
            color: #ef4444;
            padding: 12px 16px;
            border-radius: 8px;
            margin-bottom: 16px;
            font-size: 14px;
            display: flex;
            align-items: center;
            gap: 8px;
            animation: slideDown 0.3s ease-out;
        `;

        // Insert before form
        registerForm.parentNode.insertBefore(errorDiv, registerForm);

        // Auto remove after 5 seconds
        setTimeout(() => {
            errorDiv.style.animation = 'slideUp 0.3s ease-out';
            setTimeout(() => errorDiv.remove(), 300);
        }, 5000);
    }

    function startShake(element) {
        element.style.animation = 'shake 0.4s ease-in-out';
        element.style.border = '1px solid #ef4444';
        setTimeout(() => {
            element.style.animation = 'none';
            element.style.border = '';
        }, 400);
    }

    // Add animations dynamically if not present
    if (!document.getElementById('auth-styles')) {
        const styleSheet = document.createElement("style");
        styleSheet.id = 'auth-styles';
        styleSheet.innerText = `
            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-5px); }
                75% { transform: translateX(5px); }
            }
            @keyframes slideDown {
                from { opacity: 0; transform: translateY(-10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            @keyframes slideUp {
                from { opacity: 1; transform: translateY(0); }
                to { opacity: 0; transform: translateY(-10px); }
            }
        `;
        document.head.appendChild(styleSheet);
    }

    // === Particle Background Animation (Copy of login.js for standalone) ===
    initParticles();
});

function initParticles() {
    const canvas = document.getElementById('particle-canvas');
    const ctx = canvas.getContext('2d');

    let width, height;
    let particles = [];

    const particleCount = 60;
    const connectionDistance = 150;
    const mouseDistance = 200;

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }

    window.addEventListener('resize', resize);
    resize();

    let mouse = { x: null, y: null };
    window.addEventListener('mousemove', (e) => {
        mouse.x = e.x;
        mouse.y = e.y;
    });
    window.addEventListener('mouseout', () => {
        mouse.x = null;
        mouse.y = null;
    });

    class Particle {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.vx = (Math.random() - 0.5) * 0.5;
            this.vy = (Math.random() - 0.5) * 0.5;
            this.size = Math.random() * 2 + 1;
            this.color = 'rgba(59, 130, 246, ' + (Math.random() * 0.5 + 0.2) + ')';
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;

            if (this.x < 0 || this.x > width) this.vx *= -1;
            if (this.y < 0 || this.y > height) this.vy *= -1;

            if (mouse.x != null) {
                let dx = mouse.x - this.x;
                let dy = mouse.y - this.y;
                let distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < mouseDistance) {
                    const forceDirectionX = dx / distance;
                    const forceDirectionY = dy / distance;
                    const force = (mouseDistance - distance) / mouseDistance;
                    const directionX = forceDirectionX * force * 2;
                    const directionY = forceDirectionY * force * 2;

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

    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);
        particles.forEach(p => {
            p.update();
            p.draw();
        });
        connectParticles();
        requestAnimationFrame(animate);
    }

    function connectParticles() {
        for (let a = 0; a < particles.length; a++) {
            for (let b = a; b < particles.length; b++) {
                let dx = particles[a].x - particles[b].x;
                let dy = particles[a].y - particles[b].y;
                let distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < connectionDistance) {
                    let opacity = 1 - (distance / connectionDistance);
                    ctx.strokeStyle = 'rgba(59, 130, 246, ' + (opacity * 0.2) + ')';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(particles[a].x, particles[a].y);
                    ctx.lineTo(particles[b].x, particles[b].y);
                    ctx.stroke();
                }
            }
        }
    }

    animate();
}
