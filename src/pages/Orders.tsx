import { useState, useEffect } from 'react'
import { adminApiService, Order } from '../services/api'
import { Search, Eye, Trash2, Filter } from 'lucide-react'
import Pagination from '../components/ui/Pagination'

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const ordersData = await adminApiService.getOrders()
      setOrders(ordersData)
    } catch (error) {
      console.error('Error loading orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (orderId: number, status: Order['status'], paymentStatus: Order['paymentStatus']) => {
    try {
      await adminApiService.updateOrderStatus(orderId, status, paymentStatus)
      loadData()
    } catch (error) {
      console.error('Error updating order status:', error)
    }
  }

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this order?')) {
      try {
        await adminApiService.deleteOrder(id)
        loadData()
      } catch (error) {
        console.error('Error deleting order:', error)
      }
    }
  }

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order)
    setShowDetails(true)
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.user.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    // If no status filter is selected, show all orders
    if (!statusFilter || statusFilter === '') {
      return matchesSearch
    }
    
    // Otherwise, match the status (case-insensitive)
    const matchesStatus = order.status?.toLowerCase() === statusFilter.toLowerCase()
    return matchesSearch && matchesStatus
  })

  // Pagination logic
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1) // Reset to first page when changing items per page
  }

  const formatCurrency = (amount: number) => {
    if (isNaN(amount) || amount === null || amount === undefined) {
      return '0.00'
    }
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  const totalAmount = filteredOrders.reduce((sum, order) => {
    // Try to get total from order.total, or calculate from subtotal + tax + shipping
    let orderTotal = 0
    if (order.total !== undefined && order.total !== null) {
      orderTotal = typeof order.total === 'number' ? order.total : parseFloat(String(order.total)) || 0
    } else if (order.subtotal !== undefined) {
      // Fallback: calculate from subtotal + tax + shipping
      const subtotal = typeof order.subtotal === 'number' ? order.subtotal : parseFloat(String(order.subtotal)) || 0
      const tax = typeof order.tax === 'number' ? order.tax : parseFloat(String(order.tax)) || 0
      const shipping = typeof order.shipping === 'number' ? order.shipping : parseFloat(String(order.shipping)) || 0
      orderTotal = subtotal + tax + shipping
    }
    return sum + (isNaN(orderTotal) ? 0 : orderTotal)
  }, 0)

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-lg font-bold text-gray-900">Orders</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="admin-card rounded-lg p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Total Orders</p>
              <p className="text-xl font-bold text-gray-900">{filteredOrders.length}</p>
            </div>
          </div>
        </div>
        <div className="admin-card rounded-lg p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Total Amount</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(totalAmount)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="admin-card rounded-lg p-4 shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="admin-input w-full pl-10 pr-4 py-2 rounded-lg focus:outline-none text-xs"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setCurrentPage(1) // Reset to first page when filter changes
              }}
              className="admin-input w-full pl-10 pr-4 py-2 rounded-lg focus:outline-none text-xs"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
          <div className="text-xs text-gray-600 flex items-center">
            Showing {filteredOrders.length} of {orders.length} orders
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="table-container">
        <div className="table-header flex justify-between items-center">
          <div>
            <h3 className="text-xs font-semibold text-gray-900">Orders Management</h3>
            <p className="text-xs text-gray-500 mt-1">Track and manage customer orders efficiently</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="admin-table w-full">
            <thead>
              <tr>
                <th className="px-2 py-1 text-left" style={{ fontSize: '10px', fontWeight: '500' }}>Order #</th>
                <th className="px-2 py-1 text-left" style={{ fontSize: '10px', fontWeight: '500' }}>Customer</th>
                <th className="px-2 py-1 text-left" style={{ fontSize: '10px', fontWeight: '500' }}>Contact</th>
                <th className="px-2 py-1 text-left" style={{ fontSize: '10px', fontWeight: '500' }}>Financial</th>
                <th className="px-2 py-1 text-left" style={{ fontSize: '10px', fontWeight: '500' }}>Status</th>
                <th className="px-2 py-1 text-left" style={{ fontSize: '10px', fontWeight: '500' }}>Shipping</th>
                <th className="px-2 py-1 text-left" style={{ fontSize: '10px', fontWeight: '500' }}>Timeline</th>
                <th className="px-2 py-1 text-left" style={{ fontSize: '10px', fontWeight: '500' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedOrders.map((order) => (
                <tr key={order.id}>
                  <td className="px-2 py-1">
                    <div className="space-y-0.2">
                      <span className="font-semibold text-gray-900 text-xs">#{order.orderNumber}</span>        
                    </div>
                  </td>
                  <td className="px-2 py-1">
                    <div className="space-y-0.2">
                      <p className="font-semibold text-gray-900 text-xs">{order.user.firstName} {order.user.lastName}</p> 
                    </div>
                  </td>
                  <td className="px-2 py-1">
                    <div className="space-y-0.2">
                      <p className="text-xs text-gray-900">{order.user.phone || 'N/A'}</p>
                    </div>
                  </td>
                  <td className="px-2 py-1">
                    <span className="font-semibold text-gray-900 text-xs">{formatCurrency(order.total)}</span>
                  </td>
                  <td className="px-2 py-1">
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusUpdate(order.id, e.target.value as Order['status'], order.paymentStatus)}
                      className="text-xs text-gray-900 capitalize border-none outline-none cursor-pointer bg-transparent"
                      style={{ border: 'none', outline: 'none', cursor: 'pointer' }}
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="refunded">Refunded</option>
                    </select>
                  </td>
                  <td className="px-2 py-1">
                    <div className="space-y-0.2">
                      <p className="text-xs text-gray-900 max-w-xs truncate" title={order.shippingAddress}>
                        {order.shippingAddress}
                      </p>
                      {order.notes && (
                        <p className="text-[10px] text-gray-500 max-w-xs truncate" title={order.notes}>
                          Note: {order.notes}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-2 py-1">
                    <div className="space-y-0.2">
                      <div className="text-xs font-medium text-gray-900">{new Date(order.createdAt).toLocaleDateString()}</div>
                      <div className="text-[10px] text-gray-500">{new Date(order.createdAt).toLocaleTimeString()}</div>
                    </div>
                  </td>
                  <td className="px-2 py-1">
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleViewDetails(order)}
                        className="action-button view text-[10px] px-1.5 py-0.5"
                        style={{ fontSize: '10px', padding: '0.25rem 0.5rem' }}
                      >
                        <Eye className="h-2 w-2 mr-0.5" />
                        View
                      </button>
                      <button
                        onClick={() => handleDelete(order.id)}
                        className="action-button delete text-[10px] px-1.5 py-0.5"
                        style={{ fontSize: '10px', padding: '0.25rem 0.5rem' }}
                      >
                        <Trash2 className="h-2 w-2 mr-0.5" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 border-t">
                <td colSpan={3} className="px-2 py-2 text-right font-semibold text-gray-900 text-xs">
                  Total:
                </td>
                <td className="px-2 py-2 font-semibold text-gray-900 text-xs">
                  {formatCurrency(totalAmount)}
                </td>
                <td colSpan={4} className="px-2 py-2"></td>
              </tr>
            </tfoot>
          </table>
        </div>
        
        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredOrders.length}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
        />
      </div>

      {filteredOrders.length === 0 && (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-3">
            <Search className="h-8 w-8 mx-auto" />
          </div>
          <h3 className="text-sm font-medium text-gray-900 mb-1">No orders found</h3>
          <p className="text-xs text-gray-600">
            {searchTerm || statusFilter ? 'Try adjusting your search terms.' : 'No orders have been placed yet.'}
          </p>
        </div>
      )}

      {/* Order Details Modal */}
      {showDetails && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="admin-card rounded-lg p-4 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">Order Details</h2>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Order Info */}
              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1.5">Order Information</h3>
                  <div className="bg-gray-50 p-3 rounded-lg space-y-1.5">
                    <p className="text-xs"><span className="font-medium">Order #:</span> {selectedOrder.orderNumber}</p>
                    <p className="text-xs"><span className="font-medium">Date:</span> {new Date(selectedOrder.createdAt).toLocaleString()}</p>
                    <p className="text-xs"><span className="font-medium">Status:</span> 
                      <span className="ml-2 text-xs text-gray-900 capitalize">
                        {selectedOrder.status}
                      </span>
                    </p>
                    <p className="text-xs"><span className="font-medium">Payment Status:</span> 
                      <span className="ml-2 text-xs text-gray-900 capitalize">
                        {selectedOrder.paymentStatus}
                      </span>
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1.5">Customer Information</h3>
                  <div className="bg-gray-50 p-3 rounded-lg space-y-1.5">
                    <p className="text-xs"><span className="font-medium">Name:</span> {selectedOrder.user.firstName} {selectedOrder.user.lastName}</p>
                    <p className="text-xs"><span className="font-medium">Email:</span> {selectedOrder.user.email}</p>
                    {selectedOrder.user.phone && (
                      <p className="text-xs"><span className="font-medium">Phone:</span> {selectedOrder.user.phone}</p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1.5">Shipping Address</h3>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs">{selectedOrder.shippingAddress}</p>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1.5">Order Items</h3>
                <div className="space-y-2">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                      <img 
                        src={item.product.image || '/placeholder.svg'} 
                        alt={item.product.name}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-xs">{item.product.name}</p>
                        <p className="text-[10px] text-gray-600">Qty: {item.quantity}</p>
                        <p className="text-[10px] text-gray-600">Price: {formatCurrency(item.price)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900 text-xs">{formatCurrency(item.total)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(selectedOrder.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Tax:</span>
                    <span>{formatCurrency(selectedOrder.tax)}</span>
                  </div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Shipping:</span>
                    <span>{formatCurrency(selectedOrder.shipping)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-sm border-t pt-1.5">
                    <span>Total:</span>
                    <span>{formatCurrency(selectedOrder.total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Orders
