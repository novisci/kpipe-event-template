"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fieldValueFunction = void 0;
function fastFieldComponents(fieldSpec) {
    let state = 0;
    const matched = ['', '', '', ''];
    for (let i = 0; i < fieldSpec.length; i++) {
        const c = fieldSpec[i];
        switch (c) {
            case '{':
                state = 1;
                continue;
            case '}':
                state = 0;
                continue;
            case '(':
                state = 2;
                continue;
            case ')':
                state = 0;
                continue;
            case '/':
                state = 3;
                continue;
        }
        matched[state] += c;
    }
    // Validate?
    return {
        field: matched[0],
        length: matched[1] || undefined,
        type: matched[2] || undefined,
        lookup: matched[3] || undefined
    };
}
function fieldFunc(field, headers) {
    const idx = headers.indexOf(field);
    if (idx !== -1) {
        return (rowData) => rowData[idx] || null;
    }
    return () => null;
}
function lengthFunc(length) {
    let len;
    if (typeof length === 'undefined' || isNaN(len = parseInt(length, 10))) {
        return (v) => v;
    }
    return (v) => v && v.substring(0, len);
}
function typeFunc(type) {
    if (typeof type === 'undefined') {
        return (v) => v;
    }
    let fn;
    switch (type) {
        case 'integer':
            fn = (v) => parseInt(v, 10);
            break;
        case 'number':
            fn = (v) => parseFloat(v);
            break;
        case 'ymdate':
            fn = (v) => `${v.substring(0, 4)}-${v.substring(4)}-15`;
            break;
        case 'nodecimal':
            console.error('WARNING: (nodecimal) is deprecated, use (trimdecimal) instead');
            break;
        case 'trimdecimal':
            fn = (v) => v.replace(/\..*$/, '');
            break;
        case 'npi':
            fn = (v) => v.length > 5 ? v : null; // Only pass valid NPIs, otherwise null
            break;
        case 'fromDateString':
            fn = (v) => (new Date(v)).toISOString().substring(0, 10);
            break;
        case 'trim':
            fn = (v) => v.trim();
            break;
        case 'skipdecimal':
            fn = (v) => v.replace(/\./g, '');
            break;
        default:
            console.error(`ERROR: Undefined fieldSpecifier type modifier: ${type}`);
            fn = (v) => v;
            break;
    }
    return (v) => v && fn(v);
}
function lookupFunc(table, tableCache) {
    if (typeof table === 'undefined') {
        return (v) => v;
    }
    return (v) => v && tableCache.lookup(table, v.toString());
}
function fieldValueFunction(fieldSpec, headers, tableCache) {
    const components = fastFieldComponents(fieldSpec);
    return (rowData) => lookupFunc(components.lookup, tableCache)(typeFunc(components.type)(lengthFunc(components.length)(fieldFunc(components.field, headers)(rowData))));
}
exports.fieldValueFunction = fieldValueFunction;
//# sourceMappingURL=fieldSpec.js.map