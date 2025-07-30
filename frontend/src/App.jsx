import { Routes, Route } from 'react-router-dom'
import { QueryClient } from 'react-query'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import Records from './pages/Records'
import AddRecord from './pages/AddRecord'
import EditRecord from './pages/EditRecord'
import RecordDetail from './pages/RecordDetail'
import Analytics from './pages/Analytics'
import Import from './pages/Import'
import Settings from './pages/Settings'
import Storage from './pages/Storage'
import AddStorage from './pages/AddStorage'
import EditStorage from './pages/EditStorage'
import StorageDetail from './pages/StorageDetail'
import StorageImport from './pages/StorageImport'
import UsageForm from './pages/UsageForm'
import ErrorBoundary from './components/ui/ErrorBoundary'

function App() {
  return (
    <ErrorBoundary>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/storage" element={<Storage />} />
          <Route path="/storage/add" element={<AddStorage />} />
          <Route path="/storage/import" element={<StorageImport />} />
          <Route path="/storage/:id" element={<StorageDetail />} />
          <Route path="/storage/:id/edit" element={<EditStorage />} />
          <Route path="/storage/:id/use" element={<UsageForm />} />
          <Route path="/records" element={<Records />} />
          <Route path="/add" element={<AddRecord />} />
          <Route path="/records/:id" element={<RecordDetail />} />
          <Route path="/records/:id/edit" element={<EditRecord />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/import" element={<Import />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </ErrorBoundary>
  )
}

export default App 