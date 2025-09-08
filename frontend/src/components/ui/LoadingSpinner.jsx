const LoadingSpinner = ({ size = 'md', text = 'Loading...', className = '' }) => {
  const sizeClasses = {
    sm: {
      spinner: 'w-4 h-4 border-2',
      text: 'text-xs mt-2'
    },
    md: {
      spinner: 'w-8 h-8 border-3',
      text: 'text-sm mt-3'
    },
    lg: {
      spinner: 'w-16 h-16 border-4',
      text: 'text-base mt-4'
    }
  }

  return (
    <div className={`flex flex-col items-center justify-center py-8 ${className}`} role="status" aria-live="polite">
      {/* Enhanced spinner with gradient */}
      <div className="relative">
        <div className={`${sizeClasses[size].spinner} animate-spin rounded-full border-gray-200 border-t-primary-600 border-r-primary-500 border-b-primary-400`}></div>
        
        {/* Additional decorative ring for large size */}
        {size === 'lg' && (
          <div className="absolute inset-0 w-16 h-16 border-2 border-primary-100 rounded-full animate-pulse"></div>
        )}
      </div>
      
      {/* Loading dots animation */}
      <div className="flex space-x-1 mt-2">
        <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
      
      {text && (
        <p className={`text-gray-600 font-medium ${sizeClasses[size].text}`} aria-label={text}>
          {text}
        </p>
      )}
      
      {/* Screen reader only text */}
      <span className="sr-only">Loading content, please wait...</span>
    </div>
  )
}

export default LoadingSpinner 