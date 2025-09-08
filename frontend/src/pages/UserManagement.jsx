import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import SuccessDialog from '../components/ui/SuccessDialog'

const UserManagement = () => {
  const { user, personnel } = useAuth()
  const [users, setUsers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showSuccess, setShowSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    if (user && personnel) {
      fetchUsers()
    }
  }, [user, personnel])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/auth/users', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      } else {
        console.error('Failed to fetch users')
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleApprove = async (userId) => {
    try {
      const response = await fetch(`/api/auth/users/${userId}/approve`, {
        method: 'POST',
        credentials: 'include'
      })
      
      if (response.ok) {
        setSuccessMessage('用户审核通过')
        setShowSuccess(true)
        fetchUsers() // Refresh the list
      } else {
        const data = await response.json()
        alert(data.error || '审核失败')
      }
    } catch (error) {
      alert('审核失败')
    }
  }

  const handleReject = async (userId) => {
    if (!confirm('确定要拒绝并删除这个用户吗？此操作不可撤销。')) {
      return
    }
    
    try {
      const response = await fetch(`/api/auth/users/${userId}/reject`, {
        method: 'POST',
        credentials: 'include'
      })
      
      if (response.ok) {
        setSuccessMessage('用户已拒绝并删除')
        setShowSuccess(true)
        fetchUsers() // Refresh the list
      } else {
        const data = await response.json()
        alert(data.error || '拒绝失败')
      }
    } catch (error) {
      alert('拒绝失败')
    }
  }

  const handleStatusChange = async (userId, isActive) => {
    try {
      const response = await fetch(`/api/auth/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ is_active: isActive })
      })
      
      if (response.ok) {
        setSuccessMessage('用户状态更新成功')
        setShowSuccess(true)
        fetchUsers() // Refresh the list
      } else {
        const data = await response.json()
        alert(data.error || '状态更新失败')
      }
    } catch (error) {
      alert('状态更新失败')
    }
  }

  // Check if current user is admin (user ID 1 is admin)
  if (!user || user.id !== 1) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">权限不足</h1>
          <p className="text-gray-600">您没有权限访问用户管理页面</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  const pendingUsers = users.filter(u => !u.is_active)
  const activeUsers = users.filter(u => u.is_active)

  return (
    <div className="max-w-6xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">用户管理</h1>
        <p className="text-gray-600">管理系统用户和权限</p>
      </div>

      {/* Pending Users */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="px-6 py-4 border-b border-gray-200 bg-amber-50">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h2 className="text-lg font-semibold text-amber-900">待审核用户</h2>
              <p className="text-sm text-amber-700">需要管理员手动审核的新注册用户账户</p>
            </div>
            {pendingUsers.length > 0 && (
              <div className="ml-auto">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-800">
                  {pendingUsers.length} 个待审核
                </span>
              </div>
            )}
          </div>
        </div>
        
        <div className="p-6">
          {pendingUsers.length === 0 ? (
            <p className="text-gray-500 text-center py-4">暂无待审核用户</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">用户信息</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">注册时间</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pendingUsers.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="flex items-center">
                              <div className="text-sm font-medium text-gray-900">{user.username}</div>
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                                新用户
                              </span>
                            </div>
                            <div className="text-sm text-gray-500">{user.personnel?.name || '未填写名称'}</div>
                            {user.personnel?.department && (
                              <div className="text-xs text-gray-400">{user.personnel.department}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.created_at).toLocaleDateString('zh-CN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-3">
                          <button
                            onClick={() => handleApprove(user.id)}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                          >
                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            审核通过
                          </button>
                          <button
                            onClick={() => handleReject(user.id)}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                          >
                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                            拒绝删除
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Active Users */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 bg-green-50">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <h2 className="text-lg font-semibold text-green-900">系统用户管理</h2>
              <p className="text-sm text-green-700">管理所有已通过审核的用户账户状态和权限</p>
            </div>
            {activeUsers.length > 0 && (
              <div className="ml-auto">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  {activeUsers.length} 个用户
                </span>
              </div>
            )}
          </div>
        </div>
        
        <div className="p-6">
          {activeUsers.length === 0 ? (
            <p className="text-gray-500 text-center py-4">暂无已激活用户</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">用户信息</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">最后登录</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {activeUsers.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                              user.is_active 
                                ? 'bg-green-100' 
                                : 'bg-gray-200'
                            }`}>
                              <svg className={`h-5 w-5 ${
                                user.is_active 
                                  ? 'text-green-600' 
                                  : 'text-gray-400'
                              }`} fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="flex items-center">
                              <div className="text-sm font-medium text-gray-900">{user.username}</div>
                              {user.id === 1 && (
                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                  ADMIN
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500">{user.personnel?.name || '未填写名称'}</div>
                            {user.personnel?.department && (
                              <div className="text-xs text-gray-400">{user.personnel.department}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.is_active 
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            <div className={`w-2 h-2 rounded-full mr-1.5 ${
                              user.is_active ? 'bg-green-400' : 'bg-red-400'
                            }`}></div>
                            {user.is_active ? '已激活' : '已停用'}
                          </span>
                          <label className="inline-flex items-center">
                            <input
                              type="checkbox"
                              checked={user.is_active}
                              onChange={(e) => handleStatusChange(user.id, e.target.checked)}
                              className="form-checkbox h-4 w-4 text-primary-600 transition duration-150 ease-in-out"
                              disabled={user.id === personnel.user_id}
                            />
                            <span className="ml-2 text-xs text-gray-500">
                              {user.id === personnel.user_id ? '当前用户' : '切换状态'}
                            </span>
                          </label>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.last_login 
                          ? new Date(user.last_login).toLocaleDateString('zh-CN')
                          : '从未登录'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center space-x-2">
                          {user.id === personnel.user_id && (
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                              </svg>
                              当前用户
                            </span>
                          )}
                          {user.id === 1 && (
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-800">
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                              </svg>
                              系统管理员
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Success Dialog */}
      <SuccessDialog
        isOpen={showSuccess}
        onClose={() => setShowSuccess(false)}
        message={successMessage}
      />
    </div>
  )
}

export default UserManagement
