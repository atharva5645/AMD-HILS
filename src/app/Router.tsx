import { Suspense, lazy } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import ProtectedRoute from '@/shared/components/ProtectedRoute'

const LandingPage = lazy(() => import('@/pages/LandingPage'))
const LoginPage = lazy(() => import('@/mcps/auth/components/LoginPage'))
const SignupPage = lazy(() => import('@/mcps/auth/components/SignupPage'))
const ForgotPasswordPage = lazy(() => import('@/mcps/auth/components/ForgotPasswordPage'))
const VerifyEmailPage = lazy(() => import('@/mcps/auth/components/VerifyEmailPage'))
const DashboardPage = lazy(() => import('@/pages/DashboardPage'))
const TopicPage = lazy(() => import('@/pages/TopicPage'))
const ProfilePage = lazy(() => import('@/pages/ProfilePage'))
const AcademicSetupWizard = lazy(() => import('@/mcps/academic-profile/components/AcademicSetupWizard'))
const MainLayout = lazy(() => import('./layouts/MainLayout'))

function RouteFallback() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-hils-bg">
            <Loader2 className="w-8 h-8 text-hils-accent animate-spin" />
        </div>
    )
}

export default function Router() {
    return (
        <HashRouter>
            <Suspense fallback={<RouteFallback />}>
                <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/signup" element={<SignupPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                    <Route path="/verify-email" element={<VerifyEmailPage />} />

                    {/* Academic Setup - auth required, no profile gate */}
                    <Route
                        path="/setup"
                        element={
                            <ProtectedRoute skipProfileCheck>
                                <AcademicSetupWizard />
                            </ProtectedRoute>
                        }
                    />

                    {/* Protected app routes */}
                    <Route
                        element={
                            <ProtectedRoute>
                                <MainLayout />
                            </ProtectedRoute>
                        }
                    >
                        <Route path="/dashboard" element={<DashboardPage />} />
                        <Route path="/university/:university" element={<DashboardPage />} />
                        <Route path="/semester/:semester" element={<DashboardPage />} />
                        <Route path="/subject/:subjectCode" element={<DashboardPage />} />
                        <Route path="/subject/:subjectCode/module/:moduleId" element={<DashboardPage />} />
                        <Route path="/topic/:topicId" element={<TopicPage />} />
                        <Route path="/profile" element={<ProfilePage />} />
                    </Route>

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Suspense>
        </HashRouter>
    )
}