// Table briefing system - hide less important stats by default
(function() {
    const STORAGE_KEY = 'elhelper-show-full-info';
    
    // Get the current setting
    function isFullInfoEnabled() {
        return localStorage.getItem(STORAGE_KEY) === 'true';
    }
    
    // Count effective columns in a table, respecting colspan and rowspan even across hidden rows.
    function getTableColumnCount(table) {
        const rowSpanMap = [];
        let maxCols = 0;

        for (const row of table.rows) {
            let colIndex = 0;

            // Advance past active row spans from previous rows.
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

    function updateTableVisibility() {
        const showFull = isFullInfoEnabled();
        const tables = document.querySelectorAll('table.stat-table[data-brief="true"]');

        tables.forEach(table => {
            // Check if this is the Resonance table by looking at header
            const headerText = table.querySelector('th.table-title-collapser')?.textContent || '';
            const isResonanceTable = headerText.includes('Resonance') || headerText.includes('El');

            const allRows = table.querySelectorAll('tr');
            allRows.forEach(row => {
                if (isResonanceTable) {
                    row.style.display = '';
                    return;
                }

                const hasGoodStat = row.classList.contains('good-stat');
                const hasNicheStat = row.classList.contains('niche-stat');
                const isHeader = row.querySelector('th');

                if (isHeader || hasGoodStat || hasNicheStat) {
                    row.style.display = '';
                } else {
                    row.style.display = showFull ? '' : 'none';
                }
            });

            adjustRowSpans(table);

            const columnCount = getTableColumnCount(table);
            table.querySelectorAll('th.table-title-collapser').forEach(titleCell => {
                titleCell.setAttribute('colspan', columnCount);
            });
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
