import * as path from 'path'
import * as fs from 'fs'

export interface ITableCache {
  lookup (table: string, key: string): string
}

export class TableCache implements ITableCache {
  private _tablesPath
  private _tables: { [key: string]: any } = {}

  constructor (tablesPath: string) {
    this._tablesPath = tablesPath
  }

  lookup (table: string, key: string) {
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
    // Return table value of key, or value of '' in the table, or value of key itself
    return this._tables[table]
      ? this._tables[table][key] || this._tables[table][''] || key
      : key
  }
}
