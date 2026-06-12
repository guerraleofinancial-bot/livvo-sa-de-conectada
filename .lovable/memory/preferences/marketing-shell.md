---
name: marketing-shell
description: Páginas institucionais (/, /como-funciona, /para-parceiros, /para-empresas, /planos-e-precos) usam <MarketingShell /> de src/components/livvo/marketing-shell.tsx. Nunca duplicar header/footer.
type: preference
---
Páginas institucionais públicas usam o componente `MarketingShell` (nav + footer compartilhados).
Nav: Como funciona, Para parceiros, Para empresas, Planos e preços.
Footer: colunas Pacientes / Parceiros / Legal.

**How to apply:** Ao criar nova página institucional pública, importar `MarketingShell` e envelopar o conteúdo. Para adicionar novo link no nav, editar `navLinks` em `marketing-shell.tsx` — único ponto de verdade.
