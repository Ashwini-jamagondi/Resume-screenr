import { useState, useEffect, useMemo } from 'react'
import toast from 'react-hot-toast'
import { getJobs, runAnalysis, getResults, getExportUrl, sendShortlistEmails, sendSingleEmail } from '../services/api'
import CandidateCard from '../components/dashboard/CandidateCard'
import { CandidateCardSkeleton } from '../components/ui/Skeleton'
import { formatScore, getScoreColor } from '../utils/scoreUtils'
import {
  BarChart3, Play, Download, Search, ChevronDown,
  Loader2, Users, TrendingUp, Award, Target, Mail, Send
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, RadarChart, Radar, PolarGrid,
  PolarAngleAxis
} from 'recharts'

const StatPill = ({ icon: Icon, label, value, color }) => (
  <div className="card px-4 py-3 flex items-center gap-3">
    <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center flex-shrink-0`}>
      <Icon size={16} className="text-white" />
    </div>
    <div>
      <div className="text-lg font-bold text-slate-800" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  </div>
)

export default function ResultsPage() {
  const [jobs, setJobs] = useState([])
  const [selectedJobId, setSelectedJobId] = useState(null)
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(false)
  const [running, setRunning] = useState(false)
  const [sendingEmails, setSendingEmails] = useState(false)
  const [emailResults, setEmailResults] = useState(null)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('rank')
  const [tab, setTab] = useState('list')

  useEffect(() => {
    getJobs().then((r) => {
      const j = r.data || []
      setJobs(j)
      if (j.length > 0) {
        const last = j[j.length - 1]
        setSelectedJobId(last.id)
        loadResults(last.id)
      }
    }).catch(() => toast.error('Failed to load jobs'))
  }, [])

  const loadResults = async (jobId) => {
    setLoading(true)
    try {
      const res = await getResults(jobId)
      setCandidates(res.data || [])
    } catch {
      setCandidates([])
    } finally {
      setLoading(false)
    }
  }

  const handleRun = async () => {
    if (!selectedJobId) return toast.error('Select a job description first')
    setRunning(true)
    setEmailResults(null)
    try {
      const res = await runAnalysis(selectedJobId)
      setCandidates(res.data || [])
      toast.success(`Analyzed ${res.data?.length || 0} candidates!`)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setRunning(false)
    }
  }

  const handleSendAllEmails = async () => {
    if (!selectedJobId) return toast.error('Select a job first')
    const strongFit = candidates.filter(c => c.overall_score >= 70)
    if (strongFit.length === 0) return toast.error('No strong fit candidates (score ≥ 70) found!')

    setSendingEmails(true)
    try {
      const res = await sendShortlistEmails(selectedJobId)
      setEmailResults(res.data)
      if (res.data.sent_count > 0) {
        toast.success(`✉️ Emails sent to ${res.data.sent_count} candidate(s)!`)
      } else {
        toast.error('No emails sent. Check EMAIL_USER and EMAIL_PASSWORD in .env')
      }
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSendingEmails(false)
    }
  }

  const filtered = useMemo(() => {
    let arr = [...candidates]
    if (search) arr = arr.filter((c) =>
      c.candidate_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase())
    )
    arr.sort((a, b) => {
      if (sortBy === 'rank') return (a.rank || 0) - (b.rank || 0)
      if (sortBy === 'score') return b.overall_score - a.overall_score
      if (sortBy === 'skills') return (b.skills_score || 0) - (a.skills_score || 0)
      if (sortBy === 'name') return a.candidate_name?.localeCompare(b.candidate_name)
      return 0
    })
    return arr
  }, [candidates, search, sortBy])

  const stats = useMemo(() => {
    if (!candidates.length) return { avg: 0, top: 0, above70: 0 }
    const scores = candidates.map((c) => c.overall_score)
    return {
      avg: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      top: Math.round(Math.max(...scores)),
      above70: candidates.filter((c) => c.overall_score >= 70).length,
    }
  }, [candidates])

  const chartData = useMemo(() =>
    candidates.slice(0, 8).map((c) => ({
      name: c.candidate_name?.split(' ')[0] || 'Unknown',
      score: Math.round(c.overall_score),
    })), [candidates])

  const radarData = useMemo(() => {
    if (!candidates.length) return []
    const top = candidates[0]
    return [
      { subject: 'Skills', value: Math.round(top?.skills_score || 0) },
      { subject: 'Experience', value: Math.round(top?.experience_score || 0) },
      { subject: 'Education', value: Math.round(top?.education_score || 0) },
      { subject: 'Keywords', value: Math.round(top?.keyword_score || 0) },
    ]
  }, [candidates])

  const strongFitCount = candidates.filter(c => c.overall_score >= 70).length

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-1 bg-gradient-to-r from-success-500 to-emerald-500 rounded-full" />
          <span className="text-xs font-bold text-success-600 uppercase tracking-wider">Step 3</span>
        </div>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Candidate Rankings
            </h1>
            <p className="text-slate-500 text-sm">AI-powered resume screening results ranked by fit score.</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Job selector */}
            <div className="relative">
              <select
                className="input-field pr-8 text-sm font-semibold appearance-none cursor-pointer min-w-[220px]"
                value={selectedJobId || ''}
                onChange={(e) => {
                  const id = Number(e.target.value)
                  setSelectedJobId(id)
                  loadResults(id)
                  setEmailResults(null)
                }}
              >
                <option value="">Select a Job...</option>
                {jobs.map((j) => (
                  <option key={j.id} value={j.id}>{j.title}{j.company ? ` — ${j.company}` : ''}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            <button onClick={handleRun} disabled={running || !selectedJobId} className="btn-primary">
              {running ? <><Loader2 size={15} className="animate-spin" /> Analyzing...</> : <><Play size={15} /> Run Analysis</>}
            </button>

            {/* Send Emails Button */}
            {candidates.length > 0 && (
              <button
                onClick={handleSendAllEmails}
                disabled={sendingEmails || strongFitCount === 0}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 shadow-sm
                  ${strongFitCount > 0
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white hover:shadow-md'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                title={strongFitCount === 0 ? 'No strong fit candidates (≥70%)' : `Send emails to ${strongFitCount} strong fit candidate(s)`}
              >
                {sendingEmails
                  ? <><Loader2 size={15} className="animate-spin" /> Sending...</>
                  : <><Send size={15} /> Email Shortlist ({strongFitCount})</>
                }
              </button>
            )}

            {candidates.length > 0 && (
              <a href={getExportUrl(selectedJobId)} download className="btn-secondary">
                <Download size={15} /> Export CSV
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Email Results Banner */}
      {emailResults && (
        <div className={`card p-4 mb-5 border-2 ${emailResults.sent_count > 0 ? 'border-success-200 bg-success-50' : 'border-danger-200 bg-danger-50'}`}>
          <div className="flex items-start gap-3">
            <Mail size={20} className={emailResults.sent_count > 0 ? 'text-success-600' : 'text-danger-500'} />
            <div>
              <p className="font-bold text-slate-800 text-sm" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {emailResults.sent_count > 0 ? `✅ ${emailResults.sent_count} interview invitation(s) sent!` : '❌ No emails sent'}
              </p>
              {emailResults.sent_to?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {emailResults.sent_to.map((s, i) => (
                    <span key={i} className="badge-success text-xs">
                      ✉️ {s.name} ({Math.round(s.score)}%)
                    </span>
                  ))}
                </div>
              )}
              {emailResults.failed?.length > 0 && (
                <p className="text-xs text-danger-600 mt-1">Failed: {emailResults.failed.join(', ')}</p>
              )}
              {emailResults.skipped_no_email?.length > 0 && (
                <p className="text-xs text-slate-500 mt-1">Skipped (no email): {emailResults.skipped_no_email.join(', ')}</p>
              )}
              {emailResults.sent_count === 0 && (
                <p className="text-xs text-danger-600 mt-1">
                  Make sure EMAIL_USER and EMAIL_PASSWORD are set in your .env file and uvicorn is restarted.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Stats row */}
      {candidates.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatPill icon={Users} label="Candidates" value={candidates.length} color="bg-brand-500" />
          <StatPill icon={TrendingUp} label="Avg Score" value={`${stats.avg}%`} color="bg-amber-500" />
          <StatPill icon={Award} label="Top Score" value={`${stats.top}%`} color="bg-success-600" />
          <StatPill icon={Target} label="Strong Fit (≥70)" value={stats.above70} color="bg-purple-500" />
        </div>
      )}

      {/* Tab switcher */}
      {candidates.length > 0 && (
        <div className="flex gap-2 mb-5">
          {[['list', 'Candidate List'], ['chart', 'Score Chart']].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all
                      ${tab === key ? 'bg-brand-600 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:border-brand-200'}`}
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Chart view */}
      {tab === 'chart' && candidates.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="card p-5">
            <h3 className="text-sm font-bold text-slate-700 mb-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Score Distribution (Top 8)
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip formatter={(v) => [`${v}%`, 'Score']}
                         contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.score >= 75 ? '#22c55e' : entry.score >= 50 ? '#f59e0b' : '#f43f5e'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="card p-5">
            <h3 className="text-sm font-bold text-slate-700 mb-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Top Candidate Profile
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Radar dataKey="value" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.15} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Filters */}
      {candidates.length > 0 && tab === 'list' && (
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="input-field pl-9 py-2.5 text-sm" placeholder="Search candidates..."
                   value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="relative">
            <select className="input-field py-2.5 text-sm pr-8 appearance-none cursor-pointer font-semibold"
                    value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="rank">Sort by Rank</option>
              <option value="score">Sort by Score</option>
              <option value="skills">Sort by Skills</option>
              <option value="name">Sort by Name</option>
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
          <span className="text-xs text-slate-400 font-medium">{filtered.length} candidate{filtered.length !== 1 ? 's' : ''}</span>
        </div>
      )}

      {/* Results */}
      {tab === 'list' && (
        <>
          {loading || running ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => <CandidateCardSkeleton key={i} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="card p-16 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <BarChart3 size={28} className="text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-700 mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {!selectedJobId ? 'Select a Job Description' : candidates.length === 0 ? 'No Results Yet' : 'No Matches Found'}
              </h3>
              <p className="text-slate-500 text-sm mb-6">
                {!selectedJobId ? 'Choose a job from the dropdown, then click Run Analysis.'
                  : candidates.length === 0 ? 'Click "Run Analysis" to score and rank all uploaded resumes.'
                  : 'Try a different search term.'}
              </p>
              {selectedJobId && candidates.length === 0 && (
                <button onClick={handleRun} disabled={running} className="btn-primary">
                  <Play size={15} /> Run Analysis
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((c, i) => (
                <CandidateCard key={`${c.resume_id}-${c.analysis_id}`} candidate={c} delay={i * 60} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}