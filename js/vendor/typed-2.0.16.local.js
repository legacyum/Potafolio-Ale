/*
 * Typed Lite (API compatible subset)
 * Local deterministic replacement for typed.js used in this portfolio.
 */
(function (window, document) {
    'use strict';

    class Typed {
        constructor(selector, options = {}) {
            this.element = document.querySelector(selector);
            if (!this.element) {
                return;
            }

            this.strings = Array.isArray(options.strings) ? options.strings : [];
            this.typeSpeed = options.typeSpeed || 80;
            this.backSpeed = options.backSpeed || 50;
            this.backDelay = options.backDelay || 1000;
            this.loop = Boolean(options.loop);

            this.stringIndex = 0;
            this.charIndex = 0;
            this.isDeleting = false;

            this.tick = this.tick.bind(this);
            this.tick();
        }

        tick() {
            if (!this.element || !this.strings.length) {
                return;
            }

            const current = this.strings[this.stringIndex] || '';

            if (this.isDeleting) {
                this.charIndex -= 1;
            } else {
                this.charIndex += 1;
            }

            this.element.textContent = current.substring(0, this.charIndex);

            let timeout = this.isDeleting ? this.backSpeed : this.typeSpeed;

            if (!this.isDeleting && this.charIndex >= current.length) {
                timeout = this.backDelay;
                this.isDeleting = true;
            } else if (this.isDeleting && this.charIndex <= 0) {
                this.isDeleting = false;
                this.stringIndex += 1;

                if (this.stringIndex >= this.strings.length) {
                    this.stringIndex = this.loop ? 0 : this.strings.length - 1;
                }

                timeout = 450;
            }

            window.setTimeout(this.tick, timeout);
        }
    }

    window.Typed = Typed;
}(window, document));
