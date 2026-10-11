// auth.js — Next-Gen Cosmic Glassmorphism Authentication & Canvas Effects

// ── Supabase config ─────────────────────────────────────────────────────────
const SUPABASE_URL  = 'https://uokcpwxumfkvissnntuy.supabase.co';
const SUPABASE_KEY  = 'sb_publishable_50bVPIVMnVTCZroq0AVgjg_l1fQfmDq';
const FALLBACK_PASS = 'whimsical'; // used when offline

const _supabase = (window.supabase && window.supabase.createClient)
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY)
    : null;

async function getPassword() {
    if (_supabase) {
        try {
            const { data, error } = await _supabase
                .from('config')
                .select('value')
                .eq('key', 'password')
                .single();
            if (!error && data) return data.value;
        } catch (_) {}
    }
    // offline or error — fall back to local
    return FALLBACK_PASS;
}

document.addEventListener('DOMContentLoaded', () => {
    // ── Element References ──────────────────────────────────────────────────
    const form            = document.getElementById('login-form');
    const passwordEl      = document.getElementById('password');
    const inputBox        = document.getElementById('input-box');
    const lockIcon        = document.getElementById('lock-icon');
    const errorMsg        = document.getElementById('error-msg');
    const errorText       = document.getElementById('error-text');
    const btnText         = document.getElementById('btn-text');
    const btnIcon         = document.getElementById('btn-icon');
    const submitBtn       = document.getElementById('submit-btn');
    const toggleBtn       = document.getElementById('toggle-password');
    const eyeIcon         = document.getElementById('eye-icon');
    const toast           = document.getElementById('access-toast');
    const errorToast      = document.getElementById('error-toast');
    const cardContainer   = document.getElementById('card-container');
    const capsLockWarning = document.getElementById('caps-lock-warning');
    const canvas          = document.getElementById('space-canvas');

    // ── Lucide Icon Refresh Helper ──────────────────────────────────────────
    function refreshIcons() {
        if (window.lucide && typeof window.lucide.createIcons === 'function') {
            window.lucide.createIcons();
        }
    }
    refreshIcons();

    // ── 1. Cosmic Interactive Starfield & Canvas ────────────────────────────
    let isWarpActive = false;

    if (canvas) {
        const ctx = canvas.getContext('2d');
        let width = (canvas.width = window.innerWidth);
        let height = (canvas.height = window.innerHeight);

        let mouse = { x: -1000, y: -1000, radius: 140 };

        window.addEventListener('mousemove', (e) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
        });

        window.addEventListener('mouseleave', () => {
            mouse.x = -1000;
            mouse.y = -1000;
        });

        // Touch support for interactive constellations on mobile
        window.addEventListener('touchstart', (e) => {
            if (e.touches && e.touches[0]) {
                mouse.x = e.touches[0].clientX;
                mouse.y = e.touches[0].clientY;
            }
        }, { passive: true });

        window.addEventListener('touchmove', (e) => {
            if (e.touches && e.touches[0]) {
                mouse.x = e.touches[0].clientX;
                mouse.y = e.touches[0].clientY;
            }
        }, { passive: true });

        window.addEventListener('touchend', () => {
            mouse.x = -1000;
            mouse.y = -1000;
        }, { passive: true });

        const starColors = ['#ffffff', '#f5d0fe', '#c084fc', '#818cf8', '#38bdf8'];
        const STAR_COUNT = Math.min(130, Math.floor((width * height) / 9000));
        const stars = [];

        class Star {
            constructor() {
                this.reset();
            }

            reset() {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.z = Math.random() * width;
                this.size = Math.random() * 1.8 + 0.4;
                this.color = starColors[Math.floor(Math.random() * starColors.length)];
                this.alpha = Math.random() * 0.7 + 0.2;
                this.twinkleFactor = Math.random() * 0.03 + 0.008;
                this.twinkleDir = Math.random() > 0.5 ? 1 : -1;
                this.vx = (Math.random() - 0.5) * 0.25;
                this.vy = (Math.random() - 0.5) * 0.25;
            }

            update() {
                if (isWarpActive) {
                    this.z -= 28;
                    if (this.z <= 0) {
                        this.z = width;
                        this.x = Math.random() * width;
                        this.y = Math.random() * height;
                    }
                    return;
                }

                this.alpha += this.twinkleFactor * this.twinkleDir;
                if (this.alpha > 0.9) {
                    this.alpha = 0.9;
                    this.twinkleDir = -1;
                } else if (this.alpha < 0.15) {
                    this.alpha = 0.15;
                    this.twinkleDir = 1;
                }

                this.x += this.vx;
                this.y += this.vy;

                if (this.x < 0) this.x = width;
                if (this.x > width) this.x = 0;
                if (this.y < 0) this.y = height;
                if (this.y > height) this.y = 0;
            }

            draw() {
                ctx.save();

                if (isWarpActive) {
                    const cx = width / 2;
                    const cy = height / 2;
                    const k = 260 / this.z;
                    const px = (this.x - cx) * k + cx;
                    const py = (this.y - cy) * k + cy;

                    const prevK = 260 / (this.z + 45);
                    const prevPx = (this.x - cx) * prevK + cx;
                    const prevPy = (this.y - cy) * prevK + cy;

                    ctx.strokeStyle = '#e9d5ff';
                    ctx.lineWidth = Math.max(0.5, (1 - this.z / width) * 3);
                    ctx.beginPath();
                    ctx.moveTo(prevPx, prevPy);
                    ctx.lineTo(px, py);
                    ctx.stroke();
                    ctx.restore();
                    return;
                }

                ctx.globalAlpha = this.alpha;
                ctx.fillStyle = this.color;
                if (this.size > 1.2) {
                    ctx.shadowBlur = 6;
                    ctx.shadowColor = this.color;
                }
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        }

        // Shooting Star
        let shootingStar = null;
        class ShootingStar {
            constructor() {
                this.x = Math.random() * (width * 0.7);
                this.y = Math.random() * (height * 0.35);
                this.length = Math.random() * 90 + 70;
                this.speed = Math.random() * 9 + 7;
                this.angle = Math.PI / 4 + (Math.random() - 0.5) * 0.2;
                this.alpha = 1;
                this.life = 0;
                this.maxLife = 45;
            }

            update() {
                this.x += Math.cos(this.angle) * this.speed;
                this.y += Math.sin(this.angle) * this.speed;
                this.life++;
                this.alpha = Math.max(0, 1 - this.life / this.maxLife);
            }

            draw() {
                ctx.save();
                ctx.globalAlpha = this.alpha;
                ctx.strokeStyle = '#e879f9';
                ctx.lineWidth = 1.6;
                ctx.shadowBlur = 10;
                ctx.shadowColor = '#c084fc';
                ctx.beginPath();
                ctx.moveTo(this.x, this.y);
                ctx.lineTo(
                    this.x - Math.cos(this.angle) * this.length,
                    this.y - Math.sin(this.angle) * this.length
                );
                ctx.stroke();
                ctx.restore();
            }
        }

        for (let i = 0; i < STAR_COUNT; i++) {
            stars.push(new Star());
        }

        function drawConstellations() {
            if (isWarpActive) return;

            for (let i = 0; i < stars.length; i++) {
                const s1 = stars[i];

                // Mouse constellation links
                const dxMouse = mouse.x - s1.x;
                const dyMouse = mouse.y - s1.y;
                const distMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);

                if (distMouse < mouse.radius) {
                    ctx.save();
                    const lineAlpha = (1 - distMouse / mouse.radius) * 0.35;
                    ctx.strokeStyle = `rgba(192, 132, 252, ${lineAlpha})`;
                    ctx.lineWidth = 0.8;
                    ctx.beginPath();
                    ctx.moveTo(s1.x, s1.y);
                    ctx.lineTo(mouse.x, mouse.y);
                    ctx.stroke();
                    ctx.restore();
                }

                // Star neighbor links
                for (let j = i + 1; j < stars.length; j++) {
                    const s2 = stars[j];
                    const dx = s1.x - s2.x;
                    const dy = s1.y - s2.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < 85) {
                        ctx.save();
                        const lineAlpha = (1 - dist / 85) * 0.14;
                        ctx.strokeStyle = `rgba(168, 85, 247, ${lineAlpha})`;
                        ctx.lineWidth = 0.6;
                        ctx.beginPath();
                        ctx.moveTo(s1.x, s1.y);
                        ctx.lineTo(s2.x, s2.y);
                        ctx.stroke();
                        ctx.restore();
                    }
                }
            }
        }

        function animateCanvas() {
            ctx.clearRect(0, 0, width, height);

            stars.forEach((star) => {
                star.update();
                star.draw();
            });

            drawConstellations();

            if (!shootingStar && !isWarpActive && Math.random() < 0.006) {
                shootingStar = new ShootingStar();
            }

            if (shootingStar) {
                shootingStar.update();
                shootingStar.draw();
                if (shootingStar.life >= shootingStar.maxLife) {
                    shootingStar = null;
                }
            }

            requestAnimationFrame(animateCanvas);
        }

        animateCanvas();

        let lastWidth = window.innerWidth;
        window.addEventListener('resize', () => {
            const newWidth = window.innerWidth;
            const newHeight = window.innerHeight;
            width = canvas.width = newWidth;
            height = canvas.height = newHeight;

            // Only re-generate stars if width changed significantly (screen rotation)
            // This prevents stars from flickering/re-spawning when the mobile soft keyboard opens
            if (Math.abs(newWidth - lastWidth) > 60) {
                lastWidth = newWidth;
                stars.length = 0;
                const newCount = Math.min(130, Math.floor((width * height) / 9000));
                for (let i = 0; i < newCount; i++) {
                    stars.push(new Star());
                }
            }
        });
    }

    // ── 2. Card Dynamic Spotlight & 3D Tilt ──────────────────────────────────
    if (cardContainer) {
        let isHovered = false;

        document.addEventListener('mousemove', (e) => {
            const rect = cardContainer.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Set coordinates for radial gradient border
            cardContainer.style.setProperty('--mouse-x', `${x}px`);
            cardContainer.style.setProperty('--mouse-y', `${y}px`);

            if (!isHovered || !window.matchMedia('(pointer: fine)').matches) return;

            const cardCenterX = rect.left + rect.width / 2;
            const cardCenterY = rect.top + rect.height / 2;

            const deltaX = (e.clientX - cardCenterX) / (rect.width / 2);
            const deltaY = (e.clientY - cardCenterY) / (rect.height / 2);

            const rotateY = deltaX * 4.5;
            const rotateX = -deltaY * 4.5;

            cardContainer.style.transform = `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        });

        cardContainer.addEventListener('mouseenter', () => {
            isHovered = true;
        });

        cardContainer.addEventListener('mouseleave', () => {
            isHovered = false;
            cardContainer.style.transform = 'perspective(1200px) rotateX(0deg) rotateY(0deg)';
        });
    }

    // ── 3. Input Focus & Error Management ────────────────────────────────────
    if (passwordEl && inputBox) {
        passwordEl.addEventListener('focus', () => {
            inputBox.classList.add('focused');
            // On mobile devices, smoothly scroll card into view when keyboard opens
            if (window.innerWidth <= 480) {
                setTimeout(() => {
                    cardContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 280);
            }
        });

        passwordEl.addEventListener('blur', () => {
            inputBox.classList.remove('focused');
        });

        passwordEl.addEventListener('input', () => {
            errorMsg.classList.add('d-none');
            cardContainer.classList.remove('shake-card');
        });

        // Caps Lock detection
        passwordEl.addEventListener('keyup', (e) => {
            const isCapsLock = e.getModifierState && e.getModifierState('CapsLock');
            if (isCapsLock) {
                capsLockWarning.classList.remove('d-none');
            } else {
                capsLockWarning.classList.add('d-none');
            }
            refreshIcons();
        });
    }

    // ── 4. Show / Hide Password Toggle ──────────────────────────────────────
    if (toggleBtn && passwordEl && eyeIcon) {
        toggleBtn.addEventListener('click', () => {
            const isHidden = passwordEl.type === 'password';
            passwordEl.type = isHidden ? 'text' : 'password';
            eyeIcon.setAttribute('data-lucide', isHidden ? 'eye-off' : 'eye');
            refreshIcons();
            passwordEl.focus();
        });
    }

    // ── 5. Toast Notifications ───────────────────────────────────────────────
    let toastTimeout = null;
    let errorToastTimeout = null;

    function showToast() {
        if (!toast) return;
        refreshIcons();
        toast.classList.remove('hide');
        toast.classList.add('show');

        clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => {
            toast.classList.add('hide');
            setTimeout(() => toast.classList.remove('show', 'hide'), 400);
        }, 2800);
    }

    function showErrorToast() {
        if (!errorToast) return;
        refreshIcons();
        errorToast.classList.remove('hide');
        errorToast.classList.add('show');

        clearTimeout(errorToastTimeout);
        errorToastTimeout = setTimeout(() => {
            errorToast.classList.add('hide');
            setTimeout(() => errorToast.classList.remove('show', 'hide'), 400);
        }, 2800);
    }

    // ── 6. Form Submit & Authentication Flow ────────────────────────────────
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const password    = passwordEl.value.trim();
            const correctPass = await getPassword();

            if (password === correctPass) {
                // Success Path
                errorMsg.classList.add('d-none');
                cardContainer.classList.remove('shake-card');

                localStorage.setItem('isLoggedIn', 'true');

                // Button state
                submitBtn.disabled = true;
                btnText.textContent = 'ACCESSING...';
                btnIcon.setAttribute('data-lucide', 'loader-2');
                btnIcon.classList.add('animate-spin');
                refreshIcons();

                // Trigger Hyperspace Warp
                isWarpActive = true;

                // Show Toast
                showToast();

                setTimeout(() => {
                    // Ready for dashboard redirection:
                    // window.location.href = 'dashboard.html';

                    isWarpActive = false;
                    btnText.textContent = 'ACCESS';
                    btnIcon.setAttribute('data-lucide', 'sparkles');
                    btnIcon.classList.remove('animate-spin');
                    refreshIcons();
                    submitBtn.disabled = false;
                    passwordEl.value = '';
                }, 3000);

            } else {
                // Error Path — soft inline text below input
                errorMsg.classList.remove('d-none');

                cardContainer.classList.remove('shake-card');
                void cardContainer.offsetWidth;
                cardContainer.classList.add('shake-card');

                passwordEl.value = '';
                passwordEl.focus();
                refreshIcons();
            }
        });
    }
});
