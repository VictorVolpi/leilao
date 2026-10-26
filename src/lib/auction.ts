import { supabase } from './supabase';
import type { Auction, Bid, Wallet } from '../types';

export const DEFAULT_IMAGE =
  'https://images.unsplash.com/photo-1561214115-f2f134cc4912?auto=format&fit=crop&w=900&q=85';

export function formatMoney(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'medium',
  });
}

export function timeLeft(endTimeString: string): string {
  const diff = new Date(endTimeString).getTime() - Date.now();
  if (diff <= 0) return 'Encerrado';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

export function getStatus(auction: Auction): 'active' | 'scheduled' | 'ended' {
  const now = new Date();
  const start = new Date(auction.start_time);
  const end = new Date(auction.end_time);

  if (now < start) return 'scheduled';
  if (now > end || auction.status === 'ended') return 'ended';
  return 'active';
}

// ---------------------------------------------------------------------------
// 1. REGRAS DE LANCE + ANTI-SNIPING + SALDO COMPROMETIDO
// ---------------------------------------------------------------------------
export async function placeBid(
  auction: Auction,
  bidderName: string,
  amount: number,
  wallet?: Wallet,
  lastBid?: Bid
): Promise<{ success: boolean; message: string }> {
  // A. Validação do Estado do Lote
  const status = getStatus(auction);
  if (status !== 'active') {
    return { success: false, message: 'Este lote não está ativo no momento.' };
  }

  // B. Impedir Leiloeiro de dar lances
  if (bidderName === 'Leiloeiro') {
    return { success: false, message: 'O leiloeiro não tem permissão para realizar lances.' };
  }

  // C. Validação de Valor Mínimo
  const minRequired = auction.current_price === auction.start_price && !lastBid
    ? auction.start_price
    : auction.current_price + auction.min_increment;

  if (amount < minRequired) {
    return {
      success: false,
      message: `O lance mínimo aceito para este lote é de ${formatMoney(minRequired)}.`,
    };
  }

  // D. Impedir Líder de Cobrir o Próprio Lance
  if (lastBid && lastBid.bidder_name === bidderName) {
    return { success: false, message: 'Você já é o líder atual deste leilão.' };
  }

  // E. Validação do Saldo Disponível
  const available = (wallet?.total_balance ?? 0) - (wallet?.committed_balance ?? 0);
  if (amount > available) {
    return {
      success: false,
      message: `Saldo insuficiente na sua carteira. Saldo disponível: ${formatMoney(available)}.`,
    };
  }

  // F. Cálculo da Cadeia de Hashes (Hash Chain / Imutabilidade)
  const previousHash = lastBid?.hash ?? 'GENESIS_AURORA_HASH_00000000000000';
  const bidPayload = `${auction.id}:${bidderName}:${amount}:${previousHash}:${Date.now()}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(bidPayload);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const newHash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

  // G. Registrar o Lance na Tabela `bids`
  const { error: bidError } = await supabase.from('bids').insert([
    {
      auction_id: auction.id,
      bidder_name: bidderName,
      amount: amount,
      previous_hash: previousHash,
      hash: newHash,
    },
  ]);

  if (bidError) {
    console.error('Erro ao salvar lance:', bidError);
    return { success: false, message: 'Falha ao processar a oferta no servidor.' };
  }

  // H. Regra Anti-sniping (Prorrogação nos Últimos 2 Minutos)
  const now = new Date().getTime();
  const endTime = new Date(auction.end_time).getTime();
  const twoMinutesMs = 2 * 60 * 1000;
  let newEndTime = auction.end_time;

  if (endTime - now <= twoMinutesMs) {
    newEndTime = new Date(endTime + twoMinutesMs).toISOString();
  }

  // I. Atualizar o Valor Atual e Fim do Lote
  await supabase
    .from('auctions')
    .update({
      current_price: amount,
      end_time: newEndTime,
    })
    .eq('id', auction.id);

  // J. Recalcular e Atualizar Saldos Comprometidos na Tabela `wallets`
  await updateCommittedBalances(auction.id, bidderName, amount, lastBid);

  return { success: true, message: 'Lance realizado com sucesso!' };
}

// ---------------------------------------------------------------------------
// RECALCULAR SALDOS COMPROMETIDOS
// ---------------------------------------------------------------------------
async function updateCommittedBalances(
  auctionId: string,
  newLeader: string,
  newAmount: number,
  previousBid?: Bid
) {
  // Se havia um líder anterior superado, libera o saldo dele
  if (previousBid && previousBid.bidder_name !== newLeader) {
    const { data: prevWallet } = await supabase
      .from('wallets')
      .select('*')
      .eq('id', previousBid.bidder_name)
      .single();

    if (prevWallet) {
      const updatedCommitted = Math.max(0, Number(prevWallet.committed_balance) - Number(previousBid.amount));
      await supabase
        .from('wallets')
        .update({ committed_balance: updatedCommitted })
        .eq('id', previousBid.bidder_name);
    }
  }

  // Atualiza/Reserva o saldo do novo líder
  const { data: currWallet } = await supabase
    .from('wallets')
    .select('*')
    .eq('id', newLeader)
    .single();

  if (currWallet) {
    const previousLeaderCommitment = previousBid?.bidder_name === newLeader ? Number(previousBid.amount) : 0;
    const newCommitted = Number(currWallet.committed_balance) - previousLeaderCommitment + newAmount;

    await supabase
      .from('wallets')
      .update({ committed_balance: newCommitted })
      .eq('id', newLeader);
  }
}

// ---------------------------------------------------------------------------
// 2. CANCELAMENTO DE LOTE COM ESTORNO AUTOMÁTICO DO SALDO COMPROMETIDO
// ---------------------------------------------------------------------------
export async function cancelAuctionWithRefund(auctionId: string): Promise<void> {
  // A. Busca o maior lance do lote para identificar quem tem saldo retido
  const { data: highestBid } = await supabase
    .from('bids')
    .select('*')
    .eq('auction_id', auctionId)
    .order('amount', { ascending: false })
    .limit(1)
    .maybeSingle();

  // B. Se houver um líder com saldo comprometido, realiza o estorno
  if (highestBid) {
    const leader = highestBid.bidder_name;
    const amountToRefund = Number(highestBid.amount);

    const { data: wallet } = await supabase
      .from('wallets')
      .select('*')
      .eq('id', leader)
      .single();

    if (wallet) {
      const newCommitted = Math.max(0, Number(wallet.committed_balance) - amountToRefund);
      await supabase
        .from('wallets')
        .update({ committed_balance: newCommitted })
        .eq('id', leader);
    }
  }

  // C. Atualiza o status do lote para cancelado
  await supabase
    .from('auctions')
    .update({ status: 'cancelled' })
    .eq('id', auctionId);
}

// ---------------------------------------------------------------------------
// 3. LIQUIDAÇÃO DO LOTE AO ENCERRAR
// ---------------------------------------------------------------------------
export async function finalizeAuction(auctionId: string): Promise<void> {
  // Busca o lote
  const { data: auction } = await supabase
    .from('auctions')
    .select('*')
    .eq('id', auctionId)
    .single();

  if (!auction || auction.status === 'ended') return;

  // Busca o maior lance registrado
  const { data: highestBid } = await supabase
    .from('bids')
    .select('*')
    .eq('auction_id', auctionId)
    .order('amount', { ascending: false })
    .limit(1)
    .maybeSingle();

  // Atualiza status do lote para encerrado
  await supabase
    .from('auctions')
    .update({ status: 'ended' })
    .eq('id', auctionId);

  if (highestBid) {
    const winner = highestBid.bidder_name;
    const amount = Number(highestBid.amount);

    // Debita o saldo total do Vencedor e zera seu comprometido deste lote
    const { data: winnerWallet } = await supabase
      .from('wallets')
      .select('*')
      .eq('id', winner)
      .single();

    if (winnerWallet) {
      const newTotal = Number(winnerWallet.total_balance) - amount;
      const newCommitted = Math.max(0, Number(winnerWallet.committed_balance) - amount);

      await supabase
        .from('wallets')
        .update({
          total_balance: newTotal,
          committed_balance: newCommitted,
        })
        .eq('id', winner);
    }

    // Credita o valor na carteira do Leiloeiro
    const { data: sellerWallet } = await supabase
      .from('wallets')
      .select('*')
      .eq('id', 'Leiloeiro')
      .maybeSingle();

    const sellerTotal = (Number(sellerWallet?.total_balance) || 0) + amount;
    await supabase.from('wallets').upsert({
      id: 'Leiloeiro',
      total_balance: sellerTotal,
      committed_balance: 0,
    });

    // Cria o Comprovante Oficial na tabela `receipts`
    await supabase.from('receipts').insert([
      {
        auction_id: auctionId,
        bidder_name: winner,
        amount: amount,
      },
    ]);
  }
}

// ---------------------------------------------------------------------------
// SEED DE DADOS INICIAIS (REQUISITO DA VERZEL)
// ---------------------------------------------------------------------------
export async function seedDemoData(): Promise<void> {
  // 1. Criar carteiras iniciais para Leiloeiro, Licitante 1 e Licitante 2
  await supabase.from('wallets').upsert([
    { id: 'Leiloeiro', total_balance: 0, committed_balance: 0 },
    { id: 'Licitante 1', total_balance: 5000, committed_balance: 0 },
    { id: 'Licitante 2', total_balance: 5000, committed_balance: 0 },
  ]);

  // 2. Verificar se já existe algum lote ativo
  const { data: existingAuctions } = await supabase.from('auctions').select('id').limit(1);

  if (!existingAuctions || existingAuctions.length === 0) {
    // Insere lote demo de Pikachu
    const { data: newAuction } = await supabase
      .from('auctions')
      .insert([
        {
          title: 'Pikachu Special Illustration Rare',
          description: 'Carta raríssima de coleção com acabamento metalizado e verificação oficial.',
          image_url:
            'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png',
          start_price: 300,
          current_price: 300,
          min_increment: 25,
          status: 'active',
          seller_name: 'Casa Aurora',
          start_time: new Date().toISOString(),
          end_time: new Date(Date.now() + 1000 * 60 * 180).toISOString(),
        },
      ])
      .select()
      .single();

    if (newAuction) {
      console.log('Lote semeado com sucesso:', newAuction.id);
    }
  }
}