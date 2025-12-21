import React, { useState, useEffect, useCallback } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Auth from './components/Auth';
import AdminDashboard from './components/AdminDashboard';
import FamilyDashboard from './components/FamilyDashboard';
import OnboardingForm from './components/OnboardingForm';
import NotificationManager from './components/NotificationManager';
import NotificationInbox from './components/NotificationInbox';
import { User, Family, Status, UserRole, FamilyMember, Log, Announcement, Payment, Feedback, TargetingCriteria } from './types';
import { LogOut, Bell, Loader2 } from 'lucide-react';

const API_BASE_URL = 'http://localhost:3001/api';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [families, setFamilies] = useState<Family[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [onboardingPhone, setOnboardingPhone] = useState('');
  const [showNotificationInbox, setShowNotificationInbox] = useState(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  // Restore session from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');

    if (savedUser && savedToken) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        setToken(savedToken);
        // Fetch data with saved token
        fetchDataOnLogin(parsedUser.role, parsedUser.familyId, savedToken);
      } catch (error) {
        console.error('Failed to restore session:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  // Data Fetching Logic
  const fetchDataOnLogin = async (role: UserRole, familyId?: string, token?: string) => {
    setIsLoading(true);
    try {
      // Fetch initial data from backend
      const [familiesRes, logsRes, announcementsRes, paymentsRes, feedbacksRes] = await Promise.all([
        fetch(`${API_BASE_URL}/data/families`, { headers: token ? { Authorization: `Bearer ${token}` } : {} }),
        fetch(`${API_BASE_URL}/data/logs`, { headers: token ? { Authorization: `Bearer ${token}` } : {} }),
        fetch(`${API_BASE_URL}/data/announcements`, { headers: token ? { Authorization: `Bearer ${token}` } : {} }),
        fetch(`${API_BASE_URL}/data/payments`, { headers: token ? { Authorization: `Bearer ${token}` } : {} }),
        fetch(`${API_BASE_URL}/data/feedbacks`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      ]);

      if (!familiesRes.ok || !logsRes.ok || !announcementsRes.ok || !paymentsRes.ok || !feedbacksRes.ok) {
        throw new Error("One or more data fetches failed.");
      }

      setFamilies(await familiesRes.json());
      setLogs(await logsRes.json());
      setAnnouncements(await announcementsRes.json());
      setPayments(await paymentsRes.json());
      setFeedbacks(await feedbacksRes.json());
    } catch (error) {
      console.error("Data Fetching Error:", error);
      alert("Could not load existing data from backend.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (token: string, user: User) => {
    setIsLoading(true);
    try {
      // Store user and token
      setUser(user);
      setToken(token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);

      // Fetch data based on user role
      await fetchDataOnLogin(user.role, user.familyId, token);
    } catch (error) {
      console.error("Login Error:", error);
      alert(`Login failed: ${(error as Error).message}`);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (data: { headName: string; address: string; ward: string; age: number; gender: 'Male' | 'Female' }, phoneArg?: string) => {
    setIsLoading(true);
    try {
      const phoneToUse = phoneArg || onboardingPhone;

      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phoneToUse,
          ...data
        })
      });

      const responseData = await response.json();

      if (response.ok && responseData.token) {
        setUser(responseData.user);
        setToken(responseData.token);
        localStorage.setItem('user', JSON.stringify(responseData.user));
        localStorage.setItem('token', responseData.token);
        setIsOnboarding(false);
        await fetchDataOnLogin(responseData.user.role, responseData.user.familyId, responseData.token);
        alert('Registration successful! Your family profile is pending admin approval.');
      } else {
        throw new Error(responseData.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      alert(`Registration failed: ${(error as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    setFamilies([]);
    setLogs([]);
    setAnnouncements([]);
    setPayments([]);
    setFeedbacks([]);
    // Clear localStorage
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  // Hydrate user family data if logged in as head
  const currentUserFamily = user?.familyId
    ? families.find(f => f.id === user.familyId)
    : null;

  // Admin/Family Head action handlers - now with API integration
  const handleApproveFamily = async (id: string) => {
    try {
      const family = families.find(f => f.id === id);
      if (!family) {
        alert('Family not found');
        return;
      }

      // Auto-approve family head member when approving family
      const updatedMembers = family.members.map(m =>
        m.relation === 'Head' ? { ...m, status: Status.APPROVED } : m
      );

      const response = await fetch(`${API_BASE_URL}/data/families/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...family,
          status: Status.APPROVED,
          members: updatedMembers
        })
      });

      if (response.ok) {
        const updatedFamily = await response.json();
        setFamilies(families.map(f => f.id === id ? updatedFamily : f));
        alert('Family and head member approved successfully!');
      } else {
        throw new Error('Failed to approve family');
      }
    } catch (error) {
      console.error('Error approving family:', error);
      alert('Failed to approve family');
    }
  };

  const handleApproveMember = async (familyId: string, memberId: string) => {
    try {
      const family = families.find(f => f.id === familyId);
      if (!family) {
        alert('Family not found');
        return;
      }

      const updatedMembers = family.members.map(m =>
        m.id === memberId ? { ...m, status: Status.APPROVED } : m
      );

      const response = await fetch(`${API_BASE_URL}/data/families/${familyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...family, members: updatedMembers })
      });

      if (response.ok) {
        const updatedFamily = await response.json();
        setFamilies(families.map(f => f.id === familyId ? updatedFamily : f));
        alert('Member approved successfully!');
      } else {
        throw new Error('Failed to approve member');
      }
    } catch (error) {
      console.error('Error approving member:', error);
      alert('Failed to approve member');
    }
  };

  const handleRejectMember = async (familyId: string, memberId: string) => {
    try {
      const family = families.find(f => f.id === familyId);
      if (!family) {
        alert('Family not found');
        return;
      }

      const updatedMembers = family.members.filter(m => m.id !== memberId);

      const response = await fetch(`${API_BASE_URL}/data/families/${familyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...family, members: updatedMembers })
      });

      if (response.ok) {
        const updatedFamily = await response.json();
        setFamilies(families.map(f => f.id === familyId ? updatedFamily : f));
        alert('Member rejected successfully!');
      } else {
        throw new Error('Failed to reject member');
      }
    } catch (error) {
      console.error('Error rejecting member:', error);
      alert('Failed to reject member');
    }
  };

  const handleEditMember = async (familyId: string, memberId: string, updatedData: Partial<FamilyMember>) => {
    try {
      const family = families.find(f => f.id === familyId);
      if (!family) {
        alert('Family not found');
        return;
      }

      const updatedMembers = family.members.map(m =>
        m.id === memberId ? { ...m, ...updatedData } : m
      );

      const response = await fetch(`${API_BASE_URL}/data/families/${familyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...family, members: updatedMembers })
      });

      if (response.ok) {
        const updatedFamily = await response.json();
        setFamilies(families.map(f => f.id === familyId ? updatedFamily : f));
        alert('Member updated successfully!');
      } else {
        throw new Error('Failed to update member');
      }
    } catch (error) {
      console.error('Error updating member:', error);
      alert('Failed to update member');
    }
  };

  const handleCreateAnnouncement = async (announcement: Announcement) => {
    try {
      const response = await fetch(`${API_BASE_URL}/data/announcements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(announcement)
      });

      if (response.ok) {
        const newAnnouncement = await response.json();
        setAnnouncements([...announcements, newAnnouncement]);
        alert('Announcement created successfully!');
      } else {
        throw new Error('Failed to create announcement');
      }
    } catch (error) {
      console.error('Error creating announcement:', error);
      alert('Failed to create announcement');
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/data/announcements/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setAnnouncements(announcements.filter(a => a.id !== id));
        alert('Announcement deleted successfully!');
      } else {
        throw new Error('Failed to delete announcement');
      }
    } catch (error) {
      console.error('Error deleting announcement:', error);
      alert('Failed to delete announcement');
    }
  };

  const handleCreatePayment = async (payment: Payment) => {
    try {
      const response = await fetch(`${API_BASE_URL}/data/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payment)
      });

      if (response.ok) {
        const newPayment = await response.json();
        setPayments([...payments, newPayment]);
        alert('Payment created successfully!');
      } else {
        throw new Error('Failed to create payment');
      }
    } catch (error) {
      console.error('Error creating payment:', error);
      alert('Failed to create payment');
    }
  };

  const handleBulkPaymentCreate = async (amount: number, title: string, criteria: TargetingCriteria) => {
    try {
      // Get target members based on criteria
      const targetMembers: Array<{ familyId: string; memberId: string; memberName: string }> = [];

      // If specific member IDs are provided, use them directly
      if (criteria.specificMemberIds && criteria.specificMemberIds.length > 0) {
        families.forEach(family => {
          family.members.forEach(member => {
            if (criteria.specificMemberIds!.includes(member.id)) {
              targetMembers.push({
                familyId: family.id,
                memberId: member.id,
                memberName: member.name
              });
            }
          });
        });
      } else {
        // Use filter-based targeting
        families.forEach(family => {
          // Filter by ward if specified
          if (criteria.wards && criteria.wards.length > 0 && !criteria.wards.includes(family.ward)) {
            return;
          }

          // Filter by specific family IDs if in select mode
          if (criteria.specificFamilyIds && criteria.specificFamilyIds.length > 0 && !criteria.specificFamilyIds.includes(family.id)) {
            return;
          }

          family.members.forEach(member => {
            // Filter by gender
            if (criteria.gender && criteria.gender !== 'All' && member.gender !== criteria.gender) {
              return;
            }

            // Filter by age range
            if (criteria.minAge && member.age < criteria.minAge) {
              return;
            }
            if (criteria.maxAge && member.age > criteria.maxAge) {
              return;
            }

            // Filter by role
            if (criteria.role === 'Head' && member.relation !== 'Head') {
              return;
            }
            if (criteria.role === 'Member' && member.relation === 'Head') {
              return;
            }

            targetMembers.push({
              familyId: family.id,
              memberId: member.id,
              memberName: member.name
            });
          });
        });
      }

      if (targetMembers.length === 0) {
        alert('No members match the selected criteria');
        return;
      }

      // Create payment for each target member
      const createdPayments: Payment[] = [];
      const today = new Date().toISOString().split('T')[0];

      for (const target of targetMembers) {
        const payment: Payment = {
          id: `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          familyId: target.familyId,
          memberId: target.memberId,
          memberName: target.memberName,
          amount,
          title,
          date: today,
          type: title,
          status: 'Pending'
        };

        const response = await fetch(`${API_BASE_URL}/data/payments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payment)
        });

        if (response.ok) {
          const created = await response.json();
          createdPayments.push(created);
        }
      }

      // Update local state
      setPayments([...payments, ...createdPayments]);
      alert(`Successfully created ${createdPayments.length} payment demands!`);

    } catch (error) {
      console.error('Error creating bulk payments:', error);
      alert('Failed to create bulk payments');
    }
  };

  const handleMarkPaymentPaid = async (paymentId: string) => {
    try {
      const payment = payments.find(p => p.id === paymentId);
      if (!payment) return;

      const response = await fetch(`${API_BASE_URL}/data/payments/${paymentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payment, status: 'Paid' })
      });

      if (response.ok) {
        const updatedPayment = await response.json();
        setPayments(payments.map(p => p.id === paymentId ? updatedPayment : p));
        alert('Payment marked as paid!');
      } else {
        throw new Error('Failed to update payment');
      }
    } catch (error) {
      console.error('Error updating payment:', error);
      alert('Failed to update payment');
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (!confirm('Are you sure you want to delete this payment? This cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/data/payments/${paymentId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        setPayments(payments.filter(p => p.id !== paymentId));
        alert('Payment deleted successfully!');
      } else {
        throw new Error('Failed to delete payment');
      }
    } catch (error) {
      console.error('Error deleting payment:', error);
      alert('Failed to delete payment');
    }
  };

  const handleAddMember = async (newMemberData: Omit<FamilyMember, 'id' | 'status' | 'familyId'>) => {
    try {
      if (!user?.familyId) {
        alert('Family not found');
        return;
      }

      const family = families.find(f => f.id === user.familyId);
      if (!family) {
        alert('Family not found');
        return;
      }

      // Create new member with pending status
      const newMember: FamilyMember = {
        ...newMemberData,
        id: `m_${Date.now()}`,
        status: Status.PENDING,
        familyId: user.familyId
      };

      const updatedMembers = [...family.members, newMember];

      const response = await fetch(`${API_BASE_URL}/data/families/${user.familyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...family, members: updatedMembers })
      });

      if (response.ok) {
        const updatedFamily = await response.json();
        setFamilies(families.map(f => f.id === user.familyId ? updatedFamily : f));
        alert('Member added successfully! Waiting for admin approval.');
      } else {
        throw new Error('Failed to add member');
      }
    } catch (error) {
      console.error('Error adding member:', error);
      alert('Failed to add member');
    }
  };
  const handleDeleteRequest = async (memberId: string) => {
    try {
      if (!user?.familyId) {
        alert('Family not found');
        return;
      }

      const family = families.find(f => f.id === user.familyId);
      if (!family) {
        alert('Family not found');
        return;
      }

      const confirmed = confirm('Are you sure you want to request deletion of this member?');
      if (!confirmed) return;

      // Mark member with deleteRequested flag instead of deleting
      const updatedMembers = family.members.map(m =>
        m.id === memberId ? { ...m, deleteRequested: true } : m
      );

      const response = await fetch(`${API_BASE_URL}/data/families/${user.familyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...family, members: updatedMembers })
      });

      if (response.ok) {
        const updatedFamily = await response.json();
        setFamilies(families.map(f => f.id === user.familyId ? updatedFamily : f));
        alert('Delete request sent to admin for approval!');
      } else {
        throw new Error('Failed to send delete request');
      }
    } catch (error) {
      console.error('Error sending delete request:', error);
      alert('Failed to send delete request');
    }
  };
  const handleSendFeedback = async (msg: string) => {
    try {
      const newFeedback: Feedback = {
        id: `fb_${Date.now()}`,
        familyId: user?.familyId || '',
        senderName: user?.name || 'Unknown',
        message: msg,
        date: new Date().toISOString().split('T')[0],
        isRead: false
      };

      const response = await fetch(`${API_BASE_URL}/data/feedbacks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newFeedback)
      });

      if (response.ok) {
        const createdFeedback = await response.json();
        setFeedbacks([...feedbacks, createdFeedback]);
        // Success message is already shown in FamilyDashboard component
      } else {
        throw new Error('Failed to send feedback');
      }
    } catch (error) {
      console.error('Error sending feedback:', error);
      alert('Failed to send feedback');
    }
  };

  // Handle admin tab changes - fetch data on demand
  const handleAdminTabChange = useCallback(async (tab: 'overview' | 'families' | 'payments' | 'announcements' | 'reports' | 'inbox') => {
    if (!token) return;

    try {
      switch (tab) {
        case 'overview':
          // Load families and payments for overview stats
          const [familiesRes, paymentsRes] = await Promise.all([
            fetch(`${API_BASE_URL}/data/families`, { headers: { Authorization: `Bearer ${token}` } }),
            fetch(`${API_BASE_URL}/data/payments`, { headers: { Authorization: `Bearer ${token}` } })
          ]);
          if (familiesRes.ok) setFamilies(await familiesRes.json());
          if (paymentsRes.ok) setPayments(await paymentsRes.json());
          break;
        case 'families':
          const familiesRes2 = await fetch(`${API_BASE_URL}/data/families`, { headers: { Authorization: `Bearer ${token}` } });
          if (familiesRes2.ok) setFamilies(await familiesRes2.json());
          break;
        case 'payments':
          const paymentsRes2 = await fetch(`${API_BASE_URL}/data/payments`, { headers: { Authorization: `Bearer ${token}` } });
          if (paymentsRes2.ok) setPayments(await paymentsRes2.json());
          break;
        case 'announcements':
          const announcementsRes = await fetch(`${API_BASE_URL}/data/announcements`, { headers: { Authorization: `Bearer ${token}` } });
          if (announcementsRes.ok) setAnnouncements(await announcementsRes.json());
          break;
        case 'inbox':
          const feedbacksRes = await fetch(`${API_BASE_URL}/data/feedbacks`, { headers: { Authorization: `Bearer ${token}` } });
          if (feedbacksRes.ok) setFeedbacks(await feedbacksRes.json());
          break;
        case 'reports':
          const logsRes = await fetch(`${API_BASE_URL}/data/logs`, { headers: { Authorization: `Bearer ${token}` } });
          if (logsRes.ok) setLogs(await logsRes.json());
          break;
      }
    } catch (error) {
      console.error('Error fetching tab data:', error);
    }
  }, [token]);

  // Handle member tab changes - fetch data on demand
  const handleMemberTabChange = useCallback(async (tab: 'home' | 'family' | 'payments' | 'support') => {
    if (!token) return;

    try {
      switch (tab) {
        case 'home':
          const announcementsRes = await fetch(`${API_BASE_URL}/data/announcements`, { headers: { Authorization: `Bearer ${token}` } });
          if (announcementsRes.ok) setAnnouncements(await announcementsRes.json());
          break;
        case 'family':
          const familiesRes = await fetch(`${API_BASE_URL}/data/families`, { headers: { Authorization: `Bearer ${token}` } });
          if (familiesRes.ok) setFamilies(await familiesRes.json());
          break;
        case 'payments':
          const paymentsRes = await fetch(`${API_BASE_URL}/data/payments`, { headers: { Authorization: `Bearer ${token}` } });
          if (paymentsRes.ok) setPayments(await paymentsRes.json());
          break;
      }
    } catch (error) {
      console.error('Error fetching tab data:', error);
    }
  }, [token]);


  // Show onboarding form for new users
  if (isOnboarding) {
    return (
      <OnboardingForm
        phone={onboardingPhone}
        onSubmit={handleRegister}
        onCancel={() => {
          setIsOnboarding(false);
          setOnboardingPhone('');
        }}
      />
    );
  }

  if (!user) {
    return (
      <Auth
        onLogin={handleLogin}
        onRegister={(phone, name, houseName, ward, age, gender) => {
          handleRegister({
            headName: name,
            address: houseName,
            ward: ward,
            age: age,
            gender: gender
          }, phone);
        }}
      />
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
        <nav className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <span className="text-xl font-bold text-emerald-700 tracking-tight">Modern Mahall</span>
                <span className="ml-3 px-2 py-0.5 rounded-full bg-gray-100 text-xs text-gray-600 font-medium hidden sm:inline-block">
                  {user.role === UserRole.ADMIN ? 'Admin Portal' : 'Member Portal'}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowNotificationInbox(true)}
                  className="p-2 text-gray-500 hover:text-emerald-600 transition-colors relative"
                >
                  <Bell className="w-5 h-5" />
                  {unreadNotificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                    </span>
                  )}
                </button>
                <button onClick={handleLogout} className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-red-600 transition-colors">
                  <span className="hidden sm:inline">Logout</span>
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={
              isLoading ? (
                <div className="flex flex-col items-center justify-center pt-20">
                  <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mb-4" />
                  <h2 className="text-xl font-bold">Loading Data...</h2>
                </div>
              ) : user?.role === UserRole.ADMIN ? (
                <AdminDashboard
                  families={families}
                  logs={logs}
                  announcements={announcements}
                  payments={payments}
                  feedbacks={feedbacks}
                  // All handlers are placeholders relying on future API integration tests
                  onApproveFamily={handleApproveFamily}
                  onApproveMember={handleApproveMember}
                  onRejectMember={handleRejectMember}
                  onEditMember={handleEditMember}
                  onCreateAnnouncement={handleCreateAnnouncement}
                  onDeleteAnnouncement={handleDeleteAnnouncement}
                  onBulkPaymentCreate={handleBulkPaymentCreate}
                  onCreatePayment={handleCreatePayment}
                  onMarkPaymentPaid={handleMarkPaymentPaid}
                  onDeletePayment={handleDeletePayment}
                  onTabChange={handleAdminTabChange}
                />
              ) : (
                currentUserFamily ? (
                  <FamilyDashboard
                    family={currentUserFamily}
                    announcements={announcements}
                    payments={payments}
                    currentUserName={user?.name}
                    isHead={user?.role === UserRole.HEAD}
                    onAddMember={handleAddMember}
                    onUpdateMember={(memberId, updates) => handleEditMember(currentUserFamily.id, memberId, updates)}
                    onDeleteRequest={handleDeleteRequest}
                    onSendFeedback={handleSendFeedback}
                    onTabChange={handleMemberTabChange}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center pt-20">
                    <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mb-4" />
                    <h2 className="text-xl font-bold">Setting up your dashboard...</h2>
                  </div>
                )
              )
            } />
          </Routes>
        </main>

        {/* Notification Components */}
        {user && (
          <>
            <NotificationManager
              userId={user.id}
              onUnreadCountChange={setUnreadNotificationCount}
            />
            {showNotificationInbox && (
              <NotificationInbox
                userId={user.id}
                onClose={() => setShowNotificationInbox(false)}
                onUnreadCountChange={setUnreadNotificationCount}
              />
            )}
          </>
        )}
      </div>
    </Router>
  );
};

export default App;