import { useEffect } from 'react';
import { useEmpresas } from '@/hooks/useEmpresas';
import { Button } from '@/components/ui/button';
import { ExternalLink, Building2 } from 'lucide-react';

const Empresas = () => {
  const { empresas, loading } = useEmpresas();

  useEffect(() => {
    document.title = 'Empresas | Ágora Tech Park';
    const meta = document.querySelector('meta[name="description"]');
    const content = 'Conheça as empresas instaladas no Ágora Tech Park.';
    if (meta) meta.setAttribute('content', content);
    else {
      const m = document.createElement('meta');
      m.name = 'description';
      m.content = content;
      document.head.appendChild(m);
    }
  }, []);

  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <header className="border-b border-neutral-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex items-center gap-4">
          <img src="/icon.png" alt="Ágora Tech Park" className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl" />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Empresas do Parque</h1>
            <p className="text-xs sm:text-sm text-neutral-500">Ágora Tech Park</p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-12 h-12 border-4 border-neutral-200 border-t-[#F5A623] rounded-full animate-spin" />
          </div>
        ) : empresas.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-neutral-100 flex items-center justify-center mb-4">
              <Building2 className="w-8 h-8 text-neutral-400" />
            </div>
            <p className="text-neutral-500">Nenhuma empresa cadastrada ainda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {empresas.map((empresa) => (
              <article
                key={empresa.id}
                className="group bg-white rounded-2xl border border-neutral-200 hover:border-[#F5A623]/40 hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col"
              >
                <div className="aspect-[4/3] bg-neutral-50 flex items-center justify-center p-8 border-b border-neutral-100">
                  {empresa.logoUrl ? (
                    <img
                      src={empresa.logoUrl}
                      alt={`Logo ${empresa.nome}`}
                      className="max-w-full max-h-full object-contain"
                      loading="lazy"
                    />
                  ) : (
                    <Building2 className="w-16 h-16 text-neutral-300" />
                  )}
                </div>
                <div className="p-5 sm:p-6 flex flex-col flex-1">
                  <h2 className="text-lg font-semibold mb-2 text-neutral-900">{empresa.nome}</h2>
                  <p className="text-sm text-neutral-600 leading-relaxed mb-5 line-clamp-3 flex-1">
                    {empresa.descricao || 'Sem descrição.'}
                  </p>
                  <Button
                    asChild
                    className="w-full bg-[#F5A623] hover:bg-[#E09612] text-white font-medium"
                  >
                    <a href={empresa.siteUrl} target="_blank" rel="noopener noreferrer">
                      Visitar site
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </a>
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-neutral-200 mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 text-center text-xs text-neutral-400">
          © {new Date().getFullYear()} Ágora Tech Park
        </div>
      </footer>
    </div>
  );
};

export default Empresas;
