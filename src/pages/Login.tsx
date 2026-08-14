import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, User } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null)
  const [feedbackType, setFeedbackType] = useState<'error' | 'success' | null>(null)
  const { login } = useAuth()
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

  return (
    <div className="min-h-screen bg-white p-4">
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="mb-4 flex items-center justify-center">
              <img
                src="/ems-logo.png"
                alt="EMS e CoolAutomation"
                className="h-auto w-full max-w-[390px] object-contain mx-auto sm:max-w-[460px]"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-lg">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Entrar na plataforma</h2>
              <p className="mt-1 text-sm text-gray-500">
                Acesso exclusivo para usuarios previamente cadastrados pelo administrador.
              </p>
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

            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-center text-sm text-gray-500">
                Use as credenciais cadastradas para acessar a plataforma.
              </p>
              <p className="mt-2 text-center text-xs text-gray-400">
                Precisa de acesso? Solicite ao administrador responsavel pelo seu cliente.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
