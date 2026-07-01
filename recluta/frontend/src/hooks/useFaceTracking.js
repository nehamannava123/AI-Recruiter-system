import { useCallback, useEffect, useRef, useState } from 'react';

export function useFaceTracking(videoRef, enabled = true) {
  const [metrics, setMetrics] = useState({
    eyeContact: 0,
    headPose: { yaw: 0, pitch: 0, roll: 0 },
    smileScore: 0,
    engagement: 0,
    faceBox: null,
    ready: false,
  });
  const [error, setError] = useState(null);
  const faceMeshRef = useRef(null);
  const rafRef = useRef(null);
  const lastEmitRef = useRef(0);
  const metricsAccumRef = useRef({ eye: [], smile: [] });

  const computeMetrics = useCallback((landmarks) => {
    if (!landmarks || landmarks.length < 468) return null;

    const nose = landmarks[1];
    const leftEyeOuter = landmarks[33];
    const rightEyeOuter = landmarks[263];
    const leftEyeInner = landmarks[133];
    const rightEyeInner = landmarks[362];
    const chin = landmarks[152];
    const forehead = landmarks[10];
    const leftMouth = landmarks[61];
    const rightMouth = landmarks[291];
    const upperLip = landmarks[13];
    const lowerLip = landmarks[14];

    const eyeCenterX = (leftEyeInner.x + rightEyeInner.x) / 2;
    const faceCenterX = (leftEyeOuter.x + rightEyeOuter.x) / 2;
    const horizontalOffset = Math.abs(eyeCenterX - faceCenterX);
    const eyeContact = Math.max(0, Math.min(100, 100 - horizontalOffset * 400));

    const yaw = (nose.x - 0.5) * 90;
    const pitch = ((chin.y - forehead.y) - 0.35) * 180;
    const roll = Math.atan2(
      rightEyeOuter.y - leftEyeOuter.y,
      rightEyeOuter.x - leftEyeOuter.x
    ) * (180 / Math.PI);

    const xs = landmarks.map((point) => point.x);
    const ys = landmarks.map((point) => point.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const margin = 0.04;
    const faceBox = {
      x: Math.max(0, minX - margin),
      y: Math.max(0, minY - margin),
      width: Math.min(1, maxX - minX + margin * 2),
      height: Math.min(1, maxY - minY + margin * 2),
    };

    const mouthWidth = Math.abs(rightMouth.x - leftMouth.x);
    const mouthHeight = Math.abs(lowerLip.y - upperLip.y);
    const smileRatio = mouthWidth > 0 ? mouthHeight / mouthWidth : 0;
    const smileScore = Math.max(0, Math.min(1, 0.3 + smileRatio * 2));

    const headAlignment = Math.max(0, 100 - (Math.abs(yaw) + Math.abs(pitch)) * 1.5);
    const engagement = (eyeContact * 0.6 + headAlignment * 0.2 + smileScore * 100 * 0.2);

    return {
      eyeContact: Math.round(eyeContact),
      headPose: {
        yaw: Math.round(yaw * 10) / 10,
        pitch: Math.round(pitch * 10) / 10,
        roll: Math.round(roll * 10) / 10,
      },
      smileScore: Math.round(smileScore * 100) / 100,
      engagement: Math.round(engagement),
      faceBox,
    };
  }, []);

  useEffect(() => {
    if (!enabled || !videoRef?.current) return;

    let cancelled = false;

    async function initFaceMesh() {
      try {
        const { FaceMesh } = await import('@mediapipe/face_mesh');
        const faceMesh = new FaceMesh({
          locateFile: (file) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
        });

        faceMesh.setOptions({
          maxNumFaces: 1,
          refineLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        faceMesh.onResults((results) => {
          if (cancelled) return;
          const landmarks = results.multiFaceLandmarks?.[0];
          if (!landmarks) return;

          const computed = computeMetrics(landmarks);
          if (!computed) return;

          metricsAccumRef.current.eye.push(computed.eyeContact);
          metricsAccumRef.current.smile.push(computed.smileScore);

          const now = Date.now();
          if (now - lastEmitRef.current >= 500) {
            lastEmitRef.current = now;
            const avgEye =
              metricsAccumRef.current.eye.reduce((a, b) => a + b, 0) /
              metricsAccumRef.current.eye.length;
            const avgSmile =
              metricsAccumRef.current.smile.reduce((a, b) => a + b, 0) /
              metricsAccumRef.current.smile.length;

            setMetrics({
              eyeContact: Math.round(avgEye),
              headPose: computed.headPose,
              smileScore: Math.round(avgSmile * 100) / 100,
              engagement: computed.engagement,
              faceBox: computed.faceBox,
              ready: true,
            });

            metricsAccumRef.current = { eye: [], smile: [] };
          }
        });

        faceMeshRef.current = faceMesh;
        setMetrics((prev) => ({ ...prev, ready: true }));
      } catch (err) {
        setError('Failed to initialize face tracking. Browser CV unavailable.');
        setMetrics((prev) => ({ ...prev, ready: false }));
      }
    }

    initFaceMesh();

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      faceMeshRef.current = null;
    };
  }, [enabled, videoRef, computeMetrics]);

  useEffect(() => {
    if (!enabled || !faceMeshRef.current || !videoRef?.current) return;

    let running = true;

    const processFrame = async () => {
      if (!running || !faceMeshRef.current || !videoRef.current) return;
      const video = videoRef.current;
      if (video.readyState >= 2) {
        try {
          await faceMeshRef.current.send({ image: video });
        } catch {
          /* frame skip */
        }
      }
      rafRef.current = requestAnimationFrame(processFrame);
    };

    rafRef.current = requestAnimationFrame(processFrame);

    return () => {
      running = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [enabled, videoRef, metrics.ready]);

  return { metrics, error };
}

export default useFaceTracking;
