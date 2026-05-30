export const getScoreColor = (score) => {
  if (score >= 75) return { text: 'text-success-600', bg: 'bg-success-50', border: 'border-success-200', stroke: '#22c55e', ring: 'ring-success-200' }
  if (score >= 50) return { text: 'text-warning-600', bg: 'bg-warning-50', border: 'border-warning-200', stroke: '#f59e0b', ring: 'ring-warning-200' }
  return { text: 'text-danger-600', bg: 'bg-danger-50', border: 'border-danger-200', stroke: '#f43f5e', ring: 'ring-danger-200' }
}

export const getScoreLabel = (score) => {
  if (score >= 85) return 'Excellent'
  if (score >= 70) return 'Strong'
  if (score >= 55) return 'Good'
  if (score >= 40) return 'Fair'
  return 'Weak'
}

export const getInitials = (name = '') =>
  name.split(' ').slice(0, 2).map((n) => n[0]?.toUpperCase() || '').join('')

export const getAvatarBg = (name = '') => {
  const colors = [
    'from-brand-400 to-brand-600',
    'from-purple-400 to-purple-600',
    'from-teal-400 to-teal-600',
    'from-rose-400 to-rose-600',
    'from-amber-400 to-amber-600',
    'from-emerald-400 to-emerald-600',
    'from-indigo-400 to-indigo-600',
    'from-fuchsia-400 to-fuchsia-600',
  ]
  const idx = name.charCodeAt(0) % colors.length
  return colors[idx]
}

export const formatScore = (score) => Math.round(score || 0)

export const getRankStyle = (rank) => {
  if (rank === 1) return 'rank-1 text-white shadow-md'
  if (rank === 2) return 'rank-2 text-white shadow-md'
  if (rank === 3) return 'rank-3 text-white shadow-md'
  return 'bg-slate-100 text-slate-600'
}

export const getRankEmoji = (rank) => {
  if (rank === 1) return '🥇'
  if (rank === 2) return '🥈'
  if (rank === 3) return '🥉'
  return `#${rank}`
}
