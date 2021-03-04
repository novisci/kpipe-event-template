"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compileTemplate = exports.RowData = void 0;
const fieldSpec_1 = require("./fieldSpec");
// The rowData class is observed by all the FieldSpecTokens to determine
//  the current field values for a row of data
class RowData {
    constructor() {
    }
    setRowData(rowData) {
        this._rowData = rowData;
    }
    getRowData() {
        if (typeof this._rowData === 'undefined') {
            throw Error(`ERROR: setRowData() must be called before getRowData()`);
        }
        return this._rowData;
    }
}
exports.RowData = RowData;
// The FieldSpec token holds a function which returns a fieldSpec's 
//  value given a set of row data. The function is generated during
//  initialization based on the parsed result of the fieldSpec.
//  
class FieldSpecToken {
    constructor(fieldSpec, headers, tableCache, rowData) {
        this._fieldSpec = fieldSpec;
        this._fnFieldValue = fieldSpec_1.fieldValueFunction(fieldSpec, headers, tableCache);
        this._rowData = rowData;
    }
    toJSON() {
        return this._fnFieldValue(this._rowData.getRowData());
    }
}
function compileTemplate(template, headers, tableCache, rowData) {
    function compileValue(template) {
        if (template === null) {
            return null;
        }
        if (Array.isArray(template)) {
            return template.map((t) => compileValue(t));
        }
        if (typeof template === 'object') {
            return Object.fromEntries(Object.entries(template).map((e) => [e[0], compileValue(e[1])]));
        }
        if (typeof template !== 'string' || template[0] !== '$') {
            return template; // Numbers and non-fieldspec strings are transferred as-is
        }
        const fieldSpec = template.slice(1);
        return new FieldSpecToken(fieldSpec, headers, tableCache, rowData);
    }
    return compileValue(template);
}
exports.compileTemplate = compileTemplate;
//# sourceMappingURL=template.js.map