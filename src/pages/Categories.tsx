import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminApiService, Category } from '../services/api'
import { Plus, Edit, Trash2, Search, Eye } from 'lucide-react'
import Pagination from '../components/ui/Pagination'

const Categories: React.FC = () => {
  const navigate = useNavigate()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [formData, setFormData] = useState({
    name: '',
    isActive: true
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const categoriesData = await adminApiService.getCategories()
      setCategories(categoriesData)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const categoryData = {
        ...formData,
        description: '',
        image: ''
      }
      if (editingCategory) {
        await adminApiService.updateCategory(editingCategory.id, categoryData)
      } else {
        await adminApiService.createCategory(categoryData)
      }

      setShowModal(false)
      setEditingCategory(null)
      resetForm()
      loadData()
    } catch (error) {
      console.error('Error saving category:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      isActive: true
    })
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      isActive: category.isActive
    })
    setShowModal(true)
  }

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this category?')) {
      try {
        await adminApiService.deleteCategory(id)
        loadData()
      } catch (error) {
        console.error('Error deleting category:', error)
      }
    }
  }

  const handleViewProducts = (category: Category) => {
    navigate(`/categories/${category.id}/products`)
  }


  const openModal = () => {
    setEditingCategory(null)
    resetForm()
    setShowModal(true)
  }


  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Pagination logic
  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedCategories = filteredCategories.slice(startIndex, endIndex)

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
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-900">Categories</h1>
        <button
          onClick={openModal}
          className="admin-button px-4 py-2 rounded-lg text-white text-sm font-medium focus:outline-none flex items-center"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Add Category
        </button>
      </div>

      {/* Search */}
      <div className="admin-card rounded-xl p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="admin-input w-full pl-8 pr-3 py-2 text-sm rounded-lg focus:outline-none"
            />
          </div>
          <div className="text-xs text-gray-600">
            Showing {filteredCategories.length} of {categories.length} categories
          </div>
        </div>
      </div>

      {/* Categories Table */}
      <div className="table-container">
        <div className="overflow-x-auto">
          <table className="admin-table w-full">
            <thead>
              <tr>
                <th className="px-6 py-2 text-left">Category Details</th>
                <th className="px-6 py-2 text-left">Status</th>
                <th className="px-6 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedCategories.map((category) => (
                <tr key={category.id} className="bg-gray-50">
                  <td className="px-6 py-2">
                    <p className="font-semibold text-gray-900 text-sm">{category.name}</p>
                  </td>
                  <td className="px-6 py-2">
                    <span className={`status-badge ${
                      category.isActive ? 'active' : 'inactive'
                    }`}>
                      {category.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-2">
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleViewProducts(category)}
                        className="action-button view text-xs px-2 py-1"
                        title="View Products"
                      >
                        <Eye className="h-3 w-3 mr-0.5" />
                        View Products
                      </button>
                      <button
                        onClick={() => handleEdit(category)}
                        className="action-button edit text-xs px-2 py-1"
                      >
                        <Edit className="h-3 w-3 mr-0.5" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(category.id)}
                        className="action-button delete text-xs px-2 py-1"
                      >
                        <Trash2 className="h-3 w-3 mr-0.5" />
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
          totalItems={filteredCategories.length}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
        />
      </div>

      {filteredCategories.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Search className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No categories found</h3>
          <p className="text-gray-600">
            {searchTerm ? 'Try adjusting your search terms.' : 'Get started by creating your first category.'}
          </p>
        </div>
      )}

      {/* Category Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="admin-card rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingCategory ? 'Edit Category' : 'Add Category'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="admin-input w-full px-4 py-3 rounded-lg focus:outline-none"
                  required
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="mr-2"
                />
                <label className="text-sm font-medium text-gray-700">Active</label>
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-button px-6 py-3 rounded-lg text-white font-semibold"
                >
                  {editingCategory ? 'Update' : 'Create'} Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}

export default Categories
