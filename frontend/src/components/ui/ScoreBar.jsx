import { useEffect, useRef, useState } from 'react'
import { getScoreColor } from '../../utils/scoreUtils'

export default function ScoreBar({ label, score = 0, icon, delay = 0 }) {
  const [width, setWidth] = useState(0)
  const { stroke, text } = getScoreColor(score)

  useEffect(() => {
    const timer = setTimeout(() => setWidth(Math.round(score)), delay + 200)
    return () => clearTimeout(timer)
  }, [score, delay])

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
          {icon && <span className="text-sm">{icon}</span>}
          {label}
        </span>
        <span className={`text-sm font-bold ${text}`}>{Math.round(score)}</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${width}%`,
            background: stroke,
            transition: `width 1s cubic-bezier(0.4,0,0.2,1) ${delay}ms`,
          }}
        />
      </div>
    </div>
  )
}
