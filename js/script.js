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

// --- Dynamic Cards Logic (Unified for Food & Entertainment) ---
function loadCards(jsonFile, containerSelector, filterSelector) {
    const cardContainer = document.querySelector(containerSelector);
    const filterContainer = filterSelector ? document.querySelector(filterSelector) : null;

    if (!cardContainer) return;

    const currentPagePath = window.location.pathname;
    const isIndexPage = (currentPagePath.endsWith('index.html') || currentPagePath.endsWith('/'));
    const jsonPath = isIndexPage ? jsonFile : '../' + jsonFile;
    const imagePrefix = isIndexPage ? '' : '../';

    fetch(jsonPath)
        .then(response => response.json())
        .then(items => {
            // 1. Collect unique tags
            const allTags = new Set();
            items.forEach(item => item.tags.forEach(t => allTags.add(t)));

            // 2. Generate Filters (if filterContainer exists)
            if (filterContainer) {
                let filtersHtml = '';
                Array.from(allTags).sort().forEach(tag => {
                    let label = tag.charAt(0).toUpperCase() + tag.slice(1).replace(/-/g, ' ');
                    // Special label formatting
                    if (tag.toLowerCase() === 'deserts' || tag.toLowerCase() === 'desert') label = 'Dessert';
                    if (tag.toLowerCase() === 'ice-cream') label = 'Ice Cream';
                    if (tag.toLowerCase() === 'live-band') label = 'Live Band';

                    filtersHtml += `
                        <div class="form-check form-check-inline">
                            <input class="form-check-input card-filter" type="checkbox" id="filter-${tag}" value="${tag}">
                            <label class="form-check-label" for="filter-${tag}">${label}</label>
                        </div>
                    `;
                });
                filterContainer.innerHTML = filtersHtml;

                // 3. Attach filter logic
                const filters = filterContainer.querySelectorAll('.card-filter');
                const applyFilters = () => {
                    const selectedTags = Array.from(filters).filter(i => i.checked).map(i => i.value);
                    const cardWrappers = document.querySelectorAll('.card-wrapper');

                    cardWrappers.forEach(card => {
                        if (selectedTags.length === 0) {
                            card.style.display = 'block';
                            return;
                        }
                        const cardTags = card.dataset.tags.split(' ');
                        const hasMatch = selectedTags.some(tag => cardTags.includes(tag));
                        card.style.display = hasMatch ? 'block' : 'none';
                    });
                };
                filters.forEach(f => f.addEventListener('change', applyFilters));
            }

            // 4. Generate Cards
            let html = '';
            items.forEach(item => {
                const tagsHtml = item.tags.map(tag => {
                    let badgeClass = 'bg-secondary';
                    let label = tag.charAt(0).toUpperCase() + tag.slice(1);

                    // Food badges
                    if (tag.toLowerCase().includes('vegetarian')) badgeClass = 'badge-veg';
                    if (tag.toLowerCase().includes('vegan')) badgeClass = 'badge-vegan';
                    if (tag.toLowerCase().includes('gluten-free')) { badgeClass = 'badge-gf'; label = 'GF'; }
                    if (tag.toLowerCase().includes('main')) badgeClass = 'badge-main';
                    if (tag.toLowerCase().includes('dessert') || tag.toLowerCase().includes('desert')) { badgeClass = 'badge-dessert'; label = 'Dessert'; }
                    if (tag.toLowerCase().includes('drink')) badgeClass = 'badge-drink';
                    if (tag.toLowerCase().includes('pizza')) badgeClass = 'badge-pizzas';
                    if (tag.toLowerCase().includes('burger')) badgeClass = 'badge-burgers';
                    if (tag.toLowerCase().includes('churros')) badgeClass = 'badge-churros';
                    if (tag.toLowerCase().includes('mexican')) badgeClass = 'badge-mexican';
                    if (tag.toLowerCase().includes('ice-cream')) { badgeClass = 'badge-ice-cream'; label = 'Ice Cream'; }
                    if (tag.toLowerCase().includes('cake')) badgeClass = 'badge-cakes';

                    // Entertainment badges
                    if (tag.toLowerCase().includes('shows')) badgeClass = 'badge-shows';
                    if (tag.toLowerCase().includes('music')) badgeClass = 'badge-music';
                    if (tag.toLowerCase().includes('live-band')) { badgeClass = 'badge-live-band'; label = 'Live Band'; }
                    if (tag.toLowerCase().includes('magic')) badgeClass = 'badge-magic';
                    if (tag.toLowerCase().includes('rides')) badgeClass = 'badge-rides';
                    if (tag.toLowerCase().includes('games')) badgeClass = 'badge-games';
                    if (tag.toLowerCase().includes('kids')) badgeClass = 'badge-kids';
                    if (tag.toLowerCase().includes('family')) badgeClass = 'badge-family';
                    if (tag.toLowerCase().includes('adults')) badgeClass = 'badge-adults';

                    return `<span class="badge ${badgeClass}">${label}</span>`;
                }).join('');

                // Optional description support
                const description = item.description ? `<p class="mb-0 text-white-50 small" style="text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);">${item.description}</p>` : '';

                html += `
                    <div class="col-md-6 col-lg-4 card-wrapper" data-tags="${item.tags.join(' ')}">
                        <a href="${item.url}" target="_blank" class="card vendor-card shadow-sm h-100">
                            <div class="vendor-card-bg" style="background-image: url('${imagePrefix}${item.image}'); background-size: cover; background-position: center;"></div>
                            <div class="vendor-card-content">
                                <h4 class="vendor-card-title">${item.name}</h4>
                                ${description}
                                <div class="vendor-badges">
                                    ${tagsHtml}
                                </div>
                            </div>
                        </a>
                    </div>
                `;
            });
            cardContainer.innerHTML = html;
        })
        .catch(err => console.error('Failed to load cards:', err));
}

// Legacy function for backward compatibility
function loadVendors() {
    loadCards('vendors.json', '#vendor-container', '#dietary-filters');
}

// --- Dynamic Sponsors Logic ---
function loadSponsors() {
    const marqueeInner = document.querySelector('.animate-marquee');
    if (!marqueeInner) return;

    const currentPagePath = window.location.pathname;
    const isIndexPage = (currentPagePath.endsWith('index.html') || currentPagePath.endsWith('/'));
    const jsonPath = isIndexPage ? 'sponsors.json' : '../sponsors.json';
    const imagePrefix = isIndexPage ? 'images/sponsors/' : '../images/sponsors/';

    fetch(jsonPath)
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

                    const imgTag = `<img src="${imagePrefix}${imageName}" class="mx-2 rounded border border-2 bg-white shadow-sm sponsor-logo" alt="Logo of an official event sponsor." height="100">`;

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

// --- Event Day Toggling Logic ---
function initializeEventToggling() {
    const cards = document.querySelectorAll('.event-card');
    const toggleBtns = document.querySelectorAll('.segmented-toggle .toggle-btn');
    const toggleBg = document.getElementById('toggle-bg');
    const day1Content = document.getElementById('day1-content');
    const day2Content = document.getElementById('day2-content');

    if (!day1Content || !day2Content) return;

    function updateUI(day) {
        // Update cards
        cards.forEach(c => {
            if (c.getAttribute('data-event-day') === day) {
                c.classList.add('active');
            } else {
                c.classList.remove('active');
            }
        });

        // Update toggle buttons
        toggleBtns.forEach(btn => {
            if (btn.getAttribute('data-toggle-day') === day) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Update sliding background
        if (toggleBg) {
            if (day === '2') {
                toggleBg.classList.add('day2');
            } else {
                toggleBg.classList.remove('day2');
            }
        }

        // Toggle content visibility
        if (day === '1') {
            day1Content.style.display = 'block';
            day2Content.style.display = 'none';
        } else {
            day1Content.style.display = 'none';
            day2Content.style.display = 'block';
        }
    }

    // Add listeners to cards
    cards.forEach(card => {
        card.addEventListener('click', () => {
            updateUI(card.getAttribute('data-event-day'));
        });
    });

    // Add listeners to toggle buttons
    toggleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            updateUI(btn.getAttribute('data-toggle-day'));
        });
    });

    // Handle initial hash on load
    const currentHash = window.location.hash;
    if (currentHash === '#headliners' || currentHash === '#day1-content') {
        updateUI('1');
    } else if (currentHash === '#whatson' || currentHash === '#day2-content') {
        updateUI('2');
    }

    // Handle hash change
    window.addEventListener('hashchange', () => {
        const newHash = window.location.hash;
        if (newHash === '#headliners' || newHash === '#day1-content') {
            updateUI('1');
        } else if (newHash === '#whatson' || newHash === '#day2-content') {
            updateUI('2');
        }
    });
}

// Initialize everything when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initializeCountdown();
    loadSponsors();
    loadVendors();
    initializeEventToggling();

    // Load mobile nav on all pages
    const mobileNavPlaceholder = document.getElementById('mobile-nav-placeholder');
    if (mobileNavPlaceholder) {
        const currentPagePath = window.location.pathname;
        const isIndexPage = (currentPagePath.endsWith('index.html') || currentPagePath.endsWith('/'));
        const componentPath = isIndexPage ? 'components/mobile-nav.html' : '../components/mobile-nav.html';
        loadComponent('#mobile-nav-placeholder', componentPath);
    }
});