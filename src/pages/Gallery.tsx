import { useState, useEffect } from 'react'
import { adminApiService, Gallery as GalleryItem } from '../services/api'
import { Plus, Edit, Trash2, X, Image as ImageIcon } from 'lucide-react'
import CloudinaryUpload from '../components/CloudinaryUpload'

const Gallery: React.FC = () => {
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null)
  const [formData, setFormData] = useState({
    image: '',
    description: '',
    isActive: true
  })
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    loadGallery()
  }, [])

  const loadGallery = async () => {
    try {
      setLoading(true)
      const data = await adminApiService.getGallery()
      setGalleryItems(data)
    } catch (error) {
      console.error('Error loading gallery:', error)
      alert('Error loading gallery. Please try again.')
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

  const handleImageUpload = (result: any) => {
    setFormData(prev => ({
      ...prev,
      image: result.secure_url
    }))
  }

  const handleImageRemove = () => {
    setFormData(prev => ({
      ...prev,
      image: ''
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.image.trim()) {
      alert('Please upload an image')
      return
    }

    try {
      setUploading(true)
      
      if (editingItem) {
        await adminApiService.updateGallery(editingItem.id, formData)
        alert('Gallery item updated successfully!')
      } else {
        await adminApiService.createGallery(formData)
        alert('Gallery item created successfully!')
      }
      
      resetForm()
      loadGallery()
    } catch (error) {
      console.error('Error saving gallery item:', error)
      alert('Error saving gallery item. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleEdit = (item: GalleryItem) => {
    setEditingItem(item)
    setFormData({
      image: item.image,
      description: item.description || '',
      isActive: item.isActive
    })
    setShowModal(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this gallery item?')) {
      return
    }

    try {
      await adminApiService.deleteGallery(id)
      loadGallery()
      alert('Gallery item deleted successfully!')
    } catch (error) {
      console.error('Error deleting gallery item:', error)
      alert('Error deleting gallery item. Please try again.')
    }
  }

  const resetForm = () => {
    setFormData({
      image: '',
      description: '',
      isActive: true
    })
    setEditingItem(null)
    setShowModal(false)
  }

  const openModal = () => {
    resetForm()
    setShowModal(true)
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
      {/* Header */}
      <div className="flex items-center justify-between bg-white rounded-lg p-4 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Gallery</h1>
        <button
          onClick={openModal}
          className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 focus:outline-none transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Photo
        </button>
      </div>

      {/* Gallery Grid */}
      {galleryItems.length === 0 ? (
        <div className="bg-white rounded-lg p-8 text-center shadow-sm">
          <ImageIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">No gallery items yet.</p>
          <button
            onClick={openModal}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 focus:outline-none transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Photo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {galleryItems.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="relative aspect-square bg-gray-50 flex items-center justify-center p-2">
                <img
                  src={item.image}
                  alt={item.description || 'Gallery image'}
                  className="w-full h-full object-contain"
                />
                {!item.isActive && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <span className="text-white text-sm font-medium">Inactive</span>
                  </div>
                )}
                <div className="absolute top-2 right-2 flex gap-2">
                  <button
                    onClick={() => handleEdit(item)}
                    className="p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
                    title="Edit"
                  >
                    <Edit className="h-4 w-4 text-blue-600" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </button>
                </div>
              </div>
              {item.description && (
                <div className="p-3">
                  <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
                </div>
              )}
              <div className="px-3 pb-3">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  item.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {item.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingItem ? 'Edit Gallery Item' : 'Add Gallery Item'}
              </h2>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image *
                </label>
                <CloudinaryUpload
                  onUpload={handleImageUpload}
                  onRemove={handleImageRemove}
                  currentImage={formData.image}
                  folder="gallery"
                  disabled={uploading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="admin-input w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter description (optional)"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label className="ml-2 text-sm font-medium text-gray-700">
                  Active
                </label>
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-button px-6 py-3 rounded-lg text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={uploading || !formData.image}
                >
                  {uploading ? 'Saving...' : editingItem ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Gallery
