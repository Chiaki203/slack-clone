
export type User = {
  id: string
  username: string
  status: 'ONLINE' | 'OFFLINE'
}

export type UserRole = {
  id: number
  user_id: string
  role: 'admin' | 'moderator'
}

export type Channel = {
  id: number
  slug: string
  created_by: string
  inserted_at: string
}

export type Message = {
  id: number
  message: string
  channel_id: number
  inserted_at: string
  user_id: string
  author: {
    id: string
    username: string
    status: 'ONLINE' | 'OFFLINE'
  }
}