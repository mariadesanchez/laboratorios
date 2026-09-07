import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const ADMIN_EMAIL = 'agentesailucky@gmail.com';

export function useAuth() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Get current session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signInWithGoogle = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin + '/obras_sociales'
            }
        });
        if (error) console.error('Error signing in:', error.message);
    };

    const signOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) console.error('Error signing out:', error.message);
    };

    const isAdmin = user?.email === ADMIN_EMAIL;

    return { user, loading, isAdmin, signInWithGoogle, signOut };
}
