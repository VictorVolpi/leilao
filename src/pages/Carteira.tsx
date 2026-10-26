import { useState, useEffect } from 'react';
import { Check, Plus, WalletCards } from '@/components/Icons';
import { formatMoney } from '@/lib/auction';
import { PageHeader } from '@/components/Shell';
import type { DemoUser, Wallet } from '../types';

interface CarteiraProps {
  user: DemoUser;
  wallet?: Wallet;
  onDeposit: (value: number) => Promise<void>;
}

export function Carteira({ user, wallet, onDeposit }: CarteiraProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(500);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Estado local para atualização otimista instantânea na UI
  const [localWallet, setLocalWallet] = useState<Wallet | undefined>(wallet);

  useEffect(() => {
    setLocalWallet(wallet);
  }, [wallet]);

  const total = localWallet?.total_balance ?? 0;
  const committed = localWallet?.committed_balance ?? 0;
  const available = total - committed;

  const handleDeposit = async () => {
    if (value <= 0 || loading) return;

    const amountToAdd = value;
    setLoading(true);
    setOpen(false);

    // Atualização otimista imediata
    setLocalWallet((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        total_balance: prev.total_balance + amountToAdd,
      };
    });

    try {
      await onDeposit(amountToAdd);
      setFeedback(`Depósito de ${formatMoney(amountToAdd)} realizado com sucesso!`);
      window.setTimeout(() => setFeedback(null), 3500);
    } catch (error) {
      console.error('Erro ao realizar depósito:', error);
      setLocalWallet(wallet);
      setFeedback('Erro ao processar o depósito no banco. Tente novamente.');
      window.setTimeout(() => setFeedback(null), 3500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`Gestão Financeira · ${user}`}
        title="Sua Carteira em Uma Visão"
        description="Acompanhe seus fundos para participar dos leilões com tranquilidade. Os valores são simulados para esta experiência."
        action={
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition-all hover:bg-blue-700 active:scale-95 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            <Plus size={15} /> Depositar fundos
          </button>
        }
      />

      {/* Banner de Feedback do Depósito */}
      {feedback && (
        <div
          className={`rounded-xl p-4 text-xs font-bold transition-all shadow-sm ${
            feedback.includes('sucesso')
              ? 'border border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300'
              : 'border border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-800/60 dark:bg-rose-950/40 dark:text-rose-300'
          }`}
        >
          {feedback}
        </div>
      )}

      {/* Cards de Saldo */}
      <div className="grid gap-4 md:grid-cols-3">
        <WalletCard label="Saldo Total" value={total} detail="Fundos adicionados" tone="blue" />
        <WalletCard label="Saldo Comprometido" value={committed} detail="Lances em aberto" tone="amber" />
        <WalletCard label="Saldo Disponível" value={available} detail="Pronto para novos lances" tone="emerald" />
      </div>

      {/* Painel de Atividades & Info */}
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 transition-colors">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">Atividade recente</p>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Movimentações da sua conta simulada</p>
            </div>
            <WalletCards size={20} className="text-slate-400 dark:text-slate-500" />
          </div>

          <div className="mt-6 space-y-4">
            <Activity title="Saldo em conta" detail="Crédito total acumulado" value={total} positive />
            <Activity title="Lances ativos" detail="Valor reservado em leilões" value={committed} />
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/80 via-white to-white p-6 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 transition-colors">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">Como funciona</p>
            <h3 className="mt-2 text-xl font-extrabold text-slate-900 dark:text-white">Lance com confiança.</h3>
            <p className="mt-2.5 text-xs font-medium leading-relaxed text-slate-600 dark:text-slate-400">
              Ao participar de um lote, o valor do seu lance fica comprometido até que você seja superado ou o lote seja encerrado. Se for superado, o saldo volta instantaneamente para o seu disponível.
            </p>
          </div>

          <div className="mt-8 flex items-center gap-3 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              <Check size={16} />
            </span>
            Transações instantâneas e sem taxas
          </div>
        </div>
      </div>

      {/* Modal de Depósito */}
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/60 p-5 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 transition-colors">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">Depósito simulado</p>
            <h2 className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">Adicionar fundos</h2>
            <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">Escolha um valor para atualizar o saldo de {user}.</p>

            <div className="relative mt-6">
              <span className="absolute left-3.5 top-3 text-xs font-bold text-slate-400 dark:text-slate-500">R$</span>
              <input
                autoFocus
                type="number"
                value={value}
                onChange={(event) => setValue(Number(event.target.value))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-xl font-extrabold text-slate-900 outline-none focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-blue-400 dark:focus:bg-slate-800 transition-all"
              />
            </div>

            {/* Sugestões rápidas de valores */}
            <div className="mt-3 flex gap-2">
              {[200, 500, 1000, 2500].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setValue(preset)}
                  className={`flex-1 rounded-lg border py-1.5 text-[11px] font-bold transition-all ${
                    value === preset
                      ? 'border-blue-600 bg-blue-50 text-blue-600 dark:border-blue-500 dark:bg-blue-950/60 dark:text-blue-400'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                  }`}
                >
                  +{preset}
                </button>
              ))}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 py-3 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Cancelar
              </button>
              <button
                onClick={() => void handleDeposit()}
                disabled={value <= 0}
                className="flex-1 rounded-xl bg-blue-600 py-3 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition-all hover:bg-blue-700 active:scale-95 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                Confirmar depósito
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface WalletCardProps {
  label: string;
  value: number;
  detail: string;
  tone: 'blue' | 'amber' | 'emerald' | string;
}

function WalletCard({ label, value, detail, tone }: WalletCardProps) {
  const isEmerald = tone === 'emerald';
  const isAmber = tone === 'amber';

  return (
    <div
      className={`rounded-2xl border bg-white p-5 shadow-sm transition-all dark:bg-slate-900 ${
        isEmerald
          ? 'border-emerald-200 dark:border-emerald-800/60'
          : isAmber
          ? 'border-amber-200 dark:border-amber-800/60'
          : 'border-blue-200 dark:border-blue-800/60'
      }`}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{label}</p>
        <span
          className={`h-2.5 w-2.5 rounded-full ${
            isEmerald ? 'bg-emerald-500' : isAmber ? 'bg-amber-500' : 'bg-blue-600 dark:bg-blue-400'
          }`}
        />
      </div>
      <p className="mt-4 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">{formatMoney(value)}</p>
      <p className="mt-1 text-[11px] font-medium text-slate-400 dark:text-slate-500">{detail}</p>
    </div>
  );
}

interface ActivityProps {
  title: string;
  detail: string;
  value: number;
  positive?: boolean;
}

function Activity({ title, detail, value, positive }: ActivityProps) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 last:border-0 last:pb-0 dark:border-slate-800">
      <div>
        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{title}</p>
        <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">{detail}</p>
      </div>
      <strong className={`text-xs font-extrabold ${positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
        {positive ? '+' : '-'} {formatMoney(value)}
      </strong>
    </div>
  );
}