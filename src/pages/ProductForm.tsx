import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { adminApiService, Category } from '../services/api'
import { ArrowLeft } from 'lucide-react'
import CloudinaryUpload from '../components/CloudinaryUpload'
import { CloudinaryUploadResult } from '../services/cloudinary'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'

const ProductForm: React.FC = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEditing = !!id

  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [_uploadedImage, setUploadedImage] = useState<CloudinaryUploadResult | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    originalPrice: '',
    image: '',
    images: [] as string[],
    tags: [] as string[],
    stockStatus: 'in_stock' as 'in_stock' | 'out_of_stock',
    isActive: true,
    isFeatured: false,
    isPopular: false,
    requiresAgeVerification: false,
    categoryIds: [] as string[]
  })

  useEffect(() => {
    loadData()
  }, [id])

  const loadData = async () => {
    try {
      setLoading(true)
      const categoriesData = await adminApiService.getCategories()
      setCategories(categoriesData)

      if (isEditing && id) {
        const product = await adminApiService.getProductById(parseInt(id))
        if (product) {
          const categoryIds =
            (product.categoryIds && product.categoryIds.length > 0)
              ? product.categoryIds.map(String)
              : (product.categories && product.categories.length > 0)
                ? product.categories.map((c: any) => String(c.id))
                : (product.categoryId ? [String(product.categoryId)] : [])

          const formData = {
            name: product.name || '',
            description: product.description || '',
            price: product.price ? product.price.toString() : '',
            originalPrice: product.originalPrice ? product.originalPrice.toString() : '',
            image: product.image || '',
            images: product.images || [],
            tags: product.tags || [],
            stockStatus: (product.stock && product.stock > 0) ? 'in_stock' as const : 'out_of_stock' as const,
            isActive: product.isActive !== undefined ? product.isActive : true,
            isFeatured: product.isFeatured !== undefined ? product.isFeatured : false,
            isPopular: product.isPopular !== undefined ? product.isPopular : false,
            requiresAgeVerification: product.requiresAgeVerification !== undefined ? product.requiresAgeVerification : false,
            categoryIds
          }
          console.log('Loading product for edit:', { product, categoryIds, formData })
          setFormData(formData)
          
          if (product.image) {
            setUploadedImage({
              public_id: product.image.split('/').pop()?.split('.')[0] || '',
              secure_url: product.image,
              width: 0,
              height: 0,
              format: 'jpg',
              bytes: 0
            })
          }
        }
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleCategoryIdsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = Array.from(e.target.selectedOptions).map(opt => opt.value)
    setFormData(prev => ({ ...prev, categoryIds: selected }))
  }


  const handleImageUpload = (result: CloudinaryUploadResult) => {
    setUploadedImage(result)
    setFormData(prev => ({
      ...prev,
      image: result.secure_url
    }))
  }

  const handleImageRemove = () => {
    setUploadedImage(null)
    setFormData(prev => ({
      ...prev,
      image: ''
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (!formData.price || parseFloat(formData.price) <= 0) {
        alert('Please enter a valid price for this product.')
        return
      }

      if (!formData.categoryIds || formData.categoryIds.length === 0) {
        alert('Please select at least one category for this product.')
        return
      }

      const categoryIdsNum = formData.categoryIds
        .map(v => parseInt(v))
        .filter(v => !isNaN(v) && v > 0)

      if (categoryIdsNum.length === 0) {
        alert('Invalid categories selected. Please select valid categories.')
        return
      }

      const productData = {
        ...formData,
        price: parseFloat(formData.price) || 0,
        originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : undefined,
        stock: formData.stockStatus === 'in_stock' ? 100 : 0,
        // Backend uses `categoryId` as primary category; `categoryIds[]` powers multi-category filtering.
        categoryId: categoryIdsNum[0],
        categoryIds: categoryIdsNum,
        volume: '',
        rating: 0,
        reviewCount: 0,
        brand: '',
        brandId: undefined,
        alcoholContent: '',
        origin: '',
        subcategoryId: undefined,
        tags: Array.isArray(formData.tags) ? formData.tags : [],
        images: Array.isArray(formData.images) ? formData.images : []
      }

      console.log('Submitting product:', { formData, productData })

      if (isEditing && id) {
        await adminApiService.updateProduct(parseInt(id), productData)
      } else {
        await adminApiService.createProduct(productData)
      }

      navigate('/products')
    } catch (error: any) {
      console.error('Error saving product:', error)
      const errorMessage = error?.response?.data?.message || error?.message || 'Error saving product. Please try again.'
      alert(errorMessage)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between bg-white rounded-lg p-4 shadow-sm">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/products')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <h1 className="text-xl font-semibold text-gray-900">
            {isEditing ? 'Edit Product' : 'Add New Product'}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Basic Information Section */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Product Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="admin-input w-full px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                placeholder="Enter product name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Categories *</label>
              <select
                name="categoryIds"
                multiple
                value={formData.categoryIds}
                onChange={handleCategoryIdsChange}
                className="admin-input w-full px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ minHeight: 120 }}
              >
                {categories.map(cat => (
                  <option key={cat.id} value={String(cat.id)}>{cat.name}</option>
                ))}
              </select>
              {isEditing && formData.categoryIds.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  Selected: {formData.categoryIds
                    .map(cid => categories.find(c => String(c.id) === cid)?.name)
                    .filter(Boolean)
                    .join(', ')}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Pricing Section */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Pricing *</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Price *</label>
                    <input
                      type="number"
                      step="0.01"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                className="admin-input w-full px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                      required
                    />
              <p className="text-xs text-gray-500 mt-1">Current selling price</p>
                  </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Original Price (Discount)</label>
                    <input
                      type="number"
                      step="0.01"
                name="originalPrice"
                value={formData.originalPrice}
                onChange={handleInputChange}
                className="admin-input w-full px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Optional"
              />
              <p className="text-xs text-gray-500 mt-1">Original price before discount (optional)</p>
            </div>
            </div>
        </div>

        {/* Additional Details Section */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Additional Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Product Image</label>
              <CloudinaryUpload
                onUpload={handleImageUpload}
                onRemove={handleImageRemove}
                currentImage={formData.image}
                folder="drinks-products"
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Status & Settings */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Status & Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Stock Status *</label>
              <select
                name="stockStatus"
                value={formData.stockStatus}
                onChange={handleInputChange}
                className="admin-input w-full px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="in_stock">In Stock</option>
                <option value="out_of_stock">Out of Stock</option>
              </select>
            </div>
          </div>
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleInputChange}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Active</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="isFeatured"
                checked={formData.isFeatured}
                onChange={handleInputChange}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Featured</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="isPopular"
                checked={formData.isPopular}
                onChange={handleInputChange}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Popular Product</span>
            </label>
          </div>
        </div>

        {/* Description Section */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Description</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Product Description</label>
            <div className="rich-text-editor">
              <ReactQuill
                theme="snow"
                value={formData.description}
                onChange={(value) => {
                  setFormData(prev => ({
                    ...prev,
                    description: value
                  }))
                }}
                placeholder="Enter product description (supports formatting: bold, italic, underline, lists, etc.)"
                modules={{
                  toolbar: [
                    [{ 'header': [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    [{ 'script': 'sub'}, { 'script': 'super' }],
                    [{ 'indent': '-1'}, { 'indent': '+1' }],
                    [{ 'color': [] }, { 'background': [] }],
                    [{ 'align': [] }],
                    ['link'],
                    ['clean']
                  ]
                }}
                formats={[
                  'header',
                  'bold', 'italic', 'underline', 'strike',
                  'list', 'bullet',
                  'script', 'indent',
                  'color', 'background',
                  'align',
                  'link'
                ]}
                style={{ 
                  minHeight: '200px',
                  marginBottom: '50px'
                }}
              />
            </div>
            <style>{`
              .rich-text-editor .ql-container {
                min-height: 200px;
                font-size: 14px;
              }
              .rich-text-editor .ql-editor {
                min-height: 200px;
              }
              .rich-text-editor .ql-toolbar {
                border-top-left-radius: 8px;
                border-top-right-radius: 8px;
                border: 1px solid #d1d5db;
              }
              .rich-text-editor .ql-container {
                border-bottom-left-radius: 8px;
                border-bottom-right-radius: 8px;
                border: 1px solid #d1d5db;
                border-top: none;
              }
              .rich-text-editor .ql-editor.ql-blank::before {
                color: #9ca3af;
                font-style: normal;
              }
            `}</style>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate('/products')}
            className="px-6 py-2.5 text-sm font-medium border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="admin-button px-6 py-2.5 text-sm font-medium rounded-lg text-white transition-colors"
          >
            {isEditing ? 'Update Product' : 'Create Product'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default ProductForm
