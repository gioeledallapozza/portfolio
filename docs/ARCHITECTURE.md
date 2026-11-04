# Architettura

Made by: Gioele Dalla Pozza · 2026-11-04: prima stesura; AS-IS allo scheletro di S-02

Il **come**; il **cosa** è in `SPEC.md`.

## 1. Stack e dipendenze

Versioni esatte, senza `^`, uguali a quelle risolte nel lockfile del configuratore degli orologi. Per ogni altra dipendenza si chiede.

- **Runtime:** react, react-dom 19.3.0 · three 0.186.0 · @react-three/fiber 9.7.0 · @fontsource/chakra-petch, @fontsource/geist-mono 5.3 (ultime al 2026-11-04; nel bundle si importano solo i pesi usati)
- **Dev:** vite 8.3.0, @vitejs/plugin-react 6.1.1 · typescript 5.9.3 · eslint 10.10.0 con typescript-eslint 8.70.0 e react-hooks 7.1.1 · prettier 3.9.7 · @types di react e three · husky 9 · @commitlint/cli e config-conventional 21 · semantic-release 25
- Node 24 in `.nvmrc`, `pnpm@12.11.2` in `packageManager`.

## 2. Struttura

- `index.html`: meta, Open Graph, `lang="en"`
- `src/main.tsx`, `src/App.tsx`: ingresso, sezioni HTML e canvas
- `src/sections/`: un componente per sezione (Home, Work, About, Contact) e la nav
- `src/sections.ts`: l'elenco ordinato delle sezioni `{ id, label?, Section, Scene? }`; da qui nascono nav, pagina, sezione attiva e scene del canvas
- `src/three/`: canvas e renderer; `src/three/scenes/`: una scena per sezione (oggi Work; in v2 Configure)
- `src/content/projects.ts`: i progetti, tipizzati
- `src/styles/tokens.css`: palette e font; `base.css`: layout, solo con i token; `public/projects/`: un'immagine per progetto

## 3. Render

- Un solo `<Canvas>` R3F `position: fixed` dietro la pagina (A-01). Il renderer è `WebGPURenderer` da `three/webgpu`, creato nella prop `gl` asincrona con `await renderer.init()`; con `?webgl` riceve `forceWebGL: true`. Se `init()` fallisce il canvas non si monta e Work mostra l'elenco (N-03, F-23).
- `Stage` e le scene sono caricati con `React.lazy`: il testo HTML si disegna prima che arrivi three.js (N-01).
- I materiali sono node material TSL; niente drei (A-05). I colori del canvas si leggono dai token CSS (N-10).
- `eventSource` del canvas è la radice della pagina: i puntatori arrivano alla scena anche sotto l'HTML.
- Il canvas monta la `Scene` di ogni voce di `sections.ts`; ogni scena legge a ogni frame il rettangolo della sua sezione e si sposta con lo scroll; fuori schermo non si disegna.
- Aggiungere Configure (S-10) = un componente in `sections/`, una scena in `three/scenes/`, una riga in `sections.ts`.

## 4. Pagina

- Scroll fluido con `scroll-behavior: smooth` in CSS, tolto con `prefers-reduced-motion` (F-02, N-04).
- Sezione attiva con un `IntersectionObserver` sulle sezioni (F-03).
- Animazione d'ingresso della Home in CSS (F-04).

## 5. Work

- `projects.ts` esporta `Project { id, title, description, tags, image, links: { label, url, password? }[] }`. Carosello, elenco e pannello leggono solo da qui (F-25).
- Carosello: copie delle card = `ceil(2πR / passo)`, assegnate ai progetti a giro (F-20). L'angolo vive in un ref: `useFrame` lo avanza, il drag gli dà velocità con inerzia (F-21). Pausa e reduced motion fermano solo l'avanzamento (N-04, N-05).
- Le card in 3D mostrano solo l'immagine; titoli e testi sono nell'HTML (A-02).
- Click su una card: la camera si avvicina e si apre un `<dialog>` HTML; Esc lo chiude nativamente (F-22).
- Una lista di pulsanti HTML, uno per progetto, dà l'accesso da tastiera (N-06); resa visibile è la vista elenco (F-23).

## 6. CI/CD

- Deploy: integrazione Git di Vercel. Push e PR → anteprima; merge su `main` → produzione.
- GitHub Actions solo per controlli e versioni: `ci.yml` (job `ci`: lint, type-check, format:check, build) e `release.yml` (semantic-release su `main` → tag e GitHub Release).
- La versione vive nei tag: `package.json` resta `0.0.0` e `private`, il bot non committa su `main`.
- husky + commitlint sul `commit-msg`; `dev` → `main` con merge commit, così semantic-release vede ogni commit.

## 7. Decisioni

- **A-01** Un solo canvas fisso dietro la pagina. Eccezione temporanea per F-11: il canvas dell'embed del motore si affianca in dissolvenza incrociata finché il motore non arriva come pacchetto npm nello stesso canvas.
- **A-02** Tutto il testo in HTML, mai nel canvas: accessibilità, SEO e LCP.
- **A-03** Contenuti in un file TS, niente CMS.
- **A-04** Vetro simulato in TSL (F-24), senza trasmissione reale.
- **A-05** WebGPURenderer con fallback WebGL2; niente componenti drei che usano GLSL.
- **A-06** Deploy con l'integrazione Git di Vercel, non con GitHub Actions.
- **A-07** Versioni con semantic-release, solo tag e GitHub Release.
- **A-08** Scroll fluido in CSS, senza librerie.
- **A-09** In v2 il bundle `build:embed` del motore si carica da Cloudflare a un URL con la versione, solo vicino a Configure: niente file generati nel repo; serve l'header CORS per dallapozza.dev.

## 8. Debito

- Scena di prova `TestScene`: si toglie in S-04.
- Un URL con ancora (`/#work`) non scorre alla sezione, perché React la disegna dopo il caricamento (F-02, S-04).
- R3F 9.7.0 usa `THREE.Clock`, che three 0.186 segnala come deprecato: un avviso in console, finché non si aggiorna fiber.
- `/favicon.ico` dà 404: la favicon arriva con i meta in S-07.
- R3F applica il tone mapping ACES: nel canvas l'accento esce più chiaro di `#C8FF3D`; da decidere per le card in S-06.
