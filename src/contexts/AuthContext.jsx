async function register(email, password, inviteToken = null) {
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

  const cred = await createUserWithEmailAndPassword(auth, email, password)
  const role = isFirstUser ? 'admin' : 'user'

  await setDoc(doc(db, 'users', cred.user.uid), {
    email,
    role,
    createdAt: serverTimestamp(),
    invitedBy: inviteToken ? (await getDoc(doc(db, 'invitations', inviteToken))).data().createdBy : null,
  })

  if (inviteToken) {
    await setDoc(doc(db, 'invitations', inviteToken), { used: true, usedAt: serverTimestamp() }, { merge: true })
  }

  const snap = await getDoc(doc(db, 'users', cred.user.uid))
  setProfile(snap.data())
  return cred.user
}
