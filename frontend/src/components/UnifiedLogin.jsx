import React, { useState, useEffect } from 'react';
import {
    Box, TextField, Button, MenuItem, Select,
    Typography, Grid, Fade, CircularProgress, 
    InputAdornment, Stack, useMediaQuery, useTheme
} from '@mui/material';
import {
    AccountCircle, Lock, Login as LoginIcon,
    ArrowForward, VerifiedUser, Speed, Security,
    Groups
} from '@mui/icons-material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Logo from '../assets/logo2.png';
import CampusBg from '../assets/campus_login_bg.png';

const dark = {
    bg: '#050a14',
    formBg: '#050a14',
    accent: '#6366f1', // Indigo/Purple accent from design
    text: '#ffffff',
    textSecondary: '#94a3b8',
    inputBg: 'rgba(15, 23, 42, 0.6)',
    border: 'rgba(255,255,255,0.08)'
};

const UnifiedLogin = () => {
    const [role, setRole] = useState('student');
    const [id, setId] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [slowMessage, setSlowMessage] = useState(false);
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_URL}/`).catch(() => {});
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setSlowMessage(false);
        const timer = setTimeout(() => setSlowMessage(true), 5000);
        try {
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/login/${role}`, { id, password });
            if (response.status === 200) {
                clearTimeout(timer);
                localStorage.setItem('user', JSON.stringify(response.data.user));
                navigate(`/${role}-dashboard`);
            }
        } catch (error) {
            alert(error.response?.data?.message || "Invalid Credentials");
        } finally {
            clearTimeout(timer);
            setLoading(false);
            setSlowMessage(false);
        }
    };

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: dark.bg }}>
            <Grid container>
                {/* --- Left Pane: Campus Visuals (Hidden on Mobile) --- */}
                {!isMobile && (
                    <Grid item md={6} sx={{ 
                        position: 'relative',
                        backgroundImage: `linear-gradient(rgba(5, 10, 20, 0.75), rgba(5, 10, 20, 0.9)), url("${CampusBg}")`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        p: 8,
                        '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0, left: 0, right: 0, bottom: 0,
                            background: 'radial-gradient(circle at 20% 30%, rgba(99, 102, 241, 0.15), transparent 50%)',
                            pointerEvents: 'none'
                        }
                    }}>
                        {/* Logo & Header */}
                        <Box>
                            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 8 }}>
                                <img src={Logo} alt="Logo" style={{ height: '40px' }} />
                                <Typography variant="h5" sx={{ color: 'white', fontWeight: 900, letterSpacing: '1px' }}>
                                    CampuZen
                                </Typography>
                            </Stack>

                            <Fade in timeout={1000}>
                                <Box>
                                    <Typography variant="h1" sx={{ 
                                        color: 'white', 
                                        fontWeight: 900, 
                                        fontSize: '4.5rem', 
                                        lineHeight: 1.1,
                                        mb: 3
                                    }}>
                                        Smart Campus.<br />
                                        <span style={{ color: '#818cf8', opacity: 0.9 }}>Fully Reimagined.</span>
                                    </Typography>
                                    <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.1rem', maxWidth: '500px', lineHeight: 1.6 }}>
                                        The next generation of educational management. Seamless tracking, 
                                        instant communication, and secure data forensics—all in one place.
                                    </Typography>
                                </Box>
                            </Fade>
                        </Box>

                        {/* Features Footer */}
                        <Stack direction="row" spacing={6}>
                            <Box>
                                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                                    <VerifiedUser sx={{ color: '#818cf8', fontSize: 20 }} />
                                    <Typography sx={{ color: 'white', fontWeight: 800, fontSize: '0.9rem' }}>Certified Access</Typography>
                                </Stack>
                                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>Enterprise-grade security</Typography>
                            </Box>
                            <Box>
                                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                                    <Speed sx={{ color: '#818cf8', fontSize: 20 }} />
                                    <Typography sx={{ color: 'white', fontWeight: 800, fontSize: '0.9rem' }}>Ultra-Fast</Typography>
                                </Stack>
                                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>Real-time synchronization</Typography>
                            </Box>
                            <Box>
                                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                                    <Security sx={{ color: '#818cf8', fontSize: 20 }} />
                                    <Typography sx={{ color: 'white', fontWeight: 800, fontSize: '0.9rem' }}>End-to-End</Typography>
                                </Stack>
                                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>Data privacy guaranteed</Typography>
                            </Box>
                        </Stack>
                    </Grid>
                )}

                {/* --- Right Pane: Login Form --- */}
                <Grid item xs={12} md={6} sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    bgcolor: dark.formBg,
                    p: 4
                }}>
                    <Fade in timeout={1500}>
                        <Box sx={{ width: '100%', maxWidth: '420px', textAlign: 'center' }}>
                            <Typography variant="h3" sx={{ color: 'white', fontWeight: 900, mb: 1.5 }}>
                                Welcome Back
                            </Typography>
                            <Typography sx={{ color: dark.textSecondary, mb: 6 }}>
                                Access your personalized dashboard below.
                            </Typography>

                            <Box component="form" onSubmit={handleLogin} sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                
                                {/* User Perspective / Role Select */}
                                <Box sx={{ textAlign: 'left' }}>
                                    <Typography variant="caption" sx={{ color: dark.textSecondary, fontWeight: 700, ml: 1, mb: 1, display: 'block', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                        User Perspective
                                    </Typography>
                                    <Select
                                        fullWidth
                                        value={role}
                                        onChange={(e) => setRole(e.target.value)}
                                        startAdornment={<InputAdornment position="start"><Groups sx={{ color: dark.accent, ml: 1 }} /></InputAdornment>}
                                        sx={{ 
                                            bgcolor: dark.inputBg, 
                                            borderRadius: '12px',
                                            color: 'white',
                                            '& .MuiOutlinedInput-notchedOutline': { borderColor: dark.border },
                                            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
                                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: dark.accent },
                                            '& .MuiSelect-select': { py: 2 }
                                        }}
                                    >
                                        <MenuItem value="student">Student</MenuItem>
                                        <MenuItem value="teacher">Teacher</MenuItem>
                                        <MenuItem value="college">College Admin</MenuItem>
                                        <MenuItem value="parent">Parent</MenuItem>
                                        <MenuItem value="staff">Staff</MenuItem>
                                        <MenuItem value="driver">Driver</MenuItem>
                                    </Select>
                                </Box>

                                {/* ID Field */}
                                <Box sx={{ textAlign: 'left' }}>
                                    <Typography variant="caption" sx={{ color: dark.textSecondary, fontWeight: 700, ml: 1, mb: 1, display: 'block', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                        Identification Identifier *
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        value={id}
                                        onChange={(e) => setId(e.target.value)}
                                        required
                                        InputProps={{
                                            startAdornment: <InputAdornment position="start"><AccountCircle sx={{ color: dark.accent, ml: 1 }} /></InputAdornment>,
                                            sx: { 
                                                bgcolor: dark.inputBg, 
                                                borderRadius: '12px',
                                                color: 'white',
                                                '& .MuiOutlinedInput-notchedOutline': { borderColor: dark.border },
                                                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
                                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: dark.accent },
                                                py: 0.5
                                            }
                                        }}
                                    />
                                </Box>

                                {/* Password Field */}
                                <Box sx={{ textAlign: 'left' }}>
                                    <Typography variant="caption" sx={{ color: dark.textSecondary, fontWeight: 700, ml: 1, mb: 1, display: 'block', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                        Secure Password *
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        InputProps={{
                                            startAdornment: <InputAdornment position="start"><Lock sx={{ color: dark.accent, ml: 1 }} /></InputAdornment>,
                                            sx: { 
                                                bgcolor: dark.inputBg, 
                                                borderRadius: '12px',
                                                color: 'white',
                                                '& .MuiOutlinedInput-notchedOutline': { borderColor: dark.border },
                                                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
                                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: dark.accent },
                                                py: 0.5
                                            }
                                        }}
                                    />
                                </Box>

                                <Button
                                    fullWidth
                                    type="submit"
                                    disabled={loading}
                                    sx={{
                                        mt: 2,
                                        py: 2,
                                        borderRadius: '12px',
                                        bgcolor: dark.accent,
                                        color: 'white',
                                        fontWeight: 900,
                                        fontSize: '1rem',
                                        textTransform: 'none',
                                        transition: 'all 0.3s ease',
                                        '&:hover': {
                                            bgcolor: '#4f46e5',
                                            boxShadow: `0 0 20px ${dark.accent}66`
                                        }
                                    }}
                                >
                                    {loading ? (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            <CircularProgress size={20} color="inherit" />
                                            {slowMessage && <Typography variant="caption">Warming server...</Typography>}
                                        </Box>
                                    ) : (
                                        <Stack direction="row" alignItems="center" spacing={1}>
                                            <span>Enter Portal</span>
                                            <ArrowForward sx={{ fontSize: 20 }} />
                                        </Stack>
                                    )}
                                </Button>

                                <Typography variant="caption" sx={{ mt: 8, color: 'rgba(255,255,255,0.2)', fontWeight: 600 }}>
                                    © 2026 CampuZen Education Solutions. All Rights Reserved.
                                </Typography>
                            </Box>
                        </Box>
                    </Fade>
                </Grid>
            </Grid>
        </Box>
    );
};

export default UnifiedLogin;