"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTemplateValue = exports.compileTemplate = exports.RowData = void 0;
const fieldSpec_1 = require("./fieldSpec");
const fieldExpression_1 = require("./fieldExpression");
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
class ExpressionToken {
    constructor(expression, headers, tableCache, rowData, staticVars = {}) {
        this._expression = expression;
        this._fnExpressionValue = fieldExpression_1.expressionValueFunction(expression, headers, tableCache, staticVars);
        this._rowData = rowData;
    }
    toJSON() {
        return this._fnExpressionValue(this._rowData.getRowData());
    }
}
function compileTemplate(template, headers, tableCache, rowData, staticVars = {}) {
    // Define a recursive compile function for the template context
    function compileValue(template) {
        if (typeof template === 'function') {
            throw Error(`Template element cannot be a function`);
        }
        if (template === null || typeof template === 'number' || typeof template === 'boolean') {
            // Numbers, booleans, and null are passed through
            return template;
        }
        if (Array.isArray(template)) {
            return template.map((t) => compileValue(t));
        }
        if (typeof template === 'object') {
            return Object.fromEntries(Object.entries(template).map((e) => [e[0], compileValue(e[1])]));
        }
        if (!template.indexOf) {
            console.error(`Template ${template}`);
        }
        if (template.indexOf('${') !== -1) {
            // Template string contains a field expression, create an expression token
            return new ExpressionToken(template, headers, tableCache, rowData, staticVars);
        }
        if (template[0] === '$') {
            // A template string starting with $ is a field specifier
            const fieldSpec = template.slice(1);
            return new FieldSpecToken(fieldSpec, headers, tableCache, rowData);
        }
        // non-fieldspec strings are transferred as-is
        return template;
    }
    return compileValue(template);
}
exports.compileTemplate = compileTemplate;
function getObject(template) {
    return Object.fromEntries(Object.entries(template).map((e) => [e[0], getValue(e[1])]));
}
function getArray(template) {
    const arr = [];
    for (let i = 0; i < template.length; i++) {
        arr.push(getValue(template[i]));
    }
    return arr;
    // return template.map((t) => getValue(t))
}
function getValue(template) {
    if (typeof template === 'string' || template === null || typeof template === 'number' || typeof template === 'boolean') {
        // Numbers, booleans, strings, and null are passed through
        return template;
    }
    if (typeof template === 'object') {
        if (Array.isArray(template)) {
            return getArray(template);
        }
        if (typeof template.toJSON === 'function') {
            return template.toJSON();
        }
        return getObject(template);
    }
    throw Error(`Unhandled template element type: ${typeof template}`);
}
function getTemplateValue(template) {
    return getValue(template);
}
exports.getTemplateValue = getTemplateValue;
//# sourceMappingURL=template.js.map