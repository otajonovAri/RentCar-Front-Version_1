import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserRole } from '@/types/auth'

interface AuthState {
  accessToken:  string | null
  refreshToken: string | null
  userId:       number | null
  fullName:     string | null
  email:        string | null
  role:         UserRole | null
  isAuthenticated: boolean

  setAuth: (payload: {
    accessToken:  string
    refreshToken: string
    userId:       number
    fullName:     string
    email:        string
    role:         UserRole
  }) => void

  /** Only update tokens (used by silent refresh in axiosInstance) */
  updateTokens: (accessToken: string, refreshToken: string) => void

  logout: () => void
  hasRole: (roles: UserRole[]) => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken:     null,
      refreshToken:    null,
      userId:          null,
      fullName:        null,
      email:           null,
      role:            null,
      isAuthenticated: false,

      setAuth: (payload) => {
        localStorage.setItem('accessToken',  payload.accessToken)
        localStorage.setItem('refreshToken', payload.refreshToken)
        set({ ...payload, isAuthenticated: true })
      },

      updateTokens: (accessToken, refreshToken) => {
        localStorage.setItem('accessToken',  accessToken)
        localStorage.setItem('refreshToken', refreshToken)
        set({ accessToken, refreshToken })
      },

      logout: () => {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')

        // Clear axios default Authorization header
        try {
          // Import lazily to avoid circular dep at module init time
          import('@/api/axiosInstance').then(({ default: api }) => {
            delete api.defaults.headers.common['Authorization']
          }).catch(() => {/* non-critical */})
        } catch {/* non-critical */}

        set({
          accessToken:     null,
          refreshToken:    null,
          userId:          null,
          fullName:        null,
          email:           null,
          role:            null,
          isAuthenticated: false,
        })
      },

      hasRole: (roles) => {
        const role = get().role
        return role !== null && roles.includes(role)
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        accessToken:     state.accessToken,
        refreshToken:    state.refreshToken,
        userId:          state.userId,
        fullName:        state.fullName,
        email:           state.email,
        role:            state.role,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
)
