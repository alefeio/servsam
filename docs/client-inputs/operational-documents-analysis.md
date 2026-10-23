# Análise dos documentos operacionais

Registro funcional da Sprint 10.1. Os arquivos originais não entram no repositório e nenhum dado pessoal deles foi copiado para a demonstração.

## Tipos de documento observados

- Proposta comercial, com condições que mudam conforme o serviço.
- Formalização do aceite: ordem de compra de serviço, ordem de compra, ordem de serviço do cliente ou proposta assinada.
- Informativo de serviço, autorização de entrada e declaração de ciência.
- Ordem de serviço com campos diferentes por família.
- Termo de execução, aceite e avaliação do atendimento.
- Relatório técnico/fotográfico em seções, com evidências de antes e depois.
- Atestado de reservatório, atestado de poço, certificado de controle de pragas e certificado de coleta/resíduos.
- Licenças e credenciamentos citados nos documentos técnicos.
- Processo de assessoria para outorga de uso de recursos hídricos.

## Padrões funcionais

- A aprovação da proposta não parece, sozinha, abrir a agenda. Há um documento de formalização no meio.
- A OS tem um miolo comum (cliente, local, data, equipe, veículo, responsável) e um formulário que muda com o serviço.
- A execução registra o que foi feito, não só o que foi planejado.
- A avaliação do cliente já aparece nas OS atuais, com as opções Excelente, Bom, Razoável e Pouco razoável.
- O mesmo contrato ou serviço pode ter mais de uma visita.
- O responsável técnico muda conforme a família.
- Relatório, atestado e certificado não são o mesmo documento.

## Diferenças entre famílias

| Família | O que a demonstração destaca |
| --- | --- |
| RSV | Reservatório elevado, cisterna, volume, higienização, aceite |
| CIP | Desinsetização, desratização, produtos, infestação, declaração de ciência |
| Coleta de água | Ponto, origem, pacote, laboratório fictício e prazo do resultado |
| ETE | Hidrojateamento, retirada e dosagem, ainda como hipótese de campos |
| Monitoramento | Retrolavagem, recargas, pH, cloro e inconformidade |
| Poço / outorga | Atestado de poço e processo ambiental, com outro responsável técnico |

## Necessidades novas

- Documentos pré-serviço dentro da jornada, sem virar módulo principal.
- Frota com carro, utilitário e motocicleta, além dos códigos já citados.
- Colaborador com documento, NR-10, NR-33, NR-35, ASO e EPI, separado do usuário do sistema.
- Licenças ligadas aos serviços que as usam, com número fictício na demonstração.
- Histórico do cliente com formalização, pré-serviço, avaliação e próxima recorrência.

## Hipóteses

- "Processos" do perfil Administrativo pode ser assessoria ambiental, como outorga. Isso não está confirmado.
- Retrolavagem e monitoramento de sanitizantes podem pertencer a ETA, manutenção ou contrato recorrente.
- Esgotamento de resíduos e fossa podem ser serviço de catálogo. A home não foi alterada.
- Quatro fotos por página é o padrão visual usado agora pela empresa. Seis fotos por página foi citado antes. Os dois continuam pendentes.

## Pendências

A lista completa da reunião está em `docs/content/pending-client-validation.md`, itens 37 a 66.

Confirmar com o cliente: padrão final será 4 ou 6 fotos por página?
