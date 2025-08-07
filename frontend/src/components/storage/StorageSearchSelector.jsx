import { useState, useEffect, useRef } from 'react'
import { useQuery } from 'react-query'
import { useStorageApi } from '../../hooks/useStorageApi'
import LoadingSpinner from '../ui/LoadingSpinner'

/**
 * StorageSearchSelector – A lightweight search/autocomplete component for selecting storage items.
 * 
 * Props:
 *  - onStorageSelect(storageItem)
 *  - selectedStorage (object|null)
 *  - showAvailableOnly (boolean) – defaults to true (filters items with 当前库存量 > 0)
 */
const debounce = (fn, delay = 300) => {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      fn(...args)
    }, delay)
  }
}

const indicatorColor = {
  available: 'text-green-600',
  low_stock: 'text-yellow-600',
  out_of_stock: 'text-red-600'
}

const indicatorIcon = {
  available: '✅',
  low_stock: '⚠️',
  out_of_stock: '❌'
}

const StorageSearchSelector = ({ onStorageSelect, selectedStorage = null, showAvailableOnly = true }) => {
  const [query, setQuery] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef(null)

  const { searchAvailableStorage } = useStorageApi()

  // Debounce user input
  const debouncedSetSearchTerm = useRef(
    debounce((val) => setSearchTerm(val), 300)
  ).current

  const {
    data: searchResults,
    isLoading,
    refetch
  } = useQuery(
    ['available-storage-search', searchTerm],
    () => searchAvailableStorage(searchTerm, 10),
    {
      enabled: !!searchTerm,
      staleTime: 2 * 60 * 1000
    }
  )

  // Update search term when query changes
  useEffect(() => {
    debouncedSetSearchTerm(query.trim())
  }, [query, debouncedSetSearchTerm])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (inputRef.current && !inputRef.current.contains(event.target)) {
        setIsFocused(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (item) => {
    onStorageSelect(item)
    setQuery('')
    setIsFocused(false)
  }

  return (
    <div className="relative" ref={inputRef}>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setIsFocused(true)}
        className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="搜索库存名称、位置或单位..."
      />
      {isLoading && (
        <div className="absolute right-3 top-2">
          <LoadingSpinner size="sm" />
        </div>
      )}

      {/* Suggestion dropdown */}
      {isFocused && query && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
          {isLoading && (
            <div className="p-3 text-center text-sm text-gray-500">加载中...</div>
          )}

          {!isLoading && searchResults?.results?.length === 0 && (
            <div className="p-3 text-center text-sm text-gray-500">没有匹配的库存</div>
          )}

          {!isLoading && searchResults?.results?.map((item) => (
            <div
              key={item.id}
              onClick={() => handleSelect(item)}
              className="px-4 py-2 cursor-pointer hover:bg-blue-50 flex justify-between items-center"
            >
              <div>
                <p className="font-medium text-gray-900">{item['产品名']}</p>
                <p className="text-xs text-gray-500">{item['存放地']} • {item['当前库存量']}{item['单位']}</p>
              </div>
              <span className={`text-xl ${indicatorColor[item.availability_status]}`}>{indicatorIcon[item.availability_status]}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default StorageSearchSelector
