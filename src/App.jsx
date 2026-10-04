import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
import AdminFines from "@/pages/admin/FinesPayments";
import AdminIssues from "@/pages/admin/AdminIssues";
import AdminLiveTracking from "@/pages/admin/AdminLiveTracking";
import AdminReports from "@/pages/admin/AdminReports";
import AdminAttendance from "@/pages/admin/AdminAttendance";

import StudentLayout from "@/components/shared/StudentLayout";
import StudentHome from "@/pages/student/Home";
import StudentTransport from "@/pages/student/Transport";
import StudentAttendance from "@/pages/student/Attendance";
import StudentPayments from "@/pages/student/Payments";
import StudentAnnouncements from "@/pages/student/AnnouncementsPage";
import StudentNotifications from "@/pages/student/NotificationsPage";
import StudentRules from "@/pages/student/Rules";
import StudentReportIssue from "@/pages/student/ReportIssue";
import StudentHelp from "@/pages/student/HelpSupport";
import StudentProfile from "@/pages/student/Profile";

import ConductorLayout from "@/components/shared/ConductorLayout";
import ConductorScanner from "@/pages/conductor/Scanner";

import DriverLayout from "@/components/shared/DriverLayout";
import DriverDashboard from "@/pages/driver/Dashboard";

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
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
            <Route path="fines" element={<AdminFines />} />
            <Route path="issues" element={<AdminIssues />} />
            <Route path="tracking" element={<AdminLiveTracking />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="attendance" element={<AdminAttendance />} />
          </Route>

          <Route
            path="/student"
            element={
              <ProtectedRoute roles={["DAY_SCHOLAR", "HOSTELITE"]}>
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
      </BrowserRouter>
      <Toaster />
    </ThemeProvider>
  );
}

export default App;
