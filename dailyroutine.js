const container = document.getElementById("routine");
const statsContainer = document.getElementById("routine-stats");
const storageKey = "dailyRoutines";

/* Format time to AM/PM */
function formatTime(time24) {
    if (!time24) return "";

    const [hour, minute] = time24.split(":");
    let h = parseInt(hour, 10);
    const ampm = h >= 12 ? "PM" : "AM";

    h = h % 12 || 12;

    return `${h}:${minute} ${ampm}`;
}

function escapeHtml(text) {
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function getTaskIcon(text) {
    const value = String(text || "").toLowerCase();

    if (/(study|read|homework|class|practice)/.test(value)) return "&#128218;";
    if (/(code|project|build|laptop|computer)/.test(value)) return "&#128187;";
    if (/(exercise|workout|run|walk|yoga|gym)/.test(value)) return "&#127947;";
    if (/(eat|meal|breakfast|lunch|dinner|cook)/.test(value)) return "&#127869;";
    if (/(clean|wash|organize|tidy)/.test(value)) return "&#129533;";
    if (/(sleep|rest|nap|bed)/.test(value)) return "&#128564;";

    return "&#10003;";
}

function renderStats(routines) {
    if (!statsContainer) return;

    const totalRoutines = routines.length;
    const totalTasks = routines.reduce((sum, routine) => {
        const tasks = Array.isArray(routine.tasks) ? routine.tasks : [];
        return sum + tasks.length;
    }, 0);
    const scheduledTasks = routines.reduce((sum, routine) => {
        const tasks = Array.isArray(routine.tasks) ? routine.tasks : [];
        return sum + tasks.filter(task => task && task.time).length;
    }, 0);

    statsContainer.innerHTML = `
        <span class="badge"><span class="badge-icon" aria-hidden="true">&#128203;</span>${totalRoutines} Routines</span>
        <span class="badge"><span class="badge-icon" aria-hidden="true">&#9989;</span>${totalTasks} Tasks</span>
        <span class="badge"><span class="badge-icon" aria-hidden="true">&#9200;</span>${scheduledTasks} Scheduled</span>
    `;
}

/* Load all routines */
function loadRoutines() {
    const data = JSON.parse(localStorage.getItem(storageKey)) || [];

    renderStats(data);

    if (data.length === 0) {
        container.innerHTML = `
            <div class="routine-empty card">
                <div class="routine-empty-icon" aria-hidden="true">&#127919;</div>
                <h3>No routines yet</h3>
                <p>Create your first routine and start building consistency day by day.</p>
            </div>
        `;
        return;
    }

    let html = "";

    data.forEach((routine, index) => {
        const routineTitle = escapeHtml(routine.title || `Routine ${index + 1}`);
        const tasks = Array.isArray(routine.tasks) ? routine.tasks : [];
        const validTasks = tasks.filter(task => task && task.text);

        const taskCount = validTasks.length;
        html += `
            <div class="plan">
                <div class="plan-header">
                    <div class="plan-title-wrap">
                        <h3><span class="plan-title-icon" aria-hidden="true">&#128204;</span>${routineTitle}</h3>
                        <div class="plan-badges">
                            <span class="plan-badge plan-badge--count">${taskCount} Task${taskCount === 1 ? "" : "s"}</span>
                        </div>
                    </div>

                    <div class="plan-actions">
                        <button onclick="editRoutine(${index})" class="plan-edit">&#9998; Edit</button>
                        <button onclick="deleteRoutine(${index})" class="plan-delete">&#128465; Delete</button>
                    </div>
                </div>
        `;

        validTasks.forEach(task => {
            const taskText = escapeHtml(task.text);
            const taskIcon = getTaskIcon(task.text);

            html += `
                <div class="plan-item">
                    <span class="plan-item-icon" aria-hidden="true">${taskIcon}</span>
                    ${task.time
                        ? `<span class="plan-item-time"><span class="time-icon" aria-hidden="true">&#9200;</span>${formatTime(task.time)}</span>`
                        : `<span class="plan-item-time plan-item-time--soft"><span class="time-icon" aria-hidden="true">&#9716;</span>Anytime</span>`}
                    <span class="plan-text">${taskText}</span>
                    <span class="task-mode ${task.time ? "task-mode--scheduled" : "task-mode--flex"}">${task.time ? "Scheduled" : "Flexible"}</span>
                </div>
            `;
        });

        if (taskCount === 0) {
            html += `
                <p class="plan-empty-note">No tasks in this routine yet.</p>
            `;
        }

        html += "</div>";
    });

    container.innerHTML = html;
}

/* Delete */
function deleteRoutine(index) {
    const data = JSON.parse(localStorage.getItem(storageKey)) || [];

    if (!confirm("Delete this routine?")) return;

    data.splice(index, 1);
    localStorage.setItem(storageKey, JSON.stringify(data));

    loadRoutines();
}

/* Edit */
function editRoutine(index) {
    window.location.href = `dailyroutinecreate.html?edit=${index}`;
}

loadRoutines();
