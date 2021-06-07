import * as path from 'path'
import * as fs from 'fs'
import { FieldSpecValue } from './fieldSpec'

export interface ITableCache {
  lookup (table: string, key: FieldSpecValue): FieldSpecValue
}

type LookupTable = { [key: string]: string | null }
export class TableCache implements ITableCache {
  private _tablesPath
  private _tables: { [key: string]: LookupTable | false } = {}

  constructor (tablesPath: string) {
    this._tablesPath = tablesPath
  }

  lookup (table: string, key: FieldSpecValue): FieldSpecValue {
    if (typeof this._tables[table] === 'undefined') {
      console.info(`Loading table: ${table}`)
      const tablePath = path.join(this._tablesPath, `${table}.json`)
      try {
        this._tables[table] = JSON.parse(fs.readFileSync(tablePath).toString())
      } catch (err) {
        console.error(`Error: Cannot load lookup table "${tablePath}" ${err.message}`)
        this._tables[table] = false // Disable further attempts to load table
      }
    }

    // Lookup key in the cached table
    if (this._tables[table] === false) {
      // Table not found, all queries return null
      return null
    } else {
      const tbl = this._tables[table] as LookupTable
      if (key !== null)  {
        const v = tbl[key.toString()] // Convert a numeric key to a string
        if (typeof v !== undefined) {
          // Table loaded and key exists, return table value
          return v
        }
      }
      // Return the default table value or key value if none defined
      const def = tbl['']
      return typeof def !== 'undefined' ? def : key
    }
  }
}
