import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/shared/ThemeProvider";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";

import Login from "@/pages/auth/Login";
import Unauthorized from "@/pages/auth/Unauthorized";

import AdminLayout from "@/components/shared/AdminLayout";
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminStudents from "@/pages/admin/Students";
import AdminStaff from "@/pages/admin/Staff";
import AdminFleet from "@/pages/admin/Fleet";
import AdminRoutes from "@/pages/admin/Routes";
import AdminAnnouncements from "@/pages/admin/Announcements";
import AdminSettings from "@/pages/admin/Settings";
import AdminIssues from "@/pages/admin/AdminIssues";
const AdminLiveTracking = lazy(() => import("@/pages/admin/AdminLiveTracking"));
import AdminReports from "@/pages/admin/AdminReports";
import AdminAttendance from "@/pages/admin/AdminAttendance";
import AdminApprovals from "@/pages/admin/Approvals";
import BookingRequests from "@/pages/admin/BookingRequests";
import ViolationsCenter from "@/pages/admin/ViolationsCenter";
import ScanLogs from "@/pages/admin/ScanLogs";
import NotificationCenter from "@/pages/admin/NotificationCenter";
import HostelBilling from "@/pages/admin/HostelBilling";

import StudentLayout from "@/components/shared/StudentLayout";
import StudentHome from "@/pages/student/Home";
const StudentTransport = lazy(() => import("@/pages/student/Transport"));
import StudentAttendance from "@/pages/student/Attendance";
import StudentPayments from "@/pages/student/Payments";
import StudentAnnouncements from "@/pages/student/AnnouncementsPage";
import StudentNotifications from "@/pages/student/NotificationsPage";
import StudentRules from "@/pages/student/Rules";
import StudentReportIssue from "@/pages/student/ReportIssue";
import StudentHelp from "@/pages/student/HelpSupport";
import StudentProfile from "@/pages/student/Profile";
import StudentSemesterRegistration from "@/pages/student/SemesterRegistration";
import HosteliteBookings from "@/pages/student/HosteliteBookings";
import StudentTickets from "@/pages/student/Tickets";
import StudentViolationFines from "@/pages/student/ViolationFines";
import { useAuthStore } from "@/store/useAuthStore";

import ConductorLayout from "@/components/shared/ConductorLayout";
const ConductorScanner = lazy(() => import("@/pages/conductor/Scanner"));
import ConductorViolations from "@/pages/conductor/Violations";
import NotifyAdmin from "@/pages/conductor/NotifyAdmin";

import DriverLayout from "@/components/shared/DriverLayout";
import DriverDashboard from "@/pages/driver/Dashboard";

function StudentTicketsPage() {
  const role = useAuthStore((state) => state.user?.role);
  return role === "HOSTELITE" ? <HosteliteBookings /> : <StudentTickets />;
}

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Suspense fallback={<div role="status" className="p-6 text-center text-sm text-muted-foreground">Loading transport portal…</div>}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/403" element={<Unauthorized />} />

          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={["ADMIN"]}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="students" element={<AdminStudents />} />
            <Route path="staff" element={<AdminStaff />} />
            <Route path="fleet" element={<AdminFleet />} />
            <Route path="routes" element={<AdminRoutes />} />
            <Route path="announcements" element={<AdminAnnouncements />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="fines" element={<Navigate to="/admin/approvals" replace />} />
            <Route path="issues" element={<AdminIssues />} />
            <Route path="tracking" element={<AdminLiveTracking />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="attendance" element={<AdminAttendance />} />
            <Route path="approvals" element={<AdminApprovals />} />
            <Route path="booking-requests" element={<BookingRequests />} />
            <Route path="violations" element={<ViolationsCenter />} />
            <Route path="scan-logs" element={<ScanLogs />} />
            <Route path="notifications" element={<NotificationCenter />} />
            <Route path="hostel-billing" element={<HostelBilling />} />
          </Route>

          <Route
            path="/student"
            element={
              <ProtectedRoute roles={["DAY_SCHOLAR", "HOSTELITE", "FACULTY"]}>
                <StudentLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<StudentHome />} />
            <Route path="transport" element={<StudentTransport />} />
            <Route path="attendance" element={<StudentAttendance />} />
            <Route path="payments" element={<StudentPayments />} />
            <Route path="announcements" element={<StudentAnnouncements />} />
            <Route path="notifications" element={<StudentNotifications />} />
            <Route path="rules" element={<StudentRules />} />
            <Route path="report-issue" element={<StudentReportIssue />} />
            <Route path="help" element={<StudentHelp />} />
            <Route path="profile" element={<StudentProfile />} />
            <Route path="semester" element={<StudentSemesterRegistration />} />
            <Route path="tickets" element={<StudentTicketsPage />} />
            <Route path="violations" element={<StudentViolationFines />} />
          </Route>

          <Route
            path="/conductor"
            element={
              <ProtectedRoute roles={["CONDUCTOR"]}>
                <ConductorLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<ConductorScanner />} />
            <Route path="violations" element={<ConductorViolations />} />
            <Route path="notify" element={<NotifyAdmin />} />
          </Route>

          <Route
            path="/driver"
            element={
              <ProtectedRoute roles={["DRIVER"]}>
                <DriverLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DriverDashboard />} />
          </Route>

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        </Suspense>
      </BrowserRouter>
      <Toaster />
    </ThemeProvider>
  );
}

export default App;
