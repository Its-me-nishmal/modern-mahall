import React, { useState, useMemo, useEffect } from 'react';
import {
  Users, CheckCircle, DollarSign, Megaphone, Search, AlertCircle,
  Trash2, Plus, Inbox, Calendar, ArrowLeft, Filter, FileText, Send,
  Download, PieChart, MoreVertical, Edit2, Smartphone, Check, X
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart as RePie, Pie, Cell, Legend
} from 'recharts';
import {
  Family, Status, Log, Announcement, Payment, Feedback,
  AnnouncementCategory, TargetingCriteria, FamilyMember
} from '../types';

interface AdminDashboardProps {
  families: Family[];
  logs: Log[];
  announcements: Announcement[];
  payments: Payment[];
  feedbacks: Feedback[];
  onApproveFamily: (id: string) => void;
  onApproveMember: (familyId: string, memberId: string) => void;
  onRejectMember: (familyId: string, memberId: string) => void;
  onEditMember: (familyId: string, memberId: string, updatedData: Partial<FamilyMember>) => void;
  onCreateAnnouncement: (a: Announcement) => void;
  onDeleteAnnouncement: (id: string) => void;
  onBulkPaymentCreate: (amount: number, title: string, criteria: TargetingCriteria) => void;
  onCreatePayment: (payment: Payment) => void;
  onMarkPaymentPaid: (id: string) => void;
  onTabChange: (tab: 'overview' | 'families' | 'payments' | 'announcements' | 'reports' | 'inbox') => void;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  families, logs, announcements, payments, feedbacks,
  onApproveFamily, onApproveMember, onRejectMember, onEditMember,
  onCreateAnnouncement, onDeleteAnnouncement, onBulkPaymentCreate, onCreatePayment, onMarkPaymentPaid,
  onTabChange
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'families' | 'payments' | 'announcements' | 'reports' | 'inbox'>('overview');

  // Drill Down State
  const [selectedFamilyId, setSelectedFamilyId] = useState<string | null>(null);

  // Search State
  const [searchTerm, setSearchTerm] = useState('');

  // Bulk Wizard States
  const [isPayModalOpen, setPayModalOpen] = useState(false);
  const [isAnnounceModalOpen, setAnnounceModalOpen] = useState(false);

  // Single Payment Modal (Inside Family Detail)
  const [isSinglePayModalOpen, setSinglePayModalOpen] = useState(false);

  // Target Mode State
  const [targetMode, setTargetMode] = useState<'filter' | 'select'>('filter');
  const [selectedFamilyIds, setSelectedFamilyIds] = useState<string[]>([]);
  const [selectionSearch, setSelectionSearch] = useState('');

  // New Bulk Payment Form
  const [paymentForm, setPaymentForm] = useState({
    amount: 100,
    title: '',
    wards: [] as string[],
    gender: 'All' as 'All' | 'Male' | 'Female',
    minAge: '' as string,
    maxAge: '' as string
  });

  // Single Payment Form
  const [singlePaymentForm, setSinglePaymentForm] = useState({
    memberId: '',
    amount: 100,
    title: 'Fine/Fee'
  });

  // New Announcement Form
  const [announceForm, setAnnounceForm] = useState({
    title: '',
    desc: '',
    cat: 'Program' as AnnouncementCategory,
    imageUrl: '',
    wards: [] as string[],
    gender: 'All' as 'All' | 'Male' | 'Female',
    minAge: '' as string,
    maxAge: '' as string
  });

  // Edit Member Modal State
  const [isEditMemberModalOpen, setEditMemberModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);

  const selectedFamily = useMemo(() =>
    families.find(f => f.id === selectedFamilyId),
    [families, selectedFamilyId]);

  // Call onTabChange when tab changes
  useEffect(() => {
    onTabChange(activeTab);
  }, [activeTab, onTabChange]);

  const filteredFamilies = useMemo(() => {
    return families.filter(f =>
      f.headName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.ward.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [families, searchTerm]);

  // Filter logic for selection mode
  const familiesForSelection = useMemo(() => {
    return families.filter(f =>
      f.status === Status.APPROVED &&
      (f.headName.toLowerCase().includes(selectionSearch.toLowerCase()) || f.code.toLowerCase().includes(selectionSearch.toLowerCase()))
    );
  }, [families, selectionSearch]);

  // Stats Logic
  const stats = useMemo(() => {
    const totalFamilies = families.filter(f => f.status === Status.APPROVED).length;
    const pendingFamilies = families.filter(f => f.status === Status.PENDING).length;
    const totalMembers = families.reduce((acc, f) => acc + f.members.length, 0);
    const pendingMembers = families.reduce((acc, f) => acc + f.members.filter(m => m.status === Status.PENDING).length, 0);

    // Demographics
    const genderDist = [
      { name: 'Male', value: families.reduce((acc, f) => acc + f.members.filter(m => m.gender === 'Male').length, 0) },
      { name: 'Female', value: families.reduce((acc, f) => acc + f.members.filter(m => m.gender === 'Female').length, 0) }
    ];

    const ageDist = [
      { name: '0-18', value: families.reduce((acc, f) => acc + f.members.filter(m => m.age <= 18).length, 0) },
      { name: '19-35', value: families.reduce((acc, f) => acc + f.members.filter(m => m.age > 18 && m.age <= 35).length, 0) },
      { name: '36-60', value: families.reduce((acc, f) => acc + f.members.filter(m => m.age > 35 && m.age <= 60).length, 0) },
      { name: '60+', value: families.reduce((acc, f) => acc + f.members.filter(m => m.age > 60).length, 0) },
    ];

    return { totalFamilies, pendingFamilies, totalMembers, pendingMembers, genderDist, ageDist };
  }, [families]);

  // Handlers
  const handleBulkPaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onBulkPaymentCreate(paymentForm.amount, paymentForm.title, {
      wards: targetMode === 'filter' && paymentForm.wards.length > 0 ? paymentForm.wards : undefined,
      gender: targetMode === 'filter' ? paymentForm.gender : undefined,
      minAge: targetMode === 'filter' && paymentForm.minAge ? parseInt(paymentForm.minAge) : undefined,
      maxAge: targetMode === 'filter' && paymentForm.maxAge ? parseInt(paymentForm.maxAge) : undefined,
      specificFamilyIds: targetMode === 'select' ? selectedFamilyIds : undefined
    });
    setPayModalOpen(false);
    resetForms();
  };

  const handleSinglePaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFamily) return;

    const member = selectedFamily.members.find(m => m.id === singlePaymentForm.memberId);

    onCreatePayment({
      id: `p_${Date.now()}`,
      familyId: selectedFamily.id,
      memberId: singlePaymentForm.memberId,
      memberName: member?.name || 'Unknown',
      amount: singlePaymentForm.amount,
      title: singlePaymentForm.title,
      date: new Date().toISOString().split('T')[0],
      type: 'Fine',
      status: 'Pending'
    });
    setSinglePayModalOpen(false);
    setSinglePaymentForm({ memberId: '', amount: 100, title: 'Fine/Fee' });
  };

  const handleAnnounceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateAnnouncement({
      id: `a_${Date.now()}`,
      title: announceForm.title,
      description: announceForm.desc,
      category: announceForm.cat,
      date: new Date().toISOString().split('T')[0],
      imageUrl: announceForm.imageUrl,
      target: {
        wards: targetMode === 'filter' && announceForm.wards.length > 0 ? announceForm.wards : undefined,
        gender: targetMode === 'filter' ? announceForm.gender : undefined,
        minAge: targetMode === 'filter' && announceForm.minAge ? parseInt(announceForm.minAge) : undefined,
        maxAge: targetMode === 'filter' && announceForm.maxAge ? parseInt(announceForm.maxAge) : undefined,
        specificFamilyIds: targetMode === 'select' ? selectedFamilyIds : undefined
      },
      stats: { total: 0, sent: 0, delivered: 0, read: 0 }
    });
    setAnnounceModalOpen(false);
    resetForms();
  };

  const resetForms = () => {
    setPaymentForm({ amount: 100, title: '', wards: [], gender: 'All', minAge: '', maxAge: '' });
    setAnnounceForm({ title: '', desc: '', cat: 'Program', imageUrl: '', wards: [], gender: 'All', minAge: '', maxAge: '' });
    setSelectedFamilyIds([]);
    setTargetMode('filter');
    setSelectionSearch('');
  };

  // --- Sub-Components ---

  const renderOverview = () => (
    <div className="space-y-6 animate-fadeIn">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between mb-2">
            <span className="text-gray-500 text-xs font-bold uppercase">Total Families</span>
            <Users className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold">{stats.totalFamilies}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between mb-2">
            <span className="text-gray-500 text-xs font-bold uppercase">Members</span>
            <Users className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-2xl font-bold">{stats.totalMembers}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between mb-2">
            <span className="text-gray-500 text-xs font-bold uppercase">Pending Members</span>
            <AlertCircle className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-2xl font-bold">{stats.pendingMembers}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between mb-2">
            <span className="text-gray-500 text-xs font-bold uppercase">Revenue</span>
            <DollarSign className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold">₹{payments.reduce((acc, p) => p.status === 'Paid' ? acc + p.amount : acc, 0)}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-80">
          <h3 className="font-bold text-gray-700 mb-4">Demographics by Age</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.ageDist}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-80">
          <h3 className="font-bold text-gray-700 mb-4">Gender Distribution</h3>
          <ResponsiveContainer width="100%" height="100%">
            <RePie>
              <Pie
                data={stats.genderDist}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {stats.genderDist.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </RePie>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  const renderFamilyDetail = () => {
    if (!selectedFamily) return null;
    return (
      <div className="animate-slideIn">
        <button onClick={() => setSelectedFamilyId(null)} className="flex items-center gap-2 text-gray-500 hover:text-emerald-600 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to List
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div className="bg-gray-50 p-6 border-b border-gray-100 flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-gray-900">{selectedFamily.headName}</h2>
                <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded uppercase">{selectedFamily.status}</span>
              </div>
              <p className="text-gray-500">{selectedFamily.address} • {selectedFamily.ward} • Code: {selectedFamily.code}</p>
            </div>
            <div className="flex gap-2">
              <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700">
                <Smartphone className="w-4 h-4" /> WhatsApp
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50">
                <Edit2 className="w-4 h-4" /> Edit
              </button>
            </div>
          </div>

          <div className="p-6">
            <h3 className="font-bold text-gray-800 mb-4">Family Members</h3>
            <div className="space-y-2">
              {selectedFamily.members.map(m => (
                <div key={m.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${m.gender === 'Male' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'}`}>
                      {m.name[0]}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{m.name}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-gray-500">{m.relation} • {m.age} yrs</p>
                        {m.deleteRequested && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-medium">
                            Delete Requested
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {m.status === Status.PENDING && (
                      <div className="flex gap-1">
                        <button onClick={() => onApproveMember(selectedFamily.id, m.id)} className="p-1 text-emerald-600 bg-emerald-50 rounded"><CheckCircle className="w-4 h-4" /></button>
                        <button onClick={() => onRejectMember(selectedFamily.id, m.id)} className="p-1 text-red-600 bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    )}
                    {m.deleteRequested && (
                      <button
                        onClick={() => onRejectMember(selectedFamily.id, m.id)}
                        className="px-2 py-1 text-xs text-white bg-red-600 hover:bg-red-700 rounded font-medium"
                      >
                        Approve Delete
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setEditingMember(m);
                        setEditMemberModalOpen(true);
                      }}
                      className="p-1 text-blue-600 bg-blue-50 rounded hover:bg-blue-100"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-800">Financial History</h3>
            <button
              onClick={() => {
                setSinglePayModalOpen(true);
                setSinglePaymentForm(prev => ({ ...prev, memberId: selectedFamily.members[0]?.id || '' }));
              }}
              className="text-xs bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full font-bold border border-emerald-100 hover:bg-emerald-100"
            >
              + Add Member Fee
            </button>
          </div>
          <table className="w-full text-sm">
            <thead className="text-left text-gray-400 font-normal">
              <tr>
                <th className="pb-2">Date</th>
                <th className="pb-2">Member</th>
                <th className="pb-2">Title</th>
                <th className="pb-2">Amount</th>
                <th className="pb-2">Status</th>
                <th className="pb-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {payments.filter(p => p.familyId === selectedFamily.id).map(p => (
                <tr key={p.id} className="border-t border-gray-50">
                  <td className="py-3 text-gray-500">{p.date}</td>
                  <td className="py-3 font-medium text-emerald-700">{p.memberName || 'Family'}</td>
                  <td className="py-3 font-medium">{p.title || p.type}</td>
                  <td className="py-3">₹{p.amount}</td>
                  <td className="py-3"><span className={`px-2 py-0.5 rounded text-xs ${p.status === 'Paid' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>{p.status}</span></td>
                  <td className="py-3">
                    {p.status === 'Pending' && (
                      <button onClick={() => onMarkPaymentPaid(p.id)} className="text-xs text-blue-600 hover:underline">Mark Paid</button>
                    )}
                  </td>
                </tr>
              ))}
              {payments.filter(p => p.familyId === selectedFamily.id).length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-4 text-gray-400">No payment records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Single Fee Modal */}
        {isSinglePayModalOpen && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl w-full max-w-sm animate-slideUp p-6">
              <h3 className="font-bold text-lg mb-4">Add Individual Fee</h3>
              <form onSubmit={handleSinglePaySubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Select Member</label>
                  <select
                    className="w-full border rounded p-2 text-sm"
                    value={singlePaymentForm.memberId}
                    onChange={(e) => setSinglePaymentForm({ ...singlePaymentForm, memberId: e.target.value })}
                  >
                    {selectedFamily.members.map(m => (
                      <option key={m.id} value={m.id}>{m.name} ({m.relation})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <input type="text" className="w-full border rounded p-2 text-sm" value={singlePaymentForm.title} onChange={e => setSinglePaymentForm({ ...singlePaymentForm, title: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Amount</label>
                  <input type="number" className="w-full border rounded p-2 text-sm" value={singlePaymentForm.amount} onChange={e => setSinglePaymentForm({ ...singlePaymentForm, amount: parseInt(e.target.value) })} />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setSinglePayModalOpen(false)} className="px-3 py-1.5 text-gray-500 text-sm">Cancel</button>
                  <button type="submit" className="px-3 py-1.5 bg-emerald-600 text-white rounded text-sm font-medium">Add Fee</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Member Modal */}
        {isEditMemberModalOpen && editingMember && selectedFamily && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl w-full max-w-md animate-slideUp p-6">
              <h3 className="font-bold text-lg mb-4">Edit Member</h3>
              <form onSubmit={(e) => {
                e.preventDefault();
                onEditMember(selectedFamily.id, editingMember.id, {
                  name: editingMember.name,
                  age: editingMember.age,
                  phone: editingMember.phone,
                  relation: editingMember.relation,
                  gender: editingMember.gender
                });
                setEditMemberModalOpen(false);
                setEditingMember(null);
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input
                    type="text"
                    className="w-full border rounded p-2 text-sm"
                    value={editingMember.name}
                    onChange={e => setEditingMember({ ...editingMember, name: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Relation</label>
                    <select
                      className="w-full border rounded p-2 text-sm"
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
                    <label className="block text-sm font-medium mb-1">Age</label>
                    <input
                      type="number"
                      className="w-full border rounded p-2 text-sm"
                      value={editingMember.age}
                      onChange={e => setEditingMember({ ...editingMember, age: parseInt(e.target.value) })}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Gender</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name="gender"
                        checked={editingMember.gender === 'Male'}
                        onChange={() => setEditingMember({ ...editingMember, gender: 'Male' })}
                      /> Male
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name="gender"
                        checked={editingMember.gender === 'Female'}
                        onChange={() => setEditingMember({ ...editingMember, gender: 'Female' })}
                      /> Female
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone (Optional)</label>
                  <input
                    type="tel"
                    className="w-full border rounded p-2 text-sm"
                    value={editingMember.phone || ''}
                    onChange={e => setEditingMember({ ...editingMember, phone: e.target.value })}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditMemberModalOpen(false);
                      setEditingMember(null);
                    }}
                    className="px-3 py-1.5 text-gray-500 text-sm"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm font-medium">
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

  const renderFamilyList = () => (
    <div className="animate-fadeIn space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by Name, Ward, or Family Code..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {families.filter(f => f.status === Status.PENDING).length > 0 && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl mb-4">
          <h3 className="font-bold text-amber-800 mb-2 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" /> Pending Approvals
          </h3>
          <div className="space-y-2">
            {families.filter(f => f.status === Status.PENDING).map(f => (
              <div key={f.id} className="flex justify-between items-center bg-white p-3 rounded-lg border border-amber-100">
                <div>
                  <span className="font-bold">{f.headName}</span>
                  <span className="text-gray-500 text-sm mx-2">|</span>
                  <span className="text-sm text-gray-600">{f.ward}</span>
                </div>
                <button onClick={() => onApproveFamily(f.id)} className="px-3 py-1 bg-emerald-600 text-white text-xs rounded font-medium">Approve</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
            <tr>
              <th className="px-6 py-4">Code</th>
              <th className="px-6 py-4">Head of Family</th>
              <th className="px-6 py-4">Members</th>
              <th className="px-6 py-4">Ward</th>
              <th className="px-6 py-4">Balance</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredFamilies.map(f => (
              <tr
                key={f.id}
                onClick={() => setSelectedFamilyId(f.id)}
                className="hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <td className="px-6 py-4 font-mono text-gray-500">{f.code}</td>
                <td className="px-6 py-4 font-medium text-gray-900">{f.headName}</td>
                <td className="px-6 py-4 text-gray-600">{f.members.length}</td>
                <td className="px-6 py-4 text-gray-600">{f.ward}</td>
                <td className={`px-6 py-4 font-bold ${f.balance > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                  ₹{f.balance}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${f.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {f.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderPaymentTools = () => {
    const pendingPayments = payments.filter(p => p.status === 'Pending');

    return (
      <div className="animate-fadeIn space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Payment Management</h2>
            <p className="text-gray-500 text-sm">Approve payments, create demands & track revenue.</p>
          </div>
          <button onClick={() => { setPayModalOpen(true); resetForms(); }} className="bg-emerald-600 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-sm hover:bg-emerald-700">
            <Plus className="w-5 h-5" /> Create New Demand
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-xl border border-gray-200">
            <h4 className="text-gray-500 text-xs font-bold uppercase mb-1">Total Collected</h4>
            <p className="text-2xl font-bold text-gray-900">₹{payments.reduce((acc, p) => p.status === 'Paid' ? acc + p.amount : acc, 0)}</p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-200">
            <h4 className="text-gray-500 text-xs font-bold uppercase mb-1">Pending Dues</h4>
            <p className="text-2xl font-bold text-red-500">₹{families.reduce((acc, f) => acc + f.balance, 0)}</p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-200">
            <h4 className="text-gray-500 text-xs font-bold uppercase mb-1">Collection Rate</h4>
            <p className="text-2xl font-bold text-blue-500">
              {Math.round((payments.filter(p => p.status === 'Paid').length / payments.length) * 100) || 0}%
            </p>
          </div>
        </div>

        {/* Pending Approvals Section */}
        {pendingPayments.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl overflow-hidden">
            <div className="px-6 py-3 border-b border-amber-200 bg-amber-100/50 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <h3 className="font-bold text-amber-900">Pending Approvals</h3>
            </div>
            <div className="divide-y divide-amber-100">
              {pendingPayments.slice(0, 5).map(p => {
                const f = families.find(fam => fam.id === p.familyId);
                return (
                  <div key={p.id} className="px-6 py-4 flex justify-between items-center hover:bg-amber-100/30">
                    <div>
                      <p className="font-bold text-gray-800">{p.title || p.type}</p>
                      <p className="text-sm text-gray-600">
                        {p.memberName ? `${p.memberName} • ` : ''}{f?.headName} • {f?.ward}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-bold text-gray-900">₹{p.amount}</span>
                      <button
                        onClick={() => onMarkPaymentPaid(p.id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white rounded text-sm font-medium hover:bg-emerald-700"
                      >
                        <Check className="w-4 h-4" /> Approve
                      </button>
                    </div>
                  </div>
                );
              })}
              {pendingPayments.length > 5 && (
                <div className="px-6 py-2 text-center text-sm text-amber-800 font-medium cursor-pointer hover:bg-amber-100/50">
                  View {pendingPayments.length - 5} more pending...
                </div>
              )}
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 font-medium text-gray-700">Recent Transactions</div>
          {payments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10).map(p => {
            const f = families.find(fam => fam.id === p.familyId);
            return (
              <div key={p.id} className="px-6 py-4 border-b last:border-0 border-gray-100 flex justify-between items-center hover:bg-gray-50">
                <div>
                  <p className="font-bold text-gray-800">{p.title || p.type}</p>
                  <p className="text-sm text-gray-500">
                    {p.memberName ? `${p.memberName} • ` : ''}{f?.headName} • {f?.ward}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">₹{p.amount}</p>
                  <p className={`text-xs ${p.status === 'Paid' ? 'text-emerald-600' : 'text-red-500'}`}>{p.status}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    );
  };

  const renderAnnouncements = () => (
    <div className="animate-fadeIn space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Announcements</h2>
          <p className="text-gray-500 text-sm">Broadcast news to WhatsApp & App Feed</p>
        </div>
        <button onClick={() => { setAnnounceModalOpen(true); resetForms(); }} className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-emerald-700">
          <Megaphone className="w-4 h-4" /> New Broadcast
        </button>
      </div>

      <div className="grid gap-6">
        {announcements.map(a => (
          <div key={a.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="p-6 flex flex-col md:flex-row gap-6">
              {a.imageUrl && (
                <img src={a.imageUrl} alt="Announcement" className="w-full md:w-48 h-32 object-cover rounded-lg bg-gray-100" />
              )}
              <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                  <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${a.category === 'Death' ? 'bg-gray-800 text-white' : 'bg-blue-100 text-blue-700'}`}>
                    {a.category}
                  </span>
                  <span className="text-gray-400 text-sm">{a.date}</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{a.title}</h3>
                <p className="text-gray-600 text-sm mb-4">{a.description}</p>

                <div className="bg-gray-50 rounded-lg p-3 flex items-center justify-between text-sm">
                  <div className="flex gap-4">
                    <div>
                      <span className="block text-gray-500 text-xs">Targeted</span>
                      <span className="font-bold text-gray-900">{a.stats?.total || 0}</span>
                    </div>
                    <div>
                      <span className="block text-gray-500 text-xs">Delivered</span>
                      <span className="font-bold text-emerald-600">{a.stats?.delivered || 0}</span>
                    </div>
                    <div>
                      <span className="block text-gray-500 text-xs">Read</span>
                      <span className="font-bold text-blue-600">{a.stats?.read || 0}</span>
                    </div>
                  </div>
                  <button onClick={() => onDeleteAnnouncement(a.id)} className="text-gray-400 hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderReports = () => (
    <div className="animate-fadeIn space-y-6">
      <h2 className="text-xl font-bold text-gray-900">Reports Center</h2>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <FileText className="w-8 h-8 text-emerald-600 mb-4" />
          <h3 className="font-bold text-gray-800">Financial Statement</h3>
          <p className="text-gray-500 text-sm mb-4">Monthly collection details, pending dues list.</p>
          <button className="text-emerald-600 font-medium text-sm flex items-center gap-1 hover:underline">
            <Download className="w-4 h-4" /> Download PDF
          </button>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <Users className="w-8 h-8 text-blue-600 mb-4" />
          <h3 className="font-bold text-gray-800">Member Directory</h3>
          <p className="text-gray-500 text-sm mb-4">Full list of families, heads and contact details.</p>
          <button className="text-blue-600 font-medium text-sm flex items-center gap-1 hover:underline">
            <Download className="w-4 h-4" /> Download Excel
          </button>
        </div>
      </div>
    </div>
  );

  const TargetSelector = () => (
    <div className="bg-gray-50 p-4 rounded-lg space-y-4">
      <div className="flex rounded-lg bg-white border border-gray-200 p-1 mb-4">
        <button
          type="button"
          onClick={() => setTargetMode('filter')}
          className={`flex-1 py-1.5 text-sm font-medium rounded ${targetMode === 'filter' ? 'bg-emerald-100 text-emerald-700' : 'text-gray-600'}`}
        >
          By Filter (Group)
        </button>
        <button
          type="button"
          onClick={() => setTargetMode('select')}
          className={`flex-1 py-1.5 text-sm font-medium rounded ${targetMode === 'select' ? 'bg-emerald-100 text-emerald-700' : 'text-gray-600'}`}
        >
          Select Families
        </button>
      </div>

      {targetMode === 'filter' ? (
        <div className="space-y-4 animate-fadeIn">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Target Wards</label>
            <div className="flex flex-wrap gap-2">
              {['Ward 1', 'Ward 2', 'Ward 3', 'Ward 4'].map(w => (
                <button
                  key={w} type="button"
                  onClick={() => {
                    const currentWards = isPayModalOpen ? paymentForm.wards : announceForm.wards;
                    const setWards = isPayModalOpen ? (w: string[]) => setPaymentForm({ ...paymentForm, wards: w }) : (w: string[]) => setAnnounceForm({ ...announceForm, wards: w });
                    const newWards = currentWards.includes(w) ? currentWards.filter(i => i !== w) : [...currentWards, w];
                    setWards(newWards);
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-bold border ${(isPayModalOpen ? paymentForm.wards : announceForm.wards).includes(w)
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white text-gray-500 border-gray-200'
                    }`}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Gender</label>
              <select
                className="w-full text-sm border rounded p-2"
                value={isPayModalOpen ? paymentForm.gender : announceForm.gender}
                onChange={(e) => {
                  const val = e.target.value as any;
                  isPayModalOpen ? setPaymentForm({ ...paymentForm, gender: val }) : setAnnounceForm({ ...announceForm, gender: val });
                }}
              >
                <option value="All">All</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Min Age</label>
              <input
                type="number" className="w-full text-sm border rounded p-2" placeholder="0"
                value={isPayModalOpen ? paymentForm.minAge : announceForm.minAge}
                onChange={(e) => isPayModalOpen ? setPaymentForm({ ...paymentForm, minAge: e.target.value }) : setAnnounceForm({ ...announceForm, minAge: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Max Age</label>
              <input
                type="number" className="w-full text-sm border rounded p-2" placeholder="100"
                value={isPayModalOpen ? paymentForm.maxAge : announceForm.maxAge}
                onChange={(e) => isPayModalOpen ? setPaymentForm({ ...paymentForm, maxAge: e.target.value }) : setAnnounceForm({ ...announceForm, maxAge: e.target.value })}
              />
            </div>
          </div>
          {isPayModalOpen && (
            <p className="text-xs text-amber-600 mt-2 bg-amber-50 p-2 rounded">
              Note: A separate fee will be generated for <b>every member</b> matching these criteria.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-2 animate-fadeIn">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text" placeholder="Search family..."
              className="w-full pl-9 p-2 text-sm border rounded-lg"
              value={selectionSearch}
              onChange={(e) => setSelectionSearch(e.target.value)}
            />
          </div>
          <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg bg-white">
            {familiesForSelection.map(f => (
              <div key={f.id} className="flex items-center p-2 hover:bg-gray-50 border-b last:border-0 border-gray-50">
                <input
                  type="checkbox"
                  checked={selectedFamilyIds.includes(f.id)}
                  onChange={() => {
                    setSelectedFamilyIds(prev => prev.includes(f.id) ? prev.filter(id => id !== f.id) : [...prev, f.id])
                  }}
                  className="w-4 h-4 text-emerald-600 rounded mr-3"
                />
                <div className="text-sm">
                  <div className="font-medium">{f.headName}</div>
                  <div className="text-xs text-gray-500">{f.ward} • {f.code}</div>
                </div>
              </div>
            ))}
            {familiesForSelection.length === 0 && (
              <div className="p-4 text-center text-xs text-gray-400">No families found</div>
            )}
          </div>
          <div className="text-xs text-emerald-600 font-medium text-right">
            {selectedFamilyIds.length} Families Selected
          </div>
        </div>
      )}
    </div>
  );

  // --- Main Render ---
  return (
    <div className="pb-20 md:pb-0">
      <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Portal</h1>
          <p className="text-gray-500 text-sm">Managed by Committee</p>
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 md:pb-0">
          {[
            { id: 'overview', icon: PieChart, label: 'Stats' },
            { id: 'families', icon: Users, label: 'Families' },
            { id: 'payments', icon: DollarSign, label: 'Payments' },
            { id: 'announcements', icon: Megaphone, label: 'News' },
            { id: 'reports', icon: FileText, label: 'Reports' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id as any); setSelectedFamilyId(null); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${activeTab === tab.id ? 'bg-emerald-600 text-white shadow-md' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
            >
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* Dynamic Content */}
      <div className="min-h-[500px]">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'families' && (selectedFamily ? renderFamilyDetail() : renderFamilyList())}
        {activeTab === 'payments' && renderPaymentTools()}
        {activeTab === 'announcements' && renderAnnouncements()}
        {activeTab === 'reports' && renderReports()}
      </div>

      {/* Bulk Payment Wizard Modal */}
      {isPayModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden animate-slideUp">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold">Create Payment Demand</h3>
              <p className="text-sm text-gray-500">Generate fees for members matching criteria</p>
            </div>
            <form onSubmit={handleBulkPaySubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Amount (₹)</label>
                  <input type="number" required className="w-full border rounded-lg p-2" value={paymentForm.amount} onChange={e => setPaymentForm({ ...paymentForm, amount: parseInt(e.target.value) })} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <input type="text" placeholder="e.g. Annual Fee" required className="w-full border rounded-lg p-2" value={paymentForm.title} onChange={e => setPaymentForm({ ...paymentForm, title: e.target.value })} />
                </div>
              </div>

              <TargetSelector />

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-50">
                <button type="button" onClick={() => setPayModalOpen(false)} className="px-4 py-2 text-gray-500 hover:text-gray-700">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700">Generate Demand</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Announcement Wizard Modal */}
      {isAnnounceModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden animate-slideUp">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold">New Announcement</h3>
              <p className="text-sm text-gray-500">Send to App Feed & WhatsApp</p>
            </div>
            <form onSubmit={handleAnnounceSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input type="text" required className="w-full border rounded-lg p-2" value={announceForm.title} onChange={e => setAnnounceForm({ ...announceForm, title: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select className="w-full border rounded-lg p-2" value={announceForm.cat} onChange={e => setAnnounceForm({ ...announceForm, cat: e.target.value as any })}>
                    <option>Program</option>
                    <option>Death</option>
                    <option>Notice</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Image URL (Optional)</label>
                  <input type="text" className="w-full border rounded-lg p-2" placeholder="https://..." value={announceForm.imageUrl} onChange={e => setAnnounceForm({ ...announceForm, imageUrl: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea required className="w-full border rounded-lg p-2 h-20 resize-none" value={announceForm.desc} onChange={e => setAnnounceForm({ ...announceForm, desc: e.target.value })}></textarea>
              </div>

              <TargetSelector />

              <div className="border-t border-gray-100 pt-4">
                <label className="flex items-center gap-2 mb-2 font-medium text-sm text-gray-700">
                  <input type="checkbox" defaultChecked className="w-4 h-4 text-emerald-600 rounded" />
                  Send via WhatsApp
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setAnnounceModalOpen(false)} className="px-4 py-2 text-gray-500 hover:text-gray-700">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 flex items-center gap-2">
                  <Send className="w-4 h-4" /> Broadcast
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;