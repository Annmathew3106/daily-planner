const form = document.querySelector(".form");
const addBtn = document.querySelector(".add-btn");
const container = document.querySelector(".subjects");
const template = document.getElementById("task-template");

const storageKey = "dailyRoutines";

/* Add row */
addBtn.addEventListener("click", () => {
    const node = template.content.cloneNode(true);
    container.appendChild(node);
});

/* Remove row */
container.addEventListener("click", (e) => {
    if (!e.target.classList.contains("remove-btn")) return;

    const row = e.target.closest(".subject-group");
    if (row.dataset.required === "true") return;

    row.remove();
});

/* Load for edit */
function loadForEdit() {
    const params = new URLSearchParams(window.location.search);
    const editIndex = params.get("edit");

    if (editIndex === null) return;

    const routines = JSON.parse(localStorage.getItem(storageKey)) || [];
    const data = routines[editIndex];

    if (!data) return;

    document.getElementById("title").value = data.title;
    container.innerHTML = "";

    data.tasks.forEach((task, index) => {
        const node = template.content.cloneNode(true);
        const inputs = node.querySelectorAll("input");

        inputs[0].value = task.text;
        inputs[1].value = task.time || "";

        if (index === 0) {
            node.querySelector(".subject-group").dataset.required = "true";
        }

        container.appendChild(node);
    });
}

/* Save */
form.addEventListener("submit", (e) => {
    e.preventDefault();

    const title = document.getElementById("title").value.trim();
    const rows = document.querySelectorAll(".subject-group");

    const tasks = [];

    rows.forEach(row => {
        const text = row.querySelector('input[name="tasks[]"]').value.trim();
        const time = row.querySelector('input[name="times[]"]').value;

        if (text) {
            tasks.push({ text, time });
        }
    });

    if (!title) {
        alert("Enter routine title");
        return;
    }

    if (tasks.length === 0) {
        alert("Add at least one task");
        return;
    }

    const routines = JSON.parse(localStorage.getItem(storageKey)) || [];

    const params = new URLSearchParams(window.location.search);
    const editIndex = params.get("edit");

    if (editIndex !== null) {
        routines[editIndex] = { title, tasks };
    } else {
        routines.push({ title, tasks });
    }

    localStorage.setItem(storageKey, JSON.stringify(routines));

    window.location.href = "dailyroutine.html";
});

loadForEdit();