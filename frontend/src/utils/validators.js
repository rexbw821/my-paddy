/**
 * Input validation utilities for My Paddy frontend
 */

/**
 * Validate target (phone, email, or name)
 * @param {string} target - The target to validate
 * @returns {object} { valid: boolean, error: string | null }
 */
export function validateTarget(target) {
  if (!target || typeof target !== 'string') {
    return { valid: false, error: 'Target is required' }
  }

  const trimmed = target.trim()
  
  if (trimmed.length < 3) {
    return { valid: false, error: 'Target must be at least 3 characters' }
  }

  if (trimmed.length > 100) {
    return { valid: false, error: 'Target must not exceed 100 characters' }
  }

  // Allow: alphanumeric, spaces, @, +, -, ., _
  const validFormat = /^[a-zA-Z0-9\s@+\-._]+$/.test(trimmed)
  if (!validFormat) {
    return { valid: false, error: 'Target contains invalid characters' }
  }

  return { valid: true, error: null }
}

/**
 * Validate report type
 * @param {string} type - The incident type
 * @returns {object} { valid: boolean, error: string | null }
 */
export function validateType(type) {
  const validTypes = ['scam', 'theft', 'robbery', 'fraud', 'other']
  
  if (!type || typeof type !== 'string') {
    return { valid: false, error: 'Type is required' }
  }

  if (!validTypes.includes(type.toLowerCase())) {
    return { valid: false, error: `Type must be one of: ${validTypes.join(', ')}` }
  }

  return { valid: true, error: null }
}

/**
 * Validate description
 * @param {string} description - The incident description
 * @returns {object} { valid: boolean, error: string | null }
 */
export function validateDescription(description) {
  if (!description || typeof description !== 'string') {
    return { valid: false, error: 'Description is required' }
  }

  const trimmed = description.trim()

  if (trimmed.length < 10) {
    return { valid: false, error: 'Description must be at least 10 characters' }
  }

  if (trimmed.length > 2000) {
    return { valid: false, error: 'Description must not exceed 2000 characters' }
  }

  return { valid: true, error: null }
}

/**
 * Validate platform (optional)
 * @param {string} platform - The platform where incident occurred
 * @returns {object} { valid: boolean, error: string | null }
 */
export function validatePlatform(platform) {
  // Platform is optional
  if (!platform || platform === '') {
    return { valid: true, error: null }
  }

  const validPlatforms = [
    'Snapchat', 'TikTok', 'Jumia', 'Telegram', 'MoMo', 
    'WhatsApp', 'Facebook', 'Instagram', 'Twitter', 'LinkedIn', 'Other'
  ]

  if (!validPlatforms.includes(platform)) {
    return { valid: false, error: `Platform must be one of: ${validPlatforms.join(', ')}` }
  }

  return { valid: true, error: null }
}

/**
 * Validate entire report form
 * @param {object} formData - { target, type, description, platform }
 * @returns {object} { valid: boolean, errors: object }
 */
export function validateReportForm(formData) {
  const errors = {}

  const targetValidation = validateTarget(formData.target)
  if (!targetValidation.valid) {
    errors.target = targetValidation.error
  }

  const typeValidation = validateType(formData.type)
  if (!typeValidation.valid) {
    errors.type = typeValidation.error
  }

  const descriptionValidation = validateDescription(formData.description)
  if (!descriptionValidation.valid) {
    errors.description = descriptionValidation.error
  }

  const platformValidation = validatePlatform(formData.platform)
  if (!platformValidation.valid) {
    errors.platform = platformValidation.error
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  }
}

/**
 * Normalize a target string (lowercase, alphanumeric only)
 * Used for comparison/deduplication
 * @param {string} target
 * @returns {string}
 */
export function normalizeTarget(target) {
  if (!target) return ''
  return target.trim().toLowerCase().replace(/[^a-z0-9]+/g, '')
}
