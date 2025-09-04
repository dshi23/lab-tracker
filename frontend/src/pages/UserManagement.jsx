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
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">待审核用户</h2>
          <p className="text-sm text-gray-600">需要审核的新注册用户</p>
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
                        <div>
                          <div className="text-sm font-medium text-gray-900">{user.username}</div>
                          <div className="text-sm text-gray-500">{user.personnel?.name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.created_at).toLocaleDateString('zh-CN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleApprove(user.id)}
                            className="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 px-3 py-1 rounded-md text-sm"
                          >
                            通过
                          </button>
                          <button
                            onClick={() => handleReject(user.id)}
                            className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-md text-sm"
                          >
                            拒绝
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
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">已激活用户</h2>
          <p className="text-sm text-gray-600">已审核通过的用户</p>
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
                        <div>
                          <div className="text-sm font-medium text-gray-900">{user.username}</div>
                          <div className="text-sm text-gray-500">{user.personnel?.name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <label className="inline-flex items-center">
                          <input
                            type="checkbox"
                            checked={user.is_active}
                            onChange={(e) => handleStatusChange(user.id, e.target.checked)}
                            className="form-checkbox h-4 w-4 text-primary-600 transition duration-150 ease-in-out"
                          />
                          <span className="ml-2 text-sm text-gray-700">
                            {user.is_active ? '激活' : '停用'}
                          </span>
                        </label>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.last_login 
                          ? new Date(user.last_login).toLocaleDateString('zh-CN')
                          : '从未登录'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.id === personnel.user_id ? '当前用户' : '-'}
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
