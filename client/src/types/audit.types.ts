export interface AuditLog {
  _id: string
  action: string
  module: string
  description: string
  details: any
  user_id?: string
  user_name?: string
  created_at: string
  updated_at?: string
}
