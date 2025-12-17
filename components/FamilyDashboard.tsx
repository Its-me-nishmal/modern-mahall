import React, { useState, useMemo, useEffect } from 'react';
import {
  User, Plus, Trash2, Home, CreditCard, MessageSquare,
  Newspaper, Users, Send, Clock, AlertTriangle, CheckCircle
} from 'lucide-react';
import { Family, FamilyMember, Status, Announcement, Payment, Feedback } from '../types';

interface FamilyDashboardProps {
  family: Family;
  announcements: Announcement[];
  payments: Payment[];
  onAddMember: (member: Omit<FamilyMember, 'id' | 'status' | 'familyId'>) => void;
  onDeleteRequest: (memberId: string) => void;
  onSendFeedback: (message: string) => void;
  onTabChange: (tab: 'home' | 'family' | 'payments' | 'support') => void;
}

const FamilyDashboard: React.FC<FamilyDashboardProps> = ({
  family, announcements, payments, onAddMember, onDeleteRequest, onSendFeedback, onTabChange
}) => {
  const [activeTab, setActiveTab] = useState<'home' | 'family' | 'payments' | 'support'>('home');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [newMember, setNewMember] = useState({
    name: '',
    relation: 'Son' as FamilyMember['relation'],
    age: 0,
    gender: 'Male' as 'Male' | 'Female',
    phone: ''
  });

  // Calculate actual balance from pending payments
  const actualBalance = useMemo(() => {
    const familyPayments = payments.filter(p => p.familyId === family.id);
    const pendingAmount = familyPayments
      .filter(p => p.status === 'Pending')
      .reduce((sum, p) => sum + p.amount, 0);
    return pendingAmount;
  }, [payments, family.id]);

  // Call onTabChange when tab changes
  useEffect(() => {
    onTabChange(activeTab);
  }, [activeTab, onTabChange]);

  const handleSubmitMember = (e: React.FormEvent) => {
    e.preventDefault();
    onAddMember(newMember);
    setIsModalOpen(false);
    setNewMember({ name: '', relation: 'Son', age: 0, gender: 'Male', phone: '' });
  };

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (feedbackMsg.trim()) {
      onSendFeedback(feedbackMsg);
      setFeedbackMsg('');
      alert("Feedback sent successfully!");
    }
  };

  const getStatusBadge = (status: Status) => {
    switch (status) {
      case Status.APPROVED: return <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs font-medium flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Active</span>;
      case Status.PENDING: return <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-medium flex items-center gap-1"><Clock className="w-3 h-3" /> Pending</span>;
      default: return null;
    }
  };

  const renderHome = () => (
    <div className="space-y-6 animate-fadeIn pb-24">
      {/* Welcome & Status Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-2xl font-bold mb-1">Welcome, {family.headName}</h2>
          <p className="text-emerald-100 text-sm mb-4">{family.address} • {family.ward}</p>

          <div className="flex gap-3">
            <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-lg text-xs font-semibold uppercase">
              Status: {family.status}
            </div>
            {actualBalance > 0 && (
              <div className="bg-red-500/90 backdrop-blur-sm px-3 py-1 rounded-lg text-xs font-semibold uppercase flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Due: ₹{actualBalance}
              </div>
            )}
          </div>
        </div>
        <div className="absolute right-0 bottom-0 opacity-10">
          <Home className="w-32 h-32 transform translate-x-4 translate-y-4" />
        </div>
      </div>

      {/* Announcements Feed */}
      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Newspaper className="w-5 h-5 text-emerald-600" /> Community News
        </h3>

        <div className="space-y-4">
          {announcements.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No new announcements.</p>
          ) : (
            announcements.map(item => (
              <div key={item.id} className={`bg-white rounded-xl overflow-hidden shadow-sm border-l-4 ${item.category === 'Death' ? 'border-gray-800' :
                item.category === 'Program' ? 'border-emerald-500' : 'border-blue-400'
                }`}>
                {item.imageUrl && (
                  <img src={item.imageUrl} alt={item.title} className="w-full h-40 object-cover" />
                )}
                <div className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded ${item.category === 'Death' ? 'bg-gray-100 text-gray-800' :
                      item.category === 'Program' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                      }`}>
                      {item.category}
                    </span>
                    <span className="text-xs text-gray-400">{item.date}</span>
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">{item.description}</p>
                  {item.location && (
                    <div className="mt-3 flex items-center gap-1 text-xs text-gray-500 font-medium">
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                      {item.location}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  const renderFamily = () => (
    <div className="animate-fadeIn pb-24">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Family Members</h2>
          <p className="text-gray-500 text-sm">Manage your household details</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-emerald-600 text-white p-3 rounded-full shadow-lg hover:bg-emerald-700 transition-colors"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      <div className="space-y-3">
        {family.members.map((member) => (
          <div key={member.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between relative overflow-hidden">
            {member.relation === 'Head' && (
              <div className="absolute top-0 right-0 bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded-bl-lg">
                HEAD
              </div>
            )}

            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold ${member.gender === 'Male' ? 'bg-blue-50 text-blue-600' : 'bg-pink-50 text-pink-600'
                }`}>
                {member.name[0]}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-lg">{member.name}</h3>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500">
                  <span className="text-gray-800 font-medium">{member.relation}</span>
                  <span>{member.age} yrs</span>
                  {getStatusBadge(member.status)}
                  {member.deleteRequested && (
                    <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-medium flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Delete Requested
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              {member.relation !== 'Head' && (
                <button
                  onClick={() => onDeleteRequest(member.id)}
                  disabled={member.deleteRequested}
                  className={`p-2 transition-colors ${member.deleteRequested
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-300 hover:text-red-500'
                    }`}
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPayments = () => (
    <div className="animate-fadeIn pb-24">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Payments & Dues</h2>

      {/* Balance Card */}
      <div className="bg-gray-900 rounded-xl p-6 text-white shadow-xl mb-8">
        <div className="flex justify-between items-center mb-4">
          <span className="text-gray-400 text-sm font-medium uppercase tracking-wide">Total Balance Due</span>
          <CreditCard className="w-6 h-6 text-emerald-400" />
        </div>
        <div className="text-4xl font-bold mb-2">₹ {actualBalance}</div>
        <p className="text-gray-400 text-sm">
          {actualBalance > 0 ? "Please clear your dues by month end." : "You have no pending dues."}
        </p>
      </div>

      <h3 className="font-semibold text-gray-800 mb-4">Transaction History</h3>
      <div className="space-y-3">
        {payments.filter(p => p.familyId === family.id).length === 0 ? (
          <p className="text-gray-400 text-center text-sm">No payment history available.</p>
        ) : (
          payments.filter(p => p.familyId === family.id).map(payment => (
            <div key={payment.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center">
              <div>
                <p className="font-bold text-gray-800">{payment.title || payment.type}</p>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-emerald-600 font-medium">{payment.memberName || 'Family'}</p>
                  <span className="text-gray-300 text-xs">•</span>
                  <p className="text-xs text-gray-400">{payment.date}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-emerald-600">+ ₹{payment.amount}</p>
                <span className={`text-xs px-2 py-0.5 rounded ${payment.status === 'Paid' ? 'text-gray-400 bg-gray-100' : 'text-red-500 bg-red-50'}`}>
                  {payment.status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderSupport = () => (
    <div className="animate-fadeIn pb-24">
      <h2 className="text-xl font-bold text-gray-900 mb-2">Support & Feedback</h2>
      <p className="text-gray-500 mb-6">Contact the Mahall committee directly.</p>

      <form onSubmit={handleFeedbackSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-2">Your Message</label>
        <textarea
          className="w-full h-32 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none resize-none text-sm mb-4"
          placeholder="Describe your issue or suggestion..."
          value={feedbackMsg}
          onChange={(e) => setFeedbackMsg(e.target.value)}
          required
        ></textarea>
        <button type="submit" className="w-full bg-emerald-600 text-white py-3 rounded-lg font-medium hover:bg-emerald-700 flex items-center justify-center gap-2">
          <Send className="w-4 h-4" /> Send Message
        </button>
      </form>

      <div className="mt-8 text-center">
        <p className="text-sm text-gray-400">Or contact directly via WhatsApp</p>
        <button className="mt-2 px-4 py-2 bg-green-50 text-green-600 rounded-full text-sm font-bold border border-green-200">
          Chat with Admin
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-xl mx-auto">
      {/* Content Area */}
      <div className="pt-2">
        {activeTab === 'home' && renderHome()}
        {activeTab === 'family' && renderFamily()}
        {activeTab === 'payments' && renderPayments()}
        {activeTab === 'support' && renderSupport()}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-2 pb-safe flex justify-between items-center z-50">
        <button
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${activeTab === 'home' ? 'text-emerald-600' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <Newspaper className="w-6 h-6" />
          <span className="text-[10px] font-medium">Feed</span>
        </button>
        <button
          onClick={() => setActiveTab('family')}
          className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${activeTab === 'family' ? 'text-emerald-600' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <Users className="w-6 h-6" />
          <span className="text-[10px] font-medium">Family</span>
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${activeTab === 'payments' ? 'text-emerald-600' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <CreditCard className="w-6 h-6" />
          <span className="text-[10px] font-medium">Pay</span>
        </button>
        <button
          onClick={() => setActiveTab('support')}
          className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${activeTab === 'support' ? 'text-emerald-600' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <MessageSquare className="w-6 h-6" />
          <span className="text-[10px] font-medium">Help</span>
        </button>
      </div>

      {/* Add Member Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden animate-fadeIn">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-lg">Add Family Member</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">×</button>
            </div>
            <form onSubmit={handleSubmitMember} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input required type="text" className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={newMember.name} onChange={e => setNewMember({ ...newMember, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Relation</label>
                  <select className="w-full border border-gray-300 rounded-lg p-2 text-sm outline-none"
                    value={newMember.relation} onChange={e => setNewMember({ ...newMember, relation: e.target.value as any })}
                  >
                    <option>Wife</option>
                    <option>Son</option>
                    <option>Daughter</option>
                    <option>Father</option>
                    <option>Mother</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                  <input required type="number" className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={newMember.age} onChange={e => setNewMember({ ...newMember, age: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="radio" name="gender" checked={newMember.gender === 'Male'} onChange={() => setNewMember({ ...newMember, gender: 'Male' })} /> Male
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="radio" name="gender" checked={newMember.gender === 'Female'} onChange={() => setNewMember({ ...newMember, gender: 'Female' })} /> Female
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone (Optional)</label>
                <input type="tel" className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={newMember.phone} onChange={e => setNewMember({ ...newMember, phone: e.target.value })}
                />
              </div>
              <div className="pt-2">
                <p className="text-xs text-amber-600 mb-2 bg-amber-50 p-2 rounded">
                  Note: New members will be marked as "Pending" until Admin approves.
                </p>
                <button type="submit" className="w-full bg-emerald-600 text-white py-2.5 rounded-lg font-medium hover:bg-emerald-700">
                  Submit Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FamilyDashboard;