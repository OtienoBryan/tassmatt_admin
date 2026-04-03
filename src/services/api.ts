// Admin API service for backend communication
import { mockCategories, mockProducts, mockUsers, mockOrders, mockDashboardStats } from './mockData'

const API_BASE_URL = '/api'
const USE_MOCK_DATA = false // Set to true to use mock data for development

export interface SubCategory {
  id: number
  name: string
  description: string
  isActive: boolean
  categoryId: number
  category: Category
  createdAt: string
  updatedAt: string
}

export interface Brand {
  id?: number
  name: string
  description?: string
  logo?: string
  website?: string
  country?: string
  foundedYear?: number
  categoryId?: number
  category?: Category
  productCount?: number
  isActive?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface Category {
  id: number
  name: string
  description: string
  image: string
  isActive: boolean
  subcategories?: SubCategory[]
  createdAt: string
  updatedAt: string
}

export interface Product {
  id: number
  name: string
  description: string
  price: number
  originalPrice?: number
  stock: number
  image: string
  images?: string[]
  brand: string
  brandId?: number
  alcoholContent: string
  volume: string
  origin: string
  tags: string[]
  rating: number
  reviewCount: number
  isActive: boolean
  isFeatured: boolean
  isPopular: boolean
  requiresAgeVerification: boolean
  category: Category
  categoryId: number
  // Multi-category support
  categories?: Category[]
  categoryIds?: number[]
  subcategory?: SubCategory
  subcategoryId?: number
  createdAt: string
  updatedAt: string
}

export interface User {
  id: number
  email: string
  firstName: string
  lastName: string
  phone?: string
  dateOfBirth?: string
  isActive: boolean
  isEmailVerified: boolean
  createdAt: string
  updatedAt: string
}

export interface OrderItem {
  id: number
  productId: number
  quantity: number
  price: number
  total: number
  product: {
    id: number
    name: string
    image: string
  }
}

export interface Order {
  id: number
  orderNumber: string
  userId: number
  user: User
  items: OrderItem[]
  subtotal: number
  tax: number
  shipping: number
  total: number
  status: 'pending' | 'assigned' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded' // Updated to include 'assigned'
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded'
  shippingAddress: string
  billingAddress?: string
  notes?: string
  riderId?: number
  rider?: Rider
  assignedAt?: string
  createdAt: string
  updatedAt: string
}

export interface Rider {
  id: number
  name: string
  contact: string
  cashLimit: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface BlogCategory {
  id: number
  name: string
  description?: string
  slug?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Blog {
  id: number
  title: string
  content: string
  excerpt?: string
  image?: string
  categoryId: number
  category?: BlogCategory
  tags: string[]
  isPublished: boolean
  createdAt: string
  updatedAt: string
}

export interface Gallery {
  id: number
  image: string
  description?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type PolicyType = 
  | 'terms_conditions'
  | 'privacy_policy'
  | 'shipping_policy'
  | 'refund_return'
  | 'cookie_policy'
  | 'disclaimer'

export interface Policy {
  id: number
  type: PolicyType
  content: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface DashboardStats {
  totalProducts: number
  totalCategories: number
  totalOrders: number
  totalUsers: number
  recentOrders: Order[]
}

class AdminApiService {
  private authToken: string | null = null

  constructor() {
    this.authToken = localStorage.getItem('adminToken')
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.authToken && { 'Authorization': `Bearer ${this.authToken}` }),
        ...options.headers,
      },
      ...options,
    }

    try {
      console.log(`Making admin API request to: ${url}`)
      const response = await fetch(url, config)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`HTTP error! status: ${response.status}, body: ${errorText}`)
        
        // Handle 502 Bad Gateway specifically
        if (response.status === 502) {
          const error = new Error('Unable to connect to the server. Please check if the backend server is running and accessible.')
          ;(error as any).status = 502
          ;(error as any).code = 'BACKEND_CONNECTION_ERROR'
          throw error
        }
        
        // Try to parse JSON error response
        let errorMessage = 'An error occurred'
        try {
          const errorJson = JSON.parse(errorText)
          errorMessage = errorJson.message || errorJson.error || errorMessage
        } catch {
          // If not JSON, use the text as-is
          if (errorText.includes('ROUTER_EXTERNAL_TARGET_CONNECTION_ERROR')) {
            errorMessage = 'Unable to connect to the backend server. The server may be down or unreachable.'
          } else {
            errorMessage = errorText || `HTTP error! status: ${response.status}`
          }
        }
        
        const error = new Error(errorMessage)
        ;(error as any).status = response.status
        ;(error as any).response = errorText
        throw error
      }

      const data = await response.json()
      console.log('Admin API response:', data)
      return data
    } catch (error: any) {
      console.error(`Admin API request failed for ${endpoint}:`, error)
      // Re-throw with proper message if it's already our formatted error
      if (error.message && !error.message.includes('HTTP error!')) {
        throw error
      }
      // Otherwise, wrap it
      throw new Error(error?.message || 'Request failed')
    }
  }

  // Authentication
  async login(email: string, password: string): Promise<{ token: string; staff: any; user: any }> {
    const response = await this.request<{ token: string; staff: any; user: any }>('/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    
    if (response.token) {
      this.authToken = response.token
      localStorage.setItem('adminToken', response.token)
    }
    
    return response
  }

  logout(): void {
    this.authToken = null
    localStorage.removeItem('adminToken')
  }

  setAuthToken(token: string): void {
    this.authToken = token
    localStorage.setItem('adminToken', token)
  }

  getAuthToken(): string | null {
    return this.authToken
  }

  // Categories Management
  async getCategories(): Promise<Category[]> {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 500)) // Simulate network delay
      return [...mockCategories]
    }
    return this.request<Category[]>('/admin/categories')
  }

  async getCategoryById(id: number): Promise<Category> {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 300))
      const category = mockCategories.find(c => c.id === id)
      if (!category) throw new Error('Category not found')
      return category
    }
    return this.request<Category>(`/admin/categories/${id}`)
  }

  async createCategory(categoryData: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<Category> {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 500))
      const newCategory: Category = {
        ...categoryData,
        id: Math.max(...mockCategories.map(c => c.id)) + 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      mockCategories.push(newCategory)
      return newCategory
    }
    return this.request<Category>('/admin/categories', {
      method: 'POST',
      body: JSON.stringify(categoryData),
    })
  }

  async updateCategory(id: number, categoryData: Partial<Omit<Category, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Category> {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 500))
      const index = mockCategories.findIndex(c => c.id === id)
      if (index === -1) throw new Error('Category not found')
      mockCategories[index] = { ...mockCategories[index], ...categoryData, updatedAt: new Date().toISOString() }
      return mockCategories[index]
    }
    return this.request<Category>(`/admin/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(categoryData),
    })
  }

  async deleteCategory(id: number): Promise<void> {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 500))
      const index = mockCategories.findIndex(c => c.id === id)
      if (index === -1) throw new Error('Category not found')
      mockCategories.splice(index, 1)
      return
    }
    return this.request<void>(`/admin/categories/${id}`, {
      method: 'DELETE',
    })
  }

  // SubCategories Management
  async getSubCategories(categoryId?: number): Promise<SubCategory[]> {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 500))
      return []
    }
    const url = categoryId ? `/subcategories?categoryId=${categoryId}` : '/subcategories'
    console.log('Admin API: Getting subcategories for categoryId:', categoryId, 'URL:', url)
    const result = await this.request<SubCategory[]>(url)
    console.log('Admin API: Received subcategories:', result)
    return result
  }

  async getSubCategoryById(id: number): Promise<SubCategory> {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 300))
      throw new Error('SubCategory not found')
    }
    return this.request<SubCategory>(`/subcategories/${id}`)
  }

  async createSubCategory(subCategoryData: Omit<SubCategory, 'id' | 'createdAt' | 'updatedAt' | 'category'>): Promise<SubCategory> {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 500))
      const newSubCategory: SubCategory = {
        ...subCategoryData,
        id: Math.floor(Math.random() * 1000) + 1,
        category: mockCategories.find(c => c.id === subCategoryData.categoryId) || {} as Category,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      return newSubCategory
    }
    return this.request<SubCategory>('/subcategories', {
      method: 'POST',
      body: JSON.stringify(subCategoryData),
    })
  }

  async updateSubCategory(id: number, subCategoryData: Partial<Omit<SubCategory, 'id' | 'createdAt' | 'updatedAt' | 'category'>>): Promise<SubCategory> {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 500))
      throw new Error('SubCategory not found')
    }
    return this.request<SubCategory>(`/subcategories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(subCategoryData),
    })
  }

  async deleteSubCategory(id: number): Promise<void> {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 500))
      return
    }
    return this.request<void>(`/subcategories/${id}`, {
      method: 'DELETE',
    })
  }

  async toggleSubCategoryStatus(id: number): Promise<SubCategory> {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 500))
      throw new Error('SubCategory not found')
    }
    return this.request<SubCategory>(`/subcategories/${id}/toggle-active`, {
      method: 'PUT',
    })
  }

  // Products Management
  async getProducts(): Promise<Product[]> {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 500))
      return [...mockProducts]
    }
    return this.request<Product[]>('/admin/products')
  }

  async getProductById(id: number): Promise<Product> {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 300))
      const product = mockProducts.find(p => p.id === id)
      if (!product) throw new Error('Product not found')
      return product
    }
    return this.request<Product>(`/admin/products/${id}`)
  }

  async createProduct(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'category'>): Promise<Product> {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 500))
      const categoryIds =
        productData.categoryIds && productData.categoryIds.length > 0
          ? productData.categoryIds
          : (productData.categoryId ? [productData.categoryId] : [])

      const primaryCategoryId = categoryIds[0]
      const category = mockCategories.find(c => c.id === primaryCategoryId)
      if (!category) throw new Error('Category not found')
      const categories = categoryIds
        .map(id => mockCategories.find(c => c.id === id))
        .filter(Boolean) as Category[]
      
      const newProduct = {
        ...productData,
        id: Math.max(...mockProducts.map(p => p.id)) + 1,
        category,
        categories,
        categoryIds,
        categoryId: primaryCategoryId,
        images: productData.images || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      mockProducts.push(newProduct as any)
      return newProduct
    }
    return this.request<Product>('/admin/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    })
  }

  async updateProduct(id: number, productData: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'category'>>): Promise<Product> {
    console.log('🔄 [API] updateProduct called')
    console.log('  Product ID:', id)
    console.log('  Product Data:', JSON.stringify(productData, null, 2))
    console.log('  Brand ID in data:', productData.brandId)
    console.log('  Brand ID type:', typeof productData.brandId)
    console.log('  Brand name in data:', productData.brand)
    console.log('  Brand name type:', typeof productData.brand)
    console.log('  Subcategory ID in data:', productData.subcategoryId)
    console.log('  Subcategory ID type:', typeof productData.subcategoryId)
    
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 500))
      const index = mockProducts.findIndex(p => p.id === id)
      if (index === -1) throw new Error('Product not found')

      const categoryIds =
        productData.categoryIds && productData.categoryIds.length > 0
          ? productData.categoryIds
          : (productData.categoryId ? [productData.categoryId] : mockProducts[index].categoryId ? [mockProducts[index].categoryId] : [])

      const primaryCategoryId = categoryIds[0]
      const category =
        mockCategories.find(c => c.id === primaryCategoryId) || mockProducts[index].category

      const categories = categoryIds
        .map(cid => mockCategories.find(c => c.id === cid))
        .filter(Boolean) as Category[]
      
      mockProducts[index] = { 
        ...mockProducts[index], 
        ...productData, 
        category,
        categories,
        categoryIds,
        categoryId: primaryCategoryId,
        updatedAt: new Date().toISOString() 
      }
      return mockProducts[index]
    }
    
    console.log('  Making API request to PUT /admin/products/' + id)
    try {
      const result = await this.request<Product>(`/admin/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(productData),
      })
      
      console.log('✅ [API] updateProduct response received')
      console.log('  Response brandId:', result.brandId)
      console.log('  Response brand:', result.brand)
      console.log('  Response subcategoryId:', result.subcategoryId)
      console.log('  Response subcategory:', result.subcategory)
      console.log('  Full response:', JSON.stringify(result, null, 2))
      
      return result
    } catch (error) {
      console.error('❌ [API] updateProduct error:', error)
      throw error
    }
  }

  async deleteProduct(id: number): Promise<void> {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 500))
      const index = mockProducts.findIndex(p => p.id === id)
      if (index === -1) throw new Error('Product not found')
      mockProducts.splice(index, 1)
      return
    }
    return this.request<void>(`/admin/products/${id}`, {
      method: 'DELETE',
    })
  }

  // Orders Management
  async getOrders(): Promise<Order[]> {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 500))
      return [...mockOrders]
    }
    return this.request<Order[]>('/admin/orders')
  }

  async getOrderById(id: number): Promise<Order> {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 300))
      const order = mockOrders.find(o => o.id === id)
      if (!order) throw new Error('Order not found')
      return order
    }
    return this.request<Order>(`/admin/orders/${id}`)
  }

  async updateOrderStatus(id: number, status: Order['status'], paymentStatus: Order['paymentStatus']): Promise<Order> {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 500))
      const index = mockOrders.findIndex(o => o.id === id)
      if (index === -1) throw new Error('Order not found')
      mockOrders[index] = { 
        ...mockOrders[index], 
        status: status as any, 
        paymentStatus: paymentStatus as any,
        updatedAt: new Date().toISOString() 
      }
      return mockOrders[index] as Order
    }
    return this.request<Order>(`/admin/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, paymentStatus }),
    })
  }

  async assignRider(orderId: number, riderId: number): Promise<Order> {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 500))
      const index = mockOrders.findIndex(o => o.id === orderId)
      if (index === -1) throw new Error('Order not found')
      mockOrders[index] = { 
        ...mockOrders[index], 
        riderId,
        status: 'assigned' as any,
        assignedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString() 
      } as any
      return mockOrders[index] as Order
    }
    return this.request<Order>(`/orders/${orderId}/assign-rider`, {
      method: 'PUT',
      body: JSON.stringify({ riderId }),
    })
  }

  async unassignRider(orderId: number): Promise<Order> {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 500))
      const index = mockOrders.findIndex(o => o.id === orderId)
      if (index === -1) throw new Error('Order not found')
      const updatedOrder: any = { 
        ...mockOrders[index], 
        status: 'pending' as any,
        updatedAt: new Date().toISOString() 
      }
      delete updatedOrder.riderId
      delete updatedOrder.assignedAt
      mockOrders[index] = updatedOrder
      return mockOrders[index] as Order
    }
    return this.request<Order>(`/orders/${orderId}/unassign-rider`, {
      method: 'PUT',
    })
  }

  async deleteOrder(id: number): Promise<void> {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 500))
      const index = mockOrders.findIndex(o => o.id === id)
      if (index === -1) throw new Error('Order not found')
      mockOrders.splice(index, 1)
      return
    }
    return this.request<void>(`/admin/orders/${id}`, {
      method: 'DELETE',
    })
  }

  // Users/Clients Management
  async getUsers(): Promise<User[]> {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 500))
      return [...mockUsers]
    }
    return this.request<User[]>('/admin/users')
  }

  async getUserById(id: number): Promise<User> {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 300))
      const user = mockUsers.find(u => u.id === id)
      if (!user) throw new Error('User not found')
      return user
    }
    return this.request<User>(`/admin/users/${id}`)
  }

  async updateUser(id: number, userData: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>): Promise<User> {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 500))
      const index = mockUsers.findIndex(u => u.id === id)
      if (index === -1) throw new Error('User not found')
      mockUsers[index] = { ...mockUsers[index], ...userData, updatedAt: new Date().toISOString() }
      return mockUsers[index]
    }
    return this.request<User>(`/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    })
  }

  async deleteUser(id: number): Promise<void> {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 500))
      const index = mockUsers.findIndex(u => u.id === id)
      if (index === -1) throw new Error('User not found')
      mockUsers.splice(index, 1)
      return
    }
    return this.request<void>(`/admin/users/${id}`, {
      method: 'DELETE',
    })
  }

  async toggleUserStatus(id: number): Promise<User> {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 500))
      const index = mockUsers.findIndex(u => u.id === id)
      if (index === -1) throw new Error('User not found')
      mockUsers[index] = { 
        ...mockUsers[index], 
        isActive: !mockUsers[index].isActive,
        updatedAt: new Date().toISOString() 
      }
      return mockUsers[index]
    }
    return this.request<User>(`/admin/users/${id}/toggle-status`, {
      method: 'PUT',
    })
  }

  // Riders Management
  async getRiders(): Promise<Rider[]> {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 500))
      return []
    }
    return this.request<Rider[]>('/riders')
  }

  async getRiderById(id: number): Promise<Rider> {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 300))
      throw new Error('Rider not found')
    }
    return this.request<Rider>(`/riders/${id}`)
  }

  async createRider(riderData: Omit<Rider, 'id' | 'createdAt' | 'updatedAt'>): Promise<Rider> {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 500))
      const newRider: Rider = {
        ...riderData,
        id: Math.floor(Math.random() * 1000) + 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      return newRider
    }
    return this.request<Rider>('/riders', {
      method: 'POST',
      body: JSON.stringify(riderData),
    })
  }

  async updateRider(id: number, riderData: Partial<Omit<Rider, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Rider> {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 500))
      throw new Error('Rider not found')
    }
    return this.request<Rider>(`/riders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(riderData),
    })
  }

  async deleteRider(id: number): Promise<void> {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 500))
      return
    }
    return this.request<void>(`/riders/${id}`, {
      method: 'DELETE',
    })
  }

  async toggleRiderStatus(id: number): Promise<Rider> {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 500))
      throw new Error('Rider not found')
    }
    return this.request<Rider>(`/riders/${id}/toggle-active`, {
      method: 'PUT',
    })
  }

  // Dashboard Statistics
  async getDashboardStats(): Promise<DashboardStats> {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 500))
      return { ...mockDashboardStats }
    }
    return this.request<DashboardStats>('/admin/dashboard')
  }

  // Brands Management
  async getBrands(): Promise<Brand[]> {
    console.log('🏷️ [API] getBrands called')
    if (USE_MOCK_DATA) {
      console.log('  Using mock data (empty array)')
      await new Promise(resolve => setTimeout(resolve, 500))
      return []
    }
    console.log('  Making API request to /admin/brands')
    const result = await this.request<Brand[]>('/admin/brands')
    console.log('  Brands API result:', result)
    
    // Ensure all brands have proper structure
    return result.map(brand => ({
      ...brand,
      id: brand.id || Math.floor(Math.random() * 1000) + 1, // Fallback ID for brands without ID
      categoryId: (brand.categoryId || brand.category?.id || undefined) as number | undefined,
      productCount: brand.productCount || 0,
      isActive: brand.isActive !== undefined ? brand.isActive : true
    }))
  }

  async getBrandById(id: number): Promise<Brand> {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 500))
      throw new Error('Brand not found')
    }
    return this.request<Brand>(`/admin/brands/${id}`)
  }

  async createBrand(brandData: Omit<Brand, 'id' | 'createdAt' | 'updatedAt'>): Promise<Brand> {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 500))
      const newBrand: Brand = {
        ...brandData,
        id: Math.floor(Math.random() * 1000) + 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      return newBrand
    }
    return this.request<Brand>('/admin/brands', {
      method: 'POST',
      body: JSON.stringify(brandData),
    })
  }

  async updateBrand(id: number, brandData: Partial<Omit<Brand, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Brand> {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 500))
      const updatedBrand: Brand = {
        ...brandData,
        id,
        updatedAt: new Date().toISOString()
      } as Brand
      return updatedBrand
    }
    return this.request<Brand>(`/admin/brands/${id}`, {
      method: 'PUT',
      body: JSON.stringify(brandData),
    })
  }

  async deleteBrand(id: number): Promise<{ success: boolean }> {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 500))
      return { success: true }
    }
    return this.request<{ success: boolean }>(`/admin/brands/${id}`, {
      method: 'DELETE',
    })
  }

  // Blog Categories Management
  async getBlogCategories(): Promise<BlogCategory[]> {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 500))
      return []
    }
    return this.request<BlogCategory[]>('/admin/blog-categories')
  }

  async getBlogCategoryById(id: number): Promise<BlogCategory> {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 300))
      throw new Error('Blog category not found')
    }
    return this.request<BlogCategory>(`/admin/blog-categories/${id}`)
  }

  async createBlogCategory(categoryData: Omit<BlogCategory, 'id' | 'createdAt' | 'updatedAt'>): Promise<BlogCategory> {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 500))
      const newCategory: BlogCategory = {
        ...categoryData,
        id: Math.floor(Math.random() * 1000) + 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      return newCategory
    }
    return this.request<BlogCategory>('/admin/blog-categories', {
      method: 'POST',
      body: JSON.stringify(categoryData),
    })
  }

  async updateBlogCategory(id: number, categoryData: Partial<Omit<BlogCategory, 'id' | 'createdAt' | 'updatedAt'>>): Promise<BlogCategory> {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 500))
      throw new Error('Blog category not found')
    }
    return this.request<BlogCategory>(`/admin/blog-categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(categoryData),
    })
  }

  async deleteBlogCategory(id: number): Promise<void> {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 500))
      return
    }
    return this.request<void>(`/admin/blog-categories/${id}`, {
      method: 'DELETE',
    })
  }

  // Blogs Management
  async getBlogs(): Promise<Blog[]> {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 500))
      return []
    }
    return this.request<Blog[]>('/admin/blogs')
  }

  async getBlogById(id: number): Promise<Blog> {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 300))
      throw new Error('Blog not found')
    }
    return this.request<Blog>(`/admin/blogs/${id}`)
  }

  async createBlog(blogData: Omit<Blog, 'id' | 'createdAt' | 'updatedAt' | 'category'>): Promise<Blog> {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 500))
      const newBlog: Blog = {
        ...blogData,
        id: Math.floor(Math.random() * 1000) + 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      return newBlog
    }
    return this.request<Blog>('/admin/blogs', {
      method: 'POST',
      body: JSON.stringify(blogData),
    })
  }

  async updateBlog(id: number, blogData: Partial<Omit<Blog, 'id' | 'createdAt' | 'updatedAt' | 'category'>>): Promise<Blog> {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 500))
      throw new Error('Blog not found')
    }
    return this.request<Blog>(`/admin/blogs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(blogData),
    })
  }

  async deleteBlog(id: number): Promise<void> {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 500))
      return
    }
    return this.request<void>(`/admin/blogs/${id}`, {
      method: 'DELETE',
    })
  }

  // Gallery management
  async getGallery(): Promise<Gallery[]> {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 500))
      return []
    }
    return this.request<Gallery[]>('/admin/gallery')
  }

  async getGalleryById(id: number): Promise<Gallery> {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 500))
      return {
        id,
        image: '',
        description: '',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    }
    return this.request<Gallery>(`/admin/gallery/${id}`)
  }

  async createGallery(galleryData: Omit<Gallery, 'id' | 'createdAt' | 'updatedAt'>): Promise<Gallery> {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 500))
      return {
        id: Math.floor(Math.random() * 1000),
        ...galleryData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    }
    return this.request<Gallery>('/admin/gallery', {
      method: 'POST',
      body: JSON.stringify(galleryData),
    })
  }

  async updateGallery(id: number, galleryData: Partial<Omit<Gallery, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Gallery> {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 500))
      return {
        id,
        image: galleryData.image || '',
        description: galleryData.description || '',
        isActive: galleryData.isActive !== undefined ? galleryData.isActive : true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    }
    return this.request<Gallery>(`/admin/gallery/${id}`, {
      method: 'PUT',
      body: JSON.stringify(galleryData),
    })
  }

  async deleteGallery(id: number): Promise<void> {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 500))
      return
    }
    return this.request<void>(`/admin/gallery/${id}`, {
      method: 'DELETE',
    })
  }

  // Policies Management
  async getPolicies(): Promise<Policy[]> {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 500))
      return []
    }
    return this.request<Policy[]>('/admin/policies')
  }

  async getPolicyById(id: number): Promise<Policy> {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 300))
      throw new Error('Policy not found')
    }
    return this.request<Policy>(`/admin/policies/${id}`)
  }

  async getPolicyByType(type: PolicyType): Promise<Policy | null> {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 300))
      return null
    }
    return this.request<Policy | null>(`/admin/policies/type/${type}`)
  }

  async createPolicy(policyData: Omit<Policy, 'id' | 'createdAt' | 'updatedAt'>): Promise<Policy> {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 500))
      return {
        id: Math.floor(Math.random() * 1000) + 1,
        ...policyData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    }
    return this.request<Policy>('/admin/policies', {
      method: 'POST',
      body: JSON.stringify(policyData),
    })
  }

  async updatePolicy(id: number, policyData: Partial<Omit<Policy, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Policy> {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 500))
      return {
        id,
        type: policyData.type || 'terms_conditions',
        content: policyData.content || '',
        isActive: policyData.isActive !== undefined ? policyData.isActive : true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    }
    return this.request<Policy>(`/admin/policies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(policyData),
    })
  }

  async deletePolicy(id: number): Promise<void> {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 500))
      return
    }
    return this.request<void>(`/admin/policies/${id}`, {
      method: 'DELETE',
    })
  }
}

export const adminApiService = new AdminApiService()
export default adminApiService
