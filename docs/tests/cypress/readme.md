### Teste de Fluxo de Transações - FinancePro

Este teste automatizado foi desenvolvido utilizando a ferramenta **Cypress** para verificar o fluxo de adição de uma transação de **Receita** na aplicação **FinancePro**.

#### Objetivo do Teste

O objetivo principal desse teste é validar o comportamento da interface da aplicação durante o processo de adição de uma receita, garantindo que:

1. O formulário de transação seja preenchido corretamente.
2. A transação seja adicionada ao sistema ao clicar no botão de "Adicionar Receita".
3. O redirecionamento para a tela inicial (Dashboard Financeiro) aconteça corretamente após a adição da receita.
4. Os elementos essenciais da tela inicial, como "Saldo Total", "Receitas", e "Despesas", sejam carregados e visíveis, confirmando que o sistema foi atualizado corretamente.

#### O que o Teste Faz

1. **Acessa a página inicial**: O teste inicia acessando a URL da aplicação no ambiente de produção: `https://finance-app-tau-flax.vercel.app/`.

2. **Simula a navegação para a seção de Receita**: O teste clica na aba de **Receita** para acessar a área de adição de receitas.

3. **Preenche o formulário de transação**: Em seguida, o teste preenche o formulário de receita com os seguintes dados:
    - Descrição: "Freelance"
    - Valor: "2000"
    - Data: "2024-11-30"

4. **Adiciona a receita**: O teste simula o clique no botão **Adicionar Receita** para submeter o formulário e adicionar a transação ao sistema.

5. **Verifica o redirecionamento para a tela inicial**: Após a transação ser adicionada, o teste verifica se a URL foi atualizada para a tela inicial (Dashboard Financeiro), garantindo que o redirecionamento foi realizado corretamente.

6. **Verifica os elementos da tela inicial**: O teste assegura que os elementos da tela inicial, como "Dashboard Financeiro", "Saldo Total", "Receitas" e "Despesas", estejam visíveis, indicando que a aplicação foi atualizada corretamente com as informações da nova receita.

#### Conclusão

Este teste foi desenvolvido para garantir que a funcionalidade de adição de receitas na aplicação **FinancePro** esteja funcionando corretamente, validando tanto a interação com a interface quanto a atualização dos dados. O Cypress foi utilizado para automatizar este processo de teste, proporcionando um fluxo eficiente e seguro de validação.

---