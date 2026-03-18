#!/usr/bin/env node

/**
 * Check for broken internal links in HTML files
 * This script validates that all local href and src attributes point to existing files
 */

const fs = require('fs')
const path = require('path')
const cheerio = require('cheerio')

// Get files from command line arguments
const files = process.argv.slice(2)

if (files.length === 0) {
  console.log('No HTML files to check')
  process.exit(0)
}

let hasErrors = false
const projectRoot = process.cwd()

// Helper function to check if a file exists
function fileExists (filePath) {
  try {
    return fs.existsSync(filePath)
  } catch (err) {
    return false
  }
}

// Helper function to resolve paths
function resolvePath (htmlFilePath, linkPath) {
  // Remove hash/query params
  const cleanPath = linkPath.split('#')[0].split('?')[0]

  // Skip empty paths, external URLs, data URIs, mailto, tel, etc.
  if (!cleanPath ||
      cleanPath.startsWith('http://') ||
      cleanPath.startsWith('https://') ||
      cleanPath.startsWith('//') ||
      cleanPath.startsWith('data:') ||
      cleanPath.startsWith('mailto:') ||
      cleanPath.startsWith('tel:')) {
    return null
  }

  // Handle root-relative paths (starting with /)
  if (cleanPath.startsWith('/')) {
    // Determine the web root based on the project structure
    // If the HTML file is inside _site/, the web root is _site/
    // Otherwise, assume it's the project root
    let webRoot = projectRoot
    if (htmlFilePath.includes(path.join(projectRoot, '_site'))) {
      webRoot = path.join(projectRoot, '_site')
    }
    return path.join(webRoot, cleanPath)
  }

  // Resolve relative paths based on the HTML file position
  const htmlDir = path.dirname(htmlFilePath)
  return path.resolve(htmlDir, cleanPath)
}

// Process each HTML file
files.forEach(htmlFile => {
  const htmlPath = path.resolve(projectRoot, htmlFile)

  if (!fileExists(htmlPath)) {
    console.error(`❌ Error: HTML file not found: ${htmlFile}`)
    hasErrors = true
    return
  }

  const html = fs.readFileSync(htmlPath, 'utf8')
  const $ = cheerio.load(html)
  const errors = []

  // Check href attributes (links, stylesheets)
  $('[href]').each((i, elem) => {
    const href = $(elem).attr('href')
    const resolvedPath = resolvePath(htmlPath, href)

    if (resolvedPath && !fileExists(resolvedPath)) {
      errors.push({
        type: 'href',
        value: href,
        element: elem.name
      })
    }
  })

  // Check src attributes (images, scripts)
  $('[src]').each((i, elem) => {
    const src = $(elem).attr('src')
    const resolvedPath = resolvePath(htmlPath, src)

    if (resolvedPath && !fileExists(resolvedPath)) {
      errors.push({
        type: 'src',
        value: src,
        element: elem.name
      })
    }
  })

  // Report errors for this file
  if (errors.length > 0) {
    console.error(`\n❌ Broken links in ${htmlFile}:`)
    errors.forEach(error => {
      console.error(`   - <${error.element} ${error.type}="${error.value}">`)
      console.error(`     File not found: ${error.value}`)
    })
    hasErrors = true
  }
})

if (hasErrors) {
  console.error('\n❌ Link check failed: Fix broken links above')
  process.exit(1)
} else {
  console.log('✅ All internal links are valid')
  process.exit(0)
}
