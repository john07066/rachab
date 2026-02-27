import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Search, CheckCircle, Clock } from 'lucide-react';

export default function AdminManualEntry() {
    const { profile } = useAuth();
    const [members, setMembers] = useState([]);
    const [activeSession, setActiveSession] = useState(null);
    const [attendanceRecords, setAttendanceRecords] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);

            // 1. Get active session
            const { data: sessionData } = await supabase
                .from('sessions')
                .select('*')
                .eq('is_active', true)
                .single();

            setActiveSession(sessionData || null);

            if (sessionData) {
                // 2. Get all members
                const { data: membersData } = await supabase
                    .from('profiles')
                    .select('id, full_name, email, phone_number, is_first_timer')
                    .order('full_name');

                setMembers(membersData || []);

                // 3. Get existing attendance for this session
                const { data: attendanceData } = await supabase
                    .from('attendance')
                    .select('profile_id')
                    .eq('session_id', sessionData.id);

                const attendedIds = new Set((attendanceData || []).map(a => a.profile_id));
                setAttendanceRecords(attendedIds);
            }
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAttendance = async (memberId) => {
        if (!activeSession) return alert('No active session.');

        try {
            const { error } = await supabase
                .from('attendance')
                .insert([{
                    session_id: activeSession.id,
                    profile_id: memberId,
                    marked_by: profile.id
                }]);

            if (error) throw error;

            // Update local state to show as marked
            setAttendanceRecords(prev => new Set([...prev, memberId]));
        } catch (err) {
            console.error('Error marking attendance:', err);
            if (err.code === '23505') {
                alert('This person is already marked present.');
                setAttendanceRecords(prev => new Set([...prev, memberId]));
            } else {
                alert('Failed to mark attendance.');
            }
        }
    };

    const filteredMembers = members.filter(m =>
        m.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.phone_number?.includes(searchTerm)
    );

    if (loading) return <div>Loading...</div>;

    if (!activeSession) {
        return (
            <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                <h2 style={{ color: 'var(--warning)', marginBottom: '1rem' }}>No Active Session</h2>
                <p style={{ color: 'var(--text-muted)' }}>You must start an active session from the Dashboard before taking attendance.</p>
            </div>
        );
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ marginBottom: '0.5rem' }}>Manual Attendance</h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)', fontWeight: 600 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)' }} />
                        Active: {activeSession.name}
                    </div>
                </div>

                <div className="input-group" style={{ marginBottom: 0, width: '300px' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                        <input
                            type="text"
                            placeholder="Search name or phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ paddingLeft: '2.8rem' }}
                        />
                    </div>
                </div>
            </div>

            <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                            <tr>
                                <th style={{ padding: '1rem', borderBottom: '1px solid var(--glass-border)' }}>Name</th>
                                <th style={{ padding: '1rem', borderBottom: '1px solid var(--glass-border)' }}>Contact</th>
                                <th style={{ padding: '1rem', borderBottom: '1px solid var(--glass-border)', textAlign: 'center' }}>Status</th>
                                <th style={{ padding: '1rem', borderBottom: '1px solid var(--glass-border)', textAlign: 'right' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredMembers.length === 0 ? (
                                <tr>
                                    <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                        No members found matching "{searchTerm}".
                                    </td>
                                </tr>
                            ) : (
                                filteredMembers.map(member => {
                                    const isPresent = attendanceRecords.has(member.id);

                                    return (
                                        <tr key={member.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s', ':hover': { background: 'rgba(255,255,255,0.02)' } }}>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    {member.full_name}
                                                    {member.is_first_timer && <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', background: 'var(--secondary)', color: 'white', borderRadius: '4px' }}>New</span>}
                                                </div>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{member.phone_number || member.email}</div>
                                            </td>
                                            <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                {isPresent ? (
                                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: 'var(--success)', fontSize: '0.9rem', fontWeight: 600 }}>
                                                        <CheckCircle size={16} /> Present
                                                    </div>
                                                ) : (
                                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                                        <Clock size={16} /> Absent
                                                    </div>
                                                )}
                                            </td>
                                            <td style={{ padding: '1rem', textAlign: 'right' }}>
                                                <button
                                                    onClick={() => handleMarkAttendance(member.id)}
                                                    disabled={isPresent}
                                                    className="btn"
                                                    style={{
                                                        padding: '0.5rem 1rem',
                                                        fontSize: '0.9rem',
                                                        background: isPresent ? 'rgba(255,255,255,0.05)' : 'var(--primary)',
                                                        color: isPresent ? 'var(--text-muted)' : 'white',
                                                        cursor: isPresent ? 'default' : 'pointer'
                                                    }}
                                                >
                                                    {isPresent ? 'Marked' : 'Mark Present'}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
