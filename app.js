const appShell = document.querySelector("#app-shell");
const sidebar = document.querySelector("#sidebar");
const sidebarToggle = document.querySelector("#sidebar-toggle");
const collapseToggle = document.querySelector("#sidebar-collapse");
const breadcrumb = document.querySelector("#current-breadcrumb");
const searchInput = document.querySelector("#server-search");
const statusFilter = document.querySelector("#status-filter");
const serverRows = [...document.querySelectorAll("#server-table-body tr")];
const previousPageButton = document.querySelector("#previous-page");
const nextPageButton = document.querySelector("#next-page");
const settingsDrawer = document.querySelector("#settings-drawer");
const settingsForm = document.querySelector("#settings-form");
const saveSettingsButton = document.querySelector("#save-settings");
const confirmDialog = document.querySelector("#confirm-dialog");
const confirmRestartButton = document.querySelector("#confirm-restart");
const cancelRestartButton = document.querySelector("[data-cancel-confirm]");
const toastRegion = document.querySelector("#toast-region");
const themeToggle = document.querySelector("#theme-toggle");
const themeIcon = document.querySelector("#theme-icon");

const routeNames = {
    overview: "Resumen",
    servers: "Servidores",
    metrics: "Métricas",
    activity: "Actividad y alertas",
};

let currentPage = 1;
let pendingRestart = "";
let drawerReturnFocus = null;
let toastTimeout;
let savedSettings = {
    name: "payments-api",
    region: "us-west-2",
    maintenanceDate: "",
    notes: "",
    autoscaling: true,
};

const normalize = (value) => value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

function navigateTo(route, updateHistory = true) {
    const selectedRoute = Object.hasOwn(routeNames, route) ? route : "overview";

    for (const view of document.querySelectorAll("[data-view]")) {
        view.hidden = view.dataset.view !== selectedRoute;
    }

    for (const link of document.querySelectorAll(".nav-link[data-route]")) {
        if (link.dataset.route === selectedRoute) {
            link.setAttribute("aria-current", "page");
        } else {
            link.removeAttribute("aria-current");
        }
    }

    breadcrumb.textContent = routeNames[selectedRoute];
    document.title = `${routeNames[selectedRoute]} | Krypton`;

    if (updateHistory && window.location.hash !== `#${selectedRoute}`) {
        window.history.pushState(null, "", `#${selectedRoute}`);
    }

    closeMobileSidebar();
}

function closeMobileSidebar() {
    appShell.classList.remove("sidebar-open");
    sidebarToggle.setAttribute("aria-expanded", "false");
    sidebarToggle.setAttribute("aria-label", "Abrir navegación");
}

function updateServerTable() {
    const query = normalize(searchInput.value);
    const selectedStatus = statusFilter.value;
    const filteredRows = serverRows.filter((row) => {
        const matchesText = normalize(row.textContent).includes(query);
        const matchesStatus = selectedStatus === "all" || row.dataset.status === selectedStatus;
        return matchesText && matchesStatus;
    });
    const pageCount = Math.max(1, Math.ceil(filteredRows.length / 4));

    currentPage = Math.min(currentPage, pageCount);
    serverRows.forEach((row) => { row.hidden = true; });

    const firstItem = (currentPage - 1) * 4;
    const visibleRows = filteredRows.slice(firstItem, firstItem + 4);
    visibleRows.forEach((row) => { row.hidden = false; });

    document.querySelector("#server-result-count").textContent = filteredRows.length;
    document.querySelector("#table-empty").hidden = filteredRows.length > 0;
    document.querySelector("#page-indicator").textContent = filteredRows.length
        ? `Mostrando ${firstItem + 1}–${firstItem + visibleRows.length} de ${filteredRows.length}`
        : "Mostrando 0 instancias";

    previousPageButton.disabled = currentPage <= 1;
    nextPageButton.disabled = currentPage >= pageCount;
}

function showToast(message, kind = "success") {
    const toast = document.createElement("div");
    toast.className = kind === "error" ? "toast toast-error" : "toast";
    toast.textContent = message;
    toastRegion.replaceChildren(toast);
    window.clearTimeout(toastTimeout);
    toastTimeout = window.setTimeout(() => toast.remove(), 3400);
}

function openSettings(serverId = "") {
    drawerReturnFocus = document.activeElement;
    const nameInput = document.querySelector("#service-name");
    const drawerTitle = document.querySelector("#drawer-title");
    const drawerDescription = document.querySelector("#drawer-description");

    settingsForm.reset();
    document.querySelector("#notes-count").textContent = "0";
    nameInput.value = serverId || savedSettings.name;
    document.querySelector("#service-region").value = savedSettings.region;
    document.querySelector("#maintenance-date").value = savedSettings.maintenanceDate;
    document.querySelector("#service-notes").value = savedSettings.notes;
    document.querySelector("#autoscaling").checked = savedSettings.autoscaling;
    document.querySelector("#notes-count").textContent = savedSettings.notes.length;
    drawerTitle.textContent = serverId ? `Configurar ${serverId}` : "Configurar servicio";
    drawerDescription.textContent = serverId
        ? "Ajusta los parámetros de esta instancia."
        : "Ajusta los parámetros de tu instancia.";
    settingsForm.dataset.dirty = "false";
    saveSettingsButton.disabled = true;
    settingsDrawer.showModal();
    window.setTimeout(() => nameInput.focus(), 0);
}

function closeSettings() {
    if (saveSettingsButton.getAttribute("aria-busy") === "true") return;
    if (!settingsDrawer.open) return;

    settingsDrawer.close();
}

function setServerStatus(serverId, status, label) {
    const row = serverRows.find((candidate) => candidate.dataset.serverId === serverId);
    if (!row) return;

    row.dataset.status = status;
    const statusPill = row.querySelector(".status-pill");
    statusPill.className = `status-pill status-${status}`;
    statusPill.replaceChildren(document.createElement("i"), document.createTextNode(label));
    updateServerTable();
}

function openRestartConfirmation(serverId) {
    pendingRestart = serverId;
    document.querySelector("#confirm-target").textContent = serverId;
    confirmRestartButton.disabled = false;
    cancelRestartButton.disabled = false;
    confirmRestartButton.removeAttribute("aria-busy");
    confirmRestartButton.querySelector("[data-button-label]").textContent = "Reiniciar instancia";
    confirmDialog.showModal();
}

function syncThemeControl() {
    const explicitlyDark = document.documentElement.dataset.theme === "dark";
    const followsSystem = !document.documentElement.dataset.theme
        && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = explicitlyDark || followsSystem;

    themeIcon.textContent = isDark ? "☀" : "☾";
    themeToggle.setAttribute("aria-pressed", String(isDark));
    themeToggle.setAttribute("aria-label", isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro");
}

document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const routeLink = target.closest("[data-route]");
    if (routeLink) {
        event.preventDefault();
        navigateTo(routeLink.dataset.route);
        return;
    }

    const routeButton = target.closest("[data-go-to]");
    if (routeButton) {
        navigateTo(routeButton.dataset.goTo);
        return;
    }

    if (target.closest("[data-open-settings]")) {
        openSettings();
        return;
    }

    const closeDrawerButton = target.closest("[data-close-drawer]");
    if (closeDrawerButton) {
        closeSettings();
        return;
    }

    const configureButton = target.closest('[data-action="configure"]');
    if (configureButton) {
        openSettings(configureButton.dataset.server);
        return;
    }

    const restartButton = target.closest('[data-action="restart"]');
    if (restartButton) {
        openRestartConfirmation(restartButton.dataset.server);
        return;
    }

    if (target.closest("[data-cancel-confirm]")) {
        if (confirmRestartButton.getAttribute("aria-busy") !== "true") {
            confirmDialog.close();
            pendingRestart = "";
        }
        return;
    }

    if (target.closest("[data-close-sidebar]")) {
        closeMobileSidebar();
    }
});

document.querySelectorAll("[data-route]").forEach((link) => {
    link.addEventListener("click", () => {
        if (link.dataset.route === "servers") currentPage = 1;
    });
});

sidebarToggle.addEventListener("click", () => {
    const isOpen = appShell.classList.toggle("sidebar-open");
    sidebarToggle.setAttribute("aria-expanded", String(isOpen));
    sidebarToggle.setAttribute("aria-label", isOpen ? "Cerrar navegación" : "Abrir navegación");
});

collapseToggle.addEventListener("click", () => {
    const isCollapsed = appShell.classList.toggle("is-collapsed");
    collapseToggle.setAttribute("aria-expanded", String(!isCollapsed));
    collapseToggle.setAttribute("aria-label", isCollapsed ? "Expandir navegación" : "Contraer navegación");
});

searchInput.addEventListener("input", () => {
    currentPage = 1;
    updateServerTable();
    if (searchInput.value.trim()) navigateTo("servers");
});

statusFilter.addEventListener("change", () => {
    currentPage = 1;
    updateServerTable();
});

previousPageButton.addEventListener("click", () => {
    if (currentPage <= 1) return;
    currentPage -= 1;
    updateServerTable();
});

nextPageButton.addEventListener("click", () => {
    currentPage += 1;
    updateServerTable();
});

settingsDrawer.addEventListener("click", (event) => {
    if (event.target === settingsDrawer) closeSettings();
});

settingsDrawer.addEventListener("cancel", (event) => {
    if (saveSettingsButton.getAttribute("aria-busy") === "true") event.preventDefault();
});

settingsDrawer.addEventListener("close", () => {
    if (drawerReturnFocus instanceof HTMLElement) drawerReturnFocus.focus();
    drawerReturnFocus = null;
});

settingsForm.addEventListener("input", () => {
    settingsForm.dataset.dirty = "true";
    saveSettingsButton.disabled = false;

    const notes = document.querySelector("#service-notes");
    document.querySelector("#notes-count").textContent = notes.value.length;
});

settingsForm.addEventListener("change", () => {
    settingsForm.dataset.dirty = "true";
    saveSettingsButton.disabled = false;
});

settingsForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!settingsForm.reportValidity()) return;

    const label = saveSettingsButton.querySelector("[data-button-label]");
    const loadingMessage = document.querySelector("#settings-loading");
    const formControls = [...settingsForm.querySelectorAll("input, select, textarea")];
    saveSettingsButton.disabled = true;
    saveSettingsButton.setAttribute("aria-busy", "true");
    settingsForm.setAttribute("aria-busy", "true");
    settingsForm.classList.add("is-loading");
    loadingMessage.hidden = false;
    formControls.forEach((control) => { control.disabled = true; });
    label.textContent = "Guardando...";

    window.setTimeout(() => {
        saveSettingsButton.removeAttribute("aria-busy");
        label.textContent = "Guardar cambios";
        settingsForm.removeAttribute("aria-busy");
        settingsForm.classList.remove("is-loading");
        loadingMessage.hidden = true;
        formControls.forEach((control) => { control.disabled = false; });
        savedSettings = {
            name: document.querySelector("#service-name").value,
            region: document.querySelector("#service-region").value,
            maintenanceDate: document.querySelector("#maintenance-date").value,
            notes: document.querySelector("#service-notes").value,
            autoscaling: document.querySelector("#autoscaling").checked,
        };
        settingsForm.dataset.dirty = "false";
        closeSettings();
        showToast(`La configuración de ${savedSettings.name} se guardó correctamente.`);
    }, 850);
});

confirmRestartButton.addEventListener("click", () => {
    if (!pendingRestart || confirmRestartButton.disabled) return;

    const serverId = pendingRestart;
    const label = confirmRestartButton.querySelector("[data-button-label]");
    confirmRestartButton.disabled = true;
    cancelRestartButton.disabled = true;
    confirmRestartButton.setAttribute("aria-busy", "true");
    label.textContent = "Reiniciando...";
    setServerStatus(serverId, "restarting", "Reiniciando");

    window.setTimeout(() => {
        confirmDialog.close();
        confirmRestartButton.disabled = false;
        cancelRestartButton.disabled = false;
        confirmRestartButton.removeAttribute("aria-busy");
        label.textContent = "Reiniciar instancia";
        setServerStatus(serverId, "online", "En línea");
        showToast(`Se completó el reinicio de ${serverId}.`);
        pendingRestart = "";
    }, 1100);
});

confirmDialog.addEventListener("click", (event) => {
    if (event.target === confirmDialog && confirmRestartButton.getAttribute("aria-busy") !== "true") {
        confirmDialog.close();
        pendingRestart = "";
    }
});

confirmDialog.addEventListener("cancel", (event) => {
    if (confirmRestartButton.getAttribute("aria-busy") === "true") {
        event.preventDefault();
        return;
    }
    pendingRestart = "";
});

document.querySelector("#theme-toggle").addEventListener("click", () => {
    const isCurrentlyDark = themeToggle.getAttribute("aria-pressed") === "true";
    document.documentElement.dataset.theme = isCurrentlyDark ? "light" : "dark";
    syncThemeControl();
});

window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if (!document.documentElement.dataset.theme) syncThemeControl();
});

window.addEventListener("popstate", () => {
    navigateTo(window.location.hash.slice(1), false);
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        if (settingsDrawer.open) {
            if (saveSettingsButton.getAttribute("aria-busy") === "true") {
                event.preventDefault();
                return;
            }
            closeSettings();
            return;
        }
        if (confirmDialog.open) {
            if (confirmRestartButton.getAttribute("aria-busy") === "true") {
                event.preventDefault();
                return;
            }
            confirmDialog.close();
            pendingRestart = "";
            return;
        }
        closeMobileSidebar();
        return;
    }
    if (event.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)) {
        event.preventDefault();
        searchInput.focus();
    }
});

const initialRoute = window.location.hash.slice(1);
navigateTo(initialRoute, false);
updateServerTable();
syncThemeControl();
