// Scroll-based primary color blending toward red near #varnimyr
(function(){
    const target = document.getElementById('varnimyr');
    if (!target) return;

    const body = document.body;
    const computed = getComputedStyle(body).getPropertyValue('--primary-color').trim() || '#ffe066';
    const computedLight = getComputedStyle(body).getPropertyValue('--primary-light').trim() || computed;
    const targetHex = '#ff6b6b';
    const threshold = 1200; // px at which blending reaches full
    let lastY = window.scrollY;
    let locked = false;

    function parseColor(input) {
        input = input.trim();
        if (input.startsWith('#')) {
            const hex = input.slice(1);
            const bigint = parseInt(hex.length === 3 ? hex.split('').map(c=>c+c).join('') : hex, 16);
            return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
        }
        const m = input.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (m) return [Number(m[1]), Number(m[2]), Number(m[3])];
        return [255,224,102];
    }

    function rgbToHex([r,g,b]){
        return '#' + [r,g,b].map(n=>n.toString(16).padStart(2,'0')).join('');
    }

    const fromRGB = parseColor(computed);
    const toRGB = parseColor(targetHex);

    function lerp(a,b,t){ return Math.round(a + (b-a)*t); }

    function mixColor(t){
        const r = lerp(fromRGB[0], toRGB[0], t);
        const g = lerp(fromRGB[1], toRGB[1], t);
        const b = lerp(fromRGB[2], toRGB[2], t);
        return rgbToHex([r,g,b]);
    }

    function update(){
        const rect = target.getBoundingClientRect();
        const distance = Math.max(rect.top, 0); // distance from viewport top
        const ratio = Math.max(0, Math.min(1, 1 - distance/threshold));
        const scrollingDown = window.scrollY > lastY;
        const scrollingUp = window.scrollY < lastY;
        lastY = window.scrollY;

        // If locked to red and user scrolls up away from the element, unlock and restore
        if (locked && scrollingUp && rect.top > 0) {
            locked = false;
            body.classList.remove('color-red');
            body.style.setProperty('--primary-color', computed);
            body.style.setProperty('--primary-light', computedLight);
            return;
        }

        // If we've scrolled past the element while downscrolling, lock to red
        if (!locked && scrollingDown && rect.top <= 0) {
            body.classList.add('color-red');
            // remove inline overrides so the class rules take full effect
            body.style.removeProperty('--primary-color');
            body.style.removeProperty('--primary-light');
            locked = true;
            return;
        }

        // If not locked, blend according to proximity (works both directions)
        if (!locked) {
            if (ratio > 0) {
                const color = mixColor(ratio);
                body.style.setProperty('--primary-color', color);
                body.style.setProperty('--primary-light', color);
            } else {
                // restore original when far
                body.style.setProperty('--primary-color', computed);
                body.style.setProperty('--primary-light', computedLight);
            }
        }
    }

    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    // initial call in case already near
    update();
})();
