# Passi

Made by: Gioele Dalla Pozza · 2026-11-04: prima stesura

L'**ordine** del lavoro. Il **cosa** è in `SPEC.md`, il **come** in `ARCHITECTURE.md`.

## Regole

- Un passo alla volta, su `dev`. Si chiude con staging, riepilogo file per file e l'ok di Gioele; il commit lo autorizza lui.
- Il passo aggiorna nello stesso commit i documenti che cambiano (AS-IS e debito in `ARCHITECTURE.md`, ✓ qui).
- Un passo non parte se una sua Q è aperta.

## Primo rilascio

| Passo  | Chi                               | Obiettivo                                                                       | Requisiti                          | Q   |
| ------ | --------------------------------- | ------------------------------------------------------------------------------- | ---------------------------------- | --- |
| S-01 ✓ | Claude Code                       | Documenti: CLAUDE.md, SPEC, ARCHITECTURE, STEPS                                 | tutti                              |     |
| S-02 ✓ | Claude Code                       | Scheletro (Vite, React, TS strict, token, canvas WebGPU/WebGL2, meta) e CI/CD   | N-03, N-09, N-10, N-11, A-05…A-07  |     |
| S-03 ✓ | Gioele                            | Vercel, dominio e regola su `main` (passi sotto)                                | A-06                               |     |
| S-04 ✓ | Claude Code                       | Nav e Home; via la scena di prova                                               | F-01…F-04, N-04, N-06, N-07        |     |
| S-05 ✓ | Claude Code, Gioele (immagini)    | `projects.ts`, griglia e dettaglio a tutto schermo; descrizioni scritte insieme | F-22 (dettaglio), F-23, F-25, F-26 |     |
| S-06 ✓ | Claude Code                       | Carosello v1: cilindro, hover e zoom verso il dettaglio                         | F-20…F-22, N-02, N-04…N-06         |     |
| S-07   | Claude Code, Gioele (immagine OG) | About, Contact e meta; misure Lighthouse                                        | F-30, F-31, N-01, N-07…N-09        |     |

## S-03: passi a mano di Gioele

1. **Tag di partenza**, prima del merge che porta `release.yml` su `main`: `git tag v0.1.0 origin/main && git push origin v0.1.0`. Senza tag semantic-release parte da 1.0.0; da qui `feat` dà 0.2.0, 0.3.0…
2. **Vercel → Add New → Project**: importa `gioeledallapozza/portfolio`. Preset Vite riconosciuto da solo (`pnpm build`, output `dist`); nessuna variabile d'ambiente oltre a quella sotto.
   - Settings → Build and Deployment: Node.js 24.x.
   - Settings → Environment Variables: `ENABLE_EXPERIMENTAL_COREPACK=1`, così Vercel usa il pnpm di `packageManager`.
   - Settings → Environments: Production Branch `main`. Ogni altro push e ogni PR danno un'anteprima.
3. **Vercel → Settings → Domains**: aggiungi `dallapozza.dev` e `www.dallapozza.dev`, con `www` che reindirizza (308) a `dallapozza.dev`. Annota i record che Vercel mostra.
4. **Porkbun → Domain Management → dallapozza.dev → DNS**:
   - cancella solo i record di parcheggio su `@` e `www` (ALIAS/CNAME verso `pixie.porkbun.com`) e l'eventuale URL Forwarding;
   - aggiungi `A @` e `CNAME www` con i valori di Vercel;
   - **non toccare** MX e TXT di Zoho (SPF, DKIM, DMARC, verifica), né i sottodomini dei progetti già pubblicati;
   - se c'è un record CAA, deve permettere `letsencrypt.org`.
5. **Verifica**: in Vercel i due domini sono "Valid Configuration" con certificato; `https://dallapozza.dev` si apre, `www` reindirizza; una mail di prova a gioele@dallapozza.dev arriva.
6. **GitHub → Settings → General → Pull Requests**: lascia solo "Allow merge commits", togli squash e rebase.
7. **GitHub → Settings → Rules → New branch ruleset**, dopo che il job `ci` ha girato almeno una volta: target `main`, Active, nessun bypass; "Require a pull request" (0 approvazioni, metodo Merge), "Require status checks" con `ci`, "Block force pushes", "Restrict deletions".

## Dopo il primo rilascio

| Passo | Obiettivo                                                                                                 | Requisiti  | Q    |
| ----- | --------------------------------------------------------------------------------------------------------- | ---------- | ---- |
| S-08  | Card di vetro in TSL: tinta dall'immagine, titolo sempre visibile davanti al vetro, hover lungo il raggio | F-24, A-04 | Q-01 |
| S-09  | Prenotazione con Cal.com (account configurato, manca l'integrazione)                                      | F-32       | Q-02 |
| S-10  | Sezione Configure: particelle → configuratore                                                             | F-10, F-11 |      |
| S-11  | Luce del cursore                                                                                          | F-40       |      |
| S-12  | Minigioco nascosto                                                                                        | F-41       |      |
