import ApiService from '../services/ApiService';
import useApiRequest from './useApiRequest';

export const useAnalyticsApi = () => {
  const { loading, error, request } = useApiRequest();

  const getDashboardStats = (days = 30) =>
    request(() => ApiService.get('/api/analytics/dashboard', { days }));

  const getPersonnelStats = (days = 30) =>
    request(() => ApiService.get('/api/analytics/personnel', { days }));

  const getDrugStats = (days = 30) =>
    request(() => ApiService.get('/api/analytics/drugs', { days }));

  const getUsageTrends = (period = 'daily', days = 30) =>
    request(() => ApiService.get('/api/analytics/trends', { period, days }));

  const getAutocompleteData = () =>
    request(() => ApiService.get('/api/analytics/autocomplete'));

  return {
    loading,
    error,
    getDashboardStats,
    getPersonnelStats,
    getDrugStats,
    getUsageTrends,
    getAutocompleteData
  };
};
