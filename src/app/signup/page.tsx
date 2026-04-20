'use client'

import { useState } from 'react'
import Link from 'next/link'
import * as motion from 'motion/react-client'
import { AnimatePresence } from 'motion/react'
import { 
  Brain, 
  Mail, 
  Lock, 
  User, 
  ArrowRight, 
  Loader2, 
  Eye, 
  EyeOff, 
  Check,
  Inbox,
  Sparkles,
  Calendar,
  BarChart3,
  MailCheck,
  X,
} from 'lucide-react'
import { signup, loginWithGoogle } from '@/app/auth/actions'

const features = [
  { icon: Inbox, text: 'Unified inbox for all your thoughts' },
  { icon: Sparkles, text: 'AI auto-organization' },
  { icon: Calendar, text: 'Smart daily planning' },
  { icon: BarChart3, text: 'Weekly productivity insights' },
]

export default function SignUpPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const [showVerifyEmail, setShowVerifyEmail] = useState(false)

  const passwordStrength = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
  }
  const isPasswordStrong = Object.values(passwordStrength).every(Boolean)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isPasswordStrong) {
      setError('Please meet all password requirements')
      return
    }

    setLoading(true)
    setError('')

    const formData = new FormData()
    formData.append('email', email)
    formData.append('password', password)
    formData.append('fullName', fullName)
    
    const result = await signup(formData)
    
    // If we get here with no error, email confirmation is required
    // (if auto-confirm is disabled in Supabase)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else if (result?.success) {
      // Show verification email popup
      setShowVerifyEmail(true)
      setLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
    setGoogleLoading(true)
    try {
      await loginWithGoogle()
    } catch (err) {
      setError('Failed to sign up with Google')
      setGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Decorative */}
      <motion.div
        className="hidden lg:flex flex-1 relative bg-gradient-to-br from-azure-500 via-azure-600 to-violet-600 overflow-hidden"
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        {/* Background patterns */}
        <div className="absolute inset-0">
          <motion.div
            className="absolute top-1/3 right-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl"
            animate={{
              x: [0, -30, 0],
              y: [0, 20, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute bottom-1/3 left-1/4 w-64 h-64 bg-violet-400/20 rounded-full blur-3xl"
            animate={{
              x: [0, 20, 0],
              y: [0, -30, 0],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center w-full p-12 text-white">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            {/* Logo */}
            <div className="flex items-center gap-2 mb-12">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold">
                flow<span className="text-white/80">mind</span>
              </span>
            </div>

            <h2 className="text-4xl font-bold mb-4 leading-tight">
              Transform chaos
              <br />
              <span className="font-serif italic">into clarity</span>
            </h2>
            <p className="text-white/80 text-lg leading-relaxed mb-12 max-w-md">
              Join thousands of people who've finally organized their thoughts 
              and supercharged their productivity with AI.
            </p>

            {/* Features */}
            <div className="space-y-4">
              {features.map((feature, i) => (
                <motion.div
                  key={feature.text}
                  className="flex items-center gap-3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + i * 0.1 }}
                >
                  <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <feature.icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-white/90">{feature.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center px-8 py-12 bg-mist">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          {/* Mobile Logo */}
          <motion.div
            className="flex items-center gap-2 mb-8 lg:hidden"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-azure-500 to-azure-600 rounded-xl flex items-center justify-center shadow-lg shadow-azure-500/20">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900">
                flow<span className="text-azure-500">mind</span>
              </span>
            </Link>
          </motion.div>

          {/* Header */}
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Create your account
            </h1>
            <p className="text-slate-600">
              Start your journey to organized thinking
            </p>
          </motion.div>

          {/* Error Message */}
          {error && (
            <motion.div
              className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {error}
            </motion.div>
          )}

          {/* Google Sign Up */}
          <motion.button
            onClick={handleGoogleSignUp}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-700 font-medium hover:bg-slate-50 hover:border-slate-300 transition-all shadow-soft disabled:opacity-50"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            {googleLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            Sign up with Google
          </motion.button>

          {/* Divider */}
          <motion.div
            className="flex items-center gap-4 my-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-sm text-slate-400">or</span>
            <div className="flex-1 h-px bg-slate-200" />
          </motion.div>

          {/* Form */}
          <motion.form
            onSubmit={handleSubmit}
            className="space-y-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-azure-500/20 focus:border-azure-300 transition-all"
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-azure-500/20 focus:border-azure-300 transition-all"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-azure-500/20 focus:border-azure-300 transition-all"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>

              {/* Password requirements */}
              {password && (
                <motion.div
                  className="mt-3 space-y-2"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                >
                  {[
                    { check: passwordStrength.length, text: 'At least 8 characters' },
                    { check: passwordStrength.uppercase, text: 'One uppercase letter' },
                    { check: passwordStrength.number, text: 'One number' },
                  ].map((req, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center ${
                          req.check ? 'bg-green-500' : 'bg-slate-200'
                        }`}
                      >
                        {req.check && <Check className="w-2.5 h-2.5 text-white" />}
                      </div>
                      <span
                        className={`text-xs ${
                          req.check ? 'text-green-600' : 'text-slate-500'
                        }`}
                      >
                        {req.text}
                      </span>
                    </div>
                  ))}
                </motion.div>
              )}
            </div>

            {/* Terms */}
            <p className="text-xs text-slate-500">
              By creating an account, you agree to our{' '}
              <Link href="/terms" className="text-azure-600 hover:underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-azure-600 hover:underline">
                Privacy Policy
              </Link>
            </p>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-azure-500 text-white font-medium rounded-xl hover:bg-azure-600 transition-all shadow-lg shadow-azure-500/20 disabled:opacity-50 group"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Create account
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </motion.button>
          </motion.form>

          {/* Sign in link */}
          <motion.p
            className="mt-8 text-center text-slate-600"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            Already have an account?{' '}
            <Link
              href="/login"
              className="text-azure-600 font-medium hover:text-azure-700"
            >
              Sign in
            </Link>
          </motion.p>
        </motion.div>
      </div>

      {/* Email Verification Popup */}
      <AnimatePresence>
        {showVerifyEmail && (
          <>
            <motion.div
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowVerifyEmail(false)}
            />
            <motion.div
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-2xl z-50 overflow-hidden"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              <div className="p-8 text-center">
                {/* Close button */}
                <button
                  onClick={() => setShowVerifyEmail(false)}
                  className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>

                {/* Icon */}
                <motion.div
                  className="w-16 h-16 bg-gradient-to-br from-azure-100 to-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-6"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.1 }}
                >
                  <MailCheck className="w-8 h-8 text-azure-600" />
                </motion.div>

                {/* Content */}
                <motion.h3
                  className="text-xl font-bold text-slate-900 mb-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  Check your email
                </motion.h3>
                <motion.p
                  className="text-slate-600 mb-6"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  We&apos;ve sent a verification link to{' '}
                  <span className="font-medium text-slate-900">{email}</span>.
                  <br />
                  Click the link to activate your account.
                </motion.p>

                {/* Actions */}
                <motion.div
                  className="space-y-3"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Link
                    href="/login"
                    className="block w-full py-3 bg-azure-500 text-white font-medium rounded-xl hover:bg-azure-600 transition-colors"
                  >
                    Go to Login
                  </Link>
                  <p className="text-sm text-slate-500">
                    Didn&apos;t receive the email?{' '}
                    <button className="text-azure-600 hover:text-azure-700 font-medium">
                      Resend
                    </button>
                  </p>
                </motion.div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
