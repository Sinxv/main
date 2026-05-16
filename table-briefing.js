// Table briefing system - hide less important stats by default
(function() {
    const STORAGE_KEY = 'elhelper-show-full-info';
    
    // Get the current setting
    function isFullInfoEnabled() {
        return localStorage.getItem(STORAGE_KEY) === 'true';
    }
    
    // Toggle visibility of hidden stats in all tables
    function updateTableVisibility() {
        const showFull = isFullInfoEnabled();
        const tables = document.querySelectorAll('table.stat-table[data-brief="true"]');
        
        tables.forEach(table => {
            // Check if this is the Resonance table by looking at header
            const headerText = table.querySelector('th.table-title-collapser')?.textContent || '';
            const isResonanceTable = headerText.includes('Resonance') || headerText.includes('El');
            
            if (isResonanceTable) {
                // Resonance table: always show all rows (no filtering)
                const allRows = table.querySelectorAll('tr');
                allRows.forEach(row => {
                    row.style.display = '';
                });
            } else {
                // Other tables: show only good-stat and niche-stat rows in brief mode
                const allRows = table.querySelectorAll('tr');
                allRows.forEach(row => {
                    // Always show header rows and rows with good-stat or niche-stat classes
                    const hasGoodStat = row.classList.contains('good-stat');
                    const hasNicheStat = row.classList.contains('niche-stat');
                    const isHeader = row.querySelector('th');
                    
                    if (isHeader || hasGoodStat || hasNicheStat) {
                        row.style.display = '';
                    } else {
                        // Hide neutral rows unless Show Full Info is enabled
                        row.style.display = showFull ? '' : 'none';
                    }
                });
            }
        });
    }
    
    // Initialize on page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', updateTableVisibility);
    } else {
        updateTableVisibility();
    }
    
    // Expose toggle function to window for settings popup
    window.toggleFullInfo = function(enabled) {
        localStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false');
        updateTableVisibility();
    };
    
    // Get current state for settings popup
    window.isFullInfoEnabled = isFullInfoEnabled;
})();
