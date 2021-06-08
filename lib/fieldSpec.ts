import { ITableCache } from './tableCache'
import { fieldModifiers, Modifiers } from './modifiers'

export type RowData = (string | null)[]
export type FieldSpecValue = string | number | null
export type FnConvert = (rowData: RowData) => FieldSpecValue

interface FieldSpecComponents {
  field?: string
  value?: string
  length?: string
  type?: string
  lookup?: string
}

const reFieldSpec = new RegExp('^(([_A-Za-z0-9]+)|("[^"]*"))(\\{\\d+\\})?(\\(\\w+\\))?(/[^/ {}()"]+)?$')
function fieldComponents (fieldSpec: string): FieldSpecComponents {
  const matched = fieldSpec.match(reFieldSpec)
  if (matched === null) {
    throw Error(`ERROR: Invalid field specifier ${fieldSpec}`)
  }
  const fspec: FieldSpecComponents = {
    field: matched[2],
    value: matched[3] && matched[3].slice(1, matched[3].length - 1),
    length: matched[4] && matched[4].slice(1, matched[4].length - 1),
    type: matched[5] && matched[5].slice(1, matched[5].length - 1),
    lookup: matched[6] && matched[6].slice(1),
  }
  return fspec
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
  const components = fieldComponents(fieldSpec)

  return (rowData: (string | null)[]) =>
    lookupFunc(components.lookup, tableCache)(
      typeFunc(components.type)(
        lengthFunc(components.length)(
          components.field
            ? fieldFunc(components.field, headers)(rowData)
            : components.value as string
        )
      )
    )
}
