import { useNavigate } from 'react-router-dom'
import { useQuery } from 'react-query'
import { useStorageApi } from '../hooks/useStorageApi'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import StorageSearchSelector from '../components/storage/StorageSearchSelector'

const AddRecord = () => {
  const navigate = useNavigate()
  const { getStorageItems } = useStorageApi()

  // Fetch storage items for selection
  const { data: storageData, isLoading: storageLoading } = useQuery(
    ['storage-for-records'],
    () => getStorageItems({ per_page: 100 }),
    { staleTime: 5 * 60 * 1000 }
  )

  const handleStorageItemSelect = (item) => {
    if (item?.id) navigate(`/storage/${item.id}/use`)
  }

  if (storageLoading) return <LoadingSpinner />

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">记录库存使用</h1>
        <p className="text-gray-600">请选择一个库存项目，系统将跳转到使用记录页面</p>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">选择库存项目</h3>

        {/* Smart Search Selector */}
        <div className="mb-6">
          <StorageSearchSelector onStorageSelect={handleStorageItemSelect} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {storageData?.items?.map((item) => (
            <div
              key={item.id}
              onClick={() => handleStorageItemSelect(item)}
              className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">{item.产品名}</h4>
                <span className="text-sm text-gray-500">{item.类型}</span>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <div className="flex justify-between">
                  <span>库存量:</span>
                  <span className="font-medium">{item.当前库存量}{item.单位}</span>
                </div>
                <div className="flex justify-between">
                  <span>存放地:</span>
                  <span className="font-medium">{item.存放地}</span>
                </div>
                {item.CAS号 && (
                  <div className="flex justify-between">
                    <span>CAS号:</span>
                    <span className="font-medium">{item.CAS号}</span>
                  </div>
                )}
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100">
                <button className="w-full px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors">
                  选择此项目并去记录使用
                </button>
              </div>
            </div>
          ))}
        </div>
        
        {storageData?.items?.length === 0 && (
          <div className="text-center py-8">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="text-gray-500">暂无库存项目</p>
            <button
              onClick={() => navigate('/storage/add')}
              className="mt-2 text-blue-600 hover:text-blue-700 text-sm"
            >
              添加库存项目 →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default AddRecord 