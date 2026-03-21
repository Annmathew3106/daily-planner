const rangeSelect = document.getElementById("range");
const chartRoot = document.getElementById("chart");
const weekLegend = document.getElementById("week-legend");
const chartRow = document.querySelector(".chart-row");
const storageKey = "dailyPlans";
const legacyStorageKey = "studyPlans";

function loadPlans() {
    if (!localStorage.getItem(storageKey) && localStorage.getItem(legacyStorageKey)) {
        localStorage.setItem(storageKey, localStorage.getItem(legacyStorageKey));
    }
    return JSON.parse(localStorage.getItem(storageKey) || "[]");
}

function parseDate(value) {
    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
}

function addDays(date, amount) {
    const next = new Date(date);
    next.setDate(next.getDate() + amount);
    return next;
}

function addMonths(date, amount) {
    return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function dateKey(date) {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

function formatDay(date) {
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    return `${dd}/${mm}`;
}

function formatMonth(date) {
    return date.toLocaleDateString("en-GB", { month: "short" });
}

function getWeekKey(date) {
    const temp = new Date(date);
    temp.setHours(0, 0, 0, 0);
    const day = temp.getDay() || 7;
    temp.setDate(temp.getDate() + 4 - day);
    const yearStart = new Date(temp.getFullYear(), 0, 1);
    const weekNo = Math.ceil((((temp - yearStart) / 86400000) + 1) / 7);
    return `${temp.getFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

function weekKeyToStart(weekKey) {
    const [yearPart, weekPart] = weekKey.split("-W");
    const weekNo = Number(weekPart);
    const year = Number(yearPart);
    const jan4 = new Date(year, 0, 4);
    const jan4Day = jan4.getDay() || 7;
    const weekStart = new Date(jan4);
    weekStart.setDate(jan4.getDate() - (jan4Day - 1) + (weekNo - 1) * 7);
    weekStart.setHours(0, 0, 0, 0);
    return weekStart;
}

function buildRows(mode, plans) {
    const today = new Date();
    if (mode === "today") {
        const key = dateKey(today);
        const row = { key, label: "Today", done: 0, total: 0 };
        plans.forEach((plan) => {
            if (plan.date !== key) return;
            (plan.items || []).forEach((item) => {
                row.total += 1;
                if (item.done) row.done += 1;
            });
        });
        return [row];
    }

    if (mode === "daily") {
        const rows = [];
        for (let i = -13; i <= 14; i += 1) {
            const date = addDays(today, i);
            rows.push({ key: dateKey(date), label: formatDay(date), done: 0, total: 0 });
        }
        plans.forEach((plan) => {
            const row = rows.find((entry) => entry.key === plan.date);
            if (!row) return;
            (plan.items || []).forEach((item) => {
                row.total += 1;
                if (item.done) row.done += 1;
            });
        });
        return rows;
    }

    if (mode === "weekly") {
        const rows = [];
        for (let i = -5; i <= 0; i += 1) {
            const date = addDays(today, i * 7);
            const key = getWeekKey(date);
            const start = weekKeyToStart(key);
            const end = addDays(start, 6);
            rows.push({ key, label: `W${key.slice(-2)}`, fullLabel: `${formatDay(start)}-${formatDay(end)}`, done: 0, total: 0 });
        }
        plans.forEach((plan) => {
            const date = parseDate(plan.date);
            if (!date) return;
            const row = rows.find((entry) => entry.key === getWeekKey(date));
            if (!row) return;
            (plan.items || []).forEach((item) => {
                row.total += 1;
                if (item.done) row.done += 1;
            });
        });
        return rows;
    }

    const rows = [];
    for (let i = -6; i <= 5; i += 1) {
        const date = addMonths(today, i);
        rows.push({
            key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
            label: formatMonth(date),
            done: 0,
            total: 0,
        });
    }
    plans.forEach((plan) => {
        const date = parseDate(plan.date);
        if (!date) return;
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        const row = rows.find((entry) => entry.key === key);
        if (!row) return;
        (plan.items || []).forEach((item) => {
            row.total += 1;
            if (item.done) row.done += 1;
        });
    });
    return rows;
}

function renderLineChart(target, data, mode) {
    target.innerHTML = "";
    if (!data.length) return;

    const perPoint = mode === "daily" ? 110 : mode === "monthly" ? 90 : 96;
    const width = Math.max(720, data.length * perPoint);
    const height = 260;
    const padding = 36;
    const points = data.map((row, index) => {
        const x = padding + (index * (width - padding * 2)) / (data.length - 1 || 1);
        const ratio = row.total ? row.done / row.total : 0;
        const y = height - padding - ratio * (height - padding * 2);
        return { ...row, x, y };
    });

    let path = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
    let areaPath = `${path} L${points[points.length - 1].x},${height - padding} L${points[0].x},${height - padding} Z`;

    if (mode === "today" && points.length === 1) {
        const startX = padding + 18;
        const endX = width - padding;
        const dotX = startX + 18;
        const point = points[0];

        points[0] = { ...point, x: dotX };
        path = `M${dotX},${point.y} L${endX},${point.y}`;
        areaPath = `M${dotX},${height - padding} L${dotX},${point.y} L${endX},${point.y} L${endX},${height - padding} Z`;
    }

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.style.width = `${width}px`;
    svg.style.maxWidth = "none";

    for (let i = 0; i <= 4; i += 1) {
        const y = padding + (i * (height - padding * 2)) / 4;
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", padding);
        line.setAttribute("x2", width - padding);
        line.setAttribute("y1", y);
        line.setAttribute("y2", y);
        line.setAttribute("class", "line-grid");
        svg.appendChild(line);

        const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
        label.setAttribute("x", 10);
        label.setAttribute("y", y + 4);
        label.setAttribute("class", "line-axis");
        label.textContent = `${100 - i * 25}%`;
        svg.appendChild(label);
    }

    const area = document.createElementNS("http://www.w3.org/2000/svg", "path");
    area.setAttribute("d", areaPath);
    area.setAttribute("class", "line-area");
    svg.appendChild(area);

    const line = document.createElementNS("http://www.w3.org/2000/svg", "path");
    line.setAttribute("d", path);
    line.setAttribute("class", "line-path");
    svg.appendChild(line);

    points.forEach((point) => {
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", point.x);
        circle.setAttribute("cy", point.y);
        circle.setAttribute("r", 4);
        circle.setAttribute("class", "line-point");
        svg.appendChild(circle);

        const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
        label.setAttribute("x", point.x);
        label.setAttribute("y", height - 8);
        label.setAttribute("text-anchor", "middle");
        label.setAttribute("class", "line-label");
        if (mode === "daily") {
            label.setAttribute("transform", `rotate(-38 ${point.x} ${height - 8})`);
        }
        label.textContent = point.label;
        svg.appendChild(label);
    });

    target.setAttribute("data-mode", mode);
    target.appendChild(svg);
}

function renderWeekLegend(rows) {
    weekLegend.innerHTML = "";
    rows.forEach((row) => {
        const item = document.createElement("div");
        item.className = "week-legend-item";
        item.textContent = row.label;
        const sub = document.createElement("span");
        sub.textContent = row.fullLabel || "";
        item.appendChild(sub);
        weekLegend.appendChild(item);
    });
}

function updateChart() {
    const mode = rangeSelect.value;
    const rows = buildRows(mode, loadPlans());
    renderLineChart(chartRoot, rows, mode);

    if (mode === "weekly") {
        chartRow.classList.add("has-legend");
        weekLegend.hidden = false;
        renderWeekLegend(rows);
    } else {
        chartRow.classList.remove("has-legend");
        weekLegend.hidden = true;
        weekLegend.innerHTML = "";
    }
}

rangeSelect?.addEventListener("change", updateChart);
updateChart();
