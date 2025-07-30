import { useState, useRef } from 'react'
import { useMutation, useQueryClient } from 'react-query'
import { importExportAPI } from '../services/api'
import LoadingSpinner from '../components/ui/LoadingSpinner'

// Progress Bar Component
const ProgressBar = ({ progress, message }) => {
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-blue-600">{message}</span>
        <span className="text-sm text-blue-600">{progress}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  )
}

// Preview Modal Component
const PreviewModal = ({ isOpen, onClose, previewData, onConfirm }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Import Preview</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              ×
            </button>
          </div>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">
              Found {previewData.validRecords.length} valid records to import
            </p>
            {previewData.errors.length > 0 && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm font-medium text-yellow-800 mb-2">
                  {previewData.errors.length} records have validation errors:
                </p>
                <ul className="text-sm text-yellow-700 space-y-1">
                  {previewData.errors.slice(0, 5).map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                  {previewData.errors.length > 5 && (
                    <li>• ... and {previewData.errors.length - 5} more errors</li>
                  )}
                </ul>
              </div>
            )}
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 font-medium text-gray-900">Antibody Name</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-900">Dilution</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-900">Volume</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-900">Date</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-900">Personnel</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {previewData.validRecords.slice(0, 10).map((record, index) => (
                  <tr key={index}>
                    <td className="py-2 px-3 text-gray-900">{record.antibody_name}</td>
                    <td className="py-2 px-3 text-gray-600">{record.dilution_ratio}</td>
                    <td className="py-2 px-3 text-gray-600">{record.volume_used}</td>
                    <td className="py-2 px-3 text-gray-600">{record.config_date}</td>
                    <td className="py-2 px-3 text-gray-600">{record.personnel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {previewData.validRecords.length > 10 && (
              <p className="text-sm text-gray-500 mt-2">
                Showing first 10 records. {previewData.validRecords.length - 10} more records will be imported.
              </p>
            )}
          </div>
        </div>
        
        <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
          <button onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button onClick={onConfirm} className="btn-primary">
            Import {previewData.validRecords.length} Records
          </button>
        </div>
      </div>
    </div>
  )
}

const Import = () => {
  const queryClient = useQueryClient()
  const fileInputRef = useRef(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [importProgress, setImportProgress] = useState(0)
  const [exportProgress, setExportProgress] = useState(0)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [isImporting, setIsImporting] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [previewData, setPreviewData] = useState({ validRecords: [], errors: [] })

  // Import mutation
  const importMutation = useMutation(
    (file) => importExportAPI.importExcel(file),
    {
      onMutate: () => {
        setIsImporting(true)
        setImportProgress(10)
      },
      onSuccess: (response) => {
        setImportProgress(100)
        setTimeout(() => {
          setSuccess(`Successfully imported ${response.imported_count} records`)
          setImportProgress(0)
          setIsImporting(false)
          setSelectedFile(null)
          setShowPreview(false)
          if (fileInputRef.current) {
            fileInputRef.current.value = ''
          }
          // Invalidate queries to refresh data
          queryClient.invalidateQueries(['records'])
          queryClient.invalidateQueries(['recent-records'])
          queryClient.invalidateQueries(['dashboard'])
        }, 500)
      },
      onError: (error) => {
        setError(error.response?.data?.error || 'Failed to import file')
        setImportProgress(0)
        setIsImporting(false)
      }
    }
  )

  // Export mutation
  const exportMutation = useMutation(
    (params) => importExportAPI.exportExcel(params),
    {
      onMutate: () => {
        setIsExporting(true)
        setExportProgress(10)
      },
      onSuccess: (response) => {
        setExportProgress(100)
        // Create download link
        const url = window.URL.createObjectURL(new Blob([response]))
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', `lab_records_${new Date().toISOString().split('T')[0]}.xlsx`)
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(url)
        
        setTimeout(() => {
          setSuccess('Data exported successfully')
          setExportProgress(0)
          setIsExporting(false)
        }, 500)
      },
      onError: (error) => {
        setError(error.response?.data?.error || 'Failed to export data')
        setExportProgress(0)
        setIsExporting(false)
      }
    }
  )

  // Download template mutation
  const downloadTemplateMutation = useMutation(
    () => importExportAPI.downloadTemplate(),
    {
      onSuccess: (response) => {
        // Create download link
        const url = window.URL.createObjectURL(new Blob([response]))
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', 'lab_records_template.xlsx')
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(url)
        
        setSuccess('Template downloaded successfully')
      },
      onError: (error) => {
        setError(error.response?.data?.error || 'Failed to download template')
      }
    }
  )

  const handleFileSelect = (event) => {
    const file = event.target.files[0]
    if (file) {
      // Validate file type
      const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv'
      ]
      
      if (!allowedTypes.includes(file.type)) {
        setError('Please select a valid Excel or CSV file')
        return
      }
      
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB')
        return
      }
      
      setSelectedFile(file)
      setError(null)
    }
  }

  const handlePreview = async () => {
    if (!selectedFile) {
      setError('Please select a file to preview')
      return
    }

    setError(null)
    setSuccess(null)
    
    try {
      // For now, we'll simulate preview data
      // In a real implementation, you'd call a preview endpoint
      const mockPreviewData = {
        validRecords: [
          {
            antibody_name: 'Anti-β-actin Antibody',
            dilution_ratio: '1/1000',
            dilution_type: 'TBST',
            volume_used: '5μl',
            config_date: '2025-01-15',
            personnel: '张三'
          },
          {
            antibody_name: 'Anti-GAPDH Antibody',
            dilution_ratio: '1/5000',
            dilution_type: '脱脂奶粉',
            volume_used: '2μl',
            config_date: '2025-01-16',
            personnel: '李四'
          }
        ],
        errors: [
          'Row 3: Missing required field: antibody_name',
          'Row 5: Invalid date format'
        ]
      }
      
      setPreviewData(mockPreviewData)
      setShowPreview(true)
    } catch (error) {
      setError('Failed to preview file')
    }
  }

  const handleImport = async () => {
    if (!selectedFile) {
      setError('Please select a file to import')
      return
    }

    setError(null)
    setSuccess(null)
    
    // Simulate progress
    const progressInterval = setInterval(() => {
      setImportProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return prev
        }
        return prev + 10
      })
    }, 200)
    
    await importMutation.mutateAsync(selectedFile)
    clearInterval(progressInterval)
  }

  const handleExport = async () => {
    setError(null)
    setSuccess(null)
    
    // Simulate progress
    const progressInterval = setInterval(() => {
      setExportProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return prev
        }
        return prev + 15
      })
    }, 150)
    
    await exportMutation.mutateAsync()
    clearInterval(progressInterval)
  }

  const handleDownloadTemplate = async () => {
    setError(null)
    setSuccess(null)
    
    await downloadTemplateMutation.mutateAsync()
  }

  const clearMessages = () => {
    setError(null)
    setSuccess(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Import/Export Data</h1>
        <p className="text-gray-600">Import and export lab chemical usage records</p>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex justify-between items-start">
            <p className="text-red-600">{error}</p>
            <button onClick={clearMessages} className="text-red-400 hover:text-red-600">
              ×
            </button>
          </div>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex justify-between items-start">
            <p className="text-green-600">{success}</p>
            <button onClick={clearMessages} className="text-green-400 hover:text-green-600">
              ×
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Import Section */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Import Data</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select File
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileSelect}
                disabled={isImporting}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 disabled:opacity-50"
              />
              <p className="text-xs text-gray-500 mt-1">
                Supported formats: Excel (.xlsx, .xls), CSV (.csv). Max size: 10MB
              </p>
            </div>

            {selectedFile && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Selected file:</strong> {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={handlePreview}
                disabled={!selectedFile || isImporting}
                className="btn-secondary flex-1 disabled:opacity-50"
              >
                Preview Data
              </button>
              
              <button
                onClick={handleImport}
                disabled={!selectedFile || isImporting}
                className="btn-primary flex-1 disabled:opacity-50"
              >
                {isImporting ? (
                  <div className="flex items-center">
                    <LoadingSpinner size="sm" className="mr-2" />
                    Importing...
                  </div>
                ) : (
                  'Import Data'
                )}
              </button>
            </div>

            <div className="flex justify-center">
              <button
                onClick={handleDownloadTemplate}
                disabled={downloadTemplateMutation.isLoading}
                className="btn-secondary disabled:opacity-50"
              >
                {downloadTemplateMutation.isLoading ? (
                  <div className="flex items-center">
                    <LoadingSpinner size="sm" className="mr-2" />
                    Downloading...
                  </div>
                ) : (
                  'Download Template'
                )}
              </button>
            </div>

            {importProgress > 0 && (
              <div className="space-y-2">
                <ProgressBar 
                  progress={importProgress} 
                  message={isImporting ? "Processing file..." : "Import complete!"} 
                />
              </div>
            )}
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Import Instructions:</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Download the template to see the required format</li>
              <li>• Fill in your data following the template structure</li>
              <li>• Save as Excel (.xlsx) or CSV format</li>
              <li>• Preview your data before importing</li>
              <li>• Upload the file to import your records</li>
              <li>• Existing records will not be duplicated</li>
            </ul>
          </div>
        </div>

        {/* Export Section */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Export Data</h2>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Export all your lab records to Excel format for backup or analysis.
              </p>
            </div>

            <button
              onClick={handleExport}
              disabled={isExporting}
              className="btn-primary w-full disabled:opacity-50"
            >
              {isExporting ? (
                <div className="flex items-center justify-center">
                  <LoadingSpinner size="sm" className="mr-2" />
                  Preparing Export...
                </div>
              ) : (
                'Export All Records'
              )}
            </button>

            {exportProgress > 0 && (
              <div className="space-y-2">
                <ProgressBar 
                  progress={exportProgress} 
                  message={isExporting ? "Generating Excel file..." : "Export complete!"} 
                />
              </div>
            )}
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Export Features:</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Exports all records in Excel format</li>
              <li>• Includes all record fields and metadata</li>
              <li>• File named with current date</li>
              <li>• Compatible with Excel, Google Sheets, etc.</li>
              <li>• Perfect for backup and data analysis</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Data Format Information */}
      {/* <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Data Format</h2>
        
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-3 font-medium text-gray-900">Field</th>
                <th className="text-left py-2 px-3 font-medium text-gray-900">Required</th>
                <th className="text-left py-2 px-3 font-medium text-gray-900">Format</th>
                <th className="text-left py-2 px-3 font-medium text-gray-900">Example</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="py-2 px-3 text-gray-900">Antibody Name</td>
                <td className="py-2 px-3 text-gray-600">Yes</td>
                <td className="py-2 px-3 text-gray-600">Text</td>
                <td className="py-2 px-3 text-gray-600">Anti-β-actin Antibody</td>
              </tr>
              <tr>
                <td className="py-2 px-3 text-gray-900">Dilution Ratio</td>
                <td className="py-2 px-3 text-gray-600">Yes</td>
                <td className="py-2 px-3 text-gray-600">1/Number</td>
                <td className="py-2 px-3 text-gray-600">1/1000</td>
              </tr>
              <tr>
                <td className="py-2 px-3 text-gray-900">Dilution Type</td>
                <td className="py-2 px-3 text-gray-600">Yes</td>
                <td className="py-2 px-3 text-gray-600">Text</td>
                <td className="py-2 px-3 text-gray-600">TBST</td>
              </tr>
              <tr>
                <td className="py-2 px-3 text-gray-900">Volume Used</td>
                <td className="py-2 px-3 text-gray-600">Yes</td>
                <td className="py-2 px-3 text-gray-600">Number + Unit</td>
                <td className="py-2 px-3 text-gray-600">5μl</td>
              </tr>
              <tr>
                <td className="py-2 px-3 text-gray-900">Config Date</td>
                <td className="py-2 px-3 text-gray-600">Yes</td>
                <td className="py-2 px-3 text-gray-600">YYYY-MM-DD</td>
                <td className="py-2 px-3 text-gray-600">2025-01-15</td>
              </tr>
              <tr>
                <td className="py-2 px-3 text-gray-900">Personnel</td>
                <td className="py-2 px-3 text-gray-600">Yes</td>
                <td className="py-2 px-3 text-gray-600">Text</td>
                <td className="py-2 px-3 text-gray-600">张三</td>
              </tr>
              <tr>
                <td className="py-2 px-3 text-gray-900">Experiment Name</td>
                <td className="py-2 px-3 text-gray-600">No</td>
                <td className="py-2 px-3 text-gray-600">Text</td>
                <td className="py-2 px-3 text-gray-600">Western Blot Analysis</td>
              </tr>
              <tr>
                <td className="py-2 px-3 text-gray-900">Batch Number</td>
                <td className="py-2 px-3 text-gray-600">No</td>
                <td className="py-2 px-3 text-gray-600">Text</td>
                <td className="py-2 px-3 text-gray-600">WB001</td>
              </tr>
              <tr>
                <td className="py-2 px-3 text-gray-900">Notes</td>
                <td className="py-2 px-3 text-gray-600">No</td>
                <td className="py-2 px-3 text-gray-600">Text</td>
                <td className="py-2 px-3 text-gray-600">Loading control</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div> */}

      {/* Preview Modal */}
      <PreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        previewData={previewData}
        onConfirm={() => {
          setShowPreview(false)
          handleImport()
        }}
      />
    </div>
  )
}

export default Import 