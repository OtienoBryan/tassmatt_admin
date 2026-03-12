import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { adminApiService, DashboardStats, Order } from '../services/api'
import { ArrowRight, Filter, Edit, Eye } from 'lucide-react'
import Pagination from '../components/ui/Pagination'

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalCategories: 0,
    totalOrders: 0,
    totalUsers: 0,
    recentOrders: []
  })
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(7)
  const [selectedStatus, setSelectedStatus] = useState<string>('pending')
  const [showStatusUpdate, setShowStatusUpdate] = useState(false)
  const [showItems, setShowItems] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [newStatus, setNewStatus] = useState<Order['status']>('pending')

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const [products, categories, orders, users] = await Promise.all([
        adminApiService.getProducts(),
        adminApiService.getCategories(),
        adminApiService.getOrders(),
        adminApiService.getUsers()
      ])

      setStats({
        totalProducts: products.length,
        totalCategories: categories.length,
        totalOrders: orders.length,
        totalUsers: users.length,
        recentOrders: orders
      })
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }


  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }

  const handleUpdateStatus = (order: Order) => {
    setSelectedOrder(order)
    setNewStatus(order.status)
    setShowStatusUpdate(true)
  }

  const handleStatusUpdate = async () => {
    if (!selectedOrder) return
    
    try {
      await adminApiService.updateOrderStatus(selectedOrder.id, newStatus, selectedOrder.paymentStatus)
      setShowStatusUpdate(false)
      setSelectedOrder(null)
      loadDashboardData() // Refresh data
    } catch (error) {
      console.error('Error updating order status:', error)
      alert('Failed to update order status')
    }
  }

  const handleViewItems = (order: Order) => {
    setSelectedOrder(order)
    setShowItems(true)
  }


  // Filter orders by status
  const filteredOrders = selectedStatus === 'all' 
    ? stats.recentOrders 
    : stats.recentOrders.filter(order => order.status === (selectedStatus as any))

  // Pagination logic for recent orders
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex)

  // Order status counts
  const orderCounts = {
    all: stats.recentOrders.length,
    pending: stats.recentOrders.filter(order => order.status === 'pending').length,
    confirmed: stats.recentOrders.filter(order => order.status === 'confirmed').length,
    processing: stats.recentOrders.filter(order => order.status === 'processing').length,
    shipped: stats.recentOrders.filter(order => order.status === 'shipped').length,
    delivered: stats.recentOrders.filter(order => order.status === 'delivered').length,
    cancelled: stats.recentOrders.filter(order => order.status === 'cancelled').length,
    refunded: stats.recentOrders.filter(order => order.status === 'refunded').length
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1) // Reset to first page when changing items per page
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 w-full max-w-none dashboard-container">
       
      {/* Order Status Filter Dropdown */}
      <div className="flex items-center gap-4 w-full">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <label htmlFor="status-filter" className="text-sm font-medium text-gray-700">
            Filter by Status:
          </label>
        </div>
        <select
          id="status-filter"
          value={selectedStatus}
          onChange={(e) => {
            setSelectedStatus(e.target.value)
            setCurrentPage(1) // Reset to first page when filter changes
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
        >
          <option value="all">All Orders ({orderCounts.all})</option>
          <option value="pending">Pending ({orderCounts.pending})</option>
          <option value="confirmed">Confirmed ({orderCounts.confirmed})</option>
          <option value="processing">Processing ({orderCounts.processing})</option>
          <option value="shipped">Shipped ({orderCounts.shipped})</option>
          <option value="delivered">Delivered ({orderCounts.delivered})</option>
          <option value="cancelled">Cancelled ({orderCounts.cancelled})</option>
          <option value="refunded">Refunded ({orderCounts.refunded})</option>
        </select>
      </div>

            {/* Recent Orders Table */}
            <div className="table-container w-full">
                <div className="table-header flex justify-between items-center">
                    <div>
                        <h3 className="text-xs font-semibold text-gray-900">
                          {selectedStatus === 'all' ? 'All Orders' :
                           selectedStatus === 'pending' ? 'New Orders' :
                           selectedStatus === 'confirmed' ? 'Confirmed Orders' :
                           selectedStatus === 'processing' ? 'In Progress Orders' :
                           selectedStatus === 'shipped' ? 'Shipped Orders' :
                           selectedStatus === 'delivered' ? 'Delivered Orders' :
                           selectedStatus === 'cancelled' ? 'Cancelled Orders' :
                           selectedStatus === 'refunded' ? 'Refunded Orders' : 'Orders'}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          {selectedStatus === 'all' 
                            ? `Showing all ${orderCounts.all} orders`
                            : `Showing ${orderCounts[selectedStatus as keyof typeof orderCounts]} ${selectedStatus} orders`}
                        </p>
                    </div>
                    <Link
                        to="/orders"
                        className="admin-button px-3 py-1.5 rounded-lg text-white font-medium flex items-center text-xs hover:transform hover:scale-105 transition-all"
                    >
                        View All Orders
                        <ArrowRight className="h-3 w-3 ml-1.5" />
                    </Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="admin-table w-full">
                        <thead>
                            <tr>
                                <th className="px-2 py-1 text-left" style={{ fontSize: '10px', fontWeight: '500' }}>Order #</th>
                                <th className="px-2 py-1 text-left" style={{ fontSize: '10px', fontWeight: '500' }}>Customer</th>
                                <th className="px-2 py-1 text-left" style={{ fontSize: '10px', fontWeight: '500' }}>Contact</th>
                                <th className="px-2 py-1 text-left" style={{ fontSize: '10px', fontWeight: '500' }}>Items</th>
                                <th className="px-2 py-1 text-left" style={{ fontSize: '10px', fontWeight: '500' }}>Total</th>
                                <th className="px-2 py-1 text-left" style={{ fontSize: '10px', fontWeight: '500' }}>Status</th>
                                <th className="px-2 py-1 text-left" style={{ fontSize: '10px', fontWeight: '500' }}>Payment</th>
                                <th className="px-2 py-1 text-left" style={{ fontSize: '10px', fontWeight: '500' }}>Date</th>
                                <th className="px-2 py-1 text-left" style={{ fontSize: '10px', fontWeight: '500' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedOrders.length > 0 ? (
                                paginatedOrders.map((order) => (
                                    <tr key={order.id}>
                                        <td className="px-2 py-1">
                                            <div className="space-y-0.2">
                                                <span className="font-semibold text-gray-900 text-xs">#{order.orderNumber}</span>
                                                <p className="text-[10px] text-gray-500">ID: {order.id}</p>
                                            </div>
                                        </td>
                                        <td className="px-2 py-1">
                                            <div className="space-y-0.5">
                                                <p className="font-semibold text-gray-900 text-xs">{order.user.firstName} {order.user.lastName}</p>
                                                <p className="text-[10px] text-gray-500">{order.user.email}</p>
                                            </div>
                                        </td>
                                        <td className="px-2 py-1">
                                            <span className="text-xs text-gray-900">{order.user.phone || 'N/A'}</span>
                                        </td>
                                        <td className="px-2 py-1">
                                            <span className="text-xs text-gray-900">{order.items.length} items</span>
                                        </td>
                                        <td className="px-2 py-1">
                                            <span className="font-semibold text-gray-900 text-xs">{formatCurrency(order.total)}</span>
                                        </td>
                                        <td className="px-2 py-1">
                                            <span className="text-xs text-gray-900 capitalize">{order.status}</span>
                                        </td>
                                        <td className="px-2 py-1">
                                            <span className="text-xs text-gray-900 capitalize">{order.paymentStatus}</span>
                                        </td>
                                        <td className="px-2 py-1">
                                            <div className="space-y-0.5">
                                                <div className="text-xs font-medium text-gray-900">{new Date(order.createdAt).toLocaleDateString()}</div>
                                                <div className="text-[10px] text-gray-500">{new Date(order.createdAt).toLocaleTimeString()}</div>
                                            </div>
                                        </td>
                                        <td className="px-2 py-1">
                                            <div className="flex space-x-1.5">
                                                <button
                                                    onClick={() => handleViewItems(order)}
                                                    className="action-button view text-xs px-2 py-1"
                                                    title="View Items"
                                                >
                                                    <Eye className="h-2.5 w-2.5 mr-0.5" />
                                                    View Items
                                                </button>
                                                <button
                                                    onClick={() => handleUpdateStatus(order)}
                                                    className="action-button edit text-xs px-2 py-1"
                                                    title="Update Status"
                                                >
                                                    <Edit className="h-2.5 w-2.5 mr-0.5" />
                                                    Update Status
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={9} className="px-2 py-4 text-center text-gray-500 text-sm">
                                        {selectedStatus === 'all' 
                                          ? 'No orders found'
                                          : `No ${selectedStatus} orders found`}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                
                {/* Pagination for Recent Orders */}
                {filteredOrders.length > 0 && (
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={filteredOrders.length}
                        itemsPerPage={itemsPerPage}
                        onPageChange={handlePageChange}
                        onItemsPerPageChange={handleItemsPerPageChange}
                        showItemsPerPage={false}
                    />
                )}
            </div>

      {/* View Items Modal */}
      {showItems && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="admin-card rounded-lg p-4 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">Order Items - #{selectedOrder.orderNumber}</h2>
              <button
                onClick={() => {
                  setShowItems(false)
                  setSelectedOrder(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-3">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-600 mb-1"><span className="font-medium">Customer:</span> {selectedOrder.user.firstName} {selectedOrder.user.lastName}</p>
                <p className="text-xs text-gray-600"><span className="font-medium">Total:</span> {formatCurrency(selectedOrder.total)}</p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Items ({selectedOrder.items.length})</h3>
                <div className="space-y-2">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      {item.product?.image && (
                        <img 
                          src={item.product.image} 
                          alt={item.product.name}
                          className="w-16 h-16 rounded-lg object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder.svg'
                          }}
                        />
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm">{item.product?.name || 'Product'}</p>
                        <div className="flex items-center gap-4 mt-1">
                          <p className="text-xs text-gray-600">Quantity: <span className="font-medium">{item.quantity}</span></p>
                          <p className="text-xs text-gray-600">Unit Price: <span className="font-medium">{formatCurrency(item.price)}</span></p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900 text-sm">{formatCurrency(item.total)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium text-gray-900">{formatCurrency(selectedOrder.subtotal)}</span>
                </div>
                {selectedOrder.tax > 0 && (
                  <div className="flex justify-between items-center text-sm mt-1">
                    <span className="text-gray-600">Tax:</span>
                    <span className="font-medium text-gray-900">{formatCurrency(selectedOrder.tax)}</span>
                  </div>
                )}
                {selectedOrder.shipping > 0 && (
                  <div className="flex justify-between items-center text-sm mt-1">
                    <span className="text-gray-600">Shipping:</span>
                    <span className="font-medium text-gray-900">{formatCurrency(selectedOrder.shipping)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-base font-bold mt-2 pt-2 border-t">
                  <span className="text-gray-900">Total:</span>
                  <span className="text-gray-900">{formatCurrency(selectedOrder.total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {showStatusUpdate && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="admin-card rounded-lg p-4 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">Update Order Status</h2>
              <button
                onClick={() => {
                  setShowStatusUpdate(false)
                  setSelectedOrder(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-3">
              <div className="bg-gray-50 p-3 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-1.5 text-sm">Order Details</h3>
                <p className="text-xs text-gray-600">Order #{selectedOrder.orderNumber}</p>
                <p className="text-xs text-gray-600">Customer: {selectedOrder.user.firstName} {selectedOrder.user.lastName}</p>
                <p className="text-xs text-gray-600">Current Status: <span className="capitalize font-medium">{selectedOrder.status}</span></p>
                <p className="text-xs text-gray-600">Total: {formatCurrency(selectedOrder.total)}</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">New Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as Order['status'])}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleStatusUpdate}
                  className="flex-1 admin-button px-4 py-2 rounded-lg text-white font-medium text-sm hover:transform hover:scale-105 transition-all"
                >
                  Update Status
                </button>
                <button
                  onClick={() => {
                    setShowStatusUpdate(false)
                    setSelectedOrder(null)
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium text-sm hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default Dashboard
