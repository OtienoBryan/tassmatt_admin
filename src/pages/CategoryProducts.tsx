import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { adminApiService, Category, Product } from '../services/api'
import { Edit, ArrowLeft, Search } from 'lucide-react'

const CategoryProducts: React.FC = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [category, setCategory] = useState<Category | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadData()
  }, [id])

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredProducts(products)
    } else {
      const filtered = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.brand.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredProducts(filtered)
    }
  }, [searchTerm, products])

  const loadData = async () => {
    try {
      setLoading(true)
      const [categoriesData, allProducts] = await Promise.all([
        adminApiService.getCategories(),
        adminApiService.getProducts()
      ])
      
      const foundCategory = categoriesData.find(cat => cat.id === Number(id))
      if (foundCategory) {
        setCategory(foundCategory)
        const categoryProducts = allProducts.filter(product =>
          product.categoryId === foundCategory.id ||
          product.categories?.some(c => c.id === foundCategory.id)
        )
        setProducts(categoryProducts)
        setFilteredProducts(categoryProducts)
      }
    } catch (error) {
      console.error('Error loading data:', error)
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

  const handleEditProduct = (product: Product) => {
    navigate(`/products/edit/${product.id}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!category) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Category not found.</p>
        <button
          onClick={() => navigate('/categories')}
          className="mt-4 admin-button px-4 py-2 rounded-lg text-white text-sm"
        >
          Back to Categories
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/categories')}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Products in "{category.name}"</h1>
            <p className="text-xs text-gray-500 mt-1">{filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="admin-card rounded-xl p-4 shadow-lg">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="admin-input w-full pl-8 pr-3 py-2 text-sm rounded-lg focus:outline-none"
          />
        </div>
      </div>

      {filteredProducts.length > 0 ? (
        <div className="table-container">
          <div className="overflow-x-auto">
            <table className="admin-table w-full">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium">Image</th>
                  <th className="px-4 py-2 text-left text-xs font-medium">Product Name</th>
                  <th className="px-4 py-2 text-left text-xs font-medium">Price</th>
                  <th className="px-4 py-2 text-left text-xs font-medium">Status</th>
                  <th className="px-4 py-2 text-left text-xs font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="bg-gray-50">
                    <td className="px-4 py-2">
                      {product.image ? (
                        <img 
                          src={product.image} 
                          alt={product.name}
                          className="w-12 h-12 rounded object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder.svg'
                          }}
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-400">
                          No Image
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <p className="text-sm font-medium text-gray-900">{product.name}</p>
                    </td>
                    <td className="px-4 py-2">
                      <p className="text-sm font-medium text-gray-900">{formatCurrency(product.price)}</p>
                    </td>
                    <td className="px-4 py-2">
                      <span className={`status-badge ${
                        product.isActive ? 'active' : 'inactive'
                      }`}>
                        {product.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => handleEditProduct(product)}
                        className="action-button edit text-xs px-2 py-1"
                        title="Edit Product"
                      >
                        <Edit className="h-3 w-3 mr-0.5" />
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500">No products found in this category.</p>
        </div>
      )}
    </div>
  )
}

export default CategoryProducts
