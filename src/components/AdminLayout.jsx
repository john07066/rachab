import { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { LayoutDashboard, Users, UserPlus, QrCode, ClipboardList, LogOut, CloudOff, RefreshCw } from 'lucide-react';
import { getPendingAttendance, removePendingAttendance } from '../lib/indexedDB';

export default function AdminLayout() {
    const { profile } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [pendingCount, setPendingCount] = useState(0);
    const [syncing, setSyncing] = useState(false);

    useEffect(() => {
        checkPending();
        // Check periodically
        const interval = setInterval(checkPending, 5000);
        return () => clearInterval(interval);
    }, []);

    const checkPending = async () => {
        const pending = await getPendingAttendance();
        setPendingCount(pending.length);
    };

    const handleSync = async () => {
        if (!window.navigator.onLine) {
            alert("You are currently offline.");
            return;
        }

        setSyncing(true);
        try {
            const records = await getPendingAttendance();
            if (records.length === 0) return;

            let successCount = 0;
            let errorCount = 0;

            for (const record of records) {
                const { id, timestamp, ...dataToInsert } = record;
                const { error } = await supabase.from('attendance').insert([dataToInsert]);

                // Error 23505 is unique constraint violation (already marked), we can safely delete
                if (!error || error.code === '23505') {
                    await removePendingAttendance(id);
                    successCount++;
                } else {
                    console.error("Failed to sync record", record, error);
                    errorCount++;
                }
            }

            await checkPending();

            if (errorCount > 0) {
                alert(`Synced ${successCount} records, but ${errorCount} failed. Please try again later.`);
            } else {
                alert(`Successfully synced ${successCount} attendance records!`);
            }

        } catch (err) {
            console.error("Sync error", err);
            alert("An error occurred while syncing.");
        } finally {
            setSyncing(false);
        }
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    const navItems = [
        { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/admin/members', label: 'Members', icon: Users },
        { path: '/admin/first-timers', label: 'First Timers', icon: UserPlus },
        { path: '/admin/scan', label: 'Scan QR', icon: QrCode },
        { path: '/admin/manual', label: 'Manual Entry', icon: ClipboardList },
    ];

    if (!profile?.is_admin) return null;

    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            {/* Sidebar */}
            <aside style={{
                width: '280px',
                background: 'var(--bg-card)',
                backdropFilter: 'blur(12px)',
                borderRight: '1px solid var(--glass-border)',
                padding: '2rem 1.5rem',
                display: 'flex',
                flexDirection: 'column',
            }}>
                <div style={{ marginBottom: '3rem' }}>
                    <h2 className="text-gradient" style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Admin Portal</h2>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{profile.full_name}</div>
                </div>

                <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', flex: 1 }}>
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;

                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    padding: '1rem',
                                    borderRadius: '12px',
                                    background: isActive ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                                    color: isActive ? 'white' : 'var(--text-muted)',
                                    fontWeight: isActive ? 600 : 500,
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                <Icon size={20} color={isActive ? 'var(--primary)' : 'currentColor'} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                {pendingCount > 0 && (
                    <div style={{ marginTop: 'auto', marginBottom: '1.5rem', background: 'rgba(245, 158, 11, 0.1)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--warning)', fontWeight: 600, marginBottom: '0.5rem' }}>
                            <CloudOff size={18} /> {pendingCount} Pending Sync
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: 1.4 }}>
                            Some attendance points were marked offline. Connect to internet to sync.
                        </p>
                        <button
                            onClick={handleSync}
                            disabled={syncing}
                            className="btn btn-primary"
                            style={{ width: '100%', padding: '0.5rem', fontSize: '0.9rem', justifyContent: 'center' }}
                        >
                            <RefreshCw size={16} className={syncing ? "animate-spin" : ""} style={{ animation: syncing ? 'spin 1s linear infinite' : 'none' }} />
                            {syncing ? 'Syncing...' : 'Sync Now'}
                        </button>
                    </div>
                )}

                <button
                    onClick={handleSignOut}
                    className="btn btn-secondary"
                    style={{ marginTop: pendingCount > 0 ? '0' : 'auto', width: '100%', justifyContent: 'center' }}
                >
                    <LogOut size={18} /> Sign Out
                </button>
            </aside>

            {/* Main Content Area */}
            <main style={{ flex: 1, padding: '2rem 3rem', overflowY: 'auto' }}>
                <div className="animate-fade-in">
                    <Outlet />
                </div>
            </main>
        </div >
    );
}
