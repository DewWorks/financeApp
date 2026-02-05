# Relatório Técnico: Implementação de Segurança e Conformidade (Fase 2)

## 1. Objetivo
Este documento detalha as implementações técnicas realizadas na "Fase 2: Proteção de Ativos" do roadmap de segurança do FinanceApp. O objetivo principal foi elevar o nível de proteção de dados sensíveis (PII) e garantir mecanismos robustos de recuperação de desastres, alinhados com a Lei Geral de Proteção de Dados (LGPD).

## 2. Fundamentação Legal (LGPD)

A implementação foi guiada pelos seguintes artigos da Lei nº 13.709/2018:

*   **Art. 6º, Princípio VII (Segurança):** Utilização de medidas técnicas e administrativas aptas a proteger os dados pessoais de acessos não autorizados e de situações acidentais ou ilícitas.
*   **Art. 46:** Dever dos agentes de tratamento de adotar medidas de segurança, técnicas e administrativas.
*   **Art. 37:** Dever de manter registro das operações de tratamento de dados pessoais (Audit Logs).

## 3. Arquitetura de Criptografia

Para proteger dados sensíveis em repouso (Data at Rest), implementamos um sistema de criptografia simétrica robusta.

### 3.1 Algoritmo e Especificações
*   **Algoritmo:** AES-256-CBC (Advanced Encryption Standard com chave de 256 bits em modo Cipher Block Chaining).
*   **Chave:** Gerenciada via variáveis de ambiente (`ENCRYPTION_KEY`). A chave deve possuir exatamente 32 bytes.
*   **Vetor de Inicialização (IV):** Gerado aleatoriamente (16 bytes) para cada operação de encriptação. O IV garante que o mesmo texto claro produza textos cifrados diferentes, prevenindo ataques de análise estatística.

### 3.2 Implementação (CryptoService)
O módulo `src/lib/crypto.ts` centraliza a lógica criptográfica.

*   **Encriptação:** Concatena o IV gerado com o texto cifrado, separados por `:` (ex: `iv_hex:cipher_hex`). Isso permite que o IV seja recuperado para a decriptação sem ser secreto.
*   **Decriptação:** Separa o IV do texto cifrado e reverte o processo usando a chave mestra.

### 3.3 Integração Transparente (Mongoose Middleware)
Para minimizar o impacto no código existente, a criptografia foi acoplada diretamente ao modelo de dados (`src/app/models/User.ts`) utilizando Middlewares do Mongoose:

*   **Hook `pre('save')`:** Intercepta o salvamento do documento. Verifica se campos sensíveis (`cpf`, `address`) foram modificados e estão em texto plano. Se sim, aplica a encriptação.
*   **Hook `post('init')`:** Intercepta a leitura do documento do banco. Automaticamente descriptografa os campos para que a aplicação os utilize normalmente, mantendo a complexidade oculta da camada de negócios.

## 4. Migração de Dados Legados

Foi necessário tratar os dados já existentes no banco que estavam em texto plano.

### 4.1 Estratégia de Atualização (Backfill)
Criamos uma rota de manutenção (`/api/maintenance/migrate`) que executa a seguinte lógica:
1.  Conecta ao banco de dados ignorando os Middlewares do Mongoose (acesso direto via Driver Nativo) para performance.
2.  Itera sobre todos os usuários.
3.  Verifica se os campos alvo (`cpf`, `address`) não possuem o separador de IV (`:`), indicando que ainda estão em texto plano.
4.  Aplica a encriptação individualmente e atualiza o registro.

Este processo é idempotente: rodá-lo múltiplas vezes não corrompe os dados já encriptados.

## 5. Estratégia de Backup e Automação

Devido à natureza da infraestrutura Serverless (Vercel), onde não há persistência de disco local garantida, a estratégia de backup tradicional (salvar em arquivo local) foi adaptada.

### 5.1 Solução Cloud-Native
Utilizamos o **Vercel Cron Jobs** para orquestrar a execução.

*   **Agendamento:** Configurado via `vercel.json` para execução diária às 23:00 UTC.
*   **Rota (`/api/cron/backup`):** 
    1.  Extrai dados das coleções críticas (`users`, `transactions`, `auditlogs`).
    2.  Gera arquivos JSON em memória.
    3.  Utiliza o protocolo SMTP (Nodemailer) para enviar um "Snapshot" compactado para o e-mail administrativo seguro.
*   **Benefício:** Cria um histórico externo, durável e auditável dos dados, sem depender do sistema de arquivos efêmero do servidor.

## 6. Auditoria (AuditService)

Em conformidade com o Art. 37 da LGPD, implementamos o `AuditService`.
Esta classe estática permite registrar eventos críticos (Login, Alteração de Dados, Exportação em Massa) vinculando-os ao ID do usuário, IP de origem e Timestamp. Estes registros são imutáveis e persistidos na coleção `auditlogs`.

## 7. Conclusão

As alterações realizadas estabelecem uma camada profunda de defesa. O sistema agora não apenas protege o perímetro (Autenticação/Rate Limit da Fase 1), mas também protege o núcleo dos dados. Mesmo em caso de vazamento do banco de dados (SQL Dump), os dados pessoais dos usuários permaneceriam ilegíveis sem a chave de criptografia, reduzindo drasticamente o risco de dano à imagem e responsabilidade legal.
