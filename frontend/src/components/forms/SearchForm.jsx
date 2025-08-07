import { useState } from 'react'
import { useQuery } from 'react-query'
import { analyticsAPI } from '../../services/api'

import { useRef, useEffect } from 'react'

const SearchForm = ({
  onFilterChange,
  initialFilters = {
    search: '',
    personnel: '',
    drug: '',
    start_date: '',
    end_date: ''
  },
  searchPlaceholder = 'Search...',
  showTypeFilter = false,
  showLocationFilter = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [filters, setFilters] = useState(initialFilters)

  // Fetch autocomplete data
  const { data: autocompleteData } = useQuery(
    ['autocomplete'],
    () => analyticsAPI.getAutocompleteData(),
    {
      staleTime: 10 * 60 * 1000, // 10 minutes
    }
  )

  const debounceTimer = useRef(null)

  const handleFilterChange = (field, value) => {
    const newFilters = { ...filters, [field]: value }
    setFilters(newFilters)

    // Debounce only the search field to avoid excessive API calls
    if (field === 'search') {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
      debounceTimer.current = setTimeout(() => {
        onFilterChange(newFilters)
      }, 400)
    } else {
      onFilterChange(newFilters)
    }
  }

  const handleClearFilters = () => {
    const clearedFilters = {
      search: '',
      personnel: '',
      drug: '',
      start_date: '',
      end_date: ''
    }
    setFilters(clearedFilters)
    onFilterChange(clearedFilters)
  }

  // Cleanup debounce timer on unmount
  useEffect(() => () => clearTimeout(debounceTimer.current), [])

  return (
    <div className="card">
      {/* Basic Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="input-field"
          />
        </div>
        
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="btn-secondary whitespace-nowrap"
        >
          {isExpanded ? 'Hide Filters' : 'Show Filters'}
        </button>
      </div>

      {/* Advanced Filters */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Personnel Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Personnel
              </label>
              <select
                value={filters.personnel}
                onChange={(e) => handleFilterChange('personnel', e.target.value)}
                className="input-field"
              >
                <option value="">All Personnel</option>
                {autocompleteData?.personnel?.map((person, index) => (
                  <option key={index} value={person}>{person}</option>
                ))}
              </select>
            </div>

            {/* Drug Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Drug
              </label>
              <select
                value={filters.drug}
                onChange={(e) => handleFilterChange('drug', e.target.value)}
                className="input-field"
              >
                <option value="">All Drugs</option>
                {autocompleteData?.drugs?.map((drug, index) => (
                  <option key={index} value={drug}>{drug}</option>
                ))}
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={filters.start_date}
                onChange={(e) => handleFilterChange('start_date', e.target.value)}
                className="input-field"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={filters.end_date}
                onChange={(e) => handleFilterChange('end_date', e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          {/* Clear Filters */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleClearFilters}
              className="text-gray-600 hover:text-gray-800 text-sm font-medium"
            >
              Clear All Filters
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default SearchForm 