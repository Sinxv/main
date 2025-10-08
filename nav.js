document.addEventListener("DOMContentLoaded", () => {
    // Overlay for mobile menu
    const overlay = document.createElement("div");
    overlay.id = "nav-overlay";
    document.body.appendChild(overlay);

    // Desktop nav
    const navDesktop = document.createElement("nav");
    navDesktop.id = "main-nav-desktop";
    navDesktop.innerHTML = `
      <ul>
        <a href="../index.html"><li>Home</li></a>
        <a href="../prog.html"><li id="spec">Game Progression</li></a>
        <a href="../guides.html"><li>Guides</li></a>
        <a href="../chara.html"><li>Characters</li></a>
        <div class="settings-icon" id="settings-icon-desktop"></div>
      </ul>
    `;
    document.body.prepend(navDesktop);

    // Mobile nav (hamburger)
    const navMobile = document.createElement("nav");
    navMobile.id = "main-nav-mobile";
    navMobile.innerHTML = `
  <div class="menu-bar">
    <div class="menu-icon" id="menu-icon"></div>
    <div class="settings-icon" id="settings-icon-mobile"></div>
  </div>
  <div class="hamburger-nav" id="hamburger-nav">
    <a href="../index.html"><li>Home</li></a>
    <a href="../prog.html"><li id="spec">Game Progression</li></a>
    <a href="../guides.html"><li>Guides</li></a>
    <a href="../chara.html"><li>Characters</li></a>
  </div>
`;
    document.body.prepend(navMobile);

    // Settings icon positions
    document.getElementById("settings-icon-desktop").style.position = "absolute";
    document.getElementById("settings-icon-desktop").style.right = "25px";
    document.getElementById("settings-icon-desktop").style.top = "14px";
    document.getElementById("settings-icon-desktop").style.zIndex = "101";

    document.getElementById("settings-icon-mobile").style.position = "fixed";
    document.getElementById("settings-icon-mobile").style.right = "25px";
    document.getElementById("settings-icon-mobile").style.top = "22px";
    document.getElementById("settings-icon-mobile").style.zIndex = "1002";

    // Hamburger menu logic
    const menuIcon = document.getElementById("menu-icon");
    const hamburgerNav = document.getElementById("hamburger-nav");
    menuIcon.addEventListener("click", () => {
        if (hamburgerNav.classList.contains("open")) {
            hamburgerNav.classList.remove("open");
            overlay.classList.remove("open");
            document.body.style.overflow = "";
        } else {
            hamburgerNav.classList.add("open");
            overlay.classList.add("open");
            document.body.style.overflow = "hidden";
            Array.from(hamburgerNav.children).forEach((el, i) => {
                el.style.setProperty('--delay', `${0.1 + i * 0.08}s`);
            });
        }
    });
    overlay.addEventListener("click", () => {
        hamburgerNav.classList.remove("open");
        overlay.classList.remove("open");
        document.body.style.overflow = "";
    });

    // Show/hide navs depending on screen size
    function handleNavVisibility() {
        if (window.innerWidth <= 900) {
            navDesktop.style.display = "none";
            navMobile.style.display = "block";
        } else {
            navDesktop.style.display = "block";
            navMobile.style.display = "none";
            hamburgerNav.classList.remove("open");
            overlay.classList.remove("open");
            document.body.style.overflow = "";
        }
    }
    window.addEventListener("resize", handleNavVisibility);
    handleNavVisibility();

    // Settings popup logic (shared for both icons)
    function updateGearIcon() {
        const isLight = localStorage.getItem("elhelper-mode") === "light";
        document.getElementById("settings-icon-desktop").style.backgroundImage = `url('../images/gear-${isLight ? 'black' : 'white'}.png')`;
        document.getElementById("settings-icon-mobile").style.backgroundImage = `url('../images/gear-${isLight ? 'black' : 'white'}.png')`;
    }
    function updateMenuIcon() {
        const isLight = localStorage.getItem("elhelper-mode") === "light";
        menuIcon.style.backgroundImage = `url('../images/menu-${isLight ? 'black' : 'white'}.png')`;
        menuIcon.style.width = "40px";
        menuIcon.style.height = "40px";
        menuIcon.style.backgroundSize = "contain";
        menuIcon.style.backgroundRepeat = "no-repeat";
    }
    updateMenuIcon();
    updateGearIcon();

    window.addEventListener("storage", (e) => {
        if (e.key === "elhelper-mode") {
            updateMenuIcon();
            updateGearIcon();
        }
    });
    document.getElementById("mode-switch")?.addEventListener("change", () => {
        updateMenuIcon();
        updateGearIcon();
    });

    // Settings popup code
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

        // Set current values
        const savedLang = localStorage.getItem("elhelper-lang") || "en";
        const isLight = localStorage.getItem("elhelper-mode") === "light";
        document.getElementById("lang-select").value = savedLang;
        document.getElementById("mode-switch").checked = isLight;

        document.getElementById("lang-select").addEventListener("change", (e) => {
            const lang = e.target.value;
            if (window.translationManager) {
                window.translationManager.switchLanguage(lang);
            }
        });

        document.getElementById("mode-switch").addEventListener("change", (e) => {
            const isLight = e.target.checked;
            localStorage.setItem("elhelper-mode", isLight ? "light" : "dark");
            if (isLight) {
                document.body.classList.add("light-mode");
                updateMenuIcon();
                updateGearIcon();
            } else {
                document.body.classList.remove("light-mode");
                updateMenuIcon();
                updateGearIcon();
            }
        });
    }
    document.getElementById("settings-icon-desktop").addEventListener("click", toggleSettingsPopup);
    document.getElementById("settings-icon-mobile").addEventListener("click", toggleSettingsPopup);

    document.addEventListener("click", (e) => {
        const popup = document.getElementById("settings-popup");
        if (popup && !popup.contains(e.target) &&
            !document.getElementById("settings-icon-desktop").contains(e.target) &&
            !document.getElementById("settings-icon-mobile").contains(e.target)) {
            popup.remove();
        }
    });
});
