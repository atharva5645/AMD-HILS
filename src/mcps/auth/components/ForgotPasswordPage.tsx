import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, ArrowLeft, Sparkles, Send, CheckCircle2 } from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('')
    const [cooldown, setCooldown] = useState(0)
    const { resetPassword, isLoading, error, resetEmailSent, clearError } = useAuthStore()

    // Cooldown timer
    useEffect(() => {
        if (cooldown <= 0) return
        const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
        return () => clearTimeout(t)
    }, [cooldown])

    // Clear state on unmount
    useEffect(() => {
        return () => clearError()
    }, [clearError])

    const requestResetLink = async () => {
        if (cooldown > 0) return
        clearError()
        await resetPassword(email)
        setCooldown(30)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        await requestResetLink()
    }

    return (
        <div className="min-h-screen flex bg-black relative overflow-hidden">
            {/* Left — decorative area (desktop only) */}
            <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center">
                {/* Subtle radial glow */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-[500px] h-[500px] bg-white/[0.03] rounded-full blur-[120px]" />
                </div>

                {/* HILS branding */}
                <Link
                    to="/"
                    className="absolute top-6 left-6 flex items-center gap-2 group z-10"
                >
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center group-hover:shadow-lg group-hover:shadow-white/10 transition-all">
                        <Sparkles className="w-4 h-4 text-black" />
                    </div>
                    <span className="text-base font-bold tracking-tight text-white">
                        HILS
                    </span>
                </Link>

                {/* Illustration */}
                <div className="relative flex flex-col items-center text-center px-12">
                    <div className="w-24 h-24 bg-white/[0.06] rounded-3xl flex items-center justify-center mb-8">
                        <Mail className="w-12 h-12 text-[#CFCFCF]" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-3">Reset Your Password</h2>
                    <p className="text-hils-text-muted max-w-sm">
                        Enter the email address associated with your account and we'll send you a link to reset your password.
                    </p>
                </div>
            </div>

            {/* Right — form panel */}
            <div className="w-full lg:w-1/2 flex flex-col bg-hils-surface min-h-screen">
                {/* Back to login */}
                <div className="p-6">
                    <Link
                        to="/login"
                        className="inline-flex items-center gap-1.5 text-sm text-hils-text-dim hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Login
                    </Link>
                </div>

                {/* Centered form */}
                <div className="flex-1 flex items-center justify-center px-6 pb-12">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        className="w-full max-w-sm"
                    >
                        {/* Mobile branding */}
                        <div className="lg:hidden flex items-center gap-2 mb-6">
                            <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center">
                                <Sparkles className="w-4 h-4 text-black" />
                            </div>
                            <span className="text-lg font-bold tracking-tight text-white">HILS</span>
                        </div>

                        {/* Heading */}
                        <div className="mb-8">
                            <h1 className="text-2xl font-bold text-white mb-1.5">
                                Forgot password?
                            </h1>
                            <p className="text-sm text-hils-text-muted">
                                No worries, we'll send you a reset link.
                            </p>
                        </div>

                        {/* Success state */}
                        {resetEmailSent ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="space-y-6"
                            >
                                <div className="p-5 rounded-xl bg-hils-success/10 border border-hils-success/20 text-center">
                                    <CheckCircle2 className="w-10 h-10 text-hils-success mx-auto mb-3" />
                                    <p className="text-sm text-hils-text font-medium mb-1">
                                        Check your email
                                    </p>
                                    <p className="text-xs text-hils-text-muted">
                                        If an account exists for <span className="font-medium text-hils-text">{email}</span>, we've sent a password reset link. Don't forget to check your spam folder.
                                    </p>
                                </div>

                                {/* Resend */}
                                <button
                                    onClick={requestResetLink}
                                    disabled={cooldown > 0 || isLoading}
                                    className="w-full text-sm text-hils-text-muted hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {cooldown > 0
                                        ? `Resend available in ${cooldown}s`
                                        : 'Didn\'t receive it? Resend'}
                                </button>

                                <Link
                                    to="/login"
                                    className="block text-center w-full px-6 py-3 bg-white text-black font-semibold rounded-lg transition-all duration-200 hover:bg-gray-200 active:scale-[0.98]"
                                >
                                    Back to Login
                                </Link>
                            </motion.div>
                        ) : (
                            /* Form state */
                            <>
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="mb-4 p-3 rounded-lg bg-hils-danger/10 border border-hils-danger/20 text-hils-danger text-sm"
                                    >
                                        {error}
                                    </motion.div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-5">
                                    {/* Email field */}
                                    <div>
                                        <label className="block text-sm font-medium text-hils-text-muted mb-1.5">
                                            Email
                                        </label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-hils-text-dim" />
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="input-field pl-10"
                                                placeholder="you@university.edu"
                                                required
                                                autoFocus
                                            />
                                        </div>
                                    </div>

                                    {/* Submit button */}
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white text-black font-semibold rounded-lg transition-all duration-200 hover:bg-gray-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isLoading ? (
                                            <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                <Send className="w-4 h-4" />
                                                Send Reset Link
                                            </>
                                        )}
                                    </button>
                                </form>
                            </>
                        )}

                        {/* Back to login */}
                        {!resetEmailSent && (
                            <div className="mt-6 text-center">
                                <span className="text-hils-text-dim text-sm">Remember your password? </span>
                                <Link
                                    to="/login"
                                    className="text-white text-sm font-semibold hover:underline"
                                >
                                    Log In
                                </Link>
                            </div>
                        )}
                    </motion.div>
                </div>
            </div>
        </div>
    )
}
