import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useStorageApi } from '../hooks/useStorageApi';
import StorageForm from '../components/storage/StorageForm';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const EditStorage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState(null);

  const { getStorageItem, updateStorageItem } = useStorageApi();

  // Fetch the storage item to edit
  const { data: storageItem, isLoading, error: fetchError } = useQuery(
    ['storage', id],
    () => getStorageItem(id),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  // Update storage item mutation
  const updateStorageMutation = useMutation(
    (data) => updateStorageItem(id, data),
    {
      onSuccess: (response) => {
        // Invalidate and refetch relevant queries
        queryClient.invalidateQueries(['storage']);
        queryClient.invalidateQueries(['inventory']);
        queryClient.invalidateQueries(['storage', id]);
        
        // Defensive: check for response
        if (response) {
          navigate(`/storage/${id}`);
        } else {
          setError('库存项目更新成功，但未返回有效的响应信息');
        }
      },
      onError: (error) => {
        setError(error.response?.data?.error || 'Failed to update storage item');
      }
    }
  );

  const handleSubmit = async (data) => {
    setError(null);
    await updateStorageMutation.mutateAsync(data);
  };

  const handleCancel = () => {
    navigate(`/storage/${id}`);
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (fetchError) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-8">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">加载失败</h2>
          <p className="text-gray-600 mb-4">无法加载库存项目信息</p>
          <button
            onClick={() => navigate('/storage')}
            className="btn-primary"
          >
            返回库存列表
          </button>
        </div>
      </div>
    );
  }

  if (!storageItem?.item) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-8">
          <div className="text-gray-400 mb-4">
            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-2.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 009.586 13H7" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">库存项目不存在</h2>
          <p className="text-gray-600 mb-4">找不到指定的库存项目</p>
          <button
            onClick={() => navigate('/storage')}
            className="btn-primary"
          >
            返回库存列表
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center space-x-2 mb-2">
          <button
            onClick={() => navigate(`/storage/${id}`)}
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold text-gray-900">编辑库存项目</h1>
        </div>
        <p className="text-gray-600">修改 "{storageItem.item['产品名']}" 的信息</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      )}

      {/* Current Stock Info */}
      <div className="mb-6 bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">当前库存信息</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-blue-700 text-sm">
          <div>
            <span className="font-medium">当前库存:</span> {storageItem.item['当前库存量'].toFixed(2)}g
          </div>
          <div>
            <span className="font-medium">原始数量:</span> {storageItem.item['数量及数量单位']}
          </div>
          <div>
            <span className="font-medium">更新时间:</span> {
              storageItem.item['更新时间'] 
                ? new Date(storageItem.item['更新时间']).toLocaleString('zh-CN')
                : '未知'
            }
          </div>
        </div>
      </div>

      {updateStorageMutation.isLoading ? (
        <LoadingSpinner text="更新库存项目中..." />
      ) : (
        <StorageForm
          initialData={storageItem.item}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      )}

      {/* Warning */}
      <div className="mt-8 bg-yellow-50 p-4 rounded-lg">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div className="text-yellow-800">
            <p className="font-medium">注意事项</p>
            <p className="text-sm mt-1">
              • 修改数量信息时，当前库存量将重新计算<br/>
              • 如果该项目已有使用记录，请谨慎修改产品名和类型<br/>
              • 修改存放地请确保实际位置也相应调整
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditStorage; 