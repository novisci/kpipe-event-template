export type FieldSpecValue = string | number | null
export type FnConvert = (rowData: string[]) => FieldSpecValue

interface FieldSpecComponents {
  field: string
  length?: string
  type?: string
  lookup?: string
}

function fastFieldComponents (fieldSpec: string): FieldSpecComponents {
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
  // Validate?
  return {
    field: matched[0],
    length: matched[1] || undefined,
    type: matched[2] || undefined,
    lookup: matched[3] || undefined
  }
}

type FnField = (rowData: string[]) => string | null
type FnLength = (val: string | null) => string | null
type FnType = (val: string | null) => FieldSpecValue
type FnLookup = (val: FieldSpecValue) => FieldSpecValue

function fieldFunc (field: string, headers: string[]): FnField {
  const idx = headers.indexOf(field)
  if (idx !== -1) {
    return (rowData: string[]) => rowData[idx] || null
  }
  return () => null
}

function lengthFunc (length: string | undefined): FnLength {
  let len: number
  if (typeof length === 'undefined' || isNaN(len = parseInt(length, 10))) {
    return (v: string | null) => v
  }
  return (v: string | null) => v && v.substring(0, len)
}

function typeFunc (type: string | undefined): FnType {
  if (typeof type === 'undefined') {
    return (v: string | null) => v
  }
  let fn: (v: string) => string | number | null

  switch (type) {
    case 'integer': 
      fn = (v: string) => parseInt(v, 10)
      break
    case 'number':
      fn = (v: string) => parseFloat(v)
      break
    case 'ymdate':
      fn = (v: string) => `${v.substring(0, 4)}-${v.substring(4)}-15`
      break
    case 'nodecimal':
      console.error('WARNING: (nodecimal) is deprecated, use (trimdecimal) instead')
      break
    case 'trimdecimal':
      fn = (v: string) => v.replace(/\..*$/, '')
      break
    case 'npi':
      fn = (v: string) => v.length > 5 ? v : null // Only pass valid NPIs, otherwise null
      break
    case 'fromDateString':
      fn = (v: string) => (new Date(v)).toISOString().substring(0, 10)
      break
    case 'trim':
      fn = (v: string) => v.trim()
      break
    case 'skipdecimal':
      fn = (v: string) => v.replace(/\./, '')
      break
    default:
      console.error(`Undefined fieldSpecifier type modifier: ${type}`)
      fn = (v: string) => v
      break
  }
  return (v: string | null): string | number | null => v && fn(v)
}

function lookupFunc (table: string | undefined): FnLookup {
  if (typeof table === 'undefined') {
    return (v: string | number | null) => v
  }
  console.error('WARNING: Table lookups not yet implemented')
  let lookupFn = (v: string) => v
  return (v: string | number | null) => v && lookupFn(v.toString())
}

export function fieldValueFunction (fieldSpec: string, headers: string[]): FnConvert {
  const components = fastFieldComponents(fieldSpec)

  return (rowData: string[]) =>
    lookupFunc(components.lookup)(
      typeFunc(components.type)(
        lengthFunc(components.length)(
          fieldFunc(components.field, headers)(rowData)
        )
      )
    )
}
