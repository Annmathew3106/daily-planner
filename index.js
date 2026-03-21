const plansRoot = document.getElementById("plans");
const storageKey = "dailyPlans";
const legacyStorageKey = "studyPlans";

function getTodayKey() {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

function formatPlanDate(dateValue) {
    const date = new Date(`${dateValue}T00:00:00`);
    if (Number.isNaN(date.getTime())) return dateValue;
    const day = date.toLocaleDateString("en-GB", { weekday: "long" }).toUpperCase();
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();
    return `${day} ${dd}-${mm}-${yyyy}`;
}

function loadPlans() {
    if (!localStorage.getItem(storageKey) && localStorage.getItem(legacyStorageKey)) {
        localStorage.setItem(storageKey, localStorage.getItem(legacyStorageKey));
    }
    return JSON.parse(localStorage.getItem(storageKey) || "[]");
}

function savePlans(plans) {
    localStorage.setItem(storageKey, JSON.stringify(plans));
}

function renderPlans() {
    if (!plansRoot) return;
    const plans = loadPlans().sort((a, b) => {
        const createdDiff = (b.createdAt || 0) - (a.createdAt || 0);
        if (createdDiff !== 0) return createdDiff;
        return b.date.localeCompare(a.date);
    });
    plansRoot.innerHTML = "";
    const todayKey = getTodayKey();

    if (plans.length === 0) {
        const empty = document.createElement("p");
        empty.className = "empty-state";
        empty.textContent = "No plans yet. Click CREATE to add one.";
        plansRoot.appendChild(empty);
        return;
    }

    for (const plan of plans) {
        const card = document.createElement("div");
        card.className = "plan";
        card.dataset.date = plan.date;

        const header = document.createElement("div");
        header.className = "plan-header";

        const heading = document.createElement("h3");
        heading.textContent = formatPlanDate(plan.date);
        header.appendChild(heading);

        const actions = document.createElement("div");
        actions.className = "plan-actions";

        const editBtn = document.createElement("button");
        editBtn.type = "button";
        editBtn.className = "plan-edit";
        editBtn.textContent = "Edit";
        actions.appendChild(editBtn);

        const deleteBtn = document.createElement("button");
        deleteBtn.type = "button";
        deleteBtn.className = "plan-delete";
        deleteBtn.textContent = "Delete";
        actions.appendChild(deleteBtn);

        header.appendChild(actions);
        card.appendChild(header);

        let allDone = plan.items.length > 0;

        const isPast = plan.date < todayKey;

        plan.items.forEach((item, idx) => {
            const row = document.createElement("label");
            row.className = "plan-item";

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.checked = Boolean(item.done);
            checkbox.dataset.index = String(idx);
            checkbox.disabled = isPast;

            if (!item.done) allDone = false;

            const text = document.createElement("span");
            text.textContent = item.text || [item.subject, item.topic].filter(Boolean).join(" - ");

            row.appendChild(checkbox);
            row.appendChild(text);
            card.appendChild(row);
        });

        if (allDone) {
            card.classList.add("complete");
        }

        plansRoot.appendChild(card);
    }
}

plansRoot?.addEventListener("change", (e) => {
    const checkbox = e.target;
    if (!(checkbox instanceof HTMLInputElement)) return;
    if (checkbox.type !== "checkbox") return;

    const card = checkbox.closest(".plan");
    if (!card) return;

    const date = card.dataset.date;
    const index = Number(checkbox.dataset.index);
    if (!date || Number.isNaN(index)) return;

    const plans = loadPlans();
    const plan = plans.find((p) => p.date === date);
    if (!plan || !plan.items[index]) return;

    plan.items[index].done = checkbox.checked;
    savePlans(plans);
    renderPlans();
});

plansRoot?.addEventListener("click", (e) => {
    const button = e.target;
    if (!(button instanceof HTMLElement)) return;

    const card = button.closest(".plan");
    if (!card) return;
    const date = card.dataset.date;
    if (!date) return;

    if (button.classList.contains("plan-edit")) {
        localStorage.setItem("editPlanDate", date);
        window.location.href = "create.html";
        return;
    }

    if (button.classList.contains("plan-delete")) {
        const confirmed = window.confirm("Delete this plan? This action cannot be undone.");
        if (!confirmed) return;
        const plans = loadPlans().filter((plan) => plan.date !== date);
        savePlans(plans);
        renderPlans();
    }
});

renderPlans();
