import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

const AuthContext = createContext({})

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)

    const getProfile = async (userId) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single()
            if (error) return null
            return data
        } catch {
            return null
        }
    }

    useEffect(() => {
        let mounted = true

        const init = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession()
                if (!mounted) return
                setUser(session?.user ?? null)
                if (session?.user) {
                    const prof = await getProfile(session.user.id)
                    if (mounted) setProfile(prof)
                }
            } catch (err) {
                console.error('Auth init failed:', err)
            } finally {
                if (mounted) setLoading(false)
            }
        }

        init()

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null)
            if (!session?.user) setProfile(null)
            setLoading(false)
        })

        return () => {
            mounted = false
            subscription.unsubscribe()
        }
    }, [])

    return (
        <AuthContext.Provider value={{
            user,
            profile,
            isAdmin: !!profile?.is_admin,
            loading,
            signUp: (data) => supabase.auth.signUp(data),
            signIn: (data) => supabase.auth.signInWithPassword(data),
            signOut: () => supabase.auth.signOut(),
            resetPassword: (email) => supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` })
        }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)