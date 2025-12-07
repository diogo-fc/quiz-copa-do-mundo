"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { User as ProfileUser } from "@/types";

interface AuthContextType {
    user: User | null;
    profile: ProfileUser | null;
    isLoading: boolean;
    signInWithGoogle: () => Promise<void>;
    signInWithFacebook: () => Promise<void>;
    signInWithApple: () => Promise<void>;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<ProfileUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const supabase = createClient();

    // Fetch user profile with timeout
    const fetchProfile = async (userId: string): Promise<ProfileUser | null> => {
        try {
            const timeoutPromise = new Promise<null>((resolve) =>
                setTimeout(() => resolve(null), 3000)
            );

            const queryPromise = supabase
                .from("profiles")
                .select("*")
                .eq("id", userId)
                .single()
                .then(({ data, error }) => {
                    if (error) {
                        console.log("Profile fetch error (expected if DB not set up):", error.message);
                        return null;
                    }
                    return data as ProfileUser;
                });

            return await Promise.race([queryPromise, timeoutPromise]);
        } catch (err) {
            console.log("Error fetching profile:", err);
            return null;
        }
    };

    // Create a mock profile from auth user
    const createMockProfile = (authUser: User): ProfileUser => ({
        id: authUser.id,
        email: authUser.email || "",
        name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || "Jogador",
        avatar_url: authUser.user_metadata?.avatar_url || null,
        favorite_team: null,
        xp: 0,
        level: 1,
        created_at: new Date().toISOString(),
    });

    // Refresh profile data
    const refreshProfile = async () => {
        if (!user) return;
        const profileData = await fetchProfile(user.id);
        if (profileData) {
            setProfile(profileData);
        } else {
            // Use mock profile if DB not available
            setProfile(createMockProfile(user));
        }
    };

    // Sign in with Google
    const signInWithGoogle = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });

        if (error) {
            console.error("Error signing in with Google:", error);
            throw error;
        }
    };

    // Sign in with Facebook
    const signInWithFacebook = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "facebook",
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });

        if (error) {
            console.error("Error signing in with Facebook:", error);
            throw error;
        }
    };

    // Sign in with Apple
    const signInWithApple = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "apple",
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });

        if (error) {
            console.error("Error signing in with Apple:", error);
            throw error;
        }
    };

    // Sign out
    const signOut = async () => {
        const { error } = await supabase.auth.signOut();

        if (error) {
            console.error("Error signing out:", error);
            throw error;
        }

        setUser(null);
        setProfile(null);
    };

    // Listen for auth changes
    useEffect(() => {
        let mounted = true;

        // Get initial session
        const getInitialSession = async () => {
            try {
                const {
                    data: { session },
                } = await supabase.auth.getSession();

                if (!mounted) return;

                if (session?.user) {
                    setUser(session.user);
                    const profileData = await fetchProfile(session.user.id);
                    if (mounted) {
                        setProfile(profileData || createMockProfile(session.user));
                    }
                }
            } catch (err) {
                console.log("Error getting session:", err);
            }

            if (mounted) {
                setIsLoading(false);
            }
        };

        getInitialSession();

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (!mounted) return;

            if (session?.user) {
                setUser(session.user);
                const profileData = await fetchProfile(session.user.id);
                if (mounted) {
                    setProfile(profileData || createMockProfile(session.user));
                }
            } else {
                setUser(null);
                setProfile(null);
            }

            if (mounted) {
                setIsLoading(false);
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                profile,
                isLoading,
                signInWithGoogle,
                signInWithFacebook,
                signInWithApple,
                signOut,
                refreshProfile,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }

    return context;
}
