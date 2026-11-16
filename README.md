# Galatea

Sito di presentazione di Galatea (in inglese), realizzato come sito statico con animazioni GSAP 3.13 (ScrollTrigger, ScrollSmoother, SplitText, CustomEase), immagini WebP e video ottimizzato.

Il form di richiesta disponibilità usa Netlify Forms (`charter-enquiry`): le richieste arrivano nella dashboard Netlify, sezione Forms.

Il logo vettoriale è in `public/media/galatea-logo.svg` (sfondo trasparente, colore `currentColor`); versioni PNG trasparenti in `galatea-logo-white.png` e `galatea-logo-ink.png`.

## Sviluppo locale

Da questa cartella avviare un server statico, ad esempio:

```sh
python3 -m http.server 8000 --directory public
```

Aprire `http://localhost:8000` nel browser. La cartella pubblicabile è `public`; non sono richiesti passaggi di build.

Le fotografie e il video originali non sono inclusi nel repository; i media ottimizzati utilizzati dal sito sono in `public/media`.
