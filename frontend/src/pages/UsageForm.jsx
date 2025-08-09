import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm } from 'react-hook-form';
import { useStorageApi } from '../hooks/useStorageApi';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import SuccessDialog from '../components/ui/SuccessDialog';

const UsageForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [createdRecord, setCreatedRecord] = useState(null);

  const { getStorageItem, recordUsage } = useStorageApi();

  // Fetch storage item details
  const { data: storageItem, isLoading, error: fetchError } = useQuery(
    ['storage', id],
    () => getStorageItem(id),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: {
      '使用人': '',
      '使用日期': new Date().toISOString().split('T')[0],
      '使用量_g': '',
      '备注': ''
    }
  });

  const watchedUsage = watch('使用量_g', 0);
  const availableStock = storageItem?.item?.['当前库存量'] || 0;
  const remainingStock = availableStock - (parseFloat(watchedUsage) || 0);

  // Record usage mutation
  const recordUsageMutation = useMutation(
    (data) => recordUsage(id, data),
    {
      onSuccess: (response) => {
        // Invalidate and refetch relevant queries
        queryClient.invalidateQueries(['storage']);
        queryClient.invalidateQueries(['inventory']);
        queryClient.invalidateQueries(['usage-records']);
        queryClient.invalidateQueries(['usage-history', id]);
        
        // Store the created record data for the success dialog
        if (response?.record) {
          setCreatedRecord(response.record)
          setShowSuccessDialog(true)
        } else if (response?.usage_record && response.usage_record['使用量_g']) {
          // Fallback navigation if no record data
          navigate(`/storage/${id}`, {
            state: { 
              message: `成功记录使用 ${response.usage_record['使用量_g']}g` 
            }
          });
        } else {
          setError('记录使用成功，但未返回有效的使用记录信息');
        }
      },
      onError: (error) => {
        setError(error.response?.data?.error || 'Failed to record usage');
      }
    }
  );

  const handleFormSubmit = async (data) => {
    setError(null);
    
    // Validate usage amount
    const usageAmount = parseFloat(data['使用量_g']);
    if (usageAmount <= 0) {
      setError('使用量必须大于0');
      return;
    }
    
    if (usageAmount > availableStock) {
      setError('使用量不能超过当前库存量');
      return;
    }

    const formattedData = {
      '使用人': data['使用人'],
      '使用日期': new Date(data['使用日期']),
      '使用量': usageAmount,
      '单位': storageItem?.item?.单位 || 'g',
      '备注': data['备注'] || ''
    };

    await recordUsageMutation.mutateAsync(formattedData);
  };

  const handleSuccessDialogClose = () => {
    setShowSuccessDialog(false)
    setCreatedRecord(null)
  }

  const handleEditRecord = () => {
    if (createdRecord?.id) {
      navigate(`/records/${createdRecord.id}/edit`)
    }
  }

  const handleViewRecords = () => {
    navigate('/records')
  }

  const handleCancel = () => {
    navigate(`/storage/${id}`);
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (fetchError) {
    return (
      <div className="max-w-2xl mx-auto text-center py-8">
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
    );
  }

  if (!storageItem?.item) {
    return (
      <div className="max-w-2xl mx-auto text-center py-8">
        <div className="text-gray-400 mb-4">
          <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414-2.414a1 1 0 01-.707.293h-2.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 009.586 13H7" />
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
    );
  }

  const item = storageItem.item;

  return (
    <div className="max-w-3xl mx-auto">
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
          <h1 className="text-2xl font-bold text-gray-900">记录使用</h1>
        </div>
        <p className="text-gray-600">记录 "{item['产品名']}" 的使用情况</p>
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

      {/* Storage Item Info */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">库存项目信息</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-gray-600 mb-1">产品名</div>
            <div className="font-semibold text-gray-900">{item['产品名']}</div>
          </div>
          
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-gray-600 mb-1">类型</div>
            <div className="font-semibold text-gray-900">{item['类型']}</div>
          </div>
          
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-gray-600 mb-1">原始数量</div>
            <div className="font-semibold text-gray-900">{item['数量及数量单位']}</div>
          </div>
          
          <div className="bg-blue-50 p-3 rounded">
            <div className="text-blue-600 mb-1">当前库存</div>
            <div className="font-semibold text-blue-700">{availableStock.toFixed(3)}{item['单位']}</div>
          </div>
          
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-gray-600 mb-1">存放地</div>
            <div className="font-semibold text-gray-900">{item['存放地']}</div>
          </div>
          
          {item['CAS号'] && (
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-gray-600 mb-1">CAS号</div>
              <div className="font-semibold text-gray-900 font-mono">{item['CAS号']}</div>
            </div>
          )}
        </div>
      </div>

      {/* Usage Form */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-6">使用记录表单</h3>
        
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 使用人 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                使用人 *
              </label>
              <input
                {...register('使用人', { required: '请输入使用人' })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="输入使用人姓名"
              />
              {errors['使用人'] && (
                <p className="text-red-500 text-sm mt-1">{errors['使用人'].message}</p>
              )}
            </div>

            {/* 使用日期 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                使用日期 *
              </label>
              <input
                type="date"
                {...register('使用日期', { required: '请选择使用日期' })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors['使用日期'] && (
                <p className="text-red-500 text-sm mt-1">{errors['使用日期'].message}</p>
              )}
            </div>
          </div>

          {/* 使用量 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              使用量 ({item['单位']}) *
            </label>
            <input
              type="number"
              step="0.001"
              min="0.001"
              max={availableStock}
              {...register('使用量_g', { 
                required: '请输入使用量',
                min: { value: 0.001, message: '使用量必须大于0' },
                max: { value: availableStock, message: '使用量不能超过库存量' }
              })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="输入使用量"
            />
            {errors['使用量_g'] && (
              <p className="text-red-500 text-sm mt-1">{errors['使用量_g'].message}</p>
            )}
            
            {/* Real-time remaining calculation */}
            {watchedUsage && (
              <div className="mt-2 p-3 bg-blue-50 rounded text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-blue-700">
                    使用后余量: <strong>{Math.max(0, remainingStock).toFixed(3)}{item['单位']}</strong>
                  </span>
                  {remainingStock < 0 ? (
                    <span className="text-red-600 font-medium">❌ 超出库存量</span>
                  ) : remainingStock < availableStock * 0.1 ? (
                    <span className="text-yellow-600 font-medium">⚠️ 库存将不足</span>
                  ) : (
                    <span className="text-green-600 font-medium">✅ 库存充足</span>
                  )}
                </div>
                
                {/* Progress bar */}
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        remainingStock < 0 ? 'bg-red-500' :
                        remainingStock < availableStock * 0.1 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{
                        width: `${Math.max(5, Math.min(100, (remainingStock / availableStock) * 100))}%`
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 备注 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              备注 (可选)
            </label>
            <textarea
              {...register('备注')}
              rows="3"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="输入使用备注，如实验名称、用途等"
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex space-x-4 pt-4">
            <button
              type="submit"
              disabled={recordUsageMutation.isLoading || remainingStock < 0}
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {recordUsageMutation.isLoading ? '记录中...' : '记录使用'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 bg-gray-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-700 transition-colors"
            >
              取消
            </button>
          </div>
        </form>
      </div>

      {/* Help Section */}
      <div className="mt-6 bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">💡 使用说明</h4>
        <div className="text-sm text-gray-700 space-y-1">
          <p>• 使用量会自动从当前库存中扣除</p>
          <p>• 记录后将更新库存余量，请确保输入准确</p>
          <p>• 建议在备注中记录实验名称或用途，便于后续追踪</p>
          <p>• 如发现输入错误，可在使用记录页面进行修改</p>
        </div>
      </div>

      <SuccessDialog
        isOpen={showSuccessDialog}
        onClose={handleSuccessDialogClose}
        title="使用记录创建成功！"
        message="库存使用记录已成功创建，库存量已自动更新。"
        recordData={createdRecord}
        showEditButton={true}
        showViewRecordsButton={true}
        onEdit={handleEditRecord}
        onViewRecords={handleViewRecords}
      />
    </div>
  );
};

export default UsageForm; 