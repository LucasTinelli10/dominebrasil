import React from 'react';
import { Mail, Phone, MapPin, Instagram, Facebook, Linkedin, Youtube } from 'lucide-react';

export const FooterNew: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-white pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-xl bg-teal-500 flex items-center justify-center">
                <span className="text-white font-display font-bold text-xl">D</span>
              </div>
              <span className="font-display font-bold text-2xl">
                Domine<span className="text-teal-400">Brasil</span>
              </span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">
              A primeira plataforma que conecta alunos, instrutores independentes e investidores de frota 
              em um único ecossistema. Conforme Lei CONTRAN.
            </p>
            <div className="flex gap-3">
              <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-teal-500 transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-teal-500 transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-teal-500 transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-teal-500 transition-colors">
                <Youtube className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Para Você */}
          <div>
            <h4 className="font-bold text-lg mb-4">Para Você</h4>
            <ul className="space-y-3 text-sm text-slate-400">
              <li><a href="#" className="hover:text-teal-400 transition-colors">Sou Aluno</a></li>
              <li><a href="#" className="hover:text-teal-400 transition-colors">Sou Instrutor</a></li>
              <li><a href="#" className="hover:text-teal-400 transition-colors">Sou Investidor de Frota</a></li>
              <li><a href="#" className="hover:text-teal-400 transition-colors">Como Funciona</a></li>
              <li><a href="#" className="hover:text-teal-400 transition-colors">Preços</a></li>
            </ul>
          </div>

          {/* Suporte */}
          <div>
            <h4 className="font-bold text-lg mb-4">Suporte</h4>
            <ul className="space-y-3 text-sm text-slate-400">
              <li><a href="#" className="hover:text-teal-400 transition-colors">Central de Ajuda</a></li>
              <li><a href="#" className="hover:text-teal-400 transition-colors">Termos de Uso</a></li>
              <li><a href="#" className="hover:text-teal-400 transition-colors">Política de Privacidade</a></li>
              <li><a href="#" className="hover:text-teal-400 transition-colors">FAQ</a></li>
              <li><a href="#" className="hover:text-teal-400 transition-colors">Fale Conosco</a></li>
            </ul>
          </div>

          {/* Contato */}
          <div>
            <h4 className="font-bold text-lg mb-4">Contato</h4>
            <ul className="space-y-3 text-sm text-slate-400">
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
                  <Mail className="h-4 w-4 text-teal-400" />
                </div>
                contato@dominebrasil.com.br
              </li>
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
                  <Phone className="h-4 w-4 text-teal-400" />
                </div>
                (11) 99999-9999
              </li>
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                  <MapPin className="h-4 w-4 text-teal-400" />
                </div>
                São Paulo, SP - Brasil
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-800 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-500">
              © {new Date().getFullYear()} DomineBrasil. Todos os direitos reservados.
            </p>
            <div className="flex items-center gap-6 text-sm text-slate-500">
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Sistema Operacional
              </span>
              <span>CNPJ: 00.000.000/0001-00</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
