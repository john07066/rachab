import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Search } from 'lucide-react';

export default function AdminMembers({ firstTimersOnly = false }) {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchMembers();
    }, [firstTimersOnly]);

    const fetchMembers = async () => {
        try {
            setLoading(true);
            let query = supabase.from('profiles').select('*').order('created_at', { ascending: false });

            if (firstTimersOnly) {
                query = query.eq('is_first_timer', true);
            }

            const { data, error } = await query;
            if (error) throw error;
            setMembers(data || []);
        } catch (err) {
            console.error('Error fetching members:', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredMembers = members.filter(m =>
        m.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.phone_number?.includes(searchTerm)
    );

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ marginBottom: '0.5rem' }}>{firstTimersOnly ? 'First Timers' : 'Members Directory'}</h1>
                    <p style={{ color: 'var(--text-muted)' }}>
                        Viewing {firstTimersOnly ? 'all registered first timers' : 'all registered members'}. ({filteredMembers.length} total)
                    </p>
                </div>

                <div className="input-group" style={{ marginBottom: 0, width: '300px' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                        <input
                            type="text"
                            placeholder="Search members..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ paddingLeft: '2.8rem' }}
                        />
                    </div>
                </div>
            </div>

            <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: '3rem', textAlign: 'center' }}>Loading...</div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                                <tr>
                                    <th style={{ padding: '1rem', borderBottom: '1px solid var(--glass-border)' }}>Name</th>
                                    <th style={{ padding: '1rem', borderBottom: '1px solid var(--glass-border)' }}>Contact</th>
                                    <th style={{ padding: '1rem', borderBottom: '1px solid var(--glass-border)' }}>Chapter</th>
                                    {!firstTimersOnly && <th style={{ padding: '1rem', borderBottom: '1px solid var(--glass-border)' }}>Status</th>}
                                    <th style={{ padding: '1rem', borderBottom: '1px solid var(--glass-border)' }}>Joined</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredMembers.length === 0 ? (
                                    <tr>
                                        <td colSpan={firstTimersOnly ? 4 : 5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                            No members found matching your search.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredMembers.map(member => (
                                        <tr key={member.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s', ':hover': { background: 'rgba(255,255,255,0.02)' } }}>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ fontWeight: 600 }}>{member.full_name}</div>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ fontSize: '0.9rem' }}>{member.email}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{member.phone_number}</div>
                                            </td>
                                            <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{member.chapter || '-'}</td>
                                            {!firstTimersOnly && (
                                                <td style={{ padding: '1rem' }}>
                                                    {member.is_first_timer ? (
                                                        <span style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem', background: 'rgba(236, 72, 153, 0.2)', color: 'var(--secondary)', borderRadius: '4px' }}>
                                                            First Timer
                                                        </span>
                                                    ) : (
                                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Member</span>
                                                    )}
                                                </td>
                                            )}
                                            <td style={{ padding: '1rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                                {new Date(member.created_at).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
