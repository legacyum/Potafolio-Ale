/*
 * ScrollReveal Lite (API compatible subset)
 * Local deterministic replacement for basic reveal animations.
 */
(function (window, document) {
    'use strict';

    const defaults = {
        distance: '60px',
        duration: 800,
        delay: 0,
        origin: 'bottom'
    };

    let globalConfig = { ...defaults };

    function getTransform(origin, distance) {
        const map = {
            top: `translateY(-${distance})`,
            bottom: `translateY(${distance})`,
            left: `translateX(-${distance})`,
            right: `translateX(${distance})`
        };
        return map[origin] || map.bottom;
    }

    function revealElements(selector, options) {
        const cfg = { ...globalConfig, ...options };
        const elements = document.querySelectorAll(selector);

        if (!elements.length) {
            return;
        }

        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) {
                    return;
                }

                const el = entry.target;
                const elementDelay = Number(el.dataset.srDelay || cfg.delay);

                window.setTimeout(() => {
                    el.style.opacity = '1';
                    el.style.transform = 'translate(0, 0)';
                }, elementDelay);

                obs.unobserve(el);
            });
        }, {
            threshold: 0.15,
            rootMargin: '0px 0px -40px 0px'
        });

        elements.forEach((el) => {
            el.style.opacity = '0';
            el.style.transform = getTransform(cfg.origin, cfg.distance);
            el.style.transition = `opacity ${cfg.duration}ms ease, transform ${cfg.duration}ms ease`;
            observer.observe(el);
        });
    }

    function ScrollReveal(config) {
        if (config && typeof config === 'object') {
            globalConfig = { ...globalConfig, ...config };
        }

        return {
            reveal: revealElements
        };
    }

    window.ScrollReveal = ScrollReveal;
}(window, document));
