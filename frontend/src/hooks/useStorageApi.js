import { useState } from 'react';
import { storageAPI, usageRecordsAPI, inventoryAPI } from '../services/api';

export const useStorageApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getStorageItems = async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await storageAPI.getStorageItems(filters);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getStorageItem = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const response = await storageAPI.getStorageItem(id);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createStorageItem = async (data) => {
    setLoading(true);
    setError(null);
    try {
      const response = await storageAPI.createStorageItem(data);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateStorageItem = async (id, data) => {
    setLoading(true);
    setError(null);
    try {
      const response = await storageAPI.updateStorageItem(id, data);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteStorageItem = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const response = await storageAPI.deleteStorageItem(id);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const recordUsage = async (storageId, usageData) => {
    setLoading(true);
    setError(null);
    try {
      // Use the new unified endpoint for better unit consistency
      const response = await storageAPI.useStorageItem(storageId, usageData);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const importStorageExcel = async (file) => {
    setLoading(true);
    setError(null);
    try {
      const response = await storageAPI.importStorageExcel(file);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const exportStorageExcel = async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await storageAPI.exportStorageExcel(filters);
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `storage_export_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const downloadStorageTemplate = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await storageAPI.downloadStorageTemplate();
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'storage_template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getInventoryDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await inventoryAPI.getInventoryDashboard();
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getLowStockItems = async (threshold = 10) => {
    setLoading(true);
    setError(null);
    try {
      const response = await storageAPI.getLowStockItems(threshold);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getInventoryAlerts = async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await inventoryAPI.getInventoryAlerts(params);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getUsageHistory = async (storageId, params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await inventoryAPI.getUsageHistory(storageId, params);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getInventoryTrends = async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await inventoryAPI.getInventoryTrends(params);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const bulkUpdateStorage = async (updates) => {
    setLoading(true);
    setError(null);
    try {
      const response = await storageAPI.bulkUpdateStorage(updates);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

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
    bulkUpdateStorage
  };
}; 