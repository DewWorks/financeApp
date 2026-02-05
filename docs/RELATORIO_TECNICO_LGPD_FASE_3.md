# Relatório Técnico: Conformidade LGPD e Interface de Privacidade (Fase 3)

## 1. Introdução
Este documento descreve as implementações técnicas da Fase 3, focada na conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018), especificamente na garantia dos direitos dos titulares de dados e na transparência das operações.

## 2. Direitos do Titular (Backend)

Implementamos endpoints dedicados para atender a dois direitos fundamentais previstos no Artigo 18 da LGPD.

### 2.1 Direito à Portabilidade de Dados (Art. 18, V)
Foi criada a rota de API `/api/user/me/export` (Método GET), responsável por compilar e fornecer os dados do usuário em formato interoperável (JSON).

**Fluxo Técnico:**
1.  **Autenticação:** O sistema valida o token JWT presente nos cookies (`auth_token`).
2.  **Coleta de Dados:** O sistema realiza consultas paralelas para agregar:
    *   Dados Cadastrais (Collection `users`).
    *   Dados Financeiros (Collection `transactions`).
    *   Histórico de Auditoria (Collection `auditlogs`).
3.  **Sanitização e Descriptografia:**
    *   O campo `password` (hash) é removido do objeto de resposta.
    *   Campos criptografados (CPF, Endereço) são passados pelo `CryptoService.decrypt()` para serem entregues legíveis ao proprietário.
4.  **Auditoria:** O evento de exportação é registrado no `AuditService` com a ação `DATA_EXPORT`.

### 2.2 Direito à Exclusão (Art. 18, VI)
Foi criada a rota de API `/api/user/me/delete` (Método DELETE), permitindo ao usuário solicitar o encerramento definitivo de sua conta.

**Fluxo Técnico:**
1.  **Registro Prévio:** Antes da exclusão, o sistema registra um log de auditoria com a ação `ACCOUNT_DELETED`. Isso é crucial para manter evidência legal de que a exclusão foi solicitada pelo próprio usuário.
2.  **Exclusão em Cascata:**
    *   Removem-se todos os documentos da coleção `transactions` vinculados ao ID do usuário.
    *   Remove-se o documento principal da coleção `users`.
3.  **Encerramento de Sessão:** O cookie de autenticação é invalidado/removido.

## 3. Interface de Usuário (Frontend)

Para tornar estes direitos acessíveis, desenvolvemos uma interface gráfica integrada ao perfil do usuário.

### 3.1 Painel de Privacidade (`PrivacyPanel.tsx`)
Este componente React centraliza as ações de LGPD.
*   **Design System:** Utiliza os componentes atômicos `Card` e `Button` do sistema de design existente, garantindo consistência visual (Dark/Light mode).
*   **Feedback:** Gerencia estados de carregamento (`loading`) durante a geração do arquivo de exportação ou processamento da exclusão.
*   **Segurança UX:** A ação de exclusão exige confirmação dupla via `window.confirm` para evitar acidentes.

### 3.2 Integração com Navegação
*   Criada a página `/profile/privacy/page.tsx`, que serve como container para o Painel de Privacidade.
*   Adicionado um botão de navegação "Minha Privacidade" na página principal de perfil (`/profile/page.tsx`), posicionado estrategicamente abaixo das opções de segurança (Alterar Senha).

## 4. Auditoria e Rastreabilidade

O `AuditService` foi integrado aos pontos críticos de entrada e saída do sistema:
*   **Login:** Registra sucessos e falhas (tentativas com senha incorreta ou usuário inexistente).
*   **Registro:** Registra criações de conta bem-sucedidas e falhas (termos não aceitos, email duplicado).
*   **Ações LGPD:** Como mencionado, exportações e exclusões são logadas.

Isso atende ao Artigo 37 da LGPD, que exige que o controlador mantenha registro das operações de tratamento de dados pessoais.

## 5. Transparência Jurídica

Para refletir estas mudanças técnicas no contrato com o usuário:
*   Foi desenvolvido o script `scripts/update_terms.js`.
*   Este script atualiza o documento "Termos de Uso" no banco de dados MongoDB, inserindo uma nova seção "Segurança e Proteção de Dados".
*   A seção detalha o uso de criptografia AES-256 e instrui o usuário sobre como exercer seus direitos através do novo painel.

## 6. Conclusão
Com a conclusão da Fase 3, o FinanceApp não apenas implementou medidas de segurança robustas (Fase 1 e 2), mas agora oferece ferramentas ativas para que os usuários exerçam soberania sobre seus dados, atingindo um alto nível de maturidade em conformidade com a legislação brasileira.
