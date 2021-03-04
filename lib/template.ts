import { KpEvent } from './kpevent'
import { fieldValueFunction, FieldSpecValue } from './fieldSpec'

// Valid types for an event template
namespace Template {
  export type Value = KpEvent.Value
}

interface IToken {
  setRowData (rowData: string[]): void
  toJSON (): string
}

class ValueToken implements IToken {
  private _val: string
  constructor (val: Template.Value) {
    this._val = JSON.stringify(val)
  }
  setRowData () {}
  toJSON () {
    return this._val
  }
}

class FieldSpecToken implements IToken {
  private _fieldSpec: string
  private _fnFieldValue: (rowData: string[]) => FieldSpecValue
  private _rowData?: string[]

  constructor (fieldSpec: string, headers: string[]) {
    this._fieldSpec = fieldSpec
    this._fnFieldValue = fieldValueFunction(fieldSpec, headers)
  }

  setRowData (rowData: string[]) {
    this._rowData = rowData
  }

  toJSON () {
    if (!this._rowData) {
      throw Error(`setRowData() must be called before token conversion`)
    }
    return JSON.stringify(this._fnFieldValue(this._rowData))
  }
}

type TemplateElement = IToken | string | number | null | TemplateElement[] | { [key: string]: TemplateElement }

export function compileTemplate (template: any, headers: string[]): TemplateElement {
  function compileValue (template: any): TemplateElement {
    if (Array.isArray(template)) {
      return template.map((t) => compileValue(t))
    }
    if (typeof template === 'object') {
      return Object.fromEntries(
        Object.entries(template).map(
          (e) =>[e[0], compileValue(e[1])]
        )
      )
    }
    if (typeof template !== 'string' || template[0] !== '$') {
      return new ValueToken(template)
    }
    const fieldSpec = template.slice(1)
    return new FieldSpecToken(fieldSpec, headers)
  }

  return compileValue(template)
}
