import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from 'react-query';
import { useStorageApi } from '../hooks/useStorageApi';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const StorageImport = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  const { importStorageExcel, downloadStorageTemplate } = useStorageApi();

  const importMutation = useMutation(
    (file) => importStorageExcel(file),
    {
      onSuccess: (result) => {
        setImportResult(result);
        if (result.success_count > 0) {
          // Invalidate storage queries to refresh the data
          queryClient.invalidateQueries(['storage']);
          queryClient.invalidateQueries(['inventory']);
        }
      },
      onError: (error) => {
        setError(error.message || '导入失败');
      }
    }
  );

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragOver(false);
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      validateAndSetFile(files[0]);
    }
  };

  const validateAndSetFile = (file) => {
    // Reset previous states
    setError(null);
    setImportResult(null);
    
    // Validate file type
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];
    
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|csv)$/i)) {
      setError('请选择 Excel 文件 (.xlsx, .xls) 或 CSV 文件');
      return;
    }
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('文件大小不能超过 10MB');
      return;
    }
    
    setSelectedFile(file);
  };

  const handleImport = async () => {
    if (!selectedFile) {
      setError('请先选择文件');
      return;
    }

    setError(null);
    await importMutation.mutateAsync(selectedFile);
  };

  const handleDownloadTemplate = async () => {
    try {
      await downloadStorageTemplate();
    } catch (error) {
      setError('下载模板失败: ' + error.message);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setImportResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center space-x-2 mb-2">
          <button
            onClick={() => navigate('/storage')}
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold text-gray-900">批量导入库存</h1>
        </div>
        <p className="text-gray-600">从 Excel 文件批量导入库存数据到系统中</p>
      </div>

      <div className="space-y-6">
        {/* Template Download Section */}
        <div className="bg-blue-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">📋 第一步：下载导入模板</h3>
          <p className="text-blue-700 mb-4">
            请使用标准模板格式导入数据，确保数据格式正确。模板包含以下列：
          </p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4 text-sm">
            <div className="bg-blue-100 p-2 rounded text-center font-medium">类型</div>
            <div className="bg-blue-100 p-2 rounded text-center font-medium">产品名</div>
            <div className="bg-blue-100 p-2 rounded text-center font-medium">数量及数量单位</div>
            <div className="bg-blue-100 p-2 rounded text-center font-medium">存放地</div>
            <div className="bg-blue-100 p-2 rounded text-center font-medium">CAS号</div>
          </div>
          <button
            onClick={handleDownloadTemplate}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            下载 Excel 模板
          </button>
        </div>

        {/* File Upload Section */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📁 第二步：选择导入文件</h3>
          
          {/* Drag and Drop Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragOver 
                ? 'border-blue-400 bg-blue-50' 
                : 'border-gray-300 bg-gray-50'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <div className="space-y-4">
              <div className="text-4xl text-gray-400">📎</div>
              <div>
                <p className="text-lg font-medium text-gray-900">
                  点击选择文件或拖拽文件到此处
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  支持 .xlsx, .xls, .csv 格式，最大 10MB
                </p>
              </div>
            </div>
          </div>

          {/* Selected File Info */}
          {selectedFile && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="font-medium text-green-900">{selectedFile.name}</p>
                    <p className="text-sm text-green-700">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleReset}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Import Button */}
        {selectedFile && !importResult && (
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">🚀 第三步：开始导入</h3>
            <div className="flex space-x-4">
              <button
                onClick={handleImport}
                disabled={importMutation.isLoading}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {importMutation.isLoading ? '导入中...' : '开始导入'}
              </button>
              <button
                onClick={() => navigate('/storage')}
                className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        )}

        {/* Loading Indicator */}
        {importMutation.isLoading && (
          <div className="bg-white p-6 rounded-lg shadow-lg text-center">
            <LoadingSpinner />
            <p className="mt-4 text-gray-600">正在处理文件，请稍候...</p>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-600">{error}</p>
            </div>
          </div>
        )}

        {/* Import Results */}
        {importResult && (
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 导入结果</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <svg className="w-8 h-8 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-2xl font-bold text-green-600">{importResult.success_count}</p>
                    <p className="text-green-700">成功导入</p>
                  </div>
                </div>
              </div>
              
              {importResult.error_count > 0 && (
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <svg className="w-8 h-8 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-2xl font-bold text-red-600">{importResult.error_count}</p>
                      <p className="text-red-700">导入失败</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Error Details */}
            {importResult.errors && importResult.errors.length > 0 && (
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-2">错误详情</h4>
                <div className="bg-gray-50 p-4 rounded-lg max-h-48 overflow-y-auto">
                  {importResult.errors.map((error, index) => (
                    <div key={index} className="text-sm text-red-600 mb-1">
                      {error}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Success Actions */}
            {importResult.success_count > 0 && (
              <div className="flex space-x-4">
                <button
                  onClick={() => navigate('/storage')}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  查看库存列表
                </button>
                <button
                  onClick={handleReset}
                  className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  继续导入
                </button>
              </div>
            )}
          </div>
        )}

        {/* Help Section */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">💡 导入说明</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-700">
            <div>
              <h4 className="font-medium mb-2">文件格式要求</h4>
              <ul className="space-y-1">
                <li>• 必须包含标题行</li>
                <li>• 支持 .xlsx, .xls, .csv 格式</li>
                <li>• 文件大小不超过 10MB</li>
                <li>• 建议使用 UTF-8 编码</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">数据验证规则</h4>
              <ul className="space-y-1">
                <li>• 产品名不能重复</li>
                <li>• 数量格式: 100ml, 50g, 200μl</li>
                <li>• CAS号格式: 123-45-6 (可选)</li>
                <li>• 所有必填字段不能为空</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StorageImport; 