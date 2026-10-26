import { useState, useEffect, useMemo } from 'react';
import { Check, Gavel, ShieldCheck, WalletCards, XCircle } from '@/components/Icons';
import { formatDate, formatMoney, getStatus, timeLeft } from '@/lib/auction';
import { PageHeader } from '@/components/Shell';
import type { SalaAoVivoProps } from '../types';

export function SalaAoVivo({
  auctions = [],
  bids = [],
  user,
  wallet,
  selectedAuctionId,
  onSelectAuction,
  onPlaceBid,
  onFinalizeAuction,
}: SalaAoVivoProps) {
  const safeAuctions = Array.isArray(auctions) ? auctions : [];
  const safeBids = Array.isArray(bids) ? bids : [];

  // 1. HOOKS PRIMEIRO (Executados incondicionalmente no topo)
  const currentAuction = useMemo(() => {
    if (selectedAuctionId) {
      const found = safeAuctions.find((a) => a.id === selectedAuctionId);
      if (found) return found;
    }
    return safeAuctions.find((a) => getStatus(a) === 'active') ?? safeAuctions[0];
  }, [safeAuctions, selectedAuctionId]);

  const auctionBids = useMemo(
    () =>
      currentAuction
        ? safeBids
            .filter((bid) => bid.auction_id === currentAuction.id)
            .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
        : [],
    [safeBids, currentAuction]
  );

  const leaderBid = auctionBids[0];
  const leader = leaderBid?.bidder_name;

  const cleanUser = user.replace(' (Cliente)', '').trim();
  const isLeader = leader === user || leader === cleanUser || (leader === 'Você' && cleanUser === 'Licitante 1');

  const minimum = currentAuction
    ? leaderBid
      ? leaderBid.amount + currentAuction.min_increment
      : currentAuction.start_price
    : 0;

  const [amount, setAmount] = useState(minimum);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [, refreshTimer] = useState(0);

  // Timer de contagem regressiva
  useEffect(() => {
    const timer = window.setInterval(() => refreshTimer((v) => v + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);

  // Atualiza valor padrão quando o lote ou o mínimo muda
  useEffect(() => {
    setAmount(minimum);
  }, [minimum, currentAuction?.id]);

  // Liquidação de lote com tempo encerrado
  useEffect(() => {
    if (currentAuction && getStatus(currentAuction) === 'ended' && onFinalizeAuction) {
      void onFinalizeAuction(currentAuction.id);
    }
  }, [currentAuction, onFinalizeAuction]);

  const feedback = useMemo(() => {
    if (isLeader) return { text: 'VOCÊ ESTÁ GANHANDO', tone: 'emerald' };
    if (leader) return { text: 'VOCÊ FOI SUPERADO', tone: 'rose' };
    return null;
  }, [isLeader, leader]);

  // 2. TRATAMENTO SE NÃO HOUVER LOTE (Sempre depois de todos os Hooks)
  if (!currentAuction) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900 transition-colors">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Nenhum lote disponível no momento.</p>
        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Crie novos lotes no Painel do Leiloeiro.</p>
      </div>
    );
  }

  const status = getStatus(currentAuction);
  const validAmount = amount >= minimum;
  const availableBalance = (wallet?.total_balance ?? 0) - (wallet?.committed_balance ?? 0);

  const submitBid = async () => {
    if (submitting || !validAmount) return;
    setSubmitting(true);
    
    const result = await onPlaceBid(currentAuction, amount);
    setMessage(result.message);

    if (result.success) {
      setAmount(amount + currentAuction.min_increment);
    }
    setSubmitting(false);
    window.setTimeout(() => setMessage(null), 4500);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Sala do lote ao vivo"
        title={currentAuction.title}
        description={currentAuction.description}
      />

      {/* Seletor de Lotes para troca rápida de Sala */}
      {safeAuctions.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <span className="text-xs font-bold text-slate-400 dark:text-slate-500 whitespace-nowrap">Alternar lote:</span>
          {safeAuctions.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelectAuction(item.id)}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all whitespace-nowrap ${
                item.id === currentAuction.id
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 dark:bg-blue-500'
                  : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              <span className="truncate max-w-[140px]">{item.title}</span>
              <span
                className={`h-2 w-2 rounded-full ${
                  getStatus(item) === 'active' ? 'bg-emerald-400' : 'bg-slate-300 dark:bg-slate-600'
                }`}
              />
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        {/* Painel do Item em Leilão */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 transition-colors">
          <div className="relative aspect-[16/9] w-full bg-slate-50 dark:bg-slate-950 sm:aspect-[16/8]">
            <img src={currentAuction.image_url} alt={currentAuction.title} className="h-full w-full object-contain p-6" />

            <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
              <div>
                <span className="mb-1.5 inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-md dark:bg-blue-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" /> Ao vivo
                </span>
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">Vendedor: {currentAuction.seller_name}</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white/95 px-4 py-2 text-right shadow-sm backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Tempo restante</p>
                <p className="font-mono text-lg font-extrabold text-slate-900 dark:text-white">
                  {status === 'active' ? timeLeft(currentAuction.end_time) : status === 'scheduled' ? 'Agendado' : 'Encerrado'}
                </p>
              </div>
            </div>
          </div>

          {/* Métricas do Lote */}
          <div className="grid grid-cols-3 divide-x divide-slate-100 border-t border-slate-100 bg-slate-50/50 dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-950/40">
            <div className="p-4 sm:p-5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Lance atual</p>
              <strong className="mt-1 block text-lg font-extrabold text-blue-600 dark:text-blue-400 sm:text-2xl">
                {formatMoney(currentAuction.current_price)}
              </strong>
            </div>
            <div className="p-4 sm:p-5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Incremento mín.</p>
              <strong className="mt-1 block text-lg font-extrabold text-slate-800 dark:text-slate-200 sm:text-2xl">
                {formatMoney(currentAuction.min_increment)}
              </strong>
            </div>
            <div className="p-4 sm:p-5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Total de lances</p>
              <strong className="mt-1 block text-lg font-extrabold text-slate-800 dark:text-slate-200 sm:text-2xl">
                {auctionBids.length}
              </strong>
            </div>
          </div>
        </section>

        {/* Coluna Lateral */}
        <aside className="space-y-5">
          {/* Status do Lance Atual do Usuário */}
          <div
            className={`rounded-2xl border p-5 shadow-sm transition-all ${
              feedback?.tone === 'emerald'
                ? 'border-emerald-200 bg-emerald-50/60 dark:border-emerald-800/60 dark:bg-emerald-950/30'
                : feedback?.tone === 'rose'
                ? 'border-rose-200 bg-rose-50/60 dark:border-rose-800/60 dark:bg-rose-950/30'
                : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
            }`}
          >
            {feedback ? (
              <div className="flex items-center gap-3.5">
                <span
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl font-bold ${
                    feedback.tone === 'emerald'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                  }`}
                >
                  {feedback.tone === 'emerald' ? <Check size={20} /> : <XCircle size={20} />}
                </span>
                <div>
                  <p
                    className={`text-xs font-extrabold tracking-wider ${
                      feedback.tone === 'emerald'
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-rose-700 dark:text-rose-400'
                    }`}
                  >
                    {feedback.text}
                  </p>
                  <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                    {feedback.tone === 'emerald' ? 'Sua oferta é a maior até o momento.' : `Líder atual: ${leader}`}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3.5">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                  <Gavel size={20} />
                </span>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">Lote sem lances</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Seja o primeiro licitante a fazer uma oferta.</p>
                </div>
              </div>
            )}
          </div>

          {/* Form de Envio de Lance */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 transition-colors">
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">Enviar oferta · {user}</p>
                <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">Mínimo: {formatMoney(minimum)}</p>
              </div>
              <WalletCards size={18} className="text-slate-400 dark:text-slate-500" />
            </div>

            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400 dark:text-slate-500">R$</span>
              <input
                type="number"
                value={amount}
                onChange={(event) => setAmount(Number(event.target.value))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-lg font-extrabold text-slate-900 outline-none focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-blue-400 dark:focus:bg-slate-800 transition-all"
              />
            </div>

            {/* Botões Rápidos */}
            <div className="mt-2.5 flex gap-2">
              <button
                type="button"
                onClick={() => setAmount(minimum)}
                className="flex-1 rounded-lg border border-slate-200 bg-slate-50 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
              >
                Mínimo ({formatMoney(minimum)})
              </button>
              <button
                type="button"
                onClick={() => setAmount((prev) => prev + currentAuction.min_increment)}
                className="flex-1 rounded-lg border border-slate-200 bg-slate-50 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
              >
                +{formatMoney(currentAuction.min_increment)}
              </button>
            </div>

            <div className="mt-4 flex items-center justify-between text-[11px] font-medium text-slate-500 dark:text-slate-400">
              <span>Seu saldo disponível</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{formatMoney(availableBalance)}</span>
            </div>

            <button
              disabled={status !== 'active' || isLeader || !validAmount || submitting || availableBalance < amount || user === 'Leiloeiro'}
              onClick={() => void submitBid()}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-xs font-extrabold text-white shadow-md shadow-blue-500/20 transition-all hover:bg-blue-700 active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none dark:bg-blue-500 dark:hover:bg-blue-600 dark:disabled:bg-slate-800 dark:disabled:text-slate-600"
            >
              {submitting
                ? 'Processando...'
                : user === 'Leiloeiro'
                ? 'Leiloeiro não pode dar lances'
                : isLeader
                ? 'Você é o líder atual'
                : status !== 'active'
                ? 'Lote encerrado'
                : availableBalance < amount
                ? 'Saldo insuficiente'
                : `Confirmar lance de ${formatMoney(amount)}`}
              <Gavel size={15} />
            </button>

            {!validAmount && (
              <p className="mt-2 text-center text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                O lance precisa ser no mínimo {formatMoney(minimum)}.
              </p>
            )}

            {message && (
              <p
                className={`mt-3 rounded-xl p-3 text-center text-xs font-semibold ${
                  message.includes('sucesso') || message.includes('registrado')
                    ? 'border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300'
                    : 'border border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800/60 dark:bg-rose-950/40 dark:text-rose-300'
                }`}
              >
                {message}
              </p>
            )}
          </div>

          {/* Histórico ao Vivo */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 transition-colors">
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <p className="text-xs font-bold text-slate-900 dark:text-white">Histórico ao vivo</p>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                <ShieldCheck size={12} /> Íntegro
              </span>
            </div>

            <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
              {auctionBids.length === 0 ? (
                <p className="py-8 text-center text-xs font-medium text-slate-400 dark:text-slate-500">Nenhum lance registrado ainda.</p>
              ) : (
                auctionBids.map((bid, index) => (
                  <div
                    key={bid.id}
                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-800/50"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`grid h-6 w-6 place-items-center rounded-md text-[10px] font-bold ${
                          index === 0
                            ? 'bg-blue-600 text-white dark:bg-blue-500'
                            : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {index + 1}
                      </span>
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">
                          {bid.bidder_name === user || bid.bidder_name === cleanUser ? 'Você' : bid.bidder_name}
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500">{formatDate(bid.created_at)}</p>
                      </div>
                    </div>
                    <strong className="text-xs font-extrabold text-blue-600 dark:text-blue-400">{formatMoney(bid.amount)}</strong>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}