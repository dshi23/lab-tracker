import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useRecordsApi } from '../hooks/useRecordsApi'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { format } from 'date-fns'

const RecordDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [error, setError] = useState(null)

  const { getRecord, deleteRecord } = useRecordsApi();

  const { data, isLoading, error: fetchError } = useQuery(
    ['record', id],
    () => getRecord(id),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  )

  // Delete record mutation
  const deleteRecordMutation = useMutation(
    () => deleteRecord(id),
    {
      onSuccess: (response) => {
        // Invalidate and refetch relevant queries
        queryClient.invalidateQueries(['records'])
        queryClient.invalidateQueries(['recent-records'])
        queryClient.invalidateQueries(['dashboard'])
        
        // Defensive: check for response
        if (response !== undefined) {
          navigate('/records')
        } else {
          setError('删除记录成功，但未返回有效的响应信息')
        }
      },
      onError: (error) => {
        setError(error.response?.data?.error || 'Failed to delete record')
      }
    }
  )

  const handleDelete = async () => {
    setError(null)
    await deleteRecordMutation.mutateAsync()
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (fetchError) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Error loading record</p>
        <Link to="/records" className="text-primary-600 hover:text-primary-700 mt-2 inline-block">
          Back to Records
        </Link>
      </div>
    )
  }

  const recordData = data?.record
  const storageItem = data?.storage_item
  const computedUnit = data?.computed_info?.inventory_impact?.unit
  const displayUnit = computedUnit || storageItem?.['单位'] || 'g'

  if (!recordData) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Record not found</p>
        <Link to="/records" className="text-primary-600 hover:text-primary-700 mt-2 inline-block">
          Back to Records
        </Link>
      </div>
    )
  }

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'yyyy/MM/dd')
    } catch {
      return dateString
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link to="/records" className="text-primary-600 hover:text-primary-700 mb-4 inline-block">
          ← Back to Records
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Record Details</h1>
      </div>

      <div className="card">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">基本信息</h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">产品名</dt>
                <dd className="text-gray-900">{recordData['产品名']}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">使用人</dt>
                <dd className="text-gray-900">{recordData['使用人']}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">使用日期</dt>
                <dd className="text-gray-900">{formatDate(recordData['使用日期'])}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">类型</dt>
                <dd className="text-gray-900">{recordData['类型']}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">使用量</dt>
                <dd className="text-gray-900">{recordData['使用量']}{displayUnit}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">余量</dt>
                <dd className="text-gray-900">{recordData['余量']}{displayUnit}</dd>
              </div>
            </dl>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">更多信息</h2>
            <dl className="space-y-3">
              {recordData['存放地'] && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">存放地</dt>
                  <dd className="text-gray-900">{recordData['存放地']}</dd>
                </div>
              )}
              {recordData['CAS号'] && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">CAS号</dt>
                  <dd className="text-gray-900 font-mono">{recordData['CAS号']}</dd>
                </div>
              )}
              {recordData['备注'] && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">备注</dt>
                  <dd className="text-gray-900">{recordData['备注']}</dd>
                </div>
              )}
              {storageItem && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">关联库存</dt>
                  <dd className="text-gray-900">
                    {storageItem['产品名']} • {storageItem['当前库存量']}{storageItem['单位']}（当前）
                    <div className="text-xs text-gray-500 mt-1">单位显示使用关联库存单位：{displayUnit}</div>
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-sm font-medium text-gray-500">创建时间</dt>
                <dd className="text-gray-900">{formatDate(recordData['创建时间'])}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">更新时间</dt>
                <dd className="text-gray-900">{formatDate(recordData['更新时间'])}</dd>
              </div>
            </dl>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        <div className="mt-6 pt-6 border-t border-gray-200 flex flex-col sm:flex-row gap-3">
          <Link to={`/records/${id}/edit`} className="btn-primary">
            Edit Record
          </Link>
          
          {showDeleteConfirm ? (
            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                onClick={handleDelete}
                disabled={deleteRecordMutation.isLoading}
                className="btn-danger"
              >
                {deleteRecordMutation.isLoading ? 'Deleting...' : 'Confirm Delete'}
              </button>
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setShowDeleteConfirm(true)}
              className="btn-danger"
            >
              Delete Record
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default RecordDetail 