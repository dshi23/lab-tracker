import { useLocation } from 'react-router-dom'

const MobileHeader = ({ onMenuClick }) => {
  const location = useLocation()
  
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
        return 'Dashboard'
      case '/records':
        return 'Records'
      case '/add':
        return 'Add Record'
      case '/analytics':
        return 'Analytics'
      case '/import':
        return 'Import Data'
      case '/settings':
        return 'Settings'
      default:
        if (location.pathname.startsWith('/records/')) {
          return 'Record Details'
        }
        return 'Lab Tracker'
    }
  }

  return (
    <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-30 safe-area-top">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Hamburger Menu */}
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
        
        {/* Page Title */}
        <h1 className="text-lg font-semibold text-gray-900">
          {getPageTitle()}
        </h1>
        
        {/* Right side placeholder for balance */}
        <div className="w-10 h-10"></div>
      </div>
    </header>
  )
}

export default MobileHeader 