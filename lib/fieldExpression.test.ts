import { expressionValueFunction } from './fieldExpression'
import { TableCache } from './tableCache'

let tableCache: TableCache
const headers = ['A', 'B', 'C', 'D']
const rowData = ['fred', 'betty', 'barney', 'wilma']

beforeAll(() => {
  tableCache = new TableCache('./test') // Local to project root
})

function expressionFn(expression: string, staticVars = {}) {
  return expressionValueFunction(expression, headers, tableCache, staticVars)
}

function testExpression(expression: string, rowData: string[], staticVars = {}) {
  return expressionFn(expression, staticVars)(rowData)
}

function testSimple(expression: string) {
  return expressionFn(expression)(rowData)
}

test('Simple math', () => {
  expect(testSimple('${4 + 5}')).toBe('9')
})

test('Lookup single row values', () => {
  expect(testExpression('${A}', rowData)).toBe('fred')
  expect(testExpression('${B}', rowData)).toBe('betty')
  expect(testExpression('${C}', rowData)).toBe('barney')
  expect(testExpression('${D}', rowData)).toBe('wilma')
})

test('Static variables evaluate as constants', () => {
  const staticVars = { 'VAR': 'gazoo' }
  const fn = expressionFn('${VAR}', staticVars)
  expect(fn(['fred', 'betty', 'barney', 'wilma'])).toBe('gazoo')
  expect(fn(['betty', 'barney', 'wilma', 'fred'])).toBe('gazoo')
})


test('Static variables evaluate to field specifier', () => {
  const staticVars = { 'VAR': 'A' }
  expect(testExpression('$${VAR}', rowData, staticVars)).toBe('fred')
})

test('Nested evaluation expression throws error', () => {
  const staticVars = { 'VAR': 'A' }
  expect(() => expressionFn('${${VAR}}', staticVars)).toThrow(Error)
})

test('quotes removed from static string results', () => {
  expect(testSimple('"fred"')).toBe('fred')
})

test('Test function concat()', () => {
  expect(testSimple('${concat("fred","sanford")}')).toBe('fredsanford')
  expect(testSimple('${concat("fred",A)}')).toBe('fredfred')
})

test('Test function ifelse()', () => {
  expect(testSimple('${ifelse(true, "barney", A)}')).toBe('barney')
  expect(testSimple('${ifelse(false, "barney", A)}')).toBe('fred')
})

test('Test function trim()', () => {
  expect(testSimple('${trim("  fred  ")}')).toBe('fred')
})

test('Test function skipdecimal()', () => {
  expect(testSimple('${skipdecimal("123.45")}')).toBe('12345')
})

test('Test function trimdecimal()', () => {
  expect(testSimple('${trimdecimal("123.45")}')).toBe('123')
})

test('Test compound expression with field specifier', () => {
  const staticVars = { 'VAR': 'C' }
  expect(testExpression('$${VAR}(integer)/test-lookup', ['11111', '2', '3', '4'], staticVars)).toBe('Three')
})