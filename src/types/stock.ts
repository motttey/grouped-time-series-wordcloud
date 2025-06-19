export interface StockItem {
  word: string // 銘柄名
  code: number // 証券コード
  close: number // 終値
  volume: number // 出来高
  total: number // 売買代金
  size?: number // サイズ
}

export interface CategoryNode {
  word: string // カテゴリ名（例: 建設、水産など）
  children: StockItem[] // 各カテゴリに属する銘柄のリスト
}

export interface MarketDataNode {
  word: string // 日付（ISO 8601形式）
  children: CategoryNode[] // カテゴリごとのデータ
}
