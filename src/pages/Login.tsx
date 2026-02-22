import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RoundedButton } from '@/components/ui/PremiumComponents';
import { Building2, Mail, Lock, User, Phone, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function Login() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    team: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (!isLogin) {
        if (formData.password !== formData.confirmPassword) {
          alert('As senhas não coincidem.');
          return;
        }

        const { error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              name: formData.name,
              team: formData.team
            }
          }
        });

        if (error) throw error;
        alert('Cadastro realizado com sucesso! Verifique seu e-mail ou faça login.');
        setIsLogin(true);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password
        });

        if (error) throw error;
        localStorage.setItem('isAuthenticated', 'true');
        navigate('/');
      }
    } catch (error: any) {
      console.error('Erro na autenticação:', error.message);
      alert(error.message);
    }
  };

  const handleDemoLogin = () => {
    setFormData({
      ...formData,
      email: 'diretor@kaizen.com',
      password: 'demo'
    });
  };

  return (
    <div className="min-h-screen bg-surface-50 flex flex-col justify-center items-center p-6">
      <div className="w-full max-w-md bg-white dark:bg-surface-100 rounded-3xl shadow-xl p-8 animate-in fade-in zoom-in-95 duration-500">

        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-gold-500 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg shadow-gold-500/30">
            <Building2 size={32} />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Kaizen Axis</h1>
          <p className="text-sm text-text-secondary mt-1">
            {isLogin ? 'Bem-vindo de volta' : 'Crie sua conta'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={20} />
                <input
                  type="text"
                  name="name"
                  placeholder="Nome completo"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-surface-50 rounded-xl border-none focus:ring-2 focus:ring-gold-500 text-text-primary"
                />
              </div>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={20} />
                <select
                  name="team"
                  required
                  value={formData.team}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-surface-50 rounded-xl border-none focus:ring-2 focus:ring-gold-500 text-text-primary appearance-none"
                >
                  <option value="" disabled>Selecione sua equipe</option>
                  <option value="alpha">Equipe Alpha</option>
                  <option value="beta">Equipe Beta</option>
                  <option value="gamma">Equipe Gamma</option>
                </select>
              </div>
            </>
          )}

          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={20} />
            <input
              type="email"
              name="email"
              placeholder="E-mail"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-3 bg-surface-50 rounded-xl border-none focus:ring-2 focus:ring-gold-500 text-text-primary"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={20} />
            <input
              type="password"
              name="password"
              placeholder="Senha"
              required
              value={formData.password}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-3 bg-surface-50 rounded-xl border-none focus:ring-2 focus:ring-gold-500 text-text-primary"
            />
          </div>

          {!isLogin && (
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={20} />
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirme a senha"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 bg-surface-50 rounded-xl border-none focus:ring-2 focus:ring-gold-500 text-text-primary"
              />
            </div>
          )}

          {isLogin && (
            <div className="flex justify-between items-center">
              <button
                type="button"
                onClick={handleDemoLogin}
                className="text-xs font-medium text-blue-600 hover:underline"
              >
                Preencher Demo Diretor
              </button>
              <button type="button" className="text-xs font-medium text-gold-600 hover:underline">
                Esqueceu a senha?
              </button>
            </div>
          )}

          <RoundedButton type="submit" fullWidth className="mt-6 py-4 text-base">
            {isLogin ? 'Entrar' : 'Cadastrar'}
          </RoundedButton>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-text-secondary">
            {isLogin ? 'Ainda não tem uma conta?' : 'Já possui uma conta?'}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="ml-1 font-bold text-gold-600 hover:underline"
            >
              {isLogin ? 'Cadastre-se' : 'Faça login'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
