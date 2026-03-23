import React from 'react';
import UnifiedLogin from './components/UnifiedLogin.jsx';
import CollegeDashboard from './components/CollegeDashboard.jsx';
import StudentDashboard from './components/StudentDashboard.jsx';
import TeacherDashboard from './components/TeacherDashboard.jsx';
import ParentDashboard from './components/ParentDashboard.jsx';
import StaffDashboard from './components/StaffDashboard.jsx';
import DriverDashboard from './components/DriverDashboard.jsx';
import { Route, Routes } from 'react-router-dom';

const App = () => {
  return (
    <div>
      <Routes>
        <Route path='/' element={<UnifiedLogin />} />
        <Route path='/login' element={<UnifiedLogin />} />
        <Route path='/college-dashboard' element={<CollegeDashboard />} />
        <Route path='/student-dashboard' element={<StudentDashboard />} />
        <Route path='/teacher-dashboard' element={<TeacherDashboard />} />
        <Route path='/parent-dashboard' element={<ParentDashboard />} />
        <Route path='/staff-dashboard' element={<StaffDashboard />} />
        <Route path='/driver-dashboard' element={<DriverDashboard />} />
      </Routes>
    </div>
  );
};

export default App
