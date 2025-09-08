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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <div className="flex items-center space-x-3 mb-2">
            <button
              onClick={() => navigate('/storage')}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors focus-ring"
              aria-label="Back to storage"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                添加库存项目 <span className="text-lg font-normal text-gray-600">Add Storage Item</span>
              </h1>
              <p className="text-gray-600">向实验室库存系统添加新的化学品或试剂</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-600">{error}</p>
            </div>
          </div>
        )}

        {createStorageMutation.isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner text="Creating storage item..." />
          </div>
        ) : (
          <StorageForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        )}

        {/* Help Section */}
        <div className="mt-8 card">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">填写说明</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 flex items-center">
                <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                类型选择
              </h4>
              <div className="space-y-2 pl-4">
                <div className="flex items-start">
                  <span className="font-medium text-gray-700 min-w-0 flex-1">化学品:</span>
                  <span className="text-gray-600 text-xs ml-2">有机、无机化学品等</span>
                </div>
                <div className="flex items-start">
                  <span className="font-medium text-gray-700 min-w-0 flex-1">试剂:</span>
                  <span className="text-gray-600 text-xs ml-2">实验用化学试剂</span>
                </div>
                <div className="flex items-start">
                  <span className="font-medium text-gray-700 min-w-0 flex-1">酶:</span>
                  <span className="text-gray-600 text-xs ml-2">生物酶类</span>
                </div>
                <div className="flex items-start">
                  <span className="font-medium text-gray-700 min-w-0 flex-1">缓冲液:</span>
                  <span className="text-gray-600 text-xs ml-2">各种缓冲溶液</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 flex items-center">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                数量格式
              </h4>
              <div className="space-y-2 pl-4">
                <div className="flex items-start">
                  <span className="font-medium text-gray-700 min-w-0 flex-1">体积:</span>
                  <span className="text-gray-600 text-xs ml-2">100ml, 1L, 50μl</span>
                </div>
                <div className="flex items-start">
                  <span className="font-medium text-gray-700 min-w-0 flex-1">质量:</span>
                  <span className="text-gray-600 text-xs ml-2">500g, 100mg, 2kg</span>
                </div>
                <div className="flex items-start">
                  <span className="font-medium text-gray-700 min-w-0 flex-1">包装:</span>
                  <span className="text-gray-600 text-xs ml-2">10瓶, 5盒, 20包</span>
                </div>
                <div className="flex items-start">
                  <span className="font-medium text-gray-700 min-w-0 flex-1">浓度:</span>
                  <span className="text-gray-600 text-xs ml-2">10mg/ml, 5μg/ml</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 flex items-center">
                <span className="w-2 h-2 bg-purple-400 rounded-full mr-2"></span>
                存放建议
              </h4>
              <div className="space-y-2 pl-4">
                <div className="flex items-start">
                  <span className="font-medium text-gray-700 min-w-0 flex-1">4°C:</span>
                  <span className="text-gray-600 text-xs ml-2">化学品、酶类</span>
                </div>
                <div className="flex items-start">
                  <span className="font-medium text-gray-700 min-w-0 flex-1">-20°C:</span>
                  <span className="text-gray-600 text-xs ml-2">长期保存试剂</span>
                </div>
                <div className="flex items-start">
                  <span className="font-medium text-gray-700 min-w-0 flex-1">室温:</span>
                  <span className="text-gray-600 text-xs ml-2">稳定化学品</span>
                </div>
                <div className="flex items-start">
                  <span className="font-medium text-gray-700 min-w-0 flex-1">特殊:</span>
                  <span className="text-gray-600 text-xs ml-2">危险品分类保存</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 flex items-center">
                <span className="w-2 h-2 bg-orange-400 rounded-full mr-2"></span>
                品牌信息
              </h4>
              <div className="space-y-2 pl-4 text-gray-600">
                <p>产品制造商品牌（可选字段）</p>
                <p className="text-xs">示例: Sigma, Merck, Thermo</p>
                <p className="text-xs">便于产品识别和质量追溯</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 flex items-center">
                <span className="w-2 h-2 bg-red-400 rounded-full mr-2"></span>
                CAS号作用
              </h4>
              <div className="space-y-2 pl-4 text-gray-600">
                <p>化学物质唯一标识符</p>
                <p className="text-xs">便于查找安全数据表</p>
                <p className="text-xs">格式: 123-45-6</p>
                <p className="text-xs">确保物质准确识别</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddStorage; 