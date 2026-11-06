# Passi

Made by: Gioele Dalla Pozza · 2026-11-04: prima stesura · 2026-11-06: accorciato (S-06b) · 2026-11-06: S-14…S-16, S-14 fatto

L'**ordine** del lavoro. Il **cosa** è in `SPEC.md`, il **come** in `ARCHITECTURE.md`; la storia dei passi fatti è in git.

Un passo alla volta, su `dev`: aggiorna nello stesso commit i documenti che cambiano, non parte se una sua Q è aperta, si chiude con staging e riepilogo file per file, e il commit lo autorizza Gioele.

## v1: primo rilascio

| Passo   | Obiettivo                                                      | Requisiti                    |
| ------- | -------------------------------------------------------------- | ---------------------------- |
| S-01 ✓  | Documenti                                                      | tutti                        |
| S-02 ✓  | Scheletro e CI/CD                                              | N-03, N-09…N-11, A-05…A-07   |
| S-03 ✓  | Vercel, dominio e regola su `main` (Gioele)                    | A-06                         |
| S-04 ✓  | Nav e Home                                                     | F-01…F-04, N-04, N-06, N-07  |
| S-05 ✓  | `projects.ts`, griglia e dettaglio                             | F-22, F-23, F-25, F-26       |
| S-06 ✓  | Carosello su prisma e zoom nel dettaglio                       | F-20…F-22, N-02, N-04, N-06  |
| S-06b ✓ | Pulizia dei documenti                                          | tutti                        |
| S-08 ✓  | Card di vetro col titolo sempre visibile                       | F-24, A-02, A-04             |
| S-07 ✓  | About, Contact, link a Cal.com, meta, OG e favicon; Lighthouse | F-30…F-32, N-01, N-07…N-09   |
| S-07b ✓ | Ingresso di About e Contact                                    | F-34, N-04                   |
| S-14 ✓  | Schermata di caricamento                                       | F-05, F-23, N-01, N-04, A-10 |
| S-15    | Work guidato dallo scroll e rullo                              | F-20, F-21, N-04, N-06       |
| S-16    | Ingresso di Work                                               | F-35, N-04, A-10             |

Poi prova su iPhone e Safari, e PR `dev` → `main` per la v0.4.0.

## v2

| Passo | Obiettivo                                                                    | Requisiti  |
| ----- | ---------------------------------------------------------------------------- | ---------- |
| S-09  | Prenotazione Cal.com incorporata                                             | F-33       |
| S-09b | Motore del configuratore come pacchetto npm (repo del configuratore, Gioele) | A-01, A-09 |
| S-10  | Sezione Configure: particelle → configuratore, col pacchetto di S-09b        | F-10, F-11 |
| S-11  | Luce del cursore                                                             | F-40       |
| S-12  | Minigioco nascosto                                                           | F-41       |
| S-13  | Rifinitura del vetro                                                         | F-24       |
