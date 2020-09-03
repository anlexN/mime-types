/*!
 * mime-types
 * Copyright(c) 2014 Jonathan Ong
 * Copyright(c) 2015 Douglas Christopher Wilson
 * Copyright(c) 2020 anlexN
 * MIT Licensed
 */

'use strict'

/**
 * Module dependencies.
 * @private
 */
const db = require('mime-db')
const extname = require('path').extname

/**
 * Module variables.
 * @private
 */
const EXTRACT_TYPE_REGEXP = /^\s*([A-Za-z0-9][A-Za-z0-9!#$&^_-]{0,126}\/[A-Za-z0-9][A-Za-z0-9!#$&^_.+-]{0,126})(?:;|\s|$)/
const types = {}

// Populate the extensions/mime-types maps
populateMaps(types)

/**
 * Get the default charset for a MIME type.
 *
 * @param {string} type
 * @return {boolean|string}
 */
function charset (type) {
  if (!type || typeof type !== 'string') {
    return false
  }

  type = type.toLowerCase()
  const match = type.match(EXTRACT_TYPE_REGEXP)

  if (match) {
    if (db[match[1]] && db[match[1]].charset) {
      return db[match[1]].charset
    }

    // default text/* to utf-8
    if (match[1].includes('text/')) {
      return 'UTF-8'
    }
  }

  return false
}

/**
 * Create a full Content-Type header given a MIME type or extension.
 *
 * @param {string} str
 * @return {boolean|string}
 */

function contentType (str) {
  // TODO: should this even be in this module?
  if (!str || typeof str !== 'string') {
    return false
  }

  let mime = str.includes('/')
    ? str
    : lookup(str)

  if (!mime) {
    return false
  }

  // TODO: use content-type or other module
  if (!mime.includes('charset')) {
    if (charset(mime)) mime = `${mime}; charset=${charset(mime).toLowerCase()}`
  }

  return mime
}

/**
 * Get the default extension for a MIME type.
 *
 * @param {string} type
 * @return {boolean|string}
 */

function extension (type) {
  if (!type || typeof type !== 'string') {
    return false
  }

  // TODO: use media-typer
  type = type.toLowerCase()
  const match = type.match(EXTRACT_TYPE_REGEXP)

  return (match && db[match[1]] && db[match[1]].extensions && db[match[1]].extensions[0]) || false
}

/**
 * Lookup the MIME type for a file path/extension.
 *
 * @param {string} path
 * @return {boolean|string}
 */

function lookup (path) {
  if (!path || typeof path !== 'string') {
    return false
  }

  // get the extension ("ext" or ".ext" or full path)
  const extension = extname('x.' + path)
    .toLowerCase()
    .substring(1)

  return (extension && types[extension]) || false
}

/**
 * Populate the extensions and types maps.
 * @private
 */
function populateMaps (types) {
  // source preference (least -> most)
  const preference = ['nginx', 'apache', undefined, 'iana']

  Object.keys(db).forEach(function forEachMimeType (type) {
    const extensions = db[type].extensions

    if (!extensions) {
      return
    }

    for (let i = 0; i < extensions.length; i++) {
      const extension = extensions[i]

      if (types[extension]) {
        const from = preference.indexOf(db[types[extension]].source)
        const to = preference.indexOf(db[type].source)

        if (types[extension] !== 'application/octet-stream' &&
          (from > to || (from === to && types[extension].includes('application/')))) {
          // skip the remapping
          continue
        }
      }

      // set the extension -> mime-types
      types[extension] = type
    }
  })
}

/**
 * Module exports.
 * @public
 */
module.exports = {
  charset,
  contentType,
  extension,
  lookup,
  types
}
