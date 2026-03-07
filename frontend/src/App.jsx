import { useState, useEffect } from 'react'
import SearchScams from './pages/SearchScams'
import SubmitReport from './pages/SubmitReport'
import Auth from './pages/Auth'
import Profile from './pages/Profile'
import ResetPassword from './pages/ResetPassword'
import Admin from './pages/Admin'
import { useAuth } from './context/AuthContext'
import './App.css'

function App() {
  const [currentPage, setCurrentPage] = useState('search')
  const { user, profile, isAdmin, loading } = useAuth()

  useEffect(() => {
    const hash = window.location.hash || ''
    if (hash.includes('type=recovery')) {
      setCurrentPage('reset-password')
      window.history.replaceState(null, '', window.location.pathname)
    }
  }, [])

  useEffect(() => {
    if (user && currentPage === 'auth') setCurrentPage('search')
  }, [user, currentPage])

  if (loading) return <div className="app-container"><h2>Loading...</h2></div>

  return (
    <div className={`app-container ${currentPage === 'admin' ? 'admin-layout' : ''}`}>
      <header className="app-header">
        <div className="header-left" onClick={() => setCurrentPage('search')} style={{ cursor: 'pointer' }}>
          <h1>🌾 my paddy</h1>
          {currentPage !== 'admin' && <p>Protect communities from fraud and scams</p>}
        </div>
        <div className="header-right">
          {user ? (
            <div className="user-profile-nav" onClick={() => setCurrentPage('profile')}>
              <div className="user-info">
                <span>{profile?.full_name || user.email?.split('@')[0]}</span>
                <span>{profile?.reputation_score ?? 0} pts</span>
              </div>
              <div className="user-avatar-small">
                {profile?.avatar_url ? <img src={profile.avatar_url} alt="Avatar" /> : user.email?.[0]?.toUpperCase()}
              </div>
            </div>
          ) : (
            <button onClick={() => setCurrentPage('auth')}>Sign In</button>
          )}
        </div>
      </header>

      <nav className="app-nav">
        <button className={currentPage === 'search' ? 'active' : ''} onClick={() => setCurrentPage('search')}>🔍 Search</button>
        <button className={currentPage === 'submit' ? 'active' : ''} onClick={() => setCurrentPage('submit')}>📝 Report</button>
        {isAdmin && <button className={currentPage === 'admin' ? 'active' : ''} onClick={() => setCurrentPage('admin')}>🛡️ Admin</button>}
      </nav>

      <main className="app-main">
        {currentPage === 'search' && <SearchScams />}
        {currentPage === 'submit' && <SubmitReport />}
        {currentPage === 'auth' && <Auth />}
        {currentPage === 'profile' && (user ? <Profile /> : <Auth />)}
        {currentPage === 'reset-password' && <ResetPassword />}
        {currentPage === 'admin' && (isAdmin ? <Admin /> : <SearchScams />)}
      </main>
    </div>
  )
}

export default App