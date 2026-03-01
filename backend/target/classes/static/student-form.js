// Student Form Logic

document.addEventListener('DOMContentLoaded', () => {
    initParticles();
    handleSessionContext();
    handleFormSubmission();
    requestInitialLocation(); // Prime the permission on load
});

// --- Constants ---
const API_BASE_URL = '/api/attendance';

/**
 * Prime the location permission as soon as the page loads
 */
function requestInitialLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            () => console.log("Location permission granted."),
            (err) => {
                if (err.code === err.PERMISSION_DENIED) {
                    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
                    if (!isLocal && window.location.protocol === 'http:') {
                        alert("ERROR: Browsers block location on insecure (HTTP) links. Please use HTTPS or access via 'localhost'. Try using ngrok for testing.");
                    }
                }
            }
        );
    }
}

async function handleSessionContext() {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('sessionId');
    const subjectTag = document.getElementById('subjectTag');

    if (!sessionId) {
        subjectTag.textContent = 'Invalid Session';
        return;
    }

    try {
        // We can fetch active session to show subject name
        const response = await fetch(`${API_BASE_URL}/active`);
        if (response.status === 200) {
            const session = await response.json();
            if (session.sessionId === sessionId) {
                subjectTag.textContent = `${session.subjectName} (${session.subjectCode})`;
                return;
            }
        }

        // If not the current active session, it might be an old link
        subjectTag.textContent = 'Session Found (Remote Device)';
    } catch (error) {
        console.warn('Could not fetch session info from backend.');
        subjectTag.textContent = 'Demo Session (Remote Device)';
    }
}

function handleFormSubmission() {
    const form = document.getElementById('student-form');
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('sessionId');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // --- NEW: Location Capture for Student ---
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser. Attendance cannot be marked.");
            return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying Location...';

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const studentLat = position.coords.latitude;
                const studentLon = position.coords.longitude;

                const studentData = {
                    name: document.getElementById('studentName').value.trim(),
                    rollNumber: document.getElementById('rollNumber').value.trim(),
                    sessionId: sessionId,
                    latitude: studentLat,
                    longitude: studentLon
                };

                try {
                    const response = await fetch(`${API_BASE_URL}/submit`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(studentData)
                    });

                    if (response.ok) {
                        // Show success
                        document.getElementById('attendanceForm').style.display = 'none';
                        document.getElementById('successMessage').style.display = 'block';
                    } else {
                        const errorMsg = await response.text();
                        alert(errorMsg || 'Failed to submit attendance.');
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = originalBtnText;
                    }
                } catch (error) {
                    console.error('Submission error:', error);
                    alert('Error submitting attendance. Check your connection.');
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtnText;
                }
            },
            (error) => {
                let msg = "Error getting location: ";
                switch (error.code) {
                    case error.PERMISSION_DENIED: msg += "Permission denied. Please allow location access to mark attendance."; break;
                    case error.POSITION_UNAVAILABLE: msg += "Location info unavailable."; break;
                    case error.TIMEOUT: msg += "Location request timed out."; break;
                    default: msg += "Unknown error.";
                }
                alert(msg);
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 10000 }
        );
    });
}

// --- Particle Background  ---
function initParticles() {
    const canvas = document.getElementById('particle-canvas');
    if (!canvas) return;

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
            this.color = `rgba(59, 130, 246, ${Math.random() * 0.5})`;
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

    function createParticles() {
        particles = [];
        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle());
        }
    }

    function animate() {
        requestAnimationFrame(animate);
        ctx.clearRect(0, 0, width, height);

        for (let i = 0; i < particles.length; i++) {
            particles[i].update();
            particles[i].draw();

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
