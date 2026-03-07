import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import './AuthModal.css'

export default function AuthModal({ onClose }) {
    const [isSignUp, setIsSignUp] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [fullName, setFullName] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [message, setMessage] = useState('')

    const { signIn, signUp } = useAuth()

    const getPasswordStrength = (pwd) => {
        if (!pwd) return null
        const checks = [
            pwd.length >= 8,
            /[A-Z]/.test(pwd),
            /[0-9]/.test(pwd),
            /[^A-Za-z0-9]/.test(pwd),
        ]
        const score = checks.filter(Boolean).length
        if (score <= 1) return { label: 'Weak', color: '#ef4444', width: '25%' }
        if (score === 2) return { label: 'Fair', color: '#f59e0b', width: '50%' }
        if (score === 3) return { label: 'Good', color: '#3b82f6', width: '75%' }
        return { label: 'Strong', color: '#22c55e', width: '100%' }
    }

    const handleAuth = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setMessage('')

        try {
            if (isSignUp) {
                if (password !== confirmPassword) throw new Error('Passwords do not match')

                const { error, data } = await signUp({
                    email,
                    password,
                    options: { data: { full_name: fullName || email.split('@')[0] } }
                })
                if (error) throw error

                if (data?.user && !data?.session) {
                    setMessage('Account created! Please check your email to confirm, then sign in.')
                } else {
                    setMessage('Welcome! Signing you in...')
                    setTimeout(() => onClose(), 1200)
                }
            } else {
                const { error } = await signIn({ email, password })
                if (error) {
                    if (error.message.includes('Invalid login credentials')) throw new Error('Incorrect email or password.')
                    if (error.message.includes('Email not confirmed')) throw new Error('Please confirm your email before signing in.')
                    throw error
                }
                onClose()
            }
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) onClose()
    }

    const passwordStrength = isSignUp ? getPasswordStrength(password) : null

    return (
        <div className="auth-modal-backdrop" onClick={handleBackdropClick}>
            <div className="auth-modal">
                <button className="auth-modal-close" onClick={onClose}>×</button>

                <h2>{isSignUp ? '🌾 Join my paddy' : '🌾 Welcome Back'}</h2>
                <p className="auth-subtitle">
                    {isSignUp
                        ? 'Create a free account to view full report details and help protect your community.'
                        : 'Sign in to view full report details and access all features.'}
                </p>

                {error && <div className="alert alert-error">{error}</div>}
                {message && <div className="alert alert-success">{message}</div>}

                <form onSubmit={handleAuth} className="auth-form">
                    {isSignUp && (
                        <div className="form-group">
                            <label>Full Name</label>
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                                placeholder="John Doe"
                                autoComplete="name"
                            />
                        </div>
                    )}
                    <div className="form-group">
                        <label>Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="you@example.com"
                            autoComplete="email"
                        />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <div className="password-input-wrapper">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="••••••••"
                                minLength={6}
                                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                            />
                            <button
                                type="button"
                                className="password-toggle-btn"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? '🐵' : '🙈'}
                            </button>
                        </div>
                        {passwordStrength && password && (
                            <div className="password-strength-meter">
                                <div className="strength-bar">
                                    <div
                                        className="strength-fill"
                                        style={{ width: passwordStrength.width, backgroundColor: passwordStrength.color }}
                                    />
                                </div>
                                <span className="strength-label" style={{ color: passwordStrength.color }}>
                                    {passwordStrength.label}
                                </span>
                            </div>
                        )}
                    </div>

                    {isSignUp && (
                        <div className="form-group">
                            <label>Confirm Password</label>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                placeholder="••••••••"
                                autoComplete="new-password"
                            />
                            {confirmPassword && confirmPassword !== password && (
                                <span className="auth-field-hint auth-field-error">Passwords don't match</span>
                            )}
                        </div>
                    )}

                    <button type="submit" className="auth-btn" disabled={loading || (isSignUp && confirmPassword && confirmPassword !== password)}>
                        {loading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In')}
                    </button>
                </form>

                <div className="auth-footer">
                    {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                    <button onClick={() => { setIsSignUp(!isSignUp); setError(null); setMessage('') }} className="auth-toggle-btn">
                        {isSignUp ? 'Sign In' : 'Sign Up Free'}
                    </button>
                </div>
            </div>
        </div>
    )
}
