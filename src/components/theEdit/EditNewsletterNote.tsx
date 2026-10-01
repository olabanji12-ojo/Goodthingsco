import React, { useState } from 'react';

interface EditNewsletterNoteProps {
  className?: string;
}

/**
 * EditNewsletterNote — Quiet Editorial Journal Invitation
 *
 * A restrained, elegant newsletter block:
 * "Receive our seasonal journal, curated gift guides, and private invitations."
 */
export const EditNewsletterNote: React.FC<EditNewsletterNoteProps> = ({ className = '' }) => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubmitted(true);
    }
  };

  return (
    <aside
      aria-label="Editorial Journal Dispatch"
      className={`w-full max-w-4xl mx-auto mb-16 sm:mb-20 p-8 sm:p-10 md:p-12 bg-white rounded-3xl border border-brand-dark/10 shadow-xs text-center ${className}`}
    >
      <div className="max-w-xl mx-auto">
        <span className="font-sans text-[10px] sm:text-[11px] font-semibold tracking-[0.24em] uppercase text-gold-700 block mb-2">
          The Good Things Co. Dispatch
        </span>
        <h3 className="font-serif text-2xl sm:text-3xl text-brand-dark font-normal tracking-tight mb-3">
          Thoughtful Stories in Your Inbox
        </h3>
        <p className="font-sans text-xs sm:text-sm text-brand-medium/90 leading-relaxed mb-6">
          Receive our seasonal journal releases, curated holiday gift guides, and private invitations to new bespoke collections. Dispatched with quiet care.
        </p>

        {submitted ? (
          <div className="p-4 rounded-xl bg-gold-50 border border-gold-200 text-gold-800 font-sans text-xs font-medium animate-fade-in">
            ✓ Thank you for subscribing. Our latest seasonal journal will arrive shortly.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
              className="flex-1 px-4 py-3 rounded-none border border-brand-dark/20 text-xs sm:text-sm font-sans focus:outline-none focus:border-brand-dark bg-[#FAF8F5]/60 transition-colors"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-brand-dark text-brand-ivory hover:bg-gold-600 font-sans text-xs font-semibold tracking-[0.16em] uppercase transition-colors shrink-0 cursor-pointer"
            >
              Subscribe
            </button>
          </form>
        )}

        <span className="font-sans text-[10px] text-brand-light block mt-4">
          No spam, ever. Unsubscribe at any moment with one click.
        </span>
      </div>
    </aside>
  );
};

export default EditNewsletterNote;
