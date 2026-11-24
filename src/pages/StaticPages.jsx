import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { CheckCircle2, Film, Layers, Shield } from 'lucide-react';
import { api } from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';

export function AboutPage() {
  return (
    <div className="pt-28 pb-20 max-w-5xl mx-auto px-4 sm:px-8 space-y-12">
      <div className="space-y-4 max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#E50914]">About CineFlix</p>
        <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-white" style={{ textWrap: 'balance' }}>
          Built for cinema lovers who care about craft and clarity.
        </h1>
        <p className="text-base text-zinc-300 leading-relaxed">
          CineFlix pairs theatrical curation with low-latency streaming playback, personalized recommendations, and transparent audience reviews across every screen.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-t border-white/10 pt-10">
        <div className="rounded-xl bg-[#111114] border border-white/10 p-6 space-y-3">
          <Film className="w-6 h-6 text-[#E50914]" />
          <h2 className="font-display text-lg font-semibold text-white">Curated Catalog</h2>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Handpicked independent features, genre staples, and multi-episode original series organized for effortless discovery.
          </p>
        </div>

        <div className="rounded-xl bg-[#111114] border border-white/10 p-6 space-y-3">
          <Layers className="w-6 h-6 text-[#E50914]" />
          <h2 className="font-display text-lg font-semibold text-white">Seamless Resume</h2>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Playback positions sync continuously so you can pause on a desktop monitor and pick up on a tablet without losing your place.
          </p>
        </div>

        <div className="rounded-xl bg-[#111114] border border-white/10 p-6 space-y-3">
          <Shield className="w-6 h-6 text-[#E50914]" />
          <h2 className="font-display text-lg font-semibold text-white">Privacy First</h2>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Your watchlist, preferences, and viewing history stay scoped strictly to your account with encrypted session controls.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link to="/movies" className="px-5 py-2.5 rounded-lg bg-[#E50914] text-white text-sm font-semibold">
          Browse Catalog
        </Link>
        <Link to="/contact" className="px-5 py-2.5 rounded-lg bg-[#141418] border border-white/15 text-white text-sm font-medium">
          Contact Support
        </Link>
      </div>
    </div>
  );
}

export function ContactPage() {
  const { showToast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const onSubmit = async (vals) => {
    setSubmitting(true);
    try {
      await api.post('/api/contact', vals);
      setSubmitted(true);
      reset();
      showToast('Message sent to CineFlix support.', 'success');
    } catch (err) {
      showToast(err.message || 'Unable to send message.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pt-28 pb-20 max-w-2xl mx-auto px-4 sm:px-8 space-y-8">
      <div className="space-y-2">
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-white">Contact Us</h1>
        <p className="text-sm text-zinc-400">
          Questions about playback, catalog licensing, or your CineFlix account? Send our team a note below.
        </p>
      </div>

      {submitted ? (
        <div className="rounded-xl bg-[#111114] border border-emerald-500/30 p-8 text-center space-y-3">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
          <h2 className="font-display text-xl font-semibold text-white">Message Received</h2>
          <p className="text-sm text-zinc-400">
            Thank you for reaching out. Our editorial and technical support desk will respond shortly.
          </p>
          <button
            type="button"
            onClick={() => setSubmitted(false)}
            className="px-4 py-2 rounded-lg bg-white/10 text-white text-xs font-medium"
          >
            Send Another Message
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="rounded-2xl bg-[#111114] border border-white/10 p-6 sm:p-8 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">Your Name</label>
              <input
                type="text"
                {...register('name', { required: 'Name is required', minLength: { value: 2, message: 'Minimum 2 characters' } })}
                placeholder="Alex Morgan"
                className="w-full rounded-lg bg-[#18181B] border border-white/15 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#E50914]"
              />
              {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">Email Address</label>
              <input
                type="email"
                {...register('email', { required: 'Email is required' })}
                placeholder="you@example.com"
                className="w-full rounded-lg bg-[#18181B] border border-white/15 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#E50914]"
              />
              {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">Subject</label>
            <input
              type="text"
              {...register('subject', { required: 'Subject is required', minLength: { value: 3, message: 'Minimum 3 characters' } })}
              placeholder="Playback issue, catalog inquiry, or feedback"
              className="w-full rounded-lg bg-[#18181B] border border-white/15 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#E50914]"
            />
            {errors.subject && <p className="mt-1 text-xs text-red-400">{errors.subject.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">Message</label>
            <textarea
              rows={5}
              {...register('message', { required: 'Message is required', minLength: { value: 10, message: 'Minimum 10 characters' } })}
              placeholder="Tell us how we can help..."
              className="w-full rounded-lg bg-[#18181B] border border-white/15 p-3.5 text-sm text-white focus:outline-none focus:border-[#E50914]"
            />
            {errors.message && <p className="mt-1 text-xs text-red-400">{errors.message.message}</p>}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 rounded-lg bg-[#E50914] hover:bg-[#c80812] text-white text-sm font-semibold transition-colors disabled:opacity-50"
          >
            {submitting ? 'Sending...' : 'Send Message'}
          </button>
        </form>
      )}
    </div>
  );
}
