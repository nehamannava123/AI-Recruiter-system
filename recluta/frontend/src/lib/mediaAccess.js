/**
 * Robust media access utility with comprehensive error handling and logging
 * Supports both localhost:5173 and 127.0.0.1:8000
 */

export async function requestMediaAccess(constraints = { video: true, audio: true }) {
  const origin = window.location.origin;
  console.log('[MediaAccess] Requesting media access', { origin, constraints });

  try {
    // Check if getUserMedia is supported
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const error = 'getUserMedia is not supported in this browser';
      console.error('[MediaAccess] Error:', error);
      alert(`❌ ${error}\n\nPlease use a modern browser (Chrome, Firefox, Edge, Safari 14.1+)`);
      throw new Error(error);
    }

    // Attempt to get media stream
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    
    console.log('[MediaAccess] ✓ Media access granted successfully', {
      videoTracks: stream.getVideoTracks().length,
      audioTracks: stream.getAudioTracks().length,
      origin,
    });

    return stream;
  } catch (error) {
    // Detailed error classification and user-friendly messages
    const errorName = error.name || 'Unknown';
    const errorMessage = error.message || 'Unknown error';
    
    let userMessage = '';
    let logLevel = 'error';

    console.error('[MediaAccess] Error:', { name: errorName, message: errorMessage, code: error.code });

    switch (errorName) {
      case 'NotAllowedError':
      case 'PermissionDeniedError':
        userMessage = 
          `Camera/Microphone access was denied.\n\n` +
          `To enable:\n` +
          `1. Click the lock icon in address bar\n` +
          `2. Allow "Camera" and "Microphone"\n` +
          `3. Refresh the page\n\n` +
          `Origin: ${origin}`;
        console.warn('[MediaAccess] Permission denied by user');
        break;

      case 'NotFoundError':
      case 'DevicesNotFoundError':
        userMessage = 
          `No camera or microphone found.\n\n` +
          `Please check:\n` +
          `1. Camera/microphone are connected\n` +
          `2. No other app is using them\n` +
          `3. Device drivers are installed`;
        console.warn('[MediaAccess] No devices found');
        break;

      case 'NotReadableError':
      case 'TrackStartError':
        userMessage = 
          `Camera/Microphone is in use or not responding.\n\n` +
          `Please check:\n` +
          `1. No other app is using camera/mic\n` +
          `2. Close video conferencing apps\n` +
          `3. Restart your browser`;
        console.warn('[MediaAccess] Device in use or not responding');
        break;

      case 'SecurityError':
        userMessage = 
          `Cannot access camera/microphone over insecure connection.\n\n` +
          `Supported origins:\n` +
          `• http://localhost:5173\n` +
          `• http://127.0.0.1:5173\n` +
          `• https://* (any secure origin)\n\n` +
          `Current origin: ${origin}`;
        console.warn('[MediaAccess] Security context issue - HTTPS or localhost required');
        break;

      case 'TypeError':
        if (errorMessage.includes('Illegal')) {
          userMessage = 'Invalid media constraints. Please contact support.';
          console.warn('[MediaAccess] Invalid constraints');
        } else {
          userMessage = `Unexpected error: ${errorMessage}`;
        }
        break;

      default:
        userMessage = `Unable to access camera or microphone: ${errorMessage}`;
        console.warn('[MediaAccess] Unknown error');
    }

    console.error('[MediaAccess] User Message:', userMessage);
    console.error('[MediaAccess] Origin:', origin);
    console.error('[MediaAccess] Browser:', navigator.userAgent);

    // Show alert to user with retry option
    const shouldRetry = confirm(`❌ ${userMessage}\n\nWould you like to try again?`);
    if (shouldRetry) {
      console.log('[MediaAccess] User chose to retry');
      // Recursive retry
      return requestMediaAccess(constraints);
    }

    throw new Error(userMessage);
  }
}

/**
 * Safely stop all tracks in a stream
 */
export function stopMediaStream(stream) {
  if (!stream) return;
  
  stream.getTracks().forEach((track) => {
    console.log(`[MediaAccess] Stopping ${track.kind} track:`, track.label);
    track.stop();
  });
  
  console.log('[MediaAccess] All media tracks stopped');
}

/**
 * Check if specific media device is available
 */
export async function checkMediaDevices() {
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      console.warn('[MediaAccess] enumerateDevices not supported');
      return { video: false, audio: false };
    }

    const devices = await navigator.mediaDevices.enumerateDevices();
    const hasVideo = devices.some(device => device.kind === 'videoinput');
    const hasAudio = devices.some(device => device.kind === 'audioinput');

    console.log('[MediaAccess] Available devices:', { 
      cameras: devices.filter(d => d.kind === 'videoinput').length,
      microphones: devices.filter(d => d.kind === 'audioinput').length,
    });

    return { video: hasVideo, audio: hasAudio };
  } catch (error) {
    console.error('[MediaAccess] Failed to enumerate devices:', error);
    return { video: false, audio: false };
  }
}

/**
 * Setup permission change listener (desktop only)
 */
export function onPermissionChange(callback) {
  if (!navigator.permissions || !navigator.permissions.query) {
    console.warn('[MediaAccess] Permissions API not supported');
    return () => {};
  }

  const setupListener = async (name) => {
    try {
      const permission = await navigator.permissions.query({ name });
      permission.addEventListener('change', () => {
        console.log(`[MediaAccess] ${name} permission changed:`, permission.state);
        callback({ type: name, state: permission.state });
      });
    } catch (error) {
      console.warn(`[MediaAccess] Cannot query ${name} permission:`, error);
    }
  };

  setupListener('camera');
  setupListener('microphone');

  return () => {
    console.log('[MediaAccess] Permission listeners removed');
  };
}
