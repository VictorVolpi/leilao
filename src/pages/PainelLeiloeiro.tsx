import { useState } from 'react';
import { Check, Clock3, LoaderCircle, Pencil, Plus, Search, Trash2, XCircle } from '@/components/Icons';
import { formatMoney, getStatus } from '@/lib/auction';
import { PageHeader } from '@/components/Shell';
import type { Auction, DemoUser } from '../types';

interface PainelLeiloeiroProps {
  user: DemoUser;
  auctions: Auction[];
  onCreate: (auction: Partial<Auction>) => Promise<void>;
  onUpdate: (id: string, auction: Partial<Auction>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onCancel?: (id: string) => Promise<void>; 
}

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1561214115-f2f134cc4912?auto=format&fit=crop&w=900&q=85';

export function PainelLeiloeiro({ user, auctions = [], onCreate, onUpdate, onDelete }: PainelLeiloeiroProps) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [result, setResult] = useState<{ name: string; image: string; description: string } | null>(null);

  // Modal de Edição
  const [editingAuction, setEditingAuction] = useState<Auction | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editStartPrice, setEditStartPrice] = useState(0);
  const [editMinIncrement, setEditMinIncrement] = useState(0);

  // Formulário do Lote
  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [startPrice, setStartPrice] = useState(300);
  const [minIncrement, setMinIncrement] = useState(25);
  const [durationMinutes, setDurationMinutes] = useState(180); // Padrão: 3 horas (180 min)

  const isLeiloeiro = user === 'Leiloeiro';
  const safeAuctions = Array.isArray(auctions) ? auctions : [];

  const search = async () => {
    if (!query.trim() || !isLeiloeiro) return;
    setLoading(true);
    try {
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${query.toLowerCase().trim()}`);
      if (!response.ok) throw new Error('Não encontrado');
      const data = (await response.json()) as {
        name: string;
        sprites: { other?: { 'official-artwork'?: { front_default?: string } } };
        types: { type: { name: string } }[];
      };
      
      const foundImage = data.sprites.other?.['official-artwork']?.front_default ?? DEFAULT_IMAGE;
      const formattedTitle = data.name.charAt(0).toUpperCase() + data.name.slice(1);

      setResult({
        name: data.name,
        image: foundImage,
        description: `Carta/Item catalogado com atributos especiais de tipo: ${data.types
          .map((type) => type.type.name)
          .join(' · ')}.`,
      });

      setTitle(formattedTitle);
      setImageUrl(foundImage);
    } catch {
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!isLeiloeiro) return;
    setCreating(true);
    try {
      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + 1000 * 60 * durationMinutes);

      await onCreate({
        title: title || 'Novo lote Aurora',
        description: result?.description ?? 'Uma peça especial selecionada pela curadoria Aurora.',
        image_url: imageUrl || result?.image || DEFAULT_IMAGE,
        start_price: startPrice,
        current_price: startPrice,
        min_increment: minIncrement,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        status: 'active',
        seller_name: 'Leiloeiro',
      });
      setTitle('');
      setImageUrl('');
      setResult(null);
      setQuery('');
    } finally {
      setCreating(false);
    }
  };

  const openEditModal = (auction: Auction) => {
    setEditingAuction(auction);
    setEditTitle(auction.title);
    setEditImageUrl(auction.image_url);
    setEditStartPrice(auction.start_price);
    setEditMinIncrement(auction.min_increment);
  };

  const handleSaveEdit = async () => {
    if (!editingAuction) return;
    await onUpdate(editingAuction.id, {
      title: editTitle,
      image_url: editImageUrl,
      start_price: editStartPrice,
      min_increment: editMinIncrement,
    });
    setEditingAuction(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Área Administrativa"
        title="Painel do Leiloeiro"
        description="Encontre peças na API pública, publique novos lotes e acompanhe a performance da sua curadoria."
      />

      {!isLeiloeiro && (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-semibold text-amber-900 shadow-sm dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-300 animate-in fade-in transition-colors">
          <XCircle className="text-amber-600 dark:text-amber-400 shrink-0" size={20} />
          <p>
            <strong>Acesso Restrito:</strong> Você está conectado como <span className="underline">{user}</span>. Apenas o perfil <span className="font-bold">Leiloeiro</span> possui permissão para cadastrar, editar ou excluir lotes no sistema.
          </p>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        {/* Formulário de Criação */}
        <section className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 transition-colors ${!isLeiloeiro ? 'opacity-60 pointer-events-none' : ''}`}>
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
              <Search size={18} />
            </span>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">Buscar item para catalogar</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Pesquise no catálogo público da PokéAPI</p>
            </div>
          </div>

          <div className="mt-6 flex gap-2">
            <input
              disabled={!isLeiloeiro}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') void search();
              }}
              placeholder="Ex.: pikachu, charizard, mewtwo"
              className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-medium text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 dark:focus:border-blue-400 transition-all disabled:cursor-not-allowed"
            />
            <button
              onClick={() => void search()}
              disabled={loading || !isLeiloeiro}
              className="grid w-12 place-items-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20 transition-all hover:bg-blue-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              {loading ? <LoaderCircle className="animate-spin" size={18} /> : <Search size={18} />}
            </button>
          </div>

          {result && (
            <div className="mt-4 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5 dark:border-emerald-800/60 dark:bg-emerald-950/30 animate-in fade-in">
              <img src={result.image} alt={result.name} className="h-12 w-12 rounded-lg bg-white object-contain p-1 ring-1 ring-emerald-200 dark:bg-slate-900 dark:ring-emerald-800" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold capitalize text-slate-900 dark:text-white">{result.name}</p>
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Item encontrado e pronto para publicação</p>
              </div>
              <Check className="text-emerald-600 dark:text-emerald-400" size={18} />
            </div>
          )}

          <div className="mt-6 border-t border-slate-100 pt-6 dark:border-slate-800">
            <p className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Configuração do Lote</p>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-slate-500 dark:text-slate-400">Título do lote</label>
                <input
                  disabled={!isLeiloeiro}
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Ex.: Pikachu Special Edition"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 dark:focus:border-blue-400 transition-all disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-semibold text-slate-500 dark:text-slate-400">URL da Imagem do Lote</label>
                <input
                  disabled={!isLeiloeiro}
                  value={imageUrl}
                  onChange={(event) => setImageUrl(event.target.value)}
                  placeholder="https://sua-imagem.com/foto.png"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-medium text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 dark:focus:border-blue-400 transition-all disabled:cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-slate-500 dark:text-slate-400">Lance inicial (R$)</label>
                  <input
                    disabled={!isLeiloeiro}
                    type="number"
                    value={startPrice}
                    onChange={(event) => setStartPrice(Number(event.target.value))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-900 outline-none focus:border-blue-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-blue-400 transition-all disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-slate-500 dark:text-slate-400">Incremento mín. (R$)</label>
                  <input
                    disabled={!isLeiloeiro}
                    type="number"
                    value={minIncrement}
                    onChange={(event) => setMinIncrement(Number(event.target.value))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-900 outline-none focus:border-blue-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-blue-400 transition-all disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Seletor de Duração do Leilão */}
              <div>
                <label className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  <Clock3 size={13} className="text-blue-600 dark:text-blue-400" /> Duração do Leilão
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: '15 min', value: 15 },
                    { label: '1 hora', value: 60 },
                    { label: '3 horas', value: 180 },
                    { label: '24 horas', value: 1440 },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      disabled={!isLeiloeiro}
                      onClick={() => setDurationMinutes(option.value)}
                      className={`rounded-xl border py-2 text-[11px] font-bold transition-all ${
                        durationMinutes === option.value
                          ? 'border-blue-600 bg-blue-50 text-blue-600 shadow-sm dark:border-blue-500 dark:bg-blue-950/60 dark:text-blue-400'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => void handleCreate()}
              disabled={creating || !isLeiloeiro}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-xs font-extrabold text-white shadow-md shadow-emerald-500/20 transition-all hover:bg-emerald-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-emerald-500 dark:hover:bg-emerald-600"
            >
              <Plus size={16} /> {creating ? 'Publicando...' : 'Publicar lote agora'}
            </button>
          </div>
        </section>

        {/* Lista de Lotes com Ações */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 transition-colors">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">Seus lotes cadastrados</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Gestão e acompanhamento das ofertas</p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              {safeAuctions.length} lotes
            </span>
          </div>

          <div className="mt-6 space-y-3">
            {safeAuctions.length === 0 ? (
              <div className="py-12 text-center text-xs font-semibold text-slate-400 dark:text-slate-500">
                Nenhum lote publicado até o momento.
              </div>
            ) : (
              safeAuctions.map((auction) => {
                const status = getStatus(auction);
                const currentImg = auction.image_url || DEFAULT_IMAGE;

                return (
                  <div
                    key={auction.id}
                    className="flex items-center gap-3.5 rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 transition-all hover:border-slate-300 hover:bg-white hover:shadow-sm dark:border-slate-800 dark:bg-slate-800/50 dark:hover:border-slate-700 dark:hover:bg-slate-800"
                  >
                    <img
                      src={currentImg}
                      alt={auction.title}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = DEFAULT_IMAGE;
                      }}
                      className="h-12 w-12 rounded-lg bg-white object-contain p-1 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-slate-900 dark:text-white">{auction.title}</p>
                      <p className="mt-0.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                        {formatMoney(auction.current_price)} ·{' '}
                        <span className={status === 'active' ? 'font-bold text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}>
                          {status === 'active' ? 'Ao vivo' : status === 'ended' ? 'Encerrado' : 'Agendado'}
                        </span>
                      </p>
                    </div>

                    {/* Botões de Ação para o Leiloeiro */}
                    {isLeiloeiro && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditModal(auction)}
                          className="rounded-lg p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-600 dark:text-slate-400 dark:hover:bg-blue-950/60 dark:hover:text-blue-400 transition-colors"
                          title="Editar lote"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => void onDelete(auction.id)}
                          className="rounded-lg p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600 dark:text-slate-400 dark:hover:bg-rose-950/60 dark:hover:text-rose-400 transition-colors"
                          title="Excluir lote"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>

      {/* Modal de Edição de Lote */}
      {editingAuction && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/60 p-5 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4 dark:border-slate-800 dark:bg-slate-900 transition-colors">
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Editar Lote</h3>
            
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">Título</label>
              <input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-900 outline-none focus:border-blue-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-blue-400"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">URL da Imagem</label>
              <input
                value={editImageUrl}
                onChange={(e) => setEditImageUrl(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-medium text-slate-900 outline-none focus:border-blue-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-blue-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">Lance inicial (R$)</label>
                <input
                  type="number"
                  value={editStartPrice}
                  onChange={(e) => setEditStartPrice(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-900 outline-none focus:border-blue-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-blue-400"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">Incremento mín. (R$)</label>
                <input
                  type="number"
                  value={editMinIncrement}
                  onChange={(e) => setEditMinIncrement(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-900 outline-none focus:border-blue-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-blue-400"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setEditingAuction(null)}
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Cancelar
              </button>
              <button
                onClick={() => void handleSaveEdit()}
                className="flex-1 rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white shadow-md hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                Salvar alterações
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}