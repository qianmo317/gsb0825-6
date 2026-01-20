export interface User {
  id: number
  username: string
  email: string
  role: 'admin' | 'teacher'
  avatar?: string
  createdAt: string
  updatedAt: string
}

export interface LoginParams {
  username: string
  password: string
}

export interface LoginResponse {
  user: User
  token: string
}
