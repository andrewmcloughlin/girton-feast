const fs = require('fs')
const path = require('path')

const imageExtensions = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp'])
const videoExtensions = new Set(['.mp4', '.mov', '.webm', '.ogv'])

module.exports = function () {
  const previousDir = path.join(__dirname, '../images/previous')
  if (!fs.existsSync(previousDir)) return []

  const years = fs.readdirSync(previousDir).filter(name => {
    return /^\d{4}$/.test(name) && fs.statSync(path.join(previousDir, name)).isDirectory()
  })

  const config = years.map(year => {
    const yearDir = path.join(previousDir, year)
    const files = fs.readdirSync(yearDir).filter(file => {
      const extension = path.extname(file).toLowerCase()
      return imageExtensions.has(extension) || videoExtensions.has(extension)
    }).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))

    return {
      year: Number(year),
      images: files.filter(file => imageExtensions.has(path.extname(file).toLowerCase())),
      videos: files.filter(file => videoExtensions.has(path.extname(file).toLowerCase()))
    }
  })

  return config.sort((a, b) => b.year - a.year)
}
