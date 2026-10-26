export type DemoUser = 'Leiloeiro' | 'Licitante 1' | 'Licitante 2';

export interface Wallet {
  id: string;
  total_balance: number;
  committed_balance: number;
  updated_at?: string;
}

export interface Auction {
  id: string;
  title: string;
  description: string;
  image_url: string;
  start_price: number;
  min_increment: number;
  current_price: number;
  status: 'active' | 'scheduled' | 'ended' | 'cancelled';
  seller_name: string;
  start_time: string;
  end_time: string;
  created_at?: string;
}

export interface Bid {
  id: string;
  auction_id: string;
  bidder_name: string;
  amount: number;
  previous_hash: string;
  hash: string;
  created_at: string;
}

export interface Receipt {
  id: string;
  auction_id: string;
  bidder_name: string;
  amount: number;
  public_token?: string;
  created_at: string;
}

export interface VitrineProps {
  auctions: Auction[];
  onSelectAuction: (id: string) => void;
}

export interface SalaAoVivoProps {
  auctions: Auction[];
  bids: Bid[];
  user: DemoUser;
  wallet: Wallet;
  selectedAuctionId: string | null;
  onSelectAuction: (id: string | null) => void;
  onPlaceBid: (auction: Auction, amount: number) => Promise<{ success: boolean; message: string }>;
  onFinalizeAuction?: (auctionId: string) => Promise<void>;
}

export interface CarteiraProps {
  user: DemoUser;
  wallet: Wallet;
  onDeposit: (amount: number) => Promise<void>;
}

// CORRIGIDO: Adicionado `bids` à interface do ArrematesProps
export interface ArrematesProps {
  user: DemoUser | string;
  bids: Bid[];
  receipts: Receipt[];
  auctions: Auction[];
}

export interface AuditoriaProps {
  auctions: Auction[];
  bids: Bid[];
}

// CORRIGIDO: Adicionadas as props onUpdate, onDelete e user ao PainelLeiloeiroProps
export interface PainelLeiloeiroProps {
  user: DemoUser;
  auctions: Auction[];
  onCreate: (auction: Partial<Auction>) => Promise<void>;
  onUpdate: (id: string, auction: Partial<Auction>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onCancel?: (id: string) => Promise<void>;
}