import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import ProductForm from './pages/ProductForm'
import Categories from './pages/Categories'
import CategoryProducts from './pages/CategoryProducts'
import Orders from './pages/Orders'
import Users from './pages/Users'
import UserOrders from './pages/UserOrders'
import Riders from './pages/Riders'
import Brands from './pages/Brands'
import Blogs from './pages/Blogs'
import BlogForm from './pages/BlogForm'
import Gallery from './pages/Gallery'
import Policies from './pages/Policies'
import PolicyForm from './pages/PolicyForm'
import Layout from './components/Layout'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

function AppRoutes() {
  const { isAuthenticated, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <Routes>
      <Route 
        path="/login" 
        element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} 
      />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/products" element={<Products />} />
                <Route path="/products/new" element={<ProductForm />} />
                <Route path="/products/edit/:id" element={<ProductForm />} />
                <Route path="/categories" element={<Categories />} />
                <Route path="/categories/:id/products" element={<CategoryProducts />} />
                <Route path="/brands" element={<Brands />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/users" element={<Users />} />
                <Route path="/users/:userId/orders" element={<UserOrders />} />
                <Route path="/riders" element={<Riders />} />
                <Route path="/blogs" element={<Blogs />} />
                <Route path="/blogs/new" element={<BlogForm />} />
                <Route path="/blogs/edit/:id" element={<BlogForm />} />
                <Route path="/gallery" element={<Gallery />} />
                <Route path="/policies" element={<Policies />} />
                <Route path="/policies/new" element={<PolicyForm />} />
                <Route path="/policies/view/:id" element={<PolicyForm />} />
                <Route path="/policies/edit/:id" element={<PolicyForm />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  )
}

export default App
