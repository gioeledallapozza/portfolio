# Architettura

Made by: Gioele Dalla Pozza · 2026-11-04: prima stesura · 2026-11-06: accorciato (S-06b) · 2026-11-06: A-10 e loader (S-14) · 2026-11-06: Work guidato dallo scroll (S-15, S-16)

Il **come**, solo ciò che il codice da solo non spiega: valori, durate, formule e nomi vivono nel codice. Il **cosa** è in `SPEC.md`.

## 1. Stack e dipendenze

Versioni esatte, senza `^`, uguali a quelle risolte nel lockfile del configuratore degli orologi. Per ogni altra dipendenza si chiede.

- **Runtime:** react, react-dom 19.3.0 · three 0.186.0 · @react-three/fiber 9.7.0 · @fontsource/chakra-petch, @fontsource/geist-mono 5.3 (nel bundle solo i pesi usati)
- **Dev:** vite 8.3.0, @vitejs/plugin-react 6.1.1 · typescript 5.9.3 · eslint 10.10.0 con typescript-eslint 8.70.0 e react-hooks 7.1.1 · prettier 3.9.7 · @vitejs/plugin-basic-ssl 2.3.0 (HTTPS in sviluppo, per WebGPU dal telefono) · @types di react e three · husky 9 · @commitlint/cli e config-conventional 21 · semantic-release 25
- Node 24 in `.nvmrc`, `pnpm@12.11.2` in `packageManager`.

## 2. Struttura

- `src/sections.ts`: l'elenco ordinato delle sezioni, da cui nascono nav, pagina, sezione attiva e scene del canvas; aggiungere Configure = un componente in `sections/`, una scena in `three/scenes/`, una riga qui.
- `src/content/projects.ts`: unica fonte dei progetti (testi, link, stack); un'immagine 16:9 per progetto in `public/projects/`.
- `src/styles/tokens.css`: unica fonte di colori e font, letta anche dal canvas; ogni altro CSS è importato dal suo componente.
- `src/loader/`: `phases.ts` raccoglie le fasi pesate, `loader.ts` è la schermata; una cosa nuova da attendere (il configuratore in v2) è un `addPhase` dove si carica, senza toccare il loader. `src/motion/`: funzioni di movimento pure, condivise da HTML e canvas (A-10).
- `src/three/`: `tsl/` blocchi TSL puri (forma, rumore, colore), da riusare per le particelle in v2; `materials/` factory che li compongono e restituiscono materiale e uniform tipizzati; `textures/` texture disegnate su canvas 2D; `scenes/<sezione>/` cosa c'è in scena e il collegamento con l'HTML, col movimento in un hook a parte (`useCarousel`), così si legge senza la scena; `inspector/` solo in sviluppo (`?inspector`, import dinamico fuori dalla build), unica eccezione a N-10.

## 3. Render

- Il loader è HTML statico con lo stile inline, così è a schermo prima del JavaScript; `tokens.css` è linkato da `index.html` e il woff2 di Chakra Petch è in preload, così colori e font del loader sono pronti al primo frame (N-10).
- Le fasi si registrano al caricamento dei moduli: il totale è noto dal primo frame, quindi la percentuale vera non torna indietro; quella mostrata la insegue ma non arriva a 100 prima del tempo minimo.
- La scena si compila sotto il loader con `compileAsync`, mostrata tutta solo per quella chiamata: fuori schermo è nascosta, three salterebbe shader e texture e li pagherebbe all'arrivo su Work.
- Se scade il tempo massimo lo stage si smonta: meglio la griglia per tutta la visita del carosello che la sostituisce sotto gli occhi (F-23).
- Il canvas e le scene arrivano con `React.lazy`, e solo se una sezione ha una scena: il testo HTML si disegna prima di three.js (N-01).
- Se `renderer.init()` fallisce il canvas non si monta e Work resta la griglia (N-03).
- Niente tone mapping: WebGPURenderer lo applica a tutto il frame, e le card devono avere i colori delle immagini HTML del dettaglio.
- `eventSource` è la radice della pagina, così i puntatori arrivano alla scena anche sotto l'HTML.
- Ogni scena segue il rettangolo della sua sezione con lo scroll e fuori schermo non si disegna.

## 4. Pagina e Work

- Un URL con ancora scorre sotto il loader, prima dell'uscita, così le fette scoprono già quella sezione.
- `Typed`: il testo trasparente conta già come disegnato, quindi l'LCP non aspetta la fine (N-01); niente pseudo-elementi, perché Chrome toglierebbe gli spazi dal nome accessibile. Le animazioni restano in pausa finché la sezione non entra in vista (`entered`, mai prima che il loader sia uscito), così i ritardi partono da lì e un unico `Typed` serve ogni sezione (F-34).
- Un solo markup per griglia e carosello: per progetto un `<button>` e un `<dialog>` chiuso, sempre nella pagina, così il testo resta indicizzabile e raggiungibile da tastiera anche col 3D (N-06).
- La griglia è la vista di partenza e la scena la sostituisce sotto il loader, a scena pronta: se il 3D fallisce o non arriva in tempo resta la griglia. Finché il loader copre, la pagina è `inert` e lo scroll è bloccato, così focus e scroll non finiscono in una pagina che non si vede.
- `Work.tsx` e la scena parlano via DOM (eventi, focus, attributi), senza stato React condiviso.
- Work col 3D è un binario più alto dello schermo con dentro un pin sticky: la card la sceglie lo scroll nativo, senza intercettare la rotella né librerie, così touch, tastiera e scrollbar funzionano da soli; la scena segue il pin (`data-scene`), non la sezione. Il prisma segue lo scroll in modo continuo, con un minimo di inseguimento perché gli scatti della rotella non saltino; scorrendo, le card si muovono sotto un mouse fermo, quindi il raycast si ripete a ogni movimento e l'hover segue la card che c'è sotto.
- Il prisma gira in modo che le card scorrano lungo il lato lungo dello schermo: rullo sui telefoni, giostra sugli schermi larghi, così le vicine restano in vista.
- Con pochi progetti le card si ripetono fino a riempire il giro, così la sequenza non si spezza.
- La camera entra nella card finché riempie lo schermo: l'ultimo fotogramma del canvas è il primo del dettaglio.
- Titolo sul vetro: disegnato su un canvas 2D fuori dalla pagina, dopo il caricamento del font, e usato come texture nella stessa scena del prisma, senza un secondo canvas (A-02); nell'ingresso si ridisegna con `decode` di `scramble.ts`, lo stesso glitch del loader.
- Vetro: il colore che lo tinge viene da una mipmap più grossa dell'immagine letta nello stesso punto, così ogni zona prende il colore di ciò che ha sotto; lo spessore è una lastra vera (`glassShape.ts`) col contorno dello sdf, e le card di spalle alla camera si nascondono. Un materiale per copia, così hover, focus e apertura toccano una card sola; lo shader è lo stesso e si compila una volta (`renderer._pipelines` resta costante). L'apertura è in `glassOpen.ts` per provarne varianti, e l'ingresso in `glassEnter.ts` sulle stesse fette (A-10); a uOpen = 1 l'apertura lascia l'immagine nitida con una cornice di vetro ai bordi dello schermo, che il dettaglio ridisegna in CSS col colore medio dell'immagine (calcolato da `showDetail`, il CSS non legge i pixel): canvas e dialog sono una scena sola.

## 5. Decisioni

- **A-01** Un solo canvas fisso dietro la pagina, senza eccezioni: anche il configuratore di F-11 entra lì, in `three/scenes/configure/`.
- **A-02** Tutto il testo in HTML; nel canvas solo copie decorative di testo già presente nell'HTML (accessibilità, SEO, LCP).
- **A-03** Contenuti in un file TS, niente CMS.
- **A-04** Vetro simulato in TSL (F-24), senza trasmissione reale.
- **A-05** WebGPURenderer con fallback WebGL2; niente componenti drei che usano GLSL.
- **A-06** Deploy con l'integrazione Git di Vercel (push e PR → anteprima, `main` → produzione); GitHub Actions solo per controlli e versioni.
- **A-07** Versioni con semantic-release, solo tag e GitHub Release: `package.json` resta `0.0.0` e il bot non committa su `main`.
- **A-08** Scroll fluido in CSS, senza librerie.
- **A-09** Prima di entrare nel portfolio il motore del configuratore diventa un pacchetto npm, nel suo repo, importato in modo dinamico solo vicino a Configure: niente embed, niente dissolvenza tra due canvas, niente file generati nel repo.
- **A-10** Il movimento del sito è fatto di tre effetti, ognuno sempre per le stesse cose, così ogni effetto dice che tipo di cosa sta succedendo: scrittura a macchina per i testi HTML, glitch di caratteri per i testi "di sistema" (loader, titoli sulle card), fette di vetro per i passaggi di scena (uscita del loader, apertura e ingresso delle card).

## 6. Debito

- R3F 9.7.0 usa `THREE.Clock`, deprecato in three 0.186, e chiede react < 19.3 (avviso di pnpm): resta finché non si aggiorna fiber.
- Chrome headless perde il device WebGPU anche con una pagina minima: i test automatici usano `?webgl`, WebGPU si prova su hardware vero.
- Le immagini di Car e Watch restano 3840×2160 per scelta (circa 44 MB ciascuna in GPU con le mipmap); se i telefoni non reggono, texture KTX2 compresse (loader già in three).
