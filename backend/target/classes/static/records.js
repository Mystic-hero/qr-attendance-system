// Attendance Records Page Logic

document.addEventListener('DOMContentLoaded', () => {
    // Check if logged in
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (!storedUser) {
        console.warn('No user session found. (Redirect disabled)');
    }

    // Initialize Components
    loadTeacherInfo();
    initMobileMenu();
    initParticles();
    setTimeout(() => {
        loadAttendanceRecords();
    }, 500);
    initSearchAndFilter();
});

// --- Constants ---
const API_BASE_URL = '/api/attendance';

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
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-xmark');
            } else {
                icon.classList.remove('fa-xmark');
                icon.classList.add('fa-bars');
            }
        });
    }
}

// --- Particle Background ---
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

// --- Attendance Records Management ---

let allRecords = [];

async function loadAttendanceRecords(filter = 'all', searchQuery = '') {
    const recordsContainer = document.getElementById('recordsContainer');
    const emptyState = document.getElementById('emptyState');

    try {
        const response = await fetch(`${API_BASE_URL}/records`);
        if (!response.ok) throw new Error('Failed to fetch records');
        allRecords = await response.json();

        let filteredRecords = [...allRecords];

        // Apply filters
        if (filter !== 'all') {
            filteredRecords = filterRecordsByDate(filteredRecords, filter);
        }

        // Apply search
        if (searchQuery) {
            filteredRecords = filteredRecords.filter(record =>
                record.subjectName.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Clear container
        recordsContainer.innerHTML = '';

        if (filteredRecords.length === 0) {
            emptyState.classList.add('show');
            recordsContainer.style.display = 'none';
        } else {
            emptyState.classList.remove('show');
            recordsContainer.style.display = 'flex';

            // Sort records by date (newest first)
            filteredRecords.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

            filteredRecords.forEach((record) => {
                const card = createRecordCard(record);
                recordsContainer.appendChild(card);
            });
        }
    } catch (error) {
        console.error('Error loading records:', error);
        emptyState.classList.add('show');
    }
}

// Filter records by date
function filterRecordsByDate(records, filter) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return records.filter(record => {
        const recordDate = new Date(record.timestamp);
        const recordDay = new Date(recordDate.getFullYear(), recordDate.getMonth(), recordDate.getDate());

        switch (filter) {
            case 'today':
                return recordDay.getTime() === today.getTime();
            case 'week':
                const weekAgo = new Date(today);
                weekAgo.setDate(weekAgo.getDate() - 7);
                return recordDay >= weekAgo;
            case 'month':
                const monthAgo = new Date(today);
                monthAgo.setMonth(monthAgo.getMonth() - 1);
                return recordDay >= monthAgo;
            default:
                return true;
        }
    });
}

// Create record card element
function createRecordCard(record) {
    const card = document.createElement('div');
    card.className = 'record-card';

    const date = new Date(record.timestamp);
    const formattedDate = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    const formattedTime = date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });

    const presentCount = record.studentList ? record.studentList.length : 0;
    const totalCount = record.totalStudents || 0;
    const absentCount = Math.max(0, totalCount - presentCount);
    const percentage = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

    card.innerHTML = `
        <div class="record-header">
            <div class="record-title-section">
                <div class="subject-name">
                    <div class="subject-icon">
                        <i class="fa-solid fa-book-open"></i>
                    </div>
                    ${escapeHtml(record.subjectName)} 
                    <span class="subject-code-tag">${escapeHtml(record.subjectCode || '')}</span>
                </div>
                <div class="record-date-time">
                    <div class="date-time-item">
                        <i class="fa-regular fa-calendar"></i>
                        <span>${formattedDate}</span>
                    </div>
                    <div class="date-time-item">
                        <i class="fa-regular fa-clock"></i>
                        <span>${formattedTime}</span>
                    </div>
                </div>
            </div>
            <div class="record-actions">
                <button class="btn-download" onclick="downloadCSVById(${record.id})">
                    <i class="fa-solid fa-download"></i>
                    Download CSV
                </button>
                <button class="btn-delete" onclick="showDeleteModal(null, ${record.id})">
                    <i class="fa-solid fa-trash-can"></i>
                    Delete
                </button>
            </div>
        </div>

        <div class="progress-bar-container">
            <div class="progress-label">
                <span>Attendance Progress</span>
                <span>${percentage}%</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${percentage}%"></div>
            </div>
        </div>

        <div class="attendance-stats">
            <div class="stat-item">
                <div class="stat-label">Total Students</div>
                <div class="stat-value">${totalCount}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Present</div>
                <div class="stat-value present">${presentCount}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Absent</div>
                <div class="stat-value absent">${absentCount}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Attendance Rate</div>
                <div class="stat-value percentage">${percentage}%</div>
            </div>
        </div>
    `;

    return card;
}

// Download CSV for a specific record
function downloadCSVById(id) {
    const record = allRecords.find(r => r.id === id);

    if (!record) {
        alert('Record not found!');
        return;
    }

    // Create CSV content
    let csvContent = 'Student Name,Roll Number,Date,Time,Status\n';

    const date = new Date(record.timestamp);
    const formattedDate = date.toLocaleDateString('en-US');
    const formattedTime = date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });

    // Add present students
    record.studentList.forEach(student => {
        csvContent += `"${student.name}","${student.rollNumber}","${formattedDate}","${formattedTime}","Present"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    const fileName = `${record.subjectName.replace(/\s+/g, '_')}_${date.toISOString().split('T')[0]}.csv`;

    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

window.downloadCSVById = downloadCSVById;

// --- Delete Functionality ---
let recordToDeleteId = null;

function showDeleteModal(index, id) {
    recordToDeleteId = id;
    const modal = document.getElementById('deleteModal');
    if (modal) {
        modal.classList.add('show');
    }
}

function hideDeleteModal() {
    const modal = document.getElementById('deleteModal');
    if (modal) {
        modal.classList.remove('show');
    }
    recordToDeleteId = null;
}

async function confirmDelete() {
    if (recordToDeleteId === null) return;

    try {
        const response = await fetch(`${API_BASE_URL}/${recordToDeleteId}`, {
            method: 'DELETE'
        });
        if (response.ok) {
            showToast('Record deleted successfully');
            loadAttendanceRecords(document.getElementById('filterSelect').value, document.getElementById('searchInput').value);
        } else {
            alert('Failed to delete record.');
        }
    } catch (error) {
        console.error('Error deleting record:', error);
    }

    hideDeleteModal();
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%);
        background: #1e293b;
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        z-index: 3000;
        animation: fadeIn 0.3s ease;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.5s ease';
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

document.getElementById('cancelDelete').addEventListener('click', hideDeleteModal);
document.getElementById('confirmDeleteBtn').addEventListener('click', confirmDelete);

document.getElementById('deleteModal').addEventListener('click', (e) => {
    if (e.target.id === 'deleteModal') hideDeleteModal();
});

window.showDeleteModal = showDeleteModal;

// --- Search and Filter ---
function initSearchAndFilter() {
    const searchInput = document.getElementById('searchInput');
    const filterSelect = document.getElementById('filterSelect');

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchQuery = e.target.value;
            const filter = filterSelect.value;
            loadAttendanceRecords(filter, searchQuery);
        });
    }

    if (filterSelect) {
        filterSelect.addEventListener('change', (e) => {
            const filter = e.target.value;
            const searchQuery = searchInput.value;
            loadAttendanceRecords(filter, searchQuery);
        });
    }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
