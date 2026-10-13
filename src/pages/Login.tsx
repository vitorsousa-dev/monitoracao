import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, User, ArrowRight, Activity, Shield, BarChart3 } from 'lucide-react'
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
        setFeedbackMessage('Credenciais inválidas. Verifique email e senha.')
      }
    } catch (error) {
      console.error('Login failed:', error)
      setFeedbackType('error')
      setFeedbackMessage('Não foi possível realizar o login.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Brand panel */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-primary p-12 text-primary-foreground lg:flex">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-white/30 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-white/20 blur-3xl" />
        </div>

        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <p className="text-lg font-bold leading-tight">MeuDashboard</p>
            <p className="text-xs text-white/70">Monitoramento operacional</p>
          </div>
        </div>

        <div className="relative space-y-6">
          <h1 className="text-4xl font-bold leading-tight tracking-tight">
            Acompanhe a saúde operacional dos seus ativos em tempo real.
          </h1>
          <p className="max-w-md text-base text-white/80">
            Centralize alarmes, manutenção preditiva, performance financeira e sustentabilidade em uma única plataforma de dados.
          </p>
          <div className="space-y-3">
            {[
              { icon: BarChart3, text: 'Indicadores e dashboards executivos' },
              { icon: Shield, text: 'Acesso controlado por perfil e cliente' },
              { icon: Activity, text: 'Alertas e gestão de incidentes' },
            ].map((feature) => (
              <div key={feature.text} className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15">
                  <feature.icon className="h-4 w-4" />
                </div>
                <span className="text-sm text-white/90">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-white/60">© {new Date().getFullYear()} MeuDashboard. Todos os direitos reservados.</p>
      </div>

      {/* Form panel */}
      <div className="flex w-full items-center justify-center p-6 sm:p-10 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Activity className="h-6 w-6" />
              </div>
              <div>
                <p className="text-lg font-bold leading-tight text-foreground">MeuDashboard</p>
                <p className="text-xs text-muted">Monitoramento operacional</p>
              </div>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-foreground">Entrar na plataforma</h2>
          <p className="mt-1.5 text-sm text-muted">
            Acesso exclusivo para usuários previamente cadastrados pelo administrador.
          </p>

          {feedbackMessage && (
            <div
              className={`mt-6 rounded-lg px-4 py-3 text-sm ${
                feedbackType === 'success'
                  ? 'bg-success-soft text-success'
                  : 'bg-danger-soft text-danger'
              }`}
            >
              {feedbackMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-foreground">
                Email
              </label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface py-2.5 pl-9 pr-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted/60 focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder="seu@email.com"
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-foreground">
                Senha
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface py-2.5 pl-9 pr-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted/60 focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Entrando...
                </>
              ) : (
                <>
                  Entrar
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 border-t border-border pt-6 text-center">
            <p className="text-xs text-muted">
              Precisa de acesso? Solicite ao administrador responsável pelo seu cliente.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
