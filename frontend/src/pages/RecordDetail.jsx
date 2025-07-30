import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { recordsAPI } from '../services/api'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { format } from 'date-fns'

const RecordDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [error, setError] = useState(null)

  const { data: record, isLoading, error: fetchError } = useQuery(
    ['record', id],
    () => recordsAPI.getRecord(id),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  )

  // Delete record mutation
  const deleteRecordMutation = useMutation(
    () => recordsAPI.deleteRecord(id),
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

  if (!record) {
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
      return format(new Date(dateString), 'MMMM dd, yyyy')
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
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Antibody Name</dt>
                <dd className="text-gray-900">{record.antibody_name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Personnel</dt>
                <dd className="text-gray-900">{record.personnel}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Date</dt>
                <dd className="text-gray-900">{formatDate(record.config_date)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Dilution Ratio</dt>
                <dd className="text-gray-900">{record.dilution_ratio}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Volume Used</dt>
                <dd className="text-gray-900">{record.volume_used}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Dilution Type</dt>
                <dd className="text-gray-900">{record.dilution_type}</dd>
              </div>
            </dl>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h2>
            <dl className="space-y-3">
              {record.experiment_name && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Experiment Name</dt>
                  <dd className="text-gray-900">{record.experiment_name}</dd>
                </div>
              )}
              {record.batch_number && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Batch Number</dt>
                  <dd className="text-gray-900">{record.batch_number}</dd>
                </div>
              )}
              {record.notes && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Notes</dt>
                  <dd className="text-gray-900">{record.notes}</dd>
                </div>
              )}
              <div>
                <dt className="text-sm font-medium text-gray-500">Created</dt>
                <dd className="text-gray-900">{formatDate(record.created_at)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                <dd className="text-gray-900">{formatDate(record.updated_at)}</dd>
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