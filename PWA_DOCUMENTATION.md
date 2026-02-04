# Documentação do Progressive Web App (PWA) - FinancePro

Este documento detalha a implementação do PWA (Progressive Web App) no projeto FinancePro, explicando as tecnologias utilizadas, a estrutura de arquivos e o funcionamento dos Service Workers e instalação em dispositivos móveis.

## 📚 Biblioteca Utilizada

Para transformar esta aplicação Next.js em um PWA, utilizamos a biblioteca **@serwist/next**.

*   **Por que @serwist/next?**
    *   É a sucessora moderna e mantida ativamente do antigo `next-pwa` e `@ducanh2912/next-pwa`.
    *   Possui compatibilidade total com **Next.js 16** e suas novas arquiteturas.
    *   Integra-se com o Workbox (Google) para estratégias robustas de cache e funcionamento offline.

## 🛠️ Como Funciona a Implementação

A configuração do PWA envolve quatro partes principais:

### 1. Configuração do Build (`next.config.js`)
O arquivo de configuração do Next.js foi adaptado para injetar o manifesto do Service Worker durante o processo de build.
*   Utilizamos `withSerwist` para envelopar a configuração do Next.js.
*   **Importante:** Definimos `disable: process.env.NODE_ENV === "development"` para que o PWA/Cache não atrapalhe o desenvolvimento local. Ele só ativa em produção.

### 2. Definição do Service Worker (`src/app/sw.ts`)
Este arquivo TypeScript define o comportamento do Service Worker.
*   **Precache:** Ele lista os arquivos estáticos e páginas que devem ser baixados e salvos no cache do navegador imediatamente.
*   **Runtime Caching:** Define como requisições de API ou imagens devem ser cacheadas (ex: `defaultCache` usa estratégias como "StaleWhileRevalidate" para manter o conteúdo atualizado).

### 3. Manifesto da Aplicação (`public/manifest.json`)
Este arquivo JSON diz ao navegador como o app deve se comportar quando instalado.
*   **Campos Chave:**
    *   `name` / `short_name`: Nome exibido na tela inicial.
    *   `display: "standalone"`: Faz o app abrir sem a barra de URL do navegador (parece nativo).
    *   `icons`: Ícones obrigatórios (192x192 e 512x512) para a instalação funcionar.

### 4. Metadados e Viewport (`src/app/layout.tsx`)
Configurações no `<head>` do HTML para garantir comportamento mobile correto.
*   `appleWebApp`: Configurações específicas para iOS (status bar, título).
*   `viewport`: Define que o app não deve permitir zoom indesejado (`userScalable: false`) para parecer um app nativo.

## ⚙️ Service Workers: O Motor do PWA

O Service Worker é um script que roda em segundo plano no navegador, separado da página web.

1.  **Instalação:** Quando o usuário acessa o site, o `public/sw.js` (gerado a partir do `sw.ts`) é registrado.
2.  **Interceptação:** Ele age como um proxy de rede. Toda requisição que o app faz passa por ele.
3.  **Offline:** Se o usuário estiver sem internet, o Service Worker serve os arquivos que ele salvou no Cache, permitindo que o app abra e funcione (para partes cacheadas).

**Registro Explícito:**
Adicionamos um componente `ServiceWorkerRegister` no layout principal para garantir que o navegador inicie o processo de registro assim que a aplicação carregar.

## 📲 Instalação no Mobile e Desktop

O PWA permite que o usuário "baixe" o site como um aplicativo.

### Botão de Instalação (`src/components/ui/molecules/PWAInstallButton.tsx`)
Criamos um botão personalizado que só aparece quando o navegador dispara o evento `beforeinstallprompt`.
*   **Desktop:** O navegador (Chrome/Edge) geralmente mostra um ícone na barra de endereço, mas também podemos exibir um botão no cabeçalho.
*   **Mobile (Android/iOS):** O botão foi posicionado no **Menu Hambúrguer** para fácil acesso.

### Como Instalar (Fluxo do Usuário)

1.  **Acesse o site em Produção** (via HTTPS - PWAs exigem conexão segura).
2.  **Android (Chrome):**
    *   Um banner "Adicionar à Tela Inicial" pode aparecer automaticamente.
    *   Ou o usuário abre o Menu do App e clica em "Instalar App".
3.  **iOS (Safari):**
    *   No iOS, não existe um "botão" nativo que o site possa acionar.
    *   O usuário deve clicar no botão **Compartilhar** do Safari e selecionar **"Adicionar à Tela de Início"**.

## 🚀 Resumo de Arquivos Importantes

| Arquivo | Função |
| :--- | :--- |
| `next.config.js` | Ativa o plugin Serwist e configura o build. |
| `src/app/sw.ts` | Código fonte do Service Worker (lógica de cache). |
| `public/manifest.json` | Identidade do App (Ícones, Nomes, Cores). |
| `src/app/layout.tsx` | Metadados e Registro do SW. |
| `public/icon-*.png` | Ícones quadrados gerados para validação do PWA. |

---
**Diagnóstico de Problemas Comuns:**
*   **Não instala?** Verifique s e os ícones no `manifest.json` são quadrados perfeitos e se o site está rodando em HTTPS.
*   **Não atualiza?** Service Workers têm um ciclo de vida forte. O usuário precisa fechar todas as abas e reabrir o app para receber a nova versão (ou usamos `skipWaiting: true` no código para forçar).
