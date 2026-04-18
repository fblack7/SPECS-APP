import { BrowserRouter, Routes, Route, Navigate, useSearchParams } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import AuthPage from './components/Auth/AuthPage'
import Dashboard from './components/Dashboard/Dashboard'
import AdminPanel from './components/Admin/AdminPanel'
import Navbar from './components/Layout/Navbar'

function ProtectedRoute({ children }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" replace />
}

function AdminRoute({ children }) {
  const { user, isAdmin } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (!isAdmin) return <Navigate to="/" replace />
  return children
}

function RegisterWrapper() {
  const { user } = useAuth()
  const [params] = useSearchParams()
  const token = params.get('invite')
  if (user) return <Navigate to="/" replace />
  return <AuthPage mode="register" token={token} />
}

function AppInner() {
  const { user } = useAuth()
  return (
    <div className="app-shell">
      {user && <Navbar />}
      <main className={user ? 'with-nav' : ''}>
        <Routes>
          <Route path="/login"    element={user ? <Navigate to="/" /> : <AuthPage mode="login" />} />
          <Route path="/register" element={<RegisterWrapper />} />
          <Route path="/"         element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/admin"    element={<AdminRoute><AdminPanel /></AdminRoute>} />
          <Route path="*"         element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppInner />
      </AuthProvider>
    </BrowserRouter>
  )
}
