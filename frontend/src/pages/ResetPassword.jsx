import { useState } from 'react'
import { supabase } from '../supabaseClient'
import './Auth.css' // Reuse auth styles

export default function ResetPassword() {
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [message, setMessage] = useState('')

    const handleReset = async (e) => {
        e.preventDefault()
        if (password !== confirmPassword) {
            setError('Passwords do not match')
            return
        }

        setLoading(true)
        setError(null)
        setMessage('')

        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            })
            if (error) throw error
            setMessage('✅ Password updated successfully! You can now sign in with your new password.')
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-brand">
                    <div className="auth-logo">🌾</div>
                    <h1 className="auth-app-name">my paddy</h1>
                    <p className="auth-tagline">Set New Password</p>
                </div>

                {error && <div className="auth-alert auth-alert-error">⚠️ {error}</div>}
                {message && <div className="auth-alert auth-alert-success">{message}</div>}

                {!message && (
                    <form onSubmit={handleReset} className="auth-form">
                        <div className="auth-field">
                            <label className="auth-label">New Password</label>
                            <div className="auth-input-wrapper">
                                <input
                                    className="auth-input"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    placeholder="••••••••"
                                    minLength={6}
                                />
                                <button
                                    type="button"
                                    className="auth-toggle-visibility"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? '🐵' : '🙈'}
                                </button>
                            </div>
                        </div>

                        <div className="auth-field">
                            <label className="auth-label">Confirm New Password</label>
                            <input
                                className={`auth-input ${confirmPassword && confirmPassword !== password ? 'auth-input-error' : ''}`}
                                type={showPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                placeholder="••••••••"
                            />
                            {confirmPassword && confirmPassword !== password && (
                                <span className="auth-field-hint auth-field-error">Passwords don't match</span>
                            )}
                        </div>

                        <button type="submit" className="auth-submit-btn" disabled={loading || (confirmPassword && confirmPassword !== password)}>
                            {loading ? 'Updating...' : 'Update Password'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    )
}
