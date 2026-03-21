const coinCountEl = document.getElementById("coin-count");
const levelValueEl = document.getElementById("level-value");
const storageKey = "dailyPlans";
const legacyStorageKey = "studyPlans";

function loadPlans() {
    if (!localStorage.getItem(storageKey) && localStorage.getItem(legacyStorageKey)) {
        localStorage.setItem(storageKey, localStorage.getItem(legacyStorageKey));
    }
    return JSON.parse(localStorage.getItem(storageKey) || "[]");
}

function calculateCoins(plans) {
    let completedDays = 0;
    plans.forEach((plan) => {
        const hasItems = Array.isArray(plan.items) && plan.items.length > 0;
        const allDone = hasItems && plan.items.every((item) => item.done);
        if (allDone) completedDays += 1;
    });
    return completedDays * 100;
}

function renderRewards() {
    const plans = loadPlans();
    const coins = calculateCoins(plans);
    const level = Math.floor(coins / 500);

    if (coinCountEl) coinCountEl.textContent = String(coins);
    if (levelValueEl) levelValueEl.textContent = String(level);
}

renderRewards();
