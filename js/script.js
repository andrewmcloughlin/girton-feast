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
// --- Beer Tent Logic ---
function initBeerTent() {
    const mapContainer = document.getElementById('brewery-map');
    const beerListContainer = document.getElementById('beer-list');
    
    // Controls
    const viewToggles = document.querySelectorAll('.view-toggle');
    const breweryView = document.getElementById('brewery-view');
    const beerView = document.getElementById('beer-view');
    
    // Filters
    const searchInput = document.getElementById('beer-search');
    const brewerySelect = document.getElementById('filter-brewery');
    const typeSelect = document.getElementById('filter-type');
    const sortSelect = document.getElementById('sort-select');

    if (!mapContainer || !beerListContainer) return;

    // State
    let state = {
        allBeers: [],
        breweries: [],
        filterBrewery: '', // From dropdown
        filterType: '',    // From dropdown
        filterSearch: '',
        sortBy: 'name'
    };
    
    // View Switching Logic
    const switchView = (targetId) => {
        // Sync Radio Buttons
        viewToggles.forEach(t => {
            if (t.dataset.target === targetId) t.checked = true;
        });

        if (targetId === 'brewery-view') {
            breweryView.classList.remove('d-none');
            beerView.classList.add('d-none');
            // Re-render map tiles if needed when becoming visible
            // Leaflet sometimes needs a resize trigger
            setTimeout(() => {
                window.dispatchEvent(new Event('resize')); 
            }, 100);
        } else {
            breweryView.classList.add('d-none');
            beerView.classList.remove('d-none');
        }
    };
    
    // Attach toggle listeners
    viewToggles.forEach(toggle => {
        toggle.addEventListener('change', (e) => {
            if (e.target.checked) {
                switchView(e.target.dataset.target);
            }
        });
    });

    // Load Data
    fetch('../beer-tent.json')
        .then(response => response.json())
        .then(breweries => {
            state.breweries = breweries;
            
            // Flatten beer list and collect types
            state.allBeers = [];
            let allTypes = new Set();
            
            breweries.forEach(brewery => {
                brewery.imagePath = '../' + brewery.logo;
                brewery.beers.forEach(beer => {
                    state.allBeers.push({
                        ...beer,
                        breweryName: brewery.name,
                        breweryId: brewery.id,
                        breweryLogo: brewery.imagePath
                    });
                    if (beer.style) allTypes.add(beer.style);
                });
            });

            // Populate Dropdowns
            // 1. Breweries
            state.breweries.sort((a,b) => a.name.localeCompare(b.name)).forEach(b => {
                const opt = document.createElement('option');
                opt.value = b.name;
                opt.textContent = b.name;
                brewerySelect.appendChild(opt);
            });
            
            // 2. Types
            Array.from(allTypes).sort().forEach(t => {
                const opt = document.createElement('option');
                opt.value = t;
                opt.textContent = t;
                typeSelect.appendChild(opt);
            });

            // Master Application Function
            const applyFiltersAndRender = () => {
                let filtered = [...state.allBeers];

                // 1. Filter by Brewery
                if (state.filterBrewery) {
                    filtered = filtered.filter(beer => beer.breweryName === state.filterBrewery);
                }
                
                // 2. Filter by Type
                if (state.filterType) {
                    filtered = filtered.filter(beer => beer.style === state.filterType);
                }

                // 3. Filter by Search Term
                if (state.filterSearch) {
                    const term = state.filterSearch.toLowerCase();
                    filtered = filtered.filter(beer =>
                        beer.name.toLowerCase().includes(term) ||
                        beer.breweryName.toLowerCase().includes(term) ||
                        beer.style.toLowerCase().includes(term)
                    );
                }

                // 4. Sort
                if (state.sortBy === 'name') {
                    filtered.sort((a, b) => a.name.localeCompare(b.name));
                } else if (state.sortBy === 'abv-asc') {
                    filtered.sort((a, b) => a.abv - b.abv);
                } else if (state.sortBy === 'abv-desc') {
                    filtered.sort((a, b) => b.abv - a.abv);
                } else if (state.sortBy === 'brewery') {
                    filtered.sort((a, b) => a.breweryName.localeCompare(b.breweryName));
                }

                renderBeerList(filtered);
            };

            // Helpers to update UI from map/card interactions
            const activateBreweryFilter = (breweryName) => {
                state.filterBrewery = breweryName;
                brewerySelect.value = breweryName; // Sync dropdown
                
                // Switch to Beer View
                switchView('beer-view');
                
                applyFiltersAndRender();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            };

            // 1. Initialize Map
            initBreweryMap(mapContainer, breweries, activateBreweryFilter);

            // 2. Render Brewery Cards (Slider)
            renderBreweryCards(breweries, activateBreweryFilter);

            // 3. Initial Render
            applyFiltersAndRender();

            // 4. Event Listeners for Filters
            searchInput.addEventListener('input', (e) => {
                state.filterSearch = e.target.value;
                applyFiltersAndRender();
            });
            
            brewerySelect.addEventListener('change', (e) => {
                state.filterBrewery = e.target.value;
                applyFiltersAndRender();
            });
            
            typeSelect.addEventListener('change', (e) => {
                state.filterType = e.target.value;
                applyFiltersAndRender();
            });
            
            sortSelect.addEventListener('change', (e) => {
                state.sortBy = e.target.value;
                applyFiltersAndRender();
            });

        })
        .catch(err => console.error('Failed to load beer data:', err));
}

function updateBreweryCardStyles(activeBreweryName) {
    // Deprecated in new view model, but keeping empty to avoid errors if called
}

function initBreweryMap(container, breweries, onPinClick) {
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
            html: `<div style="width: 50px; height: 100px; display: flex; flex-direction:column; align-items: center; justify-content: flex-start;">
                    <div style="width: 50px; height: 50px; background:white; border-radius:50%; border: 2px solid #ccc; display:flex; align-items:center; justify-content:center; overflow:hidden;">
                     <img src="${brewery.imagePath}" style="width: 100%; height: 100%; object-fit: contain;">
                    </div>
                    <div class="map-pin-arrow" style="width: 0; height: 0; border-left: 10px solid transparent; border-right: 10px solid transparent; border-top: 15px solid #ccc; margin-top:-2px;"></div>
                   </div>`,
            iconSize: [50, 70],
            iconAnchor: [25, 65], // Tip of the "pin"
            popupAnchor: [0, -65]
        });
        const marker = L.marker([lat, lng], { icon: logoIcon }).addTo(map);

        const popupContent = `
            <div class="text-center" style="cursor: pointer;">
                <img src="${brewery.imagePath}" width="50" class="mb-2">
                <h6 class="fw-bold mb-1">${brewery.name}</h6>
                <p class="small mb-0 text-muted">${brewery.description || ''}</p>
                <button class="btn btn-sm btn-primary mt-2 filter-map-btn">Show Beers</button>
            </div>
        `;
        
        marker.bindPopup(popupContent);
        
        // Handle Map Pin Click -> Go to Beer View filtered by this brewery
        marker.on('click', () => {
             // We can allow popup for info, or just jump? 
             // Requirement: "Clicking a pin should scroll... or highlight"
             // In new model: Switch to beer view.
             onPinClick(brewery.name);
        });
        
        // Handle "Show Beers" button inside popup
        marker.on('popupopen', () => {
             const btn = document.querySelector('.filter-map-btn');
             if(btn) {
                 btn.addEventListener('click', (e) => {
                     e.preventDefault();
                     onPinClick(brewery.name);
                 });
             }
        });

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
                    <div class="d-flex align-items-start">
                         <div style="flex-shrink: 0;" class="me-3">
                             <img src="${beer.breweryLogo}" class="brewery-logo-small rounded-circle border p-1" alt="${beer.breweryName} logo" style="width:50px; height:50px;">
                         </div>
                        <div class="flex-grow-1">
                            <div class="d-flex justify-content-between align-items-start mb-1">
                                <h5 class="mb-0 fw-bold text-dark lh-sm">${beer.name}</h5>
                                <span class="abv-badge ms-2" style="flex-shrink:0;">${beer.abv.toFixed(1)}%</span>
                            </div>
                            <div class="brewery-name small mb-2">${beer.breweryName}</div>
                            <span class="badge rounded-pill text-bg-light border border-secondary-subtle text-secondary fw-normal">
                                <i class="fas fa-beer me-1 opacity-50"></i> ${beer.style}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

function renderBreweryCards(breweries, onCardClick) {
    const container = document.getElementById('brewery-list');
    if (!container) return;

    let html = '';
    breweries.forEach(brewery => {
        // Use Javascript to handle navigation to website to avoid bubbling issues if card is clickable
        // Or keep it simple: card click filters, button click goes to website.
        
        html += `
            <div class="brewery-card-container" data-brewery-name="${brewery.name}" style="min-width: 260px; max-width: 260px;">
                <div class="card h-100 shadow-sm border-0 hover-scale">
                    <div class="card-body text-center d-flex flex-column align-items-center justify-content-center p-4">
                        <div style="height: 80px; width: 100%; display: flex; align-items: center; justify-content: center; margin-bottom: 1rem;">
                            <img src="${brewery.imagePath}" alt="${brewery.name} Logo" style="max-height: 100%; max-width: 100%; object-fit: contain;">
                        </div>
                        <h5 class="card-title fw-bold text-truncate w-100" style="color: var(--brand-marian-blue); font-family: 'Sigmar One', cursive;">${brewery.name}</h5>
                        <p class="card-text small text-muted text-truncate w-100">${brewery.description || 'Proud local brewery.'}</p>
                        <a href="${brewery.website || '#'}" target="_blank" class="btn btn-sm btn-outline-primary mt-3 website-btn">Visit Website</a>
                    </div>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
    
    // Attach listeners
    // We need to wait for innerHTML to be set
    setTimeout(() => {
        const cards = container.querySelectorAll('.brewery-card-container');
        cards.forEach(card => {
             card.addEventListener('click', (e) => {
                 // Prevent filter if they clicked the website button
                 if(e.target.classList.contains('website-btn')) return;
                 
                 const name = card.dataset.breweryName;
                 onCardClick(name);
             });
        });
    }, 0);
}

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
