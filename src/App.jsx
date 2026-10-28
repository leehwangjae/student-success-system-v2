/**
 * 학생성공지수 관리 시스템
 * @version 3.5.0
 * @date 2026-10-28
 * @changelog 실험실습재료 구매지원 시스템 추가, 서비스 선택 화면 도입
 */
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useAppContext } from './context/AppContext';
import { PurchaseProvider } from './context/PurchaseContext';
import { useModalStore } from './hooks/useModal';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ServicesPage from './pages/ServicesPage';
import AdminPage from './pages/AdminPage';
import StudentPage from './pages/StudentPage';
import CoreCoursesSettingPage from './pages/admin/CoreCoursesSettingPage';
import CoreCoursesReviewPage from './pages/admin/CoreCoursesReviewPage';
import CoreCoursesCheckPage from './pages/student/CoreCoursesCheckPage';
import ApplicationPeriodSettingPage from './pages/admin/ApplicationPeriodSettingPage';
import MasterApprovalPage from './pages/MasterApprovalPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import ConfirmModal from './components/modals/ConfirmModal';
import AlertModal from './components/modals/AlertModal';
// 구매지원 페이지
import PurchaseMainPage from './pages/purchase/PurchaseMainPage';
import PurchaseNewRequestPage from './pages/purchase/PurchaseNewRequestPage';
import PurchaseDetailPage from './pages/purchase/PurchaseDetailPage';
import PurchaseAdminPage from './pages/admin/PurchaseAdminPage';
import PurchaseBudgetPage from './pages/admin/PurchaseBudgetPage';
import PurchaseSettingsPage from './pages/admin/PurchaseSettingsPage';

console.log('🎯 App.jsx v3.5.0 로드됨');

// 🔥 GlobalModals 수정!
function GlobalModals() {
  return (
    <>
      <AlertModal />
      <ConfirmModal />
    </>
  );
}

function PrivateRoute({ children, allowedRoles }) {
  const { currentUser } = useAppContext();

  if (!currentUser) {
    return <Navigate to="/" />;
  }

  if (allowedRoles && !allowedRoles.includes(currentUser.role) && !allowedRoles.includes(currentUser.accountType)) {
    return <Navigate to="/" />;
  }

  return children;
}

function App() {
  return (
    <AppProvider>
      <PurchaseProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />

            {/* 서비스 선택 */}
            <Route
              path="/services"
              element={
                <PrivateRoute allowedRoles={['student', 'admin', 'master', 'professor']}>
                  <ServicesPage />
                </PrivateRoute>
              }
            />

            {/* SSI 관리자 */}
            <Route
              path="/admin"
              element={
                <PrivateRoute allowedRoles={['admin', 'master']}>
                  <AdminPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/core-courses/setting"
              element={
                <PrivateRoute allowedRoles={['admin', 'master']}>
                  <CoreCoursesSettingPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/core-courses/review"
              element={
                <PrivateRoute allowedRoles={['admin', 'master']}>
                  <CoreCoursesReviewPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/application-period"
              element={
                <PrivateRoute allowedRoles={['admin', 'master']}>
                  <ApplicationPeriodSettingPage />
                </PrivateRoute>
              }
            />

            {/* SSI 학생 */}
            <Route
              path="/student"
              element={
                <PrivateRoute allowedRoles={['student']}>
                  <StudentPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/student/core-courses"
              element={
                <PrivateRoute allowedRoles={['student']}>
                  <CoreCoursesCheckPage />
                </PrivateRoute>
              }
            />

            {/* 마스터 */}
            <Route
              path="/master/approval"
              element={
                <PrivateRoute allowedRoles={['master']}>
                  <MasterApprovalPage />
                </PrivateRoute>
              }
            />

            {/* 구매지원 - 신청자 (학생/교수) */}
            <Route
              path="/purchase"
              element={
                <PrivateRoute allowedRoles={['student', 'professor', 'admin', 'master']}>
                  <PurchaseMainPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/purchase/new"
              element={
                <PrivateRoute allowedRoles={['student', 'professor', 'admin', 'master']}>
                  <PurchaseNewRequestPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/purchase/edit/:requestId"
              element={
                <PrivateRoute allowedRoles={['student', 'professor', 'admin', 'master']}>
                  <PurchaseNewRequestPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/purchase/:id"
              element={
                <PrivateRoute allowedRoles={['student', 'professor', 'admin', 'master']}>
                  <PurchaseDetailPage />
                </PrivateRoute>
              }
            />

            {/* 구매지원 - 관리자 */}
            <Route
              path="/purchase/admin"
              element={
                <PrivateRoute allowedRoles={['admin', 'master']}>
                  <PurchaseAdminPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/purchase/admin/budget"
              element={
                <PrivateRoute allowedRoles={['admin', 'master']}>
                  <PurchaseBudgetPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/purchase/admin/settings"
              element={
                <PrivateRoute allowedRoles={['admin', 'master']}>
                  <PurchaseSettingsPage />
                </PrivateRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
          <GlobalModals />
        </BrowserRouter>
      </PurchaseProvider>
    </AppProvider>
  );
}

export default App;