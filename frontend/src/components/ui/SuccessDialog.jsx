import React from 'react'
import { useNavigate } from 'react-router-dom'

const SuccessDialog = ({ 
  isOpen, 
  onClose, 
  title = "Success!", 
  message = "Operation completed successfully",
  recordData = null,
  showEditButton = true,
  showViewRecordsButton = true,
  editUrl = null,
  viewRecordsUrl = "/records",
  onEdit = null,
  onViewRecords = null
}) => {
  const navigate = useNavigate()

  if (!isOpen) return null

  const handleEdit = () => {
    if (onEdit) {
      onEdit()
    } else if (editUrl) {
      navigate(editUrl)
    } else if (recordData?.id) {
      navigate(`/records/${recordData.id}/edit`)
    }
    onClose()
  }

  const handleViewRecords = () => {
    if (onViewRecords) {
      onViewRecords()
    } else {
      navigate(viewRecordsUrl)
    }
    onClose()
  }

  const handleClose = () => {
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full transform transition-all">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close dialog"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-700 mb-6">{message}</p>
          
          {/* Record Details (if available) */}
          {recordData && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Record Details</h4>
              <div className="space-y-1 text-sm text-gray-600">
                {recordData.产品名 && (
                  <div className="flex justify-between">
                    <span>Product:</span>
                    <span className="font-medium">{recordData.产品名}</span>
                  </div>
                )}
                {recordData.使用人 && (
                  <div className="flex justify-between">
                    <span>User:</span>
                    <span className="font-medium">{recordData.使用人}</span>
                  </div>
                )}
                {recordData.使用量 && (
                  <div className="flex justify-between">
                    <span>Amount:</span>
                    <span className="font-medium">{recordData.使用量}{recordData.单位 || ''}</span>
                  </div>
                )}
                {recordData.使用日期 && (
                  <div className="flex justify-between">
                    <span>Date:</span>
                    <span className="font-medium">{new Date(recordData.使用日期).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            {showEditButton && (
              <button
                onClick={handleEdit}
                className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Record
              </button>
            )}
            
            {showViewRecordsButton && (
              <button
                onClick={handleViewRecords}
                className="flex-1 flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                View Records
              </button>
            )}
          </div>

          {/* Close Button */}
          <div className="mt-4 text-center">
            <button
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-700 text-sm transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SuccessDialog 