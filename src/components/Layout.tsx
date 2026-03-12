import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  LayoutDashboard,
  Package,
  FolderOpen,
  ShoppingCart,
  Users,
  Menu,
  X,
  LogOut,
  Settings,
  FileText,
  Image as ImageIcon,
  Shield
} from 'lucide-react'

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, logout } = useAuth()
  const location = useLocation()

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Products', href: '/products', icon: Package },
    { name: 'Categories', href: '/categories', icon: FolderOpen },
    // { name: 'Brands', href: '/brands', icon: Tag },
    { name: 'Orders', href: '/orders', icon: ShoppingCart },
    { name: 'Users', href: '/users', icon: Users },
    //{ name: 'Riders', href: '/riders', icon: Truck },
    { name: 'Blogs', href: '/blogs', icon: FileText },
    { name: 'Gallery', href: '/gallery', icon: ImageIcon },
    { name: 'Policies', href: '/policies', icon: Shield },
  ]

  const isCurrentPath = (path: string) => {
    if (path === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(path)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="relative flex w-full max-w-xs flex-1 flex-col admin-sidebar">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6 text-white" />
            </button>
          </div>
          <div className="flex flex-shrink-0 items-center px-3 py-3">
            <h1 className="text-base font-semibold text-white">Tassmatt Agencies</h1>
          </div>
          <div className="mt-4 h-0 flex-1 overflow-y-auto">
            <nav className="space-y-0.5 px-2">
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`${
                      isCurrentPath(item.href)
                        ? 'bg-white bg-opacity-20 text-white'
                        : 'text-white hover:bg-white hover:bg-opacity-10'
                    } group flex items-center px-2 py-1.5 text-xs font-medium rounded-md`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon className="mr-2 h-4 w-4 flex-shrink-0" />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-48 lg:flex-col">
        <div className="flex min-h-0 flex-1 flex-col admin-sidebar">
          <div className="flex flex-1 flex-col overflow-y-auto pt-4 pb-3">
            <div className="flex flex-shrink-0 items-center px-3">
              <h1 className="text-base font-semibold text-white">Tassmatt Agencies</h1>
            </div>
            <nav className="mt-4 flex-1 space-y-0.5 px-2">
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`${
                      isCurrentPath(item.href)
                        ? 'bg-white bg-opacity-20 text-white'
                        : 'text-white hover:bg-white hover:bg-opacity-10'
                    } group flex items-center px-2 py-1.5 text-xs font-medium rounded-md`}
                  >
                    <Icon className="mr-2 h-4 w-4 flex-shrink-0" />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>
          <div className="flex flex-shrink-0 border-t border-white border-opacity-20 p-3">
            <div className="group block flex-shrink-0">
              <div className="flex items-center">
                <div className="ml-2">
                  <p className="text-[10px] font-medium text-white">{user?.firstName} {user?.lastName}</p>
                  <p className="text-[10px] font-normal text-white text-opacity-75 truncate">{user?.email}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-48 flex flex-col flex-1">
        {/* Top bar */}
        <div className="sticky top-0 z-10 flex h-16 flex-shrink-0 bg-white shadow">
          <button
            type="button"
            className="border-r border-gray-200 px-4 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex flex-1 justify-between px-4">
            <div className="flex flex-1">
              <div className="flex w-full flex-col justify-center">
                <div className="flex items-center">
                  <h2 className="text-sm font-semibold text-gray-900">
                    {navigation.find(item => isCurrentPath(item.href))?.name || 'Dashboard'}
                  </h2>
                </div>
              </div>
            </div>
            <div className="ml-4 flex items-center md:ml-6">
              <div className="relative ml-3">
                <div className="flex items-center space-x-4">
                  <button className="text-gray-400 hover:text-gray-500">
                    <Settings className="h-5 w-5" />
                  </button>
                  <button
                    onClick={logout}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1">
          <div className="py-6">
            <div className="mx-auto w-full px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default Layout
