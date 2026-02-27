import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                setUser(session.user);
                fetchProfile(session.user.id);
            } else {
                setUser(null);
                setLoading(false);
            }
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                setLoading(true);
                fetchProfile(session.user.id);
            } else {
                setProfile(null);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchProfile = async (userId) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (!error && data) {
                setProfile(data);
            } else {
                console.error('Failed to load profile:', error);

                // PGRST116 means 0 rows returned (profile doesn't exist)
                if (error && error.code === 'PGRST116') {
                    console.log('Profile missing. Attempting to self-heal from metadata...');

                    // We already have the userId, let's try to get the session metadata
                    const { data: sessionData } = await supabase.auth.getSession();
                    const currentUser = sessionData?.session?.user;

                    if (currentUser) {
                        const meta = currentUser.user_metadata || {};

                        const { data: newProfile, error: insertError } = await supabase
                            .from('profiles')
                            .insert([{
                                id: userId,
                                full_name: meta.full_name || 'Member',
                                phone_number: meta.phone_number || '',
                                email: currentUser.email,
                                chapter: meta.chapter || '',
                                is_first_timer: meta.is_first_timer || false,
                                is_admin: false
                            }])
                            .select()
                            .single();

                        if (!insertError && newProfile) {
                            console.log('Successfully recreated profile!');
                            setProfile(newProfile);
                            setLoading(false);
                            return;
                        } else {
                            console.error('Failed to self-heal profile:', insertError);
                        }
                    }
                }

                // If heal fails or error wasn't PGRST116, clear profile and end loading
                setProfile(null);
                setLoading(false);
            }
        } catch (err) {
            console.error('Unexpected error fetching profile:', err);
            setProfile(null);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthContext.Provider value={{ user, profile, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
