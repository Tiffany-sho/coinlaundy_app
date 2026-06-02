import { MOCK_TABLES, MOCK_USER } from '@/lib/mock-data'

type FilterOp = 'eq' | 'neq' | 'in' | 'is' | 'gt' | 'gte' | 'lt' | 'lte'

interface Filter {
  op: FilterOp
  col: string
  val: unknown
}

// join alias → how to resolve the nested data
const JOINS: Record<string, Record<string, {
  table: string
  localKey: string
  foreignKey: string
  many: boolean
}>> = {
  laundry_store: {
    machines: { table: 'machines', localKey: 'id', foreignKey: 'laundry_id', many: true },
  },
  organization_members: {
    organizations: { table: 'organizations', localKey: 'org_id', foreignKey: 'id', many: false },
  },
  collect_funds: {
    laundry_store: { table: 'laundry_store', localKey: 'laundry_id', foreignKey: 'id', many: false },
  },
  laundry_inventory: {
    inventory_types: { table: 'inventory_types', localKey: 'inventory_type_id', foreignKey: 'id', many: false },
  },
  action_message: {
    profiles: { table: 'profiles', localKey: 'actor_id', foreignKey: 'id', many: false },
  },
}

function parseJoinAliases(select: string): string[] {
  return (select.match(/(\w+)\(/g) ?? []).map((m) => m.slice(0, -1))
}

class MockQueryBuilder {
  private _table: string
  private _filters: Filter[] = []
  private _select = '*'
  private _countMode: string | null = null
  private _orders: Array<{ col: string; asc: boolean }> = []
  private _limit: number | null = null
  private _rangeFrom = 0
  private _rangeTo = 9999
  private _rangeSet = false

  constructor(table: string) {
    this._table = table
  }

  select(fields?: string, opts?: { count?: string }) {
    this._select = fields ?? '*'
    if (opts?.count) this._countMode = opts.count
    return this
  }

  eq(col: string, val: unknown) { this._filters.push({ op: 'eq', col, val }); return this }
  neq(col: string, val: unknown) { this._filters.push({ op: 'neq', col, val }); return this }
  in(col: string, val: unknown[]) { this._filters.push({ op: 'in', col, val }); return this }
  is(col: string, val: unknown) { this._filters.push({ op: 'is', col, val }); return this }
  gt(col: string, val: unknown) { this._filters.push({ op: 'gt', col, val }); return this }
  gte(col: string, val: unknown) { this._filters.push({ op: 'gte', col, val }); return this }
  lt(col: string, val: unknown) { this._filters.push({ op: 'lt', col, val }); return this }
  lte(col: string, val: unknown) { this._filters.push({ op: 'lte', col, val }); return this }

  order(col: string, opts?: { ascending?: boolean; nullsFirst?: boolean }) {
    this._orders.push({ col, asc: opts?.ascending ?? true })
    return this
  }

  limit(n: number) { this._limit = n; return this }

  range(from: number, to: number) {
    this._rangeFrom = from
    this._rangeTo = to
    this._rangeSet = true
    return this
  }

  single() {
    return Promise.resolve(this._run('single'))
  }

  maybeSingle() {
    return Promise.resolve(this._run('maybe'))
  }

  then(resolve: (val: unknown) => unknown, reject?: (err: unknown) => unknown) {
    return Promise.resolve(this._run('list')).then(resolve, reject)
  }

  private _applyFilter(row: Record<string, unknown>, f: Filter): boolean {
    const v = row[f.col]
    switch (f.op) {
      case 'eq': return v === f.val
      case 'neq': return v !== f.val
      case 'in': return Array.isArray(f.val) && f.val.includes(v)
      case 'is': return f.val === null ? (v === null || v === undefined) : v === f.val
      case 'gt': {
        if (typeof v === 'string' && typeof f.val === 'string') return v > f.val
        return (v as number) > (f.val as number)
      }
      case 'gte': {
        if (typeof v === 'string' && typeof f.val === 'string') return v >= f.val
        return (v as number) >= (f.val as number)
      }
      case 'lt': {
        if (typeof v === 'string' && typeof f.val === 'string') return v < f.val
        return (v as number) < (f.val as number)
      }
      case 'lte': {
        if (typeof v === 'string' && typeof f.val === 'string') return v <= f.val
        return (v as number) <= (f.val as number)
      }
    }
  }

  private _resolveJoins(rows: Record<string, unknown>[]): Record<string, unknown>[] {
    const joinAliases = parseJoinAliases(this._select)
    if (joinAliases.length === 0) return rows
    const tableDefs = JOINS[this._table] ?? {}
    return rows.map((row) => {
      const result = { ...row }
      for (const alias of joinAliases) {
        const def = tableDefs[alias]
        if (!def) { result[alias] = null; continue }
        const foreignRows = (MOCK_TABLES[def.table] ?? []) as Record<string, unknown>[]
        if (def.many) {
          result[alias] = foreignRows.filter((fr) => fr[def.foreignKey] === row[def.localKey])
        } else {
          result[alias] = foreignRows.find((fr) => fr[def.foreignKey] === row[def.localKey]) ?? null
        }
      }
      return result
    })
  }

  private _run(mode: 'single' | 'maybe' | 'list') {
    let rows = [...(MOCK_TABLES[this._table] ?? [])] as Record<string, unknown>[]

    for (const f of this._filters) {
      rows = rows.filter((r) => this._applyFilter(r, f))
    }

    for (const o of this._orders) {
      rows.sort((a, b) => {
        const av = a[o.col]
        const bv = b[o.col]
        if (av == null && bv == null) return 0
        if (av == null) return o.asc ? 1 : -1
        if (bv == null) return o.asc ? -1 : 1
        if (typeof av === 'string' && typeof bv === 'string') {
          return o.asc ? av.localeCompare(bv) : bv.localeCompare(av)
        }
        const na = av as number, nb = bv as number
        return o.asc ? (na < nb ? -1 : na > nb ? 1 : 0) : (na > nb ? -1 : na < nb ? 1 : 0)
      })
    }

    rows = this._resolveJoins(rows)

    const total = rows.length

    if (mode === 'single') {
      if (this._limit !== null) rows = rows.slice(0, this._limit)
      if (rows.length === 0) return { data: null, error: { code: 'PGRST116', message: 'No rows found' }, count: null }
      return { data: rows[0], error: null, count: null }
    }

    if (mode === 'maybe') {
      if (this._limit !== null) rows = rows.slice(0, this._limit)
      return { data: rows[0] ?? null, error: null, count: null }
    }

    // list
    const count = this._countMode ? total : null
    if (this._rangeSet) {
      rows = rows.slice(this._rangeFrom, this._rangeTo + 1)
    } else if (this._limit !== null) {
      rows = rows.slice(0, this._limit)
    }
    return { data: rows, error: null, count }
  }
}

class MockWriteBuilder {
  then(resolve: (val: unknown) => unknown) {
    return Promise.resolve({ data: null, error: null }).then(resolve)
  }
  eq() { return this }
  select() { return this }
  single() { return Promise.resolve({ data: null, error: null }) }
}

export function createMockClient() {
  return {
    auth: {
      getUser: () => Promise.resolve({ data: { user: MOCK_USER }, error: null }),
      getSession: () => Promise.resolve({ data: { session: { user: MOCK_USER } }, error: null }),
    },
    from: (table: string) => ({
      select: (fields?: string, opts?: { count?: string }) =>
        new MockQueryBuilder(table).select(fields, opts),
      insert: (_data: unknown) => new MockWriteBuilder(),
      update: (_data: unknown) => new MockWriteBuilder(),
      delete: () => new MockWriteBuilder(),
      upsert: (_data: unknown) => new MockWriteBuilder(),
    }),
    storage: {
      from: (_bucket: string) => ({
        upload: () => Promise.resolve({ data: null, error: null }),
        getPublicUrl: (_path: string) => ({ data: { publicUrl: '' } }),
      }),
    },
  }
}
