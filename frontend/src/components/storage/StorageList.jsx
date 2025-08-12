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

  const { getStorageItems, deleteStorageItem } = useStorageApi();

  useEffect(() => {
    loadStorage();
  }, [filters]);

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
        setStorage(storage.filter(item => item.id !== id));
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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">库存管理</h2>
          <p className="text-gray-600">管理实验室化学品和试剂库存</p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-2">
          <button
            onClick={() => navigate('/storage/import')}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
          >
            批量导入
          </button>
          <button
            onClick={() => navigate('/storage/add')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            添加库存
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <SearchForm 
          onFilterChange={handleFilterChange}
          initialFilters={filters}
          searchPlaceholder="搜索产品名、类型、存放地或CAS号..."
          showTypeFilter={true}
          showLocationFilter={true}
        />
      </div>

      {/* Quick Filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => handleFilterChange({ type: '' })}
          className={`px-3 py-1 rounded text-sm transition-colors ${
            !filters.type ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          全部
        </button>
        <button
          onClick={() => handleFilterChange({ type: '化学品' })}
          className={`px-3 py-1 rounded text-sm transition-colors ${
            filters.type === '化学品' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          化学品
        </button>
        <button
          onClick={() => handleFilterChange({ type: '试剂' })}
          className={`px-3 py-1 rounded text-sm transition-colors ${
            filters.type === '试剂' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          试剂
        </button>
        <button
          onClick={() => handleFilterChange({ type: '酶' })}
          className={`px-3 py-1 rounded text-sm transition-colors ${
            filters.type === '酶' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          酶
        </button>
        <button
          onClick={() => handleFilterChange({ type: '缓冲液' })}
          className={`px-3 py-1 rounded text-sm transition-colors ${
            filters.type === '缓冲液' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          缓冲液
        </button>
      </div>

      {/* Sort Options */}
      <div className="flex flex-wrap gap-2 text-sm">
        <span className="text-gray-600">排序:</span>
        <button
          onClick={() => handleSort('产品名')}
          className={`flex items-center space-x-1 px-2 py-1 rounded transition-colors ${
            filters.sort_by === '产品名' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <span>产品名</span>
          {filters.sort_by === '产品名' && (
            <span>{filters.sort_order === 'asc' ? '↑' : '↓'}</span>
          )}
        </button>
        <button
          onClick={() => handleSort('类型')}
          className={`flex items-center space-x-1 px-2 py-1 rounded transition-colors ${
            filters.sort_by === '类型' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <span>类型</span>
          {filters.sort_by === '类型' && (
            <span>{filters.sort_order === 'asc' ? '↑' : '↓'}</span>
          )}
        </button>
        <button
          onClick={() => handleSort('当前库存量')}
          className={`flex items-center space-x-1 px-2 py-1 rounded transition-colors ${
            filters.sort_by === '当前库存量' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <span>库存量</span>
          {filters.sort_by === '当前库存量' && (
            <span>{filters.sort_order === 'asc' ? '↑' : '↓'}</span>
          )}
        </button>
      </div>

      {/* Storage Items Grid */}
      {loading && storage.length === 0 ? (
        <LoadingSpinner text="加载中..." />
      ) : (
        <>
          {loading && (
            <div className="w-full flex justify-center my-4">
              <LoadingSpinner size="sm" text="" />
            </div>
          )}
          {storage.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
            <div className="text-center py-12 text-gray-500">
              <div className="text-6xl mb-4">📦</div>
              <p className="text-lg mb-2">暂无库存数据</p>
              <p className="text-sm">添加第一个库存项目或导入现有数据</p>
              <div className="mt-4 space-x-2">
                <button
                  onClick={() => navigate('/storage/add')}
                  className="btn-primary"
                >
                  添加库存
                </button>
                <button
                  onClick={() => navigate('/storage/import')}
                  className="btn-secondary"
                >
                  批量导入
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between bg-white px-4 py-3 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm text-gray-700">
            显示第 {((pagination.page - 1) * pagination.per_page) + 1} 到{' '}
            {Math.min(pagination.page * pagination.per_page, pagination.total)} 项，
            共 {pagination.total} 项
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={!pagination.has_prev}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              上一页
            </button>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={!pagination.has_next}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              下一页
            </button>
          </div>
        </div>
      )}

      {/* Usage Modal */}
      {showUsageModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-bold mb-4">记录使用 - {selectedItem['产品名']}</h3>
              {/* Usage form would go here */}
              <div className="flex justify-end space-x-2 mt-6">
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
  );
};

export default StorageList; 