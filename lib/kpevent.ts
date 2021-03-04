export namespace KpEvent {
  export type Value = string | number | null
  export type Values = Value[]

  export type Obj = { [key: string]: Values | Value | Obj }

  export type Domain = string
  export type Key = string | number | null
  export type Tags = []

  export type Event = [Key, Key, Key, Domain, Tags, Obj]
}

