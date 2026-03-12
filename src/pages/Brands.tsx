import { useState, useEffect } from 'react'
import { adminApiService, Brand } from '../services/api'
import BrandModal from '../components/BrandModal'
import DeleteBrandModal from '../components/DeleteBrandModal'
import { 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  Package,
  Tag
} from 'lucide-react'

const Brands = () => {
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null)
  const [categories, setCategories] = useState<any[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('Loading brands data...')
      const [brandsData, categoriesData] = await Promise.all([
        adminApiService.getBrands(),
        adminApiService.getCategories()
      ])
      console.log('Brands data loaded:', brandsData)
      console.log('Categories data loaded:', categoriesData)
      setBrands(brandsData)
      setCategories(categoriesData)
    } catch (err) {
      console.error('Error loading brands:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  // Get unique categories from brands
  const uniqueCategories = [...new Set(brands.map(brand => brand.category?.name || 'Uncategorized').filter(Boolean))].sort()

  // Filter brands based on search and category
  const filteredBrands = brands.filter(brand => {
    const brandCategory = brand.category?.name || 'Uncategorized'
    const matchesSearch = brand.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         brandCategory.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || brandCategory === selectedCategory
    return matchesSearch && matchesCategory
  })

  // Pagination
  const totalPages = Math.ceil(filteredBrands.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedBrands = filteredBrands.slice(startIndex, startIndex + itemsPerPage)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleItemsPerPageChange = (items: number) => {
    setItemsPerPage(items)
    setCurrentPage(1)
  }

  // CRUD handlers
  const handleCreateBrand = async (brandData: Omit<Brand, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newBrand = await adminApiService.createBrand(brandData)
      setBrands(prev => [...prev, newBrand])
      setShowCreateModal(false)
    } catch (err) {
      console.error('Error creating brand:', err)
      setError(err instanceof Error ? err.message : 'Failed to create brand')
    }
  }

  const handleEditBrand = async (id: number, brandData: Partial<Omit<Brand, 'id' | 'createdAt' | 'updatedAt'>>) => {
    try {
      const updatedBrand = await adminApiService.updateBrand(id, brandData)
      setBrands(prev => prev.map(brand => brand.id === id ? updatedBrand : brand))
      setShowEditModal(false)
      setSelectedBrand(null)
    } catch (err) {
      console.error('Error updating brand:', err)
      setError(err instanceof Error ? err.message : 'Failed to update brand')
    }
  }

  const handleDeleteBrand = async (id: number) => {
    try {
      await adminApiService.deleteBrand(id)
      setBrands(prev => prev.filter(brand => brand.id !== id))
      setShowDeleteModal(false)
      setSelectedBrand(null)
    } catch (err) {
      console.error('Error deleting brand:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete brand')
    }
  }

  const openEditModal = (brand: Brand) => {
    if (!brand.id) {
      console.error('Cannot edit brand without ID:', brand)
      setError('Cannot edit this brand - missing ID')
      return
    }
    console.log('🏷️ [Brands] Opening edit modal for brand:', brand)
    setSelectedBrand(brand)
    setShowEditModal(true)
  }

  const openDeleteModal = (brand: Brand) => {
    if (!brand.id) {
      console.error('Cannot delete brand without ID:', brand)
      setError('Cannot delete this brand - missing ID')
      return
    }
    console.log('🏷️ [Brands] Opening delete modal for brand:', brand)
    setSelectedBrand(brand)
    setShowDeleteModal(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-wine mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold text-wine mb-2">Loading Brands...</h1>
          <p>Please wait while we fetch the brand data.</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-red-600 mb-2">Error Loading Brands</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={loadData}
            className="bg-wine text-white px-6 py-2 rounded-lg hover:bg-wine-light transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Brands Management</h1>
              <p className="text-gray-600 mt-1">Manage and view all brands by category</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-500">
                {filteredBrands.length} brands found
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-wine text-white px-4 py-2 rounded-lg hover:bg-wine-light transition-colors flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Brand
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </h2>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Brands
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search by brand name or category..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wine focus:border-transparent"
                  />
                </div>
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wine focus:border-transparent"
                >
                  <option value="all">All Categories</option>
                  {uniqueCategories.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Brands Table */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Brand Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Products Count
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedBrands.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                      <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium">No brands found</p>
                      <p className="text-sm">Try adjusting your search or filter criteria.</p>
                    </td>
                  </tr>
                ) : (
                  paginatedBrands.map((brand) => (
                    <tr key={`${brand.id || brand.name}-${brand.category?.name || 'uncategorized'}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-wine/10 flex items-center justify-center">
                              <Tag className="h-5 w-5 text-wine" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {brand.name}
                            </div>
                            {brand.description && (
                              <div className="text-xs text-gray-500 truncate max-w-xs">
                                {brand.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {brand.category?.name || 'Uncategorized'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <Package className="h-4 w-4 text-gray-400 mr-2" />
                          {brand.productCount || 0} products
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            className="text-wine hover:text-wine-light p-1 rounded"
                            title="View Products"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(brand)}
                            className="text-blue-600 hover:text-blue-800 p-1 rounded"
                            title="Edit Brand"
                            disabled={!brand.id}
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openDeleteModal(brand)}
                            className="text-red-600 hover:text-red-800 p-1 rounded"
                            title="Delete Brand"
                            disabled={!brand.id}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                    <span className="font-medium">
                      {Math.min(startIndex + itemsPerPage, filteredBrands.length)}
                    </span>{' '}
                    of <span className="font-medium">{filteredBrands.length}</span> results
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <select
                    value={itemsPerPage}
                    onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                    className="text-sm border border-gray-300 rounded-md px-2 py-1"
                  >
                    <option value={5}>5 per page</option>
                    <option value={10}>10 per page</option>
                    <option value={25}>25 per page</option>
                    <option value={50}>50 per page</option>
                  </select>
                  <div className="flex space-x-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-1 text-sm rounded ${
                          page === currentPage
                            ? 'bg-wine text-white'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Brand Modal */}
      {showCreateModal && (
        <BrandModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateBrand}
          categories={categories}
          title="Create New Brand"
        />
      )}

      {/* Edit Brand Modal */}
      {showEditModal && selectedBrand && (
        <BrandModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false)
            setSelectedBrand(null)
          }}
          onSubmit={(data) => handleEditBrand(selectedBrand.id!, data)}
          categories={categories}
          title="Edit Brand"
          initialData={selectedBrand}
        />
      )}

      {/* Delete Brand Modal */}
      {showDeleteModal && selectedBrand && (
        <DeleteBrandModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false)
            setSelectedBrand(null)
          }}
          onConfirm={() => handleDeleteBrand(selectedBrand.id!)}
          brandName={selectedBrand.name}
        />
      )}
    </div>
  )
}

export default Brands
