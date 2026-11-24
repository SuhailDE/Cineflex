import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ShieldCheck } from 'lucide-react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

export function LoginPage() {
  const { login, claimAdmin, adminStatus } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [claimMode, setClaimMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (vals) => {
    setServerError('');
    setSubmitting(true);
    try {
      if (claimMode && adminStatus.canClaimAdmin) {
        const user = await claimAdmin(vals);
        navigate(user.role === 'admin' ? '/admin' : '/');
      } else {
        const user = await login(vals);
        navigate(user.role === 'admin' ? '/admin' : '/');
      }
    } catch (err) {
      setServerError(err.message || 'Sign in failed.');
      showToast(err.message || 'Sign in failed.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pt-28 pb-20 px-4 flex justify-center">
      <div className="w-full max-w-md rounded-2xl bg-[#111114] border border-white/10 p-7 sm:p-8 space-y-6">
        <div className="space-y-1.5">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
            {claimMode ? 'Claim Admin Workspace' : 'Sign In to CineFlix'}
          </h1>
          <p className="text-sm text-zinc-400">
            {claimMode
              ? 'Create the initial administrator account to manage movies, genres, and analytics.'
              : 'Access your watchlist, watch history, and personalized streams.'}
          </p>
        </div>

        {adminStatus.canClaimAdmin && (
          <div className="rounded-xl bg-[#18181B] border border-white/10 p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-xs text-zinc-300">
              <ShieldCheck className="w-4 h-4 text-[#E50914] shrink-0" />
              <span>{claimMode ? 'First-run admin setup active' : 'No administrator claimed yet'}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setClaimMode((m) => !m);
                setServerError('');
              }}
              className="text-xs font-semibold text-white underline underline-offset-4 whitespace-nowrap"
            >
              {claimMode ? 'Member Sign In' : 'Claim Admin'}
            </button>
          </div>
        )}

        {serverError && (
          <div className="rounded-lg bg-[#E50914]/15 border border-[#E50914]/40 px-4 py-2.5 text-xs text-red-200">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {claimMode && (
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">Administrator Name</label>
              <input
                type="text"
                {...register('name', { required: 'Name is required', minLength: { value: 2, message: 'At least 2 characters' } })}
                placeholder="Alex Morgan"
                className="w-full rounded-lg bg-[#18181B] border border-white/15 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#E50914]"
              />
              {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name.message}</p>}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">Email Address</label>
            <input
              type="email"
              {...register('email', { required: 'Email is required' })}
              placeholder="you@example.com"
              className="w-full rounded-lg bg-[#18181B] border border-white/15 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#E50914]"
            />
            {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-zinc-300">Password</label>
              {!claimMode && (
                <Link to="/forgot-password" className="text-xs text-zinc-400 hover:text-white">
                  Forgot password?
                </Link>
              )}
            </div>
            <input
              type="password"
              {...register('password', {
                required: 'Password is required',
                minLength: claimMode ? { value: 8, message: 'At least 8 characters' } : undefined,
              })}
              placeholder="••••••••"
              className="w-full rounded-lg bg-[#18181B] border border-white/15 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#E50914]"
            />
            {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 rounded-lg bg-[#E50914] hover:bg-[#c80812] text-white text-sm font-semibold transition-colors disabled:opacity-50"
          >
            {submitting ? 'Please wait...' : claimMode ? 'Create Admin Account' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-zinc-400">
          New to CineFlix?{' '}
          <Link to="/register" className="text-white font-medium hover:underline underline-offset-4">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}

export function RegisterPage() {
  const { register: registerAccount } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const onSubmit = async (vals) => {
    setServerError('');
    setSubmitting(true);
    try {
      await registerAccount({
        name: vals.name,
        email: vals.email,
        password: vals.password,
      });
      navigate('/');
    } catch (err) {
      setServerError(err.message || 'Registration failed.');
      showToast(err.message || 'Registration failed.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pt-28 pb-20 px-4 flex justify-center">
      <div className="w-full max-w-md rounded-2xl bg-[#111114] border border-white/10 p-7 sm:p-8 space-y-6">
        <div className="space-y-1.5">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">Create Your Account</h1>
          <p className="text-sm text-zinc-400">Start building your watchlist and resume playback anywhere.</p>
        </div>

        {serverError && (
          <div className="rounded-lg bg-[#E50914]/15 border border-[#E50914]/40 px-4 py-2.5 text-xs text-red-200">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">Full Name</label>
            <input
              type="text"
              {...register('name', { required: 'Full name is required', minLength: { value: 2, message: 'Minimum 2 characters' } })}
              placeholder="Jordan Rivera"
              className="w-full rounded-lg bg-[#18181B] border border-white/15 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#E50914]"
            />
            {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">Email Address</label>
            <input
              type="email"
              {...register('email', { required: 'Email is required' })}
              placeholder="you@example.com"
              className="w-full rounded-lg bg-[#18181B] border border-white/15 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#E50914]"
            />
            {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">Password</label>
            <input
              type="password"
              {...register('password', { required: 'Password is required', minLength: { value: 8, message: 'At least 8 characters' } })}
              placeholder="Minimum 8 characters"
              className="w-full rounded-lg bg-[#18181B] border border-white/15 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#E50914]"
            />
            {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">Confirm Password</label>
            <input
              type="password"
              {...register('confirmPassword', {
                validate: (val) => val === watch('password') || 'Passwords do not match',
              })}
              placeholder="Re-enter password"
              className="w-full rounded-lg bg-[#18181B] border border-white/15 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#E50914]"
            />
            {errors.confirmPassword && <p className="mt-1 text-xs text-red-400">{errors.confirmPassword.message}</p>}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 rounded-lg bg-[#E50914] hover:bg-[#c80812] text-white text-sm font-semibold transition-colors disabled:opacity-50"
          >
            {submitting ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-zinc-400">
          Already have an account?{' '}
          <Link to="/login" className="text-white font-medium hover:underline underline-offset-4">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export function ForgotPasswordPage() {
  const { showToast } = useToast();
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (vals) => {
    setSubmitting(true);
    try {
      const res = await api.post('/api/auth/forgot-password', { email: vals.email });
      setResult(res);
      showToast('Password reset instructions generated.', 'success');
    } catch (err) {
      showToast(err.message || 'Could not initiate reset.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pt-28 pb-20 px-4 flex justify-center">
      <div className="w-full max-w-md rounded-2xl bg-[#111114] border border-white/10 p-7 sm:p-8 space-y-6">
        <div className="space-y-1.5">
          <h1 className="font-display text-2xl font-bold text-white">Reset Password</h1>
          <p className="text-sm text-zinc-400">Enter your email address to request a password reset token.</p>
        </div>

        {result ? (
          <div className="rounded-xl bg-[#18181B] border border-white/10 p-4 space-y-3 text-sm text-zinc-300">
            <p>{result.message}</p>
            {result.resetToken && (
              <div className="space-y-2 pt-2 border-t border-white/10">
                <p className="text-xs text-zinc-400">Preview reset link:</p>
                <Link
                  to={`/reset-password?token=${result.resetToken}`}
                  className="inline-block px-4 py-2 rounded-lg bg-[#E50914] text-white text-xs font-semibold"
                >
                  Continue to Password Reset
                </Link>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">Email Address</label>
              <input
                type="email"
                {...register('email', { required: 'Email is required' })}
                placeholder="you@example.com"
                className="w-full rounded-lg bg-[#18181B] border border-white/15 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#E50914]"
              />
              {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-lg bg-[#E50914] hover:bg-[#c80812] text-white text-sm font-semibold transition-colors disabled:opacity-50"
            >
              {submitting ? 'Sending...' : 'Request Reset Link'}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-zinc-400">
          <Link to="/login" className="text-white hover:underline underline-offset-4">
            Back to Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: { token: searchParams.get('token') || '', password: '' },
  });

  const onSubmit = async (vals) => {
    setSubmitting(true);
    try {
      await api.post('/api/auth/reset-password', vals);
      showToast('Password updated. Please sign in.', 'success');
      navigate('/login');
    } catch (err) {
      showToast(err.message || 'Reset failed.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pt-28 pb-20 px-4 flex justify-center">
      <div className="w-full max-w-md rounded-2xl bg-[#111114] border border-white/10 p-7 sm:p-8 space-y-6">
        <h1 className="font-display text-2xl font-bold text-white">Choose a New Password</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">Reset Token</label>
            <input
              type="text"
              {...register('token', { required: 'Reset token is required' })}
              className="w-full rounded-lg bg-[#18181B] border border-white/15 px-3.5 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-[#E50914]"
            />
            {errors.token && <p className="mt-1 text-xs text-red-400">{errors.token.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">New Password</label>
            <input
              type="password"
              {...register('password', { required: 'New password is required', minLength: { value: 8, message: 'Minimum 8 characters' } })}
              placeholder="Minimum 8 characters"
              className="w-full rounded-lg bg-[#18181B] border border-white/15 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#E50914]"
            />
            {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>}
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 rounded-lg bg-[#E50914] hover:bg-[#c80812] text-white text-sm font-semibold transition-colors disabled:opacity-50"
          >
            {submitting ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
