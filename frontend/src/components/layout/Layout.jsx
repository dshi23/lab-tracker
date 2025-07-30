import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import MobileHeader from './MobileHeader'
import MobileNavigation from './MobileNavigation'
import Sidebar from './Sidebar'

const Layout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const location = useLocation()

  // Check if we're on mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Close sidebar when route changes on mobile
  useEffect(() => {
    if (isMobile) {
      setIsSidebarOpen(false)
    }
  }, [location.pathname, isMobile])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      {isMobile && (
        <MobileHeader 
          onMenuClick={() => setIsSidebarOpen(true)}
        />
      )}
      
      {/* Desktop Sidebar */}
      {!isMobile && (
        <Sidebar 
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
      )}
      
      {/* Mobile Sidebar Overlay */}
      {isMobile && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      
      {/* Mobile Sidebar */}
      {isMobile && (
        <div className={`fixed top-0 left-0 h-full w-64 bg-white shadow-lg z-50 transform transition-transform duration-300 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <Sidebar 
            isOpen={true}
            onClose={() => setIsSidebarOpen(false)}
            isMobile={true}
          />
        </div>
      )}
      
      {/* Main Content */}
      <main className={`transition-all duration-300 ${
        isMobile 
          ? 'pt-16 pb-20' // Space for header and bottom nav
          : 'ml-64' // Space for sidebar
      }`}>
        <div className="mobile-container tablet-container desktop-container">
          {children}
        </div>
      </main>
      
      {/* Mobile Bottom Navigation */}
      {isMobile && <MobileNavigation />}
    </div>
  )
}

export default Layout 