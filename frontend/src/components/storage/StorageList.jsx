import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStorageApi } from '../../hooks/useStorageApi';
import StorageCard from './StorageCard';
import SearchForm from '../forms/SearchForm';
import LoadingSpinner from '../ui/LoadingSpinner';

const StorageList = () => {
  const navigate = useNavigate();
  const [storage, setStorage] = useState([]);
  const [filters, setFilters] = useState({
    page: 1,
    per_page: 20,
    search: '',
    type: '',
    location: '',
    sort_by: '产品名',
    sort_order: 'asc'
  });
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [selectedItem, setSelectedItem] = useState(null);
  const [showUsageModal, setShowUsageModal] = useState(false);
  const [availableTypes, setAvailableTypes] = useState([]);
  const [typesLoading, setTypesLoading] = useState(true);

  const { getStorageItems, deleteStorageItem, getStorageTypes } = useStorageApi();

  const loadStorage = async () => {
    setLoading(true);
    try {
      const data = await getStorageItems(filters);
      setStorage(data.items);
      setPagination({
        total: data.total,
        page: data.page,
        per_page: data.per_page,
        pages: data.pages,
        has_next: data.has_next,
        has_prev: data.has_prev
      });
    } catch (error) {
      console.error('Failed to load storage:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTypes = async () => {
    setTypesLoading(true);
    try {
      const data = await getStorageTypes();
      if (data?.types) {
        setAvailableTypes(data.types);
      }
    } catch (error) {
      console.error('Error loading storage types:', error);
    } finally {
      setTypesLoading(false);
    }
  };

  // Load when filters change
  useEffect(() => {
    loadStorage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  // Load types on mount and refresh on window focus
  useEffect(() => {
    loadTypes(); // Load types once on mount
    
    const onFocusOrVisible = () => {
      loadStorage();
    };
    window.addEventListener('focus', onFocusOrVisible);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') onFocusOrVisible();
    });
    return () => {
      window.removeEventListener('focus', onFocusOrVisible);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handlePageChange = (page) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleDelete = async (id) => {
    if (window.confirm('确定要删除这个存储项目吗？此操作不可撤销。')) {
      try {
        await deleteStorageItem(id);
        await loadStorage();
      } catch (error) {
        alert('删除失败: ' + error.message);
      }
    }
  };

  const handleEdit = (item) => {
    navigate(`/storage/${item.id}/edit`);
  };

  const handleUse = (item) => {
    setSelectedItem(item);
    setShowUsageModal(true);
  };

  const handleSort = (field) => {
    const newOrder = filters.sort_by === field && filters.sort_order === 'asc' ? 'desc' : 'asc';
    setFilters(prev => ({
      ...prev,
      sort_by: field,
      sort_order: newOrder
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                库存管理 <span className="text-lg font-normal text-gray-600">Storage Management</span>
              </h1>
              <p className="text-gray-600">
                管理实验室化学品和试剂库存 • {pagination.total || 0} items total
              </p>
            </div>
            <div className="flex space-x-3 mt-4 sm:mt-0">
              <button
                onClick={() => navigate('/storage/import')}
                className="btn-secondary inline-flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
                批量导入
              </button>
              <button
                onClick={() => navigate('/storage/add')}
                className="btn-primary inline-flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                添加库存
              </button>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="card mb-4">
          <SearchForm 
            onFilterChange={handleFilterChange}
            initialFilters={filters}
            searchPlaceholder="搜索产品名、类型、存放地或CAS号..."
            showTypeFilter={true}
            showLocationFilter={true}
          />
        </div>

        {/* Filters and Sort */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          {/* Quick Filters */}
          <div className="flex flex-wrap gap-2">
            {typesLoading ? (
              <div className="text-sm text-gray-500">Loading types...</div>
            ) : (
              [
                { label: '全部', value: '' },
                ...availableTypes.map(type => ({ label: type, value: type }))
              ].map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => handleFilterChange({ type: filter.value })}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    filters.type === filter.value 
                      ? 'bg-primary-100 text-primary-700 ring-1 ring-primary-200' 
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  {filter.label}
                </button>
              ))
            )}
          </div>

          {/* Sort Options */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-600">排序:</span>
            {[
              { label: '产品名', value: '产品名' },
              { label: '类型', value: '类型' },
              { label: '库存', value: '当前库存量' }
            ].map((sort) => (
              <button
                key={sort.value}
                onClick={() => handleSort(sort.value)}
                className={`flex items-center space-x-1 px-2 py-1 rounded transition-colors focus-ring ${
                  filters.sort_by === sort.value ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span>{sort.label}</span>
                {filters.sort_by === sort.value && (
                  <span>{filters.sort_order === 'asc' ? '↑' : '↓'}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Storage Items */}
        {loading && storage.length === 0 ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner text="加载中..." />
          </div>
        ) : (
          <>
            {loading && (
              <div className="w-full flex justify-center my-4">
                <LoadingSpinner size="sm" text="" />
              </div>
            )}
            {storage.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
                {storage.map(item => (
                  <StorageCard
                    key={item.id}
                    item={item}
                    onDelete={handleDelete}
                    onEdit={handleEdit}
                    onUse={handleUse}
                  />
                ))}
              </div>
            ) : (
              <div className="card text-center py-12">
                <div className="w-20 h-20 mx-auto mb-4 text-gray-300">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">暂无库存数据</h3>
                <p className="text-gray-600 mb-6">添加第一个库存项目或导入现有数据</p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => navigate('/storage/add')}
                    className="btn-primary inline-flex items-center justify-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    添加库存
                  </button>
                  <button
                    onClick={() => navigate('/storage/import')}
                    className="btn-secondary inline-flex items-center justify-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                    </svg>
                    批量导入
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="card">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="text-sm text-gray-700">
                显示第 {((pagination.page - 1) * pagination.per_page) + 1} 到{' '}
                {Math.min(pagination.page * pagination.per_page, pagination.total)} 项，
                共 {pagination.total} 项
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={!pagination.has_prev}
                  className="btn-secondary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  上一页
                </button>
                <span className="flex items-center px-3 py-2 text-sm font-medium text-gray-700">
                  {pagination.page} / {pagination.pages}
                </span>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={!pagination.has_next}
                  className="btn-secondary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  下一页
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Usage Modal */}
        {showUsageModal && selectedItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-md w-full shadow-xl">
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">记录使用 - {selectedItem['产品名']}</h3>
                <p className="text-gray-600 mb-6">将跳转到使用记录页面进行详细操作</p>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowUsageModal(false)}
                    className="btn-secondary"
                  >
                    取消
                  </button>
                  <button
                    onClick={() => {
                      setShowUsageModal(false);
                      navigate(`/storage/${selectedItem.id}/use`);
                    }}
                    className="btn-primary"
                  >
                    继续记录
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StorageList; 