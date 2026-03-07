import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import './Auth.css'

export default function Auth() {
    const [mode, setMode] = useState('signin') // 'signin' | 'signup' | 'forgot'
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [fullName, setFullName] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [message, setMessage] = useState('')

    const { signIn, signUp, resetPassword } = useAuth()

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

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setMessage('')

        try {
            if (mode === 'forgot') {
                const { error } = await resetPassword(email)
                if (error) throw error
                setMessage('✅ Password reset link sent! Check your inbox.')
                return
            }

            if (mode === 'signup') {
                if (!fullName.trim()) throw new Error('Please enter your full name.')
                if (password.length < 6) throw new Error('Password must be at least 6 characters.')
                if (password !== confirmPassword) throw new Error('Passwords do not match.')

                const { error, data } = await signUp({
                    email,
                    password,
                    options: { data: { full_name: fullName.trim() } }
                })
                if (error) throw error

                // If email confirmation is disabled, user is immediately signed in
                if (data?.user && !data?.session) {
                    setMessage('✅ Account created! Please check your email to confirm your account before signing in.')
                } else {
                    setMessage('✅ Welcome to my paddy! You are now signed in.')
                }
            } else {
                const { error } = await signIn({ email, password })
                if (error) {
                    if (error.message.includes('Invalid login credentials')) {
                        throw new Error('Incorrect email or password. Please try again.')
                    }
                    if (error.message.includes('Email not confirmed')) {
                        throw new Error('Please confirm your email address before signing in.')
                    }
                    throw error
                }
            }
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const passwordStrength = mode === 'signup' ? getPasswordStrength(password) : null

    return (
        <div className="auth-container">
            <div className="auth-card">
                {/* Branding */}
                <div className="auth-brand">
                    <div className="auth-logo">🌾</div>
                    <h1 className="auth-app-name">my paddy</h1>
                    <p className="auth-tagline">Community fraud protection</p>
                </div>

                {/* Tab switcher */}
                {mode !== 'forgot' && (
                    <div className="auth-tabs">
                        <button
                            className={`auth-tab ${mode === 'signin' ? 'active' : ''}`}
                            onClick={() => { setMode('signin'); setError(null); setMessage('') }}
                            type="button"
                        >
                            Sign In
                        </button>
                        <button
                            className={`auth-tab ${mode === 'signup' ? 'active' : ''}`}
                            onClick={() => { setMode('signup'); setError(null); setMessage('') }}
                            type="button"
                        >
                            Create Account
                        </button>
                    </div>
                )}

                {mode === 'forgot' && (
                    <div className="auth-forgot-header">
                        <h2>Reset Password</h2>
                        <p className="auth-subtitle">We'll send a reset link to your email.</p>
                    </div>
                )}

                {error && <div className="auth-alert auth-alert-error">⚠️ {error}</div>}
                {message && <div className="auth-alert auth-alert-success">{message}</div>}

                <form onSubmit={handleSubmit} className="auth-form">
                    {mode === 'signup' && (
                        <div className="auth-field">
                            <label className="auth-label">Full Name</label>
                            <input
                                className="auth-input"
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                                placeholder="e.g. Kofi Mensah"
                                autoComplete="name"
                            />
                        </div>
                    )}

                    <div className="auth-field">
                        <label className="auth-label">Email Address</label>
                        <input
                            className="auth-input"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="you@example.com"
                            autoComplete="email"
                        />
                    </div>

                    {mode !== 'forgot' && (
                        <div className="auth-field">
                            <div className="auth-label-row">
                                <label className="auth-label">Password</label>
                                {mode === 'signin' && (
                                    <button
                                        type="button"
                                        className="auth-forgot-link"
                                        onClick={() => { setMode('forgot'); setError(null); setMessage('') }}
                                    >
                                        Forgot password?
                                    </button>
                                )}
                            </div>
                            <div className="auth-input-wrapper">
                                <input
                                    className="auth-input"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    placeholder="••••••••"
                                    minLength={6}
                                    autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                                />
                                <button
                                    type="button"
                                    className="auth-toggle-visibility"
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label="Toggle password visibility"
                                >
                                    {showPassword ? '🐵' : '🙈'}
                                </button>
                            </div>
                            {/* Password strength meter — sign up only */}
                            {passwordStrength && password && (
                                <div className="auth-strength">
                                    <div className="auth-strength-bar">
                                        <div
                                            className="auth-strength-fill"
                                            style={{ width: passwordStrength.width, background: passwordStrength.color }}
                                        />
                                    </div>
                                    <span className="auth-strength-label" style={{ color: passwordStrength.color }}>
                                        {passwordStrength.label}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}

                    {mode === 'signup' && (
                        <div className="auth-field">
                            <label className="auth-label">Confirm Password</label>
                            <input
                                className={`auth-input ${confirmPassword && confirmPassword !== password ? 'auth-input-error' : ''}`}
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
                            {confirmPassword && confirmPassword === password && (
                                <span className="auth-field-hint auth-field-ok">✓ Passwords match</span>
                            )}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="auth-submit-btn"
                        disabled={loading || (mode === 'signup' && confirmPassword && confirmPassword !== password)}
                    >
                        {loading ? (
                            <span className="auth-spinner">⟳ Processing...</span>
                        ) : (
                            {
                                signin: '👤 Sign In',
                                signup: '🌾 Create Account',
                                forgot: '📧 Send Reset Link',
                            }[mode]
                        )}
                    </button>
                </form>

                {mode === 'forgot' && (
                    <div className="auth-back-row">
                        <button
                            type="button"
                            className="auth-back-btn"
                            onClick={() => { setMode('signin'); setError(null); setMessage('') }}
                        >
                            ← Back to Sign In
                        </button>
                    </div>
                )}

                {mode !== 'forgot' && (
                    <p className="auth-terms">
                        By continuing, you agree to our community guidelines and help protect others from fraud.
                    </p>
                )}
            </div>
        </div>
    )
}
