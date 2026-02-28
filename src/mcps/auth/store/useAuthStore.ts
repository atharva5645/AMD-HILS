import { create } from 'zustand'
import type { AuthUser } from '../types/auth.types'
import { authService } from '../services/authService'
import type { User } from 'firebase/auth'

// ─── Helper: map Firebase User to AuthUser ───
function toAuthUser(firebaseUser: User): AuthUser {
    return {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        emailVerified: firebaseUser.emailVerified,
        provider: authService.getProvider(firebaseUser),
    }
}

interface AuthStore {
    user: AuthUser | null
    isLoading: boolean
    isAuthenticated: boolean
    error: string | null
    resetEmailSent: boolean
    login: (email: string, password: string) => Promise<void>
    signup: (email: string, password: string, displayName: string) => Promise<void>
    loginWithGoogle: () => Promise<void>
    logout: () => Promise<void>
    resetPassword: (email: string) => Promise<void>
    sendVerificationEmail: () => Promise<void>
    refreshVerificationStatus: () => Promise<void>
    clearError: () => void
    initAuthListener: () => () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    error: null,
    resetEmailSent: false,

    login: async (email, password) => {
        set({ isLoading: true, error: null })
        try {
            await authService.signIn(email, password)
            // Auth state will be updated by the onAuthStateChanged listener
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Login failed'
            set({ error: message, isLoading: false })
        }
    },

    signup: async (email, password, displayName) => {
        set({ isLoading: true, error: null })
        try {
            await authService.signUp(email, password, displayName)
            // Auth state will be updated by the onAuthStateChanged listener
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Signup failed'
            set({ error: message, isLoading: false })
        }
    },

    loginWithGoogle: async () => {
        set({ isLoading: true, error: null })
        try {
            await authService.signInWithGoogle()
            // Auth state will be updated by the onAuthStateChanged listener
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Google sign-in failed'
            set({ error: message, isLoading: false })
        }
    },

    logout: async () => {
        try {
            await authService.signOut()
            set({ user: null, isAuthenticated: false })
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Logout failed'
            set({ error: message })
        }
    },

    resetPassword: async (email) => {
        set({ isLoading: true, error: null, resetEmailSent: false })
        try {
            await authService.resetPassword(email)
            set({ isLoading: false, resetEmailSent: true })
        } catch {
            // Always show success to prevent email enumeration
            set({ isLoading: false, resetEmailSent: true })
        }
    },

    sendVerificationEmail: async () => {
        try {
            await authService.sendVerificationEmail()
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to send verification email'
            set({ error: message })
        }
    },

    refreshVerificationStatus: async () => {
        try {
            const refreshedUser = await authService.refreshUser()
            if (refreshedUser) {
                set({ user: toAuthUser(refreshedUser) })
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to refresh status'
            set({ error: message })
        }
    },

    clearError: () => set({ error: null, resetEmailSent: false }),

    initAuthListener: () => {
        try {
            const unsubscribe = authService.onAuthChange((firebaseUser) => {
                if (firebaseUser) {
                    set({
                        user: toAuthUser(firebaseUser),
                        isAuthenticated: true,
                        isLoading: false,
                    })
                } else {
                    set({ user: null, isAuthenticated: false, isLoading: false })
                }
            })
            return unsubscribe
        } catch (error) {
            console.error('Auth listener failed to initialize:', error)
            set({ user: null, isAuthenticated: false, isLoading: false })
            return () => { } // no-op unsubscribe
        }
    },
}))
