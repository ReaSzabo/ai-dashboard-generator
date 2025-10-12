# Szakdolgozat - Angular + Express.js Project

Ez a mappa tartalmazza a szakdolgozat Angular frontend és Express.js backend projektjeit.

## Projektek

### 📁 angular-project
- **Típus**: Angular 18 Single Page Application
- **Port**: 4200
- **Leírás**: Frontend alkalmazás egy textarea beviteli mezővel és HTTP kommunikációval

### 📁 express-server  
- **Típus**: Express.js REST API szerver
- **Port**: 3000
- **Leírás**: Backend szerver `/getData` endpoint-tal

## Gyors indítás

### Backend szerver indítása:
```bash
cd express-server
npm install
npm start
```

### Frontend alkalmazás indítása:
```bash
cd angular-project  
npm install
npm start
```

## URL-ek
- **Frontend**: http://localhost:4200
- **Backend**: http://localhost:3000
- **API endpoint**: http://localhost:3000/getData?text=<text>

## Használat
1. Indítsd el mindkét szervert
2. Nyisd meg a http://localhost:4200 címet
3. Írj be szöveget a textarea-ba
4. Kattints a "Küldés" gombra
5. A szerver "success" válasza megjelenik

## Technológiák
- **Frontend**: Angular 18, TypeScript, Standalone Components
- **Backend**: Express.js, Node.js, CORS
- **Architektúra**: REST API, Single Page Application