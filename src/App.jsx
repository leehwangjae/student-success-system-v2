import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useAppContext } from './context/AppContext';
import { useModalStore } from './hooks/useModal';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import AdminPage from './pages/AdminPage';
import StudentPage from './pages/StudentPage';
import ConfirmModal from './components/modals/ConfirmModal';
import AlertModal from './components/modals/AlertModal';

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

  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
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
          <Route
            path="/admin"
            element={
              <PrivateRoute allowedRoles={['admin', 'master']}>
                <AdminPage />
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
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        <GlobalModals />
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;