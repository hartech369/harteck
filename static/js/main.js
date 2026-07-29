document.addEventListener('DOMContentLoaded', () => {

    /* =============================================
       THREE.JS — Hero: Particle Sphere + Network
    ============================================= */
    const container = document.getElementById('three-container');
    if (container && typeof THREE !== 'undefined') {
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(innerWidth, innerHeight);
        renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
        container.appendChild(renderer.domElement);

        const isMobile = innerWidth < 768;
        const SPHERE_RADIUS = isMobile ? 5 : 7;
        const SPHERE_PARTICLES = isMobile ? 2000 : 5000;
        const AMBIENT_COUNT = isMobile ? 100 : 300;
        const CONNECTION_DIST = isMobile ? 1.8 : 2.2;
        const SPHERE_OFFSET_X = isMobile ? 0 : 4;
        camera.position.z = isMobile ? 16 : 18;

        /* --- Particle Sphere (Fibonacci distribution) --- */
        const sphereGeo = new THREE.BufferGeometry();
        const sPos = new Float32Array(SPHERE_PARTICLES * 3);
        const sOrig = new Float32Array(SPHERE_PARTICLES * 3);
        const sColors = new Float32Array(SPHERE_PARTICLES * 3);
        const golden = Math.PI * (3 - Math.sqrt(5));

        for (let i = 0; i < SPHERE_PARTICLES; i++) {
            const y = 1 - (i / (SPHERE_PARTICLES - 1)) * 2;
            const r = Math.sqrt(1 - y * y);
            const theta = golden * i;
            const x = Math.cos(theta) * r;
            const z = Math.sin(theta) * r;
            sPos[i * 3] = x * SPHERE_RADIUS;
            sPos[i * 3 + 1] = y * SPHERE_RADIUS;
            sPos[i * 3 + 2] = z * SPHERE_RADIUS;
            sOrig[i * 3] = sPos[i * 3];
            sOrig[i * 3 + 1] = sPos[i * 3 + 1];
            sOrig[i * 3 + 2] = sPos[i * 3 + 2];
            /* Color gradient: blue at poles → cyan at equator */
            const t = Math.abs(y);
            sColors[i * 3] = 0.23 + t * 0.02;
            sColors[i * 3 + 1] = 0.51 + (1 - t) * 0.2;
            sColors[i * 3 + 2] = 0.96;
        }
        sphereGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3));
        sphereGeo.setAttribute('color', new THREE.BufferAttribute(sColors, 3));

        const sphereMat = new THREE.PointsMaterial({
            size: isMobile ? 0.04 : 0.055,
            vertexColors: true,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true
        });
        const sphere = new THREE.Points(sphereGeo, sphereMat);
        sphere.position.x = SPHERE_OFFSET_X;
        scene.add(sphere);

        /* --- Wireframe Globe (subtle) --- */
        const globe = new THREE.Mesh(
            new THREE.IcosahedronGeometry(SPHERE_RADIUS * 0.98, 3),
            new THREE.MeshBasicMaterial({ color: 0x3B82F6, wireframe: true, transparent: true, opacity: 0.04 })
        );
        globe.position.x = SPHERE_OFFSET_X;
        scene.add(globe);

        /* --- Connection Lines (network effect) --- */
        const lineGeo = new THREE.BufferGeometry();
        const lineMat = new THREE.LineBasicMaterial({ color: 0x3B82F6, transparent: true, opacity: 0.06, blending: THREE.AdditiveBlending });
        const lines = new THREE.LineSegments(lineGeo, lineMat);
        lines.position.x = SPHERE_OFFSET_X;
        scene.add(lines);

        function updateConnections() {
            const pos = sphereGeo.attributes.position.array;
            const linePositions = [];
            const step = isMobile ? 8 : 4;
            for (let i = 0; i < SPHERE_PARTICLES; i += step) {
                for (let j = i + step; j < SPHERE_PARTICLES; j += step) {
                    const dx = pos[i*3]-pos[j*3], dy = pos[i*3+1]-pos[j*3+1], dz = pos[i*3+2]-pos[j*3+2];
                    const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
                    if (dist < CONNECTION_DIST) {
                        linePositions.push(pos[i*3], pos[i*3+1], pos[i*3+2]);
                        linePositions.push(pos[j*3], pos[j*3+1], pos[j*3+2]);
                    }
                }
            }
            lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
        }
        updateConnections();

        /* --- Ambient floating particles --- */
        const ambGeo = new THREE.BufferGeometry();
        const ambPos = new Float32Array(AMBIENT_COUNT * 3);
        for (let i = 0; i < AMBIENT_COUNT * 3; i++) ambPos[i] = (Math.random() - 0.5) * 40;
        ambGeo.setAttribute('position', new THREE.BufferAttribute(ambPos, 3));
        scene.add(new THREE.Points(ambGeo, new THREE.PointsMaterial({
            color: 0x3B82F6, size: 0.03, transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending
        })));

        /* --- Glow ring around sphere --- */
        const glowRing = new THREE.Mesh(
            new THREE.TorusGeometry(SPHERE_RADIUS * 1.15, 0.015, 16, 100),
            new THREE.MeshBasicMaterial({ color: 0x3B82F6, transparent: true, opacity: 0.08, blending: THREE.AdditiveBlending })
        );
        glowRing.position.x = SPHERE_OFFSET_X;
        glowRing.rotation.x = Math.PI / 2.2;
        scene.add(glowRing);
        const glowRing2 = new THREE.Mesh(
            new THREE.TorusGeometry(SPHERE_RADIUS * 1.25, 0.01, 16, 100),
            new THREE.MeshBasicMaterial({ color: 0x06B6D4, transparent: true, opacity: 0.05, blending: THREE.AdditiveBlending })
        );
        glowRing2.position.x = SPHERE_OFFSET_X;
        glowRing2.rotation.x = Math.PI / 3;
        glowRing2.rotation.z = Math.PI / 5;
        scene.add(glowRing2);

        /* --- Mouse tracking --- */
        let mouseX = 0, mouseY = 0;
        addEventListener('mousemove', e => {
            mouseX = (e.clientX / innerWidth - 0.5) * 2;
            mouseY = (e.clientY / innerHeight - 0.5) * 2;
        });

        /* --- Animation loop --- */
        let time = 0;
        (function loop() {
            requestAnimationFrame(loop);
            time += 0.008;

            /* Rotate sphere slowly */
            sphere.rotation.y = time * 0.3;
            sphere.rotation.x = Math.sin(time * 0.2) * 0.1;
            globe.rotation.y = time * 0.3;
            globe.rotation.x = Math.sin(time * 0.2) * 0.1;

            /* Mouse influence on sphere rotation */
            sphere.rotation.y += mouseX * 0.15;
            sphere.rotation.x += mouseY * 0.1;

            /* Pulse particle sizes subtly */
            sphereMat.size = (isMobile ? 0.04 : 0.055) + Math.sin(time * 2) * 0.008;

            /* Rotate rings */
            glowRing.rotation.z = time * 0.2;
            glowRing2.rotation.y = time * 0.15;

            /* Mouse displacement on particles */
            const pos = sphereGeo.attributes.position.array;
            for (let i = 0; i < SPHERE_PARTICLES; i++) {
                const ix = i * 3, iy = i * 3 + 1, iz = i * 3 + 2;
                /* Subtle breathing */
                const breathe = Math.sin(time * 1.5 + i * 0.01) * 0.08;
                /* Mouse push */
                const worldX = pos[ix], worldY = pos[iy];
                const screenX = worldX / SPHERE_RADIUS;
                const screenY = worldY / SPHERE_RADIUS;
                const dx = screenX - mouseX, dy = screenY - mouseY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const push = dist < 0.8 ? (0.8 - dist) * 0.6 : 0;
                const pushX = dist > 0.01 ? (dx / dist) * push : 0;
                const pushY = dist > 0.01 ? (dy / dist) * push : 0;

                pos[ix] = sOrig[ix] * (1 + breathe) + pushX;
                pos[iy] = sOrig[iy] * (1 + breathe) + pushY;
                pos[iz] = sOrig[iz] * (1 + breathe);
            }
            sphereGeo.attributes.position.needsUpdate = true;

            /* Update connections every few frames */
            if (Math.floor(time * 60) % 6 === 0) updateConnections();

            /* Camera follows mouse slightly, aims left so sphere is on right */
            camera.position.x += (-SPHERE_OFFSET_X * 0.3 + mouseX * 1.5 - camera.position.x) * 0.015;
            camera.position.y += (-mouseY * 1.5 - camera.position.y) * 0.015;
            camera.lookAt(-SPHERE_OFFSET_X * 0.3, 0, 0);

            renderer.render(scene, camera);
        })();

        addEventListener('resize', () => {
            camera.aspect = innerWidth / innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(innerWidth, innerHeight);
        });
    }

    /* =============================================
       CUSTOM CURSOR
    ============================================= */
    if (innerWidth > 768) {
        const dot = document.getElementById('cursorDot');
        const fol = document.getElementById('cursorFollower');
        if (dot && fol) {
            let mx = 0, my = 0, fx = 0, fy = 0;
            addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; dot.style.left = mx + 'px'; dot.style.top = my + 'px'; });
            document.querySelectorAll('a,button,.card-3d,.bento-item,.industry-pill,input,textarea,select').forEach(el => {
                el.addEventListener('mouseenter', () => fol.classList.add('hover'));
                el.addEventListener('mouseleave', () => fol.classList.remove('hover'));
            });
            (function loop() { fx += (mx - fx) * 0.08; fy += (my - fy) * 0.08; fol.style.left = fx + 'px'; fol.style.top = fy + 'px'; requestAnimationFrame(loop); })();
        }
    }

    /* =============================================
       PROGRESS BAR
    ============================================= */
    const bar = document.getElementById('progressBar');
    if (bar) addEventListener('scroll', () => { bar.style.width = `${(scrollY / (document.documentElement.scrollHeight - innerHeight)) * 100}%`; });

    /* =============================================
       COUNTERS
    ============================================= */
    document.querySelectorAll('.counter-n').forEach(el => {
        new IntersectionObserver((entries, obs) => {
            entries.forEach(e => {
                if (!e.isIntersecting) return;
                const target = parseInt(el.dataset.target || '0');
                let cur = 0; const step = Math.max(1, Math.ceil(target / 112));
                const iv = setInterval(() => { cur += step; if (cur >= target) { cur = target; clearInterval(iv); } el.textContent = cur + (target >= 99 ? '' : '+'); }, 16);
                obs.unobserve(el);
            });
        }, { threshold: 0.5 }).observe(el);
    });

    /* =============================================
       3D TILT CARDS
    ============================================= */
    document.querySelectorAll('.card-3d,.bento-item').forEach(card => {
        card.classList.add('tilt-card');
        const shine = document.createElement('div'); shine.classList.add('tilt-shine'); card.appendChild(shine);
        card.addEventListener('mousemove', e => {
            const r = card.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
            const rx = ((y - r.height / 2) / (r.height / 2)) * -6;
            const ry = ((x - r.width / 2) / (r.width / 2)) * 6;
            card.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px) scale(1.01)`;
            card.style.setProperty('--mouse-x', `${(x / r.width) * 100}%`);
            card.style.setProperty('--mouse-y', `${(y / r.height) * 100}%`);
            card.style.boxShadow = `${-ry * 2}px ${rx * 2}px 40px rgba(0,0,0,0.3)`;
        });
        card.addEventListener('mouseleave', () => { card.style.transform = ''; card.style.boxShadow = ''; });
    });

    /* =============================================
       GSAP + SCROLLTRIGGER — ALL ANIMATIONS
    ============================================= */
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);

        /* --- Hero entrance (no scroll — on load) --- */
        gsap.fromTo('.hero-section .inline-flex', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', delay: 0.2 });
        gsap.fromTo('.hero-section h1', { opacity: 0, y: 60 }, { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out', delay: 0.4 });
        gsap.fromTo('.hero-section > .container p', { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', delay: 0.7 });
        gsap.fromTo('.hero-section .flex.flex-wrap', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', delay: 0.9 });
        gsap.fromTo('.hero-section > .container > .inner > .grid', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', delay: 1.1 });

        /* --- ALL scroll-animated elements --- */
        const scrollEls = document.querySelectorAll('.reveal, .rl, .rr, .rs');
        scrollEls.forEach(el => {
            /* Skip hero elements — already animated on load */
            if (el.closest('.hero-section')) return;

            const isL = el.classList.contains('rl');
            const isR = el.classList.contains('rr');
            const isS = el.classList.contains('rs');

            gsap.fromTo(el,
                { opacity: 0, x: isL ? -50 : isR ? 50 : 0, y: (!isL && !isR && !isS) ? 40 : 0, scale: isS ? 0.92 : 1 },
                {
                    opacity: 1, x: 0, y: 0, scale: 1, duration: 0.9, ease: 'power2.out',
                    scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none none' }
                }
            );
        });

        /* --- Parallax on bento images --- */
        document.querySelectorAll('.bento-img').forEach(img => {
            gsap.fromTo(img, { y: -20 }, { y: 20, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: 1 } });
        });

        /* --- Footer --- */
        gsap.fromTo('footer .text-center', { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 1, ease: 'power2.out', scrollTrigger: { trigger: 'footer', start: 'top 90%', toggleActions: 'play none none none' } });
    }

    /* =============================================
       NAVBAR
    ============================================= */
    const navbar = document.getElementById('navbar');
    if (navbar) addEventListener('scroll', () => { navbar.style.background = scrollY > 80 ? 'rgba(11,15,25,0.85)' : 'transparent'; });

    /* =============================================
       LUCIDE ICONS
    ============================================= */
    if (typeof lucide !== 'undefined') lucide.createIcons();
});