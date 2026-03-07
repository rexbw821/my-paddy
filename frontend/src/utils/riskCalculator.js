/**
 * Risk level calculator for My Paddy
 * Determines risk level color based on flag count
 */

/**
 * Calculate risk level based on flag count
 * @param {number} flagCount - Number of flags/reports for a target
 * @returns {object} { level: string, color: string, bgColor: string, borderColor: string }
 */
export function getRiskLevel(flagCount) {
  if (flagCount === undefined || flagCount === null) {
    flagCount = 0
  }

  const count = parseInt(flagCount, 10)

  if (count === 0) {
    return {
      level: 'Low',
      color: '#28a745',
      bgColor: '#d4edda',
      borderColor: '#c3e6cb',
      textColor: '#155724',
      icon: '✅'
    }
  } else if (count >= 1 && count <= 2) {
    return {
      level: 'Medium',
      color: '#ffc107',
      bgColor: '#fff3cd',
      borderColor: '#ffeeba',
      textColor: '#856404',
      icon: '⚠️'
    }
  } else {
    return {
      level: 'High',
      color: '#dc3545',
      bgColor: '#f8d7da',
      borderColor: '#f5c6cb',
      textColor: '#721c24',
      icon: '🚨'
    }
  }
}

/**
 * Get risk description for user-friendly display
 * @param {number} flagCount
 * @returns {string}
 */
export function getRiskDescription(flagCount) {
  const count = parseInt(flagCount || 0, 10)

  if (count === 0) {
    return 'No reports found - appears to be safe'
  } else if (count === 1) {
    return 'One report received - use caution'
  } else if (count === 2) {
    return 'Two reports received - moderate risk, be careful'
  } else {
    return `${count} reports received - high risk, proceed with extreme caution`
  }
}

/**
 * Format badge styling for risk level display
 * @param {number} flagCount
 * @returns {object} CSS style object
 */
export function getRiskBadgeStyle(flagCount) {
  const risk = getRiskLevel(flagCount)
  return {
    backgroundColor: risk.bgColor,
    color: risk.textColor,
    borderLeft: `4px solid ${risk.color}`,
    padding: '8px 12px',
    borderRadius: '4px',
    fontSize: '0.95rem',
    fontWeight: '500',
    display: 'inline-block'
  }
}
