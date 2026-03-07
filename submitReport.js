import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

export default function SubmitReport() {
  const { user, supabase } = useAuth()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [incidentType, setIncidentType] = useState('')
  const [incidentTypes, setIncidentTypes] = useState([])
  const [file, setFile] = useState(null) // ✅ For evidence
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  // 🔹 Fetch incident types
  useEffect(() => {
    const fetchIncidentTypes = async () => {
      try {
        const { data, error } = await supabase
          .from('incident_types')
          .select('name')
          .order('name', { ascending: true })

        if (error) throw error
        const types = data.map((row) => row.name)
        setIncidentTypes(types)
        setIncidentType(types[0] || '')
      } catch {
        setIncidentTypes(['scam', 'theft', 'fraud', 'robbery', 'other'])
        setIncidentType('scam')
      }
    }
    fetchIncidentTypes()
  }, [supabase])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!user) {
      alert('You must be logged in to submit a report.')
      return
    }

    // ✅ Clear previous errors
    setErrors({})

    // 🔹 Frontend validation
    const newErrors = {}
    if (!title.trim()) newErrors.title = 'Title is required'
    if (!description.trim()) newErrors.description = 'Description is required'
    if (!incidentType) newErrors.incidentType = 'Incident type is required'
    if (!file) newErrors.file = 'Evidence file is required'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setLoading(true)

    try {
      // 1️⃣ Insert report
      const { data: reportData, error: reportError } = await supabase
        .from('reports')
        .insert({
          reporter_id: user.id,
          title,
          description,
          incident_type: incidentType
        })
        .select()
        .single()

      if (reportError) throw reportError

      // 2️⃣ Upload evidence to Supabase storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${reportData.id}_${Date.now()}.${fileExt}`
      const { data: fileData, error: fileError } = await supabase.storage
        .from('evidence-bucket') // replace with your bucket name
        .upload(fileName, file)

      if (fileError) throw fileError

      const fileUrl = supabase.storage
        .from('evidence-bucket')
        .getPublicUrl(fileName).data.publicUrl

      // 3️⃣ Insert evidence record
      const { error: evidenceError } = await supabase
        .from('evidence')
        .insert({
          report_id: reportData.id,
          uploader_id: user.id,
          file_url: fileUrl,
          created_at: new Date()
        })

      if (evidenceError) throw evidenceError

      // ✅ Success
      alert('✅ Report submitted successfully!')
      setTitle('')
      setDescription('')
      setIncidentType(incidentTypes[0] || '')
      setFile(null)
      setErrors({})
    } catch (err) {
      console.error('Submit error:', err)
      alert(`Error submitting report: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: '500px', margin: '2rem auto' }}>
      <h2>Submit a Report</h2>
      <form onSubmit={handleSubmit}>
        <label>
          Title <span style={{ color: 'red' }}>*</span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          {errors.title && (
            <p style={{ color: 'red', margin: '0.25rem 0' }}>{errors.title}</p>
          )}
        </label>

        <label>
          Description <span style={{ color: 'red' }}>*</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          {errors.description && (
            <p style={{ color: 'red', margin: '0.25rem 0' }}>{errors.description}</p>
          )}
        </label>

        <label>
          Incident Type <span style={{ color: 'red' }}>*</span>
          <select
            value={incidentType}
            onChange={(e) => setIncidentType(e.target.value)}
          >
            {incidentTypes.map((type) => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
          {errors.incidentType && (
            <p style={{ color: 'red', margin: '0.25rem 0' }}>{errors.incidentType}</p>
          )}
        </label>

        <label>
          Evidence <span style={{ color: 'red' }}>*</span>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files[0])}
            accept="image/*,video/*,application/pdf"
          />
          {errors.file && (
            <p style={{ color: 'red', margin: '0.25rem 0' }}>{errors.file}</p>
          )}
        </label>

        <button type="submit" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit Report'}
        </button>
      </form>
    </div>
  )
}