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
        <a href="../main/index.html"><li>Home</li></a>
        <a href="../main/prog.html"><li id="spec">Game Progression</li></a>
        <a href="../main/guides.html"><li>Guides</li></a>
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
    </div>
    <div class="hamburger-nav" id="hamburger-nav">
        <div class="settings-icon" id="settings-icon-mobile"></div>
        <a href="../main/index.html"><li>Home</li></a>
        <a href="../main/prog.html"><li id="spec">Game Progression</li></a>
        <a href="../main/guides.html"><li>Guides</li></a>
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
        try {
            console.log('[DEBUG] menuIcon clicked');
            const menuBar = document.querySelector('.menu-bar');
            if (hamburgerNav.classList.contains("open")) {
                console.log('[DEBUG] Closing hamburger menu');
                hamburgerNav.classList.remove("open");
                overlay.classList.remove("open");
                document.body.style.overflow = "";
                menuBar.classList.remove('no-pointer');
            } else {
                console.log('[DEBUG] Opening hamburger menu');
                hamburgerNav.classList.add("open");
                overlay.classList.add("open");
                document.body.style.overflow = "hidden";
                menuBar.classList.add('no-pointer');
                Array.from(hamburgerNav.children).forEach((el, i) => {
                    el.style.setProperty('--delay', `${0.1 + i * 0.08}s`);
                });
            }
        } catch (err) {
            console.error('[ERROR] menuIcon click handler:', err);
        }
    });
    overlay.addEventListener("click", () => {
        try {
            console.log('[DEBUG] overlay clicked, closing hamburger menu');
            hamburgerNav.classList.remove("open");
            overlay.classList.remove("open");
            document.body.style.overflow = "";
            const menuBar = document.querySelector('.menu-bar');
            menuBar.classList.remove('no-pointer');
        } catch (err) {
            console.error('[ERROR] overlay click handler:', err);
        }
    });

    // Show/hide navs depending on screen size
    function handleNavVisibility() {
        try {
            console.log('[DEBUG] handleNavVisibility called, window.innerWidth:', window.innerWidth);
            if (window.innerWidth <= 900) {
                console.log('[DEBUG] Mobile view: showing navMobile, hiding navDesktop');
                navDesktop.style.display = "none";
                navMobile.style.display = "block";
            } else {
                console.log('[DEBUG] Desktop view: showing navDesktop, hiding navMobile');
                navDesktop.style.display = "block";
                navMobile.style.display = "none";
                hamburgerNav.classList.remove("open");
                overlay.classList.remove("open");
                document.body.style.overflow = "";
            }
        } catch (err) {
            console.error('[ERROR] handleNavVisibility:', err);
        }
    }
    window.addEventListener("resize", handleNavVisibility);
    handleNavVisibility();

    // Settings popup logic (shared for both icons)
    function updateGearIcon() {
    const isLight = localStorage.getItem("elhelper-mode") === "light";
    // Settings icon: fondo igual al modo, PNG contrario
    document.getElementById("settings-icon-desktop").style.backgroundImage = `url('../main/images/gear-${isLight ? 'black' : 'white'}.png')`;
    document.getElementById("settings-icon-desktop").style.backgroundColor = isLight ? "#fff" : "#222";
    document.getElementById("settings-icon-mobile").style.backgroundImage = `url('../main/images/gear-${isLight ? 'black' : 'white'}.png')`;
    document.getElementById("settings-icon-mobile").style.backgroundColor = isLight ? "#fff" : "#222";
    }
    function updateMenuIcon() {
    const isLight = localStorage.getItem("elhelper-mode") === "light";
    menuIcon.style.backgroundImage = `url('../main/images/menu-${isLight ? 'black' : 'white'}.png')`;
    menuIcon.style.width = "40px";
    menuIcon.style.height = "40px";
    menuIcon.style.backgroundSize = "contain";
    menuIcon.style.backgroundRepeat = "no-repeat";
    menuIcon.style.backgroundColor = isLight ? "#cccccc" : "#282832";
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

    // --- SETTINGS POPUP PC ---
    function showSettingsPopupPC() {
        // Remove any existing popup
        const existing = document.getElementById("settings-popup");
        if (existing) {
            existing.remove();
            return;
        }
        const desktopIcon = document.getElementById("settings-icon-desktop");
        const popup = document.createElement("div");
        popup.id = "settings-popup";
        popup.innerHTML = `
            <label for="lang-select">Language:</label>
            <select id="lang-select">
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="kr">AI한국어</option>
                <option value="jp">AI日本語 </option>
                <option value="br">Português do IA</option>
            </select>
            <label for="mode-switch">Light Mode:</label>
            <label class="switch">
                <input type="checkbox" id="mode-switch">
                <span class="slider"></span>
            </label>
        `;
        document.body.appendChild(popup);
        // Position popup: move slightly more to the left to avoid scroller
        const rect = desktopIcon.getBoundingClientRect();
        const popupWidth = 200;
        let left = rect.right - popupWidth - 16; // 16px extra to avoid scroller
        let top = rect.bottom + 8;
        // Clamp left to viewport
        if (left < 8) left = 8;
        if (left + popupWidth > window.innerWidth - 24) left = window.innerWidth - popupWidth - 24;
        popup.style.position = "absolute";
        popup.style.left = `${left}px`;
        popup.style.top = `${top}px`;
        // Set current values
        const savedLang = localStorage.getItem("elhelper-lang") || "en";
        const isLight = localStorage.getItem("elhelper-mode") === "light";
        popup.querySelector("#lang-select").value = savedLang;
        popup.querySelector("#mode-switch").checked = isLight;
        popup.querySelector("#lang-select").addEventListener("change", (e) => {
            const lang = e.target.value;
            if (window.translationManager) {
                window.translationManager.switchLanguage(lang);
            }
        });
        popup.querySelector("#mode-switch").addEventListener("change", (e) => {
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

    // --- SETTINGS POPUP MOBILE ---
    function toggleSettingsMenuMobile() {
        try {
            const hamburgerNav = document.getElementById("hamburger-nav");
            let settingsMenu = hamburgerNav.querySelector('.settings-menu');
            console.log('[DEBUG] toggleSettingsMenuMobile called');
            console.log('[DEBUG] hamburgerNav.classList:', hamburgerNav.classList.toString());
            // Si el menú hamburguesa está abierto y no está en settings, animar salida y mostrar settings
            if (hamburgerNav.classList.contains("open") && !hamburgerNav.classList.contains("settings-open")) {
                console.log('[DEBUG] Switching to settings menu');
                hamburgerNav.classList.add("menu-slide-out");
                setTimeout(() => {
                    hamburgerNav.classList.remove("menu-slide-out");
                    hamburgerNav.classList.add("settings-open");
                    if (!settingsMenu) {
                        let menu = document.createElement("div");
                        menu.className = "settings-menu";
                        menu.innerHTML = `
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
                        hamburgerNav.appendChild(menu);
                        // Set current values
                        const savedLang = localStorage.getItem("elhelper-lang") || "en";
                        const isLight = localStorage.getItem("elhelper-mode") === "light";
                        menu.querySelector("#lang-select").value = savedLang;
                        menu.querySelector("#mode-switch").checked = isLight;
                        menu.querySelector("#lang-select").addEventListener("change", (e) => {
                            const lang = e.target.value;
                            if (window.translationManager) {
                                window.translationManager.switchLanguage(lang);
                            }
                        });
                        menu.querySelector("#mode-switch").addEventListener("change", (e) => {
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
                    } else {
                        settingsMenu.style.display = 'flex';
                    }
                }, 350); // Duración de la animación slideOutLeft
            } else if (hamburgerNav.classList.contains("settings-open")) {
                // Si está en settings, alterna de vuelta al menú con animación
                console.log('[DEBUG] Switching back to hamburger menu');
                hamburgerNav.classList.add("menu-slide-in");
                setTimeout(() => {
                    hamburgerNav.classList.remove("settings-open");
                    hamburgerNav.classList.remove("menu-slide-in");
                    if (settingsMenu) settingsMenu.remove();
                }, 350); // Duración de la animación slideInRight
            } else {
                // Si el menú hamburguesa no está abierto, ábrelo y luego muestra settings
                console.log('[DEBUG] Opening hamburger menu before showing settings');
                hamburgerNav.classList.add("open");
                overlay.classList.add("open");
                document.body.style.overflow = "hidden";
                Array.from(hamburgerNav.children).forEach((el, i) => {
                    el.style.setProperty('--delay', `${0.1 + i * 0.08}s`);
                });
                setTimeout(() => {
                    try {
                        toggleSettingsMenuMobile();
                    } catch (err) {
                        console.error('[ERROR] setTimeout toggleSettingsMenuMobile:', err);
                    }
                }, 350); // Espera a que se abra el menú antes de mostrar settings
            }
        } catch (err) {
            console.error('[ERROR] toggleSettingsMenuMobile:', err);
        }
    }

    // --- EVENT BINDINGS ---
    document.getElementById("settings-icon-desktop").addEventListener("click", () => {
        try {
            console.log('[DEBUG] settings-icon-desktop clicked');
            if (window.innerWidth > 900) {
                showSettingsPopupPC();
            }
        } catch (err) {
            console.error('[ERROR] settings-icon-desktop click handler:', err);
        }
    });
    document.getElementById("settings-icon-mobile").addEventListener("click", () => {
        try {
            console.log('[DEBUG] settings-icon-mobile clicked');
            if (window.innerWidth <= 900) {
                toggleSettingsMenuMobile();
            }
        } catch (err) {
            console.error('[ERROR] settings-icon-mobile click handler:', err);
        }
    });

    // Cerrar popup PC al hacer click fuera
    document.addEventListener("click", (e) => {
        const popup = document.getElementById("settings-popup");
        if (popup && !popup.contains(e.target) &&
            !document.getElementById("settings-icon-desktop").contains(e.target)) {
            popup.remove();
        }
    });

});

