import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Mic, CheckCircle, AlertCircle, Loader2, Search } from 'lucide-react';
import Navbar from '../components/Navbar';
import FaceTracker from '../components/FaceTracker';
import { parseResume } from '../lib/api';

const EXPERIENCE_LEVELS = ['Intern', 'Junior', 'Mid', 'Senior'];

const ROLE_CATEGORIES = [
  {
    label: 'Software Engineering',
    roles: ['Frontend Engineer', 'Backend Engineer', 'Full-Stack Engineer', 'DevOps Engineer'],
  },
  {
    label: 'Data & AI',
    roles: ['Data Scientist', 'ML Engineer', 'Analytics Engineer', 'AI Product Specialist'],
  },
  {
    label: 'Product',
    roles: ['Product Manager', 'Product Operations', 'Growth PM'],
  },
  {
    label: 'Design',
    roles: ['UX Designer', 'UI Designer', 'Product Designer', 'Design Researcher'],
  },
  {
    label: 'Customer',
    roles: ['Customer Success', 'Client Support Specialist', 'Community Manager'],
  },
];

export default function Setup() {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('Frontend Engineer');
  const [experienceLevel, setExperienceLevel] = useState('Mid');
  const [cameraReady, setCameraReady] = useState(false);
  const [micReady, setMicReady] = useState(false);
  const [cvReady, setCvReady] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeSummary, setResumeSummary] = useState('');
  const [resumeError, setResumeError] = useState(null);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState({ camera: 'prompt', microphone: 'prompt' });
  const [isFileProtocol, setIsFileProtocol] = useState(false);
  const analyserRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    setIsFileProtocol(window.location.protocol === 'file:');

    let stream = null;

   async function initDevices() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    console.log("MEDIA ACCESS SUCCESS");

    if (videoRef.current) {
      videoRef.current.srcObject = stream;

      videoRef.current.onloadedmetadata = () => {
        videoRef.current.play().catch(console.error);
      };
    }

    setCameraReady(true);
    setMicReady(true);

    if (stream.getAudioTracks().length > 0) {
      const audioCtx =
        new (window.AudioContext || window.webkitAudioContext)();

      const source =
        audioCtx.createMediaStreamSource(stream);

      const analyser =
        audioCtx.createAnalyser();

      analyser.fftSize = 256;

      source.connect(analyser);

      analyserRef.current = analyser;

      const dataArray =
        new Uint8Array(analyser.frequencyBinCount);

      const updateLevel = () => {
        analyser.getByteFrequencyData(dataArray);

        const avg =
          dataArray.reduce((a, b) => a + b, 0) /
          dataArray.length;

        setMicLevel(Math.min(100, avg * 1.5));

        animationRef.current =
          requestAnimationFrame(updateLevel);
      };

      updateLevel();
    }

    setError(null);
  } catch (err) {
    console.log("MEDIA ERROR:", err);

    const errorMessage =
      err.name === "NotAllowedError"
        ? "Camera or microphone access denied."
        : err.name === "NotFoundError"
        ? "No camera or microphone found."
        : err.name === "NotReadableError"
        ? "Camera or microphone is already in use."
        : err.message;

    setError(errorMessage);
  }

    }

    async function updatePermissionStatus() {
      if (!navigator.permissions) return;
      try {
        const cameraPerm = await navigator.permissions.query({ name: 'camera' });
        const micPerm = await navigator.permissions.query({ name: 'microphone' });
        setPermissionStatus({ camera: cameraPerm.state, microphone: micPerm.state });

        cameraPerm.onchange = () => setPermissionStatus((prev) => ({ ...prev, camera: cameraPerm.state }));
        micPerm.onchange = () => setPermissionStatus((prev) => ({ ...prev, microphone: micPerm.state }));
      } catch {
        // Permissions API not available or denied
      }
    }

    updatePermissionStatus();
    initDevices();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const handleCvMetrics = useCallback((metrics) => {
    if (metrics.error) {
      setCvReady(false);
    } else if (metrics.eyeContact !== undefined) {
      setCvReady(true);
    }
  }, []);

  const handleResumeFileChange = async (event) => {
    const file = event.target.files?.[0];
    setResumeError(null);
    setResumeSummary('');
    setResumeFile(file || null);

    if (!file) {
      return;
    }

    setResumeLoading(true);
    try {
      const data = await parseResume(file);
      setResumeSummary(data.resume_summary || 'Resume uploaded successfully.');
    } catch (err) {
      setResumeError(err.message || 'Unable to parse resume.');
      setResumeFile(null);
    } finally {
      setResumeLoading(false);
    }
  };

  const filteredCategories = useMemo(() => {
    if (!search.trim()) return ROLE_CATEGORIES;
    const lowerSearch = search.toLowerCase();

    return ROLE_CATEGORIES.map((category) => ({
      ...category,
      roles: category.roles.filter((role) => role.toLowerCase().includes(lowerSearch)),
    })).filter((category) => category.roles.length > 0);
  }, [search]);

  const handleStart = () => {
    if (!selectedRole) {
      setError('Please select a role from the list.');
      return;
    }
    setLoading(true);
    const config = {
      jobTitle: selectedRole,
      experienceLevel,
      interviewType: 'Behavioral',
      resumeSummary,
    };
    sessionStorage.setItem('recluta_config', JSON.stringify(config));
    navigate('/interview');
  };

  const StatusPill = ({ ready, label }) => (
    <span
      className={`status-pill ${
        ready ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200' : 'bg-[#111827] text-secondary'
      }`}
    >
      {ready ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
      {label}
    </span>
  );

  return (
  <div className="min-h-screen bg-void">
    <Navbar />

    <main className="max-w-7xl mx-auto px-6 py-10">
      <div className="grid gap-8 xl:grid-cols-2">

        {/* LEFT PANEL */}
        <section className="space-y-8 rounded-3xl border border-border/70 bg-surface-soft p-8">

          <div>
            <span className="pill-badge">
              Interview Profile
            </span>

            <h1 className="mt-4 text-4xl font-bold text-primary">
              Lock in your interview role and start with confidence.
            </h1>

            <p className="mt-3 text-secondary">
              Choose a role and experience level so the AI interviewer
              adapts to your profile.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">

            {/* TARGET ROLE */}
            <div className="rounded-3xl border border-border bg-[#0b1322] p-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs uppercase text-secondary tracking-widest">
                    Target Role
                  </p>

                  <h2 className="mt-2 text-3xl font-bold text-primary">
                    {selectedRole}
                  </h2>
                </div>

                <div className="rounded-full border border-cyan-500 px-4 py-2 text-cyan-400 text-sm">
                  LIVE
                </div>
              </div>

              <div className="mt-8">
                <label className="text-sm text-secondary">
                  Experience Level
                </label>

                <div className="grid gap-3 mt-3">
                  {EXPERIENCE_LEVELS.map((level) => (
                    <button
                      key={level}
                      onClick={() => setExperienceLevel(level)}
                      className={`rounded-xl border p-4 text-left transition ${
                        experienceLevel === level
                          ? "border-cyan-500 bg-cyan-500/10 text-white"
                          : "border-slate-700 bg-slate-900 text-gray-300 hover:border-cyan-400"
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <label className="text-sm text-secondary">
                  Search Role
                </label>

                <div className="relative mt-3">
                  <Search
                    size={18}
                    className="absolute left-4 top-4 text-gray-400"
                  />

                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search roles..."
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 pl-12 pr-4 py-3 text-white outline-none"
                  />
                </div>
              </div>
            </div>

            {/* ROLE SELECTION */}
            <div className="rounded-3xl border border-border bg-[#0b1322] p-6 max-h-[700px] overflow-y-auto">

              <p className="text-xs uppercase tracking-widest text-secondary">
                Role Selection
              </p>

              <div className="mt-6 space-y-6">

                {filteredCategories.map((category) => (
                  <div key={category.label}>
                    <h3 className="font-semibold text-white mb-3">
                      {category.label}
                    </h3>

                    <div className="grid gap-3 md:grid-cols-2">

                      {category.roles.map((role) => (
                        <button
                          key={role}
                          onClick={() => setSelectedRole(role)}
                          className={`rounded-xl border p-4 text-left transition ${
                            selectedRole === role
                              ? "border-cyan-500 bg-cyan-500/10"
                              : "border-slate-700 bg-slate-900 hover:border-cyan-400"
                          }`}
                        >
                          <h4 className="font-semibold text-white break-words">
                            {role}
                          </h4>

                          <p className="mt-1 text-xs text-gray-400">
                            {category.label}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

              </div>
            </div>
          </div>

          {error && (
            <div className="space-y-4 rounded-xl bg-red-500/10 border border-red-500 p-4 text-red-300">
              <p>{error}</p>
              <div className="flex flex-wrap gap-3">
                {isFileProtocol ? (
                  <button
                    onClick={() => setError('Please open the app on http://localhost:4173 or another local server.')}
                    className="rounded-xl border border-red-500 bg-red-600/10 px-4 py-3 text-sm font-semibold"
                  >
                    Open via localhost
                  </button>
                ) : (
                  <button
                    onClick={() => window.location.reload()}
                    className="rounded-xl border border-red-500 bg-red-600/10 px-4 py-3 text-sm font-semibold"
                  >
                    Retry permissions
                  </button>
                )}
                <button
                  onClick={() => window.open('https://support.google.com/chrome/answer/2693767', '_blank')}
                  className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm"
                >
                  Browser permissions help
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-4 items-center">

            <button
              onClick={handleStart}
              disabled={loading || !cameraReady}
              className="px-8 py-4 rounded-xl bg-cyan-500 text-black font-semibold disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 size={18} className="animate-spin" />
                  Starting...
                </span>
              ) : (
                "Start Interview"
              )}
            </button>

            <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
              <p className="text-xs uppercase text-gray-400">
                Tip
              </p>

              <p className="mt-1 text-sm text-gray-300">
                Select the role closest to your actual interview.
              </p>
            </div>
          </div>
        </section>

        {/* RIGHT PANEL */}
        <aside className="space-y-6">

          <div className="rounded-3xl border border-border bg-surface-soft p-6">

            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs uppercase tracking-widest text-secondary">
                  Camera Preview
                </p>

                <h2 className="text-xl font-semibold text-primary mt-2">
                  Ready to Record
                </h2>
              </div>

              <div className="rounded-full bg-cyan-500/10 text-cyan-400 px-4 py-2">
                Live Check
              </div>
            </div>

            <div className="mt-6 rounded-3xl overflow-hidden border border-slate-700">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-[320px] object-cover"
              />
            </div>

            <div className="grid gap-3 mt-5 md:grid-cols-2">
              <StatusPill
                ready={cameraReady}
                label={permissionStatus.camera === 'denied' ? 'Camera denied' : 'Camera'}
              />

              <StatusPill
                ready={micReady}
                label={permissionStatus.microphone === 'denied' ? 'Microphone denied' : 'Microphone'}
              />
            </div>

            <div className="mt-5 rounded-xl border border-slate-700 p-4">

              <div className="flex justify-between text-sm text-gray-400">
                <span>Mic Input</span>
                <span>{Math.round(micLevel)}%</span>
              </div>

              <div className="mt-3 h-3 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-cyan-400 transition-all"
                  style={{
                    width: `${micLevel}%`,
                  }}
                />
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-slate-700 p-4">
              <h3 className="font-semibold text-white">Resume upload</h3>
              <p className="mt-2 text-gray-400">
                Upload your resume to personalize the first question and help the AI interviewer focus on your experience.
              </p>

              <div className="mt-4">
                <label className="block text-sm text-gray-300 mb-2" htmlFor="resumeUpload">
                  Resume (PDF, DOCX, or TXT)
                </label>
                <input
                  id="resumeUpload"
                  type="file"
                  accept=".pdf,.docx,.txt"
                  onChange={handleResumeFileChange}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-white"
                />
              </div>

              {resumeLoading && (
                <p className="mt-3 text-sm text-cyan-300">Parsing resume…</p>
              )}

              {resumeError && (
                <p className="mt-3 text-sm text-red-400">{resumeError}</p>
              )}

              {resumeSummary && !resumeError && (
                <div className="mt-4 rounded-2xl border border-cyan-600/20 bg-[#03131f] p-4 text-sm text-cyan-100">
                  <p className="font-medium">Resume summary</p>
                  <p className="mt-2 text-gray-300">{resumeSummary}</p>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-surface-soft p-6">

            <p className="text-xs uppercase tracking-widest text-secondary">
              Environment Readiness
            </p>

            <ul className="space-y-4 mt-5 text-gray-300">

              <li className="flex gap-3">
                <span className="w-3 h-3 rounded-full bg-cyan-400 mt-1" />
                Use a quiet room with a neutral background.
              </li>

              <li className="flex gap-3">
                <span className="w-3 h-3 rounded-full bg-cyan-400 mt-1" />
                Keep your webcam at eye level.
              </li>

              <li className="flex gap-3">
                <span className="w-3 h-3 rounded-full bg-cyan-400 mt-1" />
                Close apps with notifications.
              </li>

            </ul>
          </div>

        </aside>

      </div>
    </main>
  </div>
);
}