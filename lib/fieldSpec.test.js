"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fieldSpec_1 = require("./fieldSpec");
const tableCache_1 = require("./tableCache");
let tableCache;
beforeAll(() => {
    tableCache = new tableCache_1.TableCache('./test'); // Local to project root
});
function testFieldSpec(fieldSpec, rowData) {
    return fieldSpec_1.fieldValueFunction(fieldSpec, ['A', 'B', 'C', 'D'], tableCache)(rowData);
}
test('Simple field lookup', () => {
    expect(testFieldSpec('A', ['1', '2', '3', '4'])).toBe('1');
});
test('Truncate with field{length}', () => {
    expect(testFieldSpec('A{2}', ['11111', '2', '3', '4'])).toBe('11');
});
test('Convert with field(integer)', () => {
    expect(testFieldSpec('A(integer)', ['11111', '2', '3', '4'])).toBe(11111);
});
test('Convert with field(number)', () => {
    expect(testFieldSpec('A(number)', ['111.11', '2', '3', '4'])).toBe(111.11);
});
test('Convert with field(trim)', () => {
    expect(testFieldSpec('A(trim)', [' 11111  ', '2', '3', '4'])).toBe('11111');
});
test('Convert with field(trimdecimal)', () => {
    expect(testFieldSpec('A(trimdecimal)', ['111.11', '2', '3', '4'])).toBe('111');
});
test('Convert with field(skipdecimal)', () => {
    expect(testFieldSpec('A(skipdecimal)', ['111.11', '2', '3', '4'])).toBe('11111');
});
test('Convert YYYYMM to full date with field(ymdate)', () => {
    expect(testFieldSpec('C(ymdate)', ['111.11', '2', '197506', '4'])).toBe('1975-06-15');
});
test('Convert text date to YYYY-MM-DD with field(fromDateString)', () => {
    expect(testFieldSpec('C(fromDateString)', ['111.11', '2', 'March 2, 2021, 09:26:03', '4'])).toBe('2021-03-02');
});
test('Convert ISO date to YYYY-MM-DD with field(fromDateString)', () => {
    expect(testFieldSpec('C(fromDateString)', ['111.11', '2', '2021-03-03T00:02:24.362Z', '4'])).toBe('2021-03-03');
});
test('Convert YYYY-MM-DD date to YYYY-MM-DD with field(fromDateString)', () => {
    expect(testFieldSpec('C(fromDateString)', ['111.11', '2', '2021-03-03', '4'])).toBe('2021-03-03');
});
test('Truncate and convert with field{length}(integer)', () => {
    expect(testFieldSpec('A{3}(integer)', ['11111', '2', '3', '4'])).toBe(111);
});
test('Test lookup with field/table', () => {
    expect(testFieldSpec('B/test-lookup', ['11111', '2', '3', '4'])).toBe('Two');
});
test('Lookup returns default value with null key', () => {
    expect(testFieldSpec('B/test-lookup', ['11111', null, '3', '4'])).toBe('None');
});
test('Lookup returns default value when key is undefined', () => {
    expect(testFieldSpec('E/test-lookup', ['11111', '2', '3', '4'])).toBe('None');
});
test('Numeric lookup keys converted to strings in field(integer)/table', () => {
    expect(testFieldSpec('C(integer)/test-lookup', ['11111', '2', '3', '4'])).toBe('Three');
});
test('Lookup with no default passes through undefined or null key', () => {
    expect(testFieldSpec('E/test-lookup-no-default', ['11111', '2', '3', '4'])).toBe(null);
    expect(testFieldSpec('B/test-lookup-no-default', ['11111', null, '3', '4'])).toBe(null);
});
test('Test all modifiers with field{length}(modifier)/lookup', () => {
    expect(testFieldSpec('A{1}(integer)/test-lookup', ['11111', '2', '3', '4'])).toBe('One');
});
test('First element enclosed in quotes is treated as a value', () => {
    expect(testFieldSpec('"4444"', ['11111', '2', '3', '4'])).toBe('4444');
    expect(testFieldSpec('"4444"(integer)', ['11111', '2', '3', '4'])).toBe(4444);
    expect(testFieldSpec('"4444"{1}', ['11111', '2', '3', '4'])).toBe('4');
    expect(testFieldSpec('"4444"{1}(integer)', ['11111', '2', '3', '4'])).toBe(4);
    expect(testFieldSpec('"4444"{1}/test-lookup', ['11111', '2', '3', '4'])).toBe("Four");
});
test('Field specifier value (enclosed in quotes) may be empty', () => {
    expect(testFieldSpec('""(integer)', ['11111', '2', '3', '4'])).toBe(null);
});
test('Invalid field specifiers throw an error', () => {
    const badFieldSpecs = [
        '{4}', '/fred', 'field(mod){3}', 'field/lookup{fg}',
        '"value"(fred){5}'
    ];
    badFieldSpecs.forEach(s => expect(() => testFieldSpec(s, ['1', '2', '3', '4'])).toThrow(Error));
});
//# sourceMappingURL=fieldSpec.test.js.map