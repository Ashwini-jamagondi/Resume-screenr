import { useState } from 'react'
import ScoreRing from '../ui/ScoreRing'
import ScoreBar from '../ui/ScoreBar'
import SkillBadge from '../ui/SkillBadge'
import { getInitials, getAvatarBg, getScoreLabel, getScoreColor, getRankStyle, formatScore } from '../../utils/scoreUtils'
import { Mail, Phone, FileText, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'

export default function CandidateCard({ candidate, delay = 0 }) {
  const [expanded, setExpanded] = useState(false)
  const { rank, candidate_name, email, phone, overall_score, skills_score,
          experience_score, education_score, keyword_score,
          matching_skills = [], missing_skills = [], summary, file_path } = candidate

  const { bg, text, stroke } = getScoreColor(overall_score)
  const rankMedals = ['🥇', '🥈', '🥉']
  const isTop3 = rank <= 3

  return (
    <div
      className="card overflow-hidden transition-all duration-300 hover:shadow-card-hover"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Top score bar */}
      <div className="h-1.5 bg-slate-100">
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${overall_score}%`, background: stroke, transitionDelay: `${delay + 300}ms` }}
        />
      </div>

      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start gap-4 mb-4">
          {/* Rank badge */}
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0
                           ${getRankStyle(rank)}`}
               style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {isTop3 ? rankMedals[rank - 1] : `#${rank}`}
          </div>

          {/* Avatar */}
          <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${getAvatarBg(candidate_name)}
                           flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-sm`}
               style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {getInitials(candidate_name)}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-slate-800 truncate" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {candidate_name}
            </h3>
            <div className="space-y-0.5 mt-1">
              {email && (
                <p className="text-xs text-slate-500 flex items-center gap-1.5 truncate">
                  <Mail size={11} className="text-slate-400 flex-shrink-0" /> {email}
                </p>
              )}
              {phone && (
                <p className="text-xs text-slate-500 flex items-center gap-1.5">
                  <Phone size={11} className="text-slate-400 flex-shrink-0" /> {phone}
                </p>
              )}
            </div>
          </div>

          {/* Score ring */}
          <div className="flex-shrink-0 text-center">
            <ScoreRing score={overall_score} size={76} />
            <p className={`text-xs font-bold mt-1 ${text}`}>{getScoreLabel(overall_score)}</p>
          </div>
        </div>

        {/* Score breakdown bars */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 mb-4">
          <ScoreBar label="Skills" score={skills_score} icon="🎯" delay={delay + 100} />
          <ScoreBar label="Experience" score={experience_score} icon="💼" delay={delay + 200} />
          <ScoreBar label="Education" score={education_score} icon="🎓" delay={delay + 300} />
          <ScoreBar label="Keywords" score={keyword_score} icon="🔍" delay={delay + 400} />
        </div>

        {/* Matching skills preview */}
        {matching_skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {matching_skills.slice(0, 4).map((s) => (
              <SkillBadge key={s} skill={s} variant="match" />
            ))}
            {matching_skills.length > 4 && (
              <span className="badge-slate">+{matching_skills.length - 4} more</span>
            )}
          </div>
        )}

        {/* Expand toggle */}
        <div className="border-t border-slate-100 pt-3 mt-3 flex items-center justify-between">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 transition-colors"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {expanded ? 'Hide details' : 'Show details'}
          </button>
          {file_path && (
            <a href={`/${file_path}`} target="_blank" rel="noopener noreferrer"
               className="text-xs font-semibold text-slate-400 hover:text-brand-600 flex items-center gap-1 transition-colors">
              <FileText size={13} /> View Resume <ExternalLink size={11} />
            </a>
          )}
        </div>

        {/* Expanded details */}
        {expanded && (
          <div className="mt-4 space-y-4 animate-fade-in">
            {summary && (
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">AI Summary</p>
                <p className="text-sm text-slate-600 leading-relaxed">{summary}</p>
              </div>
            )}

            {matching_skills.length > 0 && (
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                  ✓ Matching Skills ({matching_skills.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {matching_skills.map((s) => <SkillBadge key={s} skill={s} variant="match" />)}
                </div>
              </div>
            )}

            {missing_skills.length > 0 && (
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                  ✗ Missing Skills ({missing_skills.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {missing_skills.map((s) => <SkillBadge key={s} skill={s} variant="missing" />)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
