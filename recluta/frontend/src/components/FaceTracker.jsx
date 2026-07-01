import { useEffect } from 'react';
import { useFaceTracking } from '../hooks/useFaceTracking';

export default function FaceTracker({ videoRef, enabled = true, onMetricsUpdate }) {
  const { metrics, error } = useFaceTracking(videoRef, enabled);

  useEffect(() => {
    if (onMetricsUpdate && metrics.ready) {
      onMetricsUpdate({
        eyeContact: metrics.eyeContact,
        headPose: metrics.headPose,
        smileScore: metrics.smileScore,
        engagement: metrics.engagement,
        faceBox: metrics.faceBox,
      });
    }
  }, [metrics, onMetricsUpdate]);

  useEffect(() => {
    if (error && onMetricsUpdate) {
      onMetricsUpdate({ error });
    }
  }, [error, onMetricsUpdate]);

  return null;
}
