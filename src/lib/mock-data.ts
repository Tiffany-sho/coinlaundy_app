const ORG_ID = 'mock-org-001'
const USER_ID = 'mock-user-001'
const USER_ID_2 = 'mock-user-002'
const STORE_ID_1 = 'mock-store-001'
const STORE_ID_2 = 'mock-store-002'
const STORE_ID_3 = 'mock-store-003'
const IT_001 = 'mock-it-001'
const IT_002 = 'mock-it-002'
const IT_003 = 'mock-it-003'
const IT_004 = 'mock-it-004'

export const MOCK_USER = {
  id: USER_ID,
  email: 'demo@collecie.jp',
  phone: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  last_sign_in_at: '2026-05-27T09:00:00Z',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  role: 'authenticated',
}

const profiles = [
  {
    id: USER_ID,
    full_name: '田中 太郎',
    username: 'tanaka_taro',
    phone_number: '090-1234-5678',
    avatar_url: null,
    notification_email: 'demo@collecie.jp',
    role: 'admin',
    collect_method: 'machines',
    track_denominations: false,
    collection_cycle: 'monthly',
    updated_at: '2026-01-15T00:00:00Z',
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: USER_ID_2,
    full_name: '鈴木 花子',
    username: 'suzuki_hanako',
    phone_number: '080-9876-5432',
    avatar_url: null,
    notification_email: 'hanako@collecie.jp',
    role: 'collecter',
    collect_method: 'machines',
    track_denominations: false,
    collection_cycle: 'monthly',
    updated_at: '2026-01-20T00:00:00Z',
    created_at: '2026-01-10T00:00:00Z',
  },
]

const organizations = [
  {
    id: ORG_ID,
    name: 'コインランドリー田中グループ',
    owner_id: USER_ID,
    created_at: '2026-01-01T00:00:00Z',
  },
]

const organization_members = [
  {
    id: 'mock-member-001',
    org_id: ORG_ID,
    user_id: USER_ID,
    role: 'admin',
    joined_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'mock-member-002',
    org_id: ORG_ID,
    user_id: USER_ID_2,
    role: 'collecter',
    joined_at: '2026-01-10T00:00:00Z',
  },
]

const organization_invitations: Record<string, unknown>[] = []

const laundry_store = [
  {
    id: STORE_ID_1,
    organization_id: ORG_ID,
    owner_id: USER_ID,
    name: '渋谷店',
    location: '東京都渋谷区道玄坂1-2-3',
    description: '渋谷駅から徒歩5分。24時間営業。',
    images: null,
    created_at: '2026-01-05T00:00:00Z',
  },
  {
    id: STORE_ID_2,
    organization_id: ORG_ID,
    owner_id: USER_ID,
    name: '新宿店',
    location: '東京都新宿区歌舞伎町2-3-4',
    description: '新宿東口より徒歩3分。深夜も安心の防犯カメラ完備。',
    images: null,
    created_at: '2026-01-15T00:00:00Z',
  },
  {
    id: STORE_ID_3,
    organization_id: ORG_ID,
    owner_id: USER_ID,
    name: '池袋店',
    location: '東京都豊島区池袋3-4-5',
    description: '池袋西口すぐ。大型乾燥機あり。',
    images: null,
    created_at: '2026-02-01T00:00:00Z',
  },
]

const machines = [
  // 渋谷店
  {
    id: 'mock-machine-001',
    laundry_id: STORE_ID_1,
    name: '洗濯機（大型）',
    unit_count: 3,
    is_broken: false,
    comment: null,
    sort_order: 1,
    updated_by: null,
    updated_at: null,
    created_at: '2026-01-05T00:00:00Z',
  },
  {
    id: 'mock-machine-002',
    laundry_id: STORE_ID_1,
    name: '洗濯機（小型）',
    unit_count: 2,
    is_broken: false,
    comment: null,
    sort_order: 2,
    updated_by: null,
    updated_at: null,
    created_at: '2026-01-05T00:00:00Z',
  },
  {
    id: 'mock-machine-003',
    laundry_id: STORE_ID_1,
    name: '乾燥機',
    unit_count: 4,
    is_broken: false,
    comment: null,
    sort_order: 3,
    updated_by: null,
    updated_at: null,
    created_at: '2026-01-05T00:00:00Z',
  },
  // 新宿店
  {
    id: 'mock-machine-004',
    laundry_id: STORE_ID_2,
    name: '洗濯機',
    unit_count: 4,
    is_broken: true,
    comment: '3号機のドア部分が故障中。修理依頼済み。',
    sort_order: 1,
    updated_by: USER_ID,
    updated_at: '2026-05-20T14:30:00Z',
    created_at: '2026-01-15T00:00:00Z',
  },
  {
    id: 'mock-machine-005',
    laundry_id: STORE_ID_2,
    name: '乾燥機',
    unit_count: 3,
    is_broken: false,
    comment: null,
    sort_order: 2,
    updated_by: null,
    updated_at: null,
    created_at: '2026-01-15T00:00:00Z',
  },
  // 池袋店
  {
    id: 'mock-machine-006',
    laundry_id: STORE_ID_3,
    name: '洗濯機',
    unit_count: 3,
    is_broken: false,
    comment: null,
    sort_order: 1,
    updated_by: null,
    updated_at: null,
    created_at: '2026-02-01T00:00:00Z',
  },
  {
    id: 'mock-machine-007',
    laundry_id: STORE_ID_3,
    name: '乾燥機（大型）',
    unit_count: 2,
    is_broken: false,
    comment: null,
    sort_order: 2,
    updated_by: null,
    updated_at: null,
    created_at: '2026-02-01T00:00:00Z',
  },
]

const inventory_types = [
  {
    id: IT_001,
    org_id: ORG_ID,
    name: '洗剤',
    unit: '個',
    alert_threshold: 5,
    sort_order: 1,
    created_at: '2026-01-05T00:00:00Z',
  },
  {
    id: IT_002,
    org_id: ORG_ID,
    name: '柔軟剤',
    unit: '個',
    alert_threshold: 5,
    sort_order: 2,
    created_at: '2026-01-05T00:00:00Z',
  },
  {
    id: IT_003,
    org_id: ORG_ID,
    name: 'ランドリーバッグ',
    unit: '枚',
    alert_threshold: 10,
    sort_order: 3,
    created_at: '2026-01-05T00:00:00Z',
  },
  {
    id: IT_004,
    org_id: ORG_ID,
    name: '高圧洗浄剤',
    unit: '個',
    alert_threshold: 3,
    sort_order: 4,
    created_at: '2026-01-05T00:00:00Z',
  },
]

const laundry_inventory = [
  // 渋谷店
  { id: 'mock-inv-001', laundry_id: STORE_ID_1, inventory_type_id: IT_001, quantity: 3, updated_by: USER_ID, updated_at: '2026-05-20T10:00:00Z' },
  { id: 'mock-inv-002', laundry_id: STORE_ID_1, inventory_type_id: IT_002, quantity: 8, updated_by: USER_ID, updated_at: '2026-05-20T10:00:00Z' },
  { id: 'mock-inv-003', laundry_id: STORE_ID_1, inventory_type_id: IT_003, quantity: 25, updated_by: USER_ID, updated_at: '2026-05-20T10:00:00Z' },
  { id: 'mock-inv-004', laundry_id: STORE_ID_1, inventory_type_id: IT_004, quantity: 4, updated_by: USER_ID, updated_at: '2026-05-20T10:00:00Z' },
  // 新宿店
  { id: 'mock-inv-005', laundry_id: STORE_ID_2, inventory_type_id: IT_001, quantity: 6, updated_by: USER_ID_2, updated_at: '2026-05-18T11:00:00Z' },
  { id: 'mock-inv-006', laundry_id: STORE_ID_2, inventory_type_id: IT_002, quantity: 2, updated_by: USER_ID_2, updated_at: '2026-05-18T11:00:00Z' },
  { id: 'mock-inv-007', laundry_id: STORE_ID_2, inventory_type_id: IT_003, quantity: 18, updated_by: USER_ID_2, updated_at: '2026-05-18T11:00:00Z' },
  { id: 'mock-inv-008', laundry_id: STORE_ID_2, inventory_type_id: IT_004, quantity: 5, updated_by: USER_ID_2, updated_at: '2026-05-18T11:00:00Z' },
  // 池袋店
  { id: 'mock-inv-009', laundry_id: STORE_ID_3, inventory_type_id: IT_001, quantity: 10, updated_by: USER_ID_2, updated_at: '2026-05-15T14:00:00Z' },
  { id: 'mock-inv-010', laundry_id: STORE_ID_3, inventory_type_id: IT_002, quantity: 12, updated_by: USER_ID_2, updated_at: '2026-05-15T14:00:00Z' },
  { id: 'mock-inv-011', laundry_id: STORE_ID_3, inventory_type_id: IT_003, quantity: 7, updated_by: USER_ID_2, updated_at: '2026-05-15T14:00:00Z' },
  { id: 'mock-inv-012', laundry_id: STORE_ID_3, inventory_type_id: IT_004, quantity: 1, updated_by: USER_ID_2, updated_at: '2026-05-15T14:00:00Z' },
]

function funds(storeId: string, machineIds: string[], machineNames: string[], amounts: number[]) {
  return machineIds.map((id, i) => ({
    machine_id: id,
    name: machineNames[i],
    amount: amounts[i],
  }))
}

const collect_funds = [
  // ===== 渋谷店 =====
  {
    id: 'mock-cf-001', laundry_id: STORE_ID_1, collected_at: '2026-01-10T10:00:00Z',
    total_funds: 92100, collector_id: USER_ID, created_at: '2026-01-10T10:30:00Z',
    funds_array: funds(STORE_ID_1, ['mock-machine-001', 'mock-machine-002', 'mock-machine-003'], ['洗濯機（大型）', '洗濯機（小型）', '乾燥機'], [42000, 18500, 31600]),
  },
  {
    id: 'mock-cf-002', laundry_id: STORE_ID_1, collected_at: '2026-01-25T10:00:00Z',
    total_funds: 97300, collector_id: USER_ID, created_at: '2026-01-25T10:30:00Z',
    funds_array: funds(STORE_ID_1, ['mock-machine-001', 'mock-machine-002', 'mock-machine-003'], ['洗濯機（大型）', '洗濯機（小型）', '乾燥機'], [44500, 19800, 33000]),
  },
  {
    id: 'mock-cf-003', laundry_id: STORE_ID_1, collected_at: '2026-02-08T10:00:00Z',
    total_funds: 95800, collector_id: USER_ID, created_at: '2026-02-08T10:30:00Z',
    funds_array: funds(STORE_ID_1, ['mock-machine-001', 'mock-machine-002', 'mock-machine-003'], ['洗濯機（大型）', '洗濯機（小型）', '乾燥機'], [43500, 19200, 33100]),
  },
  {
    id: 'mock-cf-004', laundry_id: STORE_ID_1, collected_at: '2026-02-22T10:00:00Z',
    total_funds: 99400, collector_id: USER_ID, created_at: '2026-02-22T10:30:00Z',
    funds_array: funds(STORE_ID_1, ['mock-machine-001', 'mock-machine-002', 'mock-machine-003'], ['洗濯機（大型）', '洗濯機（小型）', '乾燥機'], [45200, 20600, 33600]),
  },
  {
    id: 'mock-cf-005', laundry_id: STORE_ID_1, collected_at: '2026-03-07T10:00:00Z',
    total_funds: 86200, collector_id: USER_ID_2, created_at: '2026-03-07T10:30:00Z',
    funds_array: funds(STORE_ID_1, ['mock-machine-001', 'mock-machine-002', 'mock-machine-003'], ['洗濯機（大型）', '洗濯機（小型）', '乾燥機'], [39000, 17200, 30000]),
  },
  {
    id: 'mock-cf-006', laundry_id: STORE_ID_1, collected_at: '2026-03-21T10:00:00Z',
    total_funds: 92400, collector_id: USER_ID, created_at: '2026-03-21T10:30:00Z',
    funds_array: funds(STORE_ID_1, ['mock-machine-001', 'mock-machine-002', 'mock-machine-003'], ['洗濯機（大型）', '洗濯機（小型）', '乾燥機'], [42000, 18400, 32000]),
  },
  {
    id: 'mock-cf-007', laundry_id: STORE_ID_1, collected_at: '2026-04-04T10:00:00Z',
    total_funds: 98300, collector_id: USER_ID, created_at: '2026-04-04T10:30:00Z',
    funds_array: funds(STORE_ID_1, ['mock-machine-001', 'mock-machine-002', 'mock-machine-003'], ['洗濯機（大型）', '洗濯機（小型）', '乾燥機'], [44500, 19800, 34000]),
  },
  {
    id: 'mock-cf-008', laundry_id: STORE_ID_1, collected_at: '2026-04-18T10:00:00Z',
    total_funds: 103500, collector_id: USER_ID, created_at: '2026-04-18T10:30:00Z',
    funds_array: funds(STORE_ID_1, ['mock-machine-001', 'mock-machine-002', 'mock-machine-003'], ['洗濯機（大型）', '洗濯機（小型）', '乾燥機'], [47000, 21000, 35500]),
  },
  {
    id: 'mock-cf-009', laundry_id: STORE_ID_1, collected_at: '2026-05-09T10:00:00Z',
    total_funds: 95700, collector_id: USER_ID, created_at: '2026-05-09T10:30:00Z',
    funds_array: funds(STORE_ID_1, ['mock-machine-001', 'mock-machine-002', 'mock-machine-003'], ['洗濯機（大型）', '洗濯機（小型）', '乾燥機'], [43500, 19200, 33000]),
  },
  // ===== 新宿店 =====
  {
    id: 'mock-cf-010', laundry_id: STORE_ID_2, collected_at: '2026-01-12T11:00:00Z',
    total_funds: 72600, collector_id: USER_ID_2, created_at: '2026-01-12T11:30:00Z',
    funds_array: funds(STORE_ID_2, ['mock-machine-004', 'mock-machine-005'], ['洗濯機', '乾燥機'], [41200, 31400]),
  },
  {
    id: 'mock-cf-011', laundry_id: STORE_ID_2, collected_at: '2026-01-27T11:00:00Z',
    total_funds: 72600, collector_id: USER_ID_2, created_at: '2026-01-27T11:30:00Z',
    funds_array: funds(STORE_ID_2, ['mock-machine-004', 'mock-machine-005'], ['洗濯機', '乾燥機'], [40900, 31700]),
  },
  {
    id: 'mock-cf-012', laundry_id: STORE_ID_2, collected_at: '2026-02-10T11:00:00Z',
    total_funds: 76400, collector_id: USER_ID_2, created_at: '2026-02-10T11:30:00Z',
    funds_array: funds(STORE_ID_2, ['mock-machine-004', 'mock-machine-005'], ['洗濯機', '乾燥機'], [43200, 33200]),
  },
  {
    id: 'mock-cf-013', laundry_id: STORE_ID_2, collected_at: '2026-02-24T11:00:00Z',
    total_funds: 76400, collector_id: USER_ID_2, created_at: '2026-02-24T11:30:00Z',
    funds_array: funds(STORE_ID_2, ['mock-machine-004', 'mock-machine-005'], ['洗濯機', '乾燥機'], [43000, 33400]),
  },
  {
    id: 'mock-cf-014', laundry_id: STORE_ID_2, collected_at: '2026-03-11T11:00:00Z',
    total_funds: 69300, collector_id: USER_ID_2, created_at: '2026-03-11T11:30:00Z',
    funds_array: funds(STORE_ID_2, ['mock-machine-004', 'mock-machine-005'], ['洗濯機', '乾燥機'], [39200, 30100]),
  },
  {
    id: 'mock-cf-015', laundry_id: STORE_ID_2, collected_at: '2026-03-25T11:00:00Z',
    total_funds: 69300, collector_id: USER_ID, created_at: '2026-03-25T11:30:00Z',
    funds_array: funds(STORE_ID_2, ['mock-machine-004', 'mock-machine-005'], ['洗濯機', '乾燥機'], [39100, 30200]),
  },
  {
    id: 'mock-cf-016', laundry_id: STORE_ID_2, collected_at: '2026-04-08T11:00:00Z',
    total_funds: 79200, collector_id: USER_ID_2, created_at: '2026-04-08T11:30:00Z',
    funds_array: funds(STORE_ID_2, ['mock-machine-004', 'mock-machine-005'], ['洗濯機', '乾燥機'], [44800, 34400]),
  },
  {
    id: 'mock-cf-017', laundry_id: STORE_ID_2, collected_at: '2026-04-22T11:00:00Z',
    total_funds: 79200, collector_id: USER_ID_2, created_at: '2026-04-22T11:30:00Z',
    funds_array: funds(STORE_ID_2, ['mock-machine-004', 'mock-machine-005'], ['洗濯機', '乾燥機'], [44700, 34500]),
  },
  {
    id: 'mock-cf-018', laundry_id: STORE_ID_2, collected_at: '2026-05-13T11:00:00Z',
    total_funds: 73200, collector_id: USER_ID_2, created_at: '2026-05-13T11:30:00Z',
    funds_array: funds(STORE_ID_2, ['mock-machine-004', 'mock-machine-005'], ['洗濯機', '乾燥機'], [41400, 31800]),
  },
  // ===== 池袋店 =====
  {
    id: 'mock-cf-019', laundry_id: STORE_ID_3, collected_at: '2026-01-14T13:00:00Z',
    total_funds: 49200, collector_id: USER_ID_2, created_at: '2026-01-14T13:30:00Z',
    funds_array: funds(STORE_ID_3, ['mock-machine-006', 'mock-machine-007'], ['洗濯機', '乾燥機（大型）'], [27600, 21600]),
  },
  {
    id: 'mock-cf-020', laundry_id: STORE_ID_3, collected_at: '2026-01-28T13:00:00Z',
    total_funds: 49200, collector_id: USER_ID_2, created_at: '2026-01-28T13:30:00Z',
    funds_array: funds(STORE_ID_3, ['mock-machine-006', 'mock-machine-007'], ['洗濯機', '乾燥機（大型）'], [27500, 21700]),
  },
  {
    id: 'mock-cf-021', laundry_id: STORE_ID_3, collected_at: '2026-02-11T13:00:00Z',
    total_funds: 52800, collector_id: USER_ID_2, created_at: '2026-02-11T13:30:00Z',
    funds_array: funds(STORE_ID_3, ['mock-machine-006', 'mock-machine-007'], ['洗濯機', '乾燥機（大型）'], [29600, 23200]),
  },
  {
    id: 'mock-cf-022', laundry_id: STORE_ID_3, collected_at: '2026-02-25T13:00:00Z',
    total_funds: 52800, collector_id: USER_ID_2, created_at: '2026-02-25T13:30:00Z',
    funds_array: funds(STORE_ID_3, ['mock-machine-006', 'mock-machine-007'], ['洗濯機', '乾燥機（大型）'], [29700, 23100]),
  },
  {
    id: 'mock-cf-023', laundry_id: STORE_ID_3, collected_at: '2026-03-14T13:00:00Z',
    total_funds: 46400, collector_id: USER_ID_2, created_at: '2026-03-14T13:30:00Z',
    funds_array: funds(STORE_ID_3, ['mock-machine-006', 'mock-machine-007'], ['洗濯機', '乾燥機（大型）'], [26000, 20400]),
  },
  {
    id: 'mock-cf-024', laundry_id: STORE_ID_3, collected_at: '2026-03-28T13:00:00Z',
    total_funds: 46400, collector_id: USER_ID_2, created_at: '2026-03-28T13:30:00Z',
    funds_array: funds(STORE_ID_3, ['mock-machine-006', 'mock-machine-007'], ['洗濯機', '乾燥機（大型）'], [26100, 20300]),
  },
  {
    id: 'mock-cf-025', laundry_id: STORE_ID_3, collected_at: '2026-04-11T13:00:00Z',
    total_funds: 56200, collector_id: USER_ID_2, created_at: '2026-04-11T13:30:00Z',
    funds_array: funds(STORE_ID_3, ['mock-machine-006', 'mock-machine-007'], ['洗濯機', '乾燥機（大型）'], [31500, 24700]),
  },
  {
    id: 'mock-cf-026', laundry_id: STORE_ID_3, collected_at: '2026-04-25T13:00:00Z',
    total_funds: 56200, collector_id: USER_ID_2, created_at: '2026-04-25T13:30:00Z',
    funds_array: funds(STORE_ID_3, ['mock-machine-006', 'mock-machine-007'], ['洗濯機', '乾燥機（大型）'], [31600, 24600]),
  },
  {
    id: 'mock-cf-027', laundry_id: STORE_ID_3, collected_at: '2026-05-16T13:00:00Z',
    total_funds: 52600, collector_id: USER_ID_2, created_at: '2026-05-16T13:30:00Z',
    funds_array: funds(STORE_ID_3, ['mock-machine-006', 'mock-machine-007'], ['洗濯機', '乾燥機（大型）'], [29500, 23100]),
  },
]

const action_message = [
  {
    id: 1, org_id: ORG_ID, actor_id: USER_ID,
    message: '店舗「渋谷店」を作成しました',
    occurred_at: '2026-01-05T09:00:00Z',
  },
  {
    id: 2, org_id: ORG_ID, actor_id: USER_ID,
    message: '店舗「新宿店」を作成しました',
    occurred_at: '2026-01-15T09:00:00Z',
  },
  {
    id: 3, org_id: ORG_ID, actor_id: USER_ID,
    message: '鈴木 花子さんをメンバーに招待しました（collecter）',
    occurred_at: '2026-01-10T10:00:00Z',
  },
  {
    id: 4, org_id: ORG_ID, actor_id: USER_ID,
    message: '店舗「池袋店」を作成しました',
    occurred_at: '2026-02-01T09:00:00Z',
  },
  {
    id: 5, org_id: ORG_ID, actor_id: USER_ID_2,
    message: '渋谷店で集金を記録しました（¥92,100）',
    occurred_at: '2026-03-07T10:30:00Z',
  },
  {
    id: 6, org_id: ORG_ID, actor_id: USER_ID,
    message: '新宿店の洗濯機を故障中にマークしました',
    occurred_at: '2026-05-20T14:30:00Z',
  },
  {
    id: 7, org_id: ORG_ID, actor_id: USER_ID_2,
    message: '新宿店で集金を記録しました（¥73,200）',
    occurred_at: '2026-05-13T11:30:00Z',
  },
  {
    id: 8, org_id: ORG_ID, actor_id: USER_ID,
    message: '渋谷店で集金を記録しました（¥95,700）',
    occurred_at: '2026-05-09T10:30:00Z',
  },
  {
    id: 9, org_id: ORG_ID, actor_id: USER_ID_2,
    message: '池袋店で集金を記録しました（¥52,600）',
    occurred_at: '2026-05-16T13:30:00Z',
  },
  {
    id: 10, org_id: ORG_ID, actor_id: USER_ID_2,
    message: '池袋店の在庫を更新しました（高圧洗浄剤: 3→1）',
    occurred_at: '2026-05-15T14:00:00Z',
  },
]

export const MOCK_TABLES: Record<string, Record<string, unknown>[]> = {
  profiles,
  organizations,
  organization_members,
  organization_invitations,
  laundry_store,
  machines,
  inventory_types,
  laundry_inventory,
  collect_funds,
  action_message,
}
