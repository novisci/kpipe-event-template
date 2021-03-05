"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fieldValueFunction = exports.addModifiers = void 0;
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
const fieldModifiers = {
    integer: (v) => parseInt(v, 10),
    number: (v) => parseFloat(v),
    ymdate: (v) => `${v.substring(0, 4)}-${v.substring(4)}-15`,
    nodecimal: (v) => v.replace(/\..*$/, ''),
    trimdecimal: (v) => v.replace(/\..*$/, ''),
    npi: (v) => v.length > 5 ? v : null,
    fromDateString: (v) => (new Date(v)).toISOString().substring(0, 10),
    trim: (v) => v.trim(),
    skipdecimal: (v) => v.replace(/\./g, '')
};
function typeFunc(type) {
    if (typeof type === 'undefined') {
        return (v) => v;
    }
    let fn;
    if (fieldModifiers[type]) {
        fn = fieldModifiers[type];
    }
    else {
        console.error(`ERROR: Undefined fieldSpecifier type modifier: ${type}`);
        fn = (v) => v;
    }
    return (v) => v && fn(v);
}
function lookupFunc(table, tableCache) {
    if (typeof table === 'undefined') {
        return (v) => v;
    }
    return (v) => v && tableCache.lookup(table, v.toString());
}
function addModifiers(modifiers) {
    Object.entries(modifiers).forEach((e) => {
        fieldModifiers[e[0]] = e[1];
    });
}
exports.addModifiers = addModifiers;
function fieldValueFunction(fieldSpec, headers, tableCache) {
    const components = fastFieldComponents(fieldSpec);
    return (rowData) => lookupFunc(components.lookup, tableCache)(typeFunc(components.type)(lengthFunc(components.length)(fieldFunc(components.field, headers)(rowData))));
}
exports.fieldValueFunction = fieldValueFunction;
//# sourceMappingURL=fieldSpec.js.map