import { useState, useEffect } from 'react'
import { adminApiService, Rider } from '../services/api'
import { Search, Edit, Trash2, UserCheck, UserX, Phone, DollarSign, Plus, Eye } from 'lucide-react'
import Pagination from '../components/ui/Pagination'

const Riders: React.FC = () => {
  const [riders, setRiders] = useState<Rider[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedRider, setSelectedRider] = useState<Rider | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [editingRider, setEditingRider] = useState<Rider | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    cashLimit: 0,
    isActive: true
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const ridersData = await adminApiService.getRiders()
      setRiders(ridersData)
    } catch (error) {
      console.error('Error loading riders:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleStatus = async (id: number) => {
    try {
      await adminApiService.toggleRiderStatus(id)
      loadData()
    } catch (error) {
      console.error('Error toggling rider status:', error)
    }
  }

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this rider?')) {
      try {
        await adminApiService.deleteRider(id)
        loadData()
      } catch (error) {
        console.error('Error deleting rider:', error)
      }
    }
  }

  const handleViewDetails = (rider: Rider) => {
    setSelectedRider(rider)
    setShowDetails(true)
  }

  const handleAddRider = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await adminApiService.createRider({ ...formData, isActive: true })
      setFormData({ name: '', contact: '', cashLimit: 0, isActive: true })
      setShowAddForm(false)
      loadData()
    } catch (error) {
      console.error('Error creating rider:', error)
    }
  }

  const handleEditRider = (rider: Rider) => {
    setEditingRider(rider)
    setFormData({
      name: rider.name,
      contact: rider.contact,
      cashLimit: rider.cashLimit,
      isActive: rider.isActive
    })
    setShowEditForm(true)
  }

  const handleUpdateRider = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingRider) return
    
    try {
      await adminApiService.updateRider(editingRider.id, formData)
      setFormData({ name: '', contact: '', cashLimit: 0, isActive: true })
      setEditingRider(null)
      setShowEditForm(false)
      loadData()
    } catch (error) {
      console.error('Error updating rider:', error)
    }
  }

  const filteredRiders = riders.filter(rider => {
    const matchesSearch = rider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rider.contact.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = !statusFilter || (statusFilter === 'active' ? rider.isActive : !rider.isActive)
    return matchesSearch && matchesStatus
  })

  // Pagination logic
  const totalPages = Math.ceil(filteredRiders.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedRiders = filteredRiders.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1) // Reset to first page when changing items per page
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Riders</h1>
        <button
          onClick={() => setShowAddForm(true)}
          className="admin-button px-4 py-2 rounded-lg text-white font-semibold flex items-center hover:transform hover:scale-105 transition-all"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Rider
        </button>
      </div>

      {/* Filters */}
      <div className="admin-card rounded-xl p-6 shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search riders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="admin-input w-full pl-10 pr-4 py-3 rounded-lg focus:outline-none"
            />
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="admin-input w-full px-4 py-3 rounded-lg focus:outline-none"
            >
              <option value="">All Riders</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="text-sm text-gray-600 flex items-center">
            Showing {filteredRiders.length} of {riders.length} riders
          </div>
        </div>
      </div>

      {/* Riders Table */}
      <div className="table-container">
        <div className="table-header">
          <h3 className="table-title">Riders Management</h3>
          <p className="table-subtitle">Manage delivery riders and their cash limits</p>
        </div>
        <div className="overflow-x-auto">
          <table className="admin-table w-full">
            <thead>
              <tr>
                <th className="px-6 py-4 text-left">Rider</th>
                <th className="px-6 py-4 text-left">Contact</th>
                <th className="px-6 py-4 text-left">Cash Limit</th>
                <th className="px-6 py-4 text-left">Status</th>
                <th className="px-6 py-4 text-left">Added</th>
                <th className="px-6 py-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRiders.map((rider) => (
                <tr key={rider.id}>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="table-avatar">
                        {rider.name.charAt(0)}
                      </div>
                      <div className="space-y-1">
                        <p className="font-semibold text-gray-900 text-sm">{rider.name}</p>
                        <p className="text-xs text-gray-500">ID: {rider.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <Phone className="h-3 w-3 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">{rider.contact}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <DollarSign className="h-3 w-3 text-gray-400 mr-2" />
                      <span className="text-sm font-medium text-gray-900">{formatCurrency(rider.cashLimit)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`status-badge ${
                      rider.isActive ? 'active' : 'inactive'
                    }`}>
                      {rider.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <span className="text-sm font-medium text-gray-900">{formatDate(rider.createdAt)}</span>
                      <div className="text-xs text-gray-500">Added {new Date(rider.createdAt).getFullYear()}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewDetails(rider)}
                        className="action-button view"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </button>
                      <button
                        onClick={() => handleEditRider(rider)}
                        className="action-button edit"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggleStatus(rider.id)}
                        className={`action-button ${
                          rider.isActive ? 'delete' : 'edit'
                        }`}
                      >
                        {rider.isActive ? <UserX className="h-3 w-3 mr-1" /> : <UserCheck className="h-3 w-3 mr-1" />}
                        {rider.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDelete(rider.id)}
                        className="action-button delete"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredRiders.length}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
        />
      </div>

      {filteredRiders.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Search className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No riders found</h3>
          <p className="text-gray-600">
            {searchTerm || statusFilter ? 'Try adjusting your search terms.' : 'No riders have been added yet.'}
          </p>
        </div>
      )}

      {/* Add Rider Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="admin-card rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Add New Rider</h2>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAddRider} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="admin-input w-full px-4 py-3 rounded-lg focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contact</label>
                <input
                  type="tel"
                  value={formData.contact}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                  className="admin-input w-full px-4 py-3 rounded-lg focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cash Limit</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.cashLimit}
                  onChange={(e) => setFormData({ ...formData, cashLimit: parseFloat(e.target.value) || 0 })}
                  className="admin-input w-full px-4 py-3 rounded-lg focus:outline-none"
                  required
                />
              </div>
              <div className="flex space-x-4 pt-4">
                <button
                  type="submit"
                  className="admin-button px-4 py-2 rounded-lg text-white font-semibold flex-1"
                >
                  Add Rider
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold flex-1 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Rider Modal */}
      {showEditForm && editingRider && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="admin-card rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Edit Rider</h2>
              <button
                onClick={() => {
                  setShowEditForm(false)
                  setEditingRider(null)
                  setFormData({ name: '', contact: '', cashLimit: 0, isActive: true })
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleUpdateRider} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="admin-input w-full px-4 py-3 rounded-lg focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contact</label>
                <input
                  type="tel"
                  value={formData.contact}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                  className="admin-input w-full px-4 py-3 rounded-lg focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cash Limit</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.cashLimit}
                  onChange={(e) => setFormData({ ...formData, cashLimit: parseFloat(e.target.value) || 0 })}
                  className="admin-input w-full px-4 py-3 rounded-lg focus:outline-none"
                  required
                />
              </div>
              <div className="flex space-x-4 pt-4">
                <button
                  type="submit"
                  className="admin-button px-4 py-2 rounded-lg text-white font-semibold flex-1"
                >
                  Update Rider
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditForm(false)
                    setEditingRider(null)
                    setFormData({ name: '', contact: '', cashLimit: 0, isActive: true })
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold flex-1 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rider Details Modal */}
      {showDetails && selectedRider && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="admin-card rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Rider Details</h2>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {/* Rider Profile */}
              <div className="flex items-center space-x-4">
                <div className="h-20 w-20 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                  {selectedRider.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {selectedRider.name}
                  </h3>
                  <p className="text-gray-600">Rider ID: {selectedRider.id}</p>
                  <div className="flex space-x-2 mt-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      selectedRider.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedRider.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Contact Information</h4>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex items-center">
                    <Phone className="h-5 w-5 text-gray-400 mr-3" />
                    <span className="text-gray-900">{selectedRider.contact}</span>
                  </div>
                </div>
              </div>

              {/* Financial Information */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Financial Information</h4>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cash Limit:</span>
                    <span className="text-gray-900 font-semibold">{formatCurrency(selectedRider.cashLimit)}</span>
                  </div>
                </div>
              </div>

              {/* Account Information */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Account Information</h4>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Added On:</span>
                    <span className="text-gray-900">{formatDate(selectedRider.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Updated:</span>
                    <span className="text-gray-900">{formatDate(selectedRider.updatedAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      selectedRider.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedRider.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-4">
                <button
                  onClick={() => {
                    setShowDetails(false)
                    handleEditRider(selectedRider)
                  }}
                  className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg font-medium hover:bg-blue-200 transition-colors"
                >
                  <Edit className="h-4 w-4 inline mr-2" />
                  Edit Rider
                </button>
                <button
                  onClick={() => handleToggleStatus(selectedRider.id)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedRider.isActive
                      ? 'bg-red-100 text-red-800 hover:bg-red-200'
                      : 'bg-green-100 text-green-800 hover:bg-green-200'
                  }`}
                >
                  {selectedRider.isActive ? (
                    <>
                      <UserX className="h-4 w-4 inline mr-2" />
                      Deactivate Rider
                    </>
                  ) : (
                    <>
                      <UserCheck className="h-4 w-4 inline mr-2" />
                      Activate Rider
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleDelete(selectedRider.id)}
                  className="px-4 py-2 bg-red-100 text-red-800 rounded-lg font-medium hover:bg-red-200 transition-colors"
                >
                  <Trash2 className="h-4 w-4 inline mr-2" />
                  Delete Rider
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Riders
