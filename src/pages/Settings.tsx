import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { User, Bell, Shield, Database } from 'lucide-react'

export function Settings() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
          <p className="text-gray-500">Gerencie suas preferências e configurações do sistema</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 bg-primary/10 text-primary rounded-lg flex items-center justify-center">
                <User className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Perfil</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                <input
                  type="text"
                  defaultValue="João Silva"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  defaultValue="joao.silva@empresa.com"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <button className="w-full bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg transition-colors">
                Salvar Alterações
              </button>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 bg-warning/10 text-warning rounded-lg flex items-center justify-center">
                <Bell className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Notificações</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Ocorrências críticas</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Alertas de manutenção</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Relatórios semanais</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 bg-success/10 text-success rounded-lg flex items-center justify-center">
                <Shield className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Segurança</h3>
            </div>
            
            <div className="space-y-4">
              <button className="w-full border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg transition-colors">
                Alterar Senha
              </button>
              <button className="w-full border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg transition-colors">
                Ver Logs de Acesso
              </button>
              <button className="w-full border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg transition-colors">
                Autenticação de Dois Fatores
              </button>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 bg-neutral/10 text-neutral rounded-lg flex items-center justify-center">
                <Database className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Dados</h3>
            </div>
            
            <div className="space-y-4">
              <button className="w-full border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg transition-colors">
                Exportar Dados
              </button>
              <button className="w-full border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg transition-colors">
                Importar Dados
              </button>
              <button className="w-full border border-danger/30 hover:bg-danger/5 text-danger px-4 py-2 rounded-lg transition-colors">
                Limpar Cache
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
