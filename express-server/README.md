# Express.js Server

Ez egy alap Express.js szerver az Angular alkalmazáshoz.

## Funkciók

- `/getData` endpoint - fogad egy string paramétert és "success" stringgel tér vissza
- CORS konfiguráció az Angular frontend számára
- Egyszerű API dokumentáció

## Telepítés és indítás

1. Telepítse a függőségeket:
```bash
npm install
```

2. Indítsa el a szervert:
```bash
npm start
```

Vagy development módban (auto-restart):
```bash
npm run dev
```

3. A szerver elérhető: `http://localhost:3000`

## API Endpoints

### GET /
- **Leírás**: Szerver státusz és elérhető endpointok listája
- **Válasz**: JSON objektum a szerver információkkal

### GET /getData
- **Leírás**: Fő endpoint, fogad egy text paramétert
- **Paraméterek**: 
  - `text` (query parameter) - string érték
- **Példa**: `GET /getData?text=hello`
- **Válasz**: "success" string

## Technológiák

- Express.js 4.18
- CORS middleware
- Nodemon (development)

## Konfiguráció

- Port: 3000
- CORS origin: http://localhost:4200 (Angular dev server)
- Támogatott HTTP módszerek: GET, POST, PUT, DELETE