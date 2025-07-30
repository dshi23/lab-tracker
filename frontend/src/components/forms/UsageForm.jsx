import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useQuery } from 'react-query'
import { analyticsAPI } from '../../services/api'

const UsageForm = ({ 
  onSubmit, 
  initialData = null, 
  selectedStorageItem = null
}) => {
  const { register, handleSubmit, formState: { errors }, watch, setValue, reset } = useForm({
    defaultValues: initialData
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Update form when initialData changes
  useEffect(() => {
    if (initialData) {
      reset(initialData)
    }
  }, [initialData, reset])

  // Fetch autocomplete data for personnel
  const { data: autocompleteData } = useQuery(
    ['autocomplete'],
    () => analyticsAPI.getAutocompleteData(),
    {
      staleTime: 10 * 60 * 1000, // 10 minutes
    }
  )

  const onFormSubmit = async (data) => {
    setIsSubmitting(true)
    try {
      await onSubmit(data)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Storage Item Info */}
      {selectedStorageItem && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-3">库存项目信息</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
            <div className="min-w-0">
              <span className="font-medium text-blue-700">产品名:</span>
              <p className="text-blue-900 break-words">{selectedStorageItem['产品名']}</p>
            </div>
            <div className="min-w-0">
              <span className="font-medium text-blue-700">类型:</span>
              <p className="text-blue-900 break-words">{selectedStorageItem['类型']}</p>
            </div>
            <div className="min-w-0">
              <span className="font-medium text-blue-700">当前库存:</span>
              <p className="text-blue-900">{selectedStorageItem['当前库存量'].toFixed(3)}g</p>
            </div>
            <div className="min-w-0">
              <span className="font-medium text-blue-700">存放地:</span>
              <p className="text-blue-900 break-words">{selectedStorageItem['存放地']}</p>
            </div>
            {selectedStorageItem['CAS号'] && (
              <div className="min-w-0">
                <span className="font-medium text-blue-700">CAS号:</span>
                <p className="text-blue-900 font-mono break-all">{selectedStorageItem['CAS号']}</p>
              </div>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        {/* Usage Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            使用量 (Usage Amount) *
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <input
                {...register('usage_amount', { 
                  required: 'Usage amount is required',
                  min: { value: 0.001, message: 'Amount must be greater than 0' }
                })}
                type="number"
                step="0.001"
                min="0.001"
                className="input-field"
                placeholder="0.5"
              />
              {errors.usage_amount && (
                <p className="text-red-500 text-sm mt-1">{errors.usage_amount.message}</p>
              )}
            </div>
            <div>
              <select
                {...register('usage_unit', { required: 'Unit is required' })}
                className="input-field"
              >
                <option value="g">克 (g)</option>
                <option value="mg">毫克 (mg)</option>
                <option value="μg">微克 (μg)</option>
                <option value="kg">千克 (kg)</option>
              </select>
              {errors.usage_unit && (
                <p className="text-red-500 text-sm mt-1">{errors.usage_unit.message}</p>
              )}
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            💡 当前库存: {selectedStorageItem ? selectedStorageItem['当前库存量'].toFixed(3) : '0'}g
          </p>
        </div>

        {/* Date and Personnel */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              使用日期 (Usage Date) *
            </label>
            <input
              type="date"
              {...register('config_date', { required: 'Date is required' })}
              className="input-field"
            />
            {errors.config_date && (
              <p className="text-red-500 text-sm mt-1">{errors.config_date.message}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              使用人员 (User) *
            </label>
            <input
              {...register('personnel', { 
                required: 'Personnel is required',
                minLength: { value: 2, message: 'Name must be at least 2 characters' }
              })}
              className="input-field"
              placeholder="Enter your name"
              list="personnel-suggestions"
            />
            <datalist id="personnel-suggestions">
              {autocompleteData?.personnel?.map((person, index) => (
                <option key={index} value={person} />
              ))}
            </datalist>
            {errors.personnel && (
              <p className="text-red-500 text-sm mt-1">{errors.personnel.message}</p>
            )}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            备注 (Notes)
          </label>
          <textarea
            {...register('notes')}
            rows="3"
            className="input-field"
            placeholder="记录使用相关的备注信息..."
          />
        </div>

        {/* Storage Integration Info */}
        {selectedStorageItem && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-green-800">
                <p className="font-medium">库存集成模式</p>
                <p className="text-sm mt-1">
                  将自动从库存项目 "{selectedStorageItem['产品名']}" 中扣除使用量，并生成完整的使用追踪记录。
                  当前库存: {selectedStorageItem['当前库存量'].toFixed(3)}g
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? '提交中...' : '记录使用并更新库存'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default UsageForm 