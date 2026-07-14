const fs = require('fs')
const path = require('path')

module.exports = function () {
  const previousDir = path.join(__dirname, '../images/previous')
  if (!fs.existsSync(previousDir)) {
    return []
  }

  const years = fs.readdirSync(previousDir).filter(file => {
    return fs.statSync(path.join(previousDir, file)).isDirectory()
  })

  const config = years.map(year => {
    const yearDir = path.join(previousDir, year)
    const files = fs.readdirSync(yearDir).filter(file => {
      const ext = path.extname(file).toLowerCase()
      return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)
    })

    // Sort files numerically, e.g., 1.png, 2.jpg, 10.jpg
    files.sort((a, b) => {
      const numA = parseInt(path.parse(a).name, 10)
      const numB = parseInt(path.parse(b).name, 10)
      if (isNaN(numA) || isNaN(numB)) {
        return a.localeCompare(b)
      }
      return numA - numB
    })

    return {
      year: parseInt(year, 10),
      images: files
    }
  })

  // Sort years descending
  config.sort((a, b) => b.year - a.year)

  return config
}
