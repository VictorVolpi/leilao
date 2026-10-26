import { useState } from 'react';
import { Check, Copy, ShieldCheck } from '@/components/Icons';
import { formatDate, formatMoney } from '@/lib/auction';
import { PageHeader } from '@/components/Shell';
import type { ArrematesProps, DemoUser } from '../types';

export function Arremates({
  auctions = [],
  bids = [],
  receipts = [],
  user,
}: ArrematesProps & { user: DemoUser | string }) {
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Proteção com fallback seguro para arrays indefinidos
  const safeBids = Array.isArray(bids) ? bids : [];
  const safeReceipts = Array.isArray(receipts) ? receipts : [];
  const safeAuctions = Array.isArray(auctions) ? auctions : [];

  // Limpa o sufixo "(Cliente)" para dar match correto nos nomes do banco
  const cleanUser = user.replace(' (Cliente)', '').trim();

  const myBids = safeBids.filter(
    (bid) =>
      bid?.bidder_name === user ||
      bid?.bidder_name === cleanUser ||
      bid?.bidder_name === 'Você'
  );

  const won = safeReceipts.filter(
    (receipt) =>
      receipt?.bidder_name === user ||
      receipt?.bidder_name === cleanUser
  );

  const copy = (token?: string) => {
    if (!token) return;
    void navigator.clipboard?.writeText(`${window.location.origin}/auditoria/${token}`);
    setCopiedToken(token);
    window.setTimeout(() => setCopiedToken(null), 1800);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`Seu Histórico · ${user}`}
        title="Meus Arremates"
        description="Tudo o que você disputou, ganhou e pode comprovar em um só lugar."
      />

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        {/* Painel de Lances Realizados */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 transition-colors">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
            <div>
              <p className="text-base font-bold text-slate-900 dark:text-white">Lances realizados</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Histórico de todas as suas ofertas</p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              {myBids.length} registros
            </span>
          </div>

          <div className="mt-6 space-y-3">
            {myBids.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Você ainda não participou de nenhum lote.
                </p>
                <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                  Acesse a vitrine para começar a dar seus lances.
                </p>
              </div>
            ) : (
              myBids.map((bid) => {
                const auction = safeAuctions.find((item) => item.id === bid.auction_id);
                return (
                  <div
                    key={bid.id}
                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/60 p-4 transition-all hover:border-blue-300 hover:bg-white hover:shadow-sm dark:border-slate-800 dark:bg-slate-800/50 dark:hover:border-blue-500 dark:hover:bg-slate-800"
                  >
                    <div className="flex items-center gap-4">
                      {auction?.image_url && (
                        <img
                          src={auction.image_url}
                          alt={auction.title}
                          className="h-12 w-12 rounded-lg object-contain bg-white p-1 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700"
                        />
                      )}
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                          {auction?.title ?? 'Lote Desconhecido'}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                          {formatDate(bid.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="block text-sm font-extrabold text-blue-600 dark:text-blue-400">
                        {formatMoney(bid.amount)}
                      </span>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">
                        Oferta enviada
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Painel de Comprovantes de Arremate */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 transition-colors">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
            <div>
              <p className="text-base font-bold text-slate-900 dark:text-white">Comprovantes de arremate</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Seus lotes arrematados com sucesso</p>
            </div>
            <div className="rounded-full bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <ShieldCheck size={20} />
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {won.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-10 text-center dark:border-slate-800">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Nenhum arremate concluído ainda.
                </p>
                <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                  Quando o tempo do lote encerrar e você for o maior lance, o recibo aparecerá aqui.
                </p>
              </div>
            ) : (
              won.map((receipt) => {
                const isCopied = copiedToken === receipt.public_token;
                const auction = safeAuctions.find((a) => a.id === receipt.auction_id);
                return (
                  <div
                    key={receipt.id}
                    className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-5 shadow-sm dark:border-emerald-800/60 dark:bg-emerald-950/20"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
                          <Check size={12} /> Arrematado
                        </span>
                        <p className="mt-2.5 text-sm font-bold text-slate-900 dark:text-white">
                          {auction?.title ?? 'Lote Vencido'}
                        </p>
                      </div>
                      <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                        {formatMoney(receipt.amount)}
                      </span>
                    </div>

                    <button
                      onClick={() => copy(receipt.public_token)}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-300 bg-white py-2.5 text-xs font-bold text-emerald-700 shadow-sm transition-all hover:bg-emerald-100 active:scale-[0.99] dark:border-emerald-700 dark:bg-slate-800 dark:text-emerald-300 dark:hover:bg-emerald-950/60"
                    >
                      {isCopied ? (
                        <>
                          <Check size={14} className="text-emerald-600 dark:text-emerald-400" /> Link do comprovante copiado!
                        </>
                      ) : (
                        <>
                          <Copy size={14} /> Copiar comprovante público
                        </>
                      )}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}