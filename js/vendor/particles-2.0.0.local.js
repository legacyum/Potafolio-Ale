/*
 * Particles Lite (API compatible subset)
 * Local deterministic replacement for particles.js with simple linked dots.
 */
(function (window, document) {
    'use strict';

    function particlesJS(containerId, config = {}) {
        const container = document.getElementById(containerId);
        if (!container) {
            return;
        }

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.style.position = 'absolute';
        canvas.style.inset = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.zIndex = '0';
        canvas.setAttribute('aria-hidden', 'true');
        container.innerHTML = '';
        container.appendChild(canvas);

        const particleCount = config.particles?.number?.value || 70;
        const dotColor = config.particles?.color?.value || '#60a5fa';
        const lineColor = config.particles?.line_linked?.color || '#60a5fa';
        const maxDistance = config.particles?.line_linked?.distance || 140;
        const speed = config.particles?.move?.speed || 1.2;

        let width = 0;
        let height = 0;
        const particles = [];

        function resize() {
            width = container.clientWidth;
            height = container.clientHeight;
            canvas.width = width;
            canvas.height = height;
        }

        function createParticles() {
            particles.length = 0;
            for (let i = 0; i < particleCount; i += 1) {
                particles.push({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    vx: (Math.random() - 0.5) * speed,
                    vy: (Math.random() - 0.5) * speed,
                    radius: 1.5 + Math.random() * 2.2
                });
            }
        }

        function update() {
            ctx.clearRect(0, 0, width, height);

            for (let i = 0; i < particles.length; i += 1) {
                const p = particles[i];
                p.x += p.vx;
                p.y += p.vy;

                if (p.x < 0 || p.x > width) p.vx *= -1;
                if (p.y < 0 || p.y > height) p.vy *= -1;

                ctx.beginPath();
                ctx.fillStyle = dotColor;
                ctx.globalAlpha = 0.7;
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fill();
            }

            for (let i = 0; i < particles.length; i += 1) {
                for (let j = i + 1; j < particles.length; j += 1) {
                    const a = particles[i];
                    const b = particles[j];
                    const dx = a.x - b.x;
                    const dy = a.y - b.y;
                    const distance = Math.sqrt((dx * dx) + (dy * dy));

                    if (distance <= maxDistance) {
                        const alpha = 0.18 * (1 - (distance / maxDistance));
                        ctx.beginPath();
                        ctx.strokeStyle = lineColor;
                        ctx.globalAlpha = alpha;
                        ctx.moveTo(a.x, a.y);
                        ctx.lineTo(b.x, b.y);
                        ctx.stroke();
                    }
                }
            }

            ctx.globalAlpha = 1;
            window.requestAnimationFrame(update);
        }

        resize();
        createParticles();
        update();

        window.addEventListener('resize', () => {
            resize();
            createParticles();
        });
    }

    window.particlesJS = particlesJS;
}(window, document));
