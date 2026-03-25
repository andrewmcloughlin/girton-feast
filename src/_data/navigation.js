module.exports = [
  {
    key: "What's On",
    children: [
      { label: 'Entertainment', url: '/entertainment.html', icon: 'fas fa-music' },
      { label: 'Food & Drink', url: '/entertainment.html?category=food', icon: 'fas fa-utensils' },
      { label: 'Stalls', url: '/entertainment.html?category=stalls', icon: 'fas fa-store' },
      { label: 'Beer Tent', url: '/pages/beer-tent.html', icon: 'fas fa-beer' },
      { divider: true },
      { label: 'Photo Gallery', url: '/pages/gallery.html', icon: 'fas fa-images' }
    ]
  },
  {
    key: 'Plan Your Visit',
    children: [
      { label: 'Getting Here', url: '/map.html?mode=transport', icon: 'fas fa-map-marked-alt' },
      { label: 'Event Map', url: '/map.html?mode=event', icon: 'fas fa-map' }
    ]
  },
  {
    key: 'For Vendors',
    children: [
      { label: 'Stall Holders', url: '/info/vendors.html?category=stalls', icon: 'fas fa-store' },
      { label: 'Food & Drink Vendors', url: '/info/vendors.html?category=food', icon: 'fas fa-utensils' },
      { label: 'Rides & Games', url: '/info/vendors.html?category=rides', icon: 'fas fa-ticket-alt' }
    ]
  },
  {
    key: 'Community',
    children: [
      { label: 'Contact Us', url: '/pages/contact.html', icon: 'fas fa-envelope' },
      { divider: true },
      { label: 'Get Involved', url: '/#get-involved', icon: 'fas fa-hands-helping' },
      { label: 'Sponsors', url: '/#sponsors', icon: 'fas fa-handshake' }
    ]
  }
]
