document.addEventListener("DOMContentLoaded", () => {
    const nav = document.createElement("nav");
    nav.innerHTML = `
      <ul>
        <img class="nav-toggle" src="../images/menu-bar-2.png" height="32px" alt="Menu">
        <a href="../index.html"><li>Home</li></a>
        <a href="../prog.html"><li id="spec">Game Progression</li></a>
        <a href="../guides.html"><li>Guides</li></a>
        <a href="../chara.html"><li>Characters</li></a>
        <div class="settings-icon" id="settings-icon"></div>
      </ul>
    `;
    document.body.prepend(nav);

    // Saved mode
    const savedMode = localStorage.getItem("elhelper-mode");
    if (savedMode === "light") enableLightMode();

    // Settings gear functionality
    updateGearIcon();
    document.getElementById("settings-icon").addEventListener("click", toggleSettingsPopup);

    // Close popup when clicking outside
    document.addEventListener("click", (e) => {
        const popup = document.getElementById("settings-popup");
        const gear = document.getElementById("settings-icon");
        if (popup && !popup.contains(e.target) && !gear.contains(e.target)) {
            popup.remove();
        }
    });
});

function toggleSettingsPopup() {
    const existing = document.getElementById("settings-popup");
    if (existing) return existing.remove();

    const popup = document.createElement("div");
    popup.id = "settings-popup";
    popup.innerHTML = `
        <label for="lang-select">Language:</label>
        <select id="lang-select">
            <option value="en">English</option>
            <option value="es">Español</option>
            <option value="kr">한국어</option>
            <option value="jp">日本語</option>
            <option value="br">Português</option>
        </select>
        <label for="mode-switch">Light Mode:</label>
        <label class="switch">
            <input type="checkbox" id="mode-switch">
            <span class="slider"></span>
        </label>
    `;
    document.body.appendChild(popup);

    const gear = document.getElementById("settings-icon");
    const rect = gear.getBoundingClientRect();
    popup.style.top = `${rect.bottom + 10}px`;
    popup.style.right = "10px";

    // Set current values
    const savedLang = localStorage.getItem("elhelper-lang") || "en";
    const isLight = localStorage.getItem("elhelper-mode") === "light";
    document.getElementById("lang-select").value = savedLang;
    document.getElementById("mode-switch").checked = isLight;

    // Language change handler
    document.getElementById("lang-select").addEventListener("change", (e) => {
        const lang = e.target.value;
        
        // Use the translation manager if available
        if (window.translationManager) {
            window.translationManager.switchLanguage(lang);
        }
    });

    // Theme toggle handler
    document.getElementById("mode-switch").addEventListener("change", (e) => {
        const isLight = e.target.checked;
        localStorage.setItem("elhelper-mode", isLight ? "light" : "dark");
        if (isLight) {
            enableLightMode();
        } else {
            document.body.classList.remove("light-mode");
        }
        updateGearIcon();
    });
}

function enableLightMode() {
    document.body.classList.add("light-mode");
}

function updateGearIcon() {
    const gear = document.getElementById("settings-icon");
    const isLight = localStorage.getItem("elhelper-mode") === "light";
    gear.style.backgroundImage = `url('../images/gear-${isLight ? 'black' : 'white'}.png')`;
}