import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useRecordsApi } from '../hooks/useRecordsApi'
import UsageForm from '../components/forms/UsageForm'
import LoadingSpinner from '../components/ui/LoadingSpinner'

const EditRecord = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [error, setError] = useState(null)

  // Fetch the record to edit
  const { getRecord, updateRecord } = useRecordsApi();

  const { data: record, isLoading, error: fetchError } = useQuery(
    ['record', id],
    () => getRecord(id),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  )

  // Update record mutation
  const updateRecordMutation = useMutation(
    (data) => updateRecord(id, data),
    {
      onSuccess: (response) => {
        // Invalidate and refetch relevant queries
        queryClient.invalidateQueries(['records'])
        queryClient.invalidateQueries(['recent-records'])
        queryClient.invalidateQueries(['dashboard'])
        queryClient.invalidateQueries(['record', id])
        
        // Defensive: check for response
        if (response) {
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

  const handleSubmit = async (data) => {
    setError(null)
    await updateRecordMutation.mutateAsync(data)
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (fetchError) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Error loading record</p>
      </div>
    )
  }

  if (!record) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Record not found</p>
      </div>
    )
  }

  // Format the date for the form input
  const formatDateForInput = (dateString) => {
    try {
      const date = new Date(dateString)
      return date.toISOString().split('T')[0]
    } catch {
      return dateString
    }
  }

  // Prepare initial data for the form
  const initialData = {
    antibody_name: record.antibody_name,
    dilution_ratio: record.dilution_ratio,
    dilution_type: record.dilution_type,
    volume_used: record.volume_used,
    config_date: formatDateForInput(record.config_date),
    personnel: record.personnel,
    experiment_name: record.experiment_name || '',
    batch_number: record.batch_number || '',
    notes: record.notes || ''
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit Record</h1>
        <p className="text-gray-600">Update the chemical usage record</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {updateRecordMutation.isLoading ? (
        <LoadingSpinner text="Updating record..." />
      ) : (
        <div className="card">
          <UsageForm onSubmit={handleSubmit} initialData={initialData} />
        </div>
      )}
    </div>
  )
}

export default EditRecord 