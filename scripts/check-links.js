#!/usr/bin/env node

/**
 * Check for broken internal links and anchors in HTML or Nunjucks files
 * This script validates that all local href and src attributes point to existing files
 * and that hashes (#anchor) point to existing elements with matching IDs or names.
 */

const fs = require('fs')
const path = require('path')
const cheerio = require('cheerio')

// Get files from command line arguments
const files = process.argv.slice(2)

if (files.length === 0) {
  console.log('No files to check')
  process.exit(0)
}

let hasErrors = false
const projectRoot = process.cwd()

// Cache for file contents and IDs to avoid redundant processing
const fileCache = new Map()

// Helper function to check if a file exists
function fileExists (filePath) {
  try {
    return fs.existsSync(filePath)
  } catch (err) {
    return false
  }
}

// Helper function to extract IDs and names from a file
function getIdsFromFile (filePath) {
  if (fileCache.has(filePath)) {
    return fileCache.get(filePath).ids
  }

  if (!fileExists(filePath)) {
    return new Set()
  }

  try {
    const content = fs.readFileSync(filePath, 'utf8')
    const $ = cheerio.load(content)
    const ids = new Set()

    $('[id]').each((i, elem) => {
      const id = $(elem).attr('id')
      if (id) ids.add(id)
    })

    $('a[name]').each((i, elem) => {
      const name = $(elem).attr('name')
      if (name) ids.add(name)
    })

    fileCache.set(filePath, { ids })
    return ids
  } catch (err) {
    console.error(`⚠️ Warning: Could not parse file for IDs: ${filePath}`)
    return new Set()
  }
}

// Helper function to resolve paths
function resolvePath (htmlFilePath, linkPath) {
  // Remove hash/query params for file existence check
  const [cleanPath] = linkPath.split('#')[0].split('?')

  // Skip empty paths, external URLs, data URIs, mailto, tel, etc.
  if (!cleanPath && !linkPath.startsWith('#')) {
    return null
  }

  // Skip paths with Nunjucks/Liquid templates if they aren't rendered
  if (linkPath.includes('{{') || linkPath.includes('{%')) {
    return null
  }

  // If it's a same-page anchor
  if (linkPath.startsWith('#')) {
    return htmlFilePath
  }

  if (cleanPath.startsWith('http://') ||
      cleanPath.startsWith('https://') ||
      cleanPath.startsWith('//') ||
      cleanPath.startsWith('data:') ||
      cleanPath.startsWith('mailto:') ||
      cleanPath.startsWith('tel:')) {
    return null
  }

  // Handle root-relative paths (starting with /)
  if (cleanPath.startsWith('/')) {
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

// Process each file
files.forEach(file => {
  const filePath = path.resolve(projectRoot, file)

  if (!fileExists(filePath)) {
    console.error(`❌ Error: File not found: ${file}`)
    hasErrors = true
    return
  }

  const content = fs.readFileSync(filePath, 'utf8')
  const $ = cheerio.load(content)
  const errors = []

  // Pre-load IDs for the current file
  const currentFileIds = getIdsFromFile(filePath)

  // Check attributes
  const checkAttribute = (selector, attrName) => {
    $(selector).each((i, elem) => {
      const attrValue = $(elem).attr(attrName)
      if (!attrValue) return

      const resolvedPath = resolvePath(filePath, attrValue)
      if (!resolvedPath) return

      // 1. Check if the file exists
      if (!fileExists(resolvedPath)) {
        // Special case: if we are checking .njk files, they might point to .html files in _site
        // Try to see if there's a corresponding .njk file if the .html doesn't exist
        if (resolvedPath.endsWith('.html') && !fileExists(resolvedPath)) {
          const relativeToRoot = path.relative(projectRoot, resolvedPath)
          // Rough mapping of _site/pages/*.html to src/pages/*.njk
          let srcPath = resolvedPath.replace('_site', 'src').replace('.html', '.njk')
          if (fileExists(srcPath)) {
            // Acceptable for pre-commit on source files
          } else {
            // Also try without /pages/ if it was mapped differently
            srcPath = srcPath.replace('src/pages/', 'src/')
            if (!fileExists(srcPath)) {
              errors.push({
                type: attrName,
                value: attrValue,
                element: elem.name,
                message: `File not found: ${attrValue}`
              })
              return
            }
          }
        } else {
          errors.push({
            type: attrName,
            value: attrValue,
            element: elem.name,
            message: `File not found: ${attrValue}`
          })
          return
        }
      }

      // 2. Check the anchor (hash) if present
      if (attrValue.includes('#')) {
        const hash = attrValue.split('#')[1].split('?')[0]
        if (hash) {
          // If it's a same-page anchor or points to another local file we can parse
          const targetPathForIds = resolvedPath.endsWith('.html') || resolvedPath.endsWith('.njk')
            ? resolvedPath
            : null

          if (targetPathForIds) {
            const targetIds = getIdsFromFile(targetPathForIds)
            // Note: In Nunjucks, IDs might be generated or in includes.
            // We only error if we are reasonably sure it's a hardcoded ID check
            // and we are NOT in an include file (where anchors might point to other partials).
            if (targetIds.size > 0 && !targetIds.has(hash) && !targetPathForIds.includes('_includes')) {
              // Check if the hash looks like a dynamic value (Nunjucks/Liquid)
              if (hash.includes('{{') || hash.includes('{%')) {
                return
              }
              errors.push({
                type: attrName,
                value: attrValue,
                element: elem.name,
                message: `Anchor not found: #${hash} in ${path.relative(projectRoot, targetPathForIds)}`
              })
            }
          }
        }
      }
    })
  }

  checkAttribute('[href]', 'href')
  checkAttribute('[src]', 'src')

  // Report errors for this file
  if (errors.length > 0) {
    console.error(`\n❌ Issues in ${file}:`)
    errors.forEach(error => {
      console.error(`   - <${error.element} ${error.type}="${error.value}">`)
      console.error(`     ${error.message}`)
    })
    hasErrors = true
  }
})

if (hasErrors) {
  console.error('\n❌ Link check failed: Fix issues above')
  process.exit(1)
} else {
  console.log('✅ All internal links and anchors are valid')
  process.exit(0)
}
