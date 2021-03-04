"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const template_1 = require("./template");
const tableCache_1 = require("./tableCache");
let tableCache;
let rowData;
let headers = ['A', 'B', 'C', 'D'];
beforeEach(() => {
    tableCache = new tableCache_1.TableCache('./test'); // Local to project root
    rowData = new template_1.RowData();
    rowData.setRowData(['fred', 'ethel', 'lucy', 'ricky']);
});
const compile = (template) => template_1.compileTemplate(template, headers, tableCache, rowData);
const stringify = (template) => JSON.stringify(compile(template));
test('String values are strings', () => { expect(stringify("A")).toBe('"A"'); });
test('Number values are numbers', () => { expect(stringify(4)).toBe('4'); });
test('null values are "null"', () => { expect(stringify(null)).toBe('null'); });
test('Arrays produce arrays', () => { expect(stringify([1, 2, 3, 4])).toBe('[1,2,3,4]'); });
test('Objects produce objects', () => { expect(stringify({ a: 1, b: 2, c: 3 })).toBe('{"a":1,"b":2,"c":3}'); });
test('Simple field lookup', () => {
    expect(stringify({
        a: "a string",
        b: [1, '2', 3],
        c: {
            f: "$A",
            g: "$B",
            h: "$C"
        }
    })).toBe('{"a":"a string","b":[1,"2",3],"c":{"f":"fred","g":"ethel","h":"lucy"}}');
});
test('Repeated rowData sets', () => {
    const compiled = compile(['$A', '$B', '$C', '$D']);
    expect(JSON.stringify(compiled)).toBe('["fred","ethel","lucy","ricky"]');
    rowData.setRowData(['fred', 'wilma', 'barney', 'betty']);
    expect(JSON.stringify(compiled)).toBe('["fred","wilma","barney","betty"]');
});
test('Invalid fieldSpec field returns null', () => { expect(stringify('$F')).toBe('null'); });
//# sourceMappingURL=template.test.js.map