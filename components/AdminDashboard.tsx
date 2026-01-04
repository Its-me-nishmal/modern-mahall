import React, { useState, useMemo, useEffect } from 'react';
import {
  Users, CheckCircle, DollarSign, Megaphone, Search, AlertCircle,
  Trash2, Plus, Inbox, Calendar, ArrowLeft, Filter, FileText, Send,
  Download, PieChart, MoreVertical, Edit2, Smartphone, Check, X
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart as RePie, Pie, Cell, Legend, LineChart, Line
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
  onUpdateFamily: (familyId: string, updatedData: Partial<Family>) => void;
  onCreateAnnouncement: (a: Announcement) => void;
  onDeleteAnnouncement: (id: string) => void;
  onBulkPaymentCreate: (amount: number, title: string, criteria: TargetingCriteria) => void;
  onCreatePayment: (payment: Payment) => void;
  onMarkPaymentPaid: (id: string) => void;
  onDeletePayment: (id: string) => void;
  onTabChange: (tab: 'overview' | 'families' | 'members' | 'payments' | 'announcements' | 'reports' | 'inbox') => void;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  families, logs, announcements, payments, feedbacks,
  onApproveFamily, onApproveMember, onRejectMember, onEditMember, onUpdateFamily,
  onCreateAnnouncement, onDeleteAnnouncement, onBulkPaymentCreate, onCreatePayment, onMarkPaymentPaid, onDeletePayment,
  onTabChange
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'families' | 'members' | 'payments' | 'announcements' | 'reports' | 'inbox'>('overview');

  // Pagination State
  const [familyPage, setFamilyPage] = useState(1);
  const [familyRowsPerPage, setFamilyRowsPerPage] = useState(25);
  const [memberPage, setMemberPage] = useState(1);
  const [memberRowsPerPage, setMemberRowsPerPage] = useState(25);

  // Advanced Filter State
  const [advancedFilters, setAdvancedFilters] = useState({
    bloodGroup: 'All',
    education: '',
    job: '',
    minAge: '',
    maxAge: '',
    gender: 'All',
    maritalStatus: 'All',
    rationCardType: 'All'
  });

  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  // Drill Down State
  const [selectedFamilyId, setSelectedFamilyId] = useState<string | null>(null);

  // Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentSearch, setPaymentSearch] = useState('');

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
    videoUrl: '',
    formUrl: '',
    location: '',
    phoneNumber: '',
    wards: [] as string[],
    gender: 'All' as 'All' | 'Male' | 'Female',
    minAge: '' as string,
    maxAge: '' as string
  });

  // Edit Member Modal State
  const [isEditMemberModalOpen, setEditMemberModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);

  // Edit FAMILY Modal State
  const [isEditFamilyModalOpen, setEditFamilyModalOpen] = useState(false);
  const [editingFamily, setEditingFamily] = useState<Family | null>(null);

  // Analytics Time Range
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'year'>('week');

  // Family/Member Selection State
  const [expandedFamilies, setExpandedFamilies] = useState<string[]>([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

  const selectedFamily = useMemo(() =>
    families.find(f => f.id === selectedFamilyId),
    [families, selectedFamilyId]);

  // Call onTabChange when tab changes
  useEffect(() => {
    onTabChange(activeTab);
  }, [activeTab, onTabChange]);

  const filteredFamilies = useMemo(() => {
    return families.filter(f => {
      // Basic Search
      const matchesSearch =
        f.headName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.ward.toLowerCase().includes(searchTerm.toLowerCase()) ||
        // Also search in member names
        f.members.some(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchesSearch) return false;

      // Advanced Filters
      const { bloodGroup, education, job, minAge, maxAge, gender, maritalStatus, rationCardType } = advancedFilters;

      // Filter by Ration Card (Family Level)
      if (rationCardType !== 'All' && f.rationCardType !== rationCardType) return false;

      // Filter by Member Attributes
      const hasMatchingMember = f.members.some(m => {
        if (bloodGroup !== 'All' && m.bloodGroup !== bloodGroup) return false;
        if (gender !== 'All' && m.gender !== gender) return false;
        if (maritalStatus !== 'All' && m.maritalStatus !== maritalStatus) return false;
        if (education && (!m.education || !m.education.toLowerCase().includes(education.toLowerCase()))) return false;
        if (job && (!m.job || !m.job.toLowerCase().includes(job.toLowerCase()))) return false;
        if (minAge && m.age < parseInt(minAge)) return false;
        if (maxAge && m.age > parseInt(maxAge)) return false;
        return true;
      });

      // Special case: if no member-level filters are set, we don't need to check members
      const hasMemberFilters = bloodGroup !== 'All' || education || job || minAge || maxAge || gender !== 'All' || maritalStatus !== 'All';

      return hasMemberFilters ? hasMatchingMember : true;
    });
  }, [families, searchTerm, advancedFilters]);

  // Filter logic for selection mode
  const familiesForSelection = useMemo(() => {
    return families.filter(f =>
      f.status === Status.APPROVED &&
      (f.headName.toLowerCase().includes(selectionSearch.toLowerCase()) || f.code.toLowerCase().includes(selectionSearch.toLowerCase()))
    );
  }, [families, selectionSearch]);

  // Flattened Members List for Members Tab
  const filteredMembers = useMemo(() => {
    let members = families.flatMap(f => f.members.map(m => ({
      ...m,
      familyHead: f.headName,
      familyCode: f.code,
      ward: f.ward,
      address: f.address,
      rationCardType: f.rationCardType
    })));

    // Apply Search
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      members = members.filter(m =>
        m.name.toLowerCase().includes(lowerSearch) ||
        m.familyHead.toLowerCase().includes(lowerSearch) ||
        m.familyCode.toLowerCase().includes(lowerSearch) ||
        (m.phone && m.phone.includes(lowerSearch))
      );
    }

    // Apply Advanced Filters
    const { bloodGroup, education, job, minAge, maxAge, gender, maritalStatus, rationCardType } = advancedFilters;

    if (gender !== 'All') members = members.filter(m => m.gender === gender);
    if (bloodGroup !== 'All') members = members.filter(m => m.bloodGroup === bloodGroup);
    if (maritalStatus !== 'All') members = members.filter(m => m.maritalStatus === maritalStatus);
    if (rationCardType !== 'All') members = members.filter(m => m.rationCardType === rationCardType);
    if (education) members = members.filter(m => m.education?.toLowerCase().includes(education.toLowerCase()));
    if (job) members = members.filter(m => m.job?.toLowerCase().includes(job.toLowerCase()));
    if (minAge) members = members.filter(m => m.age >= parseInt(minAge));
    if (maxAge) members = members.filter(m => m.age <= parseInt(maxAge));

    return members;
  }, [families, searchTerm, advancedFilters]);

  // Helpers for Export
  const downloadCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row =>
      Object.values(row).map(val => `"${val !== undefined && val !== null ? val : ''}"`).join(',')
    ).join('\r\n');
    const csvContent = "data:text/csv;charset=utf-8," + headers + "\r\n" + rows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


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

    // New Stats: Blood Group
    const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const bloodGroupDist = bloodGroups.map(bg => ({
      name: bg,
      value: families.reduce((acc, f) => acc + f.members.filter(m => m.bloodGroup === bg).length, 0)
    })).filter(d => d.value > 0);

    // New Stats: Job (Top 5)
    const jobCounts: Record<string, number> = {};
    families.forEach(f => f.members.forEach(m => {
      if (m.job) {
        const job = m.job.trim().toLowerCase(); // Normalize
        // Capitalize first letter for display
        const displayJob = job.charAt(0).toUpperCase() + job.slice(1);
        jobCounts[displayJob] = (jobCounts[displayJob] || 0) + 1;
      }
    }));
    const jobDist = Object.entries(jobCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    // New Stats: Education (Top 5)
    const eduCounts: Record<string, number> = {};
    families.forEach(f => f.members.forEach(m => {
      if (m.education) {
        const edu = m.education.trim().toUpperCase(); // Normalize
        eduCounts[edu] = (eduCounts[edu] || 0) + 1;
      }
    }));
    const educationDist = Object.entries(eduCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    // Payment Analytics
    const today = new Date().toISOString().split('T')[0];
    const paidToday = payments.filter(p => p.status === 'Paid' && p.date === today);
    const requestedToday = payments.filter(p => p.date === today);

    const todayStats = {
      paidCount: paidToday.length,
      paidAmount: paidToday.reduce((sum, p) => sum + p.amount, 0),
      requestedCount: requestedToday.length,
      requestedAmount: requestedToday.reduce((sum, p) => sum + p.amount, 0)
    };

    const totalPaid = payments.filter(p => p.status === 'Paid').reduce((sum, p) => sum + p.amount, 0);
    const totalPending = payments.filter(p => p.status === 'Pending').reduce((sum, p) => sum + p.amount, 0);
    const collectionRate = payments.length > 0 ? Math.round((totalPaid / (totalPaid + totalPending)) * 100) : 0;

    // New Stats: Ration Card
    const rationCounts: Record<string, number> = {};
    families.forEach(f => {
      if (f.status === Status.APPROVED) {
        const type = f.rationCardType || 'None';
        rationCounts[type] = (rationCounts[type] || 0) + 1;
      }
    });
    const rationCardDist = Object.entries(rationCounts).map(([name, value]) => ({ name, value }));

    return { totalFamilies, pendingFamilies, totalMembers, pendingMembers, genderDist, ageDist, bloodGroupDist, jobDist, educationDist, rationCardDist, todayStats, totalPaid, totalPending, collectionRate };
  }, [families, payments]);

  // Payment Trend Graph Data
  const paymentTrendData = useMemo(() => {
    const getDateRange = () => {
      const now = new Date();
      const data: { label: string; paid: number; requested: number }[] = [];

      if (timeRange === 'today') {
        // Hourly for last 24 hours
        for (let i = 23; i >= 0; i--) {
          const hour = new Date(now);
          hour.setHours(now.getHours() - i, 0, 0, 0);
          const label = hour.getHours() + 'h';
          data.push({ label, paid: 0, requested: 0 });
        }
      } else if (timeRange === 'week') {
        // Daily for last 7 days
        for (let i = 6; i >= 0; i--) {
          const day = new Date(now);
          day.setDate(now.getDate() - i);
          const label = day.toLocaleDateString('en-US', { weekday: 'short' });
          data.push({ label, paid: 0, requested: 0 });
        }
      } else if (timeRange === 'month') {
        // Daily for last 30 days  
        for (let i = 29; i >= 0; i--) {
          const day = new Date(now);
          day.setDate(now.getDate() - i);
          const label = day.getDate().toString();
          data.push({ label, paid: 0, requested: 0 });
        }
      } else {
        // Monthly for last 12 months
        for (let i = 11; i >= 0; i--) {
          const month = new Date(now);
          month.setMonth(now.getMonth() - i);
          const label = month.toLocaleDateString('en-US', { month: 'short' });
          data.push({ label, paid: 0, requested: 0 });
        }
      }

      return data;
    };

    const data = getDateRange();

    // Populate with actual payment data
    payments.forEach(payment => {
      const paymentDate = new Date(payment.date);
      const now = new Date();

      let index = -1;

      if (timeRange === 'today') {
        const hoursDiff = Math.floor((now.getTime() - paymentDate.getTime()) / (1000 * 60 * 60));
        if (hoursDiff >= 0 && hoursDiff < 24) {
          index = 23 - hoursDiff;
        }
      } else if (timeRange === 'week') {
        const daysDiff = Math.floor((now.getTime() - paymentDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff >= 0 && daysDiff < 7) {
          index = 6 - daysDiff;
        }
      } else if (timeRange === 'month') {
        const daysDiff = Math.floor((now.getTime() - paymentDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff >= 0 && daysDiff < 30) {
          index = 29 - daysDiff;
        }
      } else {
        const monthsDiff = (now.getFullYear() - paymentDate.getFullYear()) * 12 + (now.getMonth() - paymentDate.getMonth());
        if (monthsDiff >= 0 && monthsDiff < 12) {
          index = 11 - monthsDiff;
        }
      }

      if (index >= 0 && index < data.length) {
        data[index].requested += payment.amount;
        if (payment.status === 'Paid') {
          data[index].paid += payment.amount;
        }
      }
    });

    return data;
  }, [payments, timeRange]);

  // Handlers
  const handleBulkPaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onBulkPaymentCreate(paymentForm.amount, paymentForm.title, {
      wards: targetMode === 'filter' && paymentForm.wards.length > 0 ? paymentForm.wards : undefined,
      gender: targetMode === 'filter' ? paymentForm.gender : undefined,
      minAge: targetMode === 'filter' && paymentForm.minAge ? parseInt(paymentForm.minAge) : undefined,
      maxAge: targetMode === 'filter' && paymentForm.maxAge ? parseInt(paymentForm.maxAge) : undefined,
      specificMemberIds: targetMode === 'select' ? selectedMemberIds : undefined
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
      videoUrl: announceForm.videoUrl,
      formUrl: announceForm.formUrl,
      location: announceForm.location,
      phoneNumber: announceForm.phoneNumber,
      target: {
        wards: targetMode === 'filter' && announceForm.wards.length > 0 ? announceForm.wards : undefined,
        gender: targetMode === 'filter' ? announceForm.gender : undefined,
        minAge: targetMode === 'filter' && announceForm.minAge ? parseInt(announceForm.minAge) : undefined,
        maxAge: targetMode === 'filter' && announceForm.maxAge ? parseInt(announceForm.maxAge) : undefined,
        specificMemberIds: targetMode === 'select' ? selectedMemberIds : undefined
      },
      stats: { total: 0, sent: 0, delivered: 0, read: 0 }
    });
    setAnnounceModalOpen(false);
    resetForms();
  };

  const resetForms = () => {
    setPaymentForm({ amount: 100, title: '', wards: [], gender: 'All', minAge: '', maxAge: '' });
    setAnnounceForm({ title: '', desc: '', cat: 'Program', imageUrl: '', videoUrl: '', formUrl: '', location: '', phoneNumber: '', wards: [], gender: 'All', minAge: '', maxAge: '' });
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

      {/* Today's Payment Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-5 rounded-xl shadow-lg text-white">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-emerald-100 text-xs font-medium uppercase">Collected Today</p>
              <p className="text-3xl font-bold mt-1">₹{stats.todayStats.paidAmount}</p>
              <p className="text-emerald-100 text-sm mt-1">{stats.todayStats.paidCount} payments</p>
            </div>
            <div className="bg-white/20 p-2 rounded-lg">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-5 rounded-xl shadow-lg text-white">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-amber-100 text-xs font-medium uppercase">Requested Today</p>
              <p className="text-3xl font-bold mt-1">₹{stats.todayStats.requestedAmount}</p>
              <p className="text-amber-100 text-sm mt-1">{stats.todayStats.requestedCount} requests</p>
            </div>
            <div className="bg-white/20 p-2 rounded-lg">
              <FileText className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-5 rounded-xl shadow-lg text-white">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-blue-100 text-xs font-medium uppercase">Collection Rate</p>
              <p className="text-3xl font-bold mt-1">{stats.collectionRate}%</p>
              <p className="text-blue-100 text-sm mt-1">₹{stats.totalPending} pending</p>
            </div>
            <div className="bg-white/20 p-2 rounded-lg">
              <PieChart className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Payment Trend Graph */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-800">Payment Trends</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setTimeRange('today')}
              className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${timeRange === 'today'
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
              Today
            </button>
            <button
              onClick={() => setTimeRange('week')}
              className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${timeRange === 'week'
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
              Week
            </button>
            <button
              onClick={() => setTimeRange('month')}
              className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${timeRange === 'month'
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
              Month
            </button>
            <button
              onClick={() => setTimeRange('year')}
              className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${timeRange === 'year'
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
              Year
            </button>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={paymentTrendData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" axisLine={false} tickLine={false} />
            <YAxis axisLine={false} tickLine={false} />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="paid"
              stroke="#10b981"
              strokeWidth={2}
              name="Collected (₹)"
              dot={{ fill: '#10b981', r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="requested"
              stroke="#f59e0b"
              strokeWidth={2}
              name="Requested (₹)"
              dot={{ fill: '#f59e0b', r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
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

        {/* New Charts */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-80">
          <h3 className="font-bold text-gray-700 mb-4">Top Professions</h3>
          {stats.jobDist.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={stats.jobDist} margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">No job data available</div>
          )}
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-80">
          <h3 className="font-bold text-gray-700 mb-4">Education Level</h3>
          {stats.educationDist.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <RePie>
                <Pie
                  data={stats.educationDist}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {stats.educationDist.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </RePie>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">No education data available</div>
          )}
        </div>


        {/* Row 3: Blood Group & Ration Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-80">
          <h3 className="font-bold text-gray-700 mb-4">Blood Group Distribution</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.bloodGroupDist}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-80">
          <h3 className="font-bold text-gray-700 mb-4">Ration Card Types</h3>
          <ResponsiveContainer width="100%" height="100%">
            <RePie>
              <Pie
                data={stats.rationCardDist}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {stats.rationCardDist.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </RePie>
          </ResponsiveContainer>
        </div>
      </div>


      {/* Pending Actions Widget */}
      {
        (stats.pendingFamilies > 0 || stats.pendingMembers > 0 || families.some(f => f.members.some(m => m.deleteRequested))) && (
          <div className="bg-amber-50 border-l-4 border-amber-500 rounded-xl overflow-hidden">
            <div className="p-4 bg-amber-100/50">
              <h3 className="font-bold text-amber-900 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Pending Actions
              </h3>
            </div>
            <div className="p-4 space-y-2">
              {stats.pendingFamilies > 0 && (
                <button
                  onClick={() => setActiveTab('families')}
                  className="w-full text-left px-4 py-3 bg-white rounded-lg hover:bg-amber-100 transition-colors flex justify-between items-center group"
                >
                  <span className="text-sm font-medium text-gray-700 group-hover:text-amber-900">Family Approvals</span>
                  <span className="px-3 py-1 bg-amber-200 text-amber-900 rounded-full text-xs font-bold">
                    {stats.pendingFamilies}
                  </span>
                </button>
              )}
              {stats.pendingMembers > 0 && (
                <button
                  onClick={() => setActiveTab('families')}
                  className="w-full text-left px-4 py-3 bg-white rounded-lg hover:bg-amber-100 transition-colors flex justify-between items-center group"
                >
                  <span className="text-sm font-medium text-gray-700 group-hover:text-amber-900">Member Approvals</span>
                  <span className="px-3 py-1 bg-amber-200 text-amber-900 rounded-full text-xs font-bold">
                    {stats.pendingMembers}
                  </span>
                </button>
              )}
              {families.some(f => f.members.some(m => m.deleteRequested)) && (
                <button
                  onClick={() => setActiveTab('families')}
                  className="w-full text-left px-4 py-3 bg-white rounded-lg hover:bg-red-100 transition-colors flex justify-between items-center group"
                >
                  <span className="text-sm font-medium text-gray-700 group-hover:text-red-900">Delete Requests</span>
                  <span className="px-3 py-1 bg-red-200 text-red-900 rounded-full text-xs font-bold">
                    {families.reduce((acc, f) => acc + f.members.filter(m => m.deleteRequested).length, 0)}
                  </span>
                </button>
              )}
            </div>
          </div>
        )
      }
    </div >
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
              <div className="text-sm text-gray-500 space-y-1">
                <p>{selectedFamily.houseName || 'No House Name'} • {selectedFamily.address}</p>
                <p>Ward: {selectedFamily.ward} • Code: {selectedFamily.code} • Mahal #{selectedFamily.mahalNumber || 'N/A'}</p>
                <div className="flex gap-3 mt-2">
                  <span className="bg-white border px-2 py-1 rounded text-xs">Ration: {selectedFamily.rationCardType} - {selectedFamily.rationCardNumber}</span>
                  <span className="bg-white border px-2 py-1 rounded text-xs">Income: ₹{selectedFamily.annualIncome}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700">
                <Smartphone className="w-4 h-4" /> WhatsApp
              </button>
              <button
                onClick={() => {
                  setEditingFamily(selectedFamily);
                  setEditFamilyModalOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50"
              >
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
                      <p className="font-medium text-gray-900">{m.name} <span className="text-xs text-gray-400 font-normal">({m.gender})</span></p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mt-0.5">
                        <span>{m.relation}</span>
                        <span>•</span>
                        <span>{m.age} yrs</span>
                        <span>•</span>
                        <span className="text-emerald-600 font-medium">{m.bloodGroup}</span>
                        {m.job && <span>• {m.job}</span>}
                        {m.education && <span>• {m.education}</span>}
                        {m.maritalStatus && <span>• {m.maritalStatus}</span>}
                      </div>
                      {m.deleteRequested && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-medium mt-1 inline-block">
                          Delete Requested
                        </span>
                      )}
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
                  gender: editingMember.gender,
                  dob: editingMember.dob,
                  bloodGroup: editingMember.bloodGroup,
                  education: editingMember.education,
                  job: editingMember.job,
                  maritalStatus: editingMember.maritalStatus,
                  email: editingMember.email
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
                    <label className="block text-sm font-medium mb-1">Date of Birth</label>
                    <input type="date" className="w-full border rounded p-2 text-sm"
                      value={editingMember.dob || ''}
                      onChange={e => {
                        const dob = e.target.value;
                        let age = editingMember.age;
                        if (dob) {
                          const birthDate = new Date(dob);
                          const today = new Date();
                          age = today.getFullYear() - birthDate.getFullYear();
                          const m = today.getMonth() - birthDate.getMonth();
                          if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
                        }
                        setEditingMember({ ...editingMember, dob, age: age > 0 ? age : 0 });
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Age</label>
                    <input
                      type="number" className="w-full border rounded p-2 text-sm bg-gray-50"
                      value={editingMember.age}
                      onChange={e => setEditingMember({ ...editingMember, age: parseInt(e.target.value) })}
                      required
                    />
                  </div>
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
                    <label className="block text-sm font-medium mb-1">Blood Group</label>
                    <select
                      className="w-full border rounded p-2 text-sm"
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
                    <label className="block text-sm font-medium mb-1">Education</label>
                    <input
                      type="text" className="w-full border rounded p-2 text-sm"
                      value={editingMember.education || ''}
                      onChange={e => setEditingMember({ ...editingMember, education: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Job</label>
                    <input
                      type="text" className="w-full border rounded p-2 text-sm"
                      value={editingMember.job || ''}
                      onChange={e => setEditingMember({ ...editingMember, job: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Marital Status</label>
                    <select className="w-full border rounded p-2 text-sm"
                      value={editingMember.maritalStatus || 'Single'}
                      onChange={e => setEditingMember({ ...editingMember, maritalStatus: e.target.value as any })}
                    >
                      <option>Single</option>
                      <option>Married</option>
                      <option>Divorced</option>
                      <option>Widowed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <input
                      type="email" className="w-full border rounded p-2 text-sm"
                      value={editingMember.email || ''}
                      onChange={e => setEditingMember({ ...editingMember, email: e.target.value })}
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



  const renderMembersList = () => {
    const totalPages = Math.ceil(filteredMembers.length / memberRowsPerPage);
    const paginatedMembers = filteredMembers.slice((memberPage - 1) * memberRowsPerPage, memberPage * memberRowsPerPage);

    // Member Specific Stats
    const memberStats = {
      total: filteredMembers.length,
      male: filteredMembers.filter(m => m.gender === 'Male').length,
      female: filteredMembers.filter(m => m.gender === 'Female').length,
      voters: filteredMembers.filter(m => m.age >= 18).length
    };

    return (
      <div className="animate-fadeIn space-y-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <span className="text-gray-500 text-xs font-bold uppercase">Total Listed</span>
            <p className="text-2xl font-bold text-gray-800">{memberStats.total}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <span className="text-gray-500 text-xs font-bold uppercase">Adults (18+)</span>
            <p className="text-2xl font-bold text-emerald-600">{memberStats.voters}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <span className="text-gray-500 text-xs font-bold uppercase">Male</span>
            <p className="text-2xl font-bold text-blue-500">{memberStats.male}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <span className="text-gray-500 text-xs font-bold uppercase">Female</span>
            <p className="text-2xl font-bold text-pink-500">{memberStats.female}</p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row gap-2 justify-between items-center bg-white p-3 rounded-xl border border-gray-200">
          <div className="relative flex-1 w-full md:w-auto">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search members by name, phone, or family code..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setMemberPage(1); }}
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
            <button
              onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
              className={`px-3 py-2 rounded-lg border flex items-center gap-2 text-sm whitespace-nowrap ${isFilterPanelOpen ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-gray-200 text-gray-600'}`}
            >
              <Filter className="w-4 h-4" /> Filters
            </button>
            <button
              onClick={() => {
                const exportData = filteredMembers.map(m => ({
                  Name: m.name,
                  Relation: m.relation,
                  Age: m.age,
                  Gender: m.gender,
                  BloodGroup: m.bloodGroup,
                  Job: m.job,
                  Education: m.education,
                  Phone: m.phone,
                  FamilyHead: m.familyHead,
                  FamilyCode: m.familyCode,
                  Ward: m.ward
                }));
                downloadCSV(exportData, `members_export_${new Date().toISOString().split('T')[0]}.csv`);
              }}
              className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 text-sm flex items-center gap-2 whitespace-nowrap"
            >
              <Download className="w-4 h-4" /> Export CSV
            </button>
            <button
              onClick={() => window.print()}
              className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 text-sm flex items-center gap-2 whitespace-nowrap"
            >
              <FileText className="w-4 h-4" /> Print / PDF
            </button>
          </div>
        </div>

        {isFilterPanelOpen && (
          <div className="bg-white border border-gray-200 p-5 rounded-xl animate-fadeIn shadow-sm">
            {/* Reusing existing Advanced Filters UI logic but ensuring it applies to filteredMembers */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-800 text-sm">Advanced Member Filters</h3>
              <button onClick={() => {
                setAdvancedFilters({ bloodGroup: 'All', education: '', job: '', minAge: '', maxAge: '', gender: 'All', maritalStatus: 'All', rationCardType: 'All' });
                setSearchTerm('');
              }} className="text-xs text-red-500 hover:underline">
                Clear All
              </button>
            </div>
            {/* ... Only showing fields relevant to members primarily ... */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Same filter inputs as Families view, reusing state */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Blood Group</label>
                <select
                  className="w-full text-sm border border-gray-300 rounded-lg p-2 outline-none"
                  value={advancedFilters.bloodGroup}
                  onChange={e => setAdvancedFilters({ ...advancedFilters, bloodGroup: e.target.value })}
                >
                  <option value="All">All Groups</option>
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Gender</label>
                <select
                  className="w-full text-sm border border-gray-300 rounded-lg p-2 outline-none"
                  value={advancedFilters.gender}
                  onChange={e => setAdvancedFilters({ ...advancedFilters, gender: e.target.value })}
                >
                  <option value="All">All</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">District/Ward</label>
                <select
                  className="w-full text-sm border border-gray-300 rounded-lg p-2 outline-none"
                  disabled // Filter by ward needs to be integrated into advancedFilters state if not already
                >
                  <option>All Wards</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Job</label>
                <input
                  type="text" className="w-full text-sm border border-gray-300 rounded-lg p-2"
                  value={advancedFilters.job} onChange={e => setAdvancedFilters({ ...advancedFilters, job: e.target.value })} placeholder="Filter Job"
                />
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Relation</th>
                  <th className="px-6 py-4">Age/Gender</th>
                  <th className="px-6 py-4">Blood</th>
                  <th className="px-6 py-4">Family (Head)</th>
                  <th className="px-6 py-4">Job/Education</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedMembers.map((m, idx) => (
                  <tr key={`${m.id}_${idx}`} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-900">{m.name}</td>
                    <td className="px-6 py-4 text-gray-600">{m.relation}</td>
                    <td className="px-6 py-4 text-gray-600">{m.age} / {m.gender}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 bg-red-50 text-red-600 rounded text-xs font-bold border border-red-100">
                        {m.bloodGroup || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      <div className="font-medium text-gray-900">{m.familyHead}</div>
                      <div className="text-xs text-gray-400">{m.familyCode}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      <div className="text-xs">{m.job || '-'}</div>
                      <div className="text-xs text-gray-400">{m.education || '-'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${m.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {m.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => {
                          const parentFamily = families.find(f => f.code === m.familyCode); // Find family to allow edit
                          if (parentFamily) {
                            setSelectedFamilyId(parentFamily.id);
                            setEditingMember(m);
                            setEditMemberModalOpen(true);
                          }
                        }}
                        className="text-blue-600 hover:underline text-xs"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
                {paginatedMembers.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-gray-400">No members found matching criteria.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Rows per page:</span>
              <select
                className="bg-white border border-gray-300 rounded px-2 py-1 text-xs outline-none"
                value={memberRowsPerPage}
                onChange={(e) => { setMemberRowsPerPage(Number(e.target.value)); setMemberPage(1); }}
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={500}>500</option>
              </select>
              <span>
                Showing {filteredMembers.length > 0 ? (memberPage - 1) * memberRowsPerPage + 1 : 0} - {Math.min(memberPage * memberRowsPerPage, filteredMembers.length)} of {filteredMembers.length}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                disabled={memberPage === 1}
                onClick={() => setMemberPage(p => Math.max(1, p - 1))}
                className="px-3 py-1 bg-white border border-gray-300 rounded text-sm disabled:opacity-50 hover:bg-gray-100"
              >
                Previous
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let p = i + 1;
                  if (totalPages > 5 && memberPage > 3) p = memberPage - 2 + i;
                  if (p > totalPages) return null;
                  return (
                    <button
                      key={p}
                      onClick={() => setMemberPage(p)}
                      className={`w-8 h-8 flex items-center justify-center rounded text-xs font-bold ${memberPage === p ? 'bg-emerald-600 text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
              <button
                disabled={memberPage === totalPages || totalPages === 0}
                onClick={() => setMemberPage(p => Math.min(totalPages, p + 1))}
                className="px-3 py-1 bg-white border border-gray-300 rounded text-sm disabled:opacity-50 hover:bg-gray-100"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderFamilyList = () => {
    // Pagination Logic for Families
    const totalPages = Math.ceil(filteredFamilies.length / familyRowsPerPage);
    const paginatedFamilies = filteredFamilies.slice((familyPage - 1) * familyRowsPerPage, familyPage * familyRowsPerPage);

    return (
      <div className="animate-fadeIn space-y-4">

        <div className="flex flex-col md:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by Name, Ward, or Family Code..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setFamilyPage(1); }}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
              className={`px-4 py-2 rounded-lg border flex items-center gap-2 transition-colors ${isFilterPanelOpen ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >
              <Filter className="w-4 h-4" /> Filters
            </button>
            <button
              onClick={() => {
                const data = filteredFamilies.map(f => ({
                  Code: f.code,
                  Head: f.headName,
                  Members: f.members.length,
                  Ward: f.ward,
                  House: f.houseName,
                  RationType: f.rationCardType,
                  Balance: f.balance,
                  Status: f.status
                }));
                downloadCSV(data, `families_export_${new Date().toISOString().split('T')[0]}.csv`);
              }}
              className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 flex items-center gap-2"
            >
              <Download className="w-4 h-4" /> Export
            </button>
          </div>
        </div>

        {isFilterPanelOpen && (
          <div className="bg-white border border-gray-200 p-5 rounded-xl animate-fadeIn shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-800 text-sm">Advanced Filtering</h3>
              <button onClick={() => {
                setAdvancedFilters({ bloodGroup: 'All', education: '', job: '', minAge: '', maxAge: '', gender: 'All', maritalStatus: 'All', rationCardType: 'All' });
                setSearchTerm('');
              }} className="text-xs text-red-500 hover:underline">
                Clear All
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ration Card (Family)</label>
                <select
                  className="w-full text-sm border border-gray-300 rounded-lg p-2 outline-none"
                  value={advancedFilters.rationCardType}
                  onChange={e => setAdvancedFilters({ ...advancedFilters, rationCardType: e.target.value })}
                >
                  <option value="All">All Types</option>
                  <option value="APL">APL</option>
                  <option value="BPL">BPL</option>
                  <option value="AAY">AAY</option>
                  <option value="PHH">PHH</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Blood Group</label>
                <select
                  className="w-full text-sm border border-gray-300 rounded-lg p-2 outline-none"
                  value={advancedFilters.bloodGroup}
                  onChange={e => setAdvancedFilters({ ...advancedFilters, bloodGroup: e.target.value })}
                >
                  <option value="All">All Groups</option>
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Gender</label>
                <select
                  className="w-full text-sm border border-gray-300 rounded-lg p-2 outline-none"
                  value={advancedFilters.gender}
                  onChange={e => setAdvancedFilters({ ...advancedFilters, gender: e.target.value })}
                >
                  <option value="All">All</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Marital Status</label>
                <select
                  className="w-full text-sm border border-gray-300 rounded-lg p-2 outline-none"
                  value={advancedFilters.maritalStatus}
                  onChange={e => setAdvancedFilters({ ...advancedFilters, maritalStatus: e.target.value })}
                >
                  <option value="All">All</option>
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Divorced">Divorced</option>
                  <option value="Widowed">Widowed</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Job (Contains)</label>
                <input
                  type="text"
                  className="w-full text-sm border border-gray-300 rounded-lg p-2 outline-none"
                  placeholder="e.g. Engineer"
                  value={advancedFilters.job}
                  onChange={e => setAdvancedFilters({ ...advancedFilters, job: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Education (Contains)</label>
                <input
                  type="text"
                  className="w-full text-sm border border-gray-300 rounded-lg p-2 outline-none"
                  placeholder="e.g. B.Tech"
                  value={advancedFilters.education}
                  onChange={e => setAdvancedFilters({ ...advancedFilters, education: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Min Age</label>
                <input
                  type="number"
                  className="w-full text-sm border border-gray-300 rounded-lg p-2 outline-none"
                  placeholder="0"
                  value={advancedFilters.minAge}
                  onChange={e => setAdvancedFilters({ ...advancedFilters, minAge: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Max Age</label>
                <input
                  type="number"
                  className="w-full text-sm border border-gray-300 rounded-lg p-2 outline-none"
                  placeholder="100"
                  value={advancedFilters.maxAge}
                  onChange={e => setAdvancedFilters({ ...advancedFilters, maxAge: e.target.value })}
                />
              </div>
            </div>
          </div>
        )}

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

        {/* Delete Requests Section */}
        {families.some(f => f.members.some(m => m.deleteRequested)) && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-xl mb-4">
            <h3 className="font-bold text-red-800 mb-2 flex items-center gap-2">
              <Trash2 className="w-5 h-5" /> Delete Requests
            </h3>
            <div className="space-y-2">
              {families.map(f =>
                f.members.filter(m => m.deleteRequested).map(m => (
                  <div key={m.id} className="bg-white p-3 rounded-lg border border-red-100 flex justify-between items-center">
                    <div>
                      <span className="font-bold">{m.name}</span>
                      <span className="text-gray-500 text-sm mx-2">|</span>
                      <span className="text-sm text-gray-600">{f.headName}'s family</span>
                      {m.relation === 'Head' && (
                        <span className="ml-2 px-2 py-0.5 bg-red-600 text-white text-xs rounded font-medium">
                          ⚠️ HEAD - Will delete entire family
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => onRejectMember(f.id, m.id)}
                      className="px-3 py-1 bg-red-600 text-white text-xs rounded font-medium hover:bg-red-700"
                    >
                      Approve Delete
                    </button>
                  </div>
                ))
              )}
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
              {paginatedFamilies.map(f => {
                const matchingMembers = searchTerm ? f.members.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase())) : [];
                return (
                  <tr
                    key={f.id}
                    onClick={() => setSelectedFamilyId(f.id)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 font-mono text-gray-500">{f.code}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{f.headName}</div>
                      {matchingMembers.length > 0 && (
                        <div className="text-xs text-emerald-600 mt-1 font-medium bg-emerald-50 inline-block px-2 py-0.5 rounded">
                          Includes: {matchingMembers.map(m => m.name).slice(0, 2).join(', ')}{matchingMembers.length > 2 ? ` +${matchingMembers.length - 2} more` : ''}
                        </div>
                      )}
                    </td>
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
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls For Families */}
        <div className="flex items-center justify-between px-4 mt-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Rows:</span>
            <select
              className="bg-white border border-gray-300 rounded px-2 py-1 text-xs outline-none"
              value={familyRowsPerPage}
              onChange={(e) => { setFamilyRowsPerPage(Number(e.target.value)); setFamilyPage(1); }}
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={500}>500</option>
            </select>
            <span>{filteredFamilies.length} Items</span>
          </div>

          <div className="flex gap-2">
            <button
              disabled={familyPage === 1}
              onClick={() => setFamilyPage(p => Math.max(1, p - 1))}
              className="px-3 py-1 bg-white border border-gray-300 rounded text-sm disabled:opacity-50 hover:bg-gray-100"
            >
              Prev
            </button>
            <span className="flex items-center text-sm font-bold text-gray-700">Page {familyPage} of {totalPages || 1}</span>
            <button
              disabled={familyPage === totalPages || totalPages === 0}
              onClick={() => setFamilyPage(p => Math.min(totalPages, p + 1))}
              className="px-3 py-1 bg-white border border-gray-300 rounded text-sm disabled:opacity-50 hover:bg-gray-100"
            >
              Next
            </button>
          </div>
        </div>

      </div>
    );

  };

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
            <div className="px-6 py-3 border-b border-amber-200 bg-amber-100/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-amber-900">Pending Approvals</h3>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search payments..."
                  value={paymentSearch}
                  onChange={(e) => setPaymentSearch(e.target.value)}
                  className="pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                />
              </div>
            </div>
            <div className="divide-y divide-amber-100">
              {pendingPayments
                .filter(p => {
                  if (!paymentSearch) return true;
                  const search = paymentSearch.toLowerCase();
                  const family = families.find(f => f.id === p.familyId);
                  return (
                    p.memberName?.toLowerCase().includes(search) ||
                    family?.headName.toLowerCase().includes(search) ||
                    p.title.toLowerCase().includes(search) ||
                    p.amount.toString().includes(search)
                  );
                })
                .slice(0, 5).map(p => {
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
                        <button
                          onClick={() => onDeletePayment(p.id)}
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                          title="Delete payment"
                        >
                          <Trash2 className="w-4 h-4" />
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

  const renderReports = () => {
    // Report Filter State
    const [reportType, setReportType] = useState<'members' | 'financial'>('members');
    const [exportFormat, setExportFormat] = useState<'pdf' | 'excel'>('pdf');
    const [isExporting, setIsExporting] = useState(false);

    // Member Report Filters
    const [memberReportFilters, setMemberReportFilters] = useState({
      wards: [] as string[],
      gender: 'All' as 'Male' | 'Female' | 'All',
      minAge: '',
      maxAge: '',
      bloodGroup: 'All',
      maritalStatus: 'All',
      rationCardType: 'All',
      education: '',
      job: ''
    });

    // Financial Report Filters
    const [financialReportFilters, setFinancialReportFilters] = useState({
      dateRange: {
        start: '',
        end: ''
      },
      paymentStatus: 'All' as 'Paid' | 'Pending' | 'All',
      wards: [] as string[],
      minAmount: '',
      maxAmount: ''
    });

    const handleExport = async () => {
      setIsExporting(true);
      try {
        const endpoint = reportType === 'members'
          ? '/api/reports/members/export'
          : '/api/reports/financial/export';

        const filters = reportType === 'members' ? {
          wards: memberReportFilters.wards.length > 0 ? memberReportFilters.wards : undefined,
          gender: memberReportFilters.gender !== 'All' ? memberReportFilters.gender : undefined,
          minAge: memberReportFilters.minAge ? parseInt(memberReportFilters.minAge) : undefined,
          maxAge: memberReportFilters.maxAge ? parseInt(memberReportFilters.maxAge) : undefined,
          bloodGroup: memberReportFilters.bloodGroup !== 'All' ? memberReportFilters.bloodGroup : undefined,
          maritalStatus: memberReportFilters.maritalStatus !== 'All' ? memberReportFilters.maritalStatus : undefined,
          rationCardType: memberReportFilters.rationCardType !== 'All' ? memberReportFilters.rationCardType : undefined,
          education: memberReportFilters.education || undefined,
          job: memberReportFilters.job || undefined
        } : {
          dateRange: financialReportFilters.dateRange.start && financialReportFilters.dateRange.end
            ? financialReportFilters.dateRange
            : undefined,
          paymentStatus: financialReportFilters.paymentStatus !== 'All' ? financialReportFilters.paymentStatus : undefined,
          wards: financialReportFilters.wards.length > 0 ? financialReportFilters.wards : undefined,
          minAmount: financialReportFilters.minAmount ? parseFloat(financialReportFilters.minAmount) : undefined,
          maxAmount: financialReportFilters.maxAmount ? parseFloat(financialReportFilters.maxAmount) : undefined
        };

        const response = await fetch(`http://localhost:3001${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ format: exportFormat, filters })
        });

        if (!response.ok) {
          throw new Error('Export failed');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reportType}_report_${new Date().toISOString().split('T')[0]}.${exportFormat === 'pdf' ? 'pdf' : 'xlsx'}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        alert('Report exported successfully!');
      } catch (error) {
        console.error('Export error:', error);
        alert('Failed to export report. Please try again.');
      } finally {
        setIsExporting(false);
      }
    };

    return (
      <div className="animate-fadeIn space-y-6">
        <h2 className="text-xl font-bold text-gray-900">Reports Center</h2>

        {/* Report Type Selector */}
        <div className="flex gap-4 bg-white p-2 rounded-xl border border-gray-200">
          <button
            onClick={() => setReportType('members')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${reportType === 'members'
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-md'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
          >
            <Users className="w-5 h-5 inline mr-2" />
            Member Directory
          </button>
          <button
            onClick={() => setReportType('financial')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${reportType === 'financial'
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
          >
            <DollarSign className="w-5 h-5 inline mr-2" />
            Financial Statement
          </button>
        </div>

        {/* Filters Section */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-600" />
              Filter Options
            </h3>
          </div>

          {reportType === 'members' ? (
            <div className="space-y-4">
              {/* Ward Filter */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Wards</label>
                <div className="flex flex-wrap gap-2">
                  {['Ward 1', 'Ward 2', 'Ward 3', 'Ward 4'].map(w => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => {
                        const newWards = memberReportFilters.wards.includes(w)
                          ? memberReportFilters.wards.filter(i => i !== w)
                          : [...memberReportFilters.wards, w];
                        setMemberReportFilters({ ...memberReportFilters, wards: newWards });
                      }}
                      className={`px-3 py-1 rounded-full text-xs font-bold border ${memberReportFilters.wards.includes(w)
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white text-gray-500 border-gray-200'
                        }`}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </div>

              {/* Demographics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Gender</label>
                  <select
                    className="w-full text-sm border rounded p-2"
                    value={memberReportFilters.gender}
                    onChange={(e) => setMemberReportFilters({ ...memberReportFilters, gender: e.target.value as any })}
                  >
                    <option value="All">All</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Blood Group</label>
                  <select
                    className="w-full text-sm border rounded p-2"
                    value={memberReportFilters.bloodGroup}
                    onChange={(e) => setMemberReportFilters({ ...memberReportFilters, bloodGroup: e.target.value })}
                  >
                    <option value="All">All</option>
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

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Marital Status</label>
                  <select
                    className="w-full text-sm border rounded p-2"
                    value={memberReportFilters.maritalStatus}
                    onChange={(e) => setMemberReportFilters({ ...memberReportFilters, maritalStatus: e.target.value })}
                  >
                    <option value="All">All</option>
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Divorced">Divorced</option>
                    <option value="Widowed">Widowed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ration Card</label>
                  <select
                    className="w-full text-sm border rounded p-2"
                    value={memberReportFilters.rationCardType}
                    onChange={(e) => setMemberReportFilters({ ...memberReportFilters, rationCardType: e.target.value })}
                  >
                    <option value="All">All</option>
                    <option value="APL">APL</option>
                    <option value="BPL">BPL</option>
                    <option value="AAY">AAY</option>
                    <option value="PHH">PHH</option>
                    <option value="None">None</option>
                  </select>
                </div>
              </div>

              {/* Age Range */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Min Age</label>
                  <input
                    type="number"
                    className="w-full text-sm border rounded p-2"
                    placeholder="0"
                    value={memberReportFilters.minAge}
                    onChange={(e) => setMemberReportFilters({ ...memberReportFilters, minAge: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Max Age</label>
                  <input
                    type="number"
                    className="w-full text-sm border rounded p-2"
                    placeholder="100"
                    value={memberReportFilters.maxAge}
                    onChange={(e) => setMemberReportFilters({ ...memberReportFilters, maxAge: e.target.value })}
                  />
                </div>
              </div>

              {/* Education & Job */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Education</label>
                  <input
                    type="text"
                    className="w-full text-sm border rounded p-2"
                    placeholder="e.g., SSLC, Degree"
                    value={memberReportFilters.education}
                    onChange={(e) => setMemberReportFilters({ ...memberReportFilters, education: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Job</label>
                  <input
                    type="text"
                    className="w-full text-sm border rounded p-2"
                    placeholder="e.g., Teacher, Driver"
                    value={memberReportFilters.job}
                    onChange={(e) => setMemberReportFilters({ ...memberReportFilters, job: e.target.value })}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Date Range */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Start Date</label>
                  <input
                    type="date"
                    className="w-full text-sm border rounded p-2"
                    value={financialReportFilters.dateRange.start}
                    onChange={(e) => setFinancialReportFilters({
                      ...financialReportFilters,
                      dateRange: { ...financialReportFilters.dateRange, start: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">End Date</label>
                  <input
                    type="date"
                    className="w-full text-sm border rounded p-2"
                    value={financialReportFilters.dateRange.end}
                    onChange={(e) => setFinancialReportFilters({
                      ...financialReportFilters,
                      dateRange: { ...financialReportFilters.dateRange, end: e.target.value }
                    })}
                  />
                </div>
              </div>

              {/* Payment Status */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Payment Status</label>
                <select
                  className="w-full text-sm border rounded p-2"
                  value={financialReportFilters.paymentStatus}
                  onChange={(e) => setFinancialReportFilters({ ...financialReportFilters, paymentStatus: e.target.value as any })}
                >
                  <option value="All">All</option>
                  <option value="Paid">Paid Only</option>
                  <option value="Pending">Pending Only</option>
                </select>
              </div>

              {/* Ward Filter */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Wards</label>
                <div className="flex flex-wrap gap-2">
                  {['Ward 1', 'Ward 2', 'Ward 3', 'Ward 4'].map(w => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => {
                        const newWards = financialReportFilters.wards.includes(w)
                          ? financialReportFilters.wards.filter(i => i !== w)
                          : [...financialReportFilters.wards, w];
                        setFinancialReportFilters({ ...financialReportFilters, wards: newWards });
                      }}
                      className={`px-3 py-1 rounded-full text-xs font-bold border ${financialReportFilters.wards.includes(w)
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-500 border-gray-200'
                        }`}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount Range */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Min Amount (₹)</label>
                  <input
                    type="number"
                    className="w-full text-sm border rounded p-2"
                    placeholder="0"
                    value={financialReportFilters.minAmount}
                    onChange={(e) => setFinancialReportFilters({ ...financialReportFilters, minAmount: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Max Amount (₹)</label>
                  <input
                    type="number"
                    className="w-full text-sm border rounded p-2"
                    placeholder="No limit"
                    value={financialReportFilters.maxAmount}
                    onChange={(e) => setFinancialReportFilters({ ...financialReportFilters, maxAmount: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Export Section */}
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h3 className="font-bold text-gray-800 mb-4">Export Options</h3>

          <div className="flex gap-4 mb-4">
            <button
              onClick={() => setExportFormat('pdf')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all border-2 ${exportFormat === 'pdf'
                  ? 'border-red-500 bg-red-50 text-red-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                }`}
            >
              <FileText className="w-5 h-5 inline mr-2" />
              PDF Format
            </button>
            <button
              onClick={() => setExportFormat('excel')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all border-2 ${exportFormat === 'excel'
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                }`}
            >
              <FileText className="w-5 h-5 inline mr-2" />
              Excel Format
            </button>
          </div>

          <button
            onClick={handleExport}
            disabled={isExporting}
            className={`w-full py-3 px-4 rounded-lg font-bold text-white transition-all ${isExporting
                ? 'bg-gray-400 cursor-not-allowed'
                : reportType === 'members'
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:shadow-lg'
                  : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:shadow-lg'
              }`}
          >
            {isExporting ? (
              <>
                <div className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Generating Report...
              </>
            ) : (
              <>
                <Download className="w-5 h-5 inline mr-2" />
                Download {reportType === 'members' ? 'Member' : 'Financial'} Report ({exportFormat.toUpperCase()})
              </>
            )}
          </button>

          <p className="text-xs text-gray-500 mt-3 text-center">
            Report will include all data matching your selected filters
          </p>
        </div>
      </div>
    );
  };

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
          <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg bg-white">
            {familiesForSelection.map(f => {
              const isExpanded = expandedFamilies.includes(f.id);
              const headMember = f.members.find(m => m.relation === 'Head');
              const familyMemberIds = f.members.map(m => m.id);
              const isFamilySelected = headMember && selectedMemberIds.includes(headMember.id);

              return (
                <div key={f.id} className="border-b last:border-0 border-gray-100">
                  {/* Family Header */}
                  <div className="flex items-center p-2 hover:bg-gray-50">
                    <button
                      onClick={() => setExpandedFamilies(prev =>
                        prev.includes(f.id) ? prev.filter(id => id !== f.id) : [...prev, f.id]
                      )}
                      className="p-1 hover:bg-gray-200 rounded mr-2"
                    >
                      {isExpanded ? '▼' : '▶'}
                    </button>
                    <input
                      type="checkbox"
                      checked={isFamilySelected}
                      onChange={() => {
                        if (headMember) {
                          setSelectedMemberIds(prev =>
                            prev.includes(headMember.id)
                              ? prev.filter(id => id !== headMember.id)
                              : [...prev, headMember.id]
                          );
                        }
                      }}
                      className="w-4 h-4 text-emerald-600 rounded mr-3"
                    />
                    <div className="flex-1 text-sm">
                      <div className="font-medium flex items-center gap-2">
                        {f.headName}
                        <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded font-medium">
                          {f.members.length} members
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">{f.ward} • {f.code}</div>
                    </div>
                  </div>

                  {/* Expanded Member List */}
                  {isExpanded && (
                    <div className="pl-8 pr-2 pb-2 bg-gray-50 space-y-1">
                      {f.members.map(member => (
                        <label
                          key={member.id}
                          className="flex items-center p-2 hover:bg-white rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedMemberIds.includes(member.id)}
                            onChange={() => {
                              setSelectedMemberIds(prev =>
                                prev.includes(member.id)
                                  ? prev.filter(id => id !== member.id)
                                  : [...prev, member.id]
                              );
                            }}
                            className="w-4 h-4 text-emerald-600 rounded mr-3"
                          />
                          <div className="flex-1 flex items-center justify-between">
                            <div className="text-sm">
                              <span className="font-medium text-gray-900">{member.name}</span>
                              <span className="text-gray-400 mx-2">•</span>
                              <span className="text-xs text-gray-500">{member.relation}, {member.age}y</span>
                            </div>
                            {member.relation === 'Head' && (
                              <span className="text-xs px-2 py-0.5 bg-emerald-600 text-white rounded font-bold">
                                HEAD
                              </span>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            {familiesForSelection.length === 0 && (
              <div className="p-4 text-center text-xs text-gray-400">No families found</div>
            )}
          </div>
          <div className="text-xs text-emerald-600 font-medium text-right">
            {selectedMemberIds.length} {selectedMemberIds.length === 1 ? 'Member' : 'Members'} Selected
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
            { id: 'members', icon: Users, label: 'Members' },
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
        {activeTab === 'members' && renderMembersList()}
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
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden animate-slideUp flex flex-col">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold">New Announcement</h3>
              <p className="text-sm text-gray-500">Send to App Feed & WhatsApp</p>
            </div>
            <form onSubmit={handleAnnounceSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 space-y-4 overflow-y-auto flex-1">
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
                      <option>Emergency</option>
                      <option>Data Collect</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Image URL (Optional)</label>
                    <input type="text" className="w-full border rounded-lg p-2" placeholder="https://..." value={announceForm.imageUrl} onChange={e => setAnnounceForm({ ...announceForm, imageUrl: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">YouTube Video URL (Optional)</label>
                    <input type="text" className="w-full border rounded-lg p-2" placeholder="https://youtube.com/watch?v=..." value={announceForm.videoUrl} onChange={e => setAnnounceForm({ ...announceForm, videoUrl: e.target.value })} />
                  </div>
                  {announceForm.cat === 'Data Collect' && (
                    <div>
                      <label className="block text-sm font-medium mb-1">Google Forms URL</label>
                      <input type="text" className="w-full border rounded-lg p-2" placeholder="https://forms.gle/..." value={announceForm.formUrl} onChange={e => setAnnounceForm({ ...announceForm, formUrl: e.target.value })} required />
                    </div>
                  )}
                  {announceForm.cat === 'Emergency' && (
                    <div>
                      <label className="block text-sm font-medium mb-1">Emergency Contact</label>
                      <input type="tel" className="w-full border rounded-lg p-2" placeholder="+91 9999999999" value={announceForm.phoneNumber} onChange={e => setAnnounceForm({ ...announceForm, phoneNumber: e.target.value })} />
                    </div>
                  )}
                  {announceForm.cat !== 'Data Collect' && announceForm.cat !== 'Emergency' && (
                    <div>
                      <label className="block text-sm font-medium mb-1">Location (Optional)</label>
                      <input type="text" className="w-full border rounded-lg p-2" placeholder="Mahall Auditorium" value={announceForm.location} onChange={e => setAnnounceForm({ ...announceForm, location: e.target.value })} />
                    </div>
                  )}
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
              </div>

              <div className="flex justify-end gap-3 p-6 border-t border-gray-100 bg-gray-50">
                <button type="button" onClick={() => setAnnounceModalOpen(false)} className="px-4 py-2 text-gray-500 hover:text-gray-700">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 flex items-center gap-2">
                  <Send className="w-4 h-4" /> Broadcast
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit FAMILY Modal */}
      {isEditFamilyModalOpen && editingFamily && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl w-full max-w-lg animate-slideUp p-6">
            <h3 className="font-bold text-lg mb-4">Edit Family Details</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (editingFamily) {
                onUpdateFamily(editingFamily.id, {
                  headName: editingFamily.headName,
                  address: editingFamily.address,
                  ward: editingFamily.ward,
                  houseName: editingFamily.houseName,
                  rationCardType: editingFamily.rationCardType,
                  rationCardNumber: editingFamily.rationCardNumber,
                  mahalNumber: editingFamily.mahalNumber,
                  annualIncome: editingFamily.annualIncome
                });
              }
              setEditFamilyModalOpen(false);
              setEditingFamily(null);
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Head Name</label>
                <input type="text" className="w-full border rounded p-2 text-sm bg-gray-50"
                  value={editingFamily.headName} disabled
                />
                <span className="text-xs text-gray-400">Cannot change head name directly. Edit member instead.</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">House Name</label>
                  <input type="text" required className="w-full border rounded p-2 text-sm"
                    value={editingFamily.houseName || ''}
                    onChange={e => setEditingFamily({ ...editingFamily, houseName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Mahall Number</label>
                  <input type="text" className="w-full border rounded p-2 text-sm"
                    value={editingFamily.mahalNumber || ''}
                    onChange={e => setEditingFamily({ ...editingFamily, mahalNumber: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Ration Card Type</label>
                  <select className="w-full border rounded p-2 text-sm"
                    value={editingFamily.rationCardType || ''}
                    onChange={e => setEditingFamily({ ...editingFamily, rationCardType: e.target.value as any })}
                  >
                    <option value="">Select</option>
                    <option value="APL">APL</option>
                    <option value="BPL">BPL</option>
                    <option value="AAY">AAY</option>
                    <option value="PHH">PHH</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Ration Card Number</label>
                  <input type="text" className="w-full border rounded p-2 text-sm"
                    value={editingFamily.rationCardNumber || ''}
                    onChange={e => setEditingFamily({ ...editingFamily, rationCardNumber: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Annual Income (₹)</label>
                  <input type="number" className="w-full border rounded p-2 text-sm"
                    value={editingFamily.annualIncome || ''}
                    onChange={e => setEditingFamily({ ...editingFamily, annualIncome: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Ward</label>
                  <select className="w-full border rounded p-2 text-sm"
                    value={editingFamily.ward}
                    onChange={e => setEditingFamily({ ...editingFamily, ward: e.target.value })}
                  >
                    {['Ward 1', 'Ward 2', 'Ward 3', 'Ward 4'].map(w => <option key={w}>{w}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Address</label>
                <textarea className="w-full border rounded p-2 text-sm h-20 resize-none"
                  value={editingFamily.address}
                  onChange={e => setEditingFamily({ ...editingFamily, address: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEditFamilyModalOpen(false)} className="px-3 py-1.5 text-gray-500 text-sm">Cancel</button>
                <button type="submit" className="px-3 py-1.5 bg-emerald-600 text-white rounded text-sm font-medium">Save Details</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;