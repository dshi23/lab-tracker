import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from 'react-query'
import { format } from 'date-fns'
import { useRecordsApi } from '../../hooks/useRecordsApi'

const RecordCard = ({ record, compact = false, enhanced = false }) => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'yyyy年MM月dd日')
    } catch {
      return dateString
    }
  }

  const { deleteRecord } = useRecordsApi();
  const formatUsage = (rec) => {
    const amount = rec['使用量']
    const unit = rec['单位'] || rec.unit
    if (typeof amount === 'number') {
      const num = Number.isFinite(amount) ? amount : null
      if (num == null) return rec.volume_used || '使用量未知'
      return unit ? `${num}${unit}` : `${num}`
    }
    return rec.volume_used || '使用量未知'
  }

  // Delete record mutation
  const deleteRecordMutation = useMutation(
    () => deleteRecord(record.id),
    {
      onSuccess: () => {
        // Invalidate and refetch relevant queries
        queryClient.invalidateQueries(['records'])
        queryClient.invalidateQueries(['recent-records'])
        queryClient.invalidateQueries(['dashboard'])
      },
      onError: (error) => {
        console.error('Failed to delete record:', error)
        alert('删除记录失败，请重试。')
      }
    }
  )

  const handleDelete = async () => {
    if (confirm(`确定要删除记录"${record.产品名 || record.drug_name}"吗？`)) {
      await deleteRecordMutation.mutateAsync()
    }
  }

  if (compact) {
    return (
      <Link 
        to={`/records/${record.id}`}
        className={`block transition-all duration-200 focus-ring ${
          enhanced 
            ? 'bg-white rounded-xl shadow-sm border border-gray-100/50 p-4 hover:shadow-lg hover:ring-4 hover:ring-primary-500/10' 
            : 'card hover:shadow-md'
        }`}
        role="article"
        aria-label={`Record for ${record.产品名 || record.drug_name}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h3 className={`font-medium text-gray-900 truncate ${enhanced ? 'text-base' : ''}`}>
              {record.产品名 || record.drug_name}
            </h3>
            <p className={`text-sm text-gray-500 ${enhanced ? 'mt-1' : ''}`}>
              {record.使用人 || record.personnel} • {formatUsage(record)}
            </p>
          </div>
          <div className="text-right ml-4 flex-shrink-0">
            <p className="text-sm text-gray-500">
              {formatDate(record.使用日期 || record.config_date)}
            </p>
            {enhanced && record.storage_id && (
              <div className="mt-1">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <span className="sr-only">Storage</span>
                  库存
                </span>
              </div>
            )}
          </div>
        </div>
      </Link>
    )
  }

  if (enhanced) {
    return (
      <article className="relative bg-white rounded-2xl shadow-sm border border-gray-100/50 p-6 overflow-hidden group hover:shadow-lg transition-all duration-300 hover:ring-4 hover:ring-primary-500/10">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-16 h-16 rounded-full opacity-5 bg-gradient-to-br from-primary-500 to-primary-700 blur-xl"></div>
        
        <div className="relative">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <Link 
              to={`/records/${record.id}`}
              className="block hover:text-primary-600 transition-colors focus-ring flex-1 min-w-0"
              aria-label={`View details for ${record.产品名 || record.drug_name}`}
            >
              <h3 className="font-bold text-gray-900 text-lg leading-tight mb-1">
                {record.产品名 || record.drug_name}
              </h3>
              <p className="text-sm font-medium text-gray-600">
                {record.类型 || record.drug_type}
              </p>
            </Link>
            
            {record.storage_id && (
              <div className="ml-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 ring-1 ring-green-600/20">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <span className="sr-only">Connected to storage record</span>
                  库存记录
                </span>
              </div>
            )}
          </div>
          
          {/* Details grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm mb-4">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-blue-400 rounded-full flex-shrink-0"></span>
              <span className="text-gray-500">使用人:</span>
              <span className="text-gray-900 font-medium truncate">{record.使用人 || record.personnel}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-green-400 rounded-full flex-shrink-0"></span>
              <span className="text-gray-500">使用日期:</span>
              <span className="text-gray-900 font-medium">
                {formatDate(record.使用日期 || record.config_date)}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-purple-400 rounded-full flex-shrink-0"></span>
              <span className="text-gray-500">使用量:</span>
              <span className="text-gray-900 font-medium">
                {formatUsage(record)}
              </span>
            </div>
            {record.存放地 && (
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-orange-400 rounded-full flex-shrink-0"></span>
                <span className="text-gray-500">存放地:</span>
                <span className="text-gray-900 font-medium truncate">{record.存放地}</span>
              </div>
            )}
            {record.CAS号 && (
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-red-400 rounded-full flex-shrink-0"></span>
                <span className="text-gray-500">CAS号:</span>
                <span className="text-gray-900 font-mono font-medium">{record.CAS号}</span>
              </div>
            )}
          </div>
          
          {(record.备注 || record.notes) && (
            <div className="mb-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <span className="text-gray-500 text-sm font-medium block mb-1">备注:</span>
                <p className="text-gray-900 text-sm leading-relaxed">{record.备注 || record.notes}</p>
              </div>
            </div>
          )}
          
          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <Link
              to={`/records/${record.id}`}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors focus-ring"
              aria-label={`View record details for ${record.产品名 || record.drug_name}`}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              查看
            </Link>
            <Link
              to={`/records/${record.id}/edit`}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors focus-ring"
              aria-label={`Edit record for ${record.产品名 || record.drug_name}`}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              编辑
            </Link>
            <button
              onClick={handleDelete}
              disabled={deleteRecordMutation.isLoading}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors focus-ring disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={`Delete record for ${record.产品名 || record.drug_name}`}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              {deleteRecordMutation.isLoading ? '删除中...' : '删除'}
            </button>
          </div>
          
          {/* Hover indicator */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 to-primary-700 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
        </div>
      </article>
    )
  }

  return (
    <div className="card" role="article">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <Link 
            to={`/records/${record.id}`}
            className="block hover:text-primary-600 transition-colors focus-ring"
            aria-label={`View details for ${record.产品名 || record.drug_name}`}
          >
            <h3 className="font-semibold text-gray-900 mb-2">
              {record.产品名 || record.drug_name}
            </h3>
          </Link>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-500">使用人:</span>
              <span className="ml-2 text-gray-900">{record.使用人 || record.personnel}</span>
            </div>
            <div>
              <span className="text-gray-500">使用日期:</span>
              <span className="ml-2 text-gray-900">
                {formatDate(record.使用日期 || record.config_date)}
              </span>
            </div>
            <div>
              <span className="text-gray-500">产品类型:</span>
              <span className="ml-2 text-gray-900">{record.类型 || record.drug_type}</span>
            </div>
            <div>
              <span className="text-gray-500">使用量:</span>
              <span className="ml-2 text-gray-900">
                {formatUsage(record)}
              </span>
            </div>
            {record.存放地 && (
              <div>
                <span className="text-gray-500">存放地:</span>
                <span className="ml-2 text-gray-900">{record.存放地}</span>
              </div>
            )}
            {record.CAS号 && (
              <div>
                <span className="text-gray-500">CAS号:</span>
                <span className="ml-2 text-gray-900 font-mono">{record.CAS号}</span>
              </div>
            )}
          </div>
          
          {(record.备注 || record.notes) && (
            <div className="mt-3">
              <span className="text-gray-500 text-sm">备注:</span>
              <p className="text-gray-900 text-sm mt-1">{record.备注 || record.notes}</p>
            </div>
          )}
        </div>
        
        <div className="ml-4 flex flex-col items-end">
          {/* Storage integration indicator */}
          {record.storage_id && (
            <div className="mb-2">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <span className="sr-only">Connected to storage record</span>
                库存记录
              </span>
            </div>
          )}
          
          <div className="flex space-x-2">
            <Link
              to={`/records/${record.id}`}
              className="text-primary-600 hover:text-primary-700 text-sm font-medium focus-ring"
              aria-label={`View record details for ${record.产品名 || record.drug_name}`}
            >
              查看
            </Link>
            <Link
              to={`/records/${record.id}/edit`}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium focus-ring"
              aria-label={`Edit record for ${record.产品名 || record.drug_name}`}
            >
              编辑
            </Link>
            <button
              onClick={handleDelete}
              disabled={deleteRecordMutation.isLoading}
              className="text-red-600 hover:text-red-700 text-sm font-medium disabled:opacity-50 focus-ring"
              aria-label={`Delete record for ${record.产品名 || record.drug_name}`}
            >
              {deleteRecordMutation.isLoading ? '删除中...' : '删除'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RecordCard 