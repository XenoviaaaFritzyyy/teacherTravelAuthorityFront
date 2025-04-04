import { Route, BrowserRouter as Router, Routes } from "react-router-dom"
import "./App.css"
import AdminDashboard from "./components/AOadminDashboard"
import DashboardPage from "./components/DashboardPage"
import LandingPage from "./components/LandingPage"
import LoginPage from "./components/LoginPage"
import NotificationsPage from "./components/NotificationsPage"
import ProfilePage from "./components/ProfilePage"
import ProtectedRoute from "./components/ProtectedRoute"
import SignUpPage from "./components/SignUpPage"
import SuperAdminDashboard from "./components/SuperAdminDashboard"
import { UserProvider } from "./context/UserContext"

function App() {
  return (
    <UserProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <NotificationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="AO Admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/superadmin"
            element={
              <ProtectedRoute requiredRole="Admin">
                <SuperAdminDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </UserProvider>
  )
}

export default App

