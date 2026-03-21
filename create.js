const form = document.querySelector(".form");
const addBtn = document.querySelector(".add-btn");
const subjects = document.querySelector(".subjects");
const template = document.getElementById("subject-template");
const storageKey = "dailyPlans";
const legacyStorageKey = "studyPlans";
const editKey = "editPlanDate";

function addRow() {
    const node = template.content.cloneNode(true);
    subjects.appendChild(node);
}

function addRowWithValues(text, done) {
    const node = template.content.cloneNode(true);
    const row = node.querySelector(".subject-group");
    const inputs = node.querySelectorAll("input");
    if (inputs[0]) inputs[0].value = text;
    if (row) row.dataset.done = done ? "true" : "false";
    subjects.appendChild(node);
}

function loadPlans() {
    if (!localStorage.getItem(storageKey) && localStorage.getItem(legacyStorageKey)) {
        localStorage.setItem(storageKey, localStorage.getItem(legacyStorageKey));
    }
    return JSON.parse(localStorage.getItem(storageKey) || "[]");
}

function prefillForEdit() {
    const editDate = localStorage.getItem(editKey);
    if (!editDate) return;

    const plans = loadPlans();
    const plan = plans.find((p) => p.date === editDate);
    if (!plan) return;

    const title = document.querySelector(".form h2");
    if (title) title.textContent = "Edit Your Daily Plan";

    const dateInput = document.getElementById("date");
    if (dateInput) dateInput.value = plan.date;

    subjects.innerHTML = "";

    plan.items.forEach((item, index) => {
        const text = item.text || [item.subject, item.topic].filter(Boolean).join(" - ");
        if (index === 0) {
            const row = document.createElement("div");
            row.className = "subject-group";
            row.dataset.required = "true";
            row.dataset.done = item.done ? "true" : "false";
            row.innerHTML = `
                <input type="text" name="plans[]" placeholder="Add your plan" required>
                <button type="button" class="remove-btn" aria-label="Remove plan">Remove</button>
            `;
            const inputs = row.querySelectorAll("input");
            if (inputs[0]) inputs[0].value = text;
            subjects.appendChild(row);
        } else {
            addRowWithValues(text, item.done);
        }
    });
}

subjects.addEventListener("click", (e) => {
    if (!e.target.classList.contains("remove-btn")) return;
    const row = e.target.closest(".subject-group");
    if (!row || row.dataset.required === "true") return;
    row.remove();
});

addBtn.addEventListener("click", () => {
    addRow();
});

form.addEventListener("submit", (e) => {
    e.preventDefault();
    const rows = Array.from(subjects.querySelectorAll(".subject-group"));
    const dateInput = document.getElementById("date");
    const dateValue = dateInput ? dateInput.value : "";
    const items = [];

    for (const row of rows) {
        const inputs = row.querySelectorAll("input");
        const text = inputs[0].value.trim();
        const hasAny = text.length > 0;

        if (!hasAny && row.dataset.required !== "true") {
            row.remove();
            continue;
        }

        if (text) {
            const done = row.dataset.done === "true";
            items.push({ text, done });
        }
    }

    if (!dateValue) {
        alert("Please select a date.");
        return;
    }

    if (items.length === 0) {
        alert("Please add at least one plan.");
        return;
    }

    const existing = loadPlans();
    const editDate = localStorage.getItem(editKey);
    const editPlan = editDate ? existing.find((plan) => plan.date === editDate) : null;
    let next = existing.filter((plan) => plan.date !== dateValue);

    if (editDate && editDate === dateValue) {
        const createdAt = editPlan?.createdAt || Date.now();
        next.push({ date: dateValue, items, createdAt });
    } else {
        const current = existing.find((plan) => plan.date === dateValue);
        if (current) {
            const mergedItems = current.items.concat(items);
            next = next.filter((plan) => plan.date !== dateValue);
            const createdAt = editPlan?.createdAt || current.createdAt || Date.now();
            next.push({ date: dateValue, items: mergedItems, createdAt });
        } else {
            const createdAt = editPlan?.createdAt || Date.now();
            next.push({ date: dateValue, items, createdAt });
        }
    }

    localStorage.setItem(storageKey, JSON.stringify(next));
    localStorage.removeItem(editKey);

    window.location.href = "index.html";
});

prefillForEdit();
