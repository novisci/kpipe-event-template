"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expressionValueFunction = void 0;
const expr_eval_1 = require("expr-eval");
const fieldSpec_1 = require("./fieldSpec");
const modifiers_1 = require("./modifiers");
const parser = new expr_eval_1.Parser({
    operators: {
        assignment: false,
        logical: true,
        comparison: true
        // // These default to true, but are included for reference
        // add: true,
        // concatenate: true,
        // conditional: true,
        // divide: true,
        // factorial: true,
        // multiply: true,
        // power: true,
        // remainder: true,
        // subtract: true,
        // // Disable and, or, not, <, ==, !=, etc.
        // logical: false,
        // comparison: false,
        // // Disable 'in' and = operators
        // 'in': false,
        // assignment: false
    }
});
// Custom parser functions
parser.functions.concat = (...args) => args.reduce((a, c) => a + c, '');
parser.functions.ifelse = (cond, yes, no) => cond ? yes : no;
parser.functions.length = (str) => (typeof str === 'string' ? str.length : 0);
Object.entries(modifiers_1.fieldModifiers).forEach((e) => {
    if (parser.functions[e[0]]) {
        console.error(`WARNING: Parser function already exists: ${e[0]}`);
    }
    parser.functions[e[0]] = e[1];
});
// Custom constants
//parser.consts.R = ...
function getExpressionFunction(expression, headers, staticVars = {}) {
    // console.info(`Parsing "${expression}"`)
    const expr = parser.parse(expression);
    return expr.toJSFunction(headers.join(','), staticVars);
}
/***
 * Split the incoming expression into an array of strings or expression functions
 *  Check for an embedded expression matching pattern ${...expr...}
 *  Replace any with the result of the expression before passing to fieldSpecifier
 *  (allows for substitution in a fieldSpec variable before handling)
 */
function splitExpression(expr, headers, staticVars = {}) {
    const exprRegex = /(\$\{[^{}]*\})/;
    if (expr.indexOf('${') === -1) {
        return [expr];
    }
    const m = expr.match(exprRegex);
    if (!m || typeof m.index !== 'number') {
        throw Error(`Invalid expression in splitExpression(): ${expr}`);
    }
    const exprs = [
        splitExpression(expr.slice(0, m.index), headers, staticVars),
        getExpressionFunction(m[0].slice(2, m[0].length - 1), headers, staticVars),
        splitExpression(expr.slice(m.index + m[0].length), headers, staticVars)
    ];
    return exprs.flat().filter((e) => e !== '');
}
/***
 * Expression evalutaion function
 */
function expressionValueFunction(expression, headers, tableCache, staticVars = {}) {
    const exprs = splitExpression(expression, headers, staticVars);
    const exprFn = (rowData) => {
        let value = exprs.reduce((a, c) => {
            if (typeof c === 'function') {
                return a + c(...rowData);
            }
            return a + c;
        }, '');
        if (typeof value === 'string' && value.match(/^".*"$/)) {
            value = value.substring(1, value.length - 1);
        }
        return value;
    };
    // Check for expression resulting in a field specifier
    if (typeof exprs[0] === 'string' && exprs[0][0] === '$') {
        // console.info(exprs)
        // Only the field name itself may come from the expression, not modifiers, truncation, or lookup
        if (!(exprs[0] === '$' || exprs[0] === '$"') || typeof exprs[1] !== 'function' || exprs.slice(2).reduce((a, c) => (a || typeof c === 'function'), false)) {
            throw Error(`Field expression may only modify a field specifier's field or value component`);
        }
        // Expression evaluates to a field specifier, compute its function and compose
        return (rowData) => {
            // console.info(exprFn(rowData));
            return fieldSpec_1.fieldValueFunction(exprFn(rowData).slice(1), headers, tableCache)(rowData);
        };
    }
    else {
        // Not field specifier, just return the expression evaluation
        return exprFn;
    }
}
exports.expressionValueFunction = expressionValueFunction;
//# sourceMappingURL=fieldExpression.js.map