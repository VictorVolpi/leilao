import { useEffect, useState, useMemo } from 'react';
import { ArrowUpRight, Clock3, Gavel, Search, Sparkles } from '@/components/Icons';
import { formatMoney, getStatus, timeLeft } from '@/lib/auction';
import { PageHeader } from '@/components/Shell';
import type { VitrineProps, Auction } from '../types';

export function Vitrine({ auctions = [], onSelectAuction }: VitrineProps) {
  const safeAuctions = Array.isArray(auctions) ? auctions : [];

  // Oculta lotes cancelados
  const validAuctions = useMemo(
    () => safeAuctions.filter((a) => a.status !== 'cancelled'),
    [safeAuctions]
  );

  // Define a aba inicial inteligente (prioriza active -> scheduled -> ended)
  const initialTab = useMemo(() => {
    if (validAuctions.some((a) => getStatus(a) === 'active')) return 'active';
    if (validAuctions.some((a) => getStatus(a) === 'scheduled')) return 'scheduled';
    return 'ended';
  }, [validAuctions]);

  const [tab, setTab] = useState<'active' | 'scheduled' | 'ended'>(initialTab);
  const [search, setSearch] = useState('');
  const [, refreshTimer] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => refreshTimer((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  const activeCount = validAuctions.filter((a) => getStatus(a) === 'active').length;
  const scheduledCount = validAuctions.filter((a) => getStatus(a) === 'scheduled').length;
  const endedCount = validAuctions.filter((a) => getStatus(a) === 'ended').length;

  const filtered = validAuctions
    .filter((auction) => getStatus(auction) === tab)
    .filter(
      (auction) =>
        auction.title.toLowerCase().includes(search.toLowerCase().trim()) ||
        auction.description?.toLowerCase().includes(search.toLowerCase().trim())
    );

  const handleOpenLiveRoom = () => {
    const activeAuction = validAuctions.find((auction) => getStatus(auction) === 'active') ?? validAuctions[0];
    if (activeAuction) {
      onSelectAuction(activeAuction.id);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Leilões selecionados · Aurora 2026"
        title="Objetos com uma história para contar."
        description="Uma curadoria de peças extraordinárias, com procedência verificada e uma experiência de lance ao vivo."
        action={
          <button
            onClick={handleOpenLiveRoom}
            className="group flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition-all hover:bg-blue-700 active:scale-95 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            Entrar na sala ao vivo{' '}
            <ArrowUpRight
              size={15}
              className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            />
          </button>
        }
      />

      {/* Cards de Métricas em Destaque */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div
          onClick={() => setTab('active')}
          className={`cursor-pointer rounded-2xl p-5 text-white shadow-md transition-all hover:opacity-95 ${
            tab === 'active' ? 'ring-2 ring-blue-600 ring-offset-2 dark:ring-offset-slate-950' : ''
          } bg-blue-600`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-blue-100">Ao Vivo Agora</span>
            <div className="rounded-xl bg-white/20 p-2.5 backdrop-blur-md">
              <Gavel size={20} className="text-white" />
            </div>
          </div>
          <p className="mt-2 text-3xl font-extrabold">{activeCount}</p>
          <p className="mt-1 text-[11px] text-blue-100">Lotes disponíveis para lance</p>
        </div>

        <div
          onClick={() => setTab('scheduled')}
          className={`cursor-pointer rounded-2xl p-5 text-white shadow-md transition-all hover:opacity-95 ${
            tab === 'scheduled' ? 'ring-2 ring-amber-500 ring-offset-2 dark:ring-offset-slate-950' : ''
          } bg-amber-500`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-amber-100">Agendados</span>
            <div className="rounded-xl bg-white/20 p-2.5 backdrop-blur-md">
              <Clock3 size={20} className="text-white" />
            </div>
          </div>
          <p className="mt-2 text-3xl font-extrabold">{scheduledCount}</p>
          <p className="mt-1 text-[11px] text-amber-100">Em breve na plataforma</p>
        </div>

        <div
          onClick={() => setTab('ended')}
          className={`cursor-pointer rounded-2xl p-5 text-white shadow-md transition-all hover:opacity-95 ${
            tab === 'ended' ? 'ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-slate-950' : ''
          } bg-emerald-500`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-emerald-100">Encerrados</span>
            <div className="rounded-xl bg-white/20 p-2.5 backdrop-blur-md">
              <Sparkles size={20} className="text-white" />
            </div>
          </div>
          <p className="mt-2 text-3xl font-extrabold">{endedCount}</p>
          <p className="mt-1 text-[11px] text-emerald-100">Lotes arrematados com sucesso</p>
        </div>
      </div>

      {/* Controles: Busca e Seleção de Abas Clean com Dark Mode */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 transition-colors">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-3 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome do item ou descrição..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-xs font-medium text-slate-800 placeholder-slate-400 outline-none focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 dark:focus:border-blue-400 transition-all"
          />
        </div>

        <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
          {(
            [
              { key: 'active', label: 'Ao vivo', count: activeCount },
              { key: 'scheduled', label: 'Agendados', count: scheduledCount },
              { key: 'ended', label: 'Encerrados', count: endedCount },
            ] as const
          ).map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
                tab === key
                  ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-900 dark:text-blue-400'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              {label}
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  tab === key
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300'
                    : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                }`}
              >
                {count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Grid de Lotes com Card Clean/Branco */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Nenhum lote encontrado nesta seleção.</p>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Tente buscar por outros termos ou selecione uma aba acima.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((auction) => (
            <AuctionCard key={auction.id} auction={auction} onSelectAuction={onSelectAuction} />
          ))}
        </div>
      )}
    </div>
  );
}

interface AuctionCardProps {
  auction: Auction;
  onSelectAuction: (id: string) => void;
}

function AuctionCard({ auction, onSelectAuction }: AuctionCardProps) {
  const status = getStatus(auction);

  return (
    <article className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700">
      <div>
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-50 p-4 dark:bg-slate-950">
          <img
            src={auction.image_url}
            alt={auction.title}
            className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
          />

          <div className="absolute left-3.5 top-3.5 flex gap-2">
            <span
              className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
                status === 'active'
                  ? 'bg-blue-600 text-white dark:bg-blue-500'
                  : status === 'ended'
                  ? 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  : 'bg-amber-500 text-white'
              }`}
            >
              {status === 'active' ? 'Ao vivo' : status === 'ended' ? 'Encerrado' : 'Em breve'}
            </span>
          </div>

          {status === 'active' && (
            <div className="absolute bottom-3.5 right-3.5 flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white/90 px-3 py-1 text-xs font-bold text-slate-700 shadow-sm backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-200">
              <Clock3 size={13} className="text-blue-600 dark:text-blue-400 animate-pulse" />
              {timeLeft(auction.end_time)}
            </div>
          )}
        </div>

        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-400">
                {auction.title}
              </h3>
              <p className="mt-1 line-clamp-2 text-xs font-medium leading-relaxed text-slate-500 dark:text-slate-400">
                {auction.description}
              </p>
            </div>
            <button
              onClick={() => onSelectAuction(auction.id)}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 transition-all hover:border-blue-500 hover:bg-blue-600 hover:text-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:border-blue-500 dark:hover:bg-blue-500 dark:hover:text-white"
              title="Ver detalhes do lote"
            >
              <ArrowUpRight size={15} />
            </button>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-100 bg-slate-50/50 p-5 dark:border-slate-800 dark:bg-slate-950/40">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {status === 'active' ? 'Lance atual' : status === 'ended' ? 'Arrematado por' : 'Lance inicial'}
            </p>
            <strong className="mt-0.5 block text-base font-extrabold text-slate-900 dark:text-white">
              {formatMoney(auction.current_price || auction.start_price)}
            </strong>
          </div>

          {status === 'active' && (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400">
              <Gavel size={13} /> +{formatMoney(auction.min_increment)}
            </span>
          )}

          {status === 'scheduled' && (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400">
              <Sparkles size={13} /> Em breve
            </span>
          )}
        </div>
      </div>
    </article>
  );
}