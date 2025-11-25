import { type UserProfile } from '@/types/user'

export type AuthResponse = {
  accessToken: string
  user: UserProfile
}

export type LoginRequest = {
  email: string
  password: string
}

export type RegisterRequest = {
  fullName: string
  email: string
  password: string
}

export type GoogleLoginRequest = {
  credential: string
}

