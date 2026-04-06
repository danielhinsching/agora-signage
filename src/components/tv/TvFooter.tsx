import { Wifi } from 'lucide-react';

export function TvFooter() {
  return (
    <footer className="flex flex-col items-center justify-center gap-1 px-6 py-3 bg-white border-t-4 border-[#F5A623] flex-shrink-0">
      <div className="flex items-center gap-2 text-gray-900 font-bold text-lg">
        <span>Bem-vindo ao Ágora Tech Park</span>
        <span>🚀</span>
      </div>
      <div className="flex items-center gap-2 text-gray-600 text-sm">
        <Wifi className="w-4 h-4 text-[#F5A623]" />
        <span>Conecte-se ao Wi-Fi:</span>
        <span className="font-bold text-gray-900">Agora-Guest</span>
        <span className="text-gray-400">|</span>
        <span>Senha:</span>
        <span className="font-bold text-gray-900">inovacao2025</span>
      </div>
    </footer>
  );
}
