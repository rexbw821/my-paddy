import { useAuth } from '../context/AuthContext'
import './Profile.css'

export default function Profile() {
    const { user, profile, signOut } = useAuth()

    if (!user) return null

    return (
        <div className="profile-container">
            <div className="profile-card">
                <div className="profile-header">
                    <div className="profile-avatar">
                        {profile?.avatar_url ? (
                            <img src={profile.avatar_url} alt="Avatar" />
                        ) : (
                            <div className="avatar-placeholder">
                                {user.email.substring(0, 2).toUpperCase()}
                            </div>
                        )}
                    </div>
                    <h2>{profile?.full_name || 'Community Member'}</h2>
                    <p className="profile-email">{user.email}</p>
                </div>

                <div className="profile-stats">
                    <div className="stat-item">
                        <span className="stat-label">Reputation</span>
                        <span className="stat-value">{profile?.reputation_score || 0}</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">Reports Filed</span>
                        <span className="stat-value">Coming Soon</span>
                    </div>
                </div>

                <div className="profile-actions">
                    <button className="sign-out-btn" onClick={() => signOut()}>
                        Sign Out
                    </button>
                </div>
            </div>
        </div>
    )
}
