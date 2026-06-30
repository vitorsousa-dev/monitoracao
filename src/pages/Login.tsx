import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, User } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [registerName, setRegisterName] = useState('')
  const [registerEmail, setRegisterEmail] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [isRegisterMode, setIsRegisterMode] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null)
  const [feedbackType, setFeedbackType] = useState<'error' | 'success' | null>(null)
  const { login, registerUser } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setFeedbackMessage(null)
    setFeedbackType(null)
    
    try {
      const success = await login(email, password)
      if (success) {
        navigate('/dashboard')
      } else {
        setFeedbackType('error')
        setFeedbackMessage('Credenciais invalidas. Verifique email e senha.')
      }
    } catch (error) {
      console.error('Login failed:', error)
      setFeedbackType('error')
      setFeedbackMessage('Nao foi possivel realizar o login.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault()
    setFeedbackMessage(null)
    setFeedbackType(null)

    const result = registerUser({
      name: registerName,
      email: registerEmail,
      password: registerPassword,
    })

    setFeedbackType(result.success ? 'success' : 'error')
    setFeedbackMessage(result.message)

    if (result.success) {
      setEmail(registerEmail)
      setPassword('')
      setRegisterName('')
      setRegisterEmail('')
      setRegisterPassword('')
      setIsRegisterMode(false)
    }
  }

  return (
    <div className="min-h-screen bg-white p-4">
      <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex flex-col items-center justify-center mb-4">
            <img
              src="/ems-logo.png"
              alt="EMS"
              className="h-[17.5rem] w-auto max-w-[520px] object-contain mx-auto"
            />
          </div>
        </div>
        
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-lg">
          <div className="flex gap-2 mb-6">
            <button
              type="button"
              onClick={() => setIsRegisterMode(false)}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                !isRegisterMode ? 'bg-[#2A6CF8] text-white hover:bg-[#1f5fe8]' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => setIsRegisterMode(true)}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                isRegisterMode ? 'bg-[#2A6CF8] text-white hover:bg-[#1f5fe8]' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Criar Usuario
            </button>
          </div>

          {feedbackMessage && (
            <div
              className={`mb-6 rounded-lg px-4 py-3 text-sm ${
                feedbackType === 'success'
                  ? 'bg-success/10 text-success'
                  : 'bg-danger/10 text-danger'
              }`}
            >
              {feedbackMessage}
            </div>
          )}

          {!isRegisterMode ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 py-3 pl-10 pr-4 focus:border-[#2A6CF8] focus:outline-none focus:ring-2 focus:ring-[#2A6CF8]/20"
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 py-3 pl-10 pr-4 focus:border-[#2A6CF8] focus:outline-none focus:ring-2 focus:ring-[#2A6CF8]/20"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-lg bg-[#2A6CF8] px-4 py-3 font-medium text-white transition-colors hover:bg-[#1f5fe8] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nome</label>
                <input
                  type="text"
                  value={registerName}
                  onChange={(e) => setRegisterName(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:border-[#2A6CF8] focus:outline-none focus:ring-2 focus:ring-[#2A6CF8]/20"
                  placeholder="Nome completo"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:border-[#2A6CF8] focus:outline-none focus:ring-2 focus:ring-[#2A6CF8]/20"
                  placeholder="email@empresa.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Senha</label>
                <input
                  type="password"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:border-[#2A6CF8] focus:outline-none focus:ring-2 focus:ring-[#2A6CF8]/20"
                  placeholder="Defina uma senha"
                  required
                />
              </div>

              <div className="rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-gray-700">
                Novos cadastros criados por esta tela entram como usuario comum com acesso de leitura ao cliente Serasa Experian.
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-[#2A6CF8] px-4 py-3 font-medium text-white transition-colors hover:bg-[#1f5fe8]"
              >
                Criar Usuario
              </button>
            </form>
          )}
          
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-center text-sm text-gray-500">
              Use as credenciais cadastradas para acessar a plataforma.
            </p>
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}
