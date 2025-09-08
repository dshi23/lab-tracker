import { useState } from 'react'
import { useQuery } from 'react-query'
import { Link } from 'react-router-dom'
import { useRecordsApi } from '../hooks/useRecordsApi'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import RecordCard from '../components/lists/RecordCard'
import SearchForm from '../components/forms/SearchForm'

const Records = () => {
  const [filters, setFilters] = useState({
    page: 1,
    per_page: 20,
    search: '',
    personnel: '',
    drug: '',
    start_date: '',
    end_date: ''
  })

  const { getRecords } = useRecordsApi()

  const { data, isLoading, error } = useQuery(
    ['records', filters],
    () => getRecords(filters),
    {
      keepPreviousData: true,
      staleTime: 0,
      refetchOnMount: 'always',
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    }
  )

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }))
  }

  const handlePageChange = (page) => {
    setFilters(prev => ({ ...prev, page }))
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">加载记录时出错</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                使用记录 <span className="text-lg font-normal text-gray-600">Usage Records</span>
              </h1>
              <p className="text-gray-600">
                浏览和搜索库存使用记录 • {data?.total || 0} records total
              </p>
            </div>
            <div className="flex space-x-3 mt-4 sm:mt-0">
              <Link to="/add" className="btn-primary inline-flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                添加记录
              </Link>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="card mb-6">
          <SearchForm onFilterChange={handleFilterChange} />
        </div>

        {/* Records List */}
        {data?.records?.length > 0 ? (
          <div className="space-y-4 mb-6">
            {data.records.map((record) => (
              <RecordCard key={record.id} record={record} />
            ))}
          </div>
        ) : (
          <div className="card text-center py-12">
            <div className="w-20 h-20 mx-auto mb-4 text-gray-300">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">暂无记录</h3>
            <p className="text-gray-600 mb-6">开始记录实验室的使用情况</p>
            <Link to="/add" className="btn-primary inline-flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              添加首条记录
            </Link>
          </div>
        )}

        {/* Pagination */}
        {data?.pagination && data.pagination.pages > 1 && (
          <div className="card">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="text-sm text-gray-700">
                显示第 {((data.pagination.page - 1) * data.pagination.per_page) + 1} 到{' '}
                {Math.min(data.pagination.page * data.pagination.per_page, data.pagination.total)} 项，
                共 {data.pagination.total} 项
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handlePageChange(data.pagination.page - 1)}
                  disabled={!data.pagination.has_prev}
                  className="btn-secondary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  上一页
                </button>
                <span className="flex items-center px-3 py-2 text-sm font-medium text-gray-700">
                  {data.pagination.page} / {data.pagination.pages}
                </span>
                <button
                  onClick={() => handlePageChange(data.pagination.page + 1)}
                  disabled={!data.pagination.has_next}
                  className="btn-secondary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  下一页
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Records 