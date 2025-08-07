import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from 'react-query'
import { format } from 'date-fns'
import { useRecordsApi } from '../../hooks/useRecordsApi'

const RecordCard = ({ record, compact = false }) => {
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
        className="block card hover:shadow-md transition-shadow"
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 truncate">
              {record.产品名 || record.drug_name}
            </h3>
            <p className="text-sm text-gray-500">
              {record.使用人 || record.personnel} • {record.使用量_g ? `${record.使用量_g}g` : '使用量未知'}
            </p>
          </div>
          <div className="text-right ml-4">
            <p className="text-sm text-gray-500">
              {formatDate(record.使用日期 || record.config_date)}
            </p>
          </div>
        </div>
      </Link>
    )
  }

  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <Link 
            to={`/records/${record.id}`}
            className="block hover:text-primary-600 transition-colors"
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
                {record.使用量_g ? `${record.使用量_g.toFixed(3)}g` : (record.volume_used || '未知')}
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
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                库存记录
              </span>
            </div>
          )}
          
          <div className="flex space-x-2">
            <Link
              to={`/records/${record.id}`}
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              查看
            </Link>
            <Link
              to={`/records/${record.id}/edit`}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              编辑
            </Link>
            <button
              onClick={handleDelete}
              disabled={deleteRecordMutation.isLoading}
              className="text-red-600 hover:text-red-700 text-sm font-medium disabled:opacity-50"
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