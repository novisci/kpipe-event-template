"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fieldValueFunction = void 0;
const modifiers_1 = require("./modifiers");
const reFieldSpec = new RegExp('^(([_A-Za-z0-9]+)|("[^"]*"))(\\{\\d+\\})?(\\(\\w+\\))?(/[^/ {}()"]+)?$');
function fieldComponents(fieldSpec) {
    const matched = fieldSpec.match(reFieldSpec);
    if (matched === null) {
        throw Error(`ERROR: Invalid field specifier ${fieldSpec}`);
    }
    const fspec = {
        field: matched[2],
        value: matched[3] && matched[3].slice(1, matched[3].length - 1),
        length: matched[4] && matched[4].slice(1, matched[4].length - 1),
        type: matched[5] && matched[5].slice(1, matched[5].length - 1),
        lookup: matched[6] && matched[6].slice(1),
    };
    return fspec;
}
function fieldFunc(field, headers) {
    const idx = headers.indexOf(field);
    if (idx !== -1) {
        return (rowData) => rowData[idx] || null;
    }
    return () => null;
}
function lengthFunc(length) {
    if (typeof length === 'undefined') {
        return (v) => v;
    }
    const len = parseInt(length, 10);
    if (isNaN(len)) {
        console.error(`ERROR: Length modifier is not a number ${length}`);
        return (v) => v;
    }
    return (v) => typeof v === 'string' ? v.substring(0, len) : null;
}
function typeFunc(type) {
    if (typeof type === 'undefined') {
        return (v) => v;
    }
    let fn;
    if (modifiers_1.fieldModifiers[type]) {
        fn = modifiers_1.fieldModifiers[type];
    }
    else {
        console.error(`ERROR: Undefined fieldSpecifier type modifier: ${type}`);
        fn = (v) => v;
    }
    return (v) => typeof v === 'string' ? fn(v) : null;
}
function lookupFunc(table, tableCache) {
    if (typeof table === 'undefined') {
        return (v) => v;
    }
    return (v) => tableCache.lookup(table, v);
}
// Retrieve the value from a specified field
function fieldValueFunction(fieldSpec, headers, tableCache) {
    const components = fieldComponents(fieldSpec);
    return (rowData) => lookupFunc(components.lookup, tableCache)(typeFunc(components.type)(lengthFunc(components.length)(components.field
        ? fieldFunc(components.field, headers)(rowData)
        : components.value)));
}
exports.fieldValueFunction = fieldValueFunction;
//# sourceMappingURL=fieldSpec.js.map