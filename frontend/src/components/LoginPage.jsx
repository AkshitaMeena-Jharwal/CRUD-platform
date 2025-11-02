import React, { useState } from 'react'
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google'
import './LoginPage.css'

const LoginPage = ({ onLogin, onGoogleLogin }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('login') // 'login' or 'signup'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    if (!email || !password) {
      setError('Please enter both email and password')
      return
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address')
      return
    }

    setIsLoading(true)
    try {
      await onLogin(email, password)
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSuccess = async (response) => {
    setIsLoading(true)
    setError('')
    try {
      await onGoogleLogin(response)
    } catch (err) {
      setError('Google login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleError = () => {
    setError('Google login failed. Please try again.')
  }

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(email)
  }

  return (
    <GoogleOAuthProvider clientId="your-google-client-id-here">
      <div className="login-container">
        <div className="login-card">
          {/* Header */}
          <div className="login-header">
            <div className="logo">
              <div className="logo-icon">🚀</div>
              <h1>CRUD Platform</h1>
            </div>
            <p className="login-subtitle">
              Access your admin dashboard
            </p>
          </div>

          {/* Tabs */}
          <div className="tabs">
            <button 
              className={`tab ${activeTab === 'login' ? 'active' : ''}`}
              onClick={() => setActiveTab('login')}
            >
              Sign In
            </button>
            <button 
              className={`tab ${activeTab === 'signup' ? 'active' : ''}`}
              onClick={() => setActiveTab('signup')}
            >
              Sign Up
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="error-message">
              <span>⚠️</span>
              {error}
            </div>
          )}

          {/* Login Form */}
          {activeTab === 'login' && (
            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Enter your email"
                  disabled={isLoading}
                />
              </div>

              <div className="form-group">
                <div className="password-label">
                  <label htmlFor="password">Password</label>
                  <a href="#forgot" className="forgot-password">Forgot password?</a>
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                  disabled={isLoading}
                />
              </div>

              <button 
                type="submit"
                disabled={isLoading}
                className="login-button"
              >
                {isLoading ? (
                  <>
                    <div className="spinner"></div>
                    Signing In...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>
          )}

          {/* Signup Form */}
          {activeTab === 'signup' && (
            <div className="signup-message">
              <div className="signup-icon">📝</div>
              <h3>Account Registration</h3>
              <p>
                Please contact your administrator to create a new account, 
                or use Google Sign-In for instant access.
              </p>
            </div>
          )}

          {/* Divider */}
          <div className="divider">
            <span>Or continue with</span>
          </div>

          {/* Google Sign In */}
          <div className="google-button-container">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              useOneTap={false}
              theme="outline"
              size="large"
              text="signin_with"
              shape="rectangular"
              width="100%"
            />
          </div>

          {/* Demo Login Info (for development) */}
          <div className="demo-info">
            <details>
              <summary>Development Demo Accounts</summary>
              <div className="demo-accounts">
                <p><strong>Admin:</strong> admin@example.com / admin123</p>
                <p><strong>Manager:</strong> manager@example.com / manager123</p>
                <p><strong>Viewer:</strong> viewer@example.com / viewer123</p>
              </div>
            </details>
          </div>

          {/* Footer */}
          <div className="login-footer">
            <p>
              By continuing, you agree to our <a href="#terms">Terms of Service</a> and <a href="#privacy">Privacy Policy</a>.
            </p>
          </div>
        </div>

        {/* Background Decoration */}
        <div className="background-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
        </div>
      </div>
    </GoogleOAuthProvider>
  )
}

export default LoginPage