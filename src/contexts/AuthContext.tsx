import { createContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth'
import { auth } from '../firebase/config'
import { friendlyFirebaseError } from '../firebase/errors'
import { ensureBusinessDoc } from '../services/businessService'

export interface AuthContextValue {
  user: User | null
  /** Igual ao uid do usuário. Hoje cada usuário é dono do seu próprio negócio;
   *  no futuro isso pode vir de uma coleção `memberships` sem quebrar o resto do app. */
  businessId: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  loginWithGoogle: () => Promise<void>
  logout: () => Promise<void>
  updateDisplayName: (name: string) => Promise<void>
}

const googleProvider = new GoogleAuthProvider()

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // `loading` só vira false depois que o documento do negócio existe de fato —
    // caso contrário, no primeiro login, telas como o Dashboard podem tentar ler
    // businesses/{uid} antes de ensureBusinessDoc terminar de criá-lo e mostrar
    // o texto de fallback (uma corrida real, não hipotética).
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
      if (firebaseUser) {
        ensureBusinessDoc(firebaseUser.uid, firebaseUser.email).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })
    return unsubscribe
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      businessId: user?.uid ?? null,
      loading,
      async login(email: string, password: string) {
        try {
          await signInWithEmailAndPassword(auth, email, password)
        } catch (error) {
          throw new Error(friendlyFirebaseError(error))
        }
      },
      async loginWithGoogle() {
        try {
          await signInWithPopup(auth, googleProvider)
        } catch (error) {
          throw new Error(friendlyFirebaseError(error))
        }
      },
      async logout() {
        await signOut(auth)
      },
      async updateDisplayName(name: string) {
        if (!auth.currentUser) return
        try {
          await updateProfile(auth.currentUser, { displayName: name.trim() || null })
          setUser({ ...auth.currentUser } as User)
        } catch (error) {
          throw new Error(friendlyFirebaseError(error))
        }
      },
    }),
    [user, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
