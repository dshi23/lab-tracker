import { useQuery } from 'react-query'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { useAnalyticsApi } from '../hooks/useAnalyticsApi'
import { useRecordsApi } from '../hooks/useRecordsApi'
import { useStorageApi } from '../hooks/useStorageApi'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import StatCard from '../components/ui/StatCard'
import RecordCard from '../components/lists/RecordCard'
import StorageCard from '../components/storage/StorageCard'

const Dashboard = () => {
  const { getStorageItems, getUsageRecords } = useStorageApi()
  const { getDashboardStats } = useAnalyticsApi()

  // Fetch dashboard data
  const { data: dashboardData, isLoading: dashboardLoading, error: dashboardError } = useQuery(
    ['dashboard', 30],
    () => getDashboardStats(30),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  )

  const { getRecentRecords } = useRecordsApi()

  // Fetch recent records
  const { data: recentData, isLoading: recentLoading, error: recentError } = useQuery(
    ['recent-records', 5],
    () => getRecentRecords(5),
    {
      staleTime: 2 * 60 * 1000, // 2 minutes
    }
  )

  // Fetch storage overview
  const { data: storageData, isLoading: storageLoading, error: storageError } = useQuery(
    ['storage-dashboard'],
    () => getStorageItems({ per_page: 100 }),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  )

  // Fetch recent usage records (storage-linked)
  const { data: recentUsageData, isLoading: usageLoading } = useQuery(
    ['recent-usage-records', 5],
    () => getUsageRecords({ per_page: 5 }),
    {
      staleTime: 2 * 60 * 1000, // 2 minutes
    }
  )

  if (dashboardLoading || recentLoading || storageLoading || usageLoading) {
    return <LoadingSpinner />
  }

  if (dashboardError || recentError || storageError) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Error loading dashboard data</p>
      </div>
    )
  }

  // Calculate storage statistics
  const storageItems = storageData?.items || []
  const totalStorageItems = storageItems.length
  const lowStockItems = storageItems.filter(item => {
    // Consider items with less than 10% of original quantity as low stock
    const originalMatch = item['数量及数量单位'].match(/([0-9.]+)/)
    if (!originalMatch) return false
    const originalQuantity = parseFloat(originalMatch[1])
    return originalQuantity > 0 && (item['当前库存量'] / originalQuantity) < 0.1
  })
  const outOfStockItems = storageItems.filter(item => item['当前库存量'] <= 0)
  const storageCategories = [...new Set(storageItems.map(item => item['类型']))].length

  const stats = [
    {
      title: 'Total Records',
      value: dashboardData?.total_records || 0,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      color: 'blue'
    },
    {
      title: 'Storage Items',
      value: totalStorageItems,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      color: 'green'
    },
    {
      title: 'Low Stock Alert',
      value: lowStockItems.length,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      ),
      color: lowStockItems.length > 0 ? 'red' : 'gray'
    },
    {
      title: 'Active Personnel',
      value: dashboardData?.unique_personnel || 0,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      ),
      color: 'purple'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Laboratory Dashboard</h1>
          <p className="text-gray-600">Comprehensive lab management overview</p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <Link to="/add" className="btn-primary">
            Add Record
          </Link>
          <Link to="/storage/add" className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
            Add Storage
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Alerts Section */}
      {(lowStockItems.length > 0 || outOfStockItems.length > 0) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h3 className="font-semibold text-red-900">Inventory Alerts</h3>
          </div>
          <div className="space-y-2 text-sm">
            {outOfStockItems.length > 0 && (
              <p className="text-red-700">
                <strong>{outOfStockItems.length}</strong> items are out of stock
              </p>
            )}
            {lowStockItems.length > 0 && (
              <p className="text-red-700">
                <strong>{lowStockItems.length}</strong> items have low stock levels (&lt; 10%)
              </p>
            )}
            <Link to="/storage" className="text-red-800 hover:text-red-900 font-medium inline-block mt-2">
              View Storage Management →
            </Link>
          </div>
        </div>
      )}

      {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"> */}
        {/* Recent Records */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Usage Records</h2>
            <Link 
              to="/records" 
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              View All
            </Link>
          </div>
          
          {recentData?.records?.length > 0 ? (
            <div className="space-y-3">
              {recentData.records.slice(0, 3).map((record) => (
                <RecordCard key={record.id} record={record} compact />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No recent records found</p>
              <Link to="/add" className="text-primary-600 hover:text-primary-700 mt-2 inline-block">
                Add your first record
              </Link>
            </div>
          )}
        </div>

        {/* Recent Storage Usage
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Storage Usage</h2>
            <Link 
              to="/storage" 
              className="text-green-600 hover:text-green-700 font-medium"
            >
              View Storage
            </Link>
          </div>
          
          {recentUsageData?.usage_records?.length > 0 ? (
            <div className="space-y-3">
              {recentUsageData.usage_records.slice(0, 3).map((record) => (
                <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 break-words">{record['产品名']}</h4>
                    <p className="text-sm text-gray-600">
                      Used by {record['使用人']} • {record['使用量_g'].toFixed(3)}g
                    </p>
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(record['使用日期']).toLocaleDateString('zh-CN')}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No storage usage found</p>
              <Link to="/storage" className="text-green-600 hover:text-green-700 mt-2 inline-block">
                Start using storage
              </Link>
            </div>
          )}
        </div> */}
      {/* </div> */}

      {/* Low Stock Items */}
      {lowStockItems.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Low Stock Items ({lowStockItems.length})
            </h2>
            <Link 
              to="/storage" 
              className="text-red-600 hover:text-red-700 font-medium"
            >
              Manage All
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lowStockItems.slice(0, 6).map((item) => (
              <div key={item.id} className="border border-red-200 rounded-lg p-3 bg-red-50">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0 pr-2">
                    <h4 className="font-medium text-red-900 break-words text-sm">{item['产品名']}</h4>
                    <p className="text-xs text-red-700">{item['类型']}</p>
                  </div>
                  <span className="bg-red-200 text-red-800 text-xs px-2 py-1 rounded flex-shrink-0">
                    {item['当前库存量'].toFixed(1)}{item['单位'] || ''}
                  </span>
                </div>
                <div className="text-xs text-red-600">
                  📍 {item['存放地']}
                </div>
                <div className="mt-2 flex space-x-2">
                  <Link
                    to={`/storage/${item.id}`}
                    className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
                  >
                    View
                  </Link>
                  <Link
                    to={`/storage/${item.id}/use`}
                    className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                  >
                    Record Use
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link 
          to="/records" 
          className="card hover:shadow-md transition-shadow"
        >
          <div className="flex items-center">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Usage Records</h3>
              <p className="text-sm text-gray-500">Browse all usage records</p>
            </div>
          </div>
        </Link>

        <Link 
          to="/storage" 
          className="card hover:shadow-md transition-shadow"
        >
          <div className="flex items-center">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Storage Management</h3>
              <p className="text-sm text-gray-500">Manage inventory</p>
            </div>
          </div>
        </Link>

        <Link 
          to="/analytics" 
          className="card hover:shadow-md transition-shadow"
        >
          <div className="flex items-center">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Analytics</h3>
              <p className="text-sm text-gray-500">View statistics</p>
            </div>
          </div>
        </Link>

        <Link 
          to="/storage/import" 
          className="card hover:shadow-md transition-shadow"
        >
          <div className="flex items-center">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Import Storage</h3>
              <p className="text-sm text-gray-500">Bulk import items</p>
            </div>
          </div>
        </Link>
      </div>

      {/* System Overview */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">System Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">{totalStorageItems}</div>
            <div className="text-sm text-gray-600">Total Storage Items</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">{storageCategories}</div>
            <div className="text-sm text-gray-600">Categories</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">{dashboardData?.total_records || 0}</div>
            <div className="text-sm text-gray-600">Usage Records</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-orange-600">{dashboardData?.unique_personnel || 0}</div>
            <div className="text-sm text-gray-600">Active Users</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard 