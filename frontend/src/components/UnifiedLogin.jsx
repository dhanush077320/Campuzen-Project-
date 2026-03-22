import React, { useState } from 'react';
import {
    Box, TextField, Paper, Button, MenuItem, Select, InputLabel,
    FormControl, Typography, AppBar, Toolbar, Container, Grid,
    Fade, CircularProgress, InputAdornment
} from '@mui/material';
import {
    AccountCircle, Lock, Login as LoginIcon,
    ChevronRight, School
} from '@mui/icons-material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import BackgroundImage from '../assets/student.png';
import Logo from '../assets/logo2.png';

const UnifiedLogin = () => {
    const [role, setRole] = useState('student');
    const [id, setId] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await axios.post(`http://localhost:5000/login/${role}`, { id, password });
            if (response.status === 200) {
                localStorage.setItem('user', JSON.stringify(response.data.user));
                navigate(`/${role}-dashboard`);
            }
        } catch (error) {
            alert(error.response?.data?.message || "Invalid Credentials");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{
            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.6)), url(${BackgroundImage})`,
            minHeight: '100vh',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed',
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* --- NAVBAR --- */}
            <AppBar position="static" sx={{ backgroundColor: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(10px)', elevation: 0 }}>
                <Toolbar sx={{ justifyContent: 'space-between', height: '80px', px: { md: 8 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <img src={Logo} alt="Logo" style={{ height: '60px', filter: 'brightness(1.2)' }} />
                        <Typography variant="h5" sx={{ color: 'white', fontWeight: '800', fontFamily: '"Times New Roman", serif', letterSpacing: '2px' }}>
                            CampuZen
                        </Typography>
                    </Box>
                    <Button color="inherit" sx={{ fontWeight: 'bold', fontFamily: '"Times New Roman", serif', borderBottom: '2px solid #3017d1' }}>
                        Home
                    </Button>
                </Toolbar>
            </AppBar>

            <Container maxWidth="xl" sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', py: 5 }}>
                <Grid container spacing={2} sx={{ alignItems: 'center' }}>

                    <Grid size={{ xs: 12, md: 7 }} sx={{ textAlign: { xs: 'center', md: 'left' } }}>
                        <Fade in timeout={1000}>
                            <Box>
                                <Typography variant="h1" sx={{
                                    color: 'white', fontWeight: '900',
                                    fontSize: { xs: '3rem', md: '4.5rem' },
                                    textShadow: '0 4px 20px rgba(0,0,0,0.4)',
                                    mb: 2
                                }}>
                                    Smart Campus <br />
                                    <span style={{ color: '#4dabf5' }}>Simplified.</span>
                                </Typography>
                                <Typography variant="h5" sx={{ color: 'rgba(255,255,255,0.8)', maxWidth: '500px', lineHeight: 1.6 }}>
                                    Your all-in-one portal for academic tracking,
                                    attendance, and institutional communication.
                                </Typography>
                            </Box>
                        </Fade>
                    </Grid>

                    <Grid size={{ xs: 12, md: 5 }} sx={{ display: 'flex', justifyContent: { xs: 'center', md: 'flex-end' } }}>
                        <Fade in timeout={1500}>
                            <Paper elevation={0} sx={{
                                p: { xs: 4, md: 6 },
                                borderRadius: '24px',
                                width: '100%',
                                maxWidth: '460px',
                                backgroundColor: 'rgba(255, 255, 255, 0.12)',
                                backdropFilter: 'blur(20px) saturate(180%)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
                                textAlign: 'center'
                            }}>
                                <Typography variant="h4" sx={{
                                    fontWeight: '700', mb: 1, color: 'white',
                                    textShadow: '0 2px 10px rgba(0,0,0,0.2)'
                                }}>
                                    CampuZen Login
                                </Typography>
                                <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.7)', mb: 4 }}>
                                    Sign in to access your dashboard
                                </Typography>

                                <Box component="form" method="POST" id="unified-login-form" onSubmit={handleLogin} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

                                    <FormControl fullWidth variant="filled" sx={{
                                        backgroundColor: 'rgba(255,255,255,0.1)',
                                        borderRadius: '12px',
                                        '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' },
                                        '& .MuiInputBase-root': { color: 'white' }
                                    }}>
                                        <InputLabel>Login Role</InputLabel>
                                        <Select
                                            value={role}
                                            label="Login Role"
                                            name="role"
                                            id="role-select"
                                            onChange={(e) => setRole(e.target.value)}
                                            disableUnderline
                                            sx={{ textAlign: 'left' }}
                                        >
                                            <MenuItem value="student">Student</MenuItem>
                                            <MenuItem value="teacher">Teacher</MenuItem>
                                            <MenuItem value="college">College</MenuItem>
                                            <MenuItem value="parent">Parent</MenuItem>
                                            <MenuItem value="staff">Staff</MenuItem>
                                        </Select>
                                    </FormControl>

                                    <TextField
                                        label="Identification ID"
                                        variant="filled"
                                        fullWidth
                                        id="id"
                                        name="id"
                                        autoComplete="username"
                                        value={id}
                                        required
                                        onChange={(e) => setId(e.target.value)}
                                        slotProps={{
                                            input: {
                                                disableUnderline: true,
                                                startAdornment: <InputAdornment position="start"><AccountCircle sx={{ color: 'white' }} /></InputAdornment>,
                                                sx: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white' }
                                            },
                                            inputLabel: { sx: { color: 'rgba(255,255,255,0.7)' } }
                                        }}
                                    />

                                    <TextField
                                        label="Password"
                                        type="password"
                                        variant="filled"
                                        fullWidth
                                        id="password"
                                        name="password"
                                        autoComplete="current-password"
                                        value={password}
                                        required
                                        onChange={(e) => setPassword(e.target.value)}
                                        slotProps={{
                                            input: {
                                                disableUnderline: true,
                                                startAdornment: <InputAdornment position="start"><Lock sx={{ color: 'white' }} /></InputAdornment>,
                                                sx: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white' }
                                            },
                                            inputLabel: { sx: { color: 'rgba(255,255,255,0.7)' } }
                                        }}
                                    />

                                    <Button
                                        variant="contained"
                                        type="submit"
                                        size="large"
                                        disabled={loading}
                                        sx={{
                                            py: 2,
                                            borderRadius: '12px',
                                            backgroundColor: '#3017d1',
                                            fontWeight: 'bold',
                                            fontSize: '1.1rem',
                                            textTransform: 'none',
                                            boxShadow: '0 10px 20px rgba(48, 23, 209, 0.3)',
                                            '&:hover': { backgroundColor: '#4527f6', transform: 'translateY(-2px)' },
                                            transition: 'all 0.3s ease'
                                        }}
                                    >
                                        {loading ? <CircularProgress size={24} color="inherit" /> : 'Enter Portal'}
                                    </Button>
                                </Box>
                            </Paper>
                        </Fade>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
};

export default UnifiedLogin;