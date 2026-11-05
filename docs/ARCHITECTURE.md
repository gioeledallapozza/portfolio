# Architettura

Made by: Gioele Dalla Pozza · 2026-11-04: prima stesura; AS-IS allo scheletro di S-02

Il **come**; il **cosa** è in `SPEC.md`.

## 1. Stack e dipendenze

Versioni esatte, senza `^`, uguali a quelle risolte nel lockfile del configuratore degli orologi. Per ogni altra dipendenza si chiede.

- **Runtime:** react, react-dom 19.3.0 · three 0.186.0 · @react-three/fiber 9.7.0 · @fontsource/chakra-petch, @fontsource/geist-mono 5.3 (ultime al 2026-11-04; nel bundle si importano solo i pesi usati)
- **Dev:** vite 8.3.0, @vitejs/plugin-react 6.1.1 · typescript 5.9.3 · eslint 10.10.0 con typescript-eslint 8.70.0 e react-hooks 7.1.1 · prettier 3.9.7 · @vitejs/plugin-basic-ssl 2.3.0 (HTTPS in sviluppo, per WebGPU dal telefono) · @types di react e three · husky 9 · @commitlint/cli e config-conventional 21 · semantic-release 25
- Node 24 in `.nvmrc`, `pnpm@12.11.2` in `packageManager`.

## 2. Struttura

- `index.html`: meta, Open Graph, `lang="en"`
- `src/main.tsx`, `src/App.tsx`: ingresso, sezioni HTML e canvas
- `src/sections/`: un componente per sezione (Home, Work, About, Contact), la nav, `useActiveSection` e `Typed`
- `src/sections.ts`: l'elenco ordinato delle sezioni `{ id, label?, Section, Scene? }`; da qui nascono nav, pagina, sezione attiva e scene del canvas
- `src/three/`: canvas, renderer e `SectionAnchor`; `src/three/scenes/`: una scena per sezione (da S-06 Work; in v2 Configure)
- `src/content/projects.ts`: i progetti, tipizzati
- `src/styles/tokens.css`: palette e font; `base.css`: layout comune; `nav.css`, `home.css`, `typed.css`, `work.css`: importati dal loro componente; solo con i token; `public/projects/<id>.webp`: un'immagine 16:9 per progetto

## 3. Render

- Un solo `<Canvas>` R3F `position: fixed` dietro la pagina (A-01). Il renderer è `WebGPURenderer` da `three/webgpu`, creato nella prop `gl` asincrona con `await renderer.init()`; con `?webgl` riceve `forceWebGL: true`. Se `init()` fallisce il canvas non si monta e Work resta la griglia (N-03, F-23). Camera con `fov` 35 a z = 10; `flat`, senza tone mapping: WebGPURenderer lo applica a tutto il frame (il `toneMapped` del materiale non conta), e le card devono avere i colori delle immagini HTML del dettaglio (F-22).
- `Stage` e le scene sono caricati con `React.lazy`, e `Stage` si monta solo se almeno una sezione ha una `Scene`: il testo HTML si disegna prima che arrivi three.js (N-01).
- I materiali sono node material TSL; niente drei (A-05). I colori del canvas si leggono dai token CSS (N-10).
- `eventSource` del canvas è la radice della pagina: i puntatori arrivano alla scena anche sotto l'HTML.
- Il canvas monta la `Scene` di ogni voce di `sections.ts`; ogni scena legge a ogni frame il rettangolo della sua sezione e si sposta con lo scroll; fuori schermo non si disegna.
- Aggiungere Configure (S-10) = un componente in `sections/`, una scena in `three/scenes/`, una riga in `sections.ts`.

## 4. Pagina

- Scroll fluido con `scroll-behavior: smooth` in CSS, tolto con `prefers-reduced-motion` (F-02, N-04). Il `padding-top` delle sezioni tiene i titoli sotto la nav.
- Un URL con ancora: dopo il primo render `App` porta la sezione in vista con `scrollIntoView` istantaneo, perché prima la sezione non esiste (F-02).
- Sezione attiva con `useActiveSection`: un `IntersectionObserver` ridotto con `rootMargin` a una linea al centro dello schermo; il link di quella sezione riceve `aria-current` (F-03).
- Animazione d'ingresso della Home a macchina da scrivere, in CSS e solo con `prefers-reduced-motion: no-preference` (F-04, N-04): `Typed` divide il testo in uno `<span>` per carattere con il suo turno in variabili CSS; il carattere è trasparente fino al turno e intanto il suo sfondo è il cursore a blocco. Chrome conta il testo trasparente come già disegnato, quindi l'LCP non aspetta la fine (N-01). Niente pseudo-elementi: accanto a loro Chrome toglie gli spazi dal nome accessibile.

## 5. Work

- `projects.ts` esporta `Project { id, title, description, year, stack, image, alt, links: { label, url, password? }[] }`; `image` è `/projects/<id>.webp`, 16:9 (1600×900; car e watch 3840×2160). Carosello, griglia e dettaglio leggono solo da qui (F-25).
- Un solo markup per le due viste: un `<ol>` con, per progetto, un `<button>` (immagine e titolo) e il suo `<dialog>` di dettaglio, chiuso ma già nella pagina: il testo è sempre indicizzabile e raggiungibile da tastiera (F-23, N-06). Si apre con `showDetail()` (`showModal()` più il focus sul dialog, così dopo un click Close non ha l'anello), si chiude con Esc o un `<form method="dialog">`, senza stato React (F-22).
- Senza 3D l'`<ol>` è la griglia (F-23); entrata: un `IntersectionObserver` aggiunge `.is-in` a ogni progetto la prima volta che entra in vista, poi smette di osservarlo; la transizione è in CSS e con reduced motion non c'è.
- Con il 3D: a texture caricate `WorkScene` mette `data-stage="3d"` su `<html>`, e solo allora `work.css` nasconde la griglia alla vista; finché il 3D non c'è, o se fallisce, resta la griglia (N-03). La scritta della Home (~4 s) copre il caricamento: lo scroll non si blocca mai. I pulsanti nascosti restano per screen reader e tastiera: col focus il carosello ruota fino alla loro card e ne mostra il titolo, Invio apre il dettaglio (N-06).
- Apertura del dettaglio in CSS (`@starting-style`, `transition-behavior: allow-discrete`): immagine nitida a schermo pieno che si avvicina, si scurisce e si sfoca, poi il testo sale; chiusura in dissolvenza; niente con reduced motion. Con il 3D la camera entra nella card finché riempie lo schermo, così l'ultimo fotogramma del canvas è il primo del dettaglio (F-22). Nel 3D la fase nitida l'ha già fatta la camera: il dettaglio salta il ritardo e dura metà.
- Carosello (`three/scenes/WorkScene.tsx`): card piatte su un prisma; copie = `N · ceil(8 / N)`, così la sequenza non si spezza; apotema = `passo / 2 / tan(π / copie)`, con la card davanti sul piano z = 0 (F-20). Rotazione a scatti: un indice `active` e un tween di 0,35 s ogni 2 s, curve cubiche secche, niente inerzia; il drag gira il prisma e al rilascio scatta alla card più vicina (F-21). Pausa, hover, focus e reduced motion fermano gli scatti (N-04, N-05). Apertura: giro fino alla card, poi volo della camera di 0,5 s; chiusura 0,4 s.
- `Work.tsx` e `WorkScene` parlano via DOM, senza stato condiviso: evento `work:open`, `focusin` sulla griglia, `close` dei dialog, `aria-pressed` della pausa; il titolo `.work-label` lo scrive la scena a ogni frame.
- Le card in 3D mostrano solo l'immagine; titoli e testi sono nell'HTML (A-02). Il titolo sul vetro di S-08 dipende da Q-01.

## 6. CI/CD

- Deploy: integrazione Git di Vercel. Push e PR → anteprima; merge su `main` → produzione.
- GitHub Actions solo per controlli e versioni: `ci.yml` (job `ci`: lint, type-check, format:check, build) e `release.yml` (semantic-release su `main` → tag e GitHub Release).
- La versione vive nei tag: `package.json` resta `0.0.0` e `private`, il bot non committa su `main`. Configurazione in `package.json` → `release`; si parte dal tag `v0.1.0` (S-03).
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

- R3F 9.7.0 usa `THREE.Clock`, che three 0.186 segnala come deprecato, e chiede react < 19.3 (avviso di pnpm sui peer): come nel configuratore, finché non si aggiorna fiber.
- `/favicon.ico` dà 404 e `robots.txt` manca (Lighthouse SEO 92, best practices 96): arrivano con i meta in S-07.
- Chrome headless con WebGPU software perde il device anche con una pagina three.js minima: i test automatici del canvas usano `?webgl`; WebGPU si prova su hardware vero.
