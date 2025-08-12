import ApiService from '../services/ApiService';
import useApiRequest from './useApiRequest';

export const useStorageApi = () => {
  const { loading, error, request } = useApiRequest();

  const getStorageItems = (filters = {}) =>
    request(() => ApiService.get('/api/storage', filters));

    const getStorageItem = (id) =>
    request(() => ApiService.get(`/api/storage/${id}`));

    const createStorageItem = (data) =>
    request(() => ApiService.post('/api/storage', data));

    const updateStorageItem = (id, data) =>
    request(() => ApiService.put(`/api/storage/${id}`, data));

    const deleteStorageItem = (id) =>
    request(() => ApiService.delete(`/api/storage/${id}`));

  const recordUsage = (storageId, usageData) =>
    request(() => ApiService.post(`/api/storage/${storageId}/use`, usageData));

  const importStorageExcel = (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return request(() => ApiService.post('/api/storage/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }));
  };

  const exportStorageExcel = async (filters = {}) => {
    const response = await request(() =>
      ApiService.request({
        url: '/api/storage/export',
        method: 'GET',
        params: filters,
        responseType: 'blob',
      })
    );

    const url = window.URL.createObjectURL(new Blob([response]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `storage_export_${new Date().toISOString().split('T')[0]}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    return true;
  };

  const downloadStorageTemplate = async () => {
    const response = await request(() =>
      ApiService.request({
        url: '/api/storage/template',
        method: 'GET',
        responseType: 'blob',
      })
    );
    const url = window.URL.createObjectURL(new Blob([response]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'storage_template.xlsx');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    return true;
  };

  const getInventoryDashboard = () =>
    request(() => ApiService.get('/api/inventory/dashboard'));

  const getLowStockItems = (threshold = 10) =>
    request(() => ApiService.get('/api/storage/low-stock', { threshold }));

  const getInventoryAlerts = (params = {}) =>
    request(() => ApiService.get('/api/inventory/alerts', params));

  const getUsageHistory = (storageId, params = {}) =>
    request(() => ApiService.get(`/api/inventory/usage-history/${storageId}`, params));

  const getInventoryTrends = (params = {}) =>
    request(() => ApiService.get('/api/inventory/trends', params));

  const searchAvailableStorage = (q = '', limit = 10) =>
    request(() => ApiService.get('/api/storage/available', { q, limit }));

  const getUsageRecords = (params = {}) =>
    request(() => ApiService.get('/api/usage-records', params));

  const bulkUpdateStorage = (updates) =>
    request(() => ApiService.post('/api/storage/bulk-update', { updates }));

  return {
    loading,
    error,
    getStorageItems,
    getStorageItem,
    createStorageItem,
    updateStorageItem,
    deleteStorageItem,
    recordUsage,
    importStorageExcel,
    exportStorageExcel,
    downloadStorageTemplate,
    getInventoryDashboard,
    getLowStockItems,
    getInventoryAlerts,
    getUsageHistory,
    getInventoryTrends,
    bulkUpdateStorage,
    searchAvailableStorage,
    getUsageRecords
  };
}; 