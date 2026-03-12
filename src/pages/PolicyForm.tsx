import { useState, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { adminApiService, Policy, PolicyType } from '../services/api'
import { ArrowLeft, Edit, Trash2 } from 'lucide-react'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'

const POLICY_TYPE_LABELS: Record<PolicyType, string> = {
  terms_conditions: 'Terms & Conditions',
  privacy_policy: 'Privacy Policy',
  shipping_policy: 'Shipping Policy',
  refund_return: 'Refund & Return',
  cookie_policy: 'Cookie Policy',
  disclaimer: 'Disclaimer',
}

const PolicyForm: React.FC = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const isEditing = !!id
  const isViewMode = searchParams.get('mode') === 'view'

  const [loading, setLoading] = useState(true)
  const [policyData, setPolicyData] = useState<Policy | null>(null)
  const [formData, setFormData] = useState({
    type: (searchParams.get('type') || 'terms_conditions') as PolicyType,
    content: '',
    isActive: true,
  })

  useEffect(() => {
    loadData()
  }, [id, isViewMode])

  // Suppress ReactQuill findDOMNode deprecation warning
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
            return
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
      if ((isEditing || isViewMode) && id) {
        const policy = await adminApiService.getPolicyById(parseInt(id))
        if (policy) {
          setPolicyData(policy)
          setFormData({
            type: policy.type,
            content: policy.content || '',
            isActive: policy.isActive !== undefined ? policy.isActive : true,
          })
        }
      }
    } catch (error) {
      console.error('Error loading policy:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
      if (!formData.content.trim()) {
        alert('Please enter policy content.')
        return
      }

      if (!formData.type) {
        alert('Please select a policy type.')
        return
      }

      if (isEditing && id) {
        await adminApiService.updatePolicy(parseInt(id), formData)
      } else {
        await adminApiService.createPolicy(formData)
      }

      navigate('/policies')
    } catch (error) {
      console.error('Error saving policy:', error)
      alert('Error saving policy. Please try again.')
    }
  }

  const handleDelete = async () => {
    if (!id) return
    
    if (!confirm('Are you sure you want to delete this policy?')) {
      return
    }

    try {
      await adminApiService.deletePolicy(parseInt(id))
      navigate('/policies')
    } catch (error) {
      console.error('Error deleting policy:', error)
      alert('Error deleting policy. Please try again.')
    }
  }

  const handleToggleStatus = async () => {
    if (!id) return
    
    try {
      await adminApiService.updatePolicy(parseInt(id), {
        isActive: !formData.isActive,
      })
      setFormData(prev => ({ ...prev, isActive: !prev.isActive }))
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Error updating status. Please try again.')
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
            onClick={() => navigate('/policies')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <h1 className="text-xl font-semibold text-gray-900">
            {isViewMode ? 'View Policy' : isEditing ? 'Edit Policy' : 'Create New Policy'}
          </h1>
        </div>
        {isViewMode && id && (
          <div className="flex items-center space-x-2">
            <label className="flex items-center cursor-pointer mr-4">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={handleToggleStatus}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                {formData.isActive ? 'Active' : 'Inactive'}
              </span>
            </label>
            <button
              onClick={() => navigate(`/policies/edit/${id}`)}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </button>
          </div>
        )}
      </div>

      {isViewMode ? (
        <div className="space-y-4">
          {/* Policy Information */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Policy Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Policy Type
                </label>
                <div className="px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-900">
                  {POLICY_TYPE_LABELS[formData.type]}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                <div className="px-3 py-2 bg-gray-50 rounded-lg text-sm">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    formData.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {formData.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Content</h2>
            {formData.content ? (
              <div className="prose max-w-none">
                <div 
                  className="text-gray-900"
                  dangerouslySetInnerHTML={{ __html: formData.content }}
                />
                {policyData && (
                  <div className="mt-6 pt-6 border-t border-gray-200 text-sm text-gray-500">
                    <p>Last updated: {new Date(policyData.updatedAt).toLocaleString()}</p>
                    <p>Created: {new Date(policyData.createdAt).toLocaleString()}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500">No content available.</p>
            )}
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Information Section */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Policy Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Policy Type *
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="admin-input w-full px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={isEditing}
                >
                  {(Object.keys(POLICY_TYPE_LABELS) as PolicyType[]).map((type) => (
                    <option key={type} value={type}>
                      {POLICY_TYPE_LABELS[type]}
                    </option>
                  ))}
                </select>
                {isEditing && (
                  <p className="mt-1 text-xs text-gray-500">
                    Policy type cannot be changed after creation.
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                <label className="flex items-center cursor-pointer mt-2">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Active</span>
                </label>
              </div>
            </div>
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
                placeholder="Enter policy content here (supports formatting: bold, italic, underline, lists, etc.)"
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
                  'link',
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
              onClick={() => navigate('/policies')}
              className="px-6 py-2.5 text-sm font-medium border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="admin-button px-6 py-2.5 text-sm font-medium rounded-lg text-white transition-colors"
            >
              {isEditing ? 'Update Policy' : 'Create Policy'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

export default PolicyForm
