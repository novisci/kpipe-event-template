"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compileTemplate = void 0;
const fieldSpec_1 = require("./fieldSpec");
class ValueToken {
    constructor(val) {
        this._val = val;
    }
    setRowData() { }
    toJSON() {
        return JSON.stringify(this._val);
    }
}
class FieldSpecToken {
    constructor(fieldSpec, headers) {
        this._fieldSpec = fieldSpec;
        this._fnFieldValue = fieldSpec_1.fieldValueFunction(fieldSpec, headers);
    }
    setRowData(rowData) {
        this._rowData = rowData;
    }
    toJSON() {
        if (!this._rowData) {
            throw Error(`setRowData() must be called before token conversion`);
        }
        return JSON.stringify(this._fnFieldValue(this._rowData));
    }
}
function compileTemplate(template, headers) {
    function compileValue(template) {
        if (Array.isArray(template)) {
            return template.map((t) => compileValue(t));
        }
        if (typeof template === 'object') {
            return Object.fromEntries(Object.entries(template).map((e) => [e[0], compileValue(e[1])]));
        }
        if (typeof template !== 'string' || template[0] !== '$') {
            return new ValueToken(template);
        }
        const fieldSpec = template.slice(1);
        return new FieldSpecToken(fieldSpec, headers);
    }
    return compileValue(template);
}
exports.compileTemplate = compileTemplate;
//# sourceMappingURL=template.js.map