export interface AuditLog {
  _id: string
  action: string
  module: string
  description: string
  details: any
  accountId?: string
  accountName?: string
  created_at: string
  updated_at?: string
}
