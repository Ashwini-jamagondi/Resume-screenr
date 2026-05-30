export default function SkillBadge({ skill, variant = 'match' }) {
  const styles = {
    match: 'bg-success-50 text-success-700 border-success-200',
    missing: 'bg-danger-50 text-danger-600 border-danger-200',
    neutral: 'bg-slate-100 text-slate-600 border-slate-200',
  }

  const icons = {
    match: '✓',
    missing: '✗',
    neutral: null,
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border ${styles[variant]}`}
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {icons[variant] && <span className="font-bold">{icons[variant]}</span>}
      {skill}
    </span>
  )
}
