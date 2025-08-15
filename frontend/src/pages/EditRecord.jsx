import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useForm } from 'react-hook-form'
import { useRecordsApi } from '../hooks/useRecordsApi'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { safeParseFloat, safeSubtract, safeAdd } from '../utils/numberUtils'

const EditRecord = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [error, setError] = useState(null)

  // Fetch the record to edit
  const { getRecord, updateRecord } = useRecordsApi();

  const { data, isLoading, error: fetchError } = useQuery(
    ['record', id],
    () => getRecord(id),
    { staleTime: 5 * 60 * 1000 }
  )

  // Helpers
  const formatDateForInput = (dateString) => {
    try {
      const d = new Date(dateString)
      return d.toISOString().split('T')[0]
    } catch {
      return dateString
    }
  }

  const recordData = data?.record
  const storageItem = data?.storage_item

  // React Hook Form
  const { register, handleSubmit, watch, formState: { errors }, reset } = useForm({
    defaultValues: {
      '使用人': '',
      '使用日期': '',
      '使用量': 0,
      '备注': ''
    }
  })

  // Reset form when data loads
  useEffect(() => {
    if (recordData) {
      reset({
        '使用人': recordData['使用人'] || '',
        '使用日期': formatDateForInput(recordData['使用日期']),
        '使用量': recordData['使用量'] || 0,
        '备注': recordData['备注'] || ''
      })
    }
  }, [recordData, reset])

  // Computed values for UI and validation
  const unit = storageItem?.['单位'] || 'g'
  const currentStock = safeParseFloat(storageItem?.['当前库存量'] || 0)
  const existingUsage = safeParseFloat(recordData?.['使用量'] || 0)
  const maxUsage = safeAdd(currentStock, existingUsage)
  const watchedUsage = watch('使用量', existingUsage)
  const numericWatched = safeParseFloat(watchedUsage)
  const remainingStock = safeSubtract(maxUsage, numericWatched)

  // Update record mutation
  const { mutateAsync, isLoading: isUpdating } = useMutation(
    (payload) => updateRecord(id, payload),
    {
      onSuccess: (response) => {
        queryClient.invalidateQueries(['records'])
        queryClient.invalidateQueries(['recent-records'])
        queryClient.invalidateQueries(['dashboard'])
        queryClient.invalidateQueries(['record', id])
        if (response !== undefined) {
          navigate(`/records/${id}`)
        } else {
          setError('记录更新成功，但未返回有效的响应信息')
        }
      },
      onError: (error) => {
        setError(error.response?.data?.error || 'Failed to update record')
      }
    }
  )

  const onSubmit = async (form) => {
    setError(null)
    const usageAmount = safeParseFloat(form['使用量'])
    if (usageAmount <= 0) {
      setError('使用量必须大于0')
      return
    }
    if (usageAmount > maxUsage) {
      setError('使用量不能超过可用上限（当前库存 + 原记录使用量）')
      return
    }

    const payload = {
      '使用人': form['使用人'],
      '使用日期': new Date(form['使用日期']),
      '使用量': usageAmount,
      '单位': unit,
      '备注': form['备注'] || ''
    }

    await mutateAsync(payload)
  }

  if (isLoading) return <LoadingSpinner />

  if (fetchError || !recordData) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">无法加载使用记录</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => navigate(`/records/${id}`)}
          className="text-primary-600 hover:text-primary-700 mb-2"
        >
          ← 返回记录详情
        </button>
        <h1 className="text-2xl font-bold text-gray-900">编辑使用记录</h1>
        <p className="text-gray-600">更新 "{recordData['产品名']}" 的使用信息</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Storage Item Info */}
      {storageItem && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">关联库存信息</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-gray-600 mb-1">产品名</div>
              <div className="font-semibold text-gray-900">{storageItem['产品名']}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-gray-600 mb-1">类型</div>
              <div className="font-semibold text-gray-900">{storageItem['类型']}</div>
            </div>
            <div className="bg-blue-50 p-3 rounded">
              <div className="text-blue-600 mb-1">当前库存</div>
              <div className="font-semibold text-blue-700">{currentStock.toFixed(3)}{unit}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-gray-600 mb-1">存放地</div>
              <div className="font-semibold text-gray-900">{storageItem['存放地']}</div>
            </div>
            {storageItem['CAS号'] && (
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-gray-600 mb-1">CAS号</div>
                <div className="font-semibold text-gray-900 font-mono">{storageItem['CAS号']}</div>
              </div>
            )}
          </div>
          <div className="mt-3 text-xs text-gray-500">
            可编辑的使用量上限 = 当前库存 {currentStock.toFixed(3)}{unit} + 原记录使用量 {existingUsage.toFixed(3)}{unit} = {(maxUsage).toFixed(3)}{unit}
          </div>
        </div>
      )}

      {/* Edit Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-6">使用记录表单</h3>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 使用人 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">使用人 *</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">使用日期 *</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-2">使用量 ({unit}) *</label>
            <input
              type="number"
              inputMode="decimal"
              step="0.001"
              min="0.001"
              max={maxUsage}
              {...register('使用量', {
                required: '请输入使用量',
                min: { value: 0.001, message: '使用量必须大于0' },
                max: { value: maxUsage, message: '使用量不能超过可用上限' }
              })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="输入使用量"
            />
            {errors['使用量'] && (
              <p className="text-red-500 text-sm mt-1">{errors['使用量'].message}</p>
            )}

            {/* Real-time remaining calculation */}
            <div className="mt-2 p-3 bg-blue-50 rounded text-sm">
              <div className="flex items-center justify-between">
                <span className="text-blue-700">
                  更新后库存余量: <strong>{Math.max(0, remainingStock).toFixed(3)}{unit}</strong>
                </span>
                {remainingStock < 0 ? (
                  <span className="text-red-600 font-medium">❌ 超出可用上限</span>
                ) : remainingStock < maxUsage * 0.1 ? (
                  <span className="text-yellow-600 font-medium">⚠️ 余量将不足</span>
                ) : (
                  <span className="text-green-600 font-medium">✅ 库存充足</span>
                )}
              </div>
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      remainingStock < 0 ? 'bg-red-500' :
                      remainingStock < maxUsage * 0.1 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.max(5, Math.min(100, (remainingStock / maxUsage) * 100))}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* 备注 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">备注 (可选)</label>
            <textarea
              {...register('备注')}
              rows="3"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="输入备注，如实验名称、用途等"
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={isUpdating || remainingStock < 0}
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isUpdating ? '更新中...' : '保存修改'}
            </button>
            <button
              type="button"
              onClick={() => navigate(`/records/${id}`)}
              className="flex-1 bg-gray-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-700 transition-colors"
            >
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditRecord 