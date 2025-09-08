const StatCard = ({ title, subtitle, value, change, trend, icon, color = 'blue', enhanced = false }) => {
  const colorClasses = {
    blue: {
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      border: 'border-blue-200',
      gradient: 'from-blue-500 to-blue-700',
      ring: 'ring-blue-500/20'
    },
    green: {
      bg: 'bg-green-50',
      text: 'text-green-600',
      border: 'border-green-200',
      gradient: 'from-green-500 to-green-700',
      ring: 'ring-green-500/20'
    },
    purple: {
      bg: 'bg-purple-50',
      text: 'text-purple-600',
      border: 'border-purple-200',
      gradient: 'from-purple-500 to-purple-700',
      ring: 'ring-purple-500/20'
    },
    orange: {
      bg: 'bg-orange-50',
      text: 'text-orange-600',
      border: 'border-orange-200',
      gradient: 'from-orange-500 to-orange-700',
      ring: 'ring-orange-500/20'
    },
    red: {
      bg: 'bg-red-50',
      text: 'text-red-600',
      border: 'border-red-200',
      gradient: 'from-red-500 to-red-700',
      ring: 'ring-red-500/20'
    },
    yellow: {
      bg: 'bg-yellow-50',
      text: 'text-yellow-600',
      border: 'border-yellow-200',
      gradient: 'from-yellow-500 to-yellow-700',
      ring: 'ring-yellow-500/20'
    },
    gray: {
      bg: 'bg-gray-50',
      text: 'text-gray-600',
      border: 'border-gray-200',
      gradient: 'from-gray-500 to-gray-700',
      ring: 'ring-gray-500/20'
    }
  }

  const getTrendIcon = () => {
    if (trend === 'up') {
      return (
        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      )
    }
    if (trend === 'down') {
      return (
        <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
        </svg>
      )
    }
    return (
      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
      </svg>
    )
  }

  if (enhanced) {
    return (
      <div className={`relative bg-white rounded-2xl shadow-lg border border-gray-100/50 p-6 overflow-hidden group hover:shadow-xl transition-all duration-300 hover:ring-4 ${colorClasses[color].ring}`}>
        {/* Background decoration */}
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-20 h-20 rounded-full opacity-10 bg-gradient-to-br ${colorClasses[color].gradient} blur-xl"></div>
        
        <div className="relative">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${colorClasses[color].gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
              <div className="text-white">
                {icon}
              </div>
            </div>
            
            {change && (
              <div className="flex items-center space-x-1 text-sm">
                {getTrendIcon()}
                <span className={`font-medium ${
                  trend === 'up' ? 'text-green-600' : 
                  trend === 'down' ? 'text-red-600' : 
                  'text-gray-600'
                }`}>
                  {change}
                </span>
              </div>
            )}
          </div>
          
          {/* Content */}
          <div className="space-y-2">
            <div>
              <h3 className="font-bold text-gray-900 text-lg leading-tight">
                {title}
              </h3>
              {subtitle && (
                <p className="text-sm font-medium text-gray-600">
                  {subtitle}
                </p>
              )}
            </div>
            
            <div className="text-3xl font-bold text-gray-900 group-hover:scale-105 transition-transform origin-left">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </div>
          </div>
          
          {/* Hover indicator */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${colorClasses[color].gradient} transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
        </div>
      </div>
    )
  }

  // Original design fallback
  return (
    <div className="card group hover:shadow-lg transition-all duration-200">
      <div className="flex items-center">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center mr-4 ${colorClasses[color].bg} ${colorClasses[color].text} group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{typeof value === 'number' ? value.toLocaleString() : value}</p>
        </div>
      </div>
    </div>
  )
}

export default StatCard 