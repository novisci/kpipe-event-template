"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TableCache = void 0;
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
class TableCache {
    constructor(tablesPath) {
        this._tables = {};
        this._tablesPath = tablesPath;
    }
    lookup(table, key) {
        if (typeof this._tables[table] === 'undefined') {
            console.info(`Loading table: ${table}`);
            const tablePath = path.join(this._tablesPath, `${table}.json`);
            try {
                this._tables[table] = JSON.parse(fs.readFileSync(tablePath).toString());
            }
            catch (err) {
                console.error(`Error: Cannot load lookup table "${tablePath}" ${err.message}`);
                this._tables[table] = false; // Disable further attempts to load table
            }
        }
        // Lookup key in the cached table
        if (this._tables[table] === false) {
            // Table not found, all queries return null
            return null;
        }
        else {
            const tbl = this._tables[table];
            if (key !== null) {
                const v = tbl[key];
                if (typeof v !== undefined) {
                    // Table loaded and key exists, return table value
                    return v;
                }
            }
            // Return the default table value or null if none defined
            const def = tbl[''];
            return typeof def !== 'undefined' ? def : null;
        }
    }
}
exports.TableCache = TableCache;
//# sourceMappingURL=tableCache.js.map