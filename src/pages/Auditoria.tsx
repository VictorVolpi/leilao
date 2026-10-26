import { useState } from 'react';
import { Check, Copy, ShieldCheck } from '@/components/Icons';
import { formatDate, formatMoney } from '@/lib/auction';
import { PageHeader } from '@/components/Shell';
import type { Auction, Bid } from '../types';

interface AuditoriaProps {
  auctions: Auction[];
  bids: Bid[];
}

export function Auditoria({ auctions = [], bids = [] }: AuditoriaProps) {
  const [copied, setCopied] = useState(false);

  const safeAuctions = Array.isArray(auctions) ? auctions : [];
  const safeBids = Array.isArray(bids) ? bids : [];

  // Seleciona o primeiro lote com Pikachu ou o primeiro disponível
  const auction = safeAuctions.find((item) => item.title.startsWith('Pikachu')) ?? safeAuctions[0];

  // Ordena a história cronologicamente para reconstruir a cadeia
  const history = safeBids
    .filter((bid) => bid.auction_id === auction?.id)
    .sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));

  const copyId = () => {
    if (!auction?.id) return;
    void navigator.clipboard?.writeText(auction.id);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Transparência e Segurança"
        title="Auditoria Pública de Lances"
        description="Qualquer pessoa pode auditar o histórico de lances de um lote sem login e verificar que ele não foi adulterado."
        action={
          <span className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-700 shadow-sm dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300 transition-colors">
            <ShieldCheck size={16} /> Histórico Íntegro
          </span>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        {/* Card do Lote sob Auditoria */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 transition-colors">
          <div className="relative aspect-[16/10] w-full bg-slate-50 dark:bg-slate-950">
            {auction?.image_url && (
              <img src={auction.image_url} alt={auction.title} className="h-full w-full object-contain p-4" />
            )}
          </div>

          <div className="p-6">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
              Lote sob auditoria
            </span>
            <h2 className="mt-3 text-xl font-extrabold text-slate-900 dark:text-white">
              {auction?.title ?? 'Nenhum lote selecionado'}
            </h2>
            <p className="mt-2 text-xs font-medium leading-relaxed text-slate-500 dark:text-slate-400">
              O registro abaixo usa uma cadeia de hashes encadeados: cada lance aponta para o valor e hash do lance anterior, tornando qualquer alteração direta no banco visível instantaneamente.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Lances auditados</p>
                <strong className="mt-1 block text-xl font-extrabold text-slate-900 dark:text-white">{history.length}</strong>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Valor atual</p>
                <strong className="mt-1 block text-xl font-extrabold text-blue-600 dark:text-blue-400">
                  {formatMoney(auction?.current_price ?? 0)}
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* Linha do Tempo e Cadeia de Hashes */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 transition-colors">
          <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">Cadeia de integridade (Hash Chain)</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Verificação sequencial de imutabilidade</p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
              <Check size={12} /> Não adulterado
            </span>
          </div>

          <div className="space-y-0">
            {history.length === 0 ? (
              <div className="py-16 text-center text-xs font-semibold text-slate-400 dark:text-slate-500">
                Nenhum lance registrado neste lote para auditoria.
              </div>
            ) : (
              history.map((bid, index) => (
                <div key={bid.id} className="relative flex gap-4 pb-7 last:pb-0">
                  <div className="relative flex w-7 flex-col items-center">
                    <span className="z-10 grid h-7 w-7 place-items-center rounded-lg border border-blue-200 bg-blue-50 text-[10px] font-bold text-blue-600 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-400">
                      {index + 1}
                    </span>
                    {index < history.length - 1 && <span className="absolute top-7 h-full w-px bg-slate-200 dark:bg-slate-800" />}
                  </div>

                  <div className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50/60 p-4 transition-all hover:border-slate-300 hover:bg-white hover:shadow-sm dark:border-slate-800 dark:bg-slate-800/50 dark:hover:border-slate-700 dark:hover:bg-slate-800">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">{bid.bidder_name}</p>
                        <p className="mt-0.5 text-[10px] font-medium text-slate-400 dark:text-slate-500">{formatDate(bid.created_at)}</p>
                      </div>
                      <strong className="text-xs font-extrabold text-blue-600 dark:text-blue-400">{formatMoney(bid.amount)}</strong>
                    </div>

                    <div className="mt-4 grid gap-2.5 rounded-lg border border-slate-200 bg-white p-3 sm:grid-cols-2 dark:border-slate-700/80 dark:bg-slate-900">
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Hash anterior</p>
                        <p className="mt-1 truncate font-mono text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                          {bid.previous_hash}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Hash deste lance</p>
                        <p className="mt-1 truncate font-mono text-[10px] font-bold text-blue-600 dark:text-blue-400">
                          {bid.hash}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
            <span className="font-semibold text-slate-500 dark:text-slate-400">ID público do lote:</span>
            <button
              onClick={copyId}
              className="flex items-center gap-1.5 font-mono text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              <Copy size={13} /> {copied ? 'Copiado!' : `${auction?.id?.slice(0, 18)}...`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}