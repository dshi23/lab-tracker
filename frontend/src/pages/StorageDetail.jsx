import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useStorageApi } from '../hooks/useStorageApi';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const StorageDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState(null);

  const { getStorageItem, deleteStorageItem, getUsageHistory } = useStorageApi();

  // Fetch storage item details
  const { data: storageItem, isLoading, error: fetchError } = useQuery(
    ['storage', id],
    () => getStorageItem(id),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  // Fetch usage history
  const { data: usageHistory, isLoading: historyLoading } = useQuery(
    ['usage-history', id],
    () => getUsageHistory(id, { per_page: 10 }),
    {
      enabled: !!id,
      staleTime: 2 * 60 * 1000, // 2 minutes
    }
  );

  // Delete storage item mutation
  const deleteStorageMutation = useMutation(
    () => deleteStorageItem(id),
    {
      onSuccess: (response) => {
        // Invalidate and refetch relevant queries
        queryClient.invalidateQueries(['storage']);
        queryClient.invalidateQueries(['inventory']);
        
        // Defensive: check for response
        if (response !== undefined) {
          navigate('/storage');
        } else {
          setError('删除库存项目成功，但未返回有效的响应信息');
        }
      },
      onError: (error) => {
        setError(error.response?.data?.error || 'Failed to delete storage item');
      }
    }
  );

  const handleDelete = async () => {
    setError(null);
    await deleteStorageMutation.mutateAsync();
  };

  const getStockStatus = (item) => {
    // Parse original quantity to calculate percentage
    const originalMatch = item['数量及数量单位'].match(/([0-9.]+)/);
    if (!originalMatch) return { color: 'text-gray-600', bg: 'bg-gray-50', label: '数量未知', percentage: 0 };
    
    const originalQuantity = parseFloat(originalMatch[1]);
    const percentage = originalQuantity > 0 ? (item['当前库存量'] / originalQuantity) * 100 : 0;
    
    if (percentage < 10) return { color: 'text-red-600', bg: 'bg-red-50', label: '库存不足', percentage };
    if (percentage < 30) return { color: 'text-yellow-600', bg: 'bg-yellow-50', label: '库存较低', percentage };
    return { color: 'text-green-600', bg: 'bg-green-50', label: '库存充足', percentage };
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (fetchError) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Error loading storage item</p>
        <Link to="/storage" className="text-primary-600 hover:text-primary-700 mt-2 inline-block">
          Back to Storage
        </Link>
      </div>
    );
  }

  if (!storageItem?.item) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Storage item not found</p>
        <Link to="/storage" className="text-primary-600 hover:text-primary-700 mt-2 inline-block">
          Back to Storage
        </Link>
      </div>
    );
  }

  const item = storageItem.item;
  const status = getStockStatus(item);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigate('/storage')}
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{item['产品名']}</h1>
          <span className="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded">
            {item['类型']}
          </span>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => navigate(`/storage/${id}/use`)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
          >
            记录使用
          </button>
          <button
            onClick={() => navigate(`/storage/${id}/edit`)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            编辑
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
          >
            删除
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Storage Item Details */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">库存详情</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">产品名</label>
            <p className="text-lg font-semibold text-gray-900">{item['产品名']}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">类型</label>
            <p className="text-lg text-gray-900">{item['类型']}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">原始数量</label>
            <p className="text-lg text-gray-900">{item['数量及数量单位']}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">当前库存</label>
            <p className={`text-lg font-semibold ${status.color}`}>
              {item['当前库存量'].toFixed(3)}g
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">存放地</label>
            <p className="text-lg text-gray-900">{item['存放地']}</p>
          </div>
          
          {item['CAS号'] && (
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">CAS号</label>
              <p className="text-lg font-mono text-gray-900">{item['CAS号']}</p>
            </div>
          )}
        </div>

        {/* Stock Status */}
        <div className="mt-6">
          <div className={`p-4 rounded-lg ${status.bg}`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`font-medium ${status.color}`}>{status.label}</span>
              <span className={`text-sm ${status.color}`}>
                {status.percentage.toFixed(1)}% 剩余
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-300 ${
                  status.color.includes('red') ? 'bg-red-500' :
                  status.color.includes('yellow') ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.max(5, status.percentage)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Timestamps */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <span className="font-medium">创建时间:</span> {
                item['创建时间'] 
                  ? new Date(item['创建时间']).toLocaleString('zh-CN')
                  : '未知'
              }
            </div>
            <div>
              <span className="font-medium">最后更新:</span> {
                item['更新时间'] 
                  ? new Date(item['更新时间']).toLocaleString('zh-CN')
                  : '未知'
              }
            </div>
          </div>
        </div>
      </div>

      {/* Usage History */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">使用历史</h2>
          {usageHistory?.statistics && (
            <div className="text-sm text-gray-600">
              共 {usageHistory.statistics.usage_count} 次使用
            </div>
          )}
        </div>

        {historyLoading ? (
          <div className="text-center py-8">
            <LoadingSpinner />
          </div>
        ) : usageHistory?.usage_records?.length > 0 ? (
          <div className="space-y-4">
            {usageHistory.usage_records.map(record => (
              <div key={record.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-4">
                    <span className="font-medium text-gray-900">
                      {record['使用人']}
                    </span>
                    <span className="text-sm text-gray-600">
                      {new Date(record['使用日期']).toLocaleDateString('zh-CN')}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-red-600">
                      -{record['使用量_g'].toFixed(3)}g
                    </div>
                    <div className="text-xs text-gray-500">
                      余 {record['余量_g'].toFixed(3)}g
                    </div>
                  </div>
                </div>
                {record['备注'] && (
                  <p className="text-sm text-gray-600 mt-2">{record['备注']}</p>
                )}
              </div>
            ))}
            
            {usageHistory.pagination.total > usageHistory.usage_records.length && (
              <div className="text-center">
                <button
                  onClick={() => navigate(`/storage/${id}/history`)}
                  className="text-blue-600 hover:text-blue-700 text-sm"
                >
                  查看完整使用历史 ({usageHistory.pagination.total} 条记录)
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">📝</div>
            <p>暂无使用记录</p>
            <button
              onClick={() => navigate(`/storage/${id}/use`)}
              className="mt-2 text-blue-600 hover:text-blue-700"
            >
              记录第一次使用
            </button>
          </div>
        )}

        {/* Usage Statistics */}
        {usageHistory?.statistics && usageHistory.statistics.usage_count > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="font-medium text-gray-900 mb-3">使用统计</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-gray-600">总使用量</div>
                <div className="font-semibold">{usageHistory.statistics.total_usage_g.toFixed(3)}g</div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-gray-600">平均使用量</div>
                <div className="font-semibold">{usageHistory.statistics.average_usage_g.toFixed(3)}g</div>
              </div>
              {usageHistory.statistics.most_frequent_user && (
                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-gray-600">主要使用者</div>
                  <div className="font-semibold">{usageHistory.statistics.most_frequent_user}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">确认删除</h3>
            <p className="text-gray-600 mb-6">
              确定要删除库存项目 "{item['产品名']}" 吗？此操作不可撤销。
            </p>
            <div className="flex space-x-4">
              <button
                onClick={handleDelete}
                disabled={deleteStorageMutation.isLoading}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {deleteStorageMutation.isLoading ? '删除中...' : '确认删除'}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-gray-700"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StorageDetail; 