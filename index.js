const plansRoot = document.getElementById("plans");
const summaryRoot = document.getElementById("summary-badges");
const storageKey = "dailyPlans";
const legacyStorageKey = "studyPlans";

function formatPlanDate(dateValue) {
    const date = new Date(`${dateValue}T00:00:00`);
    if (Number.isNaN(date.getTime())) return dateValue;
    const day = date.toLocaleDateString("en-GB", { weekday: "long" }).toUpperCase();
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();
    return `${day} ${dd}-${mm}-${yyyy}`;
}

function getTodayDateKey() {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

function getPlanDateState(dateValue) {
    const today = getTodayDateKey();
    if (dateValue === today) return "today";
    return dateValue < today ? "past" : "future";
}

function isPlanCheckableToday(dateValue) {
    return getPlanDateState(dateValue) === "today";
}

function getPlanStateHint(dateValue) {
    const state = getPlanDateState(dateValue);
    if (state === "today") return "Check-Off Active";
    if (state === "future") return "Unlocks On Plan Date";
    return "Locked (Past Date)";
}

function getPlanStateSubHint(dateValue) {
    const state = getPlanDateState(dateValue);
    if (state === "today") return "You can check tasks for this plan today.";
    if (state === "future") return "You can check tasks when this date arrives.";
    return "This plan date has passed, so checkboxes are now locked.";
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

function formatItemTime(timeValue) {
    return timeValue || "";
}

function renderSummaryBadges(plans) {
    if (!summaryRoot) return;

    const totalTasks = plans.reduce((sum, plan) => {
        const items = Array.isArray(plan.items) ? plan.items : [];
        return sum + items.length;
    }, 0);

    const totalCompletedTasks = plans.reduce((sum, plan) => {
        const items = Array.isArray(plan.items) ? plan.items : [];
        return sum + items.filter(item => Boolean(item?.done)).length;
    }, 0);

    const totalDaysCompleted = plans.reduce((sum, plan) => {
        const items = Array.isArray(plan.items) ? plan.items : [];
        if (items.length === 0) return sum;
        const isDayComplete = items.every(item => Boolean(item?.done));
        return sum + (isDayComplete ? 1 : 0);
    }, 0);

    summaryRoot.innerHTML = `
        <span class="badge"><span class="badge-icon" aria-hidden="true">&#128203;</span>Total Tasks: ${totalTasks}</span>
        <span class="badge"><span class="badge-icon" aria-hidden="true">&#9989;</span>Tasks Completed: ${totalCompletedTasks}</span>
        <span class="badge"><span class="badge-icon" aria-hidden="true">&#127942;</span>Days Completed: ${totalDaysCompleted}</span>
    `;
}

function renderPlans() {
    if (!plansRoot) return;
    const plans = loadPlans().sort((a, b) => {
        const createdDiff = (b.createdAt || 0) - (a.createdAt || 0);
        if (createdDiff !== 0) return createdDiff;
        return b.date.localeCompare(a.date);
    });
    renderSummaryBadges(plans);
    plansRoot.innerHTML = "";
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

        const headingWrap = document.createElement("div");
        headingWrap.className = "plan-heading";

        const heading = document.createElement("h3");
        heading.textContent = formatPlanDate(plan.date);
        headingWrap.appendChild(heading);

        const status = document.createElement("span");
        const planDateState = getPlanDateState(plan.date);
        status.className = `plan-status-badge plan-status-badge--${planDateState}`;
        status.textContent = getPlanStateHint(plan.date);
        headingWrap.appendChild(status);

        header.appendChild(headingWrap);

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
        let doneCount = 0;

        const canCheckToday = isPlanCheckableToday(plan.date);

        plan.items.forEach((item, idx) => {
            const row = document.createElement("label");
            row.className = "plan-item";

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.checked = Boolean(item.done);
            checkbox.dataset.index = String(idx);
            checkbox.disabled = !canCheckToday;

            if (item.done) {
                doneCount += 1;
            } else {
                allDone = false;
            }

            const details = document.createElement("div");
            details.className = "plan-item-copy";

            if (item.time) {
                const time = document.createElement("span");
                time.className = "plan-item-time";
                time.textContent = formatItemTime(item.time);
                details.appendChild(time);
            }

            const text = document.createElement("span");
            text.textContent = item.text || [item.subject, item.topic].filter(Boolean).join(" - ");
            details.appendChild(text);

            row.appendChild(checkbox);
            row.appendChild(details);
            card.appendChild(row);
        });

        const dateHint = document.createElement("p");
        dateHint.className = "plan-check-hint";
        dateHint.textContent = getPlanStateSubHint(plan.date);
        card.appendChild(dateHint);

        const progress = plan.items.length ? (doneCount / plan.items.length) * 100 : 0;
        card.style.setProperty("--plan-progress", `${progress}%`);

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
    if (!isPlanCheckableToday(date)) {
        checkbox.checked = !checkbox.checked;
        alert("You can mark plans complete only on their exact plan date.");
        return;
    }

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
