# Passi

Made by: Gioele Dalla Pozza · 2026-11-04: prima stesura

L'**ordine** del lavoro. Il **cosa** è in `SPEC.md`, il **come** in `ARCHITECTURE.md`.

## Regole

- Un passo alla volta, su `dev`. Si chiude con staging, riepilogo file per file e l'ok di Gioele; il commit lo autorizza lui.
- Il passo aggiorna nello stesso commit i documenti che cambiano (AS-IS e debito in `ARCHITECTURE.md`, ✓ qui).
- Un passo non parte se una sua Q è aperta.

## Primo rilascio

| Passo | Chi                               | Obiettivo                                                                     | Requisiti                         | Q   |
| ----- | --------------------------------- | ----------------------------------------------------------------------------- | --------------------------------- | --- |
| S-01  | Claude Code                       | Documenti: CLAUDE.md, SPEC, ARCHITECTURE, STEPS                               | tutti                             |     |
| S-02  | Claude Code                       | Scheletro (Vite, React, TS strict, token, canvas WebGPU/WebGL2, meta) e CI/CD | N-03, N-09, N-10, N-11, A-05…A-07 |     |
| S-03  | Gioele                            | Vercel, dominio e regola su `main` (passi sotto)                              | A-06                              |     |
| S-04  | Claude Code                       | Nav e Home; via la scena di prova                                             | F-01…F-04, N-04, N-06, N-07       |     |
| S-05  | Claude Code, Gioele (immagini)    | `projects.ts` e vista elenco; descrizioni scritte insieme                     | F-23, F-25, F-26                  |     |
| S-06  | Claude Code                       | Carosello v1                                                                  | F-20…F-22, N-02, N-04…N-06        |     |
| S-07  | Claude Code, Gioele (immagine OG) | About, Contact e meta; misure Lighthouse                                      | F-30, F-31, N-01, N-07…N-09       |     |

## S-03: passi a mano di Gioele

Da scrivere in S-02 (fase CI/CD).

## Dopo il primo rilascio

| Passo | Obiettivo                                     | Requisiti  | Q   |
| ----- | --------------------------------------------- | ---------- | --- |
| S-08  | Card di vetro in TSL                          | F-24, A-04 |     |
| S-09  | Prenotazione con Zoho Bookings                | F-32       |     |
| S-10  | Sezione Configure: particelle → configuratore | F-10, F-11 |     |
| S-11  | Luce del cursore                              | F-40       |     |
| S-12  | Minigioco nascosto                            | F-41       |     |
