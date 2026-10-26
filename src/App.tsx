import { useState, useEffect } from 'react';
import { Shell, View } from './components/Shell';
import { Vitrine } from './pages/Vitrine';
import { SalaAoVivo } from './pages/SalaAoVivo';
import { Carteira } from './pages/Carteira';
import { Arremates } from './pages/Arremates';
import { Auditoria } from './pages/Auditoria';
import { PainelLeiloeiro } from './pages/PainelLeiloeiro';
import { supabase } from './lib/supabase';
import { placeBid, seedDemoData, finalizeAuction } from './lib/auction';
import type { Auction, Bid, Wallet, Receipt, DemoUser } from './types';

export default function App() {
  const [view, setView] = useState<View>('vitrine');
  const [user, setUser] = useState<DemoUser>('Licitante 1');

  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [bids, setBids] = useState<Bid[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [selectedAuctionId, setSelectedAuctionId] = useState<string | null>(null);

  // Ler parâmetros da URL no carregamento (para suporte a links diretos)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view') as View;
    const auctionParam = params.get('auctionId');

    if (viewParam) setView(viewParam);
    if (auctionParam) setSelectedAuctionId(auctionParam);
  }, []);

  // Procurar dados e criar subscrição em tempo real no Supabase
  useEffect(() => {
    const fetchData = async () => {
      const { data: auctionsData } = await supabase
        .from('auctions')
        .select('*')
        .order('created_at', { ascending: false });

      const { data: bidsData } = await supabase
        .from('bids')
        .select('*')
        .order('created_at', { ascending: true });

      const { data: walletsData } = await supabase.from('wallets').select('*');

      const { data: receiptsData } = await supabase
        .from('receipts')
        .select('*')
        .order('created_at', { ascending: false });

      if (auctionsData) setAuctions(auctionsData);
      if (bidsData) setBids(bidsData);
      if (walletsData) setWallets(walletsData);
      if (receiptsData) setReceipts(receiptsData);

      // Se não houver lotes, semeia os dados iniciais
      if (!auctionsData || auctionsData.length === 0) {
        await seedDemoData();
      }
    };

    void fetchData();

    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'auctions' }, () => void fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bids' }, () => void fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wallets' }, () => void fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'receipts' }, () => void fetchData())
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  // Criar novo lote (Protegido contra execuções por Licitantes)
  const handleCreateAuction = async (newAuction: Partial<Auction>) => {
    if (user !== 'Leiloeiro') {
      alert('Acesso negado: Apenas o perfil Leiloeiro pode criar e publicar novos lotes.');
      return;
    }

    const { error } = await supabase.from('auctions').insert([
      {
        ...newAuction,
        seller_name: 'Leiloeiro',
      },
    ]);

    if (error) {
      console.error('Erro ao criar lote:', error);
      alert('Erro ao publicar lote no banco de dados.');
    }
  };

  // Editar lote existente (Apenas Leiloeiro)
  const handleUpdateAuction = async (id: string, updatedData: Partial<Auction>) => {
    if (user !== 'Leiloeiro') return;

    // Atualização Otimista na UI
    setAuctions((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...updatedData } : a))
    );

    const { error } = await supabase.from('auctions').update(updatedData).eq('id', id);
    if (error) {
      console.error('Erro ao atualizar lote:', error);
      alert('Erro ao salvar alterações do lote.');
    }
  };

  // Excluir lote (Apenas Leiloeiro)
  const handleDeleteAuction = async (id: string) => {
    if (user !== 'Leiloeiro') return;

    if (!window.confirm('Tem certeza de que deseja excluir este lote permanentemente?')) return;

    // Remoção Otimista na UI
    setAuctions((prev) => prev.filter((a) => a.id !== id));

    const { error } = await supabase.from('auctions').delete().eq('id', id);
    if (error) {
      console.error('Erro ao excluir lote:', error);
      alert('Erro ao excluir lote no banco de dados.');
    }
  };

  // Cancelar lote agendado (Protegido contra execuções por Licitantes)
  const handleCancelAuction = async (id: string) => {
    if (user !== 'Leiloeiro') {
      alert('Acesso negado: Apenas o perfil Leiloeiro pode cancelar lotes.');
      return;
    }

    await supabase.from('auctions').update({ status: 'cancelled' }).eq('id', id);
  };

  // Depósito simulado na carteira (Com atualização instantânea de estado)
  const handleDeposit = async (amount: number) => {
    const activeWallet = wallets.find((w) => w.id === user);
    const currentTotal = activeWallet?.total_balance ?? 0;
    const currentCommitted = activeWallet?.committed_balance ?? 0;
    const newTotal = currentTotal + amount;

    // 1. ATUALIZAÇÃO OTIMISTA NO REACT (0ms de delay na tela)
    setWallets((prevWallets) => {
      const exists = prevWallets.some((w) => w.id === user);
      if (exists) {
        return prevWallets.map((w) =>
          w.id === user ? { ...w, total_balance: newTotal } : w
        );
      }
      return [
        ...prevWallets,
        { id: user, total_balance: newTotal, committed_balance: currentCommitted },
      ];
    });

    // 2. SALVA NO SUPABASE EM SEGUNDO PLANO
    const { error } = await supabase.from('wallets').upsert({
      id: user,
      total_balance: newTotal,
      committed_balance: currentCommitted,
    });

    if (error) {
      console.error('Erro ao salvar no banco:', error);
      // Reverte se a chamada de rede falhar
      setWallets((prev) =>
        prev.map((w) => (w.id === user ? { ...w, total_balance: currentTotal } : w))
      );
    }
  };

  // Enviar novo lance
  const handlePlaceBid = async (auction: Auction, amount: number) => {
    const activeWallet = wallets.find((w) => w.id === user);
    const auctionBids = bids.filter((b) => b.auction_id === auction.id);
    const lastBid = auctionBids[auctionBids.length - 1];

    return await placeBid(auction, user, amount, activeWallet, lastBid);
  };

  const currentWallet = wallets.find((w) => w.id === user) ?? {
    id: user,
    total_balance: 0,
    committed_balance: 0,
  };

  return (
    <Shell view={view} setView={setView} user={user} setUser={setUser}>
      {view === 'vitrine' && (
        <Vitrine
          auctions={auctions}
          onSelectAuction={(id: string) => {
            setSelectedAuctionId(id);
            setView('sala');
          }}
        />
      )}

      {view === 'sala' && (
        <SalaAoVivo
          auctions={auctions}
          bids={bids}
          user={user}
          wallet={currentWallet}
          selectedAuctionId={selectedAuctionId}
          onSelectAuction={setSelectedAuctionId}
          onPlaceBid={handlePlaceBid}
          onFinalizeAuction={finalizeAuction}
        />
      )}

      {view === 'carteira' && (
        <Carteira user={user} wallet={currentWallet} onDeposit={handleDeposit} />
      )}

      {view === 'arremates' && (
        <Arremates user={user} bids={bids} receipts={receipts} auctions={auctions} />
      )}

      {view === 'auditoria' && <Auditoria auctions={auctions} bids={bids} />}

      {view === 'painel' && (
        <PainelLeiloeiro
          user={user}
          auctions={auctions}
          onCreate={handleCreateAuction}
          onUpdate={handleUpdateAuction}
          onDelete={handleDeleteAuction}
          onCancel={handleCancelAuction}
        />
      )}
    </Shell>
  );
}