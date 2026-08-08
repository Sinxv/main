import { data } from '/EHD.js';
import { initConceptTriggers, initTableNotes } from '/data.js';
import { guideData } from '/guide-data.js';

const GUIDE_OVERLAY_ID = 'guide-modal-overlay';
const GUIDE_MODAL_ID = 'guide-modal';
const BUTTON_LABEL_KEY = 'general.open_guide';
const CATEGORY_ORDER = ['system', 'raid', 'misc'];
const CATEGORY_LABELS = {
    system: 'System Explanation',
    raid: 'Raid Guides',
    misc: 'Miscellaneous'
};
const RAID_ORDER = ['Rosso','Berthe','Abyss','Serpentium','Doom Aporia','Nebulon']

function getCurrentLang() {
    return window.translationManager?.currentLang || localStorage.getItem('elhelper-lang') || 'en';
}

function getTranslationObject(key) {
    if (!key) return null;
    const keys = key.split('.');
    let node = data.translations;

    for (const part of keys) {
        if (!node || typeof node !== 'object' || !(part in node)) {
            console.warn(`Guide manager translation key not found: ${key}`);
            return null;
        }
        node = node[part];
    }
    return node;
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
        });
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
        });
    }

    return String(value);
}

function getTranslation(key) {
    const obj = getTranslationObject(key);
    const value = getLocalizedValue(obj);
    if (Array.isArray(value)) {
        return value.join(' ');
    }
    return value;
}

function getMultiline(key) {
    const obj = getTranslationObject(key);
    const value = getLocalizedValue(obj);
    return Array.isArray(value) ? value : value ? [value] : [];
}

function createElement(tag, attributes = {}, children = []) {
    const element = document.createElement(tag);
    Object.entries(attributes).forEach(([name, value]) => {
        if (name === 'class') {
            element.className = value;
        } else if (name === 'dataset') {
            Object.entries(value).forEach(([dataKey, dataValue]) => {
                element.dataset[dataKey] = dataValue;
            });
        } else if (name === 'html' && value !== null && value !== undefined) {
            element.innerHTML = value;
        } else if (value !== null && value !== undefined) {
            element.setAttribute(name, value);
        }
    });

    children.flat().forEach(child => {
        if (child instanceof Node) {
            element.appendChild(child);
        } else if (child !== null && child !== undefined) {
            element.appendChild(document.createTextNode(String(child)));
        }
    });

    return element;
}

function getRenderedText(text) {
    const raw = String(text === null || text === undefined ? '' : text);
    if (window.translationManager?.renderRichText) {
        return window.translationManager.renderRichText(raw);
    }
    return raw;
}

function createFragmentFromHtml(html) {
    const template = document.createElement('template');
    template.innerHTML = html;
    return document.importNode(template.content, true);
}

function renderParagraphElements(value) {
    const resolved = getLocalizedValue(value);
    const lines = Array.isArray(resolved) ? resolved : [resolved];
    return lines.flatMap(line => {
        const rendered = getRenderedText(line);
        if (!rendered) {
            return [];
        }

        const isBlockContent = /<(table|thead|tbody|tfoot|tr|td|th|img|audio|video|figure|figcaption|div|section|article|ul|ol|iframe|h[1-6])\b/i.test(rendered);
        if (isBlockContent) {
            return Array.from(createFragmentFromHtml(rendered).childNodes);
        }

        return [createElement('p', { html: rendered })];
    });
}

function renderGroupTitle(title) {
    if (!title) return null;
    return createElement('div', { class: 'guide-group-title' }, [title]);
}

const MECH_KNOWN_KEYS = new Set(['name', 'forcedat', 'description', 'note', 'concepts', 'derivated_mechs', 'alt']);
const CONCEPT_KNOWN_KEYS = new Set(['name', 'title', 'description']);

function isLangLeaf(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return false;
    }
    return Object.prototype.hasOwnProperty.call(value, 'en');
}

function renderMechanicEntry(item) {
    const wrapper = createElement('div', { class: 'mech' }, []);

    // Name with status icons
    const nameText = getLocalizedValue(item.name);
    if (nameText) {
        const nameWrapper = createElement('div', { class: 'mechname-wrapper' }, []);
        const nameEl = createElement('div', { class: 'mechname' }, [nameText]);
        nameWrapper.appendChild(nameEl);
        
        // Add status icons right after the name
        const statusIcons = renderStatusIcons(item, true);
        statusIcons.forEach(icon => nameWrapper.appendChild(icon));
        
        wrapper.appendChild(nameWrapper);
    }

    if (item.forcedat) {
        wrapper.appendChild(createElement('div', { class: 'mechforcedat' }, [getLocalizedValue(item.forcedat)]));
    }

    // Main description (non-variant content)
    if (item.description) {
        renderParagraphElements(item.description).forEach(el => wrapper.appendChild(el));
    }

    // Variants section
    if (item.variants) {
        const variantsSection = renderVariantsSection(item.variants);
        if (variantsSection) wrapper.appendChild(variantsSection);
    }

    if (item.note) {
        renderParagraphElements(item.note).forEach(el => {
            el.classList.add('mechnote');
            wrapper.appendChild(el);
        });
    }

    if (item.concepts) {
        wrapper.appendChild(createElement('div', { class: 'concept' }));
        Object.values(item.concepts).forEach(concept => {
            if (concept.title) {
                wrapper.appendChild(createElement('div', { class: 'ctitle' }, [getLocalizedValue(concept.title)]));
            }
            if (concept.description) {
                renderParagraphElements(concept.description).forEach(el => wrapper.appendChild(el));
            }
            if (concept.variants) {
                const variantsSection = renderVariantsSection(concept.variants);
                if (variantsSection) wrapper.appendChild(variantsSection);
            }
        });
    }

    if (item.derivated_mechs) {
        Object.values(item.derivated_mechs).forEach(derived => {
            const derivedWrapper = createElement('div', { class: 'concept' }, []);
            derivedWrapper.appendChild(renderMechanicEntry(derived));
            wrapper.appendChild(derivedWrapper);
        });
    }

    if (item.alt) {
        Object.values(item.alt).forEach(altEntry => {
            const altWrapper = createElement('div', { class: 'concept' }, []);
            altWrapper.appendChild(renderMechanicEntry(altEntry));
            wrapper.appendChild(altWrapper);
        });
    }

    Object.entries(item).forEach(([key, value]) => {
        // Skip known keys, variants, and status keys
        if (MECH_KNOWN_KEYS.has(key) || key === 'variants' || MECH_STATUS_CONFIG[key] || !value || typeof value !== 'object') {
            return;
        }

        if (isLangLeaf(value)) {
            renderParagraphElements(value).forEach(el => wrapper.appendChild(el));
        } else {
            const derivedWrapper = createElement('div', { class: 'concept' }, []);
            derivedWrapper.appendChild(renderMechanicEntry(value));
            wrapper.appendChild(derivedWrapper);
        }
    });

    return wrapper;
}

function renderConceptEntry(concept) {
    const wrapper = createElement('div', { class: 'concept' }, []);

    const titleText = getLocalizedValue(concept.title || concept.name);
    if (titleText) {
        wrapper.appendChild(createElement('div', { class: 'ctitle' }, [titleText]));
    }

    if (concept.description) {
        renderParagraphElements(concept.description).forEach(el => wrapper.appendChild(el));
    }

    // Variants inside concepts
    if (concept.variants) {
        const variantsSection = renderVariantsSection(concept.variants);
        if (variantsSection) wrapper.appendChild(variantsSection);
    }

    Object.entries(concept).forEach(([key, value]) => {
        if (CONCEPT_KNOWN_KEYS.has(key) || key === 'variants' || !value || typeof value !== 'object') {
            return;
        }

        if (isLangLeaf(value)) {
            renderParagraphElements(value).forEach(el => wrapper.appendChild(el));
        } else {
            const derivedWrapper = createElement('div', { class: 'concept' }, []);
            derivedWrapper.appendChild(renderConceptEntry(value));
            wrapper.appendChild(derivedWrapper);
        }
    });

    return wrapper;
}

function renderConceptsSection(concepts) {
    if (!concepts || typeof concepts !== 'object') {
        return null;
    }

    const group = createElement('div', { class: 'concepts-group' }, []);
    Object.values(concepts).forEach(concept => {
        group.appendChild(renderConceptEntry(concept));
    });

    return group;
}

function renderMechanicGroup(label, mechanics) {
    if (!mechanics || typeof mechanics !== 'object') {
        return null;
    }

    const group = createElement('div', { class: 'mechanic-group' }, []);
    group.appendChild(createElement('div', { class: 'mechanic-group-title' }, [label]));

    Object.values(mechanics).forEach(item => {
        group.appendChild(renderMechanicEntry(item));
    });

    return group;
}

function renderRaidSection(sectionKey, guideId) {
    const section = getTranslationObject(sectionKey);
    if (!section) {
        return null;
    }

    const sectionWrapper = createElement('div', { class: 'guide-raid-section' }, []);
    const title = getLocalizedValue(section.name);
    const number = getLocalizedValue(section.num);

    if (number) {
        sectionWrapper.appendChild(createElement('h3', { class: 'RAID_DUNG_NUM' }, [number]));
    }
    if (title) {
        sectionWrapper.appendChild(createElement('h3', { class: 'RAID_DUNG_TITLE' }, [title]));
    }

    const content = section.content || {};
    Object.entries(content).forEach(([phaseId, phaseData], index) => {
        const phaseWrapper = createElement('div', { class: 'phase-section' }, []);
        if (phaseData.phasenum || phaseData.phasebname) {
            const imgphaseHeader = createElement('div', { class: 'IMGPHASEHEADER' }, []);
            imgphaseHeader.id = `${guideId}${index + 1}`;
            const phaseHeader = imgphaseHeader.appendChild(createElement('div', { class: 'phaseheader' }))
            if (phaseData.phasenum) {
                phaseHeader.appendChild(createElement('div', { class: 'PHASENUM' }, [getLocalizedValue(phaseData.phasenum)]));
            }
            if (phaseData.phasebname) {
                phaseHeader.appendChild(createElement('div', { class: 'PHASEBNAME' }, [getLocalizedValue(phaseData.phasebname)]));
            }
            phaseWrapper.appendChild(imgphaseHeader);
            phaseWrapper.appendChild(createElement('hr', { class: 'titledivider' }));
        }

        if (phaseData.concepts) {
            const conceptsSection = renderConceptsSection(phaseData.concepts);
            if (conceptsSection) phaseWrapper.appendChild(conceptsSection);
        }

        if (phaseData.description) {
            renderParagraphElements(phaseData.description).forEach(el => phaseWrapper.appendChild(el));
        }

        if (phaseData.np) {
            const npGroup = renderMechanicGroup('Normal Patterns', phaseData.np);
            if (npGroup) phaseWrapper.appendChild(npGroup);
        }

        if (phaseData.mechs) {
            const mechGroup = renderMechanicGroup('Mechanics', phaseData.mechs);
            if (mechGroup) phaseWrapper.appendChild(mechGroup);
        }

        if (phaseData.forcedmechs) {
            const forcedGroup = renderMechanicGroup('Forced Mechanics', phaseData.forcedmechs);
            if (forcedGroup) phaseWrapper.appendChild(forcedGroup);
        }

        sectionWrapper.appendChild(phaseWrapper);
    });

    return sectionWrapper;
}

function isTranslationPath(value) {
    if (typeof value !== 'string' || !/^[a-zA-Z_][a-zA-Z0-9_]*(\.[a-zA-Z_][a-zA-Z0-9_]*)+$/.test(value)) {
        return false;
    }
    return getTranslationObject(value) !== null;
}

function resolveHeaderLabel(col) {
    if (col.blank) {
        return '';
    }
    if (col.labelKey && col.labelKey.includes('.')) {
        return getTranslation(col.labelKey) || col.labelKey;
    }
    return col.labelKey || getLocalizedValue(col.label) || '';
}

function createCellLines(lines) {
    if (!lines.length) {
        return [];
    }
    if (lines.length === 1) {
        return [lines[0]];
    }
    return lines.map(line => createElement('div', {}, [line]));
}

function renderRowGroupsTable(tableSpec) {
    const wrapper = createElement('div', { class: 'collapsible-table' }, []);
    const dataset = { brief: 'true' };
    if (tableSpec.important) {
        dataset.important = 'true';
    }
    const table = createElement('table', {
        id: tableSpec.id || 'gridtable',
        class: 'stat-table',
        dataset: dataset
    }, []);
    const totalCols = tableSpec.columns ? tableSpec.columns.length : 4;

    if (tableSpec.titleKey || tableSpec.title) {
        const titleText = tableSpec.titleKey ? getTranslation(tableSpec.titleKey) : getLocalizedValue(tableSpec.title);
        table.appendChild(createElement('tr', {}, [
            createElement('th', { class: 'table-title-collapser', colspan: String(totalCols) }, [titleText])
        ]));
    }

    if (Array.isArray(tableSpec.columns)) {
        table.appendChild(createElement('tr', {}, tableSpec.columns.map(col =>
            createElement('th', {}, [resolveHeaderLabel(col)])
        )));
    }

    function getRowsSignature(rows) {
        return rows.map(row => {
            const label = row.labelKey ? getTranslation(row.labelKey) : getLocalizedValue(row.label);
            const range = row.range !== undefined ? String(row.range) : '';
            return `${label}|||${range}`;
        }).sort().join(':::');
    }

    const groupSignatures = tableSpec.rowGroups.map(group => ({
        group,
        signature: getRowsSignature(group.rows)
    }));

    const renderedSignatures = new Set();
    const mergedGroups = [];

    tableSpec.rowGroups.forEach((group, index) => {
        const sig = groupSignatures[index].signature;
        if (renderedSignatures.has(sig)) {
            const existing = mergedGroups.find(mg => mg.signature === sig);
            if (existing) {
                existing.effect1Labels.push(group.labelKey ? getTranslation(group.labelKey) : getLocalizedValue(group.label));
                existing.effect1Ranges.push(group.range !== undefined ? String(group.range) : '');
            }
        } else {
            renderedSignatures.add(sig);
            mergedGroups.push({
                signature: sig,
                effect1Labels: [group.labelKey ? getTranslation(group.labelKey) : getLocalizedValue(group.label)],
                effect1Ranges: [group.range !== undefined ? String(group.range) : ''],
                rows: group.rows
            });
        }
    });

    mergedGroups.forEach(merged => {
        const rows = Array.isArray(merged.rows) ? merged.rows : [];
        const totalRows = rows.length + 1;

        const mergedEffect1Label = merged.effect1Labels.join('<br>');
        
        const uniqueRanges = [...new Set(merged.effect1Ranges.filter(r => r !== ''))];
        let mergedEffect1Range = '';
        if (uniqueRanges.length === 1) {
            mergedEffect1Range = uniqueRanges[0];
        } else if (uniqueRanges.length > 1) {
            mergedEffect1Range = uniqueRanges.join('<br>');
        }

        const headerCells = [
            createElement('th', { rowspan: String(totalRows), html: mergedEffect1Label }, [])
        ];

        if (mergedEffect1Range) {
            headerCells.push(createElement('td', { rowspan: String(totalRows), html: mergedEffect1Range }, []));
        }

        table.appendChild(createElement('tr', {}, headerCells));

        rows.forEach(row => {
            const labelText = row.labelKey ? getTranslation(row.labelKey) : getLocalizedValue(row.label);
            const cells = [
                createElement('td', {}, [createElement('span', {}, [labelText])])
            ];
            if (row.range !== undefined) {
                cells.push(createElement('td', {}, [String(row.range)]));
            }
            table.appendChild(createElement('tr', {}, cells));
        });
    });

    wrapper.appendChild(table);
    return wrapper;
}

function renderTableFromSpec(tableSpec) {
    if (!tableSpec) {
        return null;
    }

    if (Array.isArray(tableSpec.tabs)) {
        return renderTabbedTable(tableSpec);
    }

    if (Array.isArray(tableSpec.rowGroups)) {
        return renderRowGroupsTable(tableSpec);
    }

    if (!Array.isArray(tableSpec.rows) || !Array.isArray(tableSpec.columns)) {
        return null;
    }

    const wrapper = createElement('div', { class: 'collapsible-table' }, []);
    
    const dataset = { brief: 'true' };
    if (tableSpec.important) {
        dataset.important = 'true';
    }
    
    const table = createElement('table', {
        id: tableSpec.id || 'gridtable',
        class: 'stat-table',
        dataset: dataset
    }, []);

    if (tableSpec.titleKey || tableSpec.title) {
        const titleText = tableSpec.titleKey ? getTranslation(tableSpec.titleKey) : getLocalizedValue(tableSpec.title);
        table.appendChild(createElement('tr', {}, [
            createElement('th', { class: 'table-title-collapser', colspan: String(tableSpec.columns.length) }, [titleText])
        ]));
    }

    if (tableSpec.headerRow !== false) {
        table.appendChild(createElement('tr', {}, tableSpec.columns.map(col =>
            createElement('th', {}, [resolveHeaderLabel(col)])
        )));
    }

    const labelColKey = tableSpec.labelColumnKey || tableSpec.columns[0].key;
    const valueCols = tableSpec.columns.filter(col => col.key !== labelColKey);

    function renderRow(row, includeLabel) {
        const cells = [];

        if (includeLabel) {
            const labelText = row.labelKey 
                ? getTranslation(row.labelKey) 
                : getLocalizedValue(row.label || row[labelColKey]);
            cells.push(createElement('td', {}, [createElement('span', {}, [labelText])]));
        }

        valueCols.forEach(col => {
            const raw = row.cells ? row.cells[col.key] : row[col.key];
            let content = [];
            if (raw !== undefined && raw !== null) {
                if (isTranslationPath(raw)) {
                    content = createCellLines(getMultiline(raw));
                } else {
                    const lines = String(raw).split('\n');
                    content = lines.length > 1
                        ? lines.map(line => createElement('div', {}, [line]))
                        : [String(raw)];
                }
            }
            const attrs = {};
            if (col.cellId) {
                attrs.id = col.cellId;
                attrs.class = col.cellId;
            }
            cells.push(createElement('td', attrs, content));
        });

        let rowClass = row.rowClass || '';
        if (row.goodStat) rowClass = (rowClass + ' good-stat').trim();
        if (row.hidden) rowClass = (rowClass + ' niche-stat').trim();
        const rowAttrs = { class: rowClass };
        if (row.hidden) {
            rowAttrs.dataset = { hidden: 'true' };
        }

        table.appendChild(createElement('tr', rowAttrs, cells));
    }

    if (Array.isArray(tableSpec.rowHeaders) && tableSpec.rowHeaders.length) {
        let cursor = 0;
        tableSpec.rowHeaders.forEach(group => {
            const label = group.labelKey ? getTranslation(group.labelKey) : getLocalizedValue(group.label);
            table.appendChild(createElement('tr', {}, [
                createElement('th', { rowspan: String(group.rowspan || 1) }, [label])
            ]));

            const dataCount = Math.max((group.rowspan || 1) - 1, 0);
            tableSpec.rows.slice(cursor, cursor + dataCount).forEach(row => renderRow(row, false));
            cursor += dataCount;
        });
    } else {
        tableSpec.rows.forEach(row => renderRow(row, true));
    }

    wrapper.appendChild(table);
    return wrapper;
}

function renderTabbedTable(tableSpec) {
    const wrapper = createElement('div', { class: 'collapsible-table tabbed-table' }, []);

    if (tableSpec.titleKey || tableSpec.title) {
        const titleText = tableSpec.titleKey ? getTranslation(tableSpec.titleKey) : getLocalizedValue(tableSpec.title);
        wrapper.appendChild(createElement('h2', { class: 'table-section-title' }, [titleText]));
    }

    // Tab navigation
    const tabNav = createElement('div', { class: 'tab-nav' }, []);
    wrapper.appendChild(tabNav);

    // Single table that gets rebuilt on tab switch
    const tableContainer = createElement('div', { class: 'tab-table-container' }, []);
    wrapper.appendChild(tableContainer);

    let activeIndex = 0;

    function renderTab(index) {
        const tab = tableSpec.tabs[index];
        activeIndex = index;

        // Update active button
        tabNav.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        const activeButton = tabNav.querySelector(`[data-tab-index="${index}"]`);
        if (activeButton) activeButton.classList.add('active');

        // Rebuild table
        tableContainer.innerHTML = '';

        const tableDataset = { brief: 'true' };
        if (tableSpec.important) {
            tableDataset.important = 'true';
        }
        const table = createElement('table', {
            id: tableSpec.id || 'gridtable',
            class: 'stat-table',
            dataset: tableDataset
        }, []);

        if (tab.headerRow !== false) {
            table.appendChild(createElement('tr', {}, tab.columns.map(col =>
                createElement('th', {}, [resolveHeaderLabel(col)])
            )));
        }

        tab.rows.forEach(row => {
            const cells = tab.columns.map(col => {
                const raw = row[col.key];
                let content = [];
                if (raw !== undefined && raw !== null) {
                    const lines = String(raw).split('\n');
                    content = lines.length > 1
                        ? lines.map(line => createElement('div', {}, [line]))
                        : [String(raw)];
                }
                return createElement('td', {}, content);
            });

            table.appendChild(createElement('tr', {}, cells));
        });

        tableContainer.appendChild(table);
    }

    // Create tab buttons
    tableSpec.tabs.forEach((tab, index) => {
        const tabButton = createElement('button', {
            class: `tab-button${index === 0 ? ' active' : ''}`,
            type: 'button',
            dataset: { tabIndex: index }
        }, [getLocalizedValue(tab.label) || tab.label]);

        tabButton.addEventListener('click', () => renderTab(index));
        tabNav.appendChild(tabButton);
    });

    // Render initial tab
    renderTab(0);

    return wrapper;
}

function renderGenericValue(container, key, value, sectionKey, parentKey) {
    if (key === 'title' || key === 'name' || !value) {
        return;
    }

    const isTableSpec = typeof value === 'object' && !Array.isArray(value)
        && (Array.isArray(value.rows) || Array.isArray(value.rowGroups));

    if (key === 'table' || isTableSpec) {
        const tableEl = renderTableFromSpec(value);
        if (tableEl) container.appendChild(tableEl);
        return;
    }

    // Handle img key with layered image structure
    if (key === 'img' && typeof value === 'object' && !Array.isArray(value)) {
        const imgWrapper = createElement('div', { class: 'guide-image-group' }, []);

        const layers = [
            { key: 'primary',   containerClass: 'image-layer-primary' },
            { key: 'secondary', containerClass: 'image-layer-secondary' },
            { key: 'tertiary',  containerClass: 'image-layer-tertiary' }
        ];

        layers.forEach(layer => {
            const layerData = value[layer.key];
            if (!layerData) return;

            const layerContainer = createElement('div', { 
                class: `image-layer ${layer.containerClass}` 
            }, []);

            const images = Array.isArray(layerData) ? layerData : [layerData];

            images.forEach(imgData => {
                const figure = createElement('figure', { class: 'guide-image-figure' }, []);
                
                let src, altText;
                
                if (typeof imgData === 'string') {
                    src = imgData;
                    altText = '';
                } else if (typeof imgData === 'object') {
                    src = imgData.src;
                    altText = getLocalizedValue(imgData.alt) || '';
                }

                const img = createElement('img', {
                    src: src,
                    alt: altText,
                    title: altText,
                    loading: 'lazy'
                }, []);
                img.addEventListener('click', () => openImageLightbox(src, altText));
                figure.appendChild(img);

                if (altText) {
                    const caption = createElement('figcaption', { class: 'guide-image-caption' }, [altText]);
                    figure.appendChild(caption);
                }

                layerContainer.appendChild(figure);
            });

            imgWrapper.appendChild(layerContainer);
        });

        container.appendChild(imgWrapper);
        return;
    }

    if (Array.isArray(value) || isLangLeaf(value)) {
        renderParagraphElements(value).forEach(el => container.appendChild(el));
        return;
    }

    if (typeof value === 'object') {
        const path = parentKey ? `${sectionKey}.${parentKey}.${key}` : `${sectionKey}.${key}`;
        const nestedSection = renderGenericSection(path, value);
        if (nestedSection) container.appendChild(nestedSection);
    }
}

function openImageLightbox(src, alt) {
    // Remove any existing lightbox
    closeImageLightbox();

    const overlay = createElement('div', { 
        class: 'image-lightbox-overlay',
        id: 'image-lightbox-overlay'
    }, []);

    const lightboxContent = createElement('div', { class: 'image-lightbox-content' }, []);

    const img = createElement('img', {
        src: src,
        alt: alt,
        class: 'lightbox-image'
    }, []);

    const closeBtn = createElement('button', {
        type: 'button',
        class: 'lightbox-close',
        'aria-label': 'Close image'
    }, ['×']);

    const altText = createElement('div', { class: 'lightbox-alt-text' }, [alt]);

    closeBtn.addEventListener('click', closeImageLightbox);
    
    lightboxContent.appendChild(closeBtn);
    lightboxContent.appendChild(img);
    if (alt) lightboxContent.appendChild(altText);
    overlay.appendChild(lightboxContent);

    overlay.addEventListener('click', (event) => {
        if (event.target === overlay) {
            closeImageLightbox();
        }
    });

    document.body.appendChild(overlay);
    document.body.classList.add('lightbox-open');
}

function closeImageLightbox() {
    const overlay = document.getElementById('image-lightbox-overlay');
    if (overlay) {
        overlay.remove();
    }
    document.body.classList.remove('lightbox-open');
}

function handleEscapeKey(event) {
    if (event.key === 'Escape') {
        const lightbox = document.getElementById('image-lightbox-overlay');
        if (lightbox) {
            closeImageLightbox();
            return;
        }
        closeGuide();
    }
}

function renderGenericSection(sectionKey, providedSection) {
    const section = providedSection || getTranslationObject(sectionKey);
    if (!section || typeof section !== 'object') {
        return null;
    }

    const sectionWrapper = createElement('div', { class: 'guide-generic-section' }, []);
    const sectionTitle = getLocalizedValue(section.title || section.name);
    if (sectionTitle) {
        sectionWrapper.appendChild(createElement('h3', { class: 'guide-generic-title' }, [sectionTitle]));
    }

    Object.entries(section).forEach(([key, value]) => {
        renderGenericValue(sectionWrapper, key, value, sectionKey, null);
    });

    return sectionWrapper;
}

function renderGuideContent(entry) {
    const contentWrapper = createElement('div', { class: 'guide-content' }, []);

    if (entry.introKey) {
        const introLines = getMultiline(entry.introKey);
        introLines.forEach(line => renderParagraphElements(line).forEach(el => contentWrapper.appendChild(el)));
    }

    if (entry.noticeKeys) {
        entry.noticeKeys.forEach(key => {
            const notice = getTranslation(key);
            if (notice) {
                renderParagraphElements(notice).forEach(el => {
                    el.classList.add('guide-notice');
                    contentWrapper.appendChild(el);
                });
            }
        });
    }

    if (entry.sectionKeys) {
        entry.sectionKeys.forEach(key => {
            const genericSection = renderGenericSection(key);
            if (genericSection) {
                contentWrapper.appendChild(genericSection);
            }
        });
    }

    if (entry.raidKeys) {
        entry.raidKeys.forEach(key => {
            const raidSection = renderRaidSection(key, entry.id);
            if (raidSection) {
                contentWrapper.appendChild(raidSection);
            }
        });
    }

    if (entry.extraTextKey) {
        const extraText = getTranslation(entry.extraTextKey);
        if (extraText) {
            renderParagraphElements(extraText).forEach(el => {
                el.classList.add('guide-extra-text');
                contentWrapper.appendChild(el);
            });
        }
    }

    return contentWrapper;
}

// ============================================================
// VARIANT CONFIG - defines what variants exist and their display properties
// ============================================================
const VARIANT_CONFIG = {
    diff3: {
        id: 'toggle-diff3',
        label: 'Hide D3 Variants',
        labelHidden: 'Show D3 Variants',
        cssClass: 'variant-block-diff3',
        headerClass: 'variant-header-diff3',
        defaultName: 'Difficulty 3 Variation'
    },
    solo: {
        id: 'toggle-solo',
        label: 'Hide Solo Variants',
        labelHidden: 'Show Solo Variants',
        cssClass: 'variant-block-solo',
        headerClass: 'variant-header-solo',
        defaultName: 'Solo Mode Variation'
    }
};

// ============================================================
// RENDER VARIANT BLOCKS
// ============================================================
function renderVariantBlock(variantData, variantKey) {
    const config = VARIANT_CONFIG[variantKey];
    if (!config || !variantData) return null;
    
    const wrapper = createElement('div', { class: `variant-block ${config.cssClass}` }, []);
    
    // Variant header
    const headerText = getLocalizedValue(variantData.name) || config.defaultName;
    const header = createElement('div', { class: `variant-header ${config.headerClass}` }, [headerText]);
    wrapper.appendChild(header);
    
    // Variant description
    if (variantData.description) {
        renderParagraphElements(variantData.description).forEach(el => {
            el.classList.add('variant-content');
            wrapper.appendChild(el);
        });
    }
    
    return wrapper;
}

function renderVariantsSection(variants) {
    if (!variants || typeof variants !== 'object') return null;
    
    const activeVariants = Object.keys(variants).filter(key => VARIANT_CONFIG[key]);
    if (activeVariants.length === 0) return null;
    
    const wrapper = createElement('div', { class: 'variants-container' }, []);
    
    activeVariants.forEach(key => {
        const variantBlock = renderVariantBlock(variants[key], key);
        if (variantBlock) wrapper.appendChild(variantBlock);
    });
    
    return wrapper;
}

// ============================================================
// CONTROL PANEL
// ============================================================
function createControlPanel(scrollContent) {
    // Check which variants actually exist in the content
    const activeVariants = Object.keys(VARIANT_CONFIG).filter(key => {
        return scrollContent.querySelector(`.${VARIANT_CONFIG[key].cssClass}`);
    });

    if (activeVariants.length === 0) return null;

    const panel = createElement('div', { class: 'guide-control-panel' }, []);
    
    activeVariants.forEach(key => {
        const config = VARIANT_CONFIG[key];
        const btn = createElement('button', {
            type: 'button',
            class: 'guide-control-btn',
            id: config.id,
            dataset: { active: 'true', variant: key }
        }, [config.label]);
        panel.appendChild(btn);
    });

    return panel;
}

function setupControlPanelListeners(panel, modal) {
    const scrollContent = modal.querySelector('.guide-modal-scroll');
    if (!scrollContent) return;

    panel.querySelectorAll('.guide-control-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const variantKey = btn.dataset.variant;
            const config = VARIANT_CONFIG[variantKey];
            if (!config) return;
            
            const isActive = btn.dataset.active === 'true';
            const blocks = scrollContent.querySelectorAll(`.${config.cssClass}`);
            
            blocks.forEach(block => {
                block.style.display = isActive ? 'none' : '';
            });
            
            btn.dataset.active = isActive ? 'false' : 'true';
            btn.textContent = isActive ? config.labelHidden : config.label;
        });
    });
}

function createGuideModal(entry) {
    const overlay = createElement('div', { id: GUIDE_OVERLAY_ID, class: 'guide-modal-overlay' }, []);
    const modal = createElement('div', { id: GUIDE_MODAL_ID, class: 'guide-modal' }, []);
    
    const closeButton = createElement('button', { 
        type: 'button', 
        class: 'guide-modal-close', 
        'aria-label': 'Close guide' 
    }, ['×']);
    closeButton.addEventListener('click', closeGuide);
    modal.appendChild(closeButton);

    const scrollContent = createElement('div', { class: 'guide-modal-scroll' }, []);
    const content = renderGuideContent(entry);
    scrollContent.appendChild(content);
    modal.appendChild(scrollContent);
    
    overlay.appendChild(modal);

    overlay.addEventListener('click', (event) => {
        if (event.target === overlay) {
            closeGuide();
        }
    });

    // Debug: Check if variant blocks exist in scrollContent
    console.log('Variant blocks in scrollContent:');
    console.log('  diff3:', scrollContent.querySelector('.variant-block-diff3'));
    console.log('  solo:', scrollContent.querySelector('.variant-block-solo'));
    console.log('  any variant-block:', scrollContent.querySelectorAll('.variant-block').length);
    console.log('  variants-container:', scrollContent.querySelector('.variants-container'));

    // Use a small delay to ensure DOM is ready
    setTimeout(() => {
        console.log('After timeout - variant blocks:', scrollContent.querySelectorAll('.variant-block').length);
        const controlPanel = createControlPanel(scrollContent);
        console.log('Control panel created:', controlPanel);
        if (controlPanel) {
            modal.appendChild(controlPanel);
            setupControlPanelListeners(controlPanel, modal);
        }
    }, 50);

    return overlay;
}

// ============================================================
// MECH STATUS ICONS CONFIG
// ============================================================
const MECH_STATUS_CONFIG = {
    unavoidable: {
        icon: 'images/unavoidable.png',
        info: 'Resurrection titles do not work during this mechanic.',
        class: 'mech-status-unavoidable'
    },
    iframe: {
        icon: 'images/iframe.png',
        info: 'This mechanic bypasses invincibility frames.',
        class: 'mech-status-iframe'
    },
    groggy: {
        icon: 'images/groggy.png',
        info: 'After mechanic is completed successfully, the boss enters groggy state.',
        class: 'mech-status-groggy'
    },
    heal: {
        icon: 'images/heal.png',
        info: 'Failing to meet the condition results in boss healing.',
        class: 'mech-status-heal'
    },
    timed: {
        icon: 'images/timed.png',
        info: 'This mechanic has a time limit before failure.',
        class: 'mech-status-timed'
    }
};

function createStatusIcon(statusKey, customLabel, showText = false) {
    const config = MECH_STATUS_CONFIG[statusKey];
    if (!config) return null;
    
    // Only use customLabel if provided, otherwise use config.label
    // If showText is true but no label exists, don't show any text
    const labelText = customLabel || config.label || null;
    const tooltipText = config.info || '';
    
    const icon = createElement('span', {
        class: `mech-status-icon ${config.class}`,
        dataset: { tooltip: tooltipText }
    }, []);
    
    const img = createElement('img', {
        src: config.icon,
        alt: statusKey,
        loading: 'lazy'
    }, []);
    icon.appendChild(img);
    
    // Only add label if showText is true AND we have text to show
    if (showText && labelText) {
        const label = createElement('span', { class: 'mech-status-label' }, [labelText]);
        icon.appendChild(label);
    }
    
    // Tooltip on hover
    icon.addEventListener('mouseenter', (e) => {
        const tooltip = createElement('div', { class: 'mech-status-tooltip' }, [tooltipText]);
        tooltip.style.position = 'fixed';
        document.body.appendChild(tooltip);
        
        const rect = icon.getBoundingClientRect();
        tooltip.style.left = rect.left + 'px';
        tooltip.style.top = (rect.bottom + 6) + 'px';
        
        icon._tooltip = tooltip;
    });
    
    icon.addEventListener('mouseleave', () => {
        if (icon._tooltip) {
            icon._tooltip.remove();
            icon._tooltip = null;
        }
    });
    
    return icon;
}

function renderStatusIcons(item, showText = false) {
    if (!item || typeof item !== 'object') return [];
    
    const icons = [];
    Object.keys(MECH_STATUS_CONFIG).forEach(statusKey => {
        if (item[statusKey] !== undefined && item[statusKey] !== false) {
            const value = item[statusKey];
            // If value is a string, use it as custom label
            // If true, use default label from config
            const customLabel = typeof value === 'string' ? value : null;
            
            const icon = createStatusIcon(statusKey, customLabel, showText);
            if (icon) icons.push(icon);
        }
    });
    
    return icons;
}

function openGuide(guideId) {
    const entry = guideData.find(item => item.id === guideId);
    if (!entry) {
        console.warn(`Guide not found: ${guideId}`);
        return;
    }

    closeGuide();

    const overlay = createGuideModal(entry);
    document.body.appendChild(overlay);
    
    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
        initConceptTriggers(overlay);
        initTableNotes(overlay);
        if (window.translationManager?.applyTranslations) {
            window.translationManager.applyTranslations(overlay);
        }
        if (window.updateTableVisibility) {
            window.updateTableVisibility(overlay);
        }
    });
    
    document.body.classList.add('guide-modal-open');
}

function closeGuide() {
    const overlay = document.getElementById(GUIDE_OVERLAY_ID);
    if (overlay) {
        overlay.classList.add('animate-close-down');
        overlay.addEventListener('animationend', () => {
            overlay.remove();
        }, { once: true });
    }
    document.body.classList.remove('guide-modal-open');
}

function getCategoryLabel(category) {
    const label = getTranslation(`general.guide_sections.${category}`);
    return label || CATEGORY_LABELS[category] || CATEGORY_LABELS.misc;
}

function renderGuideCard(entry) {
    const card = createElement('article', {
        class: 'guide-card',
        dataset: { guideId: entry.id }
    }, []);

    const titleText = getTranslation(entry.titleKey) || entry.id;
    const content = createElement('div', { class: 'guide-card-content' }, [
        createElement('div', { class: 'guide-card-icon' }, []),
        createElement('div', { class: 'guide-card-text' }, [
            createElement('div', { class: 'guide-card-title' }, [titleText])
        ])
    ]);

    card.appendChild(content);
    return card;
}

function buildGuideIndex() {
    const listContainer = document.getElementById('guide-list');
    if (!listContainer) {
        return;
    }

    listContainer.innerHTML = '';
    const grouped = {};

    // Group entries by category
    guideData.forEach(entry => {
        const category = entry.category || 'misc';
        if (!grouped[category]) grouped[category] = [];
        grouped[category].push(entry);
    });

    CATEGORY_ORDER.forEach(category => {
        const entries = grouped[category];
        if (!entries || !entries.length) return;

        const section = createElement('section', { class: 'guide-section' }, []);
        section.appendChild(createElement('h2', { class: 'guide-section-title' }, [getCategoryLabel(category)]));

        if (category === 'raid') {
            // further group raids by 'belongsto'
            const byRaid = {};
            entries.forEach(e => {
                const owner = e.belongsto || 'Other';
                if (!byRaid[owner]) byRaid[owner] = [];
                byRaid[owner].push(e);
            });

            Object.keys(byRaid).forEach(owner => {
                section.appendChild(createElement('div', { class: 'raid-owner-title' }, [owner]));
                const grid = createElement('div', { class: 'guide-section-grid' }, []);
                byRaid[owner].forEach(entry => grid.appendChild(renderGuideCard(entry)));
                section.appendChild(grid);
            });
        } else {
            const grid = createElement('div', { class: 'guide-section-grid' }, []);
            entries.forEach(entry => grid.appendChild(renderGuideCard(entry)));
            section.appendChild(grid);
        }

        listContainer.appendChild(section);
    });
}

function handleGuideLinkClick(event) {
    const button = event.target.closest('[data-guide-id]');
    if (!button) {
        return;
    }

    event.preventDefault();
    event.stopImmediatePropagation();
    const guideId = button.dataset.guideId;
    if (guideId) {
        openGuide(guideId);
    }
}

function initializeGuideManager() {
    buildGuideIndex();

    document.body.addEventListener('click', handleGuideLinkClick);
    document.addEventListener('keydown', handleEscapeKey);
}

window.openGuide = openGuide;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeGuideManager);
} else {
    initializeGuideManager();
}