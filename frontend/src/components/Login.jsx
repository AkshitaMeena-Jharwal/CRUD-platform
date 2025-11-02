import React, { useState } from 'react'
import './Login.css'

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

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
        onLogin(data.user, data.token)
      } else {
        const error = await response.json()
        alert(`Login failed: ${error.error}`)
      }
    } catch (error) {
      alert('Login failed. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }

  const demoLogin = (demoEmail, demoPassword) => {
    setEmail(demoEmail)
    setPassword(demoPassword)
  }

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-form">
        <h2>🔐 Login to CRUD Platform</h2>
        
        <div className="form-group">
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit" disabled={loading} className="login-btn">
          {loading ? 'Logging in...' : 'Login'}
        </button>

        <div className="demo-section">
          <h3>Demo Accounts:</h3>
          <button
            type="button"
            onClick={() => demoLogin('admin@example.com', 'admin123')}
            className="demo-btn admin"
          >
            Login as Admin
          </button>
          <button
            type="button"
            onClick={() => demoLogin('manager@example.com', 'manager123')}
            className="demo-btn manager"
          >
            Login as Manager
          </button>
          <button
            type="button"
            onClick={() => demoLogin('viewer@example.com', 'viewer123')}
            className="demo-btn viewer"
          >
            Login as Viewer
          </button>
        </div>
      </form>
    </div>
  )
}

export default Login