import { compileTemplate, RowData } from './template'
import { TableCache } from './tableCache'
import { StaticVars } from './fieldExpression'

let tableCache: TableCache
let rowData: RowData
let staticVars: StaticVars
let headers = ['A', 'B', 'C', 'D']

beforeEach(() => {
  tableCache = new TableCache('./test') // Local to project root
  rowData = new RowData()
  rowData.setRowData(['fred', 'ethel', 'lucy', 'ricky'])
  staticVars = {
    'VAR': 'B'
  }
})

const compile = (template: any) => compileTemplate(template, headers, tableCache, rowData, staticVars)
const stringify = (template: any) => JSON.stringify(compile(template))

test('String values are strings', () => { expect(stringify("A")).toBe('"A"')})
test('Number values are numbers', () => { expect(stringify(4)).toBe('4') })
test('null values are "null"', () => { expect(stringify(null)).toBe('null') })
test('Arrays produce arrays', () => { expect(stringify([1,2,3,4])).toBe('[1,2,3,4]') })
test('Objects produce objects', () => { expect(stringify({a:1,b:2,c:3})).toBe('{"a":1,"b":2,"c":3}') })

test('Simple field lookup', () => {
  expect(stringify({
    a: "a string",
    b: [ 1, '2', 3 ],
    c: {
      f: "$A",
      g: "$B",
      h: "$C"
    }
  })).toBe('{"a":"a string","b":[1,"2",3],"c":{"f":"fred","g":"ethel","h":"lucy"}}')
})

test('Repeated rowData sets', () => {
  const compiled = compile(['$A', '$B', '$C', '$D'])
  expect(JSON.stringify(compiled)).toBe('["fred","ethel","lucy","ricky"]')
  rowData.setRowData(['fred','wilma','barney','betty'])
  expect(JSON.stringify(compiled)).toBe('["fred","wilma","barney","betty"]')
})

test('Undefined fieldSpec field returns null', () => {expect(stringify('$F')).toBe('null')})

test('Field expressions', () => {
  expect(stringify({
      a: "${A}",
      b: "$${VAR}",
      c: "${C}-${D}-${A}"
    })).toBe('{"a":"fred","b":"ethel","c":"lucy-ricky-fred"}')
})