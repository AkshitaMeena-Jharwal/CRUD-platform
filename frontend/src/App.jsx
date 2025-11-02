import React, { useState, useEffect } from 'react'

console.log('📦 App.jsx is loading...')

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  console.log('🔄 App component rendering, user:', user)

  useEffect(() => {
    // Check if we're already logged in from previous session
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    
    if (token && userData) {
      // Verify the token is still valid
      verifyToken(token).then(isValid => {
        if (isValid) {
          setUser(JSON.parse(userData))
        } else {
          // Token is invalid, clear storage
          localStorage.removeItem('token')
          localStorage.removeItem('user')
        }
        setLoading(false)
      })
    } else {
      setLoading(false)
    }
  }, [])

  const verifyToken = async (token) => {
    try {
      const response = await fetch('/api/auth/verify', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      return response.ok
    } catch (error) {
      console.error('Token verification failed:', error)
      return false
    }
  }

  const handleLogin = async (email, password) => {
    console.log('🔐 Attempting login for:', email)
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Login successful:', data.user)
        setUser(data.user)
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        return true
      } else {
        const error = await response.json()
        console.error('❌ Login failed:', error)
        alert(`Login failed: ${error.error}`)
      }
    } catch (error) {
      console.error('❌ Login error:', error)
      alert('Login failed. Please check if the backend is running.')
    }
    return false
  }

  const handleLogout = () => {
    console.log('👋 Logging out')
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  if (loading) {
    return (
      <div style={{ padding: '50px', textAlign: 'center' }}>
        <h2>Loading...</h2>
      </div>
    )
  }

  if (!user) {
    return <LoginForm onLogin={handleLogin} />
  }

  return (
    <div style={{ fontFamily: 'Arial, sans-serif' }}>
      <header style={{ 
        background: '#2c3e50', 
        color: 'white', 
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1>🚀 CRUD Platform Admin</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span>Welcome, <strong>{user.email}</strong> ({user.role})</span>
          <button 
            onClick={handleLogout}
            style={{ 
              background: '#e74c3c',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>
      </header>

      <main style={{ padding: '2rem' }}>
        <SimpleModelBuilder user={user} />
      </main>
    </div>
  )
}

// Login Form Component
function LoginForm({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) {
      alert('Please enter both email and password')
      return
    }

    setIsLoading(true)
    await onLogin(email, password)
    setIsLoading(false)
  }

  const useDemoAccount = (demoEmail, demoPassword) => {
    setEmail(demoEmail)
    setPassword(demoPassword)
  }

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{ 
        background: 'white', 
        padding: '2rem', 
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        width: '100%',
        maxWidth: '400px'
      }}>
        <h1 style={{ textAlign: 'center', marginBottom: '0.5rem', color: '#2c3e50' }}>
          🚀 CRUD Platform
        </h1>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '2rem' }}>
          Please login to continue
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Email:
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem'
              }}
              placeholder="Enter your email"
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Password:
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem'
              }}
              placeholder="Enter your password"
            />
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            style={{ 
              width: '100%',
              padding: '0.75rem',
              background: isLoading ? '#bdc3c7' : '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '1rem',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              marginBottom: '1.5rem'
            }}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div style={{ borderTop: '1px solid #eee', paddingTop: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem', color: '#666', fontSize: '1rem' }}>
            Demo Accounts:
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button 
              onClick={() => useDemoAccount('admin@example.com', 'admin123')}
              style={{ 
                padding: '0.75rem',
                background: '#2ecc71',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              Use Admin Account
            </button>
            
            <button 
              onClick={() => useDemoAccount('manager@example.com', 'manager123')}
              style={{ 
                padding: '0.75rem',
                background: '#f39c12',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              Use Manager Account
            </button>
            
            <button 
              onClick={() => useDemoAccount('viewer@example.com', 'viewer123')}
              style={{ 
                padding: '0.75rem',
                background: '#95a5a6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              Use Viewer Account
            </button>
          </div>
        </div>

        <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#f8f9fa', borderRadius: '4px' }}>
          <h4 style={{ marginBottom: '0.5rem', color: '#666' }}>Backend Status:</h4>
          <button 
            onClick={async () => {
              try {
                const response = await fetch('/api/health')
                const data = await response.json()
                alert(`✅ Backend is running!\n\nStatus: ${data.message}\nModels: ${data.models}\nTime: ${new Date(data.timestamp).toLocaleTimeString()}`)
              } catch (error) {
                alert('❌ Backend is not reachable.\n\nMake sure the backend server is running on port 3001.')
              }
            }}
            style={{ 
              padding: '0.5rem 1rem', 
              background: '#34495e',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            Check Backend Connection
          </button>
        </div>
      </div>
    </div>
  )
}

// Simple Model Builder Component (unchanged)
function SimpleModelBuilder({ user }) {
  const [models, setModels] = useState([])
  const [newModelName, setNewModelName] = useState('')

  useEffect(() => {
    fetchModels()
  }, [])

  const fetchModels = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/models', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setModels(data)
      }
    } catch (error) {
      console.error('Error fetching models:', error)
    }
  }

  const createModel = async () => {
    if (!newModelName.trim()) {
      alert('Please enter a model name')
      return
    }

    const token = localStorage.getItem('token')
    const modelData = {
      name: newModelName,
      fields: [
        { name: 'name', type: 'string', required: true },
        { name: 'description', type: 'text', required: false }
      ],
      rbac: {
        Admin: ['all'],
        Manager: ['create', 'read', 'update'],
        Viewer: ['read']
      }
    }

    try {
      const response = await fetch('/api/models', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(modelData)
      })

      if (response.ok) {
        alert(`Model "${newModelName}" created successfully!`)
        setNewModelName('')
        fetchModels()
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error creating model:', error)
      alert('Failed to create model. Check console for details.')
    }
  }

  return (
    <div>
      <div style={{ 
        background: 'white', 
        padding: '1.5rem', 
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '2rem'
      }}>
        <h2>Create New Model</h2>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '1rem' }}>
          <input
            type="text"
            placeholder="Enter model name (e.g., Product, Employee)"
            value={newModelName}
            onChange={(e) => setNewModelName(e.target.value)}
            style={{ 
              padding: '10px', 
              fontSize: '16px', 
              flex: 1,
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
            onKeyPress={(e) => e.key === 'Enter' && createModel()}
          />
          <button 
            onClick={createModel}
            style={{ 
              padding: '10px 20px', 
              fontSize: '16px',
              background: '#27ae60',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Create Model
          </button>
        </div>
        <p style={{ color: '#666', fontSize: '14px' }}>
          This will create a model with basic fields that you can extend later.
        </p>
      </div>

      <div style={{ 
        background: 'white', 
        padding: '1.5rem', 
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h2>Existing Models ({models.length})</h2>
        
        {models.length === 0 ? (
          <p style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
            No models created yet. Create your first model above!
          </p>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {models.map(model => (
              <div 
                key={model.name} 
                style={{ 
                  border: '1px solid #e1e1e1', 
                  padding: '1rem', 
                  borderRadius: '4px' 
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h3 style={{ margin: 0, color: '#2c3e50' }}>{model.name}</h3>
                  <span style={{ background: '#3498db', color: 'white', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem' }}>
                    {model.fields.length} fields
                  </span>
                </div>
                
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {model.fields.map(field => (
                    <span 
                      key={field.name}
                      style={{
                        background: '#ecf0f1',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        color: '#2c3e50'
                      }}
                    >
                      {field.name} ({field.type}) {field.required && '•'}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default App