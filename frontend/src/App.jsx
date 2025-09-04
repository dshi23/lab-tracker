import { Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient } from 'react-query'
import { useAuth } from './hooks/useAuth'
import Layout from './components/layout/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Records from './pages/Records'
import AddRecord from './pages/AddRecord'
import EditRecord from './pages/EditRecord'
import RecordDetail from './pages/RecordDetail'
import Import from './pages/Import'
import Settings from './pages/Settings'
import Storage from './pages/Storage'
import AddStorage from './pages/AddStorage'
import EditStorage from './pages/EditStorage'
import StorageDetail from './pages/StorageDetail'
import StorageImport from './pages/StorageImport'
import UsageForm from './pages/UsageForm'
import UserManagement from './pages/UserManagement'
import ErrorBoundary from './components/ui/ErrorBoundary'

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth()
  
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">加载中...</div>
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  return children
}

function App() {
  return (
    <ErrorBoundary>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected Routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/storage" element={
          <ProtectedRoute>
            <Layout>
              <Storage />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/storage/add" element={
          <ProtectedRoute>
            <Layout>
              <AddStorage />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/storage/import" element={
          <ProtectedRoute>
            <Layout>
              <StorageImport />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/storage/:id" element={
          <ProtectedRoute>
            <Layout>
              <StorageDetail />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/storage/:id/edit" element={
          <ProtectedRoute>
            <Layout>
              <EditStorage />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/storage/:id/use" element={
          <ProtectedRoute>
            <Layout>
              <UsageForm />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/records" element={
          <ProtectedRoute>
            <Layout>
              <Records />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/add" element={
          <ProtectedRoute>
            <Layout>
              <AddRecord />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/records/:id" element={
          <ProtectedRoute>
            <Layout>
              <RecordDetail />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/records/:id/edit" element={
          <ProtectedRoute>
            <Layout>
              <EditRecord />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/import" element={
          <ProtectedRoute>
            <Layout>
              <Import />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute>
            <Layout>
              <Settings />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/users" element={
          <ProtectedRoute>
            <Layout>
              <UserManagement />
            </Layout>
          </ProtectedRoute>
        } />
      </Routes>
    </ErrorBoundary>
  )
}

export default App 