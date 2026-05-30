import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 60000,
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err.response?.data?.detail || err.message || 'Something went wrong'
    return Promise.reject(new Error(typeof msg === 'string' ? msg : JSON.stringify(msg)))
  }
)
export const sendShortlistEmails = (jobId) => api.post(`/analysis/send-emails/${jobId}`)
export const sendSingleEmail = (analysisId) => api.post(`/analysis/send-email/${analysisId}`)
// Resumes
export const uploadResumes = (files, onProgress) => {
  const form = new FormData()
  files.forEach((f) => form.append('files', f))
  return api.post('/resumes/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => onProgress && onProgress(Math.round((e.loaded * 100) / e.total)),
  })
}

export const getResumes = (search = '') =>
  api.get('/resumes/', { params: { search } })

export const deleteResume = (id) => api.delete(`/resumes/${id}`)

// Jobs
export const createJob = (data) => api.post('/jobs/', data)

export const uploadJobFile = (title, company, file) => {
  const form = new FormData()
  form.append('file', file)
  return api.post(`/jobs/upload?title=${encodeURIComponent(title)}&company=${encodeURIComponent(company || '')}`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export const getJobs = () => api.get('/jobs/')
export const getJob = (id) => api.get(`/jobs/${id}`)
export const deleteJob = (id) => api.delete(`/jobs/${id}`)

// Analysis
export const runAnalysis = (jobId) => api.post(`/analysis/run/${jobId}`)
export const getResults = (jobId) => api.get(`/analysis/results/${jobId}`)
export const getExportUrl = (jobId) => `/api/analysis/export/${jobId}`

export default api
