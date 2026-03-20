/**
 * Girton Feast 2026 - Main Script
 */

// Initialize everything when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Mobile nav and other initializations can go here
})

// --- Alpine.js Global Store ---
document.addEventListener('alpine:init', () => {
  Alpine.data('countdown', () => ({
    timeLeft: '',
    eventDate: new Date('June 14, 2026 10:00:00').getTime(),
    init () {
      this.update()
      setInterval(() => this.update(), 1000)
    },
    update () {
      const now = new Date().getTime()
      const distance = this.eventDate - now
      if (distance < 0) {
        this.timeLeft = 'The Feast is on!'
      } else {
        const days = Math.floor(distance / (1000 * 60 * 60 * 24))
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((distance % (1000 * 60)) / 1000)
        this.timeLeft = `${days}d ${hours}h ${minutes}m ${seconds}s`
      }
    }
  }))

  Alpine.store('app', {
    theme: localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'),
    gooseEnabled: localStorage.getItem('gooseCursorEnabled') === 'true',
    konamiIndex: 0,
    konamiCode: ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'],
    scrolled: false,
    eventInfo: null,

    async init () {
      // Use event info from siteConfig if available (injected at build time)
      // Otherwise fetch it (fallback for legacy or development)
      try {
        let data
        if (window.siteConfig?.eventInfo) {
          data = window.siteConfig.eventInfo
        } else {
          const prefix = window.siteConfig?.pathPrefix || '/'
          const response = await fetch(prefix + '_data/event_info.json')
          data = await response.json()
        }

        this.eventInfo = data.reduce((acc, item) => {
          acc[item.id] = item
          return acc
        }, {})
      } catch (e) {
        console.error('Failed to load event info:', e)
      }

      // Watch for system theme changes
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        if (!localStorage.getItem('theme')) {
          this.theme = e.matches ? 'dark' : 'light'
        }
      })

      // Watch for scroll
      window.addEventListener('scroll', () => {
        this.scrolled = window.scrollY > 200
      })
    },

    toggleTheme () {
      this.theme = this.theme === 'dark' ? 'light' : 'dark'
      localStorage.setItem('theme', this.theme)
    },

    handleKonami (key) {
      if (key === this.konamiCode[this.konamiIndex]) {
        this.konamiIndex++
        if (this.konamiIndex === this.konamiCode.length) {
          this.toggleGoose()
          this.konamiIndex = 0
        }
      } else {
        this.konamiIndex = 0
      }
    },

    toggleGoose () {
      this.gooseEnabled = !this.gooseEnabled
      localStorage.setItem('gooseCursorEnabled', this.gooseEnabled)
      // Note: showToast should be defined or replaced if needed
      if (typeof showToast === 'function') {
        showToast(this.gooseEnabled ? 'Silly Goose Mode: ON 🦢' : 'Silly Goose Mode: OFF', this.gooseEnabled ? '#3d3b8e' : '#6c757d')
      }
    },

    scrollToTop () {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    },

    getCalendarLink (eventKey) {
      if (!this.eventInfo || !this.eventInfo[eventKey]) return '#'
      const cal = this.eventInfo[eventKey].calendar
      return `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(cal.text)}&dates=${cal.dates}&details=${encodeURIComponent(cal.details)}&location=${encodeURIComponent(cal.location)}`
    }
  })

  // Reactive effects for body classes
  Alpine.effect(() => {
    const app = Alpine.store('app')
    document.body.classList.toggle('dark-mode', app.theme === 'dark')
    document.body.classList.toggle('goose-cursor-enabled', app.gooseEnabled)
  })

  // Gallery Browser component
  Alpine.data('galleryBrowser', (configKey, initialItems = null) => ({
    configs: {
      stalls: {
        jsonUrl: (window.siteConfig?.pathPrefix || '/') + '_data/stalls.json',
        titleImage: (window.siteConfig?.pathPrefix || '/') + 'images/titles/stalls-text.svg',
        sidebarGoose: '',
        cta: {
          show: true,
          title: 'Want to run a stall?',
          text: "We'd love to have you! We welcome local businesses, crafters, and community groups.",
          primaryBtn: { text: 'Book a Stall Now', url: 'https://forms.gle/f5uMHX5UwsAjjEn29', icon: 'fas fa-edit' },
          secondaryBtn: { text: 'Stall Holder Info', url: (window.siteConfig?.pathPrefix || '/') + 'info/stall-holders.html', icon: 'fas fa-info-circle' }
        },
        showDayFilter: false,
        noResultsText: 'No stalls found'
      },
      food: {
        jsonUrl: (window.siteConfig?.pathPrefix || '/') + '_data/vendors.json',
        titleImage: (window.siteConfig?.pathPrefix || '/') + 'images/titles/food-and-drink-text.svg',
        sidebarGoose: '',
        cta: { show: false },
        showDayFilter: false,
        noResultsText: 'No food or drink vendors found'
      },
      entertainment: {
        jsonUrl: (window.siteConfig?.pathPrefix || '/') + '_data/entertainment.json',
        titleImage: (window.siteConfig?.pathPrefix || '/') + 'images/titles/whats-on-text.svg',
        sidebarGoose: (window.siteConfig?.pathPrefix || '/') + 'images/goose_golf.svg',
        cta: { show: false },
        showDayFilter: true,
        noResultsText: 'No activities found'
      }
    },
    config: {},
    currentKey: configKey,
    items: initialItems || [],
    selectedTag: 'all',
    selectedDay: 'all',
    async init () {
      this.config = this.configs[configKey]

      // Only fetch if data wasn't passed at build time
      if (this.items.length === 0) {
        const response = await fetch(this.config.jsonUrl)
        this.items = await response.json()
      }

      // Handle initial filters from URL
      const params = new URLSearchParams(window.location.search)
      if (params.has('tag')) this.selectedTag = params.get('tag')
      if (params.has('day')) this.selectedDay = params.get('day')
    },

    getTagColorClass (tag) {
      const tagLower = tag.toLowerCase()

      const brandMap = {
        vegetarian: 'bg-brand-vegetarian',
        vegan: 'bg-brand-vegetarian',
        charity: 'bg-brand-charity',
        sweets: 'bg-brand-sweets',
        crafts: 'bg-brand-crafts',
        music: 'bg-brand-music',
        shows: 'bg-brand-shows',
        kids: 'bg-brand-kids',
        rides: 'bg-brand-rides',
        games: 'bg-brand-games',
        community: 'bg-brand-community'
      }

      if (brandMap[tagLower]) return brandMap[tagLower]

      const colors = ['bg-brand-marian-blue', 'bg-brand-glaucous', 'bg-brand-thulian-pink', 'bg-brand-giants-orange', 'bg-brand-saffron']
      let hash = 0
      for (let i = 0; i < tagLower.length; i++) {
        hash = tagLower.charCodeAt(i) + ((hash << 5) - hash)
      }
      return colors[Math.abs(hash) % colors.length]
    },
    get filteredItems () {
      return this.items.filter(item => {
        const tagMatch = this.selectedTag === 'all' || item.tags.includes(this.selectedTag)
        const dayMatch = this.selectedDay === 'all' ||
                         (item.days && (item.days.includes(this.selectedDay) || item.days.includes('Both')))
        return tagMatch && dayMatch
      })
    },
    get uniqueTags () {
      const tags = new Set()
      this.items.forEach(item => item.tags.forEach(tag => tags.add(tag)))
      return Array.from(tags).sort()
    }
  }))
})

// Helper for showing a toast notification (if needed)
function showToast (message, color) {
  // Check if there's a toast container, or create one
  let container = document.getElementById('toast-container')
  if (!container) {
    container = document.createElement('div')
    container.id = 'toast-container'
    container.className = 'position-fixed bottom-0 start-50 translate-middle-x p-3'
    container.style.zIndex = '1100'
    document.body.appendChild(container)
  }

  const toast = document.createElement('div')
  toast.className = 'toast align-items-center text-white border-0 show mb-2 transition-all'
  toast.style.backgroundColor = color || '#333'
  toast.setAttribute('role', 'alert')
  toast.setAttribute('aria-live', 'assertive')
  toast.setAttribute('aria-atomic', 'true')

  toast.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">
        ${message}
      </div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
  `

  container.appendChild(toast)
  setTimeout(() => {
    toast.classList.remove('show')
    setTimeout(() => toast.remove(), 500)
  }, 3000)
}
