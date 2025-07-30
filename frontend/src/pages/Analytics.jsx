import { useQuery } from 'react-query'
import { analyticsAPI } from '../services/api'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import StatCard from '../components/ui/StatCard'

const Analytics = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600">Usage statistics and trends</p>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Analytics Dashboard</h2>
        <p className="text-gray-500">Analytics features coming soon...</p>
      </div>
    </div>
  )
}

export default Analytics 