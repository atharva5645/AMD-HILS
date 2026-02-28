import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import LandingPage from '@/pages/LandingPage'
import LoginPage from '@/mcps/auth/components/LoginPage'
import SignupPage from '@/mcps/auth/components/SignupPage'
import ForgotPasswordPage from '@/mcps/auth/components/ForgotPasswordPage'
import VerifyEmailPage from '@/mcps/auth/components/VerifyEmailPage'
import DashboardPage from '@/pages/DashboardPage'
import TopicPage from '@/pages/TopicPage'
import ProfilePage from '@/pages/ProfilePage'
import AcademicSetupWizard from '@/mcps/academic-profile/components/AcademicSetupWizard'
import MainLayout from './layouts/MainLayout'
import ProtectedRoute from '@/shared/components/ProtectedRoute'

export default function Router() {
    return (
        <HashRouter>
            <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/verify-email" element={<VerifyEmailPage />} />

                {/* Academic Setup – auth required, no profile gate */}
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
        </HashRouter>
    )
}
