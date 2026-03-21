const container = document.getElementById("routine");
const storageKey = "dailyRoutines";

/* Format time to AM/PM */
function formatTime(time24) {
    if (!time24) return "";

    const [hour, minute] = time24.split(":");
    let h = parseInt(hour);
    const ampm = h >= 12 ? "PM" : "AM";

    h = h % 12 || 12;

    return `${h}:${minute} ${ampm}`;
}

/* Load all routines */
function loadRoutines() {
    const data = JSON.parse(localStorage.getItem(storageKey)) || [];

    if (data.length === 0) {
        container.innerHTML = "<p>No routines created yet.</p>";
        return;
    }

    let html = "";

    data.forEach((routine, index) => {
        html += `
            <div class="plan">
                <div class="plan-header">
                    <h3>${routine.title}</h3>

                    <div class="plan-actions">
                        <button onclick="editRoutine(${index})" class="plan-edit">Edit</button>
                        <button onclick="deleteRoutine(${index})" class="plan-delete">Delete</button>
                    </div>
                </div>
        `;

        routine.tasks.forEach(task => {
            html += `
                <div class="plan-item">
                    ${task.time ? `<span class="plan-item-time">${formatTime(task.time)}</span>` : ""}
                    <span class="plan-text">${task.text}</span>
                </div>
            `;
        });

        html += `</div>`;
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