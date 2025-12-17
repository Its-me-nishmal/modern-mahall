import React, { useState } from 'react';
import { MessageCircle, Loader2, ShieldCheck, UserPlus, Home } from 'lucide-react';

interface AuthProps {
  onLogin: (phone: string, otp: string) => Promise<void>;
  onRegister: (phone: string, name: string, houseName: string, ward: string) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin, onRegister }) => {
  const [step, setStep] = useState<'phone' | 'otp' | 'register'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Registration state
  const [regData, setRegData] = useState({
    name: '',
    houseName: '',
    ward: 'Ward 1'
  });

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 10) {
      setError('Please enter a valid mobile number');
      return;
    }
    setLoading(true);
    setError('');
    setTimeout(() => {
      setLoading(false);
      setStep('otp');
    }, 1500);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await onLogin(phone, otp);
      // If login successful (no error thrown), App will redirect/update state
    } catch (err) {
      // In a real app we'd check error type to see if we should register
      // For now, assume generic failure means 'Try again' or 'Check logs'
      // If we wanted to support registration flow, we'd check for specific 'Not Found' error
      setError('Login failed. Please verify credentials.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegistration = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regData.name || !regData.houseName) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    // Simulate creation delay
    setTimeout(() => {
      onRegister(phone, regData.name, regData.houseName, regData.ward);
      setLoading(false);
    }, 1000);
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
                    autoFocus
                  />
                </div>
              </div>

              {error && <p className="text-red-500 text-xs text-center">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none transition-colors"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send OTP'}
              </button>

              <div className="mt-4 text-center">
                <p className="text-xs text-gray-400">Demo: Admin: 919999999999 | User: 919876543210</p>
              </div>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-xl font-semibold text-gray-800">Verify OTP</h2>
                <p className="text-gray-500 text-sm">Sent to +91 {phone}</p>
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
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify & Login'}
              </button>

              <button
                type="button"
                onClick={() => setStep('phone')}
                className="w-full text-center text-sm text-emerald-600 hover:text-emerald-500"
              >
                Change Number
              </button>
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

              {error && <p className="text-red-500 text-xs text-center">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center py-3 px-4 mt-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
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