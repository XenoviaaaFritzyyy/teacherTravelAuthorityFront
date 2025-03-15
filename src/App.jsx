import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { UserProvider } from "./context/UserContext"
import LandingPage from "./components/LandingPage"
import SignUpPage from "./components/SignUpPage"
import LoginPage from "./components/LoginPage"
import DashboardPage from "./components/DashboardPage"
import ProfilePage from "./components/ProfilePage"
import NotificationsPage from "./components/NotificationsPage"
import ProtectedRoute from "./components/ProtectedRoute"
import "./App.css"

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
        </Routes>
      </Router>
    </UserProvider>
  )
}

export default App

