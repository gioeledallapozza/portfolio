# CLAUDE.md

## Progetto

Portfolio pubblico di Gioele Dalla Pozza su https://dallapozza.dev: una pagina sola, in inglese, che porta contatti da agenzie e-commerce che cercano configuratori 3D. Il cosa è in `docs/SPEC.md`, il come in `docs/ARCHITECTURE.md`, l'ordine in `docs/STEPS.md`.

Stack: React 19, TypeScript strict, React Three Fiber 9, three.js WebGPURenderer + TSL, Vite, pnpm. Deploy con l'integrazione Git di Vercel.

## Regole pilota

- **Semplicità.** Qui non c'è logica complessa: meno file, meno righe, meno concetti.
- **Tutto il testo è HTML**, mai nel canvas (A-02).
- **Un progetto nuovo è una voce in `src/content/projects.ts` più un'immagine**, nient'altro (F-25).
- **Colori e font solo da `src/styles/tokens.css`** (N-10).
- **Solo TSL**: niente GLSL, niente componenti drei (A-05).

## Comandi

- `pnpm dev`: dev server; `?webgl` forza il backend WebGL2
- `pnpm build`: typecheck + build di produzione
- `pnpm preview`: serve la build
- `pnpm lint`: ESLint, zero warning
- `pnpm type-check`: TypeScript senza emettere
- `pnpm format` / `pnpm format:check`: Prettier

Lint, type-check e format:check devono passare prima di ogni commit.

## Stile del codice

- Codice, commenti e commit in inglese; documenti in italiano e corti.
- Ogni file inizia con `// percorso/del/file.ts`, poi gli import, poi al massimo due righe `//` su cosa fa il file.
- Solo commenti `//`, corti, sul perché e non sul cosa. Niente JSDoc.
- Niente codice morto, niente astrazioni senza un secondo uso reale.

## Documenti

- Ogni requisito ha un ID (F-, N-), una priorità MoSCoW e un criterio di verifica; decisioni A-, passi S-, domande Q-.
- Niente codice né dipendenze senza un ID dello SPEC: ciò che manca si propone come requisito.
- Quando cambi un comportamento descritto in un `.md`, aggiorni il `.md` nello stesso commit.
- Ogni documento resta sotto le ~70 righe.

## Git

- Si lavora su `dev`; `main` è protetto e riceve solo PR da `dev` con **merge commit** (mai squash).
- Commit in Conventional Commits, su una riga; commitlint lo controlla, semantic-release lo legge.
- **Mai commit, push, merge, PR o tag senza l'ok di Gioele.** A fine fase: staging, riepilogo file per file con il perché, poi ci si ferma.

## Modo di lavorare

- Prima il piano, poi il codice.
- Se una decisione non è scritta nei documenti, chiedi invece di scegliere.
- Dipendenze ammesse: quelle in `docs/ARCHITECTURE.md` §1. Per qualsiasi altra, chiedi.
