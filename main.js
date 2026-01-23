import { data } from './EHD.js';

window.addEventListener('resize', ajustarAltura);

const info = document.querySelector('.info');
const container = document.querySelector('.container');

function ajustarAltura() {
    if (container.offsetHeight < window.innerHeight) {
        info.style.height = 'calc(100vh - 150px)';
    } else {
        info.style.height = '';
    }
}

ajustarAltura();
window.addEventListener('resize', ajustarAltura);

// Unified Info System Manager
class InfoSystem {
    constructor() {
        this.currentPanel = null;
        this.activeElement = null;
        this.isDragging = false;
        this.startY = 0;
        
        this.initElements();
        this.setupEventListeners();
    }
    
    initElements() {
        // Clear existing info triggers
        document.querySelectorAll('.info-trigger, .table-note').forEach(el => el.remove());
        
        // Initialize table notes with translation support
        document.querySelectorAll('[data-note-type]').forEach(el => {
        const noteType = el.getAttribute('data-note-type');
        const noteSection = el.getAttribute('data-note-section');
        
        // Get the localized note
        const note = this.getLocalizedTableNote(noteType, noteSection);
        
        if (note) {
            const marker = document.createElement('span');
            marker.className = 'table-note';
            marker.dataset.infoContent = note;
            marker.textContent = '*';
            el.appendChild(marker);
            
            // Add translation attribute
            marker.setAttribute('data-translate', `tableNotes.${noteType}`);
        }
        });
    }

    getLocalizedTableNote(noteType, noteSection) {
    // Get the note from the archive
    const noteData = data.translations.tableNotes[noteType];
    if (!noteData) return null;
    
    // If there's a section, look for it in the note structure
    if (noteSection) {
      const sectionData = noteData[noteSection];
      return sectionData ? this.getLocalizedValue(sectionData) : null;
    }
    
    return this.getLocalizedValue(noteData);
  } 
    getLocalizedValue(obj) {
        const lang = localStorage.getItem('elhelper-lang') || 'en';
        return obj?.[lang] || obj?.en || '';
    }
    
    setupEventListeners() {
        // Mouse events
        document.addEventListener('mousedown', this.handleStart.bind(this));
        document.addEventListener('mousemove', this.handleMove.bind(this));
        document.addEventListener('mouseup', this.handleEnd.bind(this));
        
        // Touch events
        document.addEventListener('touchstart', this.handleStart.bind(this));
        document.addEventListener('touchmove', this.handleMove.bind(this));
        document.addEventListener('touchend', this.handleEnd.bind(this));
    }
    
    handleStart(e) {
        const trigger = e.target.closest('.info-trigger, .table-note');
        if (trigger) {
            this.isDragging = true;
            this.activeElement = trigger;
            this.startY = e.clientY || e.touches[0].clientY;
            trigger.classList.add('dragging');
            e.preventDefault();
        }
    }
    
    handleMove(e) {
        if (!this.isDragging) return;
        
        const currentY = e.clientY || e.touches[0].clientY;
        const distance = Math.abs(currentY - this.startY);
        
        if (distance > 20) {
            this.showPanel(this.activeElement, distance);
        }
    }
    
    handleEnd() {
        if (this.isDragging) {
            this.isDragging = false;
            if (this.activeElement) {
                this.activeElement.classList.remove('dragging');
                this.hidePanel();
            }
            this.activeElement = null;
        }
    }
    
    showPanel(element, distance) {
        if (!this.currentPanel) {
            this.currentPanel = document.createElement('div');
            this.currentPanel.className = 'info-panel';
            
            const title = element.dataset.infoTitle || 'Note';
            const content = element.dataset.infoContent || '';
            
            this.currentPanel.innerHTML = `
                <h3>${title}</h3>
                <div class="info-content">${content}</div>
            `;
            
            document.body.appendChild(this.currentPanel);
        }
        
        const rect = element.getBoundingClientRect();
        this.currentPanel.style.left = `${rect.left + window.scrollX}px`;
        this.currentPanel.style.top = `${rect.bottom + window.scrollY + 5}px`;
        
        // Animate based on drag distance
        const maxDistance = 100;
        const progress = Math.min(distance / maxDistance, 1);
        this.currentPanel.style.opacity = progress;
        this.currentPanel.style.transform = `translateY(${10 * (1 - progress)}px)`;
        
        if (progress > 0.7) {
            this.currentPanel.classList.add('visible');
        } else {
            this.currentPanel.classList.remove('visible');
        }
    }
    
    hidePanel() {
        if (this.currentPanel) {
            this.currentPanel.remove();
            this.currentPanel = null;
        }
    }
}

// Initialize all collapsible table titles
document.querySelectorAll('.table-title-collapser').forEach(title => {
    title.addEventListener('click', function() {
        const table = this.closest('table');
        const isCollapsing = !this.classList.contains('collapsed');
        
        // Toggle all rows except header
        table.querySelectorAll('tr:not(:first-child)').forEach(row => {
            if (isCollapsing) {
                row.style.display = 'none';
            } else {
                row.style.display = '';
            }
        });
        
        // Toggle collapsed state
        this.classList.toggle('collapsed');
        
        // Dispatch custom event
        table.dispatchEvent(new CustomEvent('tableCollapse', {
            detail: { collapsed: isCollapsing }
        }));
    });
    
    // Initialize state if table should start collapsed
    if (title.closest('.collapsible-table.collapsed')) {
        title.classList.add('collapsed');
    }
    
    // Apply translations if manager is available
    if (window.translationManager) {
        window.translationManager.applyTranslations();
    }
});