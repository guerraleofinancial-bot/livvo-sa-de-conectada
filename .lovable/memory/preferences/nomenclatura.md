---
name: nomenclatura
description: Padronização de termos da Livvo — paciente, parceiro, administrador. "Parceiro" no comercial/institucional; "Profissional" só em área logada para PF.
type: preference
---
**Perfis canônicos:** Paciente · Parceiro · Administrador.

**Substituir** em copy institucional, landing, e-mails marketing, p\u00e1ginas p\u00fablicas: Profissional / Prestador / Especialista / Fornecedor → **Parceiro**.

**Manter "Profissional"** somente:
- Cartão de role no /auth (rótulo "Parceiro Livvo" + descrição "Receber pacientes")
- Onboarding (`onboarding-pro.tsx`) para identidade de PF
- Área logada (`/pro/*`, `/onboarding-pro`) quando o usuário é a pessoa física
- Schema do banco (`role: 'profissional'` é o enum técnico — não mudar)

**Manter sempre específicos** quando relevante: Médico, Dentista, Psicólogo, Fisioterapeuta, Clínica, Laboratório, Centro de Diagnóstico, Estética.

**Serviços** (não "Valor da Consulta"): Consultas · Exames · Procedimentos · Pacotes.

**How to apply:** Ao escrever copy nova, perguntar "isso é institucional/comercial?" → use "Parceiro". "Isso é identidade do usuário logado PF?" → "Profissional" é aceitável.
