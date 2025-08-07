import ApiService from '../services/ApiService';
import useApiRequest from './useApiRequest';

export const useRecordsApi = () => {
  const { loading, error, request } = useApiRequest();

  const getRecords = (params = {}) =>
    request(() => ApiService.get('/api/records', params));

  const getRecord = (id) =>
    request(() => ApiService.get(`/api/records/${id}`));

  const createRecord = (data) =>
    request(() => ApiService.post('/api/records', data));

  const updateRecord = (id, data) =>
    request(() => ApiService.put(`/api/records/${id}`, data));

  const deleteRecord = (id) =>
    request(() => ApiService.delete(`/api/records/${id}`));

  const getRecentRecords = (limit = 10) =>
    request(() => ApiService.get('/api/records/recent', { limit }));

  return {
    loading,
    error,
    getRecords,
    getRecord,
    createRecord,
    updateRecord,
    deleteRecord,
    getRecentRecords,
  };
};
