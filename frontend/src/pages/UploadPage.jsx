import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'
import { uploadResumes, getResumes, deleteResume } from '../services/api'
import { getInitials, getAvatarBg } from '../utils/scoreUtils'
import { Upload, FileText, Trash2, CheckCircle, AlertCircle, X, Users, Loader2, FileUp } from 'lucide-react'
import { useEffect } from 'react'

const FileTypeIcon = ({ type }) => {
  const colors = { pdf: 'text-red-500 bg-red-50', docx: 'text-brand-500 bg-brand-50', doc: 'text-blue-500 bg-blue-50' }
  return (
    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold ${colors[type] || 'text-slate-500 bg-slate-50'}`}
         style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {type?.toUpperCase()}
    </div>
  )
}

export default function UploadPage() {
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [uploaded, setUploaded] = useState([])
  const [loadingList, setLoadingList] = useState(true)

  useEffect(() => {
    loadResumes()
  }, [])

  const loadResumes = async () => {
    try {
      setLoadingList(true)
      const res = await getResumes()
      setUploaded(res.data || [])
    } catch {
      toast.error('Failed to load resumes')
    } finally {
      setLoadingList(false)
    }
  }

  const onDrop = useCallback((accepted, rejected) => {
    if (rejected.length > 0) {
      toast.error(`${rejected.length} file(s) rejected. Only PDF, DOC, DOCX allowed.`)
    }
    setFiles((prev) => {
      const existing = new Set(prev.map((f) => f.name))
      return [...prev, ...accepted.filter((f) => !existing.has(f.name))]
    })
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxSize: 10 * 1024 * 1024,
  })

  const removeFile = (name) => setFiles((prev) => prev.filter((f) => f.name !== name))

  const handleUpload = async () => {
    if (!files.length) return toast.error('Add at least one file')
    setUploading(true)
    setProgress(0)
    try {
      await uploadResumes(files, setProgress)
      toast.success(`${files.length} resume(s) uploaded successfully!`)
      setFiles([])
      loadResumes()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }

  const handleDelete = async (id) => {
    try {
      await deleteResume(id)
      setUploaded((prev) => prev.filter((r) => r.id !== id))
      toast.success('Resume deleted')
    } catch {
      toast.error('Failed to delete resume')
    }
  }

  const ext = (name) => name?.split('.').pop()?.toLowerCase() || ''

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-1 bg-gradient-to-r from-brand-500 to-purple-500 rounded-full" />
          <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">Step 1</span>
        </div>
        <h1 className="text-3xl font-bold text-slate-800 mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Upload Resumes
        </h1>
        <p className="text-slate-500 text-sm">Upload PDF, DOC, or DOCX resumes. Batch upload is fully supported.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Drop zone */}
        <div className="lg:col-span-3 space-y-4">
          <div
            {...getRootProps()}
            className={`relative border-2 border-dashed rounded-3xl p-10 text-center cursor-pointer transition-all duration-200
              ${isDragActive ? 'border-brand-400 bg-brand-50 scale-[1.01]' : 'border-slate-200 bg-white hover:border-brand-300 hover:bg-slate-50'}`}
          >
            <input {...getInputProps()} />
            <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4 transition-all
              ${isDragActive ? 'bg-brand-100 scale-110' : 'bg-slate-100'}`}>
              <FileUp size={28} className={isDragActive ? 'text-brand-600' : 'text-slate-400'} />
            </div>
            <p className="text-base font-bold text-slate-700 mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {isDragActive ? 'Drop files here!' : 'Drag & drop resumes here'}
            </p>
            <p className="text-sm text-slate-500 mb-4">or click to browse files</p>
            <div className="flex items-center justify-center gap-2">
              {['PDF', 'DOC', 'DOCX'].map((t) => (
                <span key={t} className="badge-slate text-xs">{t}</span>
              ))}
              <span className="text-xs text-slate-400 ml-1">· Max 10MB each</span>
            </div>
          </div>

          {/* Queued files */}
          {files.length > 0 && (
            <div className="card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-700" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Ready to upload ({files.length})
                </h3>
                <button onClick={() => setFiles([])} className="text-xs text-slate-400 hover:text-danger-500 transition-colors">
                  Clear all
                </button>
              </div>
              {files.map((f) => (
                <div key={f.name} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <FileTypeIcon type={ext(f.name)} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-700 truncate">{f.name}</p>
                    <p className="text-xs text-slate-400">{(f.size / 1024).toFixed(0)} KB</p>
                  </div>
                  <button onClick={() => removeFile(f.name)}
                          className="p-1.5 rounded-lg hover:bg-danger-50 hover:text-danger-500 text-slate-400 transition-colors">
                    <X size={14} />
                  </button>
                </div>
              ))}

              {uploading && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Uploading & parsing...</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-brand-400 to-brand-600 rounded-full transition-all duration-300"
                         style={{ width: `${progress}%` }} />
                  </div>
                </div>
              )}

              <button onClick={handleUpload} disabled={uploading} className="btn-primary w-full justify-center">
                {uploading ? <><Loader2 size={16} className="animate-spin" /> Processing...</> : <><Upload size={16} /> Upload {files.length} Resume{files.length > 1 ? 's' : ''}</>}
              </button>
            </div>
          )}
        </div>

        {/* Uploaded list */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              <Users size={15} className="text-slate-400" />
              Uploaded Resumes ({uploaded.length})
            </h3>
          </div>

          {loadingList ? (
            <div className="space-y-3">
              {[1,2,3].map((i) => (
                <div key={i} className="card p-4 flex items-center gap-3">
                  <div className="shimmer-bg w-10 h-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="shimmer-bg h-3 w-3/4 rounded" />
                    <div className="shimmer-bg h-2 w-1/2 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : uploaded.length === 0 ? (
            <div className="card p-8 text-center">
              <FileText size={28} className="text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500">No resumes yet.<br />Upload your first batch above.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {uploaded.map((r) => (
                <div key={r.id} className="card p-3.5 flex items-center gap-3 group">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getAvatarBg(r.candidate_name)}
                                   flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}
                       style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    {getInitials(r.candidate_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      {r.candidate_name}
                    </p>
                    <p className="text-xs text-slate-400 truncate">{r.email || r.file_name}</p>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="badge-slate text-[10px]">{r.file_type?.toUpperCase()}</span>
                    <button onClick={() => handleDelete(r.id)}
                            className="p-1.5 rounded-lg hover:bg-danger-50 hover:text-danger-500 text-slate-300 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <CheckCircle size={15} className="text-success-500 flex-shrink-0 opacity-100 group-hover:opacity-0 transition-opacity" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
