import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminApiService, Product, Category } from '../services/api'
import { Plus, Edit, Trash2, Search, Filter } from 'lucide-react'
import Pagination from '../components/ui/Pagination'

const Products: React.FC = () => {
  const navigate = useNavigate()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      console.log('🔄 [Frontend] Loading data...')
      
      const [productsData, categoriesData] = await Promise.all([
        adminApiService.getProducts(),
        adminApiService.getCategories()
      ])
      
      setProducts(productsData)
      setCategories(categoriesData)
    } catch (error) {
      console.error('❌ [Frontend] Error loading data:', error)
      console.error('  Error details:', error instanceof Error ? error.message : String(error))
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (product: Product) => {
    navigate(`/products/edit/${product.id}`)
  }

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        await adminApiService.deleteProduct(id)
        loadData()
      } catch (error) {
        console.error('Error deleting product:', error)
      }
    }
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.brand.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory =
      !selectedCategory ||
      product.categoryId.toString() === selectedCategory ||
      product.categories?.some(c => String(c.id) === selectedCategory)
    return matchesSearch && matchesCategory
  })

  // Pagination logic
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1) // Reset to first page when changing items per page
  }

  const formatCurrency = (amount: number) => {
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

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold text-gray-900">Products</h1>
        <button
          onClick={() => navigate('/products/new')}
          className="admin-button px-4 py-2 rounded-lg text-white text-sm font-medium focus:outline-none flex items-center"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="admin-card rounded-xl p-4 shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="admin-input w-full pl-8 pr-3 py-2 text-sm rounded-lg focus:outline-none"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="admin-input w-full pl-8 pr-3 py-2 text-sm rounded-lg focus:outline-none"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div className="text-xs text-gray-600 flex items-center">
            Showing {filteredProducts.length} of {products.length} products
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="table-container">
        <div className="table-header">
          <h3 className="text-sm font-semibold text-gray-900">Products Overview</h3>
          <p className="text-xs text-gray-500">Manage your product inventory and details</p>
        </div>
        <div className="overflow-x-auto">
          <table className="admin-table w-full">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Image</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Product Details</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Category</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Pricing</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedProducts.map((product) => (
                <tr key={product.id}>
                  <td className="px-4 py-3">
                    {product.image ? (
                      <img 
                        src={product.image} 
                        alt={product.name}
                        className="w-12 h-12 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => setEnlargedImage(product.image)}
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-400">
                        No Image
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900 text-xs">{product.name}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs text-gray-700">
                      {(() => {
                        const categoryNames = [
                          ...(product.categories?.map(c => c.name) || []),
                        ]
                        const primary = product.category?.name || categoryNames[0] || 'N/A'
                        const extraCount = Math.max(0, categoryNames.length - 1)
                        return extraCount > 0 ? `${primary} (+${extraCount})` : primary
                      })()}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      <div className="flex flex-col gap-0.5 p-1.5 bg-gray-50 rounded border border-gray-200">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-blue-600 text-xs">{formatCurrency(product.price)}</span>
                        </div>
                        {product.originalPrice && (
                          <div className="flex items-center gap-1 flex-wrap">
                            <span className="text-[10px] text-gray-500 line-through">
                              {formatCurrency(product.originalPrice)}
                            </span>
                            <span className="text-[10px] text-green-600 font-medium">
                              Save {formatCurrency(product.originalPrice - product.price)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex space-x-1.5">
                      <button
                        onClick={() => handleEdit(product)}
                        className="action-button edit text-xs px-2 py-1"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="action-button delete text-xs px-2 py-1"
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
          totalItems={filteredProducts.length}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
        />
      </div>

      {/* Enlarged Image Modal */}
      {enlargedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50"
          onClick={() => setEnlargedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <button
              onClick={() => setEnlargedImage(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
            >
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img 
              src={enlargedImage} 
              alt="Enlarged product"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

    </div>
  )
}

export default Products
