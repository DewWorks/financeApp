# Explicação do Dashboard Financeiro

<img align="center" src="../../public/homePrint.png">

## Visão Geral

## Visão Geral

O dashboard financeiro é a página principal da aplicação de controle financeiro desenvolvida com Next.js e TypeScript. Ele é projetado para ajudar os usuários a monitorar suas transações financeiras, visualizar saldos e entender a distribuição de receitas e despesas por meio de gráficos interativos e resumos.

O dashboard financeiro utiliza várias bibliotecas e hooks personalizados para exibir informações financeiras através de gráficos, tabelas e cards de resumo.

## Principais Características

1. Barra de navegação com opções de login/logout
2. Cards de resumo para saldo total, receitas e despesas
3. Gráficos variados para visualização de dados financeiros:
   - Gráfico de pizza para distribuição de receitas e despesas
   - Gráfico de barras para as últimas transações
   - Gráfico de linha para fluxo de caixa
   - Gráfico de área para comparação de receitas e despesas ao longo do tempo
4. Tabela de todas as transações com opções de filtragem por período
5. Funcionalidade para adicionar novas receitas e despesas

## Bibliotecas e Componentes Utilizados

- React e Next.js para a estrutura da aplicação
- Framer Motion para animações
- Recharts para criação de gráficos
- Componentes UI personalizados (Card, Button, etc.)
- Lucide React para ícones
- Hook personalizado `useTransactions` para gerenciamento de transações

## Estrutura do Componente

O componente `DashboardFinanceiro` é estruturado da seguinte forma:

1. Importações de bibliotecas e componentes
2. Definição de constantes (como cores para gráficos)
3. Declaração do componente funcional
4. Uso de hooks (useRouter, useTransactions, useState)
5. Cálculos e preparação de dados para gráficos
6. Definição de funções auxiliares (handleLogout, handleLogin, handleAddIncome, handleAddExpense, filterTransactions)
7. Renderização do JSX, incluindo:
   - Barra de navegação
   - Cabeçalho do dashboard
   - Cards de resumo
   - Gráficos
   - Tabela de transações

## Lógica Principal

O componente utiliza o hook `useTransactions` para gerenciar o estado das transações. As principais operações lógicas incluem:

- Cálculo de saldo total, receitas totais e despesas totais
- Preparação de dados para diferentes tipos de gráficos
- Manipulação de eventos para adicionar novas transações e fazer logout
- Filtragem de transações por período (ainda não implementada completamente)

## Componentes Reutilizáveis

O dashboard faz uso de vários componentes reutilizáveis, incluindo:

- `SummaryCard`: Para exibir resumos de saldo, receitas e despesas
- `AddIncomeDialog` e `AddExpenseDialog`: Para adicionar novas transações
- `TransactionsTable`: Para exibir a lista de transações
- Componentes de UI como `Card`, `Button`, `Popover`, etc.

## Principais Características

1. **Barra de Navegação**:
   - Inclui botões de login/logout para controle de sessão do usuário.
   - Links de navegação para outras páginas.

   ```tsx
   <nav className="navbar">
     <button onClick={handleLogin}>Login</button>
     <button onClick={handleLogout}>Logout</button>
   </nav>
   ```
   *Explicação*: A barra de navegação inclui botões para login e logout, utilizando funções auxiliares `handleLogin` e `handleLogout` para gerenciar a sessão do usuário.

2. **Cards de Resumo**:
   - Exibem informações importantes como saldo total, receitas totais e despesas totais.

   ```tsx
   <div className="summary-cards">
     <SummaryCard title="Saldo Total" amount={totalBalance} />
     <SummaryCard title="Receitas Totais" amount={totalIncome} />
     <SummaryCard title="Despesas Totais" amount={totalExpenses} />
   </div>
   ```
   *Explicação*: Os `SummaryCard` são componentes reutilizáveis que recebem props como `title` e `amount` para mostrar as informações financeiras.

3. **Gráficos Interativos**:
   - **Gráfico de Pizza**: Mostra a distribuição entre receitas e despesas.
   - **Gráfico de Barras**: Apresenta as últimas transações registradas.
   - **Gráfico de Linha**: Exibe o fluxo de caixa ao longo do tempo.
   - **Gráfico de Área**: Compara o total de receitas e despesas durante um período.

   ```tsx
   <PieChart data={dataPieChart} />
   <BarChart data={dataBarChart} />
   <LineChart data={dataLineChart} />
   <AreaChart data={dataAreaChart} />
   ```
   *Explicação*: Cada gráfico recebe dados processados e preparados para exibição por meio de props. As bibliotecas de gráficos como `Recharts` são utilizadas para renderizar os gráficos de forma interativa.

4. **Tabela de Transações**:
   - Exibe todas as transações com opções para filtrar por período e pesquisar transações específicas.

   ```tsx
   <TransactionsTable transactions={filteredTransactions} />
   ```
   *Explicação*: O componente `TransactionsTable` é responsável por renderizar a lista de transações filtradas, permitindo que o usuário visualize e gerencie suas transações de forma detalhada.

5. **Funcionalidade de Adicionar Transações**:
   - Modal de fácil uso para adicionar novas receitas e despesas.

   ```tsx
   <AddIncomeDialog onAdd={handleAddIncome} />
   <AddExpenseDialog onAdd={handleAddExpense} />
   ```
   *Explicação*: Os modais `AddIncomeDialog` e `AddExpenseDialog` permitem a inserção de novas transações financeiras, acionando funções que atualizam o estado da aplicação.

## Lógica Principal

O componente utiliza hooks personalizados e bibliotecas para gerenciar o estado e manipular os dados exibidos. Por exemplo:

```tsx
const { transactions, addTransaction } = useTransactions();
```
*Explicação*: O hook `useTransactions` gerencia o estado das transações, permitindo operações como adicionar e listar transações de forma centralizada.


## Animações

O componente utiliza Framer Motion para adicionar animações suaves, melhorando a experiência do usuário:

- Animações de entrada para cards e gráficos
- Transições suaves ao renderizar elementos

## Responsividade

O layout é responsivo, utilizando classes do Tailwind CSS para ajustar a disposição dos elementos em diferentes tamanhos de tela:

- Grid layout com colunas ajustáveis (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`)
- Uso de `ResponsiveContainer` do Recharts para gráficos responsivos

## Acessibilidade

O componente inclui algumas considerações de acessibilidade:

- Uso de elementos semânticos como `<nav>` e `<main>`
- Descrições para gráficos usando `Popover`
- Textos alternativos para ícones

---
