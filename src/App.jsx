/**
 * 학생성공지수 관리 시스템
 * @version 3.4.1
 * @date 2026-02-12
 * @changelog 캐시 무효화 및 강제 재배포, 버전 일관성 유지
 */
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useAppContext } from './context/AppContext';
import { useModalStore } from './hooks/useModal';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import AdminPage from './pages/AdminPage';
import StudentPage from './pages/StudentPage';
import CoreCoursesSettingPage from './pages/admin/CoreCoursesSettingPage';
import CoreCoursesReviewPage from './pages/admin/CoreCoursesReviewPage';
import CoreCoursesCheckPage from './pages/student/CoreCoursesCheckPage';
import MasterApprovalPage from './pages/MasterApprovalPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import ConfirmModal from './components/modals/ConfirmModal';
import AlertModal from './components/modals/AlertModal';

console.log('🎯 App.jsx v3.4.1 로드됨');

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
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
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
          <Route
            path="/master/approval"
            element={
              <PrivateRoute allowedRoles={['master']}>
                <MasterApprovalPage />
              </PrivateRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        <GlobalModals />
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;