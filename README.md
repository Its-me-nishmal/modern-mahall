# Modern Mahall - Community Management System

A comprehensive full-stack application for managing mahall (community) operations, including family registration, member management, financial tracking, and digital communication.

## 🚀 Features

### 👨‍👩‍👧‍👦 Family & Member Management
- **Digital Registry:** Complete family profiles with ward-based organization
- **Member Details:** Track relationships, education, occupation, and blood groups
- **Ration Card Tracking:** Manage APL/BPL/AAY/PHH status
- **Admin Approval:** Workflow for verifying new families and members

### 💰 Financial Management
- **Payment Tracking:** Record and monitor community contributions
- **Reports:** Generate financial statements (PDF/Excel)
- **Status Monitoring:** Track paid vs. pending dues
- **Bulk Operations:** Create payment requests for multiple families

### 📢 Communication & Notifications
- **Announcements:** Targeted broadcasting based on age, gender, or ward
- **Push Notifications:** Real-time updates for members
- **Inbox:** Digital notification center for families
- **Feedback:** Two-way communication channel

### 📊 Admin Dashboard
- **Analytics:** Visual charts for demographics and payments
- **Reporting:** Export member directories and financial data
- **Management:** comprehensive tools for all administrative tasks

## 🛠 Technology Stack

- **Frontend:** React 19, TypeScript, Vite, TailwindCSS
- **Backend:** Node.js, Express, File-based Database
- **Services:** Web Push (Notifications), PDFKit/ExcelJS (Reporting)
- **Security:** OTP Authentication, Role-based Access Control

## 🏁 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd modern-mahall
   ```

2. **Install Frontend Dependencies**
   ```bash
   npm install
   ```

3. **Install Backend Dependencies**
   ```bash
   cd backend
   npm install
   ```

### Configuration

1. **Backend Setup**
   Create `backend/.env`:
   ```env
   PORT=3001
   DB_SYSTEM=filedb
   ADMIN_MOBILE=<admin_phone_number>
   VAPID_PUBLIC_KEY=<generated_key>
   VAPID_PRIVATE_KEY=<generated_key>
   ```

2. **Frontend Setup**
   Create `.env.local` in root:
   ```env
   VITE_BACKEND_URL=http://localhost:3001
   VITE_VAPID_PUBLIC_KEY=<same_as_backend>
   ```

### Running the App

1. **Start Backend Server**
   ```bash
   cd backend
   npm run server
   ```

2. **Start Frontend Client** (in a new terminal)
   ```bash
   # from root directory
   npm run dev
   ```

## 📚 Documentation
- [Project Overview](.gemini/antigravity/brain/f5a3c84e-a4ff-4aaa-aa81-59e922432da3/project_overview.md)
- [API Documentation](.gemini/antigravity/brain/f5a3c84e-a4ff-4aaa-aa81-59e922432da3/api_documentation.md)
