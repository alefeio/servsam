# Proveniência dos dados

Todo conteúdo relevante carrega `provenance`:

- `sourceType`
- `sourceUrl` (quando existir)
- `accessedAt`
- `isFictional`
- `needsClientValidation`
- `notes`

## Tipos de origem

| Tipo | Uso |
| --- | --- |
| VERIFIED_CURRENT_SITE | Encontrado no site atual. |
| VERIFIED_PUBLIC_RECORD | Registro público identificável. |
| BRIEFING_REQUIREMENT | Direcionamento do briefing. |
| DEMO_FICTIONAL | Inventado para demonstrar telas. |
| PENDING_CLIENT_VALIDATION | Plausível, depende de confirmação. |

## Regras

- Dado fictício nunca aparece como resultado real.
- Cases, artigos e dashboard exibem selo visível.
- Certificações listam nomes do site atual com aviso de documentação pendente.
- Descrições de serviço são provisórias, mesmo quando o nome é verificado.
