# DataFabric Frontend

Frontend moderno e escalável para a plataforma DataFabric, construído com Next.js 16.

## 🚀 Stack Tecnológica

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router)
- **Linguagem:** TypeScript (modo estrito)
- **Estilização:** [Tailwind CSS 4](https://tailwindcss.com/)
- **Componentes:** [Shadcn/UI](https://ui.shadcn.com/)
- **Ícones:** [Lucide React](https://lucide.dev/)
- **Tema:** [next-themes](https://github.com/pacocoursey/next-themes)
- **Internacionalização:** [next-intl](https://next-intl-docs.vercel.app/)
- **Gerenciamento de Estado:**
  - [TanStack Query](https://tanstack.com/query) (Server State)
  - [Zustand](https://zustand-demo.pmnd.rs/) (Client State)
- **Formulários:** [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **Linting:** ESLint + Prettier + import-sort
- **Git Hooks:** Husky + lint-staged

## 📁 Estrutura de Pastas

```
├── app/                      # App Router do Next.js
│   ├── [locale]/            # Rotas internacionalizadas
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── globals.css          # Estilos globais + variáveis Shadcn/UI
│   └── layout.tsx           # Layout raiz
│
├── components/              # Componentes compartilhados
│   ├── providers/           # Providers (Theme, Query, etc.)
│   └── ui/                  # Componentes Shadcn/UI
│
├── features/                # Feature-based architecture
│   ├── auth/               # Feature de autenticação
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── actions/
│   │   └── types/
│   ├── dashboard/          # Feature do dashboard
│   └── home/               # Feature da home
│
├── hooks/                   # Hooks globais reutilizáveis
├── lib/                     # Utilitários e configurações
│   ├── api/                # Cliente HTTP
│   ├── stores/             # Stores Zustand
│   └── validations/        # Schemas Zod
│
├── i18n/                    # Configuração de internacionalização
├── messages/                # Arquivos de tradução (JSON)
├── types/                   # Tipos TypeScript globais
└── public/                  # Arquivos estáticos
```

## 🛠 Scripts Disponíveis

```bash
# Desenvolvimento (com Turbopack)
npm run dev

# Build de produção
npm run build

# Iniciar servidor de produção
npm run start

# Lint (com auto-fix)
npm run lint

# Verificar lint sem auto-fix
npm run lint:check

# Formatar código
npm run format

# Verificar formatação
npm run format:check

# Verificar tipos TypeScript
npm run typecheck

# Executar todas as verificações
npm run check
```

## 🎨 Design System

### Cores

As cores são definidas como variáveis CSS em `app/globals.css` e suportam tema claro/escuro automaticamente.

### Componentes

Use os componentes do Shadcn/UI disponíveis em `components/ui/`. Para adicionar novos:

```bash
npx shadcn@latest add [component-name]
```

Componentes instalados:

- Button
- Input
- Card
- Dialog
- Dropdown Menu
- Sonner (Toast)

## 🌍 Internacionalização

### Idiomas suportados

- Português (Brasil) - `pt-BR` (padrão)
- Inglês - `en`

### Uso

```tsx
import { useTranslations } from 'next-intl';

function MyComponent() {
  const t = useTranslations('common');
  return <p>{t('loading')}</p>;
}
```

### Adicionar traduções

Edite os arquivos em `messages/`:

- `messages/pt-BR.json`
- `messages/en.json`

## 📝 Formulários

Use React Hook Form com Zod para validação:

```tsx
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
});

function MyForm() {
  const form = useForm({
    resolver: zodResolver(schema),
  });
  // ...
}
```

## 🔄 Gerenciamento de Estado

### Server State (TanStack Query)

Para dados da API, cache e sincronização:

```tsx
import { useQuery, useMutation } from '@tanstack/react-query';

function MyComponent() {
  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get('/users'),
  });
}
```

### Client State (Zustand)

Para estado global da UI:

```tsx
import { useUIStore } from '@/lib/stores';

function MyComponent() {
  const { sidebarOpen, toggleSidebar } = useUIStore();
}
```

## 🔐 Variáveis de Ambiente

Copie `.env.example` para `.env.local` e configure as variáveis necessárias.

O projeto usa validação de variáveis de ambiente com Zod em `lib/env.ts`.

## 📦 Feature-based Architecture

Cada feature é auto-contida com:

```
features/[feature]/
├── components/     # Componentes específicos da feature
├── hooks/          # Hooks específicos da feature
├── actions/        # Server actions (se necessário)
├── types/          # Tipos TypeScript
└── index.ts        # Exports públicos
```

## 🪝 Git Hooks

O projeto usa Husky para:

- **pre-commit:** Roda lint-staged (ESLint + Prettier nos arquivos staged)

## 📄 Licença

Proprietary - DataFabric
