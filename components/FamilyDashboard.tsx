import React, { useState, useMemo, useEffect } from 'react';
import {
  User, Plus, Trash2, Home, CreditCard, MessageSquare,
  Newspaper, Users, Send, Clock, AlertTriangle, CheckCircle, MapPin, Filter, PlayCircle, FileText, Phone, Edit2
} from 'lucide-react';
import { Family, FamilyMember, Status, Announcement, Payment, Feedback } from '../types';

interface FamilyDashboardProps {
  family: Family;
  announcements: Announcement[];
  payments: Payment[];
  currentUserName?: string; // Name of logged-in user
  isHead?: boolean; // Whether logged-in user is family head
  onAddMember: (member: Omit<FamilyMember, 'id' | 'status' | 'familyId'>) => void;
  onUpdateMember: (memberId: string, updates: Partial<FamilyMember>) => void;
  onDeleteRequest: (memberId: string) => void;
  onSendFeedback: (message: string) => void;
  onTabChange: (tab: 'home' | 'family' | 'payments' | 'support') => void;
}

const FamilyDashboard: React.FC<FamilyDashboardProps> = ({
  family, announcements, payments, currentUserName, isHead = false, onAddMember, onUpdateMember, onDeleteRequest, onSendFeedback, onTabChange
}) => {
  const [activeTab, setActiveTab] = useState<'home' | 'family' | 'payments' | 'support'>('home');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [newMember, setNewMember] = useState({
    name: '',
    relation: 'Son' as FamilyMember['relation'],
    age: 0,
    dob: '',
    bloodGroup: 'Unknown' as FamilyMember['bloodGroup'],
    education: '',
    job: '',
    maritalStatus: 'Single' as FamilyMember['maritalStatus'],
    email: '',
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
    // Calculate age from DOB if age is 0 or empty
    let calculatedAge = newMember.age;
    if (newMember.dob) {
      const birthDate = new Date(newMember.dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      calculatedAge = age;
    }

    onAddMember({
      ...newMember,
      age: calculatedAge
    });
    setIsModalOpen(false);
    setNewMember({ name: '', relation: 'Son', age: 0, dob: '', bloodGroup: 'Unknown', education: '', job: '', maritalStatus: 'Single', email: '', gender: 'Male', phone: '' });
  };

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (feedbackMsg.trim()) {
      onSendFeedback(feedbackMsg);
      setFeedbackMsg('');
      alert("Feedback sent successfully!");
    }
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;

    onUpdateMember(editingMember.id, {
      name: editingMember.name,
      age: editingMember.age,
      dob: editingMember.dob,
      bloodGroup: editingMember.bloodGroup,
      education: editingMember.education,
      job: editingMember.job,
      maritalStatus: editingMember.maritalStatus,
      email: editingMember.email,
      phone: editingMember.phone,
      relation: editingMember.relation,
      gender: editingMember.gender
    });

    setIsEditModalOpen(false);
    setEditingMember(null);
  };

  const getStatusBadge = (status: Status) => {
    switch (status) {
      case Status.APPROVED: return <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs font-medium flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Active</span>;
      case Status.PENDING: return <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-medium flex items-center gap-1"><Clock className="w-3 h-3" /> Pending</span>;
      default: return null;
    }
  };

  const getTimeAgo = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHours = Math.floor(diffMin / 60);
      const diffDays = Math.floor(diffHours / 24);
      const diffWeeks = Math.floor(diffDays / 7);
      const diffMonths = Math.floor(diffDays / 30);

      if (diffSec < 60) return `${diffSec}s ago`;
      if (diffMin < 60) return `${diffMin}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      if (diffWeeks < 4) return `${diffWeeks}w ago`;
      if (diffMonths < 12) return `${diffMonths}mo ago`;
      return date.toLocaleDateString();
    } catch {
      return dateStr;
    }
  };

  const filteredAnnouncements = useMemo(() => {
    // First filter by category
    let filtered = announcements.filter(a =>
      categoryFilter === 'All' || a.category === categoryFilter
    );

    // Then filter by targeting criteria
    filtered = filtered.filter(announcement => {
      const target = announcement.target;

      // If no targeting criteria, show to everyone
      if (!target) return true;

      // Check if all targeting fields are empty/undefined
      const hasNoTargeting = !target.wards && !target.gender &&
        !target.minAge && !target.maxAge &&
        !target.specificFamilyIds && !target.specificMemberIds &&
        !target.bloodGroup && !target.education && !target.job;

      if (hasNoTargeting) return true;

      // Get current user's member info (could be any member in the family)
      // For now, we'll use the head member's info as proxy
      // TODO: Pass actual logged-in member info as prop
      const currentMember = family.members.find(m => m.relation === 'Head') || family.members[0];

      // Check ward match
      if (target.wards && target.wards.length > 0) {
        if (!target.wards.includes(family.ward)) {
          return false;
        }
      }

      // Check gender match
      if (target.gender && target.gender !== 'All') {
        if (currentMember.gender !== target.gender) {
          return false;
        }
      }

      // Check age range
      if (target.minAge && currentMember.age < target.minAge) {
        return false;
      }
      if (target.maxAge && currentMember.age > target.maxAge) {
        return false;
      }

      // Check blood group match
      if (target.bloodGroup && currentMember.bloodGroup !== target.bloodGroup) {
        return false;
      }

      // Check education match (simple inclusion check)
      if (target.education && currentMember.education && !currentMember.education.toLowerCase().includes(target.education.toLowerCase())) {
        return false;
      }

      // Check job match (simple inclusion check)
      if (target.job && currentMember.job && !currentMember.job.toLowerCase().includes(target.job.toLowerCase())) {
        return false;
      }

      // Check specific family IDs
      if (target.specificFamilyIds && target.specificFamilyIds.length > 0) {
        if (!target.specificFamilyIds.includes(family.id)) {
          return false;
        }
      }

      // Check specific member IDs
      if (target.specificMemberIds && target.specificMemberIds.length > 0) {
        // 1. If currently logged in as Head, show all announcements for the family
        if (isHead) {
          // Check if any member of this family is targeted
          const familyMemberIds = family.members.map(m => m.id);
          const hasMatch = target.specificMemberIds.some(id => familyMemberIds.includes(id));
          return hasMatch;
        }

        // 2. If logged in as specific member, check if THEY are targeted
        // Find current member by name (since we don't have direct ID mapping in auth)
        const currentLoggedInMember = family.members.find(m => m.name === currentUserName);

        if (currentLoggedInMember) {
          // Show only if this specific member is targeted
          return target.specificMemberIds.includes(currentLoggedInMember.id);
        }

        // Fallback: If we can't identify the member, hide targeted announcements to be safe
        return false;
      }

      return true;
    });

    return filtered;
  }, [announcements, categoryFilter, family, isHead, currentUserName]);

  // ... (renderHome, renderFamily, renderPayments, renderSupport omitted for brevity, will be kept by tool) ...
  // Wait, I need to replace the whole chunk or be careful. The instruction says "Update newMember state and Add Member modal form...".
  // I will just replace the top state part and the handleSubmit, then I'll use another call for the modal JSX.
  // Actually, let's try to just replace the state definition and handleSubmit, and also getStatusBadge since it was in the range.
  // The tool works best with contiguous blocks.
  // Let me replace from line 30 to line 82 (handleSubmit end) to include state and handler.

  // Actually, I can replace the whole file content for the Modal part later.
  // Let's do state + handlers first.


  const getYouTubeId = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*$/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const renderHome = () => (
    <div className="space-y-6 animate-fadeIn pb-24">
      {/* Welcome & Status Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-2xl font-bold mb-1">Welcome, {currentUserName || family.headName}</h2>
          <p className="text-emerald-100 text-sm mb-4">
            {!isHead && currentUserName && (
              <span className="mr-2">Family of {family.headName} • </span>
            )}
            {family.address} • {family.ward}
          </p>

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
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Newspaper className="w-5 h-5 text-emerald-600" /> Community News
          </h3>
          <div className="relative">
            <Filter className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="pl-8 pr-4 py-1.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option>All</option>
              <option>Program</option>
              <option>Death</option>
              <option>Notice</option>
              <option>Emergency</option>
              <option>Data Collect</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          {filteredAnnouncements.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No announcements in this category.</p>
          ) : (
            filteredAnnouncements.map(item => {
              const youtubeId = getYouTubeId(item.videoUrl || '');
              const showImage = item.imageUrl && (!item.videoUrl || item.category === 'Data Collect');

              return (
                <div key={item.id} className={`bg-white rounded-xl overflow-hidden shadow-sm border-l-4 ${item.category === 'Death' ? 'border-gray-800' :
                  item.category === 'Emergency' ? 'border-red-500' :
                    item.category === 'Program' ? 'border-emerald-500' :
                      item.category === 'Data Collect' ? 'border-blue-500' :
                        'border-blue-400'
                  }`}>
                  {/* YouTube Embed or Image */}
                  {youtubeId && !showImage ? (
                    <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                      <iframe
                        className="absolute top-0 left-0 w-full h-full"
                        src={`https://www.youtube.com/embed/${youtubeId}`}
                        title={item.title}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    </div>
                  ) : showImage ? (
                    <img src={item.imageUrl} alt={item.title} className="w-full h-40 object-cover" />
                  ) : null}

                  <div className="p-5">
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded ${item.category === 'Death' ? 'bg-gray-100 text-gray-800' :
                        item.category === 'Emergency' ? 'bg-red-100 text-red-700' :
                          item.category === 'Program' ? 'bg-emerald-50 text-emerald-600' :
                            item.category === 'Data Collect' ? 'bg-blue-50 text-blue-700' :
                              'bg-blue-50 text-blue-600'
                        }`}>
                        {item.category}
                      </span>
                      <span className="text-xs text-gray-500">
                        {getTimeAgo(item.createdAt || item.updatedAt || item.date)}
                      </span>
                    </div>
                    <h4 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h4>

                    {/* Show which members this announcement is specifically for */}
                    {item.target?.specificMemberIds && item.target.specificMemberIds.length > 0 && (() => {
                      const targetedMembers = family.members.filter(m =>
                        item.target?.specificMemberIds?.includes(m.id)
                      );
                      if (targetedMembers.length > 0) {
                        return (
                          <div className="mb-2 flex flex-wrap items-center gap-1">
                            <span className="text-xs text-purple-600 font-semibold">For:</span>
                            {targetedMembers.map(member => (
                              <span
                                key={member.id}
                                className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full font-medium"
                              >
                                {member.name}
                              </span>
                            ))}
                          </div>
                        );
                      }
                      return null;
                    })()}

                    <p className="text-gray-600 text-sm leading-relaxed">{item.description}</p>
                    {item.location && (
                      <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        {item.location}
                      </div>
                    )}

                    {/* Action Buttons */}
                    {(item.formUrl || item.phoneNumber || (item.videoUrl && !youtubeId)) && (
                      <div className="flex gap-2 mt-4">
                        {/* Open Form Button for Data Collect */}
                        {item.category === 'Data Collect' && item.formUrl && (
                          <a
                            href={item.formUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                          >
                            <FileText className="w-4 h-4" />
                            Open Form
                          </a>
                        )}

                        {/* Call Button for Emergency */}
                        {item.category === 'Emergency' && item.phoneNumber && (
                          <a
                            href={`tel:${item.phoneNumber}`}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                          >
                            <Phone className="w-4 h-4" />
                            Call Now
                          </a>
                        )}

                        {/* Watch Video Button (for non-YouTube videos) */}
                        {item.videoUrl && !youtubeId && (
                          <a
                            href={item.videoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                          >
                            <PlayCircle className="w-4 h-4" />
                            Watch Video
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
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
        {isHead && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-emerald-600 text-white p-3 rounded-full shadow-lg hover:bg-emerald-700 transition-colors"
          >
            <Plus className="w-6 h-6" />
          </button>
        )}
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
              {isHead && (
                <>
                  <button
                    onClick={() => {
                      setEditingMember(member);
                      setIsEditModalOpen(true);
                    }}
                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
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
                </>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                  <input type="date" className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={newMember.dob}
                    onChange={e => {
                      const dob = e.target.value;
                      // Auto calculate age
                      let age = 0;
                      if (dob) {
                        const birthDate = new Date(dob);
                        const today = new Date();
                        age = today.getFullYear() - birthDate.getFullYear();
                        const m = today.getMonth() - birthDate.getMonth();
                        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                          age--;
                        }
                      }
                      setNewMember({ ...newMember, dob, age: age > 0 ? age : 0 });
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Age (Auto)</label>
                  <input required type="number" className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-gray-50"
                    value={newMember.age} onChange={e => setNewMember({ ...newMember, age: parseInt(e.target.value) })}
                  />
                </div>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group</label>
                  <select className="w-full border border-gray-300 rounded-lg p-2 text-sm outline-none"
                    value={newMember.bloodGroup || 'Unknown'} onChange={e => setNewMember({ ...newMember, bloodGroup: e.target.value as any })}
                  >
                    <option value="Unknown">Unknown</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Education</label>
                  <input type="text" className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="e.g. B.Tech"
                    value={newMember.education} onChange={e => setNewMember({ ...newMember, education: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Job</label>
                  <input type="text" className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="e.g. Engineer"
                    value={newMember.job} onChange={e => setNewMember({ ...newMember, job: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Marital Status</label>
                  <select className="w-full border border-gray-300 rounded-lg p-2 text-sm outline-none"
                    value={newMember.maritalStatus} onChange={e => setNewMember({ ...newMember, maritalStatus: e.target.value as any })}
                  >
                    <option>Single</option>
                    <option>Married</option>
                    <option>Divorced</option>
                    <option>Widowed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email (Optional)</label>
                  <input type="email" className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={newMember.email} onChange={e => setNewMember({ ...newMember, email: e.target.value })}
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

      {/* Edit Member Modal */}
      {isEditModalOpen && editingMember && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden animate-fadeIn max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="font-bold text-lg">Edit Member</h3>
              <button onClick={() => { setIsEditModalOpen(false); setEditingMember(null); }} className="text-gray-400 hover:text-gray-600">×</button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  required
                  type="text"
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  value={editingMember.name}
                  onChange={e => setEditingMember({ ...editingMember, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                  <input type="date" className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    value={editingMember.dob || ''}
                    onChange={e => {
                      const dob = e.target.value;
                      let age = editingMember.age;
                      if (dob) {
                        const birthDate = new Date(dob);
                        const today = new Date();
                        age = today.getFullYear() - birthDate.getFullYear();
                        const m = today.getMonth() - birthDate.getMonth();
                        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                          age--;
                        }
                      }
                      setEditingMember({ ...editingMember, dob, age: age > 0 ? age : 0 });
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Age (Auto)</label>
                  <input required type="number" className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50"
                    value={editingMember.age} onChange={e => setEditingMember({ ...editingMember, age: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Relation</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm outline-none"
                    value={editingMember.relation}
                    onChange={e => setEditingMember({ ...editingMember, relation: e.target.value as any })}
                  >
                    <option>Head</option>
                    <option>Wife</option>
                    <option>Son</option>
                    <option>Daughter</option>
                    <option>Father</option>
                    <option>Mother</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm outline-none"
                    value={editingMember.bloodGroup || 'Unknown'}
                    onChange={e => setEditingMember({ ...editingMember, bloodGroup: e.target.value as any })}
                  >
                    <option value="Unknown">Unknown</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Education</label>
                  <input type="text" className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g. B.Tech"
                    value={editingMember.education || ''} onChange={e => setEditingMember({ ...editingMember, education: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Job</label>
                  <input type="text" className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g. Engineer"
                    value={editingMember.job || ''} onChange={e => setEditingMember({ ...editingMember, job: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Marital Status</label>
                  <select className="w-full border border-gray-300 rounded-lg p-2 text-sm outline-none"
                    value={editingMember.maritalStatus || 'Single'} onChange={e => setEditingMember({ ...editingMember, maritalStatus: e.target.value as any })}
                  >
                    <option>Single</option>
                    <option>Married</option>
                    <option>Divorced</option>
                    <option>Widowed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    value={editingMember.email || ''} onChange={e => setEditingMember({ ...editingMember, email: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="edit-gender"
                      checked={editingMember.gender === 'Male'}
                      onChange={() => setEditingMember({ ...editingMember, gender: 'Male' })}
                    /> Male
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="edit-gender"
                      checked={editingMember.gender === 'Female'}
                      onChange={() => setEditingMember({ ...editingMember, gender: 'Female' })}
                    /> Female
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone (Optional)</label>
                <input
                  type="tel"
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  value={editingMember.phone || ''}
                  onChange={e => setEditingMember({ ...editingMember, phone: e.target.value })}
                />
              </div>
              <div className="pt-2">
                <button type="submit" className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700">
                  Save Changes
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