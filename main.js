import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { handleFlashlight } from './utils/flashlight.js';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

// --------------------------------------------------------
// 1. Global Setup
// --------------------------------------------------------
gsap.ticker.lagSmoothing(0);
document.documentElement.style.scrollBehavior = 'smooth';

// --------------------------------------------------------
// 2. Setup Elements & Frame Sequence Loader
// --------------------------------------------------------
const canvas = document.getElementById('hero-canvas');
const context = canvas?.getContext('2d');
const frameTracker = document.getElementById('video-frame-tracker');

// CONFIGURATION: Number of frames in assets/raw_files/frames/
const frameCount = 192; 
const currentFramePath = index => (
    `raw_files/frames/frame_${(index + 1).toString().padStart(3, '0')}.jpg`
);

const frames = []; 
const canvasVideo = { frame: 0 }; 

document.addEventListener("DOMContentLoaded", () => {
    if (canvas && context) {
        // Resize Canvas dynamically
        function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            render(); 
        }
        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();
        loadFrameSequence();
    } else {
        // If no canvas (other pages), just init general animations
        initUIAnimations();
    }
    
    // Attach flashlight handlers globally to any element with the class
    document.querySelectorAll('.flashlight-card').forEach(el => {
        el.addEventListener('mousemove', (e) => handleFlashlight(e, el));
    });
});

// ========================================================
// LOAD PRE-EXPORTED IMAGE SEQUENCE
// ========================================================
function loadFrameSequence() {
    let loadedCount = 0;
    const loadingBar = document.getElementById("loading-bar");

    for (let i = 0; i < frameCount; i++) {
        const img = new Image();
        img.src = currentFramePath(i);
        frames.push(img);

        img.onload = () => {
            loadedCount++;
            const progress = (loadedCount / frameCount) * 100;
            if(loadingBar) loadingBar.style.width = progress + "%";

            if (loadedCount === 1) {
                render();
                gsap.to(canvas, { opacity: 1, duration: 1 });
            }

            if (loadedCount === frameCount) {
                finishLoading();
            }
        };

        img.onerror = () => {
           loadedCount++;
           if (loadedCount === frameCount) finishLoading();
        };
    }
}

function finishLoading() {
    const loadingScreen = document.getElementById("loading-screen");
    if (loadingScreen) {
        loadingScreen.style.opacity = "0";
        setTimeout(() => loadingScreen.style.display = "none", 1000);
    }

    initUIAnimations();
    setupCanvasScrub(frameCount);
}

function render() {
    if (!canvas || !context || !frames.length) return;
    const currentFrame = Math.round(canvasVideo.frame);
    if(!frames[currentFrame]) return;
    const img = frames[currentFrame];
    
    const hRatio = canvas.width / img.width;
    const vRatio = canvas.height / img.height;
    const ratio  = Math.max(hRatio, vRatio);
    
    const centerShift_x = (canvas.width - img.width * ratio) / 2;
    const centerShift_y = (canvas.height - img.height * ratio) / 2;  

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(img, 0, 0, img.width, img.height,
                      centerShift_x, centerShift_y, img.width * ratio, img.height * ratio);
}

// --------------------------------------------------------
// 3. Animation Sequences (GSAP)
// --------------------------------------------------------
function initUIAnimations() {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const tl = gsap.timeline();

    if (prefersReducedMotion) {
        gsap.set(".reveal-item, .ui-element, #side-nav", { y: 0, opacity: 1, scale: 1 });
    } else {
        gsap.set(".reveal-item", { y: 20, opacity: 0 }); 
        gsap.set(".ui-element", { opacity: 0, scale: 0.95 });
        
        if (canvas) {
            gsap.to(canvas, {
                y: -10,
                duration: 4,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut"
            });
        }

        tl.to(".reveal-item", {
            y: 0,
            opacity: 1,
            duration: 0.5,
            stagger: 0.05, 
            ease: "power3.out"
        })
        .to(".ui-element", {
            opacity: 1,
            scale: 1,
            duration: 0.6,
            stagger: 0.1,
            ease: "power2.out"
        }, "-=0.2"); 
    }
}

// --------------------------------------------------------
// 4. GSAP Canvas Fluid Scrub 
// --------------------------------------------------------
function setupCanvasScrub(totalFrames) {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
        canvasVideo.frame = totalFrames - 1;
        render();
        return;
    }

    const tl = gsap.timeline({
        scrollTrigger: {
            trigger: ".scroll-space",
            start: "top top",
            end: "bottom bottom",
            pin: "#hero-pin",
            scrub: 0.8,
            onUpdate: (self) => {
                render();
                if(frameTracker) {
                    frameTracker.innerText = Math.floor(self.progress * 360).toString().padStart(3, '0');
                }
            }
        }
    });

    ScrollTrigger.create({
        trigger: "body",
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => {
            const navProgressBar = document.getElementById("nav-progress-bar");
            if(navProgressBar) {
                gsap.set(navProgressBar, { scaleY: self.progress });
            }
        }
    });

    const sections = ["#hero-pin", "#technical-architecture", "#inside-precision", "#impact-statement"];
    let currentSectionIndex = 0;

    document.getElementById("nav-up-btn")?.addEventListener("click", () => {
        if (currentSectionIndex > 0) {
            currentSectionIndex--;
            gsap.to(window, { scrollTo: sections[currentSectionIndex], duration: 1.2, ease: "power4.inOut" });
        }
    });

    document.getElementById("nav-down-btn")?.addEventListener("click", () => {
        if (currentSectionIndex < sections.length - 1) {
            currentSectionIndex++;
            gsap.to(window, { scrollTo: sections[currentSectionIndex], duration: 1.2, ease: "power4.inOut" });
        }
    });

    sections.forEach((id, index) => {
        ScrollTrigger.create({
            trigger: id,
            start: "top center",
            onEnter: () => { currentSectionIndex = index; updateNavNumber(index + 1); },
            onEnterBack: () => { currentSectionIndex = index; updateNavNumber(index + 1); }
        });
    });

    function updateNavNumber(num) {
        const navCurrent = document.querySelector(".nav-current");
        if(navCurrent) navCurrent.innerText = num.toString().padStart(2, '0');
    }

    tl.to(canvasVideo, {
        frame: totalFrames - 1,
        ease: "none",
        duration: 1
    });

    let mm = gsap.matchMedia();

    mm.add("(min-width: 768px)", () => {
        const fadeTl = gsap.timeline({
            scrollTrigger: {
                trigger: ".scroll-space",
                start: "10% top", 
                end: "40% top", 
                scrub: 1.5
            }
        });
        fadeTl.to(".hero-label", { opacity: 0, y: -10, duration: 1 }, 0);
        fadeTl.to(".hero-desc", { opacity: 0, y: -20, filter: "blur(4px)", duration: 1 }, 0.1);
        fadeTl.to(".hero-cta", { opacity: 0, y: -15, duration: 1 }, 0.2);
        fadeTl.to(".hero-headline", { opacity: 0, y: -30, filter: "blur(6px)", duration: 1.5 }, 0.4);
    });

    mm.add("(max-width: 767px)", () => {
        const fadeTl = gsap.timeline({
            scrollTrigger: {
                trigger: ".scroll-space",
                start: "5% top", 
                end: "35% top", 
                scrub: 1.5
            }
        });
        fadeTl.to(".hero-label", { opacity: 0, y: -5, duration: 1 }, 0);
        fadeTl.to(".hero-desc", { opacity: 0, y: -10, duration: 1 }, 0.1);
        fadeTl.to(".hero-cta", { opacity: 0.3, y: -5, duration: 1 }, 0.2);
        fadeTl.to(".hero-headline", { opacity: 0, y: -15, duration: 1.5 }, 0.4);
    });

    setupSectionAnimations();
}

function setupSectionAnimations() {
    gsap.set(".tech-feature-card, .tech-reveal-item, .tech-visual-reveal, .tech-parallax-img, .tech-marquee-reveal", {
        willChange: "transform, opacity",
        force3D: true
    });

    gsap.set(".tech-feature-card", { y: 50, opacity: 0 });
    gsap.set(".tech-reveal-item", { y: "100%", opacity: 0 });
    gsap.set(".tech-visual-reveal", { scale: 0.95, opacity: 0, filter: "blur(8px)" });
    gsap.set(".tech-marquee-reveal", { opacity: 0, y: 20 });

    ScrollTrigger.create({
        trigger: "#technical-architecture",
        start: "top 85%",
        onEnter: () => {
            gsap.to(".tech-reveal-item", { y: 0, opacity: 1, duration: 1.0, stagger: 0.08, ease: "power4.out" });
            gsap.to(".tech-visual-reveal", { scale: 1, opacity: 1, filter: "blur(0px)", duration: 1.4, ease: "expo.out", delay: 0.2 });
            gsap.to(".tech-feature-card", { y: 0, opacity: 1, duration: 0.8, stagger: 0.08, ease: "power3.out", delay: 0.35 });
            initStatsCounters();
            gsap.to(".tech-marquee-reveal", { opacity: 1, y: 0, duration: 0.8, ease: "power2.out", delay: 0.6 });
        }
    });

    const exitTl = gsap.timeline({
        scrollTrigger: {
            trigger: "#technical-architecture",
            start: "75% 30%",
            end: "bottom top",
            scrub: 0.8
        }
    });
    exitTl.to(".tech-reveal-item", { opacity: 0, y: -20, duration: 1 }, 0);
    exitTl.to(".tech-feature-card", { opacity: 0, y: -15, duration: 1 }, 0.1);
    exitTl.to(".tech-visual-reveal", { opacity: 0, y: -20, duration: 1 }, 0.15);

    // Section 3
    gsap.set(".s3-reveal-item", { y: "100%", opacity: 0 });
    gsap.set(".s3-visual-reveal", { scale: 0.96, opacity: 0, filter: "blur(8px)" });
    gsap.set(".s3-label", { y: 15, opacity: 0 });
    gsap.set(".s3-stat", { y: 30, opacity: 0 });
    gsap.set(".s3-quote", { y: 20, opacity: 0 });

    ScrollTrigger.create({
        trigger: "#inside-precision",
        start: "top 85%",
        onEnter: () => {
            gsap.to(".s3-reveal-item", { y: 0, opacity: 1, duration: 1.0, stagger: 0.1, ease: "power4.out" });
            gsap.to(".s3-visual-reveal", { scale: 1, opacity: 1, filter: "blur(0px)", duration: 1.6, ease: "expo.out", delay: 0.3 });
            gsap.to(".s3-label", { y: 0, opacity: 1, xPercent: -50, duration: 1.2, stagger: 0.15, ease: "power4.out", delay: 0.6 });
            gsap.to(".connector-line-inner", { scaleY: 1, duration: 1.5, stagger: 0.15, ease: "power4.inOut", delay: 0.9 });
            gsap.to(".s3-stat", { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: "power3.out", delay: 0.8 });
            initS3Counters();
            gsap.to(".s3-quote", { y: 0, opacity: 1, duration: 1.0, ease: "power3.out", delay: 1.0, onComplete: () => document.getElementById('s3-divider')?.classList.add('expanded') });
        }
    });

    // Section 4
    gsap.set(".s4-content-box", { y: 50, opacity: 0, scale: 0.96 });
    ScrollTrigger.create({
        trigger: "#impact-statement",
        start: "top 75%",
        onEnter: () => {
            const s4Video = document.getElementById('s4-bg-video');
            if(s4Video) {
                if (s4Video.getAttribute('preload') === 'none') { s4Video.setAttribute('preload', 'auto'); s4Video.load(); }
                s4Video.play().then(() => gsap.to(s4Video, { opacity: 1, duration: 2 })).catch(() => gsap.to(s4Video, { opacity: 1, duration: 2 }));
            }
            gsap.to(".s4-content-box", { y: 0, opacity: 1, scale: 1, duration: 1.4, ease: "expo.out", delay: 0.3 });
        }
    });

    initMouseInteractions();
}

function initStatsCounters() {
    document.querySelectorAll('.stat-value').forEach(el => {
        const target = parseFloat(el.getAttribute('data-count'));
        const isDecimal = el.getAttribute('data-count').includes('.');
        gsap.to(el, { innerText: target, duration: 2.5, ease: "expo.out", snap: { innerText: isDecimal ? 0.01 : 1 }, onUpdate: function() { if (isDecimal) el.innerText = parseFloat(el.innerText).toFixed(2); } });
    });
}

function initS3Counters() {
    document.querySelectorAll('.s3-stat-value').forEach(el => {
        const target = parseInt(el.getAttribute('data-count'));
        gsap.to(el, { innerText: target, duration: 2.5, ease: "expo.out", snap: { innerText: 1 } });
    });
}

function initMouseInteractions() {
    const showcase = document.querySelector('.showcase-container');
    if(showcase) {
        showcase.addEventListener('mousemove', (e) => {
            const rect = showcase.getBoundingClientRect();
            const moveX = (e.clientX - (rect.left + rect.width / 2)) / 25;
            const moveY = (e.clientY - (rect.top + rect.height / 2)) / 25;
            gsap.to(".tech-parallax-img", { x: moveX, y: moveY, duration: 1, ease: "power2.out" });
            gsap.to(".tech-data-label", { x: moveX * 0.5, y: moveY * 0.5, duration: 1.2, ease: "power2.out", stagger: 0.02 });
            
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            document.querySelector('.pen-xray')?.style.setProperty('--x', `${x}%`);
            document.querySelector('.pen-xray')?.style.setProperty('--y', `${y}%`);
        });
        showcase.addEventListener('mouseleave', () => {
            gsap.to([".tech-parallax-img", ".tech-data-label"], { x: 0, y: 0, duration: 2, ease: "elastic.out(1, 0.3)" });
        });
    }

    const s3Container = document.querySelector('.s3-visual-reveal');
    if(s3Container) {
        s3Container.addEventListener('mousemove', (e) => {
            const rect = s3Container.getBoundingClientRect();
            const moveX = (e.clientX - (rect.left + rect.width / 2)) / 50;
            const moveY = (e.clientY - (rect.top + rect.height / 2)) / 50;
            gsap.to(".s3-visual-reveal img", { x: moveX, y: moveY, duration: 1, ease: "power2.out" });
            document.querySelectorAll('.s3-label').forEach((label, i) => {
                const factor = 0.95 + (i * 0.025);
                gsap.to(label, { xPercent: -50, x: moveX * factor, y: moveY * factor, duration: 1.2, ease: "power2.out" });
            });
        });
        s3Container.addEventListener('mouseleave', () => {
            gsap.to(".s3-visual-reveal img", { x: 0, y: 0, duration: 2, ease: "elastic.out(1, 0.3)" });
            gsap.to(".s3-label", { x: 0, y: 0, xPercent: -50, duration: 2, ease: "elastic.out(1, 0.3)" });
        });
    }

    document.querySelectorAll('.flashlight-card').forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const rotateX = (((e.clientY - rect.top) / rect.height) - 0.5) * -7;
            const rotateY = (((e.clientX - rect.left) / rect.width) - 0.5) * 7;
            gsap.to(card, { rotateX, rotateY, scale: 1.015, duration: 0.6, ease: "power3.out" });
        });
        card.addEventListener('mouseleave', () => {
            gsap.to(card, { rotateX: 0, rotateY: 0, scale: 1, duration: 1.2, ease: "elastic.out(1, 0.4)" });
        });
    });
}
