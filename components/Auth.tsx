import React, { useState, useEffect } from 'react';
import { MessageCircle, Loader2, ShieldCheck, UserPlus, Home, Clock } from 'lucide-react';

const API_BASE_URL = 'http://localhost:3001/api';

interface AuthProps {
  onLogin: (token: string, user: any) => Promise<void>;
  onRegister: (phone: string, name: string, houseName: string, ward: string, age: number, gender: 'Male' | 'Female') => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin, onRegister }) => {
  const [step, setStep] = useState<'phone' | 'otp' | 'register'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpExpiry, setOtpExpiry] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);

  // Registration state
  const [regData, setRegData] = useState({
    name: '',
    houseName: '',
    ward: 'Ward 1',
    age: 30,
    gender: 'Male' as 'Male' | 'Female'
  });

  // Countdown timer for OTP expiry
  useEffect(() => {
    if (otpExpiry > 0) {
      const timer = setInterval(() => {
        setOtpExpiry(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [otpExpiry]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 10) {
      setError('Please enter a valid mobile number');
      return;
    }
    setLoading(true);
    setError('');

    try {
      // Determine if admin or user based on phone
      const isAdminUser = phone === '9999999999';
      setIsAdmin(isAdminUser);

      const endpoint = isAdminUser
        ? `${API_BASE_URL}/auth/admin/send-otp`
        : `${API_BASE_URL}/auth/send-otp`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: phone })
      });

      const data = await response.json();

      if (response.ok) {
        setOtpSent(true);
        setStep('otp');
        setOtpExpiry(data.expiresIn * 60); // Convert minutes to seconds
        // Show success message
        console.log(`✓ OTP sent to ${phone}`);
      } else {
        setError(data.message || 'Failed to send OTP');
      }
    } catch (err) {
      setError('Network error. Please check if backend is running.');
      console.error('Send OTP error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const endpoint = isAdmin
        ? `${API_BASE_URL}/auth/admin/verify-otp`
        : `${API_BASE_URL}/auth/verify-otp`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: phone, otp })
      });

      const data = await response.json();

      if (response.ok) {
        if (data.newUser) {
          // New user needs to register
          setStep('register');
        } else if (data.token && data.user) {
          // Existing user - pass token and user to App
          await onLogin(data.token, data.user);
        } else {
          setError('Login response missing required data');
        }
      } else {
        setError(data.message || 'Invalid or expired OTP');
      }
    } catch (err) {
      setError('Network error during verification');
      console.error('Verify OTP error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setOtp('');
    setError('');
    await handleSendOtp({ preventDefault: () => { } } as React.FormEvent);
  };

  const handleRegistration = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regData.name || !regData.houseName) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    // Simulate creation delay
    // Simulate creation delay
    setTimeout(() => {
      onRegister(phone, regData.name, regData.houseName, regData.ward, regData.age, regData.gender);
      setLoading(false);
    }, 1000);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-emerald-600 p-6 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Modern Mahall</h1>
          <p className="text-emerald-100 text-sm mt-1">Community Management System</p>
        </div>

        <div className="p-8">
          {step === 'phone' && (
            <form onSubmit={handleSendOtp} className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-xl font-semibold text-gray-800">Welcome</h2>
                <p className="text-gray-500 text-sm">Enter your WhatsApp number to login</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Mobile Number</label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                    +91
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    className="flex-1 block w-full rounded-none rounded-r-lg border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2.5 border outline-none"
                    placeholder="98765 43210"
                    maxLength={10}
                    autoFocus
                  />
                </div>
              </div>

              {error && <p className="text-red-500 text-xs text-center">{error}</p>}

              <button
                type="submit"
                disabled={loading || phone.length < 10}
                className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send OTP'}
              </button>

              <div className="mt-4 text-center">
                <p className="text-xs text-gray-400">Demo: Admin: 919999999999 | User: 919876543210</p>
                <p className="text-xs text-emerald-600 mt-1">Check backend console for OTP in development mode</p>
              </div>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-xl font-semibold text-gray-800">Verify OTP</h2>
                <p className="text-gray-500 text-sm">Sent to +91 {phone}</p>
                {otpExpiry > 0 && (
                  <div className="flex items-center justify-center gap-2 text-emerald-600">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm font-medium">{formatTime(otpExpiry)}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="block w-full text-center tracking-[1em] text-2xl font-bold rounded-lg border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 p-3 border outline-none"
                  placeholder="------"
                  maxLength={6}
                  autoFocus
                />
                <p className="text-xs text-center text-gray-500">
                  Check your backend console for the OTP code
                </p>
              </div>

              {error && <p className="text-red-500 text-xs text-center">{error}</p>}

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify & Login'}
              </button>

              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={otpExpiry > 240} // Disable resend if more than 4 minutes left
                  className="w-full text-center text-sm text-emerald-600 hover:text-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Resend OTP
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStep('phone');
                    setOtp('');
                    setError('');
                    setOtpExpiry(0);
                  }}
                  className="w-full text-center text-sm text-gray-500 hover:text-gray-700"
                >
                  Change Number
                </button>
              </div>
            </form>
          )}

          {step === 'register' && (
            <form onSubmit={handleRegistration} className="space-y-4 animate-fadeIn">
              <div className="text-center space-y-1 mb-4">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2">
                  <UserPlus className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-semibold text-gray-800">Family Registration</h2>
                <p className="text-gray-500 text-xs">Complete your house details to join.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your Full Name (Head)</label>
                <input
                  type="text"
                  required
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={regData.name}
                  onChange={(e) => setRegData({ ...regData, name: e.target.value })}
                  placeholder="e.g. Muhammed Ali"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">House Name / Address</label>
                <div className="flex gap-2 items-center">
                  <Home className="w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    required
                    className="flex-1 border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={regData.houseName}
                    onChange={(e) => setRegData({ ...regData, houseName: e.target.value })}
                    placeholder="e.g. Green Villa"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ward Number</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={regData.ward}
                    onChange={(e) => setRegData({ ...regData, ward: e.target.value })}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                      <option key={n} value={`Ward ${n}`}>Ward {n}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                  <input
                    type="number"
                    min="18"
                    max="100"
                    required
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={regData.age}
                    onChange={(e) => setRegData({ ...regData, age: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      checked={regData.gender === 'Male'}
                      onChange={() => setRegData({ ...regData, gender: 'Male' })}
                      className="w-4 h-4 text-emerald-600"
                    />
                    <span className="text-sm text-gray-700">Male</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      checked={regData.gender === 'Female'}
                      onChange={() => setRegData({ ...regData, gender: 'Female' })}
                      className="w-4 h-4 text-emerald-600"
                    />
                    <span className="text-sm text-gray-700">Female</span>
                  </label>
                </div>
              </div>

              {error && <p className="text-red-500 text-xs text-center">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center py-3 px-4 mt-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Register Family'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;