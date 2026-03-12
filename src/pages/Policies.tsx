import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminApiService, Policy, PolicyType } from '../services/api'
import { Plus, FileText } from 'lucide-react'

const POLICY_TYPE_LABELS: Record<PolicyType, string> = {
  terms_conditions: 'Terms & Conditions',
  privacy_policy: 'Privacy Policy',
  shipping_policy: 'Shipping Policy',
  refund_return: 'Refund & Return',
  cookie_policy: 'Cookie Policy',
  disclaimer: 'Disclaimer',
}

const Policies: React.FC = () => {
  const navigate = useNavigate()
  const [policies, setPolicies] = useState<Policy[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPolicies()
  }, [])

  const loadPolicies = async () => {
    try {
      setLoading(true)
      const data = await adminApiService.getPolicies()
      setPolicies(data)
    } catch (error) {
      console.error('Error loading policies:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPolicyForType = (type: PolicyType) => {
    return policies.find(p => p.type === type)
  }

  const handlePolicyClick = (policy: Policy | null, type?: PolicyType) => {
    if (policy) {
      // Navigate to view page
      navigate(`/policies/view/${policy.id}`)
    } else if (type) {
      // Navigate to create page with type
      navigate(`/policies/new?type=${type}`)
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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between bg-white rounded-lg p-4 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Policies & Information</h1>
        <button
          onClick={() => navigate('/policies/new')}
          className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 focus:outline-none transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Content
        </button>
      </div>

      {/* Policy Type Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(Object.keys(POLICY_TYPE_LABELS) as PolicyType[]).map((type) => {
          const policy = getPolicyForType(type)
          return (
            <div
              key={type}
              onClick={() => handlePolicyClick(policy || null, type)}
              className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all cursor-pointer hover:border-blue-300"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-blue-500 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    {POLICY_TYPE_LABELS[type]}
                  </h3>
                </div>
                {policy && (
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    policy.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {policy.isActive ? 'Active' : 'Inactive'}
                  </span>
                )}
              </div>
              
              {policy ? (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 line-clamp-3">
                    {policy.content.replace(/<[^>]*>/g, '').substring(0, 150)}...
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Updated: {new Date(policy.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-gray-500">No content added yet. Click to add.</p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Policies
