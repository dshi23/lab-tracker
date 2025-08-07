import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient, useQuery } from 'react-query'
import { useRecordsApi } from '../hooks/useRecordsApi'
import { useStorageApi } from '../hooks/useStorageApi'
import UsageForm from '../components/forms/UsageForm'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import SuccessDialog from '../components/ui/SuccessDialog'
import StorageSearchSelector from '../components/storage/StorageSearchSelector'

const AddRecord = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [error, setError] = useState(null)
  const [selectedStorageItem, setSelectedStorageItem] = useState(null)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [createdRecord, setCreatedRecord] = useState(null)

  const { getStorageItems } = useStorageApi()

  // Fetch storage items for selection
  const { data: storageData, isLoading: storageLoading } = useQuery(
    ['storage-for-records'],
    () => getStorageItems({ per_page: 100 }),
    {
      staleTime: 5 * 60 * 1000
    }
  )

  const { createRecord } = useRecordsApi();

  const createRecordMutation = useMutation(
    (data) => createRecord(data),
    {
      onSuccess: (response) => {
        // Defensive: log the response for debugging
        console.log('Create record response:', response);

        // Invalidate and refetch relevant queries
        queryClient.invalidateQueries(['records'])
        queryClient.invalidateQueries(['recent-records'])
        queryClient.invalidateQueries(['dashboard'])
        queryClient.invalidateQueries(['storage'])
        
        // Check if response indicates deprecated endpoint usage
        if (response.deprecated) {
          console.warn('Deprecated endpoint used:', response.deprecation_warning?.message)
        }
        
        // Store the created record data for the success dialog
        if (response.record) {
          setCreatedRecord(response.record)
          setShowSuccessDialog(true)
        } else if (response.storage_item && response.storage_item.id) {
          // Fallback navigation if no record data
          navigate(`/storage/${response.storage_item.id}`)
        } else {
          setError('创建记录成功，但未返回有效的库存或记录信息')
        }
      },
      onError: (error) => {
        // Handle deprecated endpoint errors gracefully
        if (error.response?.status === 410) {
          const errorData = error.response.data
          if (errorData.deprecated && errorData.recommended_endpoint) {
            setError(`此API端点已弃用。请使用新的端点: ${errorData.recommended_endpoint}`)
          } else {
            setError(errorData?.error || 'Failed to create record')
          }
        } else {
          setError(error.response?.data?.error || 'Failed to create record')
        }
      }
    }
  )

  const handleSubmit = async (data) => {
    setError(null)
    
    if (!selectedStorageItem) {
      setError('请先选择库存项目')
      return
    }
    
    // Convert usage amount to grams and prepare data
    let usageAmountInGrams = parseFloat(data.usage_amount)
    
    // Convert to grams based on unit
    switch (data.usage_unit) {
      case 'kg':
        usageAmountInGrams *= 1000
        break
      case 'mg':
        usageAmountInGrams /= 1000
        break
      case 'μg':
        usageAmountInGrams /= 1000000
        break
      // 'g' stays as is
    }
    
    const storageData = {
      storage_item_id: selectedStorageItem.id,
      // Chinese fields (preferred for storage workflow)
      使用人: data.personnel,
      使用日期: data.config_date,
      使用量_g: usageAmountInGrams,
      备注: data.notes || `使用库存: ${selectedStorageItem['产品名']}`,
      // Legacy fields for backward compatibility
      personnel: data.personnel,
      config_date: data.config_date,
      volume_used: `${usageAmountInGrams}g`, // Convert to string format
      notes: data.notes || `使用库存: ${selectedStorageItem['产品名']}`
    }
    await createRecordMutation.mutateAsync(storageData)
  }

  const handleStorageItemSelect = (item) => {
    setSelectedStorageItem(item)
  }

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

  const getInitialFormData = () => {
    return {
      personnel: '',
      config_date: new Date().toISOString().split('T')[0],
      usage_amount: '',
      usage_unit: 'g',
      notes: selectedStorageItem ? `使用库存: ${selectedStorageItem['产品名']} (${selectedStorageItem['存放地']})` : ''
    }
  }

  if (storageLoading) {
    return <LoadingSpinner />
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">记录库存使用</h1>
        <p className="text-gray-600">选择库存项目并记录使用量，系统将自动更新库存</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Storage Item Selection */}
        {!selectedStorageItem && (
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">选择库存项目</h3>

            {/* Smart Search Selector */}
            <div className="mb-6">
              <StorageSearchSelector onStorageSelect={handleStorageItemSelect} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {storageData?.items?.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleStorageItemSelect(item)}
                  className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{item.产品名}</h4>
                    <span className="text-sm text-gray-500">{item.类型}</span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div className="flex justify-between">
                      <span>库存量:</span>
                      <span className="font-medium">{item.当前库存量}{item.单位}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>存放地:</span>
                      <span className="font-medium">{item.存放地}</span>
                    </div>
                    {item.CAS号 && (
                      <div className="flex justify-between">
                        <span>CAS号:</span>
                        <span className="font-medium">{item.CAS号}</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <button className="w-full px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors">
                      选择此项目
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            {storageData?.items?.length === 0 && (
              <div className="text-center py-8">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <p className="text-gray-500">暂无库存项目</p>
                <button
                  onClick={() => navigate('/storage/add')}
                  className="mt-2 text-blue-600 hover:text-blue-700 text-sm"
                >
                  添加库存项目 →
                </button>
              </div>
            )}
          </div>
        )}

        {/* Selected Storage Item Info */}
        {selectedStorageItem && (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">已选择库存项目</h3>
              <button
                onClick={() => setSelectedStorageItem(null)}
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                ← 重新选择
              </button>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">{selectedStorageItem.产品名}</h4>
                  <p className="text-sm text-gray-600">{selectedStorageItem.类型} • {selectedStorageItem.存放地}</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-blue-600">{selectedStorageItem.当前库存量}{selectedStorageItem.单位}</div>
                  <div className="text-xs text-gray-500">当前库存</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Usage Form */}
        {selectedStorageItem && (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">记录库存使用</h3>
              <button
                onClick={() => setSelectedStorageItem(null)}
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                ← 重新选择
              </button>
            </div>
            
            {createRecordMutation.isLoading ? (
              <LoadingSpinner text="保存记录中..." />
            ) : (
              <UsageForm 
                onSubmit={handleSubmit} 
                initialData={getInitialFormData()}
                selectedStorageItem={selectedStorageItem}
              />
            )}
          </div>
        )}

        {/* Information Section */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            📋 库存使用流程
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-700">
            <div>
              <h4 className="font-medium mb-2">自动处理</h4>
              <ul className="space-y-1">
                <li>• 产品信息自动关联</li>
                <li>• 库存量精确扣除</li>
                <li>• 使用重量自动记录</li>
                <li>• 中文字段完整存储</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">需要填写</h4>
              <ul className="space-y-1">
                <li>• 使用人员姓名</li>
                <li>• 精确使用重量</li>
                <li>• 使用日期</li>
                <li>• 备注说明（可选）</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Success Dialog */}
      <SuccessDialog
        isOpen={showSuccessDialog}
        onClose={handleSuccessDialogClose}
        title="记录创建成功！"
        message="库存使用记录已成功创建，库存量已自动更新。"
        recordData={createdRecord}
        showEditButton={true}
        showViewRecordsButton={true}
        onEdit={handleEditRecord}
        onViewRecords={handleViewRecords}
      />
    </div>
  )
}

export default AddRecord 