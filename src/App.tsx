import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { EquipmentHealth } from './pages/EquipmentHealth'
import { WeeklyUpdates } from './pages/WeeklyUpdates'
import { EquipmentDetail } from './pages/EquipmentDetail'
import { Settings } from './pages/Settings'
import { Alarms } from './pages/Alarms'
import { PredictiveMaintenance } from './pages/PredictiveMaintenance'
import { Sustainability } from './pages/Sustainability'
import { Users } from './pages/Users'

function ProtectedRoute({
  allowedRoles,
  children,
}: {
  allowedRoles: Array<'admin' | 'manager' | 'viewer'>
  children: JSX.Element
}) {
  const { user } = useAuth()

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

function App() {
  const { isAuthenticated, user } = useAuth()

  if (!isAuthenticated) {
    return <Login />
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/equipment" element={<EquipmentHealth />} />
      <Route path="/equipment/:id" element={<EquipmentDetail />} />
      <Route path="/alarms" element={<Alarms />} />
      <Route path="/predictive" element={<PredictiveMaintenance />} />
      <Route path="/sustainability" element={<Sustainability />} />
      <Route
        path="/users"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Users />
          </ProtectedRoute>
        }
      />
      <Route path="/updates" element={<WeeklyUpdates />} />
      <Route
        path="/settings"
        element={
          <ProtectedRoute allowedRoles={['admin', 'manager', 'viewer']}>
            <Settings />
          </ProtectedRoute>
        }
      />
      <Route
        path="*"
        element={<Navigate to={user?.role === 'admin' ? '/dashboard' : '/dashboard'} replace />}
      />
    </Routes>
  )
}

export default App
