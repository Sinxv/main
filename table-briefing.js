// Table briefing system - hide less important stats by default
(function() {
    const STORAGE_KEY = 'elhelper-show-full-info';
    
    function isFullInfoEnabled() {
        return localStorage.getItem(STORAGE_KEY) === 'true';
    }
    
    function getTableColumnCount(table) {
        const rowSpanMap = [];
        let maxCols = 0;

        for (const row of table.rows) {
            let colIndex = 0;

            while (rowSpanMap[colIndex] > 0) {
                colIndex += 1;
            }

            for (const cell of row.cells) {
                while (rowSpanMap[colIndex] > 0) {
                    colIndex += 1;
                }

                const colspan = Number(cell.getAttribute('colspan') || 1);
                const rowspan = Number(cell.getAttribute('rowspan') || 1);

                for (let i = 0; i < colspan; i += 1) {
                    rowSpanMap[colIndex + i] = rowspan > 1 ? rowspan : (rowSpanMap[colIndex + i] || 0);
                }

                colIndex += colspan;
            }

            maxCols = Math.max(maxCols, colIndex);

            for (let i = 0; i < rowSpanMap.length; i += 1) {
                if (rowSpanMap[i] > 0) {
                    rowSpanMap[i] -= 1;
                }
            }
        }

        return maxCols || 1;
    }

    function adjustRowSpans(table) {
        const rows = Array.from(table.rows);
        const visibility = rows.map(row => row.style.display !== 'none');

        rows.forEach((row, rowIndex) => {
            if (!visibility[rowIndex]) {
                return;
            }

            Array.from(row.cells).forEach(cell => {
                const originalRowSpan = Number(cell.getAttribute('rowspan') || 1);
                if (originalRowSpan <= 1) {
                    return;
                }

                let visibleSpan = 1;
                const endIndex = Math.min(rows.length, rowIndex + originalRowSpan);

                for (let nextIndex = rowIndex + 1; nextIndex < endIndex; nextIndex += 1) {
                    if (visibility[nextIndex]) {
                        visibleSpan += 1;
                    }
                }

                if (visibleSpan > 1) {
                    cell.setAttribute('rowspan', String(visibleSpan));
                } else {
                    cell.removeAttribute('rowspan');
                    if (row.cells.length === 1 && cell.tagName === 'TH') {
                        row.style.display = 'none';
                        visibility[rowIndex] = false;
                    }
                }
            });
        });
    }

    function applyBriefing(table) {
        const showFull = isFullInfoEnabled();
        
        // Only brief tables that have marked rows (good-stat/niche-stat)
        const allRows = table.querySelectorAll('tr');
        const hasMarkedRows = Array.from(allRows).some(row => 
            row.classList.contains('good-stat') || row.classList.contains('niche-stat')
        );

        if (!hasMarkedRows) {
            return; // Nothing to brief, all rows are relevant
        }

        allRows.forEach(row => {
            const hasGoodStat = row.classList.contains('good-stat');
            const hasNicheStat = row.classList.contains('niche-stat');
            const isHeader = row.querySelector('th');

            // Always show header rows
            if (isHeader) {
                return;
            }

            // Always show good-stat and niche-stat rows
            if (hasGoodStat || hasNicheStat) {
                return;
            }

            // Hide neutral rows unless full info is enabled
            if (!showFull) {
                row.style.display = 'none';
            }
        });

        adjustRowSpans(table);

        const columnCount = getTableColumnCount(table);
        table.querySelectorAll('th.table-title-collapser').forEach(titleCell => {
            titleCell.setAttribute('colspan', columnCount);
        });
    }

    function setupTableCollapse(table) {
        const titleCell = table.querySelector('th.table-title-collapser');
        if (!titleCell) return;

        const isImportant = table.dataset.important === 'true';

        // Set initial collapsed state
        if (isImportant) {
            // Important tables start expanded
            titleCell.classList.remove('collapsed');
        } else {
            // Non-important tables start collapsed
            titleCell.classList.add('collapsed');
            table.querySelectorAll('tr:not(:first-child)').forEach(row => {
                row.style.display = 'none';
            });
        }

        // Add click handler
        titleCell.addEventListener('click', function() {
            const isCollapsing = !this.classList.contains('collapsed');
            
            if (isCollapsing) {
                this.classList.add('collapsed');
                table.querySelectorAll('tr:not(:first-child)').forEach(row => {
                    row.style.display = 'none';
                });
            } else {
                this.classList.remove('collapsed');
                table.querySelectorAll('tr:not(:first-child)').forEach(row => {
                    row.style.display = '';
                });
                // Re-apply briefing if needed
                applyBriefing(table);
            }
        });
    }

    function updateAllTables(container = document) {
        const tables = container.querySelectorAll('table.stat-table[data-brief="true"]');

        tables.forEach(table => {
            // Set up collapse behavior
            setupTableCollapse(table);
            
            // Apply briefing (hiding neutral rows if full info disabled)
            applyBriefing(table);
        });
    }

    // Initialize on page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => updateAllTables());
    } else {
        updateAllTables();
    }
    
    // Expose functions to window
    window.toggleFullInfo = function(enabled) {
        localStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false');
        // Update all tables on page and in modal
        updateAllTables();
        const modal = document.getElementById('guide-modal');
        if (modal) {
            updateAllTables(modal);
        }
    };
    
    window.isFullInfoEnabled = isFullInfoEnabled;
    window.updateTableVisibility = updateAllTables;
})();