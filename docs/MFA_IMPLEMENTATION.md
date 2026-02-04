# Documentação Técnica: Implementação de Autenticação Multifator (MFA)

## Visão Geral

Este documento descreve a implementação do sistema de Autenticação Multifator (MFA) no FinancePro. O objetivo desta implementação é aumentar a segurança do acesso às contas dos usuários, mitigando riscos de comprometimento de credenciais e atendendo a requisitos de conformidade (LGPD).

O sistema suporta múltiplos canais de verificação:
1.  **Aplicativo Autenticador (TOTP)**: Padrão principal (Google Authenticator, Authy).
2.  **Email (OTP)**: Canal alternativo/fallback.
3.  **WhatsApp (OTP)**: Canal alternativo/fallback.

## Arquitetura da Solução

A solução foi construída sobre uma arquitetura híbrida que combina validação de códigos baseados em tempo (TOTP) e códigos de uso único gerados pelo servidor (OTP).

### 1. Modelo de Dados (`IUser`)

A coleção de usuários (`users`) foi estendida para suportar as configurações de MFA:

*   `mfaEnabled` (boolean): Indica se o MFA está ativo para o usuário.
*   `mfaSecret` (string): Segredo criptográfico usado para gerar/validar códigos TOTP.
*   `verification` (objeto): Estrutura para armazenar códigos OTP temporários gerados pelo servidor para Email/WhatsApp.
    *   `code`: O código numérico de 6 dígitos.
    *   `expiresAt`: Data de expiração do código.
    *   `type`: O propósito da verificação (ex: 'mfa-login').

### 2. Componentes de Backend

#### 2.1. Serviço Unificado (`MfaService.ts`)
Localizado em `src/lib/MfaService.ts`, este serviço centraliza a lógica de despacho e validação de códigos.

*   **Responsabilidade**: Abstrair a complexidade de validação.
*   **Funcionamento**: O método `verifyLoginCode` verifica sequencialmente:
    1.  Se o código corresponde ao `mfaSecret` (validando algoritmo TOTP).
    2.  Se o código corresponde ao `verification.code` armazenado no banco de dados (validando OTP de Email/WhatsApp).
*   **Dispatch**: O método `sendOtp` gerencia o envio de códigos via `nodemailer` (Email) ou `twilio` (WhatsApp), salvando o hash ou código no banco com tempo de expiração (5 minutos).

#### 2.2. Rotas da API (`/api/auth/mfa/*`)

Foram criados endpoints específicos para gerenciar o ciclo de vida do MFA:

*   **POST `/api/auth/mfa/setup`**: Gera um novo segredo MFA e retorna o QR Code para pareamento inicial. Requer autenticação prévia.
*   **POST `/api/auth/mfa/verify`**: Valida o código inserido pelo usuário durante o setup para confirmar o pareamento e ativar a flag `mfaEnabled`.
*   **POST `/api/auth/mfa/send`**: Rota utilizada pelo frontend para solicitar o envio de um código de recuperação (fallback) via Email ou WhatsApp.

#### 2.3. Alterações no Login (`/api/auth/login`)

A rota de login foi alterada para interceptar a autenticação:

1.  Verifica credenciais (email/senha).
2.  Se `mfaEnabled` for verdadeiro, verifica se um `mfaCode` foi enviado.
3.  Se não houver código, retorna `200 OK` com `mfaRequired: true`, instruindo o frontend a mudar de estado.
4.  Se houver código, utiliza o `MfaService` para validar.

### 3. Componentes de Frontend

#### 3.1. Página de Login (`src/app/auth/login/page.tsx`)
A interface de login opera como uma máquina de estados:
1.  **Estado Inicial**: Solicita email e senha.
2.  **Estado de Desafio (MFA)**: Se o backend retornar `mfaRequired`, a interface oculta os campos de senha e exibe o campo de código de 6 dígitos.
3.  **Fallback UI**: Botões "Enviar por Email" e "Enviar por WhatsApp" foram adicionados neste estágio para permitir recuperação caso o usuário não tenha acesso ao app autenticador.

#### 3.2. Configuração de Perfil
Uma nova seção foi adicionada ao painel de perfil do usuário para permitir a ativação do MFA. Ela exibe o QR Code gerado pelo backend e solicita uma confirmação imediata antes de efetivar a ativação.

#### 3.3. Nudge de Segurança (`MfaNudge.tsx`)
Um componente de alerta foi adicionado ao Dashboard. Ele verifica se `user.mfaEnabled` é falso e exibe um banner convidando o usuário a ativar a proteção. Este banner possui lógica de persistência local para não incomodar o usuário repetidamente caso seja dispensado.

### 4. Medidas de Segurança Adicionais

*   **Rate Limiting**: Implementado via `rate-limiter-flexible` para bloquear tentativas excessivas de login (prevenção de Brute Force).
*   **Sanitização de Dados**: Implementada camada de limpeza (`sanitizer.ts`) para garantir que dados sensíveis (PII) não sejam enviados inadvertidamente para serviços externos de IA ou logs.
*   **HTTP Headers**: Configuração de headers de segurança (HSTS, X-Frame-Options) no `next.config.js`.

## Conclusão

A implementação segue as melhores práticas de segurança, oferecendo robustez através do TOTP e flexibilidade através dos canais de OTP (Email/WhatsApp), garantindo que o usuário tenha múltiplas formas de acesso seguro sem comprometer a integridade da conta.
