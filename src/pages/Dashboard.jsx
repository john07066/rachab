import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import QRCode from 'react-qr-code';
import { LogOut, User, Building, Phone } from 'lucide-react';

export default function Dashboard() {
    const { user, profile } = useAuth();
    const navigate = useNavigate();

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    if (!profile) return null;

    return (
        <div className="container" style={{ paddingTop: '3rem', paddingBottom: '3rem' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                <h1 className="text-gradient">Member Dashboard</h1>
                <button onClick={handleSignOut} className="btn btn-secondary">
                    <LogOut size={18} /> Sign Out
                </button>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>

                {/* Profile Card */}
                <div className="glass-panel animate-fade-in">
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                        <User size={24} color="var(--primary)" /> Profile Details
                    </h2>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label>Full Name</label>
                            <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>{profile.full_name}</div>
                        </div>

                        <div>
                            <label>Email</label>
                            <div>{profile.email}</div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Phone size={18} color="var(--text-muted)" />
                            <span>{profile.phone_number || 'N/A'}</span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Building size={18} color="var(--text-muted)" />
                            <span>{profile.chapter || 'N/A'}</span>
                        </div>

                        {profile.is_first_timer && (
                            <div style={{
                                marginTop: '1rem',
                                padding: '0.5rem 1rem',
                                background: 'rgba(236, 72, 153, 0.2)',
                                color: 'var(--secondary)',
                                borderRadius: '8px',
                                fontWeight: 600,
                                display: 'inline-block',
                                width: 'fit-content'
                            }}>
                                Welcome First Timer! 🎉
                            </div>
                        )}

                        {profile.is_admin && (
                            <button
                                onClick={() => navigate('/admin')}
                                className="btn btn-primary"
                                style={{ marginTop: '1rem', width: 'fit-content' }}
                            >
                                Go to Admin Dashboard
                            </button>
                        )}
                    </div>
                </div>

                {/* QR Code Card */}
                <div className="glass-panel animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                    <h2 style={{ marginBottom: '0.5rem' }}>Your Entry Pass</h2>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
                        Present this QR code at the entrance to mark your attendance.
                    </p>

                    <div style={{
                        background: 'white',
                        padding: '1rem',
                        borderRadius: '16px',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
                    }}>
                        <QRCode
                            value={profile.id}
                            size={200}
                            level="H"
                        />
                    </div>
                </div>

            </div>
        </div>
    );
}
