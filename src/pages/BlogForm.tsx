import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { adminApiService, BlogCategory } from '../services/api'
import { ArrowLeft, Plus, X } from 'lucide-react'
import CloudinaryUpload from '../components/CloudinaryUpload'
import { CloudinaryUploadResult } from '../services/cloudinary'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'

const BlogForm: React.FC = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEditing = !!id

  const [categories, setCategories] = useState<BlogCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [_uploadedImage, setUploadedImage] = useState<CloudinaryUploadResult | null>(null)
  const [tagInput, setTagInput] = useState('')
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    description: '',
    isActive: true
  })
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    image: '',
    categoryId: '',
    tags: [] as string[],
    isPublished: false,
    excerpt: ''
  })

  useEffect(() => {
    loadData()
  }, [id])

  // Suppress ReactQuill findDOMNode deprecation warning (known issue with react-quill)
  useEffect(() => {
    if (import.meta.env.DEV) {
      const suppressWarning = (originalMethod: typeof console.warn) => {
        return (...args: any[]) => {
          if (
            args.length > 0 &&
            typeof args[0] === 'string' &&
            (args[0].includes('findDOMNode is deprecated') ||
             args[0].includes('Warning: findDOMNode'))
          ) {
            return // Suppress this specific warning
          }
          originalMethod.apply(console, args)
        }
      }
      
      const originalWarn = console.warn
      const originalError = console.error
      
      console.warn = suppressWarning(originalWarn) as typeof console.warn
      console.error = suppressWarning(originalError) as typeof console.error
      
      return () => {
        console.warn = originalWarn
        console.error = originalError
      }
    }
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const categoriesData = await adminApiService.getBlogCategories()
      setCategories(categoriesData)

      if (isEditing && id) {
        const blog = await adminApiService.getBlogById(parseInt(id))
        if (blog) {
          setFormData({
            title: blog.title || '',
            content: blog.content || '',
            image: blog.image || '',
            categoryId: blog.categoryId ? blog.categoryId.toString() : '',
            tags: blog.tags || [],
            isPublished: blog.isPublished !== undefined ? blog.isPublished : false,
            excerpt: blog.excerpt || ''
          })
          
          if (blog.image) {
            setUploadedImage({
              public_id: blog.image.split('/').pop()?.split('.')[0] || '',
              secure_url: blog.image,
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

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim()
    if (trimmedTag && !formData.tags.includes(trimmedTag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, trimmedTag]
      }))
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const handleTagInputKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    }
  }

  const handleCategoryInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    
    setCategoryFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (!categoryFormData.name.trim()) {
        alert('Please enter a category name.')
        return
      }

      const newCategory = await adminApiService.createBlogCategory({
        name: categoryFormData.name.trim(),
        description: categoryFormData.description.trim() || undefined,
        isActive: categoryFormData.isActive
      })

      // Refresh categories list
      const updatedCategories = await adminApiService.getBlogCategories()
      setCategories(updatedCategories)

      // Auto-select the newly created category
      setFormData(prev => ({
        ...prev,
        categoryId: newCategory.id.toString()
      }))

      // Reset form and close modal
      setCategoryFormData({
        name: '',
        description: '',
        isActive: true
      })
      setShowCategoryModal(false)
    } catch (error) {
      console.error('Error creating category:', error)
      alert('Error creating category. Please try again.')
    }
  }

  const openCategoryModal = () => {
    setCategoryFormData({
      name: '',
      description: '',
      isActive: true
    })
    setShowCategoryModal(true)
  }

  const closeCategoryModal = () => {
    setShowCategoryModal(false)
    setCategoryFormData({
      name: '',
      description: '',
      isActive: true
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (!formData.title.trim()) {
        alert('Please enter a blog title.')
        return
      }

      if (!formData.content.trim()) {
        alert('Please enter blog content.')
        return
      }

      if (!formData.categoryId) {
        alert('Please select a blog category.')
        return
      }

      const blogData = {
        ...formData,
        categoryId: parseInt(formData.categoryId),
        tags: Array.isArray(formData.tags) ? formData.tags : []
      }

      if (isEditing && id) {
        await adminApiService.updateBlog(parseInt(id), blogData)
      } else {
        await adminApiService.createBlog(blogData)
      }

      navigate('/blogs')
    } catch (error) {
      console.error('Error saving blog:', error)
      alert('Error saving blog. Please try again.')
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
            onClick={() => navigate('/blogs')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <h1 className="text-xl font-semibold text-gray-900">
            {isEditing ? 'Edit Blog Post' : 'Create New Blog Post'}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Basic Information Section */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="admin-input w-full px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                placeholder="Enter blog title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Category *</label>
              <div className="flex gap-2">
                <select
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleInputChange}
                  className="admin-input flex-1 px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={openCategoryModal}
                  className="flex items-center px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:outline-none transition-colors"
                  title="Add New Category"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
              <label className="flex items-center cursor-pointer mt-2">
                <input
                  type="checkbox"
                  name="isPublished"
                  checked={formData.isPublished}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Published</span>
              </label>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Excerpt</label>
              <textarea
                name="excerpt"
                value={formData.excerpt}
                onChange={handleInputChange}
                className="admin-input w-full px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Brief description of the blog post (optional)"
              />
            </div>
          </div>
        </div>

        {/* Image Upload Section */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Featured Image</h2>
          <CloudinaryUpload
            onUpload={handleImageUpload}
            onRemove={handleImageRemove}
            currentImage={formData.image}
            folder="blog-posts"
            className="w-full"
          />
        </div>

        {/* Tags Section */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Tags</h2>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={handleTagInputKeyPress}
              className="admin-input flex-1 px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter tag and press Enter"
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="flex items-center px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none transition-colors"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Add Tag
            </button>
          </div>
          {formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Content *</h2>
          <div className="rich-text-editor">
            <ReactQuill
              theme="snow"
              value={formData.content}
              onChange={(value) => {
                setFormData(prev => ({
                  ...prev,
                  content: value
                }))
              }}
              placeholder="Write your blog post content here (supports formatting: bold, italic, underline, lists, etc.)"
              modules={{
                toolbar: [
                  [{ 'header': [1, 2, 3, false] }],
                  ['bold', 'italic', 'underline', 'strike'],
                  [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                  [{ 'script': 'sub'}, { 'script': 'super' }],
                  [{ 'indent': '-1'}, { 'indent': '+1' }],
                  [{ 'color': [] }, { 'background': [] }],
                  [{ 'align': [] }],
                  ['link', 'image'],
                  ['blockquote', 'code-block'],
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
                'link', 'image',
                'blockquote', 'code-block'
              ]}
              style={{ 
                minHeight: '400px',
                marginBottom: '50px'
              }}
            />
          </div>
          <style>{`
            .rich-text-editor .ql-container {
              min-height: 400px;
              font-size: 14px;
            }
            .rich-text-editor .ql-editor {
              min-height: 400px;
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

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate('/blogs')}
            className="px-6 py-2.5 text-sm font-medium border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="admin-button px-6 py-2.5 text-sm font-medium rounded-lg text-white transition-colors"
          >
            {isEditing ? 'Update Blog Post' : 'Create Blog Post'}
          </button>
        </div>
      </form>

      {/* Blog Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Add Blog Category</h2>
              <button
                onClick={closeCategoryModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={categoryFormData.name}
                  onChange={handleCategoryInputChange}
                  className="admin-input w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  placeholder="Enter category name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={categoryFormData.description}
                  onChange={handleCategoryInputChange}
                  rows={3}
                  className="admin-input w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter category description (optional)"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={categoryFormData.isActive}
                  onChange={handleCategoryInputChange}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label className="ml-2 text-sm font-medium text-gray-700">
                  Active
                </label>
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={closeCategoryModal}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-button px-6 py-3 rounded-lg text-white font-semibold transition-colors"
                >
                  Create Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default BlogForm
