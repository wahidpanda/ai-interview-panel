import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const api = axios.create({ baseURL: BASE_URL })

export const getJobs = () => api.get('/api/jobs').then(r => r.data.jobs)

export const startInterview = ({ candidateName, jobDescriptionId, cvFile }) => {
  const form = new FormData()
  form.append('candidate_name', candidateName)
  form.append('job_description_id', jobDescriptionId)
  if (cvFile) form.append('cv_file', cvFile)
  return api.post('/api/interview/start', form).then(r => r.data)
}

export const getState = (sessionId) =>
  api.get(`/api/interview/state/${sessionId}`).then(r => r.data)

export const sendMessage = (sessionId, message) => {
  const form = new FormData()
  form.append('session_id', sessionId)
  form.append('message', message)
  return api.post('/api/interview/message', form).then(r => r.data)
}

export const finalizeInterview = (sessionId) => {
  const form = new FormData()
  form.append('session_id', sessionId)
  return api.post('/api/interview/finalize', form).then(r => r.data)
}

export const getResult = (sessionId) =>
  api.get(`/api/interview/result/${sessionId}`).then(r => r.data)

export const startCoding = (sessionId) => {
  const form = new FormData()
  form.append('session_id', sessionId)
  return api.post('/api/coding/start', form).then(r => r.data)
}

export const executeCode = (sessionId, language, code, stdin = '') => {
  const form = new FormData()
  form.append('session_id', sessionId)
  form.append('language', language)
  form.append('code', code)
  form.append('stdin', stdin)
  return api.post('/api/coding/execute', form).then(r => r.data)
}

export const submitCode = (sessionId, language, code, tabSwitches = 0) => {
  const form = new FormData()
  form.append('session_id', sessionId)
  form.append('language', language)
  form.append('code', code)
  form.append('tab_switches', tabSwitches)
  return api.post('/api/coding/submit', form).then(r => r.data)
}

export const getHealth = () => api.get('/api/health').then(r => r.data)

export const fetchSpeechAudio = (stage, text) => {
  const form = new FormData()
  form.append('stage', stage)
  form.append('text', text)
  return api.post('/api/tts', form, { responseType: 'blob' }).then(r => r.data)
}
