import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from 'react-query';
import { useStorageApi } from '../hooks/useStorageApi';
import StorageForm from '../components/storage/StorageForm';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const AddStorage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState(null);

  const { createStorageItem } = useStorageApi();

  const createStorageMutation = useMutation(
    (data) => createStorageItem(data),
    {
      onSuccess: (response) => {
        // Invalidate and refetch relevant queries
        queryClient.invalidateQueries(['storage']);
        queryClient.invalidateQueries(['inventory']);
        
        // Defensive: check for response and item
        if (response?.item && response.item.id) {
          navigate(`/storage/${response.item.id}`);
        } else {
          setError('创建库存项目成功，但未返回有效的库存项目信息');
        }
      },
      onError: (error) => {
        setError(error.response?.data?.error || 'Failed to create storage item');
      }
    }
  );

  const handleSubmit = async (data) => {
    setError(null);
    await createStorageMutation.mutateAsync(data);
  };

  const handleCancel = () => {
    navigate('/storage');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center space-x-2 mb-2">
          <button
            onClick={() => navigate('/storage')}
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold text-gray-900">添加库存项目</h1>
        </div>
        <p className="text-gray-600">向实验室库存系统添加新的化学品或试剂</p>
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

      {createStorageMutation.isLoading ? (
        <LoadingSpinner text="Creating storage item..." />
      ) : (
        <StorageForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      )}

      {/* Help Section */}
      <div className="mt-8 bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📝 填写说明</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-700">
          <div>
            <h4 className="font-medium mb-2">类型选择</h4>
                          <ul className="space-y-1">
                <li>• <strong>化学品</strong>: 有机化学品、无机化学品等</li>
                <li>• <strong>试剂</strong>: 实验用化学试剂</li>
                <li>• <strong>酶</strong>: 生物酶类</li>
                <li>• <strong>缓冲液</strong>: 各种缓冲溶液</li>
              </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">数量格式</h4>
            <ul className="space-y-1">
              <li>• <strong>体积</strong>: 100ml, 50μl, 1L</li>
              <li>• <strong>质量</strong>: 500g, 100mg, 2kg</li>
              <li>• <strong>特殊</strong>: 1支, 10片, 5瓶</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">存放地建议</h4>
            <ul className="space-y-1">
              <li>• <strong>4°C</strong>: 化学品、酶类</li>
              <li>• <strong>-20°C</strong>: 长期保存试剂</li>
              <li>• <strong>室温</strong>: 稳定化学品</li>
              <li>• <strong>特殊</strong>: 有机、无机、危险品分类</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">CAS号作用</h4>
            <ul className="space-y-1">
              <li>• 化学物质唯一标识符</li>
              <li>• 便于查找安全数据表</li>
              <li>• 确保物质准确识别</li>
              <li>• 格式: 123-45-6</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddStorage; 