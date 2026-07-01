import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Mail, Lock, ShieldCheck, Sparkles } from 'lucide-react';
import Navbar from '../components/Navbar';
import { signInWithEmail, signUpWithEmail, getSession } from '../lib/supabaseClient';

export default function AuthPage({ mode = 'login' }) {
  const navigate = useNavigate();
  const isSignup = mode === 'signup';
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.email.trim() || !form.password.trim()) {
      setMessage({ type: 'error', text: 'Please enter both your email and password.' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const result = isSignup
        ? await signUpWithEmail(form.email.trim(), form.password)
        : await signInWithEmail(form.email.trim(), form.password);

      console.log('auth result', result);

      if (result?.error) {
        setMessage({ type: 'error', text: result.error.message || 'Unable to complete that action.' });
        setLoading(false);
        return;
      }

      if (isSignup) {
        setMessage({
          type: 'success',
          text: 'Account created. Please check your inbox and then sign in.',
        });
        setForm({ email: '', password: '' });
        setLoading(false);
        return;
      }

      // For sign-in: poll getSession until Supabase client hydrates the session
      setMessage({ type: 'info', text: 'Signed in. Finalizing session...' });
      let session = null;
      for (let i = 0; i < 8; i++) {
        const s = await getSession();
        session = s?.data?.session || null;
        console.log('getSession attempt', i, session);
        if (session) break;
        // wait 300ms
        // eslint-disable-next-line no-await-in-loop
        await new Promise((r) => setTimeout(r, 300));
      }

      if (!session) {
        setMessage({ type: 'error', text: 'Signed in but session unavailable. Please refresh or try again.' });
        setLoading(false);
        return;
      }

      setMessage({ type: 'success', text: 'Signed in successfully.' });
      setLoading(false);
      navigate('/setup');
    } catch (error) {
      setMessage({
        type: 'error',
        text: error?.message || 'Something went wrong while trying to authenticate.',
      });
    } finally {
      // loading cleared above in branches
    }
  };

  return (
    <div className="min-h-screen bg-void">
      <Navbar minimal />

      <section className="flex min-h-screen items-center justify-center px-6 py-20 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="w-full max-w-5xl overflow-hidden rounded-card border border-border bg-card shadow-card"
        >
          <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
            <div className="border-b border-border p-8 sm:p-10 lg:border-b-0 lg:border-r">
              <div className="inline-flex items-center gap-2 rounded-pill border border-aurora/30 bg-elevated px-3 py-1 text-sm text-aurora">
                <Sparkles size={14} />
                {isSignup ? 'Create your recruiter-ready profile' : 'Resume your prep journey'}
              </div>

              <h1 className="mt-6 font-display text-3xl font-semibold text-primary sm:text-4xl">
                {isSignup ? 'Create an account' : 'Welcome back'}
              </h1>
              <p className="mt-3 max-w-xl text-base text-secondary">
                {isSignup
                  ? 'Save your interview history, unlock progress tracking, and keep practicing with a polished workflow.'
                  : 'Pick up where you left off and continue refining your interview performance.'}
              </p>

              <div className="mt-8 space-y-4">
                <div className="flex items-start gap-3 rounded-input border border-border bg-elevated p-4">
                  <ShieldCheck size={18} className="mt-0.5 text-aurora" />
                  <div>
                    <p className="font-medium text-primary">Secure and lightweight</p>
                    <p className="text-sm text-secondary">
                      Authentication is handled with your Supabase project when it is configured.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-input border border-border bg-elevated p-4">
                  <ArrowRight size={18} className="mt-0.5 text-cobalt" />
                  <div>
                    <p className="font-medium text-primary">Fast onboarding</p>
                    <p className="text-sm text-secondary">
                      Start practicing in minutes with guided setup and instant feedback.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 sm:p-10">
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label className="mb-2 block text-sm font-medium text-secondary" htmlFor="email">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                    <input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={(event) => setForm({ ...form, email: event.target.value })}
                      placeholder="you@example.com"
                      className="input-field pl-12"
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-secondary" htmlFor="password">
                    Password
                  </label>
                  <div className="relative">
                    <Lock size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                    <input
                      id="password"
                      type="password"
                      value={form.password}
                      onChange={(event) => setForm({ ...form, password: event.target.value })}
                      placeholder="At least 6 characters"
                      className="input-field pl-12"
                      autoComplete={isSignup ? 'new-password' : 'current-password'}
                    />
                  </div>
                </div>

                {message.text ? (
                  <div
                    className={`rounded-input border px-4 py-3 text-sm ${
                      message.type === 'error'
                        ? 'border-rose-500/30 bg-rose-500/10 text-rose-300'
                        : 'border-aurora/30 bg-aurora/10 text-aurora'
                    }`}
                  >
                    {message.text}
                  </div>
                ) : null}

                <button type="submit" className="btn-primary flex w-full items-center justify-center gap-2" disabled={loading}>
                  {loading ? 'Please wait…' : isSignup ? 'Create account' : 'Sign in'}
                  <ArrowRight size={18} />
                </button>
              </form>

              <div className="mt-6 text-sm text-secondary">
                {isSignup ? (
                  <p>
                    Already have an account?{' '}
                    <Link to="/login" className="font-medium text-aurora hover:text-cobalt">
                      Sign in here
                    </Link>
                  </p>
                ) : (
                  <p>
                    Need an account?{' '}
                    <Link to="/signup" className="font-medium text-aurora hover:text-cobalt">
                      Create one now
                    </Link>
                  </p>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
