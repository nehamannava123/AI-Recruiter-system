import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.detail ||
      error.message ||
      'An unexpected error occurred';
    return Promise.reject(new Error(typeof message === 'string' ? message : JSON.stringify(message)));
  }
);

export async function startInterview({ role, level, interview_type, resume_summary }) {
  const { data } = await api.post('/api/interview/start', {
    role,
    level,
    interview_type,
    resume_summary,
  });
  return data;
}

export async function parseResume(file) {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post('/api/interview/parse-resume', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return data;
}

export async function respondToInterview({
  session_id,
  audio_base64,
  transcription,
  cv_metrics,
}) {
  const { data } = await api.post('/api/interview/respond', {
    session_id,
    audio_base64,
    transcription,
    cv_metrics,
  });
  return data;
}

export async function analyzeSpeech({ audio_base64, duration_seconds }) {
  const { data } = await api.post('/api/analysis/speech', {
    audio_base64,
    duration_seconds,
  });
  return data;
}

export async function getInterviewSession(sessionId) {
  const { data } = await api.get(`/api/interview/session/${sessionId}`);
  return data;
}

export async function generateReport(reportData) {
  const response = await api.post('/api/report/generate', reportData, {
    responseType: 'blob',
  });
  return response.data;
}

export default api;
