import { useEffect, useRef } from 'react'
import { getScoreColor, getScoreLabel, formatScore } from '../../utils/scoreUtils'

const RADIUS = 40
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export default function ScoreRing({ score = 0, size = 100, className = '' }) {
  const circleRef = useRef(null)
  const formatted = formatScore(score)
  const { stroke } = getScoreColor(formatted)
  const offset = CIRCUMFERENCE - (formatted / 100) * CIRCUMFERENCE

  useEffect(() => {
    if (!circleRef.current) return
    circleRef.current.style.strokeDashoffset = CIRCUMFERENCE
    const raf = requestAnimationFrame(() => {
      setTimeout(() => {
        if (circleRef.current) circleRef.current.style.strokeDashoffset = offset
      }, 100)
    })
    return () => cancelAnimationFrame(raf)
  }, [score, offset])

  const fontSize = size < 90 ? 14 : 18
  const labelSize = size < 90 ? 8 : 10

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}
         style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 100 100"
           style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx="50" cy="50" r={RADIUS}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="8"
        />
        <circle
          ref={circleRef}
          cx="50" cy="50" r={RADIUS}
          fill="none"
          stroke={stroke}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE}
          style={{ transition: 'stroke-dashoffset 1.1s cubic-bezier(0.4,0,0.2,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center"
           style={{ transform: 'rotate(0deg)' }}>
        <span className="font-bold leading-none" style={{ fontSize, fontFamily: "'Plus Jakarta Sans', sans-serif", color: stroke }}>
          {formatted}
        </span>
        <span className="text-slate-400 font-medium leading-none mt-0.5" style={{ fontSize: labelSize }}>
          /100
        </span>
      </div>
    </div>
  )
}
