import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Mic, Video, StopCircle } from 'lucide-react';
import Navbar from '../components/Navbar';
import HRFace from '../components/HRFace';
import FaceTracker from '../components/FaceTracker';
import useInterview from '../hooks/useInterview';
import useSpeechRecognition from '../hooks/useSpeechRecognition';
import { useAuth } from '../lib/auth';
import { requestMediaAccess, stopMediaStream } from '../lib/mediaAccess';

export default function Interview() {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const cvMetricsRef = useRef({ eyeContact: 0, headPose: {}, smileScore: 0, engagement: 0, faceBox: null });
  const [videoStream, setVideoStream] = useState(null);
  const [cameraOn, setCameraOn] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [initError, setInitError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [transcribing, setTranscribing] = useState(false);
  const [silenceRemaining, setSilenceRemaining] = useState(0);
  const timerRef = useRef(null);
  const countdownRef = useRef(null);

  const {
    state,
    STATES,
    initSession,
    startListening,
    stopListeningAndSubmit,
    updateLiveMetrics,
    finishInterview,
  } = useInterview();

  const { user, loading: authLoading } = useAuth();

  const {
    transcript,
    interimTranscript,
    fullText,
    isListening,
    isSupported,
    error: speechError,
    fillerCount,
    wpm,
    startListening: startSpeech,
    stopListening: stopSpeech,
    resetTranscript,
  } = useSpeechRecognition();

  useEffect(() => {
    // Wait for auth to resolve before proceeding. Re-run when auth state changes.
    if (authLoading) return;
    if (!user) {
      navigate('/login');
      return;
    }

    const configStr = sessionStorage.getItem('recluta_config');
    if (!configStr) {
      navigate('/setup');
      return;
    }
    const config = JSON.parse(configStr);

    async function setup() {
      try {
        await initSession(config);
        setInitialized(true);
      } catch (err) {
        setInitError(err.message);
      }
    }
    setup();
  }, [initSession, navigate, authLoading, user]);

  useEffect(() => {
    let stream = null;
    async function initCamera() {
      try {
        console.log('[Interview] Initializing camera and microphone access...');
        stream = await requestMediaAccess({ video: true, audio: true });
        setVideoStream(stream);
        console.log('[Interview] ✓ Stream acquired successfully');

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          console.log('[Interview] ✓ Video playback started');
        }
      } catch (error) {
        console.error('[Interview] Failed to initialize camera:', error);
        const message = error.message || 'Camera access required for interview.';
        setInitError(message);
      }
    }
    if (initialized) initCamera();
    return () => {
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      stopMediaStream(stream);
      setVideoStream(null);
      console.log('[Interview] Media streams cleaned up');
    };
  }, [initialized]);

  const handleRetryMediaAccess = useCallback(async () => {
    console.log('[Interview] Retrying media access... (attempt', retryCount + 1, ')');
    setInitError(null);
    setRetryCount((prev) => prev + 1);
    let stream = null;
    try {
      stream = await requestMediaAccess({ video: true, audio: true });
      setVideoStream(stream);
      console.log('[Interview] ✓ Retry successful - stream acquired');
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        console.log('[Interview] ✓ Video playback started after retry');
      }
    } catch (error) {
      console.error('[Interview] Retry failed:', error);
      const message = error.message || 'Failed to access camera and microphone.';
      setInitError(message);
    }
  }, [retryCount]);

  const toggleCamera = useCallback(async () => {
    if (!videoStream) {
      console.log('[Interview] No stream available to toggle');
      return;
    }

    const videoTrack = videoStream.getVideoTracks()[0];
    if (!videoTrack) {
      console.warn('[Interview] No video track found');
      return;
    }

    if (cameraOn) {
      // Turn OFF: disable track and clear video display
      console.log('[Interview] Disabling camera...');
      videoTrack.enabled = false;
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setCameraOn(false);
      console.log('[Interview] ✓ Camera disabled');
    } else {
      // Turn ON: re-enable track and resume playback
      console.log('[Interview] Enabling camera...');
      try {
        videoTrack.enabled = true;
        if (videoRef.current && videoStream) {
          videoRef.current.srcObject = videoStream;
          await videoRef.current.play();
        }
        setCameraOn(true);
        console.log('[Interview] ✓ Camera enabled');
      } catch (err) {
        console.error('[Interview] Failed to enable camera:', err);
        setInitError('Failed to resume camera. Please try again.');
      }
    }
  }, [videoStream, cameraOn]);

  useEffect(() => {
    if (initialized) {
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [initialized]);

  useEffect(() => {
    if (initialized && state.status === STATES.QUESTION && !isListening && !state.isSpeaking) {
      startSpeech();
      startListening();
    }
  }, [initialized, state.status, isListening, state.isSpeaking, startSpeech, startListening, STATES.QUESTION]);

  const silenceTimeoutRef = useRef(null);
  const handleAutoSubmit = useCallback(async () => {
    if (!isListening || state.status !== STATES.LISTENING) return;
    stopSpeech();
    const text = fullText || transcript;
    if (!text.trim()) return;
    setTranscribing(true);
    resetTranscript();
    try {
      await stopListeningAndSubmit(text, cvMetricsRef.current);
    } catch (err) {
      setInitError(err.message || 'Transcription failed.');
    } finally {
      setTranscribing(false);
    }
  }, [fullText, isListening, resetTranscript, state.status, stopListeningAndSubmit, stopSpeech, transcript]);

  useEffect(() => {
    if (!isListening) {
      clearTimeout(silenceTimeoutRef.current);
      clearInterval(countdownRef.current);
      setSilenceRemaining(0);
      return;
    }

    if (!fullText.trim()) {
      setSilenceRemaining(0);
      return;
    }

    clearTimeout(silenceTimeoutRef.current);
    clearInterval(countdownRef.current);
    setSilenceRemaining(5);

    countdownRef.current = window.setInterval(() => {
      setSilenceRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);

    silenceTimeoutRef.current = window.setTimeout(() => {
      clearInterval(countdownRef.current);
      handleAutoSubmit();
    }, 5500);

    return () => {
      clearTimeout(silenceTimeoutRef.current);
      clearInterval(countdownRef.current);
    };
  }, [fullText, handleAutoSubmit, isListening]);

  useEffect(() => {
    updateLiveMetrics({ wpm, fillerCount });
  }, [wpm, fillerCount, updateLiveMetrics]);

  useEffect(() => {
    if (state.status === STATES.COMPLETE) {
      finishInterview();
    }
  }, [state.status, STATES.COMPLETE, finishInterview]);

  const handleCvMetrics = useCallback(
    (metrics) => {
      if (metrics.error) return;
      cvMetricsRef.current = metrics;
      updateLiveMetrics({
        eyeContact: metrics.eyeContact,
        engagement: metrics.engagement,
        confidence: Math.round(metrics.eyeContact * 0.5 + metrics.engagement * 0.5),
      });
    },
    [updateLiveMetrics]
  );

  const handleControlClick = async () => {
    if (state.status === STATES.LISTENING) {
      stopSpeech();
      const text = fullText || transcript;
      if (!text.trim()) {
        setInitError('No speech detected. Please try again.');
        return;
      }
      setTranscribing(true);
      resetTranscript();
      try {
        await stopListeningAndSubmit(text, cvMetricsRef.current);
      } catch (err) {
        setInitError(err.message || 'Transcription failed.');
      } finally {
        setTranscribing(false);
      }
    } else if (state.status === STATES.QUESTION || state.status === STATES.FEEDBACK) {
      resetTranscript();
      startListening();
      startSpeech();
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isRecording = state.status === STATES.LISTENING;
  const isProcessing = state.status === STATES.PROCESSING;
  const canAnswer =
    state.status === STATES.QUESTION ||
    state.status === STATES.FEEDBACK ||
    state.status === STATES.LISTENING;

  const statusLabel = isRecording
    ? 'Your answer is being recorded'
    : state.status === STATES.PROCESSING
    ? 'Analyzing response…'
    : 'Ready for your next answer';

  return (
    <div className="min-h-screen bg-[#060913] text-white">
      <Navbar />
      <FaceTracker videoRef={videoRef} enabled={initialized} onMetricsUpdate={handleCvMetrics} />

      <main className="mx-auto max-w-full px-4 py-4 lg:px-6">
        <div className="grid min-h-[calc(100vh-88px)] gap-6 lg:grid-cols-2">
          <section className="flex flex-col rounded-[32px] border border-border bg-[#08111e] p-6 shadow-[0_40px_120px_rgba(0,0,0,0.45)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-secondary">AI Interviewer</p>
                <h1 className="mt-3 text-4xl font-semibold">Real AI Human</h1>
                <p className="mt-2 text-sm text-secondary">Priya is asking the next question.</p>
              </div>
              <div className="rounded-full border border-accent/20 bg-[#081622] px-4 py-2 text-sm text-accent">
                {state.isSpeaking ? 'Speaking' : 'Idle'}
              </div>
            </div>

            <div className="mt-8 flex flex-1 flex-col justify-between rounded-[32px] border border-border bg-[#07131d] p-6">
              <div className="rounded-[28px] border border-border bg-[#09191f] p-6">
                <HRFace isSpeaking={state.isSpeaking} />
              </div>

              <div className="mt-8 rounded-[28px] border border-border bg-[#09191f] p-6">
                <p className="text-xs uppercase tracking-[0.3em] text-secondary">Question</p>
                <p className="mt-4 text-lg leading-8 text-primary">
                  {state.currentQuestion || 'Waiting for the interviewer to ask a question...'}
                </p>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  onClick={handleControlClick}
                  disabled={!initialized || initError}
                  className="inline-flex items-center justify-center gap-2 rounded-[22px] bg-accent px-6 py-4 font-semibold text-[#02120f] transition hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Mic size={18} /> {isListening ? 'Stop & submit' : 'Speak answer'}
                </button>
                <button
                  onClick={toggleCamera}
                  disabled={!videoStream || initError}
                  className="inline-flex items-center justify-center gap-2 rounded-[22px] border border-border bg-[#08131d] px-6 py-4 text-sm text-secondary transition hover:bg-[#091a23] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Video size={18} /> {cameraOn ? 'Camera off' : 'Camera on'}
                </button>
                <button
                  onClick={() => navigate('/setup')}
                  className="inline-flex items-center justify-center gap-2 rounded-[22px] border border-[#f97316] bg-[#1f140b] px-6 py-4 text-sm text-[#fbbf24] transition hover:bg-[#2a180f]"
                >
                  <StopCircle size={18} /> End interview
                </button>
              </div>

              {initError && (
                <div className="mt-4 rounded-[24px] border border-[#ef4444] bg-[#7f1d1d] px-4 py-3">
                  <p className="text-sm text-[#fca5a5] font-medium mb-3">{initError}</p>
                  <button
                    onClick={handleRetryMediaAccess}
                    className="inline-flex items-center justify-center gap-2 rounded-[16px] bg-[#ef4444] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#dc2626]"
                  >
                    🔄 Retry Media Access
                  </button>
                </div>
              )}

              {transcribing && (
                <div className="mt-4 rounded-[24px] border border-accent/20 bg-[#06151d] px-4 py-3 text-sm text-accent">
                  Transcribing your answer...
                </div>
              )}
            </div>
          </section>

          <section className="flex flex-col rounded-[32px] border border-border bg-[#08111e] p-6 shadow-[0_40px_120px_rgba(0,0,0,0.45)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-secondary">Candidate</p>
                <h1 className="mt-3 text-4xl font-semibold">Your camera</h1>
                <p className="mt-2 text-sm text-secondary">Speak naturally and watch your answer appear below.</p>
              </div>
              <div className="rounded-full border border-cobalt/20 bg-[#081622] px-4 py-2 text-sm text-cobalt">
                {cameraOn ? 'Camera on' : 'Camera off'}
              </div>
            </div>

            <div className="relative mt-8 rounded-[32px] border border-border bg-black p-3">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="h-[420px] w-full rounded-[28px] object-cover"
              />
              {!cameraOn && (
                <div className="absolute inset-0 flex items-center justify-center rounded-[28px] bg-[#1a1a1a]/80 backdrop-blur-sm">
                  <div className="text-center">
                    <Video size={48} className="mx-auto mb-2 text-secondary" />
                    <p className="text-sm text-secondary">Camera is off</p>
                    <button
                      onClick={toggleCamera}
                      className="mt-3 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-[#02120f] transition hover:brightness-110"
                    >
                      Turn on camera
                    </button>
                  </div>
                </div>
              )}
              {cvMetricsRef.current.faceBox && cameraOn ? (
                <div
                  className="pointer-events-none absolute rounded-lg border-2 border-accent/80 bg-accent/10"
                  style={{
                    left: `${cvMetricsRef.current.faceBox.x * 100}%`,
                    top: `${cvMetricsRef.current.faceBox.y * 100}%`,
                    width: `${cvMetricsRef.current.faceBox.width * 100}%`,
                    height: `${cvMetricsRef.current.faceBox.height * 100}%`,
                    transition: 'all 0.1s ease-out',
                  }}
                />
              ) : null}
            </div>

            <div className="mt-8 rounded-[32px] border border-border bg-[#09191f] p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-secondary">Your answer</p>
              <div className="mt-4 min-h-[180px] rounded-[24px] border border-border bg-[#07121d] p-5 text-base leading-8">
                {speechError ? (
                  <p className="text-[#fca5a5]">
                    <span className="font-semibold">⚠️ Mic Error:</span> {speechError}
                  </p>
                ) : fullText ? (
                  <p className="text-primary">{fullText}</p>
                ) : (
                  <p className="text-muted italic">Your spoken answer will appear here once you start speaking.</p>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
