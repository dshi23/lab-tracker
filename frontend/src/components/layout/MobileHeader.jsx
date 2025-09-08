import { useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const MobileHeader = ({ onMenuClick }) => {
  const location = useLocation()
  const { user, personnel } = useAuth()
  
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
        return '仪表板'
      case '/storage':
        return '库存管理'
      case '/records':
        return '使用记录'
      case '/import':
        return '导入导出'
      case '/settings':
        return '个人信息'
      case '/users':
        return '用户管理'
      default:
        if (location.pathname.startsWith('/storage/')) {
          if (location.pathname.includes('/add')) return '添加库存'
          if (location.pathname.includes('/edit')) return '编辑库存'
          if (location.pathname.includes('/use')) return '记录使用'
          if (location.pathname.includes('/history')) return '使用历史'
          if (location.pathname.includes('/import')) return '库存导入'
          if (location.pathname.match(/\/storage\/\d+$/)) return '库存详情'
          return '库存管理'
        }
        if (location.pathname.startsWith('/records/')) {
          if (location.pathname.includes('/add')) return '记录使用'
          return '使用详情'
        }
        return '实验室追踪'
    }
  }

  return (
    <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-30 safe-area-top">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left side - Menu + Branding */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Open menu"
          >
            <svg 
              className="w-6 h-6 text-gray-600" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M4 6h16M4 12h16M4 18h16" 
              />
            </svg>
          </button>
          
          {/* App Logo */}
          <div className="flex items-center">
            <div className="w-6 h-6 bg-primary-600 rounded-md flex items-center justify-center mr-2">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
          </div>
        </div>
        
        {/* Center - Page Title */}
        <h1 className="text-lg font-semibold text-gray-900 text-center flex-1">
          {getPageTitle()}
        </h1>
        
        {/* Right side - User Info */}
        {user && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            {user.id === 1 && (
              <span className="text-xs bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded font-medium">
                管理员
              </span>
            )}
          </div>
        )}
      </div>
    </header>
  )
}

export default MobileHeader 