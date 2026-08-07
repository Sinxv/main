import { data } from '/EHD.js';

const translations = data.translations;

// Enhanced Translation Manager
class TranslationManager {
    constructor() {
        this.currentLang = localStorage.getItem('elhelper-lang') || 'en';
        this.previousScrollY = 0;
        this.previousHash = '';
        this.activeTargetId = null;
        this.isBackButtonActive = false;
        this.glossaryEntries = this.buildGlossaryEntries();
        this.glossaryTooltip = null;
        document.documentElement.lang = this.currentLang;
        this.setupGlossaryTooltipHandlers();
    }

    applyTranslations(context = document) {
        this.translateElements(context);
    }

    createBackButton() {
        let button = document.getElementById('anchor-return-button');
        if (button) {
            return button;
        }

        button = document.createElement('button');
        button.id = 'anchor-return-button';
        button.type = 'button';
        button.className = 'anchor-return-button';
        button.textContent = 'Back';
        button.setAttribute('aria-label', 'Return to previous position');
        button.addEventListener('click', () => this.returnToPreviousPosition());
        document.body.appendChild(button);
        return button;
    }

    showBackButton() {
        const button = this.createBackButton();
        this.isBackButtonActive = true;
        button.classList.add('is-visible');
    }

    hideBackButton() {
        const button = document.getElementById('anchor-return-button');
        this.isBackButtonActive = false;
        if (button) {
            button.classList.remove('is-visible');
        }
    }

    isElementVisible(element) {
        if (!element) {
            return false;
        }

        const rect = element.getBoundingClientRect();
        const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
        return rect.bottom >= 0 && rect.top <= viewportHeight;
    }

    updateBackButtonVisibility() {
        const button = document.getElementById('anchor-return-button');
        if (!button || !this.activeTargetId || !this.isBackButtonActive) {
            return;
        }

        const target = document.getElementById(this.activeTargetId);
        if (!target) {
            this.hideBackButton();
            return;
        }

        const currentScrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
        const returnedToOrigin = Math.abs(currentScrollY - this.previousScrollY) < 5;

        if (returnedToOrigin || !this.isElementVisible(target)) {
            this.hideBackButton();
            return;
        }

        button.classList.add('is-visible');
    }

    positionBackButtonForTarget(target) {
        const button = this.createBackButton();
        const targetTop = target.getBoundingClientRect().top + (window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0);
        const shouldPositionBottom = targetTop < this.previousScrollY;

        button.classList.toggle('is-bottom', shouldPositionBottom);
        button.classList.toggle('is-top', !shouldPositionBottom);
    }

    returnToPreviousPosition() {
        window.scrollTo({ top: this.previousScrollY, behavior: 'smooth' });
        const nextUrl = this.previousHash
            ? `${window.location.pathname}${window.location.search}${this.previousHash}`
            : `${window.location.pathname}${window.location.search}`;
        history.replaceState(null, '', nextUrl);
        this.hideBackButton();
    }

    handleAnchorClick(event) {
        const link = event.target.closest('a[href^="#"]');
        if (!link) {
            return;
        }

        const targetId = link.getAttribute('href').slice(1);
        const target = document.getElementById(targetId);
        if (!target) {
            return;
        }

        event.preventDefault();
        this.previousScrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
        this.previousHash = window.location.hash;
        this.activeTargetId = targetId;
        this.showBackButton();
        this.positionBackButtonForTarget(target);

        history.replaceState(null, '', `${window.location.pathname}${window.location.search}#${targetId}`);
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    setupGlossaryTooltipHandlers() {
        document.addEventListener('mouseover', (event) => {
            const term = event.target.closest('.glossary-term');
            if (term) {
                this.showGlossaryTooltip(term, event);
            }
        });

        document.addEventListener('mousemove', (event) => {
            const term = event.target.closest('.glossary-term');
            if (term) {
                this.updateGlossaryTooltipPosition(event.clientX, event.clientY);
            }
        });

        document.addEventListener('mouseout', (event) => {
            const term = event.target.closest('.glossary-term');
            if (term && (!event.relatedTarget || !event.relatedTarget.closest || !event.relatedTarget.closest('.glossary-term'))) {
                this.hideGlossaryTooltip();
            }
        });
    }

    createGlossaryTooltip() {
        if (!this.glossaryTooltip) {
            this.glossaryTooltip = document.createElement('div');
            this.glossaryTooltip.className = 'glossary-tooltip';
            document.body.appendChild(this.glossaryTooltip);
        }
        return this.glossaryTooltip;
    }

    showGlossaryTooltip(term, event) {
        const tooltip = this.createGlossaryTooltip();
        const description = term.dataset.glossaryText || this.getGlossaryDescription(term.dataset.glossaryKey);
        if (!description) {
            this.hideGlossaryTooltip();
            return;
        }

        tooltip.innerHTML = description;
        this.updateGlossaryTooltipPosition(event.clientX, event.clientY);
        tooltip.classList.add('is-visible');
    }

    updateGlossaryTooltipPosition(x, y) {
        const tooltip = this.createGlossaryTooltip();
        tooltip.style.left = `${x + 12}px`;
        tooltip.style.top = `${y + 12}px`;
    }

    hideGlossaryTooltip() {
        if (this.glossaryTooltip) {
            this.glossaryTooltip.classList.remove('is-visible');
        }
    }

    buildGlossaryEntries() {
        const concepts = translations.concepts || {};
        const entries = [];

        Object.entries(concepts).forEach(([key, value]) => {
            if (!key || !value) {
                return;
            }

            const variants = new Set();
            const addVariant = (variant) => {
                const cleaned = String(variant || '').trim();
                if (!cleaned) {
                    return;
                }
                variants.add(cleaned);
                variants.add(cleaned.toLowerCase());
            };

            addVariant(key);
            addVariant(key.replace(/([a-z])([A-Z])/g, '$1 $2'));
            addVariant(key.replace(/([a-z])([A-Z])/g, '$1-$2'));
            addVariant(key.toLowerCase());
            addVariant(key.toLowerCase().replace(/ /g, '-'));
            addVariant(key.toLowerCase().replace(/ /g, ''));
            addVariant(key.toLowerCase().replace(/-/g, ''));

            const uniqueVariants = Array.from(variants)
                .filter(Boolean)
                .sort((a, b) => b.length - a.length);

            if (uniqueVariants.length) {
                entries.push({ key, variants: uniqueVariants });
            }
        });

        return entries.sort((a, b) => b.variants[0].length - a.variants[0].length);
    }

    getGlossaryDescription(termKey) {
        const concepts = translations.concepts || {};
        const entry = concepts[termKey];
        if (!entry) {
            return '';
        }

        const value = entry[this.currentLang] || entry.en || entry;
        if (Array.isArray(value)) {
            return value.join('<br>');
        }
        if (value && typeof value === 'object') {
            return value[this.currentLang] || value.en || '';
        }
        return String(value || '');
    }

    getGlossaryEntryForText(text) {
        const normalized = text.toLowerCase().replace(/[^a-z0-9]+/g, '');
        return this.glossaryEntries.find((entry) => {
            return entry.variants.some((variant) => {
                const normalizedVariant = variant.toLowerCase().replace(/[^a-z0-9]+/g, '');
                return normalizedVariant === normalized;
            });
        }) || null;
    }

    escapeRegExp(value) {
        return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    escapeAttribute(value) {
        return String(value).replace(/"/g, '&quot;');
    }

    renderTextWithGlossary(text) {
        if (!text) {
            return '';
        }

        const patterns = this.glossaryEntries
            .flatMap((entry) => entry.variants)
            .filter((variant, index, all) => all.indexOf(variant) === index)
            .sort((a, b) => b.length - a.length)
            .map((variant) => this.escapeRegExp(variant));

        if (!patterns.length) {
            return text;
        }

        const glossaryRegex = new RegExp(`\\b(?:${patterns.join('|')})\\b`, 'gi');
        let result = '';
        let lastIndex = 0;
        let match;

        while ((match = glossaryRegex.exec(text))) {
            const matchedText = match[0];
            result += text.slice(lastIndex, match.index);
            const entry = this.getGlossaryEntryForText(matchedText);
            if (entry) {
                const description = this.getGlossaryDescription(entry.key);
                result += `<span class="glossary-term" data-glossary-key="${entry.key}" data-glossary-text="${this.escapeAttribute(description)}">${matchedText}</span>`;
            } else {
                result += matchedText;
            }
            lastIndex = match.index + matchedText.length;
        }

        result += text.slice(lastIndex);
        return result;
    }

    renderRichText(value) {
        if (value === null || value === undefined) {
            return '';
        }

        const text = String(value);
        const parts = [];
        let lastIndex = 0;

        text.replace(/<([^>]+)>/g, (match, inner, offset) => {
            const before = text.slice(lastIndex, offset);
            parts.push(this.renderTextWithGlossary(before));

            const token = inner.trim();
            if (!token) {
                parts.push('');
            } else {
                const lower = token.toLowerCase();
                if (['concept', 'np', 'mech', 'forced mech', 'forced', 'forced mech,', 'derivated from', 'derived from'].includes(lower)) {
                    parts.push('');
                } else if (/^(\/)?(strong|em|b|i|u|br|p|span|div|h[1-6]|ul|ol|li|a|img|audio|video|source|table|tbody|thead|tfoot|tr|td|th|caption|colgroup|col|iframe|figure|figcaption)\b/i.test(token)) {
                    parts.push(match);
                } else {
                    const label = token.replace(/^derivated from\s+/i, '').replace(/^derived from\s+/i, '').trim();
                    const id = this.getMechAnchor(label);
                    if (id && document.getElementById(id)) {
                        parts.push(`<a href="#${id}" class="mech-reference" style="color:${this.getPrimaryColor()};">${label}</a>`);
                    } else {
                        parts.push(label);
                    }
                }
            }

            lastIndex = offset + match.length;
            return match;
        });

        parts.push(this.renderTextWithGlossary(text.slice(lastIndex)));
        return parts.join('');
    }

    getPrimaryColor() {
        const styles = getComputedStyle(document.documentElement);
        const color = styles.getPropertyValue('--primary-color').trim();
        return color || '#8b5cf6';
    }

    getMechAnchor(label) {
        const normalized = label.toLowerCase();
        const anchors = {
            'jump rope': 'jump-rope',
            'altar connection': 'altar-connection',
            'create vortex': 'create-vortex',
            'spider web mark': 'spider-web-mark',
            'mark of silence': 'mark-of-silence',
            'slam down': 'slam-down',
            'jump and drop': 'jump-and-drop',
            'abyss gate': 'abyss-gate',
            'blackout': 'blackout',
            'spider web explosion': 'spider-web-explosion',
            'space connection': 'space-connection',
            'energy concentration': 'energy-concentration',
            'current adaptation': 'current-adaptation',
            'starlight explosion': 'starlight-explosion',
            'targeted laser': 'abyss-targeted-laser',
            'red target': 'red-target',
            'blue target': 'blue-target',
            'create current': 'create-current',
            'nightmare prison': 'nightmare-prison',
            'nightmare orb': 'nightmare-orb',
            'dream eater': 'dream-eater',
            'dark vortex': 'dark-vortex',
            'shape link': 'shape-link',
            'darkness swipe': 'darkness-swipe',
            'orb barrage': 'orb-barrage',
            'meteor': 'meteor',
            'berserk': 'abyss-berserk',
            'release of unstable power': 'release-of-unstable-power',
            'devour': 'devour',
            'find the space': 'find-the-space',
            'connection of strong power': 'connection-of-strong-power',
            'infusion of strong power': 'infusion-of-strong-power',
            'reverse gravity': 'reverse-gravity',
            'continuous attack': 'continuous-attack',
            'gravity field': 'gravity-field',
            'flames of abyss': 'flames-of-abyss',
            'pierce': 'pierce',
            'attribute': 'shadow-abyss-attribute',
            'falling orbs' : 'falling-orbs',
            'instant kill laser' : 'instant-kill-laser',
            'absorb' : 'abyss-absorb',
            'space shift' : 'space-shift'
        };

        return anchors[normalized] || null;
    }

    translateElements(context = document) {
        context.querySelectorAll('[data-translate]:not([data-multiline])').forEach(el => {
            const key = el.getAttribute('data-translate');
            const translation = this.getTranslation(key);
            if (translation) {
                el.innerHTML = this.renderRichText(translation);
            }
        });

        context.querySelectorAll('[data-multiline]').forEach(el => {
            const key = el.getAttribute('data-multiline');
            const lines = this.getTranslation(key, true);
            if (lines && Array.isArray(lines)) {
                el.innerHTML = lines.map(line => `<p>${this.renderRichText(line)}</p>`).join('');
            }
        });

        context.querySelectorAll('th[data-translate], td[data-translate]').forEach(el => {
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

        if (window.infoSystem) {
            window.infoSystem.initElements();
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.translationManager = new TranslationManager();
    document.addEventListener('click', (event) => translationManager.handleAnchorClick(event));
    window.addEventListener('scroll', () => translationManager.updateBackButtonVisibility(), { passive: true });
    translationManager.applyTranslations();

    const langSelect = document.getElementById('lang-select');
    if (langSelect) {
        langSelect.value = translationManager.currentLang;
        langSelect.addEventListener('change', (e) => {
            translationManager.switchLanguage(e.target.value);
        });
    }
});