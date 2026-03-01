// QR Room Page Logic

document.addEventListener('DOMContentLoaded', async () => {
    // Check if logged in
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (!storedUser) {
        console.warn('No user session found. (Redirect disabled)');
    }

    // Initialize Components
    loadSubjects();
    loadTeacherInfo();
    initMobileMenu();
    initParticles();
    await fetchServerIp(); // Wait for IP detection
    initQRGenerator();
});

// --- Constants ---
const API_BASE_URL = '/api/attendance';
const SUBJECTS_KEY = 'qr_attendance_subjects';

// --- Fetch Server IP ---
async function fetchServerIp() {
    try {
        const response = await fetch(`${API_BASE_URL}/server-ip`);
        if (response.ok) {
            const ip = await response.text();
            const serverIpInput = document.getElementById('serverIp');
            if (serverIpInput && ip && ip !== '127.0.0.1') {
                serverIpInput.value = ip;
                console.log('Server IP detected:', ip);
            }
        }
    } catch (error) {
        console.warn('Could not auto-detect server IP:', error);
    }
}

// --- Load Teacher Info ---
function loadTeacherInfo() {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (!storedUser) return;

    const teacherName = storedUser.name || 'User';
    const nameDisplay = document.getElementById('teacherName');
    const profilePic = document.getElementById('profilePic');

    if (nameDisplay) nameDisplay.textContent = teacherName;
    const initials = teacherName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    if (profilePic) profilePic.textContent = initials;
}

// --- Mobile Menu Toggle ---
function initMobileMenu() {
    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.getElementById('navLinks');
    const icon = menuToggle.querySelector('i');

    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('show');
            if (navLinks.classList.contains('show')) {
                icon.classList.replace('fa-bars', 'fa-xmark');
            } else {
                icon.classList.replace('fa-xmark', 'fa-bars');
            }
        });
    }
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

// --- Subject Loading ---
function loadSubjects() {
    try {
        const subjectsData = localStorage.getItem(SUBJECTS_KEY);
        const subjects = JSON.parse(subjectsData || '[]');
        const select = document.getElementById('subjectSelect');
        const helpDiv = document.getElementById('noSubjectsHelp');

        if (!select) return;

        while (select.options.length > 1) {
            select.remove(1);
        }

        if (subjects.length === 0) {
            if (helpDiv) helpDiv.style.display = 'block';
            const option = document.createElement('option');
            option.value = "";
            option.textContent = "No subjects found...";
            option.disabled = true;
            select.appendChild(option);
        } else {
            if (helpDiv) helpDiv.style.display = 'none';
            subjects.forEach(subject => {
                const option = document.createElement('option');
                option.value = JSON.stringify(subject);
                option.textContent = `${subject.name} (${subject.code})`;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading subjects:', error);
    }
}

// --- QR Logic ---
function initQRGenerator() {
    const generateBtn = document.getElementById('generateBtn');
    const subjectSelect = document.getElementById('subjectSelect');
    const qrPlaceholder = document.getElementById('qrPlaceholder');
    const qrDiv = document.getElementById('qrcode');
    const sessionInfo = document.getElementById('sessionInfo');
    const sessionTime = document.getElementById('sessionTime');
    const attendanceCount = document.getElementById('attendanceCount');
    const stopBtn = document.getElementById('stopBtn');
    const copyLinkBtn = document.getElementById('copyLinkBtn');
    const serverIpInput = document.getElementById('serverIp');
    const ipInputGroup = document.getElementById('ipInputGroup');
    let sessionInterval = null;
    let currentStudentUrl = '';
    let currentActiveId = null;

    // Check for active session on load
    fetch(`${API_BASE_URL}/active`)
        .then(async res => {
            if (res.status === 200) return res.json();
            if (res.status === 204) return null;
            const errorText = await res.text();
            throw new Error(errorText || `Server Error (${res.status})`);
        })
        .then(activeSession => {
            if (activeSession) {
                restoreSession(activeSession);
            }
        })
        .catch(err => {
            console.error('Active session check failed:', err);
            // Only show alert if it's a real 500 error, not just a 204 No Content
            if (!err.message.includes('204')) {
                alert('Connection Error: ' + err.message);
            }
        });

    function restoreSession(session) {
        currentActiveId = session.id;

        // Use detected IP if available, otherwise fallback to origin
        const serverIp = serverIpInput.value.trim();
        let studentUrl = '';
        if (serverIp && serverIp !== '127.0.0.1' && !window.location.hostname.includes('render.com')) {
            studentUrl = `http://${serverIp}:8080/student-form.html?sessionId=${session.sessionId}`;
        } else {
            studentUrl = `${window.location.origin}/student-form.html?sessionId=${session.sessionId}`;
        }
        currentStudentUrl = studentUrl;

        // Generate QR
        qrDiv.innerHTML = '';
        new QRCode(qrDiv, {
            text: studentUrl,
            width: 200,
            height: 200,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });

        // UI Updates
        qrPlaceholder.style.display = 'none';
        qrDiv.style.display = 'block';
        generateBtn.style.display = 'none';
        stopBtn.style.display = 'flex';
        copyLinkBtn.style.display = 'flex';
        ipInputGroup.style.display = 'none';
        subjectSelect.disabled = true;
        sessionInfo.style.display = 'flex';
        sessionTime.textContent = `Session active since: ${new Date(session.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        attendanceCount.innerHTML = `<div>Attendance: ${session.studentList.length} Present</div><div style="font-size: 0.8em; color: #94a3b8; margin-top: 5px;">Link: ${studentUrl}</div>`;

        startPolling(session.sessionId);
    }

    function startPolling(sessionId) {
        if (sessionInterval) clearInterval(sessionInterval);
        sessionInterval = setInterval(() => {
            fetch(`${API_BASE_URL}/active`)
                .then(res => res.json())
                .then(session => {
                    if (session && session.sessionId === sessionId) {
                        attendanceCount.textContent = `Attendance: ${session.studentList.length} Present`;
                    }
                })
                .catch(err => console.error('Polling error:', err));
        }, 3000);
    }

    generateBtn.addEventListener('click', async () => {
        if (!subjectSelect.value) {
            alert('Please select a subject first!');
            return;
        }

        // --- NEW: Location Capture for Teacher ---
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser.");
            return;
        }

        generateBtn.disabled = true;
        const originalBtnText = generateBtn.innerHTML;
        generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Getting Location...';

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const teacherLat = position.coords.latitude;
                const teacherLon = position.coords.longitude;

                const subject = JSON.parse(subjectSelect.value);
                const sessionId = 'sess_' + Date.now();

                // 1. Determine Base URL
                const serverIp = serverIpInput.value.trim();
                let studentUrl = '';
                if (serverIp && !window.location.hostname.includes('render.com')) {
                    studentUrl = `http://${serverIp}:8080/student-form.html?sessionId=${sessionId}`;
                } else {
                    studentUrl = `${window.location.origin}/student-form.html?sessionId=${sessionId}`;
                }
                currentStudentUrl = studentUrl;

                // 2. Start session on backend with location
                try {
                    const response = await fetch(`${API_BASE_URL}/start`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            sessionId: sessionId,
                            subjectName: subject.name,
                            subjectCode: subject.code,
                            totalStudents: subject.students,
                            teacherLatitude: teacherLat,
                            teacherLongitude: teacherLon
                        })
                    });

                    if (!response.ok) {
                        const errorDetail = await response.text();
                        throw new Error(errorDetail || 'Server Error');
                    }

                    const savedSession = await response.json();
                    currentActiveId = savedSession.id;

                    // 3. Generate QR Code
                    qrDiv.innerHTML = '';
                    new QRCode(qrDiv, {
                        text: studentUrl,
                        width: 200,
                        height: 200,
                        colorDark: "#000000",
                        colorLight: "#ffffff",
                        correctLevel: QRCode.CorrectLevel.H
                    });

                    // 4. UI Updates
                    qrPlaceholder.style.display = 'none';
                    qrDiv.style.display = 'block';
                    generateBtn.style.display = 'none';
                    stopBtn.style.display = 'flex';
                    copyLinkBtn.style.display = 'flex';
                    ipInputGroup.style.display = 'none';
                    subjectSelect.disabled = true;
                    sessionInfo.style.display = 'flex';
                    sessionTime.textContent = `Session started: ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                    attendanceCount.textContent = 'Attendance: 0 Present';

                    startPolling(sessionId);
                } catch (error) {
                    console.error('Error starting session:', error);
                    alert('Error starting session: ' + error.message);
                    generateBtn.disabled = false;
                    generateBtn.innerHTML = originalBtnText;
                }
            },
            (error) => {
                let msg = "Error getting location: ";
                switch (error.code) {
                    case error.PERMISSION_DENIED: msg += "Permission denied. Please allow location access."; break;
                    case error.POSITION_UNAVAILABLE: msg += "Location info unavailable."; break;
                    case error.TIMEOUT: msg += "Location request timed out."; break;
                    default: msg += "Unknown error.";
                }
                alert(msg);
                generateBtn.disabled = false;
                generateBtn.innerHTML = originalBtnText;
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 10000 }
        );
    });

    copyLinkBtn.addEventListener('click', () => {
        if (currentStudentUrl) {
            navigator.clipboard.writeText(currentStudentUrl).then(() => {
                const originalText = copyLinkBtn.innerHTML;
                copyLinkBtn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
                setTimeout(() => {
                    copyLinkBtn.innerHTML = originalText;
                }, 2000);
            });
        }
    });

    stopBtn.addEventListener('click', async () => {
        if (confirm('Are you sure you want to stop this session? The QR code will be cleared.')) {
            try {
                const response = await fetch(`${API_BASE_URL}/stop/${currentActiveId}`, {
                    method: 'POST'
                });
                if (!response.ok) throw new Error('Failed to stop session on backend');

                // Reset UI
                if (sessionInterval) clearInterval(sessionInterval);
                qrDiv.innerHTML = '';
                qrDiv.style.display = 'none';
                qrPlaceholder.style.display = 'flex';
                generateBtn.style.display = 'flex';
                generateBtn.disabled = false;
                stopBtn.style.display = 'none';
                copyLinkBtn.style.display = 'none';
                ipInputGroup.style.display = 'block';
                subjectSelect.disabled = false;
                sessionInfo.style.display = 'none';
                currentStudentUrl = '';
                currentActiveId = null;
            } catch (error) {
                console.error('Error stopping session:', error);
                alert('Error stopping session.');
            }
        }
    });
}
