import { data } from './EHD.js';

const translations = data.translations;

// Enhanced Translation Manager
class TranslationManager {
    constructor() {
        this.currentLang = localStorage.getItem('elhelper-lang') || 'en';
        document.documentElement.lang = this.currentLang;
    }

    applyTranslations() {
        // Apply all translations regardless of page
        this.translateElements();
    }

    translateElements() {
        // Handle regular translations
        document.querySelectorAll('[data-translate]:not([data-multiline])').forEach(el => {
            const key = el.getAttribute('data-translate');
            const translation = this.getTranslation(key);
            if (translation) {
                el.textContent = translation;
            }
        });

        // Handle multi-line translations
        document.querySelectorAll('[data-multiline]').forEach(el => {
            const key = el.getAttribute('data-multiline');
            const lines = this.getTranslation(key, true);
            if (lines && Array.isArray(lines)) {
                el.innerHTML = lines.map(line => `<p>${line}</p>`).join('');
            }
        });

        // Handle table headers and stats
        document.querySelectorAll('th[data-translate], td[data-translate]').forEach(el => {
            const key = el.getAttribute('data-translate');
            const translation = this.getTranslation(key);
            if (translation) {
                el.textContent = translation;
            }
        });
    }

    getTranslation(key, isMultiline = false) {
        const keys = key.split('.');
        let value = translations;
        
        for (const k of keys) {
            if (!value[k]) {
                console.warn(`Translation key not found: ${key}`);
                return null;
            }
            value = value[k];
        }
        
        if (isMultiline) {
            return value[this.currentLang] || null;
        }
        return value[this.currentLang] || null;
    }

    switchLanguage(lang) {
        this.currentLang = lang;
        localStorage.setItem('elhelper-lang', lang);
        document.documentElement.lang = lang;
        this.applyTranslations();
        
        // Reinitialize info system
        if (window.infoSystem) {
            window.infoSystem.initElements();
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.translationManager = new TranslationManager();
    translationManager.applyTranslations();
    
    // Update language selector in nav if it exists
    const langSelect = document.getElementById('lang-select');
    if (langSelect) {
        langSelect.value = translationManager.currentLang;
        langSelect.addEventListener('change', (e) => {
            translationManager.switchLanguage(e.target.value);
        });
    }
});