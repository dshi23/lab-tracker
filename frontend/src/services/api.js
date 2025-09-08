import axios from 'axios'

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '', // Use relative URLs for Vite proxy
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.config.url, response.status, response.data)
    return response.data
  },
  (error) => {
    console.error('API Error:', error.config?.url, error.response?.status, error.response?.data)
    // Handle common errors
    if (error.response?.status === 401) {
      // Unauthorized - redirect to login
      localStorage.removeItem('auth_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Import/Export API
export const importExportAPI = {
  // Import Excel file
  importExcel: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/api/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },
  
  // Export Excel file
  exportExcel: (params = {}) => 
    api.request({
      url: '/api/export',
      method: 'GET',
      params,
      responseType: 'blob',
    }),
  
  // Download template
  downloadTemplate: () => 
    api.request({ url: '/api/template', method: 'GET', responseType: 'blob' }),
  
  // Sync offline data
  syncOfflineData: (data) => api.post('/api/sync', data),
}

// Analytics API
export const analyticsAPI = {
  // Get dashboard stats
  getDashboardStats: (days = 30) => 
    api.get('/api/analytics/dashboard', { params: { days } }),
  
  // Get personnel stats
  getPersonnelStats: (days = 30) => 
    api.get('/api/analytics/personnel', { params: { days } }),
  
  // Get drug stats
  getDrugStats: (days = 30) => 
    api.get('/api/analytics/drugs', { params: { days } }),
  
  // Get usage trends
  getUsageTrends: (period = 'daily', days = 30) => 
    api.get('/api/analytics/trends', { params: { period, days } }),
  
  // Get autocomplete data
  getAutocompleteData: () => api.get('/api/analytics/autocomplete'),
}

// Storage Management API
export const storageAPI = {
  // Get paginated storage items
  getStorageItems: (params = {}) => api.get('/api/storage', { params }),
  
  // Get single storage item
  getStorageItem: (id) => api.get(`/api/storage/${id}`),
  
  // Create storage item
  createStorageItem: (data) => api.post('/api/storage', data),
  
  // Update storage item
  updateStorageItem: (id, data) => api.put(`/api/storage/${id}`, data),
  
  // Delete storage item
  deleteStorageItem: (id) => api.delete(`/api/storage/${id}`),
  
  // Use storage item (unified endpoint)
  useStorageItem: (id, data) => api.post(`/api/storage/${id}/use`, data),
  
  // Quick search for available storage items (Add Record page)
  searchAvailable: (query, limit = 10) => api.get('/api/storage/available', { params: { q: query, limit } }),
  
  // Get low stock items
  getLowStockItems: (threshold = 10) => 
    api.get('/api/storage/low-stock', { params: { threshold } }),
  
  // Get storage items by type
  getStorageByType: (type, params = {}) => 
    api.get(`/api/storage/by-type/${encodeURIComponent(type)}`, { params }),
  
  // Get storage items by location
  getStorageByLocation: (location, params = {}) => 
    api.get(`/api/storage/by-location/${encodeURIComponent(location)}`, { params }),
  
  // Get all storage locations
  getStorageLocations: () => api.get('/api/storage/locations'),
  
  // Get all storage types
  getStorageTypes: () => api.get('/api/storage/types'),
  
  // Get all storage brands
  getStorageBrands: () => api.get('/api/storage/brands'),
  
  // Import storage Excel file
  importStorageExcel: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/api/storage/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },
  
  // Export storage Excel file
  exportStorageExcel: (params = {}) => 
    api.get('/api/storage/export', { 
      params,
      responseType: 'blob'
    }),
  
  // Download storage template
  downloadStorageTemplate: () => 
    api.get('/api/storage/template', { responseType: 'blob' }),
  
  // Bulk update storage quantities
  bulkUpdateStorage: (updates) => 
    api.post('/api/storage/bulk-update', { updates }),
}

// Updated Usage Records API with inventory tracking
export const usageRecordsAPI = {
  // Get paginated usage records
  getUsageRecords: (params = {}) => api.get('/api/records', { params }),
  
  // Get single usage record
  getUsageRecord: (id) => api.get(`/api/records/${id}`),
  
  // Create usage record (with automatic inventory update)
  createUsageRecord: (data) => api.post('/api/records', data),
  
  // Update usage record (with inventory adjustment)
  updateUsageRecord: (id, data) => api.put(`/api/records/${id}`, data),
  
  // Delete usage record (with inventory restoration)
  deleteUsageRecord: (id) => api.delete(`/api/records/${id}`),
  
  // Get recent usage records
  getRecentUsageRecords: (limit = 10) => 
    api.get('/api/records/recent', { params: { limit } }),
  
  // Get usage records by personnel
  getUsageRecordsByPersonnel: (name, params = {}) => 
    api.get(`/api/records/by-personnel/${encodeURIComponent(name)}`, { params }),
  
  // Get usage records by product
  getUsageRecordsByProduct: (name, params = {}) => 
    api.get(`/api/records/by-product/${encodeURIComponent(name)}`, { params }),
}

// Inventory Analytics API
export const inventoryAPI = {
  // Get inventory dashboard data
  getInventoryDashboard: () => api.get('/api/inventory/dashboard'),
  
  // Get inventory alerts (low stock, unused items)
  getInventoryAlerts: (params = {}) => 
    api.get('/api/inventory/alerts', { params }),
  
  // Get usage history for specific storage item
  getUsageHistory: (storageId, params = {}) => 
    api.get(`/api/inventory/usage-history/${storageId}`, { params }),
  
  // Get inventory turnover analysis
  getInventoryTurnover: (days = 30) => 
    api.get('/api/inventory/turnover', { params: { days } }),
  
  // Get inventory usage trends
  getInventoryTrends: (params = {}) => 
    api.get('/api/inventory/trends', { params }),
}

// Health check
export const healthAPI = {
  checkHealth: () => api.get('/api/health'),
}

export default api 