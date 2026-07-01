import { useCallback, useReducer, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { startInterview, respondToInterview } from '../lib/api';

const STATES = {
  IDLE: 'IDLE',
  SETUP: 'SETUP',
  QUESTION: 'QUESTION',
  LISTENING: 'LISTENING',
  PROCESSING: 'PROCESSING',
  FEEDBACK: 'FEEDBACK',
  COMPLETE: 'COMPLETE',
};

const initialState = {
  status: STATES.IDLE,
  sessionId: null,
  currentQuestion: '',
  questionIndex: 0,
  totalQuestions: 5,
  history: [],
  metrics: {
    confidence: 0,
    eyeContact: 0,
    wpm: 0,
    fillerCount: 0,
    clarity: 0,
    engagement: 0,
    answerQuality: 0,
  },
  aggregatedMetrics: {
    confidence: [],
    eyeContact: [],
    wpm: [],
    fillerCount: [],
    clarity: [],
    engagement: [],
    answerQuality: [],
  },
  error: null,
  isSpeaking: false,
  config: null,
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_STATUS':
      return { ...state, status: action.payload };
    case 'SET_CONFIG':
      return { ...state, config: action.payload, status: STATES.SETUP };
    case 'SESSION_STARTED':
      return {
        ...state,
        sessionId: action.payload.sessionId,
        currentQuestion: action.payload.firstQuestion,
        questionIndex: 0,
        status: STATES.QUESTION,
        error: null,
      };
    case 'START_LISTENING':
      return { ...state, status: STATES.LISTENING };
    case 'STOP_LISTENING':
      return { ...state, status: STATES.PROCESSING };
    case 'UPDATE_LIVE_METRICS':
      return {
        ...state,
        metrics: { ...state.metrics, ...action.payload },
      };
    case 'RESPONSE_RECEIVED': {
      const agg = { ...state.aggregatedMetrics };
      const sm = action.payload.speech_metrics || {};
      if (sm.confidence_score) agg.confidence.push(sm.confidence_score);
      if (sm.clarity_score) agg.clarity.push(sm.clarity_score);
      if (sm.answer_quality_score) agg.answerQuality.push(sm.answer_quality_score);
      if (sm.wpm) agg.wpm.push(sm.wpm);
      if (sm.filler_count !== undefined) agg.fillerCount.push(sm.filler_count);

      const cv = action.payload.cv_metrics || {};
      if (cv.eye_contact) agg.eyeContact.push(cv.eye_contact);

      const newHistory = [
        ...state.history,
        {
          question: state.currentQuestion,
          answer: action.payload.transcription,
          answer_score: action.payload.answer_score,
          star_compliance: action.payload.star_compliance,
          feedback: action.payload.feedback,
        },
      ];

      if (action.payload.is_complete) {
        return {
          ...state,
          history: newHistory,
          aggregatedMetrics: agg,
          status: STATES.COMPLETE,
          currentQuestion: '',
        };
      }

      return {
        ...state,
        history: newHistory,
        aggregatedMetrics: agg,
        currentQuestion: action.payload.next_question || '',
        questionIndex: state.questionIndex + 1,
        status: STATES.FEEDBACK,
      };
    }
    case 'NEXT_QUESTION':
      return { ...state, status: STATES.QUESTION, isSpeaking: false };
    case 'SET_SPEAKING':
      return { ...state, isSpeaking: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, status: STATES.QUESTION };
    case 'RESET':
      return { ...initialState };
    default:
      return state;
  }
}

function average(arr) {
  if (!arr.length) return 0;
  return Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
}

export function useInterview() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const navigate = useNavigate();
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const audioChunksRef = useRef([]);

  const initSession = useCallback(async (config) => {
    dispatch({ type: 'SET_CONFIG', payload: config });
    try {
      const data = await startInterview({
        role: config.jobTitle,
        level: config.experienceLevel,
        interview_type: config.interviewType,
        resume_summary: config.resumeSummary || '',
      });
      dispatch({
        type: 'SESSION_STARTED',
        payload: {
          sessionId: data.session_id,
          firstQuestion: data.first_question,
        },
      });
      if (data.tts?.audio_base64) {
        dispatch({ type: 'SET_SPEAKING', payload: true });
        const audio = new Audio(`data:audio/wav;base64,${data.tts.audio_base64}`);
        audio.onended = () => dispatch({ type: 'SET_SPEAKING', payload: false });
        audio.play().catch(() => dispatch({ type: 'SET_SPEAKING', payload: false }));
      }
      return data;
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message });
      throw err;
    }
  }, []);

  const startListening = useCallback(() => {
    dispatch({ type: 'START_LISTENING' });
    audioChunksRef.current = [];
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        streamRef.current = stream;
        try {
          const recorder = new MediaRecorder(stream);
          mediaRecorderRef.current = recorder;
          recorder.ondataavailable = (e) => {
            if (e.data.size > 0) audioChunksRef.current.push(e.data);
          };
          recorder.onstart = () => console.log('MediaRecorder start event');
          recorder.onstop = () => console.log('MediaRecorder stop event');
          recorder.onerror = (event) => console.error('MediaRecorder error', event);
          console.log('MediaRecorder created, state=', recorder.state);
          recorder.start(250);
          console.log('MediaRecorder started, state=', recorder.state);
        } catch (err) {
          console.error('Failed to create MediaRecorder', err);
          dispatch({ type: 'SET_ERROR', payload: 'Unable to start recording.' });
          stream.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
      })
      .catch((err) => {
        console.error('getUserMedia error', err);
        dispatch({ type: 'SET_ERROR', payload: 'Microphone access required.' });
      });
  }, []);

  const stopListeningAndSubmit = useCallback(
    async (transcription, cvMetrics) => {
      dispatch({ type: 'STOP_LISTENING' });

      let audioBase64 = '';
      const recorder = mediaRecorderRef.current;
      if (recorder && recorder.state === 'recording') {
        console.log('Stopping MediaRecorder...');
        await new Promise((resolve) => {
          const finish = () => {
            recorder.onstop = null;
            recorder.onerror = null;
            resolve();
          };

          recorder.onstop = finish;
          recorder.onerror = (event) => {
            console.warn('MediaRecorder error during stop', event);
            finish();
          };

          try {
            recorder.stop();
          } catch (err) {
            console.warn('mediaRecorder.stop() error', err);
            finish();
          }
        });
      }

      if (audioChunksRef.current.length > 0) {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        console.log('Audio blob:', blob);
        audioBase64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      mediaRecorderRef.current = null;
      audioChunksRef.current = [];

      try {
        console.log('Uploading audio to Whisper/Backend...');
        const data = await respondToInterview({
          session_id: state.sessionId,
          audio_base64: audioBase64,
          transcription,
          cv_metrics: {
            eye_contact: cvMetrics?.eyeContact || 0,
            head_pose: cvMetrics?.headPose || {},
            smile: cvMetrics?.smileScore || 0,
          },
        });
        console.log('Whisper response:', data);

        dispatch({
          type: 'RESPONSE_RECEIVED',
          payload: {
            ...data,
            cv_metrics: {
              eye_contact: cvMetrics?.eyeContact || 0,
            },
          },
        });

        if (data.tts?.audio_base64) {
          dispatch({ type: 'SET_SPEAKING', payload: true });
          const audio = new Audio(`data:audio/wav;base64,${data.tts.audio_base64}`);
          audio.onended = () => {
            dispatch({ type: 'SET_SPEAKING', payload: false });
            if (!data.is_complete) {
              dispatch({ type: 'NEXT_QUESTION' });
            }
          };
          audio.play().catch(() => {
            dispatch({ type: 'SET_SPEAKING', payload: false });
            if (!data.is_complete) dispatch({ type: 'NEXT_QUESTION' });
          });
        } else if (!data.is_complete) {
          setTimeout(() => dispatch({ type: 'NEXT_QUESTION' }), 2000);
        }

        if (data.speech_metrics) {
          dispatch({
            type: 'UPDATE_LIVE_METRICS',
            payload: {
              wpm: data.speech_metrics.wpm,
              fillerCount: data.speech_metrics.filler_count,
              clarity: data.speech_metrics.clarity_score,
              confidence: data.speech_metrics.confidence_score,
              answerQuality: data.speech_metrics.answer_quality_score,
            },
          });
        }

        return data;
      } catch (err) {
        console.error('respondToInterview error:', err);
        dispatch({ type: 'SET_ERROR', payload: err.message || 'Transcription failed.' });
        throw err;
      }
    },
    [state.sessionId]
  );

  const updateLiveMetrics = useCallback((metrics) => {
    dispatch({ type: 'UPDATE_LIVE_METRICS', payload: metrics });
  }, []);

  const finishInterview = useCallback(() => {
    const agg = state.aggregatedMetrics;
    const finalMetrics = {
      confidence: average(agg.confidence) || state.metrics.confidence || 65,
      communication: average(agg.clarity) || state.metrics.clarity || 70,
      eye_contact: average(agg.eyeContact) || state.metrics.eyeContact || 60,
      professionalism: Math.round(
        ((average(agg.eyeContact) || 60) + (average(agg.clarity) || 70)) / 2
      ),
      answer_quality: average(agg.answerQuality) || state.metrics.answerQuality || 72,
      pacing: average(agg.wpm)
        ? Math.min(100, Math.round((average(agg.wpm) / 150) * 100))
        : 75,
      clarity: average(agg.clarity) || state.metrics.clarity || 70,
      engagement: state.metrics.engagement || 68,
    };

    const resultsData = {
      sessionId: state.sessionId,
      role: state.config?.jobTitle || 'Candidate',
      metrics: finalMetrics,
      qaPairs: state.history,
      radarScores: {
        confidence: finalMetrics.confidence,
        eyeContact: finalMetrics.eye_contact,
        pace: finalMetrics.pacing,
        clarity: finalMetrics.clarity,
        engagement: finalMetrics.engagement,
        answerQuality: finalMetrics.answer_quality,
      },
      overallScore: Math.round(
        Object.values(finalMetrics).reduce((a, b) => a + b, 0) /
          Object.values(finalMetrics).length
      ),
    };

    sessionStorage.setItem('recluta_results', JSON.stringify(resultsData));
    navigate('/results');
  }, [state, navigate]);

  return {
    state,
    STATES,
    initSession,
    startListening,
    stopListeningAndSubmit,
    updateLiveMetrics,
    finishInterview,
    dispatch,
  };
}

export default useInterview;
