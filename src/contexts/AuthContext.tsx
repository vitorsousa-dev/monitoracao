import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react'
import { User } from '@/types'

interface AuthContextType {
  user: User | null
  users: User[]
  isAuthenticated: boolean
  isReadOnly: boolean
  canManageUsers: boolean
  canEditPlatform: boolean
  login: (email: string, password: string) => Promise<boolean>
  registerUser: (userData: RegisterUserData) => { success: boolean; message: string }
  createUser: (userData: CreateUserData) => { success: boolean; message: string }
  deleteUser: (userId: string) => { success: boolean; message: string }
  hasClientAccess: (clientName: string) => boolean
  logout: () => void
}

interface RegisterUserData {
  name: string
  email: string
  password: string
}

interface CreateUserData {
  name: string
  email: string
  password: string
  role: User['role']
  clientAccess: string[]
}

const USERS_STORAGE_KEY = 'ems-platform-users'
const SESSION_STORAGE_KEY = 'ems-platform-session'

const defaultUsers: User[] = [
  {
    id: 'admin-1',
    name: 'Vitor Fantoni',
    email: 'proactive.service.latam@coolautomation.com',
    role: 'admin',
    password: 'admin123',
    createdAt: '2026-06-29',
    clientAccess: ['*'],
  },
  {
    id: 'admin-2',
    name: 'Edson',
    email: 'edson@coolautomation.com',
    role: 'admin',
    password: 'admin123',
    createdAt: '2026-06-29',
    clientAccess: ['*'],
  },
  {
    id: 'manager-1',
    name: 'Gerente Serasa',
    email: 'gerente@serasaexperian.com',
    role: 'manager',
    password: 'gerente123',
    createdAt: '2026-06-29',
    clientAccess: ['Serasa Experian'],
  },
]

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function sanitizeClientAccess(clientAccess: string[]) {
  const sanitized = clientAccess
    .map((client) => client.trim())
    .filter(Boolean)

  return sanitized.length > 0 ? Array.from(new Set(sanitized)) : ['Serasa Experian']
}

function loadUsersFromStorage() {
  if (typeof window === 'undefined') {
    return defaultUsers
  }

  const storedUsers = window.localStorage.getItem(USERS_STORAGE_KEY)
  if (!storedUsers) {
    return defaultUsers
  }

  try {
    const parsedUsers = JSON.parse(storedUsers) as User[]
    return parsedUsers.length > 0 ? parsedUsers : defaultUsers
  } catch {
    return defaultUsers
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>(() => loadUsersFromStorage())
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    window.localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users))
  }, [users])

  useEffect(() => {
    window.localStorage.removeItem(SESSION_STORAGE_KEY)
  }, [])

  useEffect(() => {
    if (!user) {
      return
    }

    const refreshedUser = users.find((storedUser) => storedUser.id === user.id) ?? null
    setUser(refreshedUser)
  }, [users])

  const login = async (email: string, password: string) => {
    await new Promise(resolve => setTimeout(resolve, 500))

    const matchedUser = users.find(
      (storedUser) =>
        normalizeEmail(storedUser.email) === normalizeEmail(email) &&
        storedUser.password === password
    )

    if (!matchedUser) {
      return false
    }

    setUser(matchedUser)
    return true
  }

  const registerUser = ({ name, email, password }: RegisterUserData) => {
    const normalizedEmail = normalizeEmail(email)
    const emailAlreadyExists = users.some(
      (storedUser) => normalizeEmail(storedUser.email) === normalizedEmail
    )

    if (emailAlreadyExists) {
      return { success: false, message: 'Ja existe um usuario com este email.' }
    }

    const newUser: User = {
      id: `viewer-${Date.now()}`,
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: 'viewer',
      createdAt: new Date().toISOString().split('T')[0],
      clientAccess: ['Serasa Experian'],
    }

    setUsers((currentUsers) => [newUser, ...currentUsers])
    return { success: true, message: 'Usuario criado com sucesso. Agora voce ja pode entrar.' }
  }

  const createUser = ({ name, email, password, role, clientAccess }: CreateUserData) => {
    const normalizedEmail = normalizeEmail(email)
    const emailAlreadyExists = users.some(
      (storedUser) => normalizeEmail(storedUser.email) === normalizedEmail
    )

    if (emailAlreadyExists) {
      return { success: false, message: 'Ja existe um usuario com este email.' }
    }

    const newUser: User = {
      id: `${role}-${Date.now()}`,
      name: name.trim(),
      email: normalizedEmail,
      password,
      role,
      createdAt: new Date().toISOString().split('T')[0],
      clientAccess: role === 'admin' ? ['*'] : sanitizeClientAccess(clientAccess),
    }

    setUsers((currentUsers) => [newUser, ...currentUsers])
    return { success: true, message: 'Usuario salvo com sucesso.' }
  }

  const deleteUser = (userId: string) => {
    if (user?.id === userId) {
      return { success: false, message: 'Nao e permitido excluir o usuario logado.' }
    }

    setUsers((currentUsers) => currentUsers.filter((storedUser) => storedUser.id !== userId))
    return { success: true, message: 'Usuario removido com sucesso.' }
  }

  const hasClientAccess = (clientName: string) => {
    if (!user) {
      return false
    }

    if (user.role === 'admin') {
      return true
    }

    return user.clientAccess.includes(clientName)
  }

  const logout = () => {
    setUser(null)
  }

  const permissions = useMemo(() => {
    const role = user?.role

    return {
      isReadOnly: role === 'viewer',
      canManageUsers: role === 'admin',
      canEditPlatform: role === 'admin',
    }
  }, [user])

  return (
    <AuthContext.Provider
      value={{
        user,
        users,
        isAuthenticated: !!user,
        isReadOnly: permissions.isReadOnly,
        canManageUsers: permissions.canManageUsers,
        canEditPlatform: permissions.canEditPlatform,
        login,
        registerUser,
        createUser,
        deleteUser,
        hasClientAccess,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
