export default function SpeechInput({
  transcript,
  interimTranscript,
  isListening,
  isSupported,
  error,
  statusMessage,
}) {
  const displayText = transcript + (interimTranscript ? ` ${interimTranscript}` : '');

  return (
    <div
      className={`card min-h-[120px] p-4 font-mono text-sm leading-relaxed ${
        isListening ? 'border-aurora recording-pulse' : ''
      }`}
    >
      <div className="mb-2 flex items-center gap-2">
        {isListening && <span className="live-dot" />}
        <span className="text-xs text-secondary">
          {isListening ? 'Live Transcription' : 'Your answer will appear here'}
        </span>
      </div>

      {!isSupported ? (
        <p className="text-warn">
          Speech recognition is not supported in this browser. Type your answer or use Chrome.
        </p>
      ) : error ? (
        <p className="text-warn">{error}</p>
      ) : statusMessage ? (
        <p className="text-primary">{statusMessage}</p>
      ) : displayText ? (
        <p className="text-aurora">
          {displayText}
          {isListening && interimTranscript && (
            <span className="animate-pulse">|</span>
          )}
        </p>
      ) : (
        <p className="text-muted italic">{transcript || 'Start speaking...'}</p>
      )}
    </div>
  );
}
