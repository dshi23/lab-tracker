import { useQuery } from 'react-query'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import React, { useState, useEffect } from 'react'
import { useAnalyticsApi } from '../hooks/useAnalyticsApi'
import { useRecordsApi } from '../hooks/useRecordsApi'
import { useStorageApi } from '../hooks/useStorageApi'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import StatCard from '../components/ui/StatCard'
import RecordCard from '../components/lists/RecordCard'
import StorageCard from '../components/storage/StorageCard'

const Dashboard = () => {
  const [isVisible, setIsVisible] = useState(false)
  const { getStorageItems } = useStorageApi()
  const { getDashboardStats } = useAnalyticsApi()
  const { getRecentRecords } = useRecordsApi()
  
  useEffect(() => {
    setIsVisible(true)
  }, [])

  // Fetch dashboard data
  const { data: dashboardData, isLoading: dashboardLoading, error: dashboardError } = useQuery(
    ['dashboard', 30],
    () => getDashboardStats(30),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    }
  )

  // Fetch recent records
  const { data: recentData, isLoading: recentLoading, error: recentError } = useQuery(
    ['recent-records', 5],
    () => getRecentRecords(5),
    {
      staleTime: 2 * 60 * 1000, // 2 minutes
      refetchOnWindowFocus: false,
    }
  )

  // Fetch storage overview
  const { data: storageData, isLoading: storageLoading, error: storageError } = useQuery(
    ['storage-dashboard'],
    () => getStorageItems({ per_page: 100 }),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    }
  )


  const isLoading = dashboardLoading || recentLoading || storageLoading
  const hasError = dashboardError || recentError || storageError

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading dashboard..." />
      </div>
    )
  }

  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 text-red-500">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to load dashboard</h2>
          <p className="text-gray-600 mb-4">Please check your connection and try again</p>
          <button 
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  // Calculate storage statistics
  const storageItems = storageData?.items || []
  const totalStorageItems = storageData?.total || storageItems.length
  const lowStockItems = storageItems.filter(item => {
    // Consider items with less than 10% of original quantity as low stock
    const quantityStr = item['数量及数量单位']
    if (!quantityStr || typeof quantityStr !== 'string') return false
    const originalMatch = quantityStr.match(/([0-9.]+)/)
    if (!originalMatch) return false
    const originalQuantity = parseFloat(originalMatch[1])
    const currentStock = item['当前库存量']
    return originalQuantity > 0 && currentStock != null && (currentStock / originalQuantity) < 0.1
  })
  const outOfStockItems = storageItems.filter(item => {
    const currentStock = item['当前库存量']
    return currentStock != null && currentStock <= 0
  })
  const storageCategories = [...new Set(storageItems.map(item => item['类型'] || 'Unknown').filter(Boolean))].length

  const stats = [
    {
      title: 'Usage Records',
      subtitle: 'Total recorded',
      value: dashboardData?.total_records || 0,
      change: '+12%',
      trend: 'up',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      color: 'blue',
      route: '/records'
    },
    {
      title: 'Storage Items',
      subtitle: 'In inventory',
      value: totalStorageItems,
      change: '+3%',
      trend: 'up',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      color: 'green',
      route: '/storage'
    },
    {
      title: 'Stock Alerts',
      subtitle: 'Needs attention',
      value: lowStockItems.length,
      change: lowStockItems.length > 0 ? `${lowStockItems.length} items` : 'All good',
      trend: lowStockItems.length > 0 ? 'down' : 'stable',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      ),
      color: lowStockItems.length > 0 ? 'red' : 'gray',
      route: '/storage'
    },
    {
      title: 'Active Users',
      subtitle: 'This month',
      value: dashboardData?.unique_personnel || 0,
      change: 'Active',
      trend: 'stable',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      color: 'purple',
      route: '/records'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                仪表板 <span className="text-lg font-normal text-gray-600">Dashboard</span>
              </h1>
              <p className="text-gray-600">
                实验室库存与使用记录概览
              </p>
            </div>
            <div className="flex space-x-3 mt-4 sm:mt-0">
              <Link to="/storage/add" className="btn-primary">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Storage
              </Link>
              <Link to="/add" className="btn-secondary">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Add Record
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          {stats.map((stat, index) => (
            <Link key={index} to={stat.route} className="block">
              <StatCard {...stat} />
            </Link>
          ))}
        </div>

        {/* Enhanced Alerts Section */}
        {(lowStockItems.length > 0 || outOfStockItems.length > 0) && (
          <section className="mb-8 sm:mb-12" aria-labelledby="alerts-heading">
            <div className="relative overflow-hidden bg-gradient-to-r from-red-50 via-red-50/80 to-orange-50 border border-red-200/60 rounded-2xl p-6 shadow-lg">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-red-100/30 rounded-full blur-xl"></div>
              <div className="relative">
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div>
                    <h3 id="alerts-heading" className="text-lg font-bold text-red-900">库存警报 / Inventory Alerts</h3>
                    <p className="text-red-700 text-sm">需要立即关注的项目 / Items requiring immediate attention</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  {outOfStockItems.length > 0 && (
                    <div className="bg-red-100/50 rounded-lg p-4 border border-red-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span className="font-semibold text-red-900">Out of Stock</span>
                      </div>
                      <p className="text-red-700 text-sm">
                        <span className="font-bold text-lg">{outOfStockItems.length}</span> items need restocking
                      </p>
                    </div>
                  )}
                  
                  {lowStockItems.length > 0 && (
                    <div className="bg-orange-100/50 rounded-lg p-4 border border-orange-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                        <span className="font-semibold text-orange-900">Low Stock</span>
                      </div>
                      <p className="text-orange-700 text-sm">
                        <span className="font-bold text-lg">{lowStockItems.length}</span> items below 10% threshold
                      </p>
                    </div>
                  )}
                </div>
                
                <Link to="/storage" 
                  className="inline-flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl">
                  <span>Manage Inventory</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8 sm:mb-12">
          
          {/* Recent Usage Records */}
          <section className="bg-white rounded-2xl shadow-lg border border-gray-100/50 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">最近使用记录</h2>
                  <p className="text-sm text-gray-600">Recent Usage Records</p>
                </div>
                <Link 
                  to="/records" 
                  className="inline-flex items-center space-x-1 text-primary-600 hover:text-primary-700 font-semibold text-sm group transition-colors"
                >
                  <span>View All</span>
                  <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              </div>
            </div>
            
            <div className="p-6">
              {recentData?.records?.length > 0 ? (
                <div className="space-y-4">
                  {recentData.records.slice(0, 3).map((record, index) => (
                    <div key={record.id} 
                      className={`transform transition-all duration-300 ${
                        isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
                      }`}
                      style={{ transitionDelay: `${index * 100}ms` }}>
                      <RecordCard record={record} compact enhanced />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 text-gray-300">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No records yet</h3>
                  <p className="text-gray-600 mb-4">Start tracking your laboratory usage</p>
                  <Link to="/add" className="btn-primary inline-flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Add First Record</span>
                  </Link>
                </div>
              )}
            </div>
          </section>

          {/* Low Stock Items */}
          <section className="bg-white rounded-2xl shadow-lg border border-gray-100/50 overflow-hidden">
            <div className="bg-gradient-to-r from-orange-50 to-red-50 px-6 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    低库存提醒 ({lowStockItems.length})
                  </h2>
                  <p className="text-sm text-gray-600">Low Stock Alerts</p>
                </div>
                <Link 
                  to="/storage" 
                  className="inline-flex items-center space-x-1 text-red-600 hover:text-red-700 font-semibold text-sm group transition-colors"
                >
                  <span>Manage All</span>
                  <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              </div>
            </div>
            
            <div className="p-6">
              {lowStockItems.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 max-h-96 overflow-y-auto scrollbar-hide">
                  {lowStockItems.slice(0, 6).map((item, index) => (
                    <div key={item.id} 
                      className={`group relative bg-gradient-to-r from-red-50 to-orange-50 border border-red-200/60 rounded-xl p-4 hover:shadow-md transition-all duration-300 transform hover:scale-[1.02] ${
                        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                      }`}
                      style={{ transitionDelay: `${index * 50}ms` }}>
                      
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0 pr-3">
                          <h4 className="font-semibold text-red-900 break-words text-sm leading-tight">
                            {item['产品名']}
                          </h4>
                          <p className="text-xs text-red-700 mt-1">{item['类型']}</p>
                        </div>
                        <div className="flex-shrink-0">
                          <span className="bg-red-100 text-red-800 text-xs font-semibold px-2 py-1 rounded-full">
                            {item['当前库存量'].toFixed(1)}{item['单位'] || ''}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center text-xs text-red-600 mb-3">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                        <span>{item['存放地']}</span>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Link
                          to={`/storage/${item.id}`}
                          className="flex-1 text-xs bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors text-center font-medium"
                        >
                          View Details
                        </Link>
                        <Link
                          to={`/storage/${item.id}/use`}
                          className="flex-1 text-xs bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-center font-medium"
                        >
                          Record Use
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 text-green-400">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">All stocks healthy!</h3>
                  <p className="text-gray-600">No items require immediate attention</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

export default Dashboard 