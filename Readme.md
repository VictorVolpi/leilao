# 🏛️ DOCUMENTAÇÃO FINAL — VOLPI HOUSE - CASA DO LEILÃO ONLINE

## 1. Visão Geral (O Contexto)

- **Nome do Projeto:** VOLPI HOUSE — CASA DO LEILÃO ONLINE

- **O que a aplicação faz:** Plataforma web completa e responsiva para leilões ao vivo. O leiloeiro cadastra e gerencia lotes buscando itens da PokéAPI (com arte oficial e atributos), define regras de lance inicial, incremento mínimo e prazos. Os licitantes utilizam uma carteira virtual simulada para enviar ofertas em tempo real. O sistema conta com prorrogação automática (*anti-sniping*), liquidação financeira e auditoria criptográfica imutável via hash SHA-256 com emissão de comprovantes públicos.

- **Para quem serve:** Avaliadores técnicos da **Verzel (Elite Dev)**, leiloeiros (gestão de lotes) e licitantes (compradores que disputam os itens).

---

## 2. Requisitos e Stack (A Base)

- **Linguagem Principal:** TypeScript (v5+)

- **Biblioteca UI:** React (v18+)

- **Ferramenta de Build:** Vite (v6+)

- **Estilização:** Tailwind CSS (v3+) | PostCSS

- **Ícones:** Lucide React

- **Back-End & Realtime:** Supabase (PostgreSQL, Realtime Subscriptions, Web Crypto API)

- **API Externa:** [PokéAPI](https://pokeapi.co/) (Catálogo para curadoria de lotes)

- **Hospedagem & Deploy:** Vercel (Configuração SPA)

### Pré-requisitos do Ambiente
- **Versão do Node.js:** `v18.0.0` ou superior
- **Gestor de Pacotes:** `npm`

---

## 3. Configuração Local (O Início)

### 1. Obter o Código-Fonte
```bash
git clone (https://github.com/VictorVolpi/leilao.git)
https://leilao-kappa.vercel.app/
```
---

### 2. Configurar Variáveis de Ambiente
Crie um ficheiro `.env` na raiz do projeto com as credenciais do seu Supabase:

---

### 3. Comandos de Instalação e Execução
```bash
# Instalar dependências
npm install

# Rodar em modo de desenvolvimento
npm run dev

# Gerar build de produção
npm run build
```

---

### Deploy e Redeploy na Vercel:
```bash
npx vercel login
npx vercel link
npx vercel --prod
```

---

## 4. Arquitetura do Código (O Mapa)

```text
aurora-auction-house/
├── .vercel/                 # Ficheiros de configuração de deploy da Vercel
├── node_modules/            # Dependências instaladas
├── public/                  # Recursos estáticos públicos
│   └── logo.png             # Logótipo oficial da Aurora Auction House
│
├── src/
│   ├── components/          # Componentes reutilizáveis
│   │   ├── Icons.tsx        # Wrapper centralizado de ícones do Lucide React
│   │   └── Shell.tsx        # Layout principal (Sidebar, Header e Alternador de Perfis)
│   │
│   ├── lib/                 # Módulos centrais de lógica e serviços
│   │   ├── auction.ts       # Regras de negócio (PlaceBid, Anti-sniping, Finalize, Seed)
│   │   └── supabase.ts      # Cliente de conexão ao Supabase
│   │
│   ├── pages/               # Visões/Páginas da aplicação
│   │   ├── Arremates.tsx    # Comprovantes de vitória e histórico de ofertas enviadas
│   │   ├── Auditoria.tsx    # Validação pública de integridade criptográfica SHA-256
│   │   ├── Carteira.tsx     # Gestão de saldos (Total, Comprometido, Disponível) e Depósitos
│   │   ├── PainelLeiloeiro.tsx # Integração PokéAPI, publicação e gestão de lotes
│   │   ├── SalaAoVivo.tsx   # Leilão ao vivo em tempo real com indicador de status
│   │   └── Vitrine.tsx      # Exposição de lotes (Ao Vivo, Agendados e Encerrados)
│   │
│   ├── types.ts             # Definições de interfaces TypeScript (Auction, Bid, Wallet, etc.)
│   ├── App.tsx              # Componente raiz, subscrição Realtime e gestão de estado
│   └── main.tsx             # Ponto de entrada da aplicação React
│
├── .env                     # Variáveis de ambiente
├── index.html               # Documento HTML base
├── package.json             # Dependências e scripts
├── tailwind.config.js       # Configuração do Tailwind CSS
├── tsconfig.json            # Configuração TypeScript
└── vite.config.ts           # Configuração do Vite
```

---

## 5. Manual do Utilizador e Funcionalidades

- **Vitrine:** Exibição dividida em lotes *Ao Vivo*, *Agendados* e *Encerrados*. Lotes cancelados são ocultados automaticamente.

- **Painel do Leiloeiro:** Permite pesquisar cards/itens na PokéAPI, definir preço inicial, incremento mínimo, tempo de duração e publicar. Permite cancelar/excluir lotes e acompanhar métricas financeiras. (O perfil Leiloeiro é impedido de realizar lances).

- **Sala do Lote Ao Vivo:** Atualização instantânea sem reload via WebSockets. Exibe lance atual, contagem regressiva, histórico de ofertas e badges dinâmicos (**"VOCÊ ESTÁ GANHANDO"** / **"VOCÊ FOI SUPERADO"**).

- **Carteira do Licitante:** Acompanhamento de saldo total, saldo comprometido em disputas ativas e saldo disponível, com suporte a depósitos simulados instantâneos.

- **Meus Arremates:** Histórico de ofertas do utilizador e emissão de comprovantes de arremate com link público de partilha.

- **Auditoria Pública:** Página acessível sem necessidade de login que valida a corrente de hashes SHA-256 dos lances para comprovar a imutabilidade do banco.

---

## 6. Destaques de Arquitetura e Regras do Desafio

1. **Resiliência a Falhas de API:** Os dados dos itens buscados na PokéAPI são gravados no banco PostgreSQL na criação. Caso a API externa caia, a vitrine, sala, carteira e auditoria continuam 100% operacionais.

2. **Anti-Sniping (Prorrogação):** Ofertas recebidas nos últimos 2 minutos do lote prorrogam automaticamente o encerramento em +2 minutos.

3. **Saldos Comprometidos:** Enquanto o licitante for o maior lance de um lote ativo, o valor fica retido em `committed_balance`. Se for superado, o saldo é liberado instantaneamente para nova utilização.

4. **Seed Automático (`seedDemoData`):** Ao carregar a aplicação pela primeira vez em um banco novo, o sistema cria automaticamente as contas do `Leiloeiro`, `Licitante 1` (R$ 5.000,00), `Licitante 2` (R$ 5.000,00) e um lote ativo inicial.

---

## 7. Desenvolvedor do Projeto (Autoria)

### **Desenvolvedor / Autor:** Victor Gonçalves Volpi 

### **Papel no Projeto:** Desenvolvedor Full Stack  

### **Contato & Redes Sociais:**

- **E-mail:** [victorvolpidev@gmail.com](mailto:victorvolpidev@gmail.com)  

- **WhatsApp / Telefone:** (11) 98142-0861  

- **Portfólio:** [volpidev.com.br](https://volpidev.com.br/)
