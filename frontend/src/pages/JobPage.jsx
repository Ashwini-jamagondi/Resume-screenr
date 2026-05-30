import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'
import { createJob, getJobs, deleteJob } from '../services/api'
import { FileText, Plus, Trash2, CheckCircle, Loader2, Briefcase, Building2, ChevronRight, FileUp } from 'lucide-react'

export default function JobPage() {
  const [mode, setMode] = useState('text')
  const [title, setTitle] = useState('')
  const [company, setCompany] = useState('')
  const [content, setContent] = useState('')
  const [file, setFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedJob, setSelectedJob] = useState(null)
  const navigate = useNavigate()

  useEffect(() => { loadJobs() }, [])

  const loadJobs = async () => {
    try {
      const res = await getJobs()
      setJobs(res.data || [])
      if (res.data?.length > 0 && !selectedJob) setSelectedJob(res.data[res.data.length - 1])
    } catch { toast.error('Failed to load jobs') }
    finally { setLoading(false) }
  }

  const onDrop = useCallback((accepted) => {
    if (accepted[0]) setFile(accepted[0])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'text/plain': ['.txt'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  })

  const handleSave = async () => {
    if (!title.trim()) return toast.error('Job title is required')
    if (mode === 'text' && !content.trim()) return toast.error('Job description content is required')
    if (mode === 'file' && !file) return toast.error('Please select a file')

    setSaving(true)
    try {
      if (mode === 'text') {
        const res = await createJob({ title: title.trim(), company: company.trim(), content: content.trim() })
        setJobs((prev) => [...prev, res.data])
        setSelectedJob(res.data)
        toast.success('Job description saved!')
        setTitle(''); setCompany(''); setContent('')
      } else {
        // file upload handled via form
        toast.error('File upload not implemented in this demo — use text mode')
      }
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await deleteJob(id)
      setJobs((prev) => prev.filter((j) => j.id !== id))
      if (selectedJob?.id === id) setSelectedJob(null)
      toast.success('Deleted')
    } catch { toast.error('Failed to delete') }
  }

  const PLACEHOLDER = `We are looking for a skilled Software Engineer to join our team.

Requirements:
- 3+ years of experience with Python or JavaScript
- Experience with React and Node.js
- Proficient in SQL and NoSQL databases
- Familiarity with Docker and cloud platforms (AWS/GCP)
- Strong problem-solving skills

Responsibilities:
- Design and build scalable web applications
- Collaborate with cross-functional teams
- Participate in code reviews
- Write clean, maintainable code`

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" />
          <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">Step 2</span>
        </div>
        <h1 className="text-3xl font-bold text-slate-800 mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Job Description
        </h1>
        <p className="text-slate-500 text-sm">Define the role requirements for AI-powered candidate matching.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Form */}
        <div className="lg:col-span-3 space-y-5">
          <div className="card p-6 space-y-5">
            {/* Mode toggle */}
            <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
              {['text', 'file'].map((m) => (
                <button key={m} onClick={() => setMode(m)}
                        className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all duration-200
                          ${mode === m ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {m === 'text' ? '✏️ Type / Paste' : '📄 Upload File'}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                  Job Title *
                </label>
                <div className="relative">
                  <Briefcase size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input className="input-field pl-9" placeholder="e.g. Senior Python Developer"
                         value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                  Company (optional)
                </label>
                <div className="relative">
                  <Building2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input className="input-field pl-9" placeholder="e.g. Acme Corp"
                         value={company} onChange={(e) => setCompany(e.target.value)} />
                </div>
              </div>
            </div>

            {mode === 'text' ? (
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                  Description *
                </label>
                <textarea
                  className="input-field resize-none"
                  rows={12}
                  placeholder={PLACEHOLDER}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
                <p className="text-xs text-slate-400 mt-1 text-right">{content.length} characters</p>
              </div>
            ) : (
              <div {...getRootProps()}
                   className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all
                     ${isDragActive ? 'border-purple-400 bg-purple-50' : 'border-slate-200 hover:border-purple-300'}`}>
                <input {...getInputProps()} />
                <FileUp size={24} className="text-slate-400 mx-auto mb-3" />
                {file ? (
                  <p className="text-sm font-bold text-purple-700">{file.name}</p>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-slate-600 mb-1">Drop JD file here</p>
                    <p className="text-xs text-slate-400">PDF, DOC, DOCX, TXT supported</p>
                  </>
                )}
              </div>
            )}

            <button onClick={handleSave} disabled={saving} className="btn-primary w-full justify-center">
              {saving ? <><Loader2 size={16} className="animate-spin" /> Saving & Analyzing...</> : <><Plus size={16} /> Save Job Description</>}
            </button>
          </div>
        </div>

        {/* Saved JDs */}
        <div className="lg:col-span-2">
          <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            <FileText size={15} className="text-slate-400" />
            Saved Job Descriptions ({jobs.length})
          </h3>

          {loading ? (
            <div className="space-y-3">
              {[1,2].map((i) => (
                <div key={i} className="card p-4">
                  <div className="shimmer-bg h-4 w-2/3 rounded mb-2" />
                  <div className="shimmer-bg h-3 w-1/3 rounded" />
                </div>
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <div className="card p-8 text-center">
              <Briefcase size={28} className="text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500">No job descriptions yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {jobs.map((j) => (
                <div key={j.id}
                     className={`card p-4 cursor-pointer transition-all group
                       ${selectedJob?.id === j.id ? 'border-purple-200 bg-purple-50/50' : 'hover:border-slate-200'}`}
                     onClick={() => setSelectedJob(j)}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        {j.title}
                      </p>
                      <p className="text-xs text-slate-500 truncate">{j.company || 'No company'}</p>
                      {j.required_skills?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {j.required_skills.slice(0, 3).map((s) => (
                            <span key={s} className="badge-purple text-[10px]">{s}</span>
                          ))}
                          {j.required_skills.length > 3 && (
                            <span className="badge-slate text-[10px]">+{j.required_skills.length - 3}</span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {selectedJob?.id === j.id && <CheckCircle size={15} className="text-purple-500" />}
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(j.id) }}
                              className="p-1.5 opacity-0 group-hover:opacity-100 hover:text-danger-500 text-slate-300 transition-all">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedJob && (
            <button onClick={() => navigate('/results')}
                    className="btn-primary w-full justify-center mt-4">
              Run Analysis <ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
