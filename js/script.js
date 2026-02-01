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

            // Handle theme toggle state if the navbar was just loaded
            if (selector === '#navbar-placeholder') {
                const themeToggle = document.getElementById('theme-toggle');
                if (themeToggle) {
                    const icon = themeToggle.querySelector('i');
                    if (document.body.classList.contains('dark-mode')) {
                        icon.classList.remove('fa-moon');
                        icon.classList.add('fa-sun');
                    }
                }
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
                    if (tag.toLowerCase().includes('free')) badgeClass = 'badge-free';

                    return `<span class="badge ${badgeClass}">${label}</span>`;
                }).join('');

                // Optional description support
                const description = item.description ? `<p class="mb-2 text-white small" style="text-shadow: 0 2px 8px rgba(0, 0, 0, 0.9), 0 1px 3px rgba(0, 0, 0, 0.8);">${item.description}</p>` : '';

                html += `
                    <div class="col-md-6 col-lg-4 card-wrapper" data-tags="${item.tags.join(' ')}">
                        <a href="${item.url}" target="_blank" class="card vendor-card shadow-sm h-100">
                            <div class="vendor-card-bg" style="background-image: url('${imagePrefix}${item.image}'); background-size: cover; background-position: top center;"></div>
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
    initializeDarkMode();
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

// --- Beer Tent Logic ---
function initBeerTent() {
    const mapContainer = document.getElementById('brewery-map');
    const beerListContainer = document.getElementById('beer-list');
    const searchInput = document.getElementById('beer-search');
    const sortBtns = document.querySelectorAll('.sort-btn');
    const sortDropdown = document.getElementById('sortDropdown');

    if (!mapContainer || !beerListContainer) return;

    // Load Data
    fetch('../beer-tent.json')
        .then(response => response.json())
        .then(breweries => {
            // Flatten beer list for easier display/search/sort
            let allBeers = [];
            breweries.forEach(brewery => {
                // Pre-process brewery data for the map
                brewery.imagePath = '../' + brewery.logo;

                brewery.beers.forEach(beer => {
                    allBeers.push({
                        ...beer,
                        breweryName: brewery.name,
                        breweryId: brewery.id,
                        breweryLogo: brewery.imagePath
                    });
                });
            });

            // 1. Initialize Map
            initBreweryMap(mapContainer, breweries);

            // 2. Render Brewery Cards
            renderBreweryCards(breweries);

            // 3. Initial Render of Beer List
            renderBeerList(allBeers);

            // ... (rest of the code)

            // 4. Search Logic
            searchInput.addEventListener('input', (e) => {
                const term = e.target.value.toLowerCase();
                const filtered = allBeers.filter(beer =>
                    beer.name.toLowerCase().includes(term) ||
                    beer.breweryName.toLowerCase().includes(term) ||
                    beer.style.toLowerCase().includes(term)
                );
                renderBeerList(filtered);
            });

            // 4. Sort Logic
            sortBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const sortType = e.target.dataset.sort;
                    const btnText = e.target.textContent;

                    // Update dropdown text
                    sortDropdown.textContent = "Sort By: " + btnText;

                    let sorted = [...allBeers];
                    // Note: If we had filtered currently, we should sort the filtered list. 
                    // But for simplicity, let's just sort various slices or re-grab current filter
                    // To do it right: get current value of search, filter, then sort.
                    const term = searchInput.value.toLowerCase();
                    if (term) {
                        sorted = sorted.filter(beer =>
                            beer.name.toLowerCase().includes(term) ||
                            beer.breweryName.toLowerCase().includes(term) ||
                            beer.style.toLowerCase().includes(term)
                        );
                    }

                    if (sortType === 'name') {
                        sorted.sort((a, b) => a.name.localeCompare(b.name));
                    } else if (sortType === 'abv-asc') {
                        sorted.sort((a, b) => a.abv - b.abv);
                    } else if (sortType === 'abv-desc') {
                        sorted.sort((a, b) => b.abv - a.abv);
                    } else if (sortType === 'brewery') {
                        sorted.sort((a, b) => a.breweryName.localeCompare(b.breweryName));
                    }

                    renderBeerList(sorted);
                });
            });

        })
        .catch(err => console.error('Failed to load beer data:', err));
}

function initBreweryMap(container, breweries) {
    // Initialize OpenStreetMap
    // Center on Girton Recreation Ground
    var girtonCoords = [52.240069, 0.084899];
    var map = L.map(container.id).setView(girtonCoords, 11);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    // Girton Feast Marker ("You are here")
    var feastIcon = L.divIcon({
        className: 'feast-marker',
        html: '<i class="fas fa-flag fa-2x" style="color: #e91e63; text-shadow: 2px 2px 0 #fff;"></i>',
        iconSize: [30, 30],
        iconAnchor: [15, 30],
        popupAnchor: [0, -30]
    });
    var feastMarker = L.marker(girtonCoords, { icon: feastIcon, zIndexOffset: 1000 }).addTo(map);
    feastMarker.bindPopup('<div class="text-center"><h6 class="fw-bold mb-0">Girton Feast</h6><p class="small mb-0">You are here!</p></div>');
    var markers = [feastMarker];
    breweries.forEach(brewery => {
        // Coords in JSON are now [lat, lng]
        let lat = brewery.coords[0];
        let lng = brewery.coords[1];
        // Create Custom Icon using the brewery logo
        var logoIcon = L.divIcon({
            className: 'brewery-logo-marker',
            // Create a circular white badge with the logo inside
            html: `<div style="width: 50px; height: 50px; display: flex; align-items: center; justify-content: center; overflow: hidden;">
                    <img src="${brewery.imagePath}" style="width: 100%; height: 100%; object-fit: contain;">
                   </div>`,
            iconSize: [50, 50],
            iconAnchor: [25, 25],
            popupAnchor: [0, -25]
        });
        const marker = L.marker([lat, lng], { icon: logoIcon }).addTo(map);

        const popupContent = `
            <div class="text-center">
                <img src="${brewery.imagePath}" width="50" class="mb-2">
                <h6 class="fw-bold mb-1">${brewery.name}</h6>
                <p class="small mb-0 text-muted">${brewery.description || ''}</p>
            </div>
        `;

        marker.bindPopup(popupContent);
        markers.push(marker);
    });
    // Fit bounds to show all markers
    if (markers.length > 0) {
        var group = new L.featureGroup(markers);
        map.fitBounds(group.getBounds().pad(0.1));
    }
}

function renderBeerList(beers) {
    const container = document.getElementById('beer-list');
    if (beers.length === 0) {
        container.innerHTML = '<div class="col-12 text-center text-muted py-5">No beers found matching your criteria.</div>';
        return;
    }

    let html = '';
    beers.forEach(beer => {
        html += `
            <div class="col-md-6 col-lg-4">
                <div class="beer-card bg-white h-100">
                    <div class="d-flex align-items-center">
                        <img src="${beer.breweryLogo}" class="brewery-logo-small rounded-circle border p-1" alt="${beer.breweryName} logo">
                        <div>
                            <h5 class="mb-0 fw-bold">${beer.name}</h5>
                            <div class="brewery-name">${beer.breweryName}</div>
                        </div>
                    </div>
                    <div class="text-end">
                        <span class="abv-badge">${beer.abv.toFixed(1)}%</span>
                        <div class="small text-muted mt-1">${beer.style}</div>
                    </div>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

function renderBreweryCards(breweries) {
    const container = document.getElementById('brewery-list');
    if (!container) return;

    let html = '';
    breweries.forEach(brewery => {
        const websiteLink = brewery.website ? `<a href="${brewery.website}" target="_blank" class="btn btn-sm btn-outline-primary mt-3">Visit Website</a>` : '';

        html += `
            <div class="col-md-4 col-sm-6">
                <div class="card h-100 shadow-sm border-0 hover-scale">
                    <div class="card-body text-center d-flex flex-column align-items-center justify-content-center p-4">
                        <img src="${brewery.imagePath}" alt="${brewery.name} Logo" class="img-fluid mb-3" style="max-height: 100px; max-width: 100px; object-fit: contain;">
                        <h5 class="card-title fw-bold" style="color: var(--brand-marian-blue); font-family: 'Sigmar One', cursive;">${brewery.name}</h5>
                        <p class="card-text small text-muted">${brewery.description || 'Proud local brewery.'}</p>
                        ${websiteLink}
                    </div>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

// --- Dark Mode Logic ---
function initializeDarkMode() {
    const body = document.body;

    // 1. Determine and apply initial theme
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
        body.classList.add('dark-mode');
    }

    // 2. Handle Toggle (using event delegation for dynamic content)
    document.addEventListener('click', (e) => {
        const toggleBtn = e.target.closest('#theme-toggle');
        if (!toggleBtn) return;

        const isNowDark = body.classList.toggle('dark-mode');
        const icon = toggleBtn.querySelector('i');

        if (isNowDark) {
            localStorage.setItem('theme', 'dark');
            if (icon) {
                icon.classList.remove('fa-moon');
                icon.classList.add('fa-sun');
            }
        } else {
            localStorage.setItem('theme', 'light');
            if (icon) {
                icon.classList.remove('fa-sun');
                icon.classList.add('fa-moon');
            }
        }
    });

    // 3. Listen for system preference changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        if (!localStorage.getItem('theme')) {
            if (e.matches) {
                body.classList.add('dark-mode');
            } else {
                body.classList.remove('dark-mode');
            }
            // Update icon if navbar is present
            const toggleBtn = document.getElementById('theme-toggle');
            if (toggleBtn) {
                const icon = toggleBtn.querySelector('i');
                if (icon) {
                    if (e.matches) {
                        icon.classList.remove('fa-moon');
                        icon.classList.add('fa-sun');
                    } else {
                        icon.classList.remove('fa-sun');
                        icon.classList.add('fa-moon');
                    }
                }
            }
        }
    });
}