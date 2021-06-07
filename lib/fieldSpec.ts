import { ITableCache } from './tableCache'
import { fieldModifiers, Modifiers } from './modifiers'

export type RowData = (string | null)[]
export type FieldSpecValue = string | number | null
export type FnConvert = (rowData: RowData) => FieldSpecValue

interface FieldSpecComponents {
  field: string
  length?: string
  type?: string
  lookup?: string
}

function fastFieldComponents (fieldSpec: string): FieldSpecComponents {
  let state = 0
  const matched = ['', '', '', '']
  for (let i = 0; i < fieldSpec.length; i++) {
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

interface ValueSpecComponents {
  value: string
  length?: string
  type?: string
  lookup?: string
}

function fastValueComponents (fieldSpec: string): ValueSpecComponents {
  let state = 0
  const matched = ['', '', '', '']
  for (let i = 0; i < fieldSpec.length; i++) {
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
    value: matched[0],
    length: matched[1] || undefined,
    type: matched[2] || undefined,
    lookup: matched[3] || undefined
  }
}

type FnField = (rowData: RowData) => string | null
type FnLength = (val: string | null) => string | null
type FnType = (val: string | null) => FieldSpecValue
type FnLookup = (val: FieldSpecValue) => FieldSpecValue

function fieldFunc (field: string, headers: string[]): FnField {
  const idx = headers.indexOf(field)
  if (idx !== -1) {
    return (rowData: RowData) => rowData[idx] || null
  }
  return () => null
}

function lengthFunc (length: string | undefined): FnLength {
  if (typeof length === 'undefined') {
    return (v: string | null) => v 
  }
  const len = parseInt(length, 10)
  if (isNaN(len)) {
    console.error(`ERROR: Length modifier is not a number ${length}`)
    return (v: string | null) => v
  }
  return (v: string | null) => typeof v === 'string' ? v.substring(0, len) : null
}

function typeFunc (type: string | undefined): FnType {
  if (typeof type === 'undefined') {
    return (v: string | null) => v
  }
  let fn: (v: string) => string | number | null

  if (fieldModifiers[type]) {
    fn = fieldModifiers[type]
  } else {
    console.error(`ERROR: Undefined fieldSpecifier type modifier: ${type}`)
    fn = (v: string) => v
  }

  return (v: string | null): FieldSpecValue => typeof v === 'string' ? fn(v) : null
}

function lookupFunc (table: string | undefined, tableCache: ITableCache): FnLookup {
  if (typeof table === 'undefined') {
    return (v: FieldSpecValue) => v
  }
  return (v: FieldSpecValue) => tableCache.lookup(table, v)
}

// Retrieve the value from a specified field
export function fieldValueFunction (fieldSpec: string, headers: string[], tableCache: ITableCache ): FnConvert {
  const components = fastFieldComponents(fieldSpec)

  return (rowData: (string | null)[]) =>
    lookupFunc(components.lookup, tableCache)(
      typeFunc(components.type)(
        lengthFunc(components.length)(
          fieldFunc(components.field, headers)(rowData)
        )
      )
    )
}

// Use a specific value (result of an expression) as input to modifier chain
export function valueFunction (fieldSpec: string, headers: string[], tableCache: ITableCache ): FnConvert {
  const components = fastValueComponents(fieldSpec)

  return (rowData: (string | null)[]) =>
    lookupFunc(components.lookup, tableCache)(
      typeFunc(components.type)(
        lengthFunc(components.length)(
          components.value
        )
      )
    )
}
