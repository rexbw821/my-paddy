import { useState } from 'react'
import axios from 'axios'
import { supabase } from '../supabaseClient'
import { validateReportForm } from '../utils/validators'
import { useAuth } from '../context/AuthContext'
import './SubmitReport.css'

const PLATFORM_OPTIONS = [
  'Snapchat', 'TikTok', 'Jumia', 'Telegram', 'MoMo',
  'WhatsApp', 'Facebook', 'Instagram', 'Twitter', 'LinkedIn', 'Other'
]

export default function SubmitReport() {
  const INITIAL_STATE = {
    business_name: '',
    phone_number: '',
    platform: 'MoMo',
    platform_handle: '',
    incident_type: 'fraud',
    description: ''
  }

  const [formData, setFormData] = useState(INITIAL_STATE)
  const [evidenceFiles, setEvidenceFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [validationErrors, setValidationErrors] = useState({})
  const [submitMessage, setSubmitMessage] = useState('')

  const { user } = useAuth()

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files)
    const validFiles = files.filter(file => {
      const isValid = file.type.startsWith('image/') || file.type === 'application/pdf'
      const isSmall = file.size <= 5 * 1024 * 1024 // 5MB limit
      return isValid && isSmall
    })

    if (validFiles.length < files.length) {
      const msg = 'Some files were rejected. Only images and PDFs under 5MB are allowed.'
      setError(msg)
      console.warn(msg, files.filter(f => !validFiles.includes(f)))
    }

    setEvidenceFiles(prev => [...prev, ...validFiles])
  }

  const removeFile = (index) => {
    setEvidenceFiles(prev => prev.filter((_, i) => i !== index))
  }

  const uploadFilesToSupabase = async () => {
    const urls = []
    setUploading(true)

    for (const file of evidenceFiles) {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
      const filePath = `${user.id}/${fileName}`

      try {
        const { data, error: uploadError } = await supabase.storage
          .from('evidence')
          .upload(filePath, file, {
            contentType: file.type,
            upsert: true
          })

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('evidence')
          .getPublicUrl(filePath)

        urls.push(publicUrl)
      } catch (err) {
        const detail = err?.message || err?.error_description || JSON.stringify(err)
        console.error('Error uploading file:', file.name, err)
        throw new Error(`Failed to upload ${file.name}: ${detail}`)
      }
    }

    setUploading(false)
    return urls
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const updated = { ...prev }
        delete updated[name]
        return updated
      })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const targetValue = formData.phone_number || formData.business_name || formData.platform_handle
    const validation = validateReportForm({
      target: targetValue,
      type: formData.incident_type,
      description: formData.description,
      platform: formData.platform
    })

    if (!validation.valid) {
      setValidationErrors(validation.errors)
      setError('At least a phone number or business name is required.')
      return
    }

    setLoading(true)
    setError(null)
    setValidationErrors({})

    try {
      let evidence_urls = []
      if (evidenceFiles.length > 0) {
        evidence_urls = await uploadFilesToSupabase()
      }

      // Get the user's JWT so the backend can act on their behalf
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      const response = await axios.post('/api/reports', {
        business_name: formData.business_name.trim(),
        phone_number: formData.phone_number.trim(),
        incident_type: formData.incident_type,
        description: formData.description.trim(),
        platform: formData.platform || null,
        platform_handle: formData.platform_handle || null,
        reporter_id: user.id,
        evidence_urls
      }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })

      if (response.data) {
        setSuccess(true)
        setSubmitMessage('Report submitted successfully! Your report is pending approval.')
        setFormData(INITIAL_STATE)
        setEvidenceFiles([])
        setTimeout(() => setSuccess(false), 6000)
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'Failed to submit report. Please try again.'
      setError(errorMsg)
      console.error('Report submission error:', err)
    } finally {
      setLoading(false)
      setUploading(false)
    }
  }

  if (!user) {
    return (
      <div className="submit-report auth-prompt-container">
        <h2>Report a Scam</h2>
        <div className="auth-prompt-card">
          <div className="auth-prompt-icon">🛡️</div>
          <h3>Join my paddy to Report</h3>
          <p>Please sign in to your account to submit a report. This helps us maintain the integrity of our community data.</p>
          <p className="auth-prompt-sub">Your reports help protect thousands of others from similar fraud.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="submit-report">
      <h2>Report Fraud</h2>
      <p className="description">Help protect communities by reporting fraudulent activity</p>

      {success && (
        <div className="alert alert-success">
          ✅ {submitMessage}
        </div>
      )}

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit} className="report-form">
        <div className="form-group-row">
          <div className="form-group flex-1">
            <label htmlFor="business_name">
              <strong>Business/Seller Name</strong>
            </label>
            <input
              type="text"
              id="business_name"
              name="business_name"
              value={formData.business_name}
              onChange={handleChange}
              placeholder="e.g., Electronics Hub"
              disabled={loading || uploading}
            />
          </div>
          <div className="form-group flex-1">
            <label htmlFor="phone_number">
              <strong>Phone Number</strong>
            </label>
            <input
              type="text"
              id="phone_number"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleChange}
              placeholder="e.g., 054XXXXXXX"
              disabled={loading || uploading}
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="incident_type">
            <strong>Type of Incident</strong>
            <span className="required">*</span>
          </label>
          <select
            id="incident_type"
            name="incident_type"
            value={formData.incident_type}
            onChange={handleChange}
            disabled={loading || uploading}
          >
            <option value="scam">Scam</option>
            <option value="theft">Theft</option>
            <option value="robbery">Robbery</option>
            <option value="fraud">Fraud</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="form-group-row">
          <div className="form-group flex-1">
            <label htmlFor="platform">
              <strong>Platform (Optional)</strong>
            </label>
            <select
              id="platform"
              name="platform"
              value={formData.platform}
              onChange={handleChange}
              disabled={loading || uploading}
            >
              <option value="">-- Select --</option>
              {PLATFORM_OPTIONS.map(platform => (
                <option key={platform} value={platform}>
                  {platform}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group flex-1">
            <label htmlFor="platform_handle">
              <strong>Handle/Username</strong>
            </label>
            <input
              type="text"
              id="platform_handle"
              name="platform_handle"
              value={formData.platform_handle}
              onChange={handleChange}
              placeholder="e.g., @seller_handle"
              disabled={loading || uploading}
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="description">
            <strong>Description</strong>
            <span className="required">*</span>
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Provide details about the incident..."
            rows="5"
            disabled={loading || uploading}
            required
          />
          <span className="field-hint">
            {formData.description.length}/2000 characters
          </span>
        </div>

        <div className="form-group evidence-upload-section">
          <label>
            <strong>Evidence (Optional)</strong>
          </label>
          <p className="field-hint">Upload screenshots, receipts, or PDFs (Max 5MB each)</p>

          <div className="evidence-controls">
            <label className="file-input-label">
              <span>📁 Choose Files</span>
              <input
                type="file"
                multiple
                accept="image/*,application/pdf"
                onChange={handleFileChange}
                disabled={loading || uploading}
              />
            </label>
          </div>

          {evidenceFiles.length > 0 && (
            <div className="evidence-preview-grid">
              {evidenceFiles.map((file, index) => (
                <div key={index} className="evidence-preview-item">
                  <div className="file-info">
                    <span className="file-icon">
                      {file.type.startsWith('image/') ? '🖼️' : '📄'}
                    </span>
                    <span className="file-name">{file.name}</span>
                    <span className="file-size">({(file.size / 1024).toFixed(1)} KB)</span>
                  </div>
                  <button
                    type="button"
                    className="remove-file-btn"
                    onClick={() => removeFile(index)}
                    disabled={loading || uploading}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button type="submit" disabled={loading || uploading} className="submit-btn">
          {uploading ? '⬆️ Uploading Evidence...' : loading ? '⏳ Submitting...' : '🚀 Submit Report'}
        </button>
      </form>

      <div className="info-box">
        <h3>ℹ️ Guidelines</h3>
        <ul>
          <li>Be honest and accurate in your report</li>
          <li>All reports are reviewed before being published</li>
          <li>Your reports help protect thousands of others</li>
        </ul>
      </div>
    </div>
  )
}
