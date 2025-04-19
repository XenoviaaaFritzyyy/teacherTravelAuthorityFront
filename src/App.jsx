import { Route, BrowserRouter as Router, Routes } from "react-router-dom"
import "./App.css"
import AdminDashboard from "./components/AOadminDashboard"
import AOadminOfficerDashboard from "./components/AOadminOfficerDashboard"
import Asds from "./components/ASDS"
import DashboardPage from "./components/DashboardPage"
import LandingPage from "./components/LandingPage"
import LoginPage from "./components/LoginPage"
import NotificationsPage from "./components/NotificationsPage"
import Principal from "./components/Principal"
import ProfilePage from "./components/ProfilePage"
import ProtectedRoute from "./components/ProtectedRoute"
import Psds from "./components/PSDS"
import Sds from "./components/Sds"
import SignUpPage from "./components/SignUpPage"
import SuperAdminDashboard from "./components/SuperAdminDashboard"
import { UserProvider } from "./context/UserContext"
import { SnackbarProvider } from "./components/SnackbarProvider"

function App() {
  return (
    <UserProvider>
      <SnackbarProvider>
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
            path="/departmentofficer"
            element={
              <ProtectedRoute requiredRole="AO Admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/administrativeofficer"
            element={
              <ProtectedRoute requiredRole="AO Admin Officer">
                <AOadminOfficerDashboard />
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
           <Route
            path="/principal"
            element={
              <ProtectedRoute requiredRole="Principal">
                <Principal />
              </ProtectedRoute>
            }
          />
           <Route
            path="/psds"
            element={
              <ProtectedRoute requiredRole="PSDS">
                <Psds />
              </ProtectedRoute>
            }
          />
             <Route
            path="/asds"
            element={
              <ProtectedRoute requiredRole="ASDS">
                <Asds />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sds"
            element={
              <ProtectedRoute requiredRole="SDS">
                <Sds />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
      </SnackbarProvider>
    </UserProvider>
  )
}

export default App
