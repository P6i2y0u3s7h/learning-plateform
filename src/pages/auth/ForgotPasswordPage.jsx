import { useState } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Mail, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { FormField } from '../../components/FormFields';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { ROUTES } from '../../constants/routes';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

export default function ForgotPasswordPage() {
  useDocumentTitle('Reset Password — Brainstorm Academy');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const { sendPasswordReset } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setError('Please provide a valid registered email address');
      return;
    }
    setError('');
    setLoading(true);

    try {
      await sendPasswordReset(email.trim());
      setSubmitted(true);
    } catch (err) {
      setError(err.message || 'Unable to send reset email. Please verify the address.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 bg-white p-8 sm:p-10 rounded-3xl border border-gray-100 shadow-xl">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-4 group">
            <div className="w-12 h-12 rounded-2xl bg-[#17365D] flex items-center justify-center group-hover:bg-[#2457A7] transition-colors shadow-md">
              <GraduationCap className="w-7 h-7 text-[#F4B942]" />
            </div>
          </Link>
          <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-[#17365D]">
            Reset Password
          </h2>
          <p className="mt-2 text-sm text-[#6B7280]">
            Enter your registered email address and we will dispatch a password recovery link via Firebase.
          </p>
        </div>

        {error && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs sm:text-sm text-red-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {submitted ? (
          <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3">
            <div className="w-12 h-12 bg-emerald-100 rounded-2xl mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="font-bold text-emerald-900 text-base">Check Your Inbox</h3>
            <p className="text-xs sm:text-sm text-emerald-700 leading-relaxed">
              A password reset link has been dispatched to{' '}
              <span className="font-bold text-emerald-900">{email}</span>. Click the link in the email to set a new password.
            </p>
            <div className="pt-3">
              <Button to={ROUTES.LOGIN} variant="primary" size="sm" className="w-full">
                Back to Login
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField
              label="Registered Email"
              id="email"
              type="email"
              placeholder="student@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={error}
              required
              autoComplete="email"
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full justify-center shadow-md font-bold text-sm sm:text-base py-3"
            >
              <Mail className="w-4 h-4 mr-1.5" />
              <span>Send Reset Link</span>
            </Button>
          </form>
        )}

        <div className="text-center pt-2">
          <Link
            to={ROUTES.LOGIN}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2457A7] hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
