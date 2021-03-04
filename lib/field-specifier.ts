/***
 * A field specifier has the form:
 *    $fieldName{length}(type)/lookup
 * 
 *  With:
 *    fieldName - property to retrieve from data
 *    length - truncate data value to length
 *    type - convert value to the supplied type [integer, number, ymdate, nodecimal, npi]
 *    lookup - translate the retrieved value using a table name
 * 
 * Only $fieldName is required and optional modifiers mey be omitted, but must appear
 *  in the same sequence. Examples:
 * 
 *    $FIELD1
 *    $FIELD2(fromDateString)
 *    $FIELD2{5}(integer)
 *    $FIELD4/table_xref
 *    $FIELD5(nodecimal)/table2_xref
 *
 *  Note:
 *    Evaluation of the final value follows left to right order:
 * 
 *      $fieldName -> {length} -> (type) -> /lookup
 * 
 *  Type conversion functions (type):
 * 
 *    (integer) - convert to base-10 integer
 *    (number) - convert to floating point number
 *    (ymdate) - convert year/month date (YYYYMM) to full date (YYYY-MM-15)
 *    (nodecimal) - deprecated alias for (trimdecimal)
 *    (trimdecimal) - truncate the first decimal and any subsequent characters (XX.YY becomes XX)
 *    (npi) - pass only "valid" npi values, convert to null if length < 6
 *    (fromDateString) - convert any JS defined date format into YYYY-MM-DD
 *    (trim) - remove any leading or trailing whitespace characters
 *    (skipdecimal) - remove any embedded decimals (XX.YY becomes XXYY)
 */
// const matchReg = (s) => s.match(/^\$([^{}()/]+)(?:{(\d+)})?(?:\((\w+)\))?(?:\/(\w+))?/)

// function fieldComponents (fieldSpec) {
//   const matches = matchReg(fieldSpec)
//   if (matches === null) {
//     throw Error(`Invalid field specifier: "${fieldSpec}"`)
//   }
//   return {
//     field: matches[1],
//     length: matches[2],
//     type: matches[3],
//     lookup: matches[4]
//   }
// }

function fastFieldComponents (fieldSpec: string) {
  let state = 0
  const matched = ['', '', '', '']
  for (let i = 1; i < fieldSpec.length; i++) {
    const c = fieldSpec[i]
    switch (c) {
      case '{': state = 1; continue
      case '}': state = 0; continue
      case '(': state = 2; continue
      case ')': state = 0; continue
      case '/': state = 3; continue
    }
    matched[state] += c
  }
  return {
    field: matched[0] || undefined,
    length: matched[1] || undefined,
    type: matched[2] || undefined,
    lookup: matched[3] || undefined
  }
}

/***
 * tableBasePath is a path to a folder with static lookup tables saved as json
 */
export function FieldSpecifier(tableBasePath: string) {
  let deprecatedWarning = false
  const tables: { [key: string]: {} } = {}

  function lookupTable (tableName: string, key: string) {
    // Attempt to load any table not previously loaded
    if (typeof tables[tableName] === 'undefined') {
      console.error(`Loading table: ${tableName}`)
      const tablePath = require('path').join(tableBasePath, `${tableName}.json`)
      try {
        tables[tableName] = JSON.parse(require('fs').readFileSync(tablePath))
      } catch (err) {
        console.error(`Error: Cannot load lookup table "${tablePath}" ${err.message}`)
        tables[tableName] = false // Disable further attempts to load table
        return key
      }
    }
    // Return table value of key, or value of '' in the table, or value of key itself
    return tables[tableName]
      ? tables[tableName][key] || tables[tableName][''] || key
      : key
  }

  function parseFieldSpec (fieldSpec, data, headers, { version, ...options } = {}) {
    if (typeof fieldSpec !== 'string') {
      return fieldSpec
    }

    if (typeof headers !== 'function') {
      throw Error('headers() must be a function in field-specifier')
    }

    // Check for a sequence of "or" conditions by checking for "|"
    //  Return the first non-empty result or null
    if (fieldSpec.indexOf('|') !== -1) {
      const fields = fieldSpec.split('|')
      let val = null
      fields.forEach((f) => {
        if (!val) {
          val = parseFieldSpec(f, data, headers)
        }
      })
      return val
    }

    // If no prepended $, just return the string
    if (fieldSpec[0] !== '$') {
      return fieldSpec
    }

    const fld = fastFieldComponents(fieldSpec)

    // Retrieve the value from the row data
    let v = data[headers(fld.field)]

    // Truncate an existing value to a supplied length
    if (fld.length && v) {
      v = v.substring(0, fld.length)
    }

    // Convert an existing value using a supplied function
    if (fld.type && v) {
      switch (fld.type) {
        case 'integer': v = parseInt(v, 10)
          break
        case 'number': v = parseFloat(v)
          break
        case 'ymdate': v = `${v.substring(0, 4)}-${v.substring(4)}-15`
          break
        case 'nodecimal':
          if (!deprecatedWarning) {
            console.error('WARNING: (nodecimal) is deprecated, use (trimdecimal) instead')
            deprecatedWarning = true
          }
        case 'trimdecimal': v = v.replace(/\..*$/, '')
          break
        case 'npi': v = v.length > 5 ? v : null // Only pass valid NPIs, otherwise null
          break
        case 'fromDateString': v = (new Date(v)).toISOString().substring(0, 10)
          break
        case 'trim': v = v.trim()
          break
        case 'skipdecimal': v = v.replace(/\./, '')
          break
      }
    }

    // Perform table lookup after type conversion
    if (fld.lookup) {
      v = lookupTable(fld.lookup, v)
    }

    if (!v) {
      return null
    }

    return v
  }

  return parseFieldSpec
}
