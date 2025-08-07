import api from './api'

/**
 * Tiny wrapper that standardises our API calls so hooks/components only need one import.
 * It simply delegates to the shared Axios instance exported from `api.js`.
 */
const ApiService = {
  get: (endpoint, params = {}) => api.get(endpoint, { params }),
  post: (endpoint, data, config = {}) => api.post(endpoint, data, config),
  put: (endpoint, data, config = {}) => api.put(endpoint, data, config),
  delete: (endpoint, config = {}) => api.delete(endpoint, config),
  request: (config) => api.request(config)
}

export default ApiService
