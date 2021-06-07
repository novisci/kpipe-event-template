export type Modifiers = { [key: string]: (v: string) => string | number | null}
export const fieldModifiers: Modifiers = {
  integer: (v: string) => {
    const n = parseInt(v, 10)
    return isNaN(n) ? null : n
  },
  number: (v: string) => {
    const n = parseFloat(v)
    return isNaN(n) ? null : n
  },
  ymdate: (v: string) => `${v.substring(0, 4)}-${v.substring(4)}-15`,
  nodecimal: (v: string) => v.replace(/\..*$/, ''), // Deprecated
  trimdecimal: (v: string) => v.replace(/\..*$/, ''),
  npi: (v: string) => v.length > 5 ? v : null, // Only pass valid NPIs, otherwise null
  fromDateString: (v: string) => (new Date(v)).toISOString().substring(0, 10),
  trim: (v: string) => v.trim(),
  skipdecimal: (v: string) => v.replace(/\./g, '')
}

export function addModifiers (modifiers: Modifiers): void {
  Object.entries(modifiers).forEach((e) => {
    fieldModifiers[e[0]] = e[1]
  })
}

