# BoedtCamp Krachttraining

Volledige implementatie van de Krachttraining-app: klant-app, trainer-dashboard en
programma-editor, gebouwd op een echte backend + database (niet langer `localStorage`).

Dit is de uitwerking van het ontwerp in [`project/BoedtCamp Krachttraining App.dc.html`](project/BoedtCamp%20Krachttraining%20App.dc.html)
(zie ook [`chats/`](chats) voor de originele ontwerpgesprekken), aangevuld met de specifieke
vraag: sessies (oefeningen, sets, reps, gewicht) per klant opslaan in een database, een
historiek bijhouden, en elke klant laten inloggen met een unieke 6-cijferige pincode die de
trainer zelf instelt.

## Stack

- **`server/`** — Node/Express (TypeScript) + Prisma + SQLite. Alle data (klanten, programma's,
  sessies, set-per-set historiek, oefeningenbibliotheek) leeft hier.
- **`web/`** — React (Vite). Trainer-dashboard en klant-app als twee apart ingelogde
  omgevingen, gebouwd met de BoedtCamp-designtokens/-componenten uit `project/_ds`.

## Snel starten

```bash
npm install                 # installeert server + web workspaces
cp server/.env.example server/.env   # pas gerust de standaardwaarden aan
npm run db:migrate          # maakt de SQLite-database + schema aan
npm run db:seed             # 1 trainer-account + 3 voorbeeldklanten met eigen pincode
npm run dev                 # start server (localhost:4000) + web (localhost:5173)
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

## Projectstructuur

```
server/
  prisma/schema.prisma   Trainer, Client, ProgramDay, ProgramItem, Session, SetLog, LibraryExercise
  prisma/seed.ts         trainer-account + 3 klanten + hun programma's + bibliotheek
  src/routes/            auth, clients, program, dashboard, library, clientApp
  src/lib/schedule.ts    pool-rotatie + roeiopbouw-formules (client-app gebruikt dit)
web/
  src/ds/                Button/Badge/Card, 1:1 overgenomen uit project/_ds/_ds_bundle.js
  src/styles/tokens.css  kleur/typografie/spacing-tokens uit project/_ds
  src/pages/             Landing, TrainerLogin, TrainerApp, ClientLogin, ClientAppShell
  src/components/trainer/  ClientSwitcher, Opvolging, ProgramEditor
  src/components/client/   Home, Workout, Done
project/                 het originele ontwerp-exportbundel (referentie)
chats/                   de ontwerpgesprekken die tot dit ontwerp leidden
```

## Bekend aandachtspunt

`npm audit` meldt matige kwetsbaarheden in `react-router` (open-redirect CVE, niet van
toepassing zolang er geen niet-vertrouwde URL's in `<Link>`/`navigate` terechtkomen) en in
Vite's dev-only `esbuild`. Beide zijn onschadelijk voor lokale ontwikkeling; overweeg een
upgrade voor productiegebruik.
