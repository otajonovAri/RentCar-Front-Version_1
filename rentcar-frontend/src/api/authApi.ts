import api from './axiosInstance'
import type {
  AuthResponseDto,
  UserDto,
  LoginDto,
  RegisterDto,
  ConfirmEmailDto,
  ResendConfirmationDto,
  RefreshTokenDto,
  RegisterPendingDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from '@/types/auth'

export const authApi = {
  register: (data: RegisterDto) =>
    api.post<RegisterPendingDto>('/api/auth/register', data),

  verifyEmail: (data: ConfirmEmailDto) =>
    api.post<AuthResponseDto>('/api/auth/confirm-email', data),

  resendOtp: (data: ResendConfirmationDto) =>
    api.post<void>('/api/auth/resend-confirmation', data),

  confirmEmail: (data: ConfirmEmailDto) =>
    api.post<AuthResponseDto>('/api/auth/confirm-email', data),

  resendConfirmation: (data: ResendConfirmationDto) =>
    api.post<void>('/api/auth/resend-confirmation', data),

  login: (data: LoginDto) =>
    api.post<AuthResponseDto>('/api/auth/login', data),

  /**
   * Google Sign-In — useGoogleLogin() dan kelgan access_token backend ga yuboriladi.
   * Backend uni Google UserInfo endpoint ga yuborib, foydalanuvchi ma'lumotlarini oladi.
   */
  googleLogin: (accessToken: string) =>
    api.post<AuthResponseDto>('/api/auth/google', { accessToken }),

  refreshToken: (data: RefreshTokenDto) =>
    api.post<AuthResponseDto>('/api/auth/refresh-token', data),

  me: () =>
    api.get<UserDto>('/api/auth/me'),

  /** Foydalanuvchini tizimdan chiqarish — refresh tokenni bekor qiladi */
  logout: () =>
    api.post<void>('/api/auth/logout'),

  forgotPassword: (data: ForgotPasswordDto) =>
    api.post<{ message: string }>('/api/auth/forgot-password', data),

  resetPassword: (data: ResetPasswordDto) =>
    api.post<{ message: string }>('/api/auth/reset-password', data),
}
