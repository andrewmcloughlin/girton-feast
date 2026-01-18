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
                    // On the index page (or root):
                    // A link is active if:
                    // 1. It's the 'Home' link (index.html#hero-section) AND the current page has no hash (i.e., at the very top).
                    // 2. It's a hash link (e.g., #events) AND its hash matches the current URL hash.
                    // 3. It's the 'Home' link (index.html#hero-section) AND the current URL hash is #hero-section.
                    //    (This covers cases where someone explicitly navigates to index.html#hero-section)

                    const linkHash = href.includes('#') ? '#' + href.split('#')[1] : '';

                    if (
                        (href === 'index.html#hero-section' && currentHash === '') || // Case 1: Home link, no hash in URL
                        (linkHash !== '' && currentHash === linkHash) || // Case 2: Hash link matches current hash
                        (href === 'index.html#hero-section' && currentHash === '#hero-section') // Case 3: Home link, explicit #hero-section hash
                    ) {
                        link.classList.add('active');
                    }
                } else {
                    // On other pages (e.g., gallery.html):
                    // Highlight if the link's filename (without hash) matches the current page's filename.
                    const linkFileNameWithoutHash = href.substring(href.lastIndexOf('/') + 1).split('#')[0];
                    if (currentFileName === linkFileNameWithoutHash) {
                        link.classList.add('active');
                    }
                }
            });
            document.querySelector(selector).innerHTML = tempDiv.innerHTML;

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
function initializeCountdown() {
    const countdownElement = document.getElementById('countdown-timer');
    if (!countdownElement) return;

    // Set the date for the event (June 14, 2026, 10:00 AM)
    const eventDate = new Date("June 14, 2026 10:00:00").getTime();

    const interval = setInterval(function () {
        const now = new Date().getTime();
        const distance = eventDate - now;

        // Time calculations for days, hours, minutes and seconds
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        // Display the result in the element with id="countdown-timer"
        countdownElement.innerHTML = `${days}d ${hours}h ${minutes}m ${seconds}s`;

        // If the countdown is finished, write some text
        if (distance < 0) {
            clearInterval(interval);
            countdownElement.innerHTML = "The Feast is on!";
        }
    }, 1000);



}

// --- Dynamic Sponsors Logic ---
function loadSponsors() {
    const marqueeInner = document.querySelector('.animate-marquee');
    if (!marqueeInner) return;

    fetch('sponsors.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text();
        })
        .then(text => {
            try {
                const sponsors = JSON.parse(text);
                let html = '';

                // Helper function to render a single sponsor
                const renderSponsor = (sponsor) => {
                    // Support both old string format and new object format
                    const imageName = typeof sponsor === 'string' ? sponsor : sponsor.image;
                    const url = typeof sponsor === 'object' ? sponsor.url : null;

                    const imgTag = `<img src="images/sponsors/${imageName}" class="mx-2 rounded border border-2 bg-white shadow-sm sponsor-logo" alt="Logo of an official event sponsor." height="100">`;

                    // If there's a URL, wrap the image in a link
                    if (url) {
                        return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="sponsor-link">${imgTag}</a>`;
                    }
                    return imgTag;
                };

                // If we have fewer than 4 sponsors, display them statically and centered
                if (sponsors.length < 4) {
                    marqueeInner.classList.remove('animate-marquee');
                    marqueeInner.classList.add('static-sponsors');

                    sponsors.forEach(sponsor => {
                        html += renderSponsor(sponsor);
                    });
                } else {
                    // Otherwise, scroll them smoothly
                    marqueeInner.classList.add('animate-marquee');
                    marqueeInner.classList.remove('static-sponsors');

                    // We duplicate the list to ensure there's enough content to scroll smoothly
                    const fullList = [...sponsors, ...sponsors];
                    fullList.forEach(sponsor => {
                        html += renderSponsor(sponsor);
                    });

                    // Add hover Pause logic
                    const marqueeContainer = marqueeInner.parentElement;
                    if (marqueeContainer) {
                        marqueeContainer.addEventListener('mouseenter', () => {
                            marqueeInner.style.animationPlayState = 'paused';
                        });
                        marqueeContainer.addEventListener('mouseleave', () => {
                            marqueeInner.style.animationPlayState = 'running';
                        });
                    }
                }

                marqueeInner.innerHTML = html;
            } catch (err) {
                console.error('Failed to parse sponsors JSON:', err);
                console.log('Raw response text:', text);
            }
        })
        .catch(err => console.error('Failed to load sponsors:', err));
}

/**
 * Sets the copyright year in the footer to the current year.
 */
function setCopyrightYear() {
    const yearElement = document.getElementById('copyright-year');
    if (yearElement) yearElement.textContent = new Date().getFullYear();
}

// Initialize everything when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initializeCountdown();
    loadSponsors();
});