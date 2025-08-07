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
      staleTime: 2 * 60 * 1000, // 2 minutes
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">使用记录</h1>
          <p className="text-gray-600">浏览和搜索库存使用记录</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link to="/add" className="btn-primary">
            添加记录
          </Link>
        </div>
      </div>

      {/* Search and Filters */}
      <SearchForm onFilterChange={handleFilterChange} />

      {/* Records List */}
      {data?.records?.length > 0 ? (
        <div className="space-y-4">
          {data.records.map((record) => (
            <RecordCard key={record.id} record={record} />
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">暂无记录</p>
          <Link to="/add" className="text-primary-600 hover:text-primary-700 mt-2 inline-block">
            添加首条记录
          </Link>
        </div>
      )}

      {/* Pagination */}
      {data?.pagination && data.pagination.pages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <button
            onClick={() => handlePageChange(data.pagination.page - 1)}
            disabled={!data.pagination.has_prev}
            className="btn-secondary disabled:opacity-50"
          >
            上一页
          </button>
          
          <span className="text-gray-600">
            第 {data.pagination.page} 页，共 {data.pagination.pages} 页
          </span>
          
          <button
            onClick={() => handlePageChange(data.pagination.page + 1)}
            disabled={!data.pagination.has_next}
            className="btn-secondary disabled:opacity-50"
          >
            下一页
          </button>
        </div>
      )}
    </div>
  )
}

export default Records 