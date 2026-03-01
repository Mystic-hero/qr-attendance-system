// Subjects Page Logic

document.addEventListener('DOMContentLoaded', () => {
    // Check if logged in
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (!storedUser) {
        console.warn('No user session found. (Redirect disabled)');
        // window.location.href = 'login.html';
        // return;
    }

    // Initialize Components
    loadTeacherInfo();
    initMobileMenu();
    initParticles();
    loadSubjects();
    initModalHandlers();
});

// --- Local Storage Key ---
const SUBJECTS_KEY = 'qr_attendance_subjects';
const API_BASE_URL = '/api/academic';

// --- Load Teacher Info ---
function loadTeacherInfo() {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (!storedUser) return;

    const teacherName = storedUser.name || 'User';
    const nameDisplay = document.getElementById('teacherName');
    const profilePic = document.getElementById('profilePic');

    if (nameDisplay) nameDisplay.textContent = teacherName;

    // Initials for profile pic
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

// --- Particle Background  ---
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

// --- Subjects Management ---

// Get subjects from localStorage
function getSubjects() {
    const subjects = localStorage.getItem(SUBJECTS_KEY);
    return subjects ? JSON.parse(subjects) : [];
}

// Save subjects to localStorage
function saveSubjects(subjects) {
    localStorage.setItem(SUBJECTS_KEY, JSON.stringify(subjects));
}

// Load and display subjects
function loadSubjects() {
    const subjects = getSubjects();
    const subjectsGrid = document.getElementById('subjectsGrid');
    const emptyState = document.getElementById('emptyState');

    // Clear grid
    subjectsGrid.innerHTML = '';

    if (subjects.length === 0) {
        emptyState.classList.add('show');
    } else {
        emptyState.classList.remove('show');

        subjects.forEach((subject, index) => {
            const card = createSubjectCard(subject, index);
            subjectsGrid.appendChild(card);
        });
    }
}

// Create subject card element
function createSubjectCard(subject, index) {
    const card = document.createElement('div');
    card.className = 'subject-card';
    card.innerHTML = `
        <div class="subject-header">
            <div class="subject-icon">
                <i class="fa-solid fa-book-open"></i>
            </div>
            <button class="delete-btn" onclick="deleteSubject(${index})">
                <i class="fa-solid fa-trash"></i>
            </button>
        </div>
        <div class="subject-info">
            <h3 class="subject-name">${escapeHtml(subject.name)}</h3>
            <p class="subject-code">${escapeHtml(subject.code)}</p>
        </div>
        <div class="subject-details">
            <div class="detail-item">
                <i class="fa-solid fa-graduation-cap"></i>
                <span>${escapeHtml(subject.degreeName || 'N/A')}</span>
            </div>
            <div class="detail-item">
                <i class="fa-solid fa-calendar-alt"></i>
                <span>${escapeHtml(subject.yearName || 'N/A')}</span>
            </div>
            <div class="detail-item">
                <i class="fa-solid fa-users"></i>
                <span>${subject.students} Students</span>
            </div>
        </div>
    `;
    return card;
}

// Delete subject
function deleteSubject(index) {
    const subjects = getSubjects();
    subjects.splice(index, 1);
    saveSubjects(subjects);
    loadSubjects();
}

// Make deleteSubject globally accessible
window.deleteSubject = deleteSubject;

// --- Modal Handlers ---
function initModalHandlers() {
    const addSubjectBtn = document.getElementById('addSubjectBtn');
    const modal = document.getElementById('addSubjectModal');
    const closeModal = document.getElementById('closeModal');
    const cancelBtn = document.getElementById('cancelBtn');
    const form = document.getElementById('addSubjectForm');

    const degreeSelect = document.getElementById('degreeSelect');
    const yearSelect = document.getElementById('yearSelect');
    const subjectSelect = document.getElementById('subjectSelect');
    const submitBtn = document.getElementById('submitSubjectBtn');

    // Open modal
    addSubjectBtn.addEventListener('click', () => {
        modal.classList.add('show');
        loadDegrees();
    });

    // Close modal
    const closeModalHandler = () => {
        modal.classList.remove('show');
        form.reset();
        yearSelect.disabled = true;
        subjectSelect.disabled = true;
        submitBtn.disabled = true;
    };

    closeModal.addEventListener('click', closeModalHandler);
    cancelBtn.addEventListener('click', closeModalHandler);

    // Degree Selection
    degreeSelect.addEventListener('change', () => {
        const degreeId = degreeSelect.value;
        if (degreeId) {
            loadYears(degreeId);
            subjectSelect.innerHTML = '<option value="" disabled selected>Choose Subject...</option>';
            subjectSelect.disabled = true;
            submitBtn.disabled = true;
        }
    });

    // Year Selection
    yearSelect.addEventListener('change', () => {
        const yearId = yearSelect.value;
        if (yearId) {
            loadSubjectsForSelection(yearId);
            submitBtn.disabled = true;
        }
    });

    // Subject Selection
    subjectSelect.addEventListener('change', () => {
        if (subjectSelect.value) {
            submitBtn.disabled = false;
        }
    });

    // Close on outside click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModalHandler();
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('show')) {
            closeModalHandler();
        }
    });

    // Handle form submission
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const selectedSubjectOption = subjectSelect.options[subjectSelect.selectedIndex];
        const subjectData = JSON.parse(selectedSubjectOption.getAttribute('data-subject'));

        const newSubject = {
            name: subjectData.name,
            code: subjectData.code,
            degreeName: degreeSelect.options[degreeSelect.selectedIndex].text,
            yearName: yearSelect.options[yearSelect.selectedIndex].text,
            students: parseInt(document.getElementById('students').value)
        };

        // Add to subjects
        const subjects = getSubjects();
        // Check if subject already exists
        if (subjects.find(s => s.code === newSubject.code)) {
            alert('This subject is already in your list!');
            return;
        }

        subjects.push(newSubject);
        saveSubjects(subjects);

        // Reload subjects
        loadSubjects();

        // Close modal and reset form
        closeModalHandler();
    });
}

// --- Dynamic Data Loading ---

async function loadDegrees() {
    try {
        console.log('Fetching degrees from:', `${API_BASE_URL}/degrees`);
        const response = await fetch(`${API_BASE_URL}/degrees`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const degrees = await response.json();

        const degreeSelect = document.getElementById('degreeSelect');
        degreeSelect.innerHTML = '<option value="" disabled selected>Choose Degree...</option>';

        degrees.forEach(degree => {
            const option = document.createElement('option');
            option.value = degree.id;
            option.textContent = degree.name;
            degreeSelect.appendChild(option);
        });
        console.log('Degrees loaded successfully:', degrees);
    } catch (error) {
        console.error('Error loading degrees:', error);
        alert('Failed to load degrees. Please ensure the backend is running at ' + API_BASE_URL);
    }
}

async function loadYears(degreeId) {
    try {
        const response = await fetch(`${API_BASE_URL}/years?degreeId=${degreeId}`);
        const years = await response.json();

        const yearSelect = document.getElementById('yearSelect');
        yearSelect.innerHTML = '<option value="" disabled selected>Choose Year...</option>';
        yearSelect.disabled = false;

        years.forEach(year => {
            const option = document.createElement('option');
            option.value = year.id;
            option.textContent = year.name;
            yearSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading years:', error);
    }
}

async function loadSubjectsForSelection(yearId) {
    try {
        const response = await fetch(`${API_BASE_URL}/subjects?yearId=${yearId}`);
        const subjects = await response.json();

        const subjectSelect = document.getElementById('subjectSelect');
        subjectSelect.innerHTML = '<option value="" disabled selected>Choose Subject...</option>';
        subjectSelect.disabled = false;

        subjects.forEach(subject => {
            const option = document.createElement('option');
            option.value = subject.id;
            option.textContent = `${subject.name} (${subject.code})`;
            option.setAttribute('data-subject', JSON.stringify(subject));
            subjectSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading subjects:', error);
    }
}

// --- Utility Functions ---

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
