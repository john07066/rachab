import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';

export default function SignUp() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);
    const [showPassword, setShowPassword] = useState(false);

    const [formData, setFormData] = useState({
        fullName: '',
        phoneNumber: '',
        email: '',
        password: '',
        chapter: '',
        isFirstTimer: false
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccessMsg(null);

        try {
            // 1. Sign up the user in Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
            });

            if (authError) throw authError;

            // 2. We don't need to manually insert into profiles here if we trigger it,
            // but since we collect extra data, we should update the profile that might be auto-created,
            // OR insert it if it doesn't exist yet. By default, auth.signUp doesn't create the profile unless we have a trigger.
            // We will insert/update the profile manually since we didn't define a trigger in schema.sql.

            if (authData.user) {
                const { error: profileError } = await supabase
                    .from('profiles')
                    .upsert({
                        id: authData.user.id,
                        full_name: formData.fullName,
                        phone_number: formData.phoneNumber,
                        email: formData.email,
                        chapter: formData.chapter,
                        is_first_timer: formData.isFirstTimer,
                        is_admin: false, // Default
                    });

                if (profileError) throw profileError;
            }

            if (!authData.session) {
                // Email confirmation is required by Supabase settings
                setSuccessMsg('Account created successfully! Please check your email to confirm your account.');
                setLoading(false);
                return;
            } else {
                // Navigate via force-reload to root to route dynamically
                window.location.href = '/';
            }

        } catch (err) {
            setError(err.message || 'An error occurred during sign up.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container flex-center" style={{ minHeight: '100vh', padding: '2rem 1rem' }}>
            <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '500px' }}>
                <h2 className="text-gradient" style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    Join the Service
                </h2>

                {error && (
                    <div style={{ color: 'var(--danger)', marginBottom: '1rem', textAlign: 'center', fontSize: '0.9rem', background: 'rgba(239, 68, 68, 0.1)', padding: '0.5rem', borderRadius: '8px' }}>
                        {error}
                    </div>
                )}

                {successMsg && (
                    <div style={{ color: 'var(--success)', marginBottom: '1rem', textAlign: 'center', fontSize: '0.9rem', background: 'rgba(16, 185, 129, 0.1)', padding: '0.5rem', borderRadius: '8px' }}>
                        {successMsg}
                        <div style={{ marginTop: '1rem' }}>
                            <Link to="/login" className="btn btn-primary" style={{ display: 'inline-block' }}>Go to Login</Link>
                        </div>
                    </div>
                )}

                {!successMsg && (
                    <form onSubmit={handleSubmit}>
                        <div className="input-group">
                            <label>Full Name</label>
                            <input
                                type="text"
                                name="fullName"
                                required
                                value={formData.fullName}
                                onChange={handleChange}
                                placeholder="John Doe"
                            />
                        </div>

                        <div className="input-group">
                            <label>Email Address</label>
                            <input
                                type="email"
                                name="email"
                                required
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="john@example.com"
                            />
                        </div>

                        <div className="input-group">
                            <label>Phone Number</label>
                            <input
                                type="tel"
                                name="phoneNumber"
                                required
                                value={formData.phoneNumber}
                                onChange={handleChange}
                                placeholder="+1 234 567 8900"
                            />
                        </div>

                        <div className="input-group">
                            <label>Chapter</label>
                            <input
                                type="text"
                                name="chapter"
                                required
                                value={formData.chapter}
                                onChange={handleChange}
                                placeholder="e.g. BLW FUTA"
                            />
                        </div>

                        <div className="input-group">
                            <label>Password</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    required
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Secure password"
                                    style={{ paddingRight: '2.5rem' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: 'absolute',
                                        right: '0.5rem',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none',
                                        border: 'none',
                                        color: 'var(--text-muted)',
                                        cursor: 'pointer',
                                        display: 'flex'
                                    }}
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <div className="input-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.8rem', marginTop: '1rem' }}>
                            <input
                                type="checkbox"
                                name="isFirstTimer"
                                id="isFirstTimer"
                                checked={formData.isFirstTimer}
                                onChange={handleChange}
                                style={{ width: 'auto', accentColor: 'var(--primary)' }}
                            />
                            <label htmlFor="isFirstTimer" style={{ cursor: 'pointer', margin: 0, color: 'var(--text-main)' }}>
                                I am a first timer
                            </label>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary"
                            style={{ width: '100%', marginTop: '1.5rem' }}
                            disabled={loading}
                        >
                            {loading ? 'Creating Account...' : 'Sign Up'}
                        </button>
                    </form>
                )}

                <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    Already have an account? <Link to="/login" style={{ fontWeight: '600' }}>Login here</Link>
                </p>
            </div>
        </div>
    );
}
