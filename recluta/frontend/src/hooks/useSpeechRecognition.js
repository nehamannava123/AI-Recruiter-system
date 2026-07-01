import { useCallback, useEffect, useRef, useState } from 'react';

const FILLER_WORDS = new Set([
  'um', 'uh', 'like', 'you', 'know', 'so', 'actually', 'basically',
  'literally', 'right', 'okay', 'well', 'kind', 'of', 'sort',
]);

export function useSpeechRecognition() {
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [error, setError] = useState(null);
  const [fillerCount, setFillerCount] = useState(0);
  const [wpm, setWpm] = useState(0);
  const recognitionRef = useRef(null);
  const startTimeRef = useRef(null);
  const wordCountRef = useRef(0);

  const countFillers = useCallback((text) => {
    const words = text.toLowerCase().split(/\s+/);
    let count = 0;
    for (let i = 0; i < words.length; i++) {
      const cleaned = words[i].replace(/[.,!?;:'"]/g, '');
      if (FILLER_WORDS.has(cleaned)) count++;
      if (cleaned === 'you' && words[i + 1] === 'know') count++;
    }
    return count;
  }, []);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('[SpeechRecognition] API not supported in this browser');
      setIsSupported(false);
      return;
    }

    console.log('[SpeechRecognition] ✓ API supported');

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    console.log('[SpeechRecognition] ✓ Recognition instance created with lang: en-US');

    recognition.onresult = (event) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      if (final) {
        setTranscript((prev) => {
          const updated = (prev + ' ' + final).trim();
          wordCountRef.current = updated.split(/\s+/).filter(Boolean).length;
          setFillerCount(countFillers(updated));
          if (startTimeRef.current) {
            const elapsed = (Date.now() - startTimeRef.current) / 60000;
            if (elapsed > 0) {
              setWpm(Math.round(wordCountRef.current / elapsed));
            }
          }
          return updated;
        });
      }
      setInterimTranscript(interim);
      console.log('[SpeechRecognition] Results - interim:', interim.slice(0, 50), 'final:', final.slice(0, 50));
    };

    recognition.onerror = (event) => {
      console.error('[SpeechRecognition] Error event:', { error: event.error, type: event.type });
      
      if (event.error === 'not-allowed') {
        const message = 'Microphone access denied. Please:\n1. Click the lock icon in address bar\n2. Allow "Microphone"\n3. Refresh the page';
        console.error('[SpeechRecognition] Microphone access denied:', message);
        setError(message);
      } else if (event.error === 'no-speech') {
        console.warn('[SpeechRecognition] No speech detected - try speaking louder');
        // Don't set error for no-speech, it's normal
      } else if (event.error === 'network') {
        console.error('[SpeechRecognition] Network error');
        setError('Network error. Check your connection.');
      } else if (event.error !== 'aborted') {
        console.error('[SpeechRecognition] Error:', event.error);
        setError(`Speech recognition error: ${event.error}`);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      console.log('[SpeechRecognition] Recognition ended. isListening:', isListening);
      if (isListening && recognitionRef.current) {
        try {
          console.log('[SpeechRecognition] Restarting recognition...');
          recognition.start();
        } catch (err) {
          console.warn('[SpeechRecognition] Failed to restart:', err);
          setIsListening(false);
        }
      }
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
    };
  }, [countFillers, isListening]);

  const startListening = useCallback(() => {
    setError(null);
    startTimeRef.current = Date.now();
    wordCountRef.current = 0;
    try {
      console.log('[SpeechRecognition] Starting speech recognition...');
      recognitionRef.current?.start();
      setIsListening(true);
      console.log('[SpeechRecognition] ✓ Started successfully');
    } catch (err) {
      console.error('[SpeechRecognition] Failed to start:', err);
      setError('Failed to start speech recognition.');
    }
  }, []);

  const stopListening = useCallback(() => {
    console.log('[SpeechRecognition] Stopping speech recognition...');
    recognitionRef.current?.stop();
    setIsListening(false);
    setInterimTranscript('');
    console.log('[SpeechRecognition] ✓ Stopped');
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    setFillerCount(0);
    setWpm(0);
    wordCountRef.current = 0;
    startTimeRef.current = null;
  }, []);

  return {
    transcript,
    interimTranscript,
    fullText: (transcript + ' ' + interimTranscript).trim(),
    isListening,
    isSupported,
    error,
    fillerCount,
    wpm,
    startListening,
    stopListening,
    resetTranscript,
  };
}

export default useSpeechRecognition;
