import { fieldValueFunction, FieldSpecValue } from './fieldSpec'
import { expressionValueFunction, StaticVars } from './fieldExpression'
import { ITableCache } from './tableCache'

// Row data observeable
interface IRowData {
  setRowData (rowData: string[]): void
  getRowData (): string[]
}

// The rowData class is observed by all the FieldSpecTokens to determine
//  the current field values for a row of data
export class RowData implements IRowData {
  private _rowData?: string[]
  constructor () {

  }
  setRowData (rowData: string[]): void {
    this._rowData = rowData
  }
  getRowData (): string[] {
    if (typeof this._rowData === 'undefined') {
      throw Error(`ERROR: setRowData() must be called before getRowData()`)
    }
    return this._rowData
  }
}

// Template value tokens
interface IToken {
  toJSON (): any
}

// The FieldSpec token holds a function which returns a fieldSpec's 
//  value given a set of row data. The function is generated during
//  initialization based on the parsed result of the fieldSpec.
//  
class FieldSpecToken implements IToken {
  private _fieldSpec: string
  private _fnFieldValue: (rowData: string[]) => FieldSpecValue
  private _rowData: IRowData

  constructor (fieldSpec: string, headers: string[], tableCache: ITableCache, rowData: IRowData) {
    this._fieldSpec = fieldSpec
    this._fnFieldValue = fieldValueFunction(fieldSpec, headers, tableCache)
    this._rowData = rowData
  }

  toJSON () {
    return this._fnFieldValue(this._rowData.getRowData())
  }
}


class ExpressionToken {
  private _expression: string
  private _fnExpressionValue: (rowData: string[]) => FieldSpecValue
  private _rowData: IRowData

  constructor(expression: string, headers: string[], tableCache: ITableCache, rowData: IRowData, staticVars: StaticVars = {}) {
    this._expression = expression
    this._fnExpressionValue = expressionValueFunction(expression, headers, tableCache, staticVars)
    this._rowData = rowData
  }
  toJSON() {
    return this._fnExpressionValue(this._rowData.getRowData())
  }
}

// Compile an incoming event template (with embedded field specifiers) and transform the
//  discovered fieldSpecs into a FieldSpecToken whose generated function will retrieve
//  its value from the supplied row data when the object is stringified as JSON
type TemplateElementObject = { [key: string]: TemplateElement }
type TemplateElement = IToken | string | number | null | TemplateElement[] | TemplateElementObject

export function compileTemplate (
  template: any,
  headers: string[],
  tableCache: ITableCache,
  rowData: IRowData,
  staticVars: StaticVars = {}
): TemplateElement {
  // Define a recursive compile function for the template context
  function compileValue (template: any): TemplateElement {
    if (typeof template === 'function') {
      throw Error(`Template element cannot be a function`)
    }
    if (template === null || typeof template === 'number') {
      // Numbers and null are passed through
      return template
    }
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

    if (template.indexOf('${') !== -1) {
      // Template string contains a field expression, create an expression token
      return new ExpressionToken(template, headers, tableCache, rowData, staticVars)
    }
    if (template[0] === '$') {
      // A template string starting with $ is a field specifier
      const fieldSpec = template.slice(1)
      return new FieldSpecToken(fieldSpec, headers, tableCache, rowData)
    }
    // non-fieldspec strings are transferred as-is
    return template 
  }

  return compileValue(template)
}

/***
 * Evaluate a template and return the value as an object (not stringified JSON)
 */
type TemplateValueObject = { [key: string]: TemplateValue }
type TemplateValue = string | number | null | TemplateValue[] | TemplateValueObject

function getObject (template: TemplateElementObject): TemplateValueObject {
  return Object.fromEntries(
    Object.entries(template).map(
      (e) =>[e[0], getValue(e[1])]
    )
  )
}

function getArray (template: TemplateElement[]): TemplateValue[] {
  const arr = []
  for(let i = 0; i < template.length; i++) {
    arr.push(getValue(template[i]))
  }
  return arr
  // return template.map((t) => getValue(t))
}

function getValue (template: TemplateElement): TemplateValue {
  if (typeof template === 'string' || template === null || typeof template === 'number') {
    // Numbers, strings, and null are passed through
    return template
  }
  if (typeof template === 'object') {
    if (Array.isArray(template)) {
      return getArray(template)
    }
    if (typeof template.toJSON === 'function') {
      return template.toJSON()
    }
    return getObject(template as TemplateElementObject)
  }
  throw Error(`Unhandled template element type: ${typeof template}`)
}

export function getTemplateValue (template: TemplateElement): TemplateValue {
  return getValue(template)
}
