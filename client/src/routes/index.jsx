import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import ProtectedRoute from './ProtectedRoute.jsx';
import RoleRoute from './RoleRoute.jsx';

// Layouts
import AuthLayout from '../layouts/AuthLayout.jsx';
import PatientLayout from '../layouts/PatientLayout.jsx';
import DoctorLayout from '../layouts/DoctorLayout.jsx';

// Auth Pages
import LandingPage from '../pages/auth/LandingPage.jsx';
import LoginPage from '../pages/auth/LoginPage.jsx';
import PatientRegisterPage from '../pages/auth/PatientRegisterPage.jsx';
import DoctorRegisterPage from '../pages/auth/DoctorRegisterPage.jsx';
import UnauthorizedPage from '../pages/auth/UnauthorizedPage.jsx';
import NotFoundPage from '../pages/auth/NotFoundPage.jsx';

// Patient Pages
import PatientDashboard from '../pages/patient/PatientDashboard.jsx';
import FindDoctorsPage from '../pages/patient/FindDoctorsPage.jsx';
import DoctorDetailPage from '../pages/patient/DoctorDetailPage.jsx';
import BookAppointmentPage from '../pages/patient/BookAppointmentPage.jsx';
import MyAppointmentsPage from '../pages/patient/MyAppointmentsPage.jsx';
import PatientNotificationsPage from '../pages/patient/PatientNotificationsPage.jsx';
import PatientProfilePage from '../pages/patient/PatientProfilePage.jsx';

// Doctor Pages
import DoctorDashboard from '../pages/doctor/DoctorDashboard.jsx';
import TodaysPatientsPage from '../pages/doctor/TodaysPatientsPage.jsx';
import AllAppointmentsPage from '../pages/doctor/AllAppointmentsPage.jsx';
import WeeklySchedulePage from '../pages/doctor/WeeklySchedulePage.jsx';
import ScheduleExceptionsPage from '../pages/doctor/ScheduleExceptionsPage.jsx';
import DoctorNotificationsPage from '../pages/doctor/DoctorNotificationsPage.jsx';
import DoctorProfilePage from '../pages/doctor/DoctorProfilePage.jsx';

const router = createBrowserRouter([
  // Public routes
  { path: '/', element: <LandingPage /> },
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register/patient', element: <PatientRegisterPage /> },
      { path: '/register/doctor', element: <DoctorRegisterPage /> },
    ],
  },
  { path: '/unauthorized', element: <UnauthorizedPage /> },

  // Protected Patient Routes
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <RoleRoute role="patient" />,
        children: [
          {
            element: <PatientLayout />,
            children: [
              { path: '/patient/dashboard', element: <PatientDashboard /> },
              { path: '/patient/doctors', element: <FindDoctorsPage /> },
              { path: '/patient/doctors/:id', element: <DoctorDetailPage /> },
              { path: '/patient/book/:doctorId', element: <BookAppointmentPage /> },
              { path: '/patient/appointments', element: <MyAppointmentsPage /> },
              { path: '/patient/notifications', element: <PatientNotificationsPage /> },
              { path: '/patient/profile', element: <PatientProfilePage /> },
            ],
          },
        ],
      },

      // Protected Doctor Routes
      {
        element: <RoleRoute role="doctor" />,
        children: [
          {
            element: <DoctorLayout />,
            children: [
              { path: '/doctor/dashboard', element: <DoctorDashboard /> },
              { path: '/doctor/today', element: <TodaysPatientsPage /> },
              { path: '/doctor/appointments', element: <AllAppointmentsPage /> },
              { path: '/doctor/schedule', element: <WeeklySchedulePage /> },
              { path: '/doctor/schedule/exceptions', element: <ScheduleExceptionsPage /> },
              { path: '/doctor/notifications', element: <DoctorNotificationsPage /> },
              { path: '/doctor/profile', element: <DoctorProfilePage /> },
            ],
          },
        ],
      },
    ],
  },

  // 404
  { path: '*', element: <NotFoundPage /> },
]);

export default function AppRoutes() {
  return <RouterProvider router={router} />;
}
