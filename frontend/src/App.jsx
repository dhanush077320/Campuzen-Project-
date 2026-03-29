import React from 'react';
import UnifiedLogin from './components/UnifiedLogin.jsx';
import CollegeDashboard from './components/CollegeDashboard.jsx';
import StudentDashboard from './components/StudentDashboard.jsx';
import TeacherDashboard from './components/TeacherDashboard.jsx';
import ParentDashboard from './components/ParentDashboard.jsx';
import StaffDashboard from './components/StaffDashboard.jsx';
import DriverDashboard from './components/DriverDashboard.jsx';
import { Route, Routes } from 'react-router-dom';
import { CssBaseline, GlobalStyles, ThemeProvider, createTheme } from '@mui/material';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#020508'
    }
  }
});

const App = () => {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <GlobalStyles styles={{ body: { margin: 0, padding: 0, backgroundColor: '#020508' }, '#root': { margin: 0, padding: 0, width: '100%', height: '100%' } }} />
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
    </ThemeProvider>
  );
};

export default App
