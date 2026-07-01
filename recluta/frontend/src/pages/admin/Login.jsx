import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Mail, ShieldCheck } from 'lucide-react';
import Navbar from '../../components/Navbar';
import { supabase } from '../../lib/supabaseClient';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!supabase) {
      setMessage('Supabase is not configured.');
      return;
    }

    setLoading(true);
    setMessage('');
    const { data, error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
    if (error) {
      setMessage(error.message || 'Unable to sign in.');
      setLoading(false);
      return;
    }

    const role = data?.user?.user_metadata?.role || data?.user?.app_metadata?.role;
    if (role !== 'admin') {
      setMessage('This account is not authorized for the admin panel.');
      setLoading(false);
      return;
    }

    navigate('/admin/dashboard');
  };

  return (
    <div className="min-h-screen bg-void">
      <Navbar minimal />
      <section className="flex min-h-screen items-center justify-center px-6 py-20 lg:px-12">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-2xl rounded-[32px] border border-border bg-card p-8 shadow-card">
          <div className="flex items-center gap-3 rounded-full border border-aurora/20 bg-elevated px-4 py-2 text-sm text-aurora">
            <ShieldCheck size={16} /> Admin Access
          </div>
          <h1 className="mt-6 text-4xl font-semibold text-primary">HR Admin Portal</h1>
          <p className="mt-3 text-secondary">Authenticate to review completed interviews and analytics.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div className="relative">
              <Mail className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
              <input className="input-field pl-12" type="email" placeholder="admin@example.com" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
            </div>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
              <input className="input-field pl-12" type="password" placeholder="Password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
            </div>
            {message ? <div className="rounded-[18px] border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">{message}</div> : null}
            <button className="btn-primary w-full" type="submit" disabled={loading}>{loading ? 'Signing in…' : 'Sign in to admin panel'}</button>
          </form>
        </motion.div>
      </section>
    </div>
  );
}
