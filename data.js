import { data } from '/EHD.js';

function getCurrentLang() {
    return window.translationManager?.currentLang || localStorage.getItem('elhelper-lang') || 'en';
}

function getLocalizedValue(value) {
    const lang = getCurrentLang();

    if (value === null || value === undefined) {
        return '';
    }

    if (Array.isArray(value)) {
        return value.flatMap(item => {
            const resolved = getLocalizedValue(item);
            return Array.isArray(resolved) ? resolved : [resolved];
        }).join(' ');
    }

    if (typeof value === 'object') {
        if (Object.prototype.hasOwnProperty.call(value, lang)) {
            return getLocalizedValue(value[lang]);
        }
        if (Object.prototype.hasOwnProperty.call(value, 'en')) {
            return getLocalizedValue(value.en);
        }
        return Object.values(value).flatMap(item => {
            const resolved = getLocalizedValue(item);
            return Array.isArray(resolved) ? resolved : [resolved];
        }).join(' ');
    }

    return String(value);
}

window.infoDatabase = {
    concepts: data.translations.concepts,
    tableNotes: data.translations.tableNotes
};
// -------------------------------------------------------------------------------
// INFO SYSTEM - Handles both concept triggers and table notes
// -------------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', function() {
    // Initialize info triggers
    initConceptTriggers();
    initTableNotes();
    setupInfoHoverSystem();
});

// Initialize concept triggers from data-concept attributes
export function initConceptTriggers(context = document) {
    context.querySelectorAll('[data-concept]').forEach(el => {
        const conceptId = el.getAttribute('data-concept');
        const concept = infoDatabase.concepts[conceptId];
        
        if (concept) {
            el.classList.add('info-trigger');
            el.dataset.infoTitle = getLocalizedValue(concept.title);
            el.dataset.infoContent = getLocalizedValue(concept.content);
        }
    });
}

// Initialize table notes from data-note-type attributes
export function initTableNotes(context = document) {
    context.querySelectorAll('[data-note-type]').forEach(el => {
        const noteType = el.getAttribute('data-note-type');
        const note = infoDatabase.tableNotes[noteType];
        
        if (note) {
            // Find the parent table cell
            const cell = el.closest('td, th');
            if (cell) {
                cell.classList.add('has-note');
                cell.dataset.infoTitle = "Stat Information";
                cell.dataset.infoContent = getLocalizedValue(note);
                cell.dataset.noteType = noteType;
            }
        }
    });
}

// Setup hover events for info display
function setupInfoHoverSystem() {
    const infoPanel = document.createElement('div');
    infoPanel.className = 'info-panel';
    document.body.appendChild(infoPanel);
    
    let hoverTimeout;
    let currentElement = null;
    
    // Handle mouseenter events
    document.addEventListener('mouseover', function(e) {
        const trigger = e.target.closest('.info-trigger, .has-note');
        if (trigger && (trigger.dataset.infoContent || trigger.dataset.concept)) {
            clearTimeout(hoverTimeout);
            currentElement = trigger;
            
            hoverTimeout = setTimeout(() => {
                showInfoPanel(trigger, infoPanel);
            }, 200); // Small delay to prevent flickering
        }
    });
    
    // Handle mouseleave events
    document.addEventListener('mouseout', function(e) {
        const relatedTarget = e.relatedTarget;
        if (!relatedTarget || !infoPanel.contains(relatedTarget)) {
            clearTimeout(hoverTimeout);
            hideInfoPanel(infoPanel);
            currentElement = null;
        }
    });
    
    // Also hide when hovering over the panel itself
    infoPanel.addEventListener('mouseleave', function() {
        hideInfoPanel(infoPanel);
    });
}

function showInfoPanel(element, panel) {
    const title = element.dataset.infoTitle || "Additional Information";
    const content = element.dataset.infoContent || 
                   (element.dataset.concept ? infoDatabase.concepts[element.dataset.concept]?.content : "");
    
    panel.innerHTML = `
        <h3>${title}</h3>
        <div class="info-content">${content}</div>
    `;
    
    const rect = element.getBoundingClientRect();
    panel.style.left = `${rect.left + window.scrollX}px`;
    panel.style.top = `${rect.bottom + window.scrollY + 5}px`;
    panel.classList.add('visible');
}

function hideInfoPanel(panel) {
    panel.classList.remove('visible');
}

// In your data.js
function getLocalizedNote(noteType) {
    const lang = localStorage.getItem('elhelper-lang') || 'en';
    const page = window.translationManager?.currentPage || 'stage3';
    
    return translations[page]?.tableNotes?.[noteType]?.[lang] || 
           `[${noteType} translation not found]`;
}
// ------------------------------------------------------------------------------------------------------------------------------- SKILLS -------------------------------------------------------------------------------------------------------------------- //