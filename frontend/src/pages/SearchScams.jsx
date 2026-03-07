import { useState } from 'react'
import axios from 'axios'
import { getRiskLevel, getRiskDescription } from '../utils/riskCalculator'
import { useAuth } from '../context/AuthContext'
import AuthModal from '../components/AuthModal'
import './SearchScams.css'

export default function SearchScams() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const { user } = useAuth()

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!query.trim()) {
      setError('Please enter a search term')
      return
    }

    setLoading(true)
    setError(null)
    setResults(null)

    try {
      const response = await axios.post('/api/scam-check', { query })
      setResults(response.data)
    } catch (err) {
      setError(err.response?.data?.error || 'Search failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getRiskBadgeStyle = (flagCount) => {
    const risk = getRiskLevel(flagCount)
    return {
      backgroundColor: risk.bgColor,
      color: risk.textColor,
      borderLeft: `4px solid ${risk.color}`,
      padding: '6px 10px',
      borderRadius: '4px',
      fontSize: '0.85rem',
      fontWeight: '600',
      display: 'inline-block'
    }
  }

  // ── Render full results for authenticated users ──
  const renderFullResults = () => {
    if (!results) return null

    if (!results.found) {
      return (
        <div className="alert alert-success">
          ✅ No reports found for "{results.query}". This target appears to be safe!
        </div>
      )
    }

    return (
      <div>
        <div className="alert alert-warning">
          ⚠️ <strong>{results.count}</strong> report(s) found for "{results.query}"
        </div>
        <div className="reports-list">
          {results.results.map((report, idx) => {
            const riskLevel = getRiskLevel(results.count)
            const reportDate = report.created_at ? new Date(report.created_at).toLocaleDateString() : 'N/A'

            return (
              <div key={idx} className="report-card">
                <div className="report-card-top">
                  <div className="report-header">
                    <strong>Target:</strong> {report.business_name || report.phone_number || 'N/A'}
                  </div>
                  <div style={getRiskBadgeStyle(results.count)}>
                    {riskLevel.icon} {riskLevel.level} Risk
                  </div>
                </div>
                <div className="report-grid">
                  <div className="report-detail">
                    <strong>Type:</strong> {report.incident_type || 'N/A'}
                  </div>
                  <div className="report-detail">
                    <strong>Platform:</strong> {report.platform || 'N/A'}
                  </div>
                  <div className="report-detail">
                    <strong>Date:</strong> {reportDate}
                  </div>
                </div>
                <div className="report-detail">
                  <strong>Description:</strong>
                  <p>{report.description}</p>
                  {report.platform_handle && (
                    <p><strong>Handle:</strong> {report.platform_handle}</p>
                  )}
                </div>
                <div className="report-risk-info">
                  {getRiskDescription(results.count)}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ── Render blurred teaser for guests ──
  const renderBlurredResults = () => {
    if (!results) return null

    return (
      <div className="blurred-results-wrapper">
        {/* Blurred preview content */}
        <div className="blurred-all-content">
          {results.found ? (
            <div>
              <div className="alert alert-warning" style={{ opacity: 0.7 }}>
                ⚠️ <strong>{results.count}</strong> report(s) found for "{results.query}"
              </div>
              <div className="reports-list">
                {results.results.slice(0, 2).map((report, idx) => (
                  <div key={idx} className="report-card">
                    <div className="report-card-top">
                      <div className="report-header">
                        <strong>Target:</strong> ████████████
                      </div>
                      <div style={getRiskBadgeStyle(results.count)}>
                        {getRiskLevel(results.count).icon} Risk Level
                      </div>
                    </div>
                    <div className="report-grid">
                      <div className="report-detail"><strong>Type:</strong> ██████</div>
                      <div className="report-detail"><strong>Platform:</strong> ██████</div>
                      <div className="report-detail"><strong>Date:</strong> ██/██/████</div>
                    </div>
                    <div className="report-detail">
                      <strong>Description:</strong>
                      <p>This report contains detailed information about the incident including the methods used, amounts involved, and evidence provided by the reporter...</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="alert alert-success" style={{ opacity: 0.7 }}>
              Search results for "{results.query}" are ready to view.
            </div>
          )}
        </div>

        {/* Overlay CTA */}
        <div className="blur-full-overlay" onClick={() => setShowAuthModal(true)}>
          <div className="blur-full-overlay-content">
            <div className="blur-full-icon">🔒</div>
            <h3 className="blur-full-title">
              {results.found
                ? `${results.count} result${results.count > 1 ? 's' : ''} found!`
                : 'Results are ready'}
            </h3>
            <p className="blur-full-subtitle">
              {results.found
                ? 'Sign in to view full report details, risk assessments, and platform information.'
                : 'Sign in to see if this target is safe or has been reported.'}
            </p>
            <button className="blur-full-cta-btn">
              Sign Up Free to View →
            </button>
            <span className="blur-full-signin-link">
              Already have an account? <strong>Sign In</strong>
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="search-scams">
      <h2>🔍 Search Reports</h2>
      <p className="description">Check if a phone number, email, name, or business has been reported</p>

      <form onSubmit={handleSearch} className="search-form">
        <div className="input-group">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter phone, email, URL, or name..."
            disabled={loading}
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      {error && <div className="error-message">{error}</div>}

      {results && (
        <div className="results">
          {user ? renderFullResults() : renderBlurredResults()}
        </div>
      )}

      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}
    </div>
  )
}
