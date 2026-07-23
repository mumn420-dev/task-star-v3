// Load saved data from local storage
let familyData = JSON.parse(localStorage.getItem("heroTrackData")) || [];

const registerForm = document.getElementById("registerForm");
const childNameInput = document.getElementById("childNameInput");
const childrenContainer = document.getElementById("childrenContainer");
const monthlyReportBtn = document.getElementById("monthlyReportBtn");
const manualResetBtn = document.getElementById("manualResetBtn");
const monthlyModal = document.getElementById("monthlyModal");
const closeModalBtn = document.getElementById("closeModalBtn");
const modalBody = document.getElementById("modalBody");

// Caps & Scoring System
const MAX_DAILY_PTS = 1000;
const MAX_WEEKLY_PTS = 7000;
const MAX_MONTHLY_PTS = 30000;
const POINTS_PER_TASK = 10;

function getCurrentDayIndex() {
    const jsDay = new Date().getDay(); // 0 = Sun, 1 = Mon ... 6 = Sat
    return (jsDay + 6) % 7; 
}

function saveData() {
    try {
        localStorage.setItem("heroTrackData", JSON.stringify(familyData));
    } catch (e) {
        alert("Storage limit reached! Try using smaller photo sizes.");
    }
}

function init() {
    renderCards();
}

function renderCards() {
    childrenContainer.innerHTML = "";

    if (familyData.length === 0) {
        childrenContainer.innerHTML = `<p class="empty-notice">No heroes registered yet. Type a child's name above and click Register!</p>`;
        return;
    }

    const currentDayIdx = getCurrentDayIndex();

    familyData.forEach(child => {
        const card = document.createElement("div");
        card.className = "child-card";

        // Col 1: Profile & Editable Name
        const photoContent = child.photoUrl 
            ? `<img src="${child.photoUrl}" class="avatar-img" alt="${child.name}">`
            : `<span class="star-icon">★</span><span>📷 Photo</span>`;

        const profileHtml = `
            <div class="profile-col">
                <div class="avatar-box" onclick="triggerPhotoUpload(${child.id})" title="Click to upload/change photo">
                    ${photoContent}
                </div>
                <input type="file" id="photo-input-${child.id}" accept="image/*" style="display:none;" onchange="handlePhotoUpload(event, ${child.id})">
                <div class="child-name" ondblclick="editChildName(${child.id}, this)" title="Double-click to edit name">${child.name}</div>
                <div class="points-badge">⭐ ${child.dailyPoints || 0} pts</div>
                <button class="btn-remove" onclick="removeProfile(${child.id})">✕ Remove</button>
            </div>
        `;

        // Col 2: Task List & Editable Tasks
        let tasksHtml = child.tasks.map(t => `
            <div class="task-row">
                <div class="oval-btn ${t.completed ? 'completed' : 'pending'}">
                    <span onclick="toggleTask(${child.id}, ${t.id})">${t.completed ? '☑' : '☐'}</span>
                    <span class="task-text" ondblclick="editTaskText(${child.id}, ${t.id}, this)" title="Double-click to edit chore">${t.text}</span>
                </div>
                <button class="btn-del-task" onclick="deleteTask(${child.id}, ${t.id})">✕</button>
            </div>
        `).join("");

        const tasksColHtml = `
            <div class="tasks-col">
                <form class="add-task-form" onsubmit="addTask(event, ${child.id})">
                    <input type="text" id="task-input-${child.id}" placeholder="New chore..." autocomplete="off">
                    <button type="submit" class="btn-add-plus">+</button>
                </form>
                <div class="task-list">
                    ${tasksHtml}
                </div>
            </div>
        `;

        // Col 3: Daily Progress Bars
        const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
        let barsHtml = days.map((day, idx) => `
            <div class="bar-wrapper">
                <div class="bar-bg">
                    <div class="bar-fill" style="height: ${child.dailyProgress[idx]}%;"></div>
                </div>
                <span class="bar-label ${idx === currentDayIdx ? 'active-day' : ''}">${day}</span>
            </div>
        `).join("");

        const dailyColHtml = `
            <div class="daily-col">
                <span class="daily-title">Daily Progress:</span>
                <div class="bars-group">
                    ${barsHtml}
                </div>
            </div>
        `;

        // Col 4: Weekly Ring
        const weeklyColHtml = `
            <div class="weekly-col">
                <span class="weekly-title">Weekly Target:</span>
                <div class="ring-outer" style="background: conic-gradient(#0284c7 ${child.weeklyPct * 3.6}deg, #e2e8f0 0deg)">
                    <div class="ring-inner">
                        <span class="weekly-pct-text">${child.weeklyPct}%</span>
                    </div>
                </div>
                <span class="weekly-pct-text">Target Progress</span>
            </div>
        `;

        card.innerHTML = profileHtml + tasksColHtml + dailyColHtml + weeklyColHtml;
        childrenContainer.appendChild(card);
    });
}

// Register Child
registerForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = childNameInput.value.trim();
    if (name) {
        familyData.push({
            id: Date.now(),
            name: name,
            photoUrl: null,
            tasks: [],
            dailyProgress: [0, 0, 0, 0, 0, 0, 0],
            dailyPoints: 0,
            weeklyPoints: 0,
            monthlyPoints: 0,
            weeklyPct: 0
        });
        childNameInput.value = "";
        saveData();
        renderCards();
    }
});

// Photo Upload Handling
window.triggerPhotoUpload = function(childId) {
    document.getElementById(`photo-input-${childId}`).click();
};

window.handlePhotoUpload = function(e, childId) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            const maxSize = 150;
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > maxSize) {
                    height *= maxSize / width;
                    width = maxSize;
                }
            } else {
                if (height > maxSize) {
                    width *= maxSize / height;
                    height = maxSize;
                }
            }

            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);

            const resizedUrl = canvas.toDataURL("image/jpeg", 0.8);
            const child = familyData.find(c => c.id === childId);
            if (child) {
                child.photoUrl = resizedUrl;
                saveData();
                renderCards();
            }
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
};

// Double click to edit child's name
window.editChildName = function(childId, element) {
    const child = familyData.find(c => c.id === childId);
    const input = document.createElement("input");
    input.type = "text";
    input.className = "editable-input";
    input.value = child.name;

    element.replaceWith(input);
    input.focus();

    const saveName = () => {
        const newName = input.value.trim();
        if (newName) child.name = newName;
        saveData();
        renderCards();
    };

    input.addEventListener("blur", saveName);
    input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") saveName();
    });
};

// Double click to edit task name
window.editTaskText = function(childId, taskId, element) {
    const child = familyData.find(c => c.id === childId);
    const task = child.tasks.find(t => t.id === taskId);
    const input = document.createElement("input");
    input.type = "text";
    input.className = "editable-input";
    input.value = task.text;

    element.replaceWith(input);
    input.focus();

    const saveTask = () => {
        const newText = input.value.trim();
        if (newText) task.text = newText;
        saveData();
        renderCards();
    };

    input.addEventListener("blur", saveTask);
    input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") saveTask();
    });
};

// Task Operations
window.addTask = function(e, childId) {
    e.preventDefault();
    const input = document.getElementById(`task-input-${childId}`);
    const text = input.value.trim();
    if (text) {
        const child = familyData.find(c => c.id === childId);
        child.tasks.push({ id: Date.now(), text: text, completed: false });
        updateChildStats(child);
        saveData();
        renderCards();
    }
};

window.toggleTask = function(childId, taskId) {
    const child = familyData.find(c => c.id === childId);
    const task = child.tasks.find(t => t.id === taskId);
    task.completed = !task.completed;
    updateChildStats(child);
    saveData();
    renderCards();
};

window.deleteTask = function(childId, taskId) {
    const child = familyData.find(c => c.id === childId);
    child.tasks = child.tasks.filter(t => t.id !== taskId);
    updateChildStats(child);
    saveData();
    renderCards();
};

window.removeProfile = function(childId) {
    familyData = familyData.filter(c => c.id !== childId);
    saveData();
    renderCards();
};

// Accumulation Calculations (1/7th per day, 1/30th for month)
function updateChildStats(child) {
    const todayIdx = getCurrentDayIndex();

    if (child.tasks.length === 0) {
        child.dailyProgress[todayIdx] = 0;
        child.dailyPoints = 0;
    } else {
        const completedCount = child.tasks.filter(t => t.completed).length;
        const pct = Math.round((completedCount / child.tasks.length) * 100);
        child.dailyProgress[todayIdx] = pct;
        child.dailyPoints = Math.min(completedCount * POINTS_PER_TASK, MAX_DAILY_PTS);
    }

    // Weekly accumulation: Sum of each day's progress scaled to 1/7th (14.28% maximum per day)
    const totalWeeklyPct = child.dailyProgress.reduce((sum, val) => sum + (val / 7), 0);
    child.weeklyPct = Math.min(Math.round(totalWeeklyPct), 100);
    child.weeklyPoints = Math.min(Math.round((child.weeklyPct / 100) * MAX_WEEKLY_PTS), MAX_WEEKLY_PTS);

    // Monthly accumulation: Accumulates 1/30th (3.33% scale per daily completion)
    const totalMonthlyPct = (child.weeklyPct * 7) / 30; 
    child.monthlyPoints = Math.min(Math.round((totalMonthlyPct / 100) * MAX_MONTHLY_PTS), MAX_MONTHLY_PTS);
}

// Manual Reset All Data Button
manualResetBtn.addEventListener("click", () => {
    if (confirm("Are you sure you want to reset all tasks and scores? This cannot be undone.")) {
        familyData.forEach(child => {
            child.dailyProgress = [0, 0, 0, 0, 0, 0, 0];
            child.dailyPoints = 0;
            child.weeklyPoints = 0;
            child.monthlyPoints = 0;
            child.weeklyPct = 0;
            child.tasks.forEach(t => t.completed = false);
        });
        saveData();
        renderCards();
    }
});

// Modal Logic
monthlyReportBtn.addEventListener("click", () => {
    if (familyData.length === 0) {
        modalBody.innerHTML = "<p style='text-align:center;'>No heroes registered yet.</p>";
    } else {
        const sortedByWeekly = [...familyData].sort((a, b) => (b.weeklyPoints || 0) - (a.weeklyPoints || 0));
        const sortedByMonthly = [...familyData].sort((a, b) => (b.monthlyPoints || 0) - (a.monthlyPoints || 0));

        const weeklyWinner = sortedByWeekly[0]?.weeklyPoints > 0 ? sortedByWeekly[0].name : "No Winner Yet";
        const monthlyWinner = sortedByMonthly[0]?.monthlyPoints > 0 ? sortedByMonthly[0].name : "No Winner Yet";

        let rowsHtml = familyData.map(c => `
            <tr>
                <td>${c.name}</td>
                <td>${c.dailyPoints || 0} / ${MAX_DAILY_PTS}</td>
                <td>${c.weeklyPoints || 0} / ${MAX_WEEKLY_PTS}</td>
                <td>${c.monthlyPoints || 0} / ${MAX_MONTHLY_PTS}</td>
            </tr>
        `).join("");

        modalBody.innerHTML = `
            <div class="winners-banner">
                <div class="winner-card">
                    <h4>👑 Weekly Winner</h4>
                    <p>${weeklyWinner}</p>
                </div>
                <div class="winner-card">
                    <h4>🏆 Monthly Champion</h4>
                    <p>${monthlyWinner}</p>
                </div>
            </div>

            <table class="modal-table">
                <thead>
                    <tr>
                        <th>Hero</th>
                        <th>Daily Score (Max 1k)</th>
                        <th>Weekly Score (Max 7k)</th>
                        <th>Monthly Score (Max 30k)</th>
                    </tr>
                </thead>
                <tbody>
                    ${rowsHtml}
                </tbody>
            </table>
        `;
    }
    monthlyModal.style.display = "flex";
});

closeModalBtn.addEventListener("click", () => {
    monthlyModal.style.display = "none";
});

window.addEventListener("click", (e) => {
    if (e.target === monthlyModal) {
        monthlyModal.style.display = "none";
    }
});

init();
