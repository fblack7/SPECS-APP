import { createContext, useContext, useEffect, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth'
import {
  doc, getDoc, setDoc, collection, query,
  where, getDocs, deleteDoc, serverTimestamp
} from 'firebase/firestore'
import { auth, db } from '../firebase'
import { v4 as uuidv4 } from 'uuid'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // Watch auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const snap = await getDoc(doc(db, 'users', firebaseUser.uid))
        setProfile(snap.exists() ? snap.data() : null)
        setUser(firebaseUser)
      } else {
        setUser(null); setProfile(null)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  // ── Register ──────────────────────────────────────────────────────────────
  async function register(email, password, inviteToken = null) {
    // If invite token provided, validate it first
    if (inviteToken) {
      const invSnap = await getDoc(doc(db, 'invitations', inviteToken))
      if (!invSnap.exists() || invSnap.data().used) {
        throw new Error('Invitation is invalid or has already been used.')
      }
      const inv = invSnap.data()
      if (inv.email.toLowerCase() !== email.toLowerCase()) {
        throw new Error('This invitation was sent to a different email address.')
      }
      if (new Date(inv.expiresAt.toDate()) < new Date()) {
        throw new Error('This invitation has expired. Please request a new one.')
      }
    }

    // Determine if first user (admin)
    let isFirstUser = false
try {
  const usersSnap = await getDocs(collection(db, 'users'))
  isFirstUser = usersSnap.empty
} catch {
  isFirstUser = true
}

if (!isFirstUser && !inviteToken) {
  throw new Error('Registration is by invitation only. Please ask an administrator for an invite link.')
}
    }

    const cred = await createUserWithEmailAndPassword(auth, email, password)
    const role = isFirstUser ? 'admin' : 'user'

    await setDoc(doc(db, 'users', cred.user.uid), {
      email,
      role,
      createdAt: serverTimestamp(),
      invitedBy: inviteToken ? (await getDoc(doc(db, 'invitations', inviteToken))).data().createdBy : null,
    })

    // Mark invitation as used
    if (inviteToken) {
      await setDoc(doc(db, 'invitations', inviteToken), { used: true, usedAt: serverTimestamp() }, { merge: true })
    }

    const snap = await getDoc(doc(db, 'users', cred.user.uid))
    setProfile(snap.data())
    return cred.user
  }

  // ── Login ─────────────────────────────────────────────────────────────────
  async function login(email, password) {
    const cred = await signInWithEmailAndPassword(auth, email, password)
    const snap = await getDoc(doc(db, 'users', cred.user.uid))
    setProfile(snap.exists() ? snap.data() : null)
    return cred.user
  }

  // ── Logout ────────────────────────────────────────────────────────────────
  async function logout() {
    await signOut(auth)
    setUser(null); setProfile(null)
  }

  // ── Create invitation ─────────────────────────────────────────────────────
  async function createInvitation(email) {
    if (profile?.role !== 'admin') throw new Error('Only admins can send invitations.')
    // Check if already registered
    const q = query(collection(db, 'users'), where('email', '==', email.toLowerCase()))
    const existing = await getDocs(q)
    if (!existing.empty) throw new Error('This email address already has an account.')

    const token = uuidv4()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 days

    await setDoc(doc(db, 'invitations', token), {
      email: email.toLowerCase(),
      token,
      createdBy: user.uid,
      createdByEmail: user.email,
      used: false,
      createdAt: serverTimestamp(),
      expiresAt,
    })
    return token
  }

  // ── List invitations ──────────────────────────────────────────────────────
  async function listInvitations() {
    const snap = await getDocs(collection(db, 'invitations'))
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
  }

  // ── List users ────────────────────────────────────────────────────────────
  async function listUsers() {
    const snap = await getDocs(collection(db, 'users'))
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
  }

  // ── Grant/revoke admin ────────────────────────────────────────────────────
  async function setUserRole(uid, role) {
    if (profile?.role !== 'admin') throw new Error('Only admins can change roles.')
    await setDoc(doc(db, 'users', uid), { role }, { merge: true })
  }

  // ── Delete invitation ─────────────────────────────────────────────────────
  async function deleteInvitation(token) {
    await deleteDoc(doc(db, 'invitations', token))
  }

  const isAdmin = profile?.role === 'admin'

  return (
    <AuthContext.Provider value={{
      user, profile, loading, isAdmin,
      register, login, logout,
      createInvitation, listInvitations, listUsers, setUserRole, deleteInvitation
    }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
