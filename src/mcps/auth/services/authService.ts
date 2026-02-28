import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    signOut,
    onAuthStateChanged,
    updateProfile,
    sendEmailVerification,
    sendPasswordResetEmail,
    reload,
    type User,
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '@/shared/config/firebase'
import type { AuthProvider } from '../types/auth.types'

const googleProvider = new GoogleAuthProvider()

// ─── Helper: detect auth provider ───
function getProvider(user: User): AuthProvider {
    const providers = user.providerData.map((p) => p.providerId)
    if (providers.includes('google.com')) return 'google'
    return 'email'
}

// ─── Helper: create Firestore user doc if not existing ───
async function ensureUserDocument(user: User) {
    const userRef = doc(db, 'users', user.uid)
    const snap = await getDoc(userRef)
    if (!snap.exists()) {
        await setDoc(userRef, {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            provider: getProvider(user),
            emailVerified: user.emailVerified,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        })
    }
}

export const authService = {
    async signIn(email: string, password: string) {
        const result = await signInWithEmailAndPassword(auth, email, password)
        return result.user
    },

    async signUp(email: string, password: string, displayName: string) {
        const result = await createUserWithEmailAndPassword(auth, email, password)
        await updateProfile(result.user, { displayName })
        // Auto-send verification email
        await sendEmailVerification(result.user)
        // Create Firestore doc
        await ensureUserDocument(result.user)
        return result.user
    },

    async signInWithGoogle() {
        const result = await signInWithPopup(auth, googleProvider)
        // Create Firestore doc on first Google sign-in
        await ensureUserDocument(result.user)
        return result.user
    },

    async signOut() {
        await signOut(auth)
    },

    async resetPassword(email: string) {
        await sendPasswordResetEmail(auth, email)
    },

    async sendVerificationEmail() {
        if (auth.currentUser) {
            await sendEmailVerification(auth.currentUser)
        }
    },

    async refreshUser(): Promise<User | null> {
        if (auth.currentUser) {
            await reload(auth.currentUser)
            return auth.currentUser
        }
        return null
    },

    getProvider(user: User): AuthProvider {
        return getProvider(user)
    },

    onAuthChange(callback: (user: User | null) => void) {
        if (!auth) {
            console.warn('Firebase Auth not initialized. Auth listener disabled.')
            callback(null)
            return () => { }
        }
        return onAuthStateChanged(auth, callback)
    },
}
