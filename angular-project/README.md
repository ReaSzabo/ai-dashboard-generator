# Angular Project

Ez egy alap Angular alkalmazás Express.js backend szerverrel való kommunikációhoz.

## Funkciók

- **Főoldal**: Üdvözlő oldal
- **Aloldal**: Tartalmaz egy beviteli mezőt (textarea) és kommunikál a backend szerverrel

## Telepítés és indítás

1. Telepítse a függőségeket:
```bash
npm install
```

2. Indítsa el az Angular development szervert:
```bash
npm start
```

3. Nyissa meg a böngészőben: `http://localhost:4200`

## Használat

1. Navigáljon az "Subpage" oldalra
2. Írjon be szöveget a beviteli mezőbe
3. Kattintson a "Küldés" gombra
4. A szerver válasza megjelenik a beviteli mező alatt

## Technológiák

- Angular 18
- TypeScript
- HTTP Client
- Angular Router
- Standalone Components

## Projekt struktúra

- `src/app/app.component.ts` - Fő alkalmazás komponens
- `src/app/home.component.ts` - Főoldal komponens
- `src/app/subpage.component.ts` - Aloldal komponens textarea-val
- `src/app/app.routes.ts` - Routing konfiguráció