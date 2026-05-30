import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getResumes, getJobs, getResults } from '../services/api'
import { getScoreColor, formatScore } from '../utils/scoreUtils'
import {
  Upload, FileText, BarChart3, ArrowRight,
  Users, Briefcase, TrendingUp, Award, Zap
} from 'lucide-react'
import Skeleton from '../components/ui/Skeleton'

const StepCard = ({ num, title, desc, to, icon: Icon, color }) => (
  <Link to={to} className="card-hover p-6 group cursor-pointer block">
    <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center mb-4 shadow-sm
                     group-hover:scale-110 transition-transform duration-200`}>
      <Icon size={22} className="text-white" />
    </div>
    <div className="flex items-start justify-between mb-2">
      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Step {num}</span>
      <ArrowRight size={16} className="text-slate-300 group-hover:text-brand-500 group-hover:translate-x-1 transition-all" />
    </div>
    <h3 className="text-base font-bold text-slate-800 mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{title}</h3>
    <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
  </Link>
)

const StatCard = ({ label, value, icon: Icon, color, loading }) => (
  <div className="card p-5 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center flex-shrink-0`}>
      <Icon size={20} className="text-white" />
    </div>
    <div>
      {loading ? (
        <>
          <Skeleton className="h-7 w-12 mb-1" />
          <Skeleton className="h-3 w-20" />
        </>
      ) : (
        <>
          <div className="text-2xl font-bold text-slate-800" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{value}</div>
          <div className="text-xs text-slate-500 font-medium">{label}</div>
        </>
      )}
    </div>
  </div>
)

export default function Dashboard() {
  const [stats, setStats] = useState({ resumes: 0, jobs: 0, avgScore: 0, topScore: 0 })
  const [topCandidates, setTopCandidates] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [resumesRes, jobsRes] = await Promise.all([getResumes(), getJobs()])
        const jobs = jobsRes.data || []
        const resumes = resumesRes.data || []
        let results = []
        if (jobs.length > 0) {
          try {
            const r = await getResults(jobs[jobs.length - 1].id)
            results = r.data || []
          } catch {}
        }
        const scores = results.map((r) => r.overall_score).filter(Boolean)
        setStats({
          resumes: resumes.length,
          jobs: jobs.length,
          avgScore: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
          topScore: scores.length ? Math.round(Math.max(...scores)) : 0,
        })
        setTopCandidates(results.slice(0, 3))
      } catch {}
      finally { setLoading(false) }
    }
    load()
  }, [])

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-1 bg-gradient-to-r from-brand-500 to-purple-500 rounded-full" />
          <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">Welcome back</span>
        </div>
        <h1 className="text-3xl font-bold text-slate-800 mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Resume Screening Dashboard
        </h1>
        <p className="text-slate-500 text-sm">AI-powered candidate ranking for smarter hiring decisions.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Resumes Uploaded" value={stats.resumes} icon={Users} color="bg-brand-500" loading={loading} />
        <StatCard label="Job Descriptions" value={stats.jobs} icon={Briefcase} color="bg-purple-500" loading={loading} />
        <StatCard label="Avg Match Score" value={`${stats.avgScore}%`} icon={TrendingUp} color="bg-amber-500" loading={loading} />
        <StatCard label="Top Score" value={`${stats.topScore}%`} icon={Award} color="bg-success-600" loading={loading} />
      </div>

      {/* Steps */}
      <div className="mb-8">
        <h2 className="section-title mb-4">Get Started</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StepCard num={1} title="Upload Resumes" desc="Upload PDF, DOC, or DOCX resumes. Batch upload supported."
            to="/upload" icon={Upload} color="bg-gradient-to-br from-brand-400 to-brand-600" />
          <StepCard num={2} title="Add Job Description" desc="Enter or upload your JD to define role requirements."
            to="/job" icon={FileText} color="bg-gradient-to-br from-purple-400 to-purple-600" />
          <StepCard num={3} title="View Rankings" desc="See AI-scored candidates ranked by fit percentage."
            to="/results" icon={BarChart3} color="bg-gradient-to-br from-success-500 to-emerald-600" />
        </div>
      </div>

      {/* Top candidates preview */}
      {topCandidates.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Top Candidates</h2>
            <Link to="/results" className="text-sm font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="space-y-3">
            {topCandidates.map((c, i) => {
              const { stroke, bg, text } = getScoreColor(c.overall_score)
              const medals = ['🥇', '🥈', '🥉']
              return (
                <div key={c.resume_id} className="card p-4 flex items-center gap-4">
                  <span className="text-2xl">{medals[i]}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-slate-800 truncate" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      {c.candidate_name}
                    </div>
                    <div className="text-xs text-slate-500 truncate">{c.email || 'No email'}</div>
                  </div>
                  <div className={`px-3 py-1.5 rounded-xl text-sm font-bold ${bg} ${text}`}>
                    {formatScore(c.overall_score)}%
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && stats.resumes === 0 && (
        <div className="card p-12 text-center mt-4">
          <div className="w-16 h-16 bg-brand-50 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <Zap size={28} className="text-brand-500" />
          </div>
          <h3 className="text-lg font-bold text-slate-700 mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Ready to screen candidates?
          </h3>
          <p className="text-slate-500 text-sm mb-6">Start by uploading resumes, then add a job description to run AI analysis.</p>
          <Link to="/upload" className="btn-primary">
            <Upload size={16} /> Upload Resumes
          </Link>
        </div>
      )}
    </div>
  )
}
