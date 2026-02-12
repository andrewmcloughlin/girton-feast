/**
 * Loads a component and adjusts its links based on the current page.
 * - On index.html, hash links (e.g., "#events") remain as is.
 * - On other pages (e.g., gallery.html), hash links (e.g., "#events") become "index.html#events".
 * - Sets the 'active' class on the current page's navigation link.
 */
function loadComponent(selector, url) {
    const currentPagePath = window.location.pathname;
    const currentFileName = currentPagePath.substring(currentPagePath.lastIndexOf('/') + 1);
    const currentHash = window.location.hash;
    const isIndexPage = (currentFileName === 'index.html' || currentFileName === '');

    return fetch(url)
        .then(response => response.text())
        .then(data => {
            const tempDiv = document.createElement('div');

            // If we are on the index page/root, we need to adjust relative paths
            // Components (navbar/footer) are written with "../" prefix for subpages (e.g. pages/about.html)
            // But for index.html (root), "../" is incorrect. We remove it.
            if (isIndexPage) {
                // Replace "../" with "" in href and src attributes
                // This converts "../images/logo.png" -> "images/logo.png"
                // and "../pages/about.html" -> "pages/about.html"
                data = data.replace(/src="\.\.\//g, 'src="')
                    .replace(/href="\.\.\//g, 'href="');
            }

            tempDiv.innerHTML = data;
            // Select both nav-links (top level) and dropdown-items (nested)
            const links = tempDiv.querySelectorAll('.navbar-nav .nav-link, .dropdown-item');

            links.forEach(link => {
                const href = link.getAttribute('href');
                if (!href) return;

                // 1. Adjust hash links for non-index pages
                // If on a non-index page and the link is a hash link, prepend 'index.html'
                if (href.startsWith('#') && !isIndexPage) {
                    link.setAttribute('href', `index.html${href}`);
                }

                // 2. Determine active state
                link.classList.remove('active');

                if (isIndexPage) {
                    const linkHash = href.includes('#') ? '#' + href.split('#')[1] : '';

                    if (
                        (href === 'index.html#hero-section' && currentHash === '') ||
                        (linkHash !== '' && currentHash === linkHash) ||
                        (href === 'index.html#hero-section' && currentHash === '#hero-section')
                    ) {
                        link.classList.add('active');
                        // Highlight parent dropdown if it exists
                        const parentDropdown = link.closest('.dropdown');
                        if (parentDropdown) {
                            const toggle = parentDropdown.querySelector('.dropdown-toggle');
                            if (toggle) toggle.classList.add('active');
                        }
                    }
                } else {
                    const linkFileNameWithoutHash = href.substring(href.lastIndexOf('/') + 1).split('#')[0];
                    if (currentFileName === linkFileNameWithoutHash) {
                        link.classList.add('active');
                        // Highlight parent dropdown if it exists
                        const parentDropdown = link.closest('.dropdown');
                        if (parentDropdown) {
                            const toggle = parentDropdown.querySelector('.dropdown-toggle');
                            if (toggle) toggle.classList.add('active');
                        }
                    }
                }
            });
            document.querySelector(selector).innerHTML = tempDiv.innerHTML;
            
            // Re-initialize Alpine on the new content if Alpine is loaded
            if (window.Alpine) {
                Alpine.initTree(document.querySelector(selector));
            }

            // Handle mobile nav active states if the mobile nav was just loaded
            if (selector === '#mobile-nav-placeholder') {
                const mobileLinks = document.querySelectorAll('.mobile-nav-item');
                mobileLinks.forEach(link => {
                    const href = link.getAttribute('href');
                    if (!href) return;

                    const linkFileName = href.substring(href.lastIndexOf('/') + 1);
                    if (currentFileName === linkFileName || (currentFileName === '' && linkFileName === 'index.html')) {
                        link.classList.add('active');
                    }
                });
            }

            // Re-attach listeners because innerHTML replacement removes them. 
            const insertedLinks = document.querySelector(selector).querySelectorAll('.nav-link, .dropdown-item');
            insertedLinks.forEach(link => {
                // Do not attach the close logic to dropdown toggles
                if (link.classList.contains('dropdown-toggle')) return;

                link.addEventListener('click', () => {
                    const navbarCollapse = document.querySelector('.navbar-collapse');
                    const toggler = document.querySelector('.navbar-toggler');
                    if (navbarCollapse && navbarCollapse.classList.contains('show') && toggler && getComputedStyle(toggler).display !== 'none') {
                        toggler.click();
                    }
                });
            });
        });
}


// --- Countdown Timer Logic ---
// --- Legacy functions removed: loadCards, loadVendors, loadSponsors, legacy Konami, initializeCountdown, setCopyrightYear ---

// Initialize everything when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Load mobile nav on all pages
    const mobileNavPlaceholder = document.getElementById('mobile-nav-placeholder');
    if (mobileNavPlaceholder) {
        const currentPagePath = window.location.pathname;
        const isIndexPage = (currentPagePath.endsWith('index.html') || currentPagePath.endsWith('/'));
        const componentPath = isIndexPage ? 'components/mobile-nav.html' : '../components/mobile-nav.html';
        loadComponent('#mobile-nav-placeholder', componentPath);
    }
});

// --- Beer Tent Logic ---
// Migrated to Alpine.js component 'beerTent'


// --- Alpine.js Global Store ---
document.addEventListener('alpine:init', () => {
    Alpine.data('countdown', () => ({
        timeLeft: '',
        eventDate: new Date("June 14, 2026 10:00:00").getTime(),
        init() {
            this.update();
            setInterval(() => this.update(), 1000);
        },
        update() {
            const now = new Date().getTime();
            const distance = this.eventDate - now;
            if (distance < 0) {
                this.timeLeft = "The Feast is on!";
            } else {
                const days = Math.floor(distance / (1000 * 60 * 60 * 24));
                const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((distance % (1000 * 60)) / 1000);
                this.timeLeft = `${days}d ${hours}h ${minutes}m ${seconds}s`;
            }
        }
    }));



    Alpine.store('app', {
        theme: localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'),
        gooseEnabled: localStorage.getItem('gooseCursorEnabled') === 'true',
        konamiIndex: 0,
        konamiCode: ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'],
        scrolled: false,

        init() {
            // Watch for system theme changes
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
                if (!localStorage.getItem('theme')) {
                    this.theme = e.matches ? 'dark' : 'light';
                }
            });

            // Watch for scroll
            window.addEventListener('scroll', () => {
                this.scrolled = window.scrollY > 200;
            });
        },

        toggleTheme() {
            this.theme = this.theme === 'dark' ? 'light' : 'dark';
            localStorage.setItem('theme', this.theme);
        },

        handleKonami(key) {
            if (key === this.konamiCode[this.konamiIndex]) {
                this.konamiIndex++;
                if (this.konamiIndex === this.konamiCode.length) {
                    this.toggleGoose();
                    this.konamiIndex = 0;
                }
            } else {
                this.konamiIndex = 0;
            }
        },

        toggleGoose() {
            this.gooseEnabled = !this.gooseEnabled;
            localStorage.setItem('gooseCursorEnabled', this.gooseEnabled);
            showToast(this.gooseEnabled ? "Silly Goose Mode: ON 🦢" : "Silly Goose Mode: OFF", this.gooseEnabled ? "#3d3b8e" : "#6c757d");
        },

        scrollToTop() {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });

    // Reactive effects for body classes
    Alpine.effect(() => {
        const app = Alpine.store('app');
        document.body.classList.toggle('dark-mode', app.theme === 'dark');
        document.body.classList.toggle('goose-cursor-enabled', app.gooseEnabled);
    });
});
