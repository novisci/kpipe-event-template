"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addModifiers = exports.fieldModifiers = void 0;
exports.fieldModifiers = {
    integer: (v) => {
        const n = parseInt(v, 10);
        return isNaN(n) ? null : n;
    },
    number: (v) => {
        const n = parseFloat(v);
        return isNaN(n) ? null : n;
    },
    ymdate: (v) => `${v.substring(0, 4)}-${v.substring(4)}-15`,
    nodecimal: (v) => v.replace(/\..*$/, ''),
    trimdecimal: (v) => v.replace(/\..*$/, ''),
    npi: (v) => v.length > 5 ? v : null,
    fromDateString: (v) => (new Date(v)).toISOString().substring(0, 10),
    trim: (v) => v.trim(),
    skipdecimal: (v) => v.replace(/\./g, '')
};
function addModifiers(modifiers) {
    Object.entries(modifiers).forEach((e) => {
        exports.fieldModifiers[e[0]] = e[1];
    });
}
exports.addModifiers = addModifiers;
//# sourceMappingURL=modifiers.js.map