import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getSession, onAuthStateChange, signOut } from './supabaseClient';

const AuthContext = createContext({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let authSubscription;

    async function loadSession() {
      try {
        const { data } = await getSession();

        console.log('Initial session:', data);

        setSession(data?.session || null);
        setUser(data?.session?.user || null);
      } catch (error) {
        console.error('Error loading session:', error);
      } finally {
        setLoading(false);
      }
    }

    loadSession();

    const { data } = onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session);

      setSession(session || null);
      setUser(session?.user || null);
      setLoading(false);
    });

    authSubscription = data?.subscription;

    return () => {
      authSubscription?.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const value = useMemo(
    () => ({
      user,
      session,
      loading,
      signOut: handleSignOut,
    }),
    [user, session, loading]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}