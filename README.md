# BoedtCamp Krachttraining

Volledige implementatie van de Krachttraining-app: klant-app, trainer-dashboard en
programma-editor, gebouwd op een echte backend + database (niet langer `localStorage`).

Dit is de uitwerking van het ontwerp in [`project/BoedtCamp Krachttraining App.dc.html`](project/BoedtCamp%20Krachttraining%20App.dc.html)
(zie ook [`chats/`](chats) voor de originele ontwerpgesprekken), aangevuld met de specifieke
vraag: sessies (oefeningen, sets, reps, gewicht) per klant opslaan in een database, een
historiek bijhouden, en elke klant laten inloggen met een unieke 6-cijferige pincode die de
trainer zelf instelt.

## Stack

- **`server/`** — Node/Express (TypeScript) + Prisma + PostgreSQL, via a driver adapter
  (`@prisma/adapter-pg`) instead of Prisma's native query-engine binary — this keeps the client
  portable between a normal Node process and a Netlify Function (no OS-specific binary to bundle).
  Alle data (klanten, programma's, sessies, set-per-set historiek, oefeningenbibliotheek) leeft hier.
- **`web/`** — React (Vite). Trainer-dashboard en klant-app als twee apart ingelogde
  omgevingen, gebouwd met de BoedtCamp-designtokens/-componenten uit `project/_ds`.
- **`netlify/functions/api.ts`** — de hele Express-API verpakt als één Netlify Function
  (via `serverless-http`), zodat frontend + API samen als één site deployen.

## Snel starten (lokaal)

Vereist een lokale PostgreSQL-server (bv. `apt install postgresql` of Docker).

```bash
npm install                          # installeert server + web workspaces
cp server/.env.example server/.env   # zet DATABASE_URL naar je lokale Postgres
npm run db:migrate                   # maakt schema aan
npm run db:seed                      # 1 trainer-account + 3 voorbeeldklanten met eigen pincode
npm run dev                          # start server (localhost:4000) + web (localhost:5173)
```

Open <http://localhost:5173>.

### Inloggegevens na het seeden

| Rol | Gegevens |
| --- | --- |
| Trainer | gebruikersnaam `tom`, wachtwoord `boedtcamp` (instelbaar via `TRAINER_USERNAME`/`TRAINER_PASSWORD` in `server/.env` vóór het seeden) |
| Tania Dhaene | pincode `194823` |
| Koen & Ann Verlinden | pincode `305671` |
| Jens Peeters | pincode `728490` |

De trainer kan elke pincode op elk moment wijzigen via het sleutel-icoon op de klantenkaart
in het dashboard.

## Wat is er gebouwd

- **Per-klant historiek**: elke uitgevoerde set (oefening, reps, gewicht/tijd, of hij werd
  afgevinkt) wordt weggeschreven als `SetLog`, gekoppeld aan een `Session` en een `Client`.
  Niets wordt overschreven — dit is de volledige geschiedenis, niet enkel de laatste waarde.
- **Pincode-authenticatie per klant**: de trainer kiest een unieke 6-cijferige code per klant
  in het dashboard. De klant-app is een apart ingelogde omgeving (eigen sessie-cookie) die
  alleen toegang geeft tot de data van die ene klant.
- **Trainer-login**: los van de klant-pincodes, met gebruikersnaam/wachtwoord.
- **"Vorige waarde"**: per set haalt de app automatisch de laatst gelogde waarde voor diezelfde
  oefening/set op uit de historiek — geen hardgecodeerde demo-data meer.
- **Trainer-dashboard (Opvolging)**: KPI's, gewichtsprogressie-grafiek, volume per sessie,
  opmerkingen/pijnmeldingen en het laatste-sessie-detail worden allemaal live berekend uit de
  echte sessie-historiek in de database.
- **Programma-editor**: trainingsdagen toevoegen/verwijderen, blok (warming up/main/cooldown)
  per oefening kiezen, sets/reps/gewicht/rust/videolink aanpassen, volgorde wijzigen, de
  wekelijkse core/mobiliteit-rotatie en de progressieve roeiopbouw beheren, en oefeningen
  toevoegen uit een gecureerde bibliotheek.
- **Klant-app**: trainingsoverzicht, sets loggen met vooringevulde vorige waarde, reps per set
  aanpassen, een set verwijderen, rusttimer, en afronden met zwaarte-score/opmerking/pijnmelding.
- **Voeding registreren**: de klant-app opent nu eerst een keuzescherm — *Trainen* of *Voeding
  registreren*. Het voedingsdagboek toont kcal/koolhydraten/eiwitten/vetten tegen de doelen die
  de trainer instelt, gegroepeerd per maaltijd. Registreren kan via barcode scannen (live camera
  met `BarcodeDetector`, of manueel intikken), op naam zoeken, of een foto trekken — die probeert
  eerst een barcode op de foto te lezen, en valt anders terug op beeldherkenning via de Anthropic
  API (`ANTHROPIC_API_KEY`, server-side; optioneel — zonder sleutel werkt de rest gewoon door).
  Zowel bij het opzoeken als na de beeldherkenning kan de klant portie, maaltijd en alle vier de
  waarden zelf aanpassen voor het opslaat, en bestaande registraties zijn nadien nog te wijzigen
  of te verwijderen.
- **Trainer-dashboard · Voeding**: derde tab naast Opvolging en Programma-editor. Per klant
  kcal/koolhydraten/eiwitten/vetten instellen (met de energieverdeling ernaast), plus overzichten
  per periode (14 dagen / 30 dagen / 12 maanden) met gemiddelden tegen het doel, en één dag in
  detail per geregistreerd product.
- **Open Food Facts**: barcode-opzoeking en productzoekopdrachten lopen via de server (geen
  CORS-afhankelijkheid in de browser); is de databank niet bereikbaar, dan valt de app terug op
  een kleine ingebouwde productenlijst zodat de flow altijd demonstreerbaar blijft.

## Deployen naar Netlify

Frontend en API deployen samen als één Netlify-site: statische assets uit `web/dist`, de
Express-API als één Netlify Function, `/api/*` wordt er via een redirect naartoe gestuurd
(zie `netlify.toml`). Lokaal getest tegen een echte Postgres-database (zie hierboven) —
de stap hieronder is puur het echte Netlify-account koppelen en de omgeving instellen.

```bash
npx netlify-cli login                        # of: netlify login --request "…" voor een agent/headless flow
npx netlify-cli init                         # koppel of maak de site; kies "server"/"web" niet als losse app —
                                               # de root netlify.toml stuurt de build aan
npx netlify-cli db                            # provisioneert een production-ready Postgres (Netlify DB / Neon)
                                               # en zet DATABASE_URL automatisch als site env var
netlify env:set JWT_SECRET "<genereer iets willekeurigs>"
netlify env:set TRAINER_USERNAME "tom"
netlify env:set TRAINER_PASSWORD "<kies een sterk wachtwoord>"
netlify env:set ANTHROPIC_API_KEY "<jouw Anthropic API-sleutel>"  # optioneel — enkel voor foto-herkenning van voeding

# schema + seed tegen de productie-database (éénmalig, en na elke schemawijziging):
DATABASE_URL="$(netlify env:get DATABASE_URL)" npm run db:migrate -w server -- deploy
DATABASE_URL="$(netlify env:get DATABASE_URL)" npm run db:seed -w server

npx netlify-cli deploy --prod
```

Als je zelf al een Netlify-account/CLI-sessie hebt, kan je ook gewoon de repo koppelen via de
Netlify-UI (Import from Git) — `netlify.toml` bevat alle build-instellingen, dus dat werkt zonder
verdere configuratie zodra `DATABASE_URL`, `JWT_SECRET`, `TRAINER_USERNAME` en `TRAINER_PASSWORD`
als environment variables staan. `ANTHROPIC_API_KEY` is optioneel: zonder sleutel werkt alles
behalve foto-herkenning van een bord eten (barcode scannen en op naam zoeken blijven werken).

## Bewuste scope-keuzes

Om dit binnen één implementatieronde af te leveren zijn een paar dingen bewust vereenvoudigd
t.o.v. het prototype:

- **Oefeningenbibliotheek**: het prototype haalde live op bij free-exercise-db en wger. Hier is
  een gecureerde set van ~35 oefeningen (met spiergroep + doel) éénmalig in de database geseed
  — precies wat het prototype zelf als "volgende stap" voorstelde (`nextSteps` in de Data & API-tab),
  en vermijdt afhankelijkheid van externe netwerkbeschikbaarheid. Meer oefeningen toevoegen is
  een kwestie van rijen toevoegen aan `LibraryExercise` (of een importscript schrijven).
- **Eén variant van het trainingsscherm**: variant A ("compacte lijst") is volledig
  geïmplementeerd; variant B ("groot & rustig, 50+") uit het prototype is niet meegenomen.
- **"+ Klant toevoegen" zonder sjablonen**: een klant aanmaken vraagt naam/meta/focus/frequentie
  + pincode; er zijn geen kant-en-klare 50+/duo/jongere-sporter-sjablonen (was ook in het
  prototype al een placeholder).
- **Foto-herkenning van voeding is optioneel**: zonder `ANTHROPIC_API_KEY` blijft barcode scannen
  en op naam zoeken gewoon werken; enkel "foto trekken" van een bord zonder barcode geeft dan een
  duidelijke melding in plaats van een resultaat.

## Projectstructuur

```
server/
  prisma/schema.prisma   Trainer, Client, ProgramDay, ProgramItem, Session, SetLog, LibraryExercise,
                          NutritionTarget, FoodEntry
  prisma/seed.ts         trainer-account + 3 klanten + hun programma's + bibliotheek + voedingsdoelen
  src/app.ts             de geconfigureerde Express-app (routes + middleware, geen .listen())
  src/index.ts           lokale dev-entrypoint (app.listen op :4000)
  src/db.ts              Prisma Client via de pg-driver-adapter
  src/routes/            auth, clients, program, dashboard, library, clientApp,
                          nutritionClient, nutritionTrainer
  src/lib/schedule.ts    pool-rotatie + roeiopbouw-formules (client-app gebruikt dit)
  src/lib/date.ts        lokale-dag ISO-datumhelpers voor het voedingsdagboek
  src/lib/openFoodFacts.ts  server-side Open Food Facts-client + ingebouwde fallbacklijst
  src/lib/nutritionAi.ts    foto-herkenning van voeding via de Anthropic API
netlify/functions/api.ts de Express-app verpakt als één Netlify Function (serverless-http)
netlify.toml            build/publish/functions-config + /api/* en SPA-redirects
web/
  src/ds/                Button/Badge/Card, 1:1 overgenomen uit project/_ds/_ds_bundle.js
  src/styles/tokens.css  kleur/typografie/spacing-tokens uit project/_ds
  src/pages/             Landing, TrainerLogin, TrainerApp, ClientLogin, ClientAppShell
  src/components/trainer/  ClientSwitcher, Opvolging, ProgramEditor, Nutrition
  src/components/client/   Choice, Home, Workout, Done, food/ (FoodApp, FoodDiary,
                            FoodAddScreen, FoodEditScreen)
project/                 het originele ontwerp-exportbundel (referentie)
chats/                   de ontwerpgesprekken die tot dit ontwerp leidden
```

## Bekend aandachtspunt

`npm audit` meldt matige kwetsbaarheden in `react-router` (open-redirect CVE, niet van
toepassing zolang er geen niet-vertrouwde URL's in `<Link>`/`navigate` terechtkomen) en in
Vite's dev-only `esbuild`. Beide zijn onschadelijk voor lokale ontwikkeling; overweeg een
upgrade voor productiegebruik.
