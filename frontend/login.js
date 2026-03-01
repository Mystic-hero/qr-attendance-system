document.addEventListener('DOMContentLoaded', () => {
    // === Variables ===
    const loginForm = document.getElementById('login-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const togglePasswordBtn = document.getElementById('togglePassword');

    // === Password Toggle ===
    togglePasswordBtn.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);

        // Toggle icon class
        togglePasswordBtn.className = type === 'password'
            ? 'fa-regular fa-eye toggle-password'
            : 'fa-regular fa-eye-slash toggle-password';
    });

    // === Form Validation & Submit ===
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        if (!email || !password) {
            shakeForm();
            return;
        }

        // Show loading state
        const btn = loginForm.querySelector('.btn-primary');
        const originalText = btn.innerText;
        btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Signing In...';
        btn.style.opacity = '0.8';
        btn.disabled = true;

        try {
            // Call backend API
            const backendHost = window.location.hostname || '127.0.0.1';
            const response = await fetch(`http://${backendHost}:8080/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            });

            const data = await response.json();

            if (data.success) {
                console.log('DEBUG: Login success! Data received:', data);

                // Safety: Ensure user object exists
                if (!data.user) {
                    console.warn('DEBUG: data.user is missing in response! Creating fallback session.');
                    data.user = { id: 999, name: "Logged In User", email: email };
                }

                // Store user data in localStorage
                localStorage.setItem('user', JSON.stringify(data.user));
                console.log('DEBUG: localStorage "user" set to:', localStorage.getItem('user'));

                // For backward compatibility
                localStorage.setItem('teacherName', data.user.name);

                // Redirect to home page
                setTimeout(() => {
                    window.location.href = 'home.html';
                }, 500);
            } else {
                // Show error message
                showError(data.message || 'Login failed. Please try again.');

                // Reset button
                btn.innerHTML = originalText;
                btn.style.opacity = '1';
                btn.disabled = false;

                shakeForm();
            }
        } catch (error) {
            console.error('Login full error:', error);
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
        loginForm.parentNode.insertBefore(errorDiv, loginForm);

        // Auto remove after 5 seconds
        setTimeout(() => {
            errorDiv.style.animation = 'slideUp 0.3s ease-out';
            setTimeout(() => errorDiv.remove(), 300);
        }, 5000);
    }

    // Add shake and error animations dynamically if not present
    const styleSheet = document.createElement("style");
    styleSheet.innerText = `
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
        }
        @keyframes slideDown {
            from {
                opacity: 0;
                transform: translateY(-10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        @keyframes slideUp {
            from {
                opacity: 1;
                transform: translateY(0);
            }
            to {
                opacity: 0;
                transform: translateY(-10px);
            }
        }
    `;
    document.head.appendChild(styleSheet);


    // === Particle Background Animation ===
    initParticles();
});

function initParticles() {
    const canvas = document.getElementById('particle-canvas');
    const ctx = canvas.getContext('2d');

    let width, height;
    let particles = [];

    // Configuration
    const particleCount = 60; // Number of dots
    const connectionDistance = 150; // Max distance to draw line
    const mouseDistance = 200; // Mouse interaction radius

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
    window.addEventListener('mouseout', () => {
        mouse.x = null;
        mouse.y = null;
    });

    // Particle Class
    class Particle {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.vx = (Math.random() - 0.5) * 0.5; // Random velocity X
            this.vy = (Math.random() - 0.5) * 0.5; // Random velocity Y
            this.size = Math.random() * 2 + 1;
            this.color = 'rgba(59, 130, 246, ' + (Math.random() * 0.5 + 0.2) + ')'; // Blue-ish
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
                    const directionX = forceDirectionX * force * 2;
                    const directionY = forceDirectionY * force * 2;

                    // Gentle push/pull
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
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }

    // Animation Loop
    function animate() {
        ctx.clearRect(0, 0, width, height);

        // Draw Particles
        particles.forEach(p => {
            p.update();
            p.draw();
        });

        // Draw Connections
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
                    ctx.strokeStyle = 'rgba(59, 130, 246, ' + (opacity * 0.2) + ')'; // Subtle blue lines
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
