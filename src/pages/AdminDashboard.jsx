import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { PlusCircle, Calendar } from 'lucide-react';

export default function AdminDashboard() {
    const { profile } = useAuth();
    const [sessions, setSessions] = useState([]);
    const [activeSession, setActiveSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [totalAttendance, setTotalAttendance] = useState(0);

    // New Session Form State
    const [showNewSession, setShowNewSession] = useState(false);
    const [newSessionData, setNewSessionData] = useState({ name: '', date: '' });

    useEffect(() => {
        fetchSessions();
    }, []);

    const fetchSessions = async () => {
        try {
            setLoading(true);
            // Fetch all sessions ordered by date descending
            const { data: sessionData, error: sessionError } = await supabase
                .from('sessions')
                .select('*')
                .order('date', { ascending: false });

            if (sessionError) throw sessionError;

            setSessions(sessionData || []);

            // Find the active session if there is one
            const active = sessionData?.find(s => s.is_active);
            setActiveSession(active || null);

            if (active) {
                // Fetch attendance count for active session
                const { count, error: countError } = await supabase
                    .from('attendance')
                    .select('*', { count: 'exact', head: true })
                    .eq('session_id', active.id);

                if (!countError) setTotalAttendance(count || 0);
            }
        } catch (err) {
            console.error('Error fetching sessions:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSession = async (e) => {
        e.preventDefault();
        try {
            // Deactivate all previous sessions first
            await supabase.from('sessions').update({ is_active: false }).neq('id', '00000000-0000-0000-0000-000000000000'); // Dummy where to match all

            const { data, error } = await supabase
                .from('sessions')
                .insert([{
                    name: newSessionData.name,
                    date: newSessionData.date,
                    is_active: true
                }])
                .select()
                .single();

            if (error) throw error;

            setShowNewSession(false);
            setNewSessionData({ name: '', date: '' });
            fetchSessions();
        } catch (err) {
            console.error('Error creating session:', err);
            alert('Failed to create session');
        }
    };

    const handleSetActive = async (id) => {
        if (!confirm('Make this the active session? Scanning and attendance will point to this session.')) return;
        try {
            // Deactivate all
            await supabase.from('sessions').update({ is_active: false }).neq('id', '00000000-0000-0000-0000-000000000000');

            // Activate selected
            await supabase.from('sessions').update({ is_active: true }).eq('id', id);

            fetchSessions();
        } catch (err) {
            console.error('Error updating session:', err);
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ marginBottom: '0.5rem' }}>Welcome, {profile?.full_name?.split(' ')[0]}</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Here is the overview for your attendance services.</p>
                </div>

                <button
                    onClick={() => setShowNewSession(!showNewSession)}
                    className="btn btn-primary"
                >
                    <PlusCircle size={20} />
                    New Service Session
                </button>
            </div>

            {showNewSession && (
                <div className="glass-panel animate-fade-in" style={{ marginBottom: '2rem', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid var(--primary)' }}>
                    <h3>Start a New Session</h3>
                    <form onSubmit={handleCreateSession} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', marginTop: '1rem' }}>
                        <div className="input-group" style={{ marginBottom: 0, flex: 2 }}>
                            <label>Service Name (e.g. Sunday Service - Month 1)</label>
                            <input
                                type="text"
                                required
                                value={newSessionData.name}
                                onChange={e => setNewSessionData({ ...newSessionData, name: e.target.value })}
                            />
                        </div>
                        <div className="input-group" style={{ marginBottom: 0, flex: 1 }}>
                            <label>Date</label>
                            <input
                                type="date"
                                required
                                value={newSessionData.date}
                                onChange={e => setNewSessionData({ ...newSessionData, date: e.target.value })}
                            />
                        </div>
                        <button type="submit" className="btn btn-primary">Start Session</button>
                    </form>
                </div>
            )}

            {/* Active Session Overview Card */}
            {activeSession ? (
                <div className="glass-panel" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{ color: 'var(--success)', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 8px var(--success)' }} />
                            ACTIVE SESSION
                        </div>
                        <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{activeSession.name}</h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                            <Calendar size={18} />
                            {new Date(activeSession.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                        <div style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 500 }}>Total Attendance</div>
                        <div style={{ fontSize: '3.5rem', fontWeight: 800, lineHeight: 1, background: 'linear-gradient(135deg, var(--success), #34d399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            {totalAttendance}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="glass-panel" style={{ marginBottom: '2rem', textAlign: 'center', padding: '3rem' }}>
                    <h3 style={{ color: 'var(--warning)', marginBottom: '1rem' }}>No Active Session</h3>
                    <p style={{ color: 'var(--text-muted)' }}>Start a new session above to begin taking attendance.</p>
                </div>
            )}

            {/* Previous Sessions List */}
            <div className="glass-panel">
                <h3 style={{ marginBottom: '1.5rem' }}>All Sessions</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {sessions.length === 0 ? (
                        <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No sessions created yet.</div>
                    ) : (
                        sessions.map(session => (
                            <div key={session.id} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '1rem',
                                background: 'rgba(255, 255, 255, 0.05)',
                                borderRadius: '8px',
                                border: session.is_active ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid transparent'
                            }}>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>
                                        {session.name}
                                        {session.is_active && <span style={{ marginLeft: '1rem', fontSize: '0.8rem', padding: '0.2rem 0.5rem', background: 'rgba(16, 185, 129, 0.2)', color: 'var(--success)', borderRadius: '4px' }}>Active</span>}
                                    </div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.3rem' }}>{new Date(session.date).toLocaleDateString()}</div>
                                </div>
                                {!session.is_active && (
                                    <button onClick={() => handleSetActive(session.id)} className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                                        Set Active
                                    </button>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
