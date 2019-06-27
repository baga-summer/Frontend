# Installationsguide för Baga Aqua System Webbsida

### 2019-05-22

# Förord
Denna Installationsguide är för Baga Aqua Systems Webbsida. Du förväntas ha installerat Baga Aqua Systems API först. Arbetet är utfört av studenter på Blekinge Tekniska Högskola som en del i kursen PA1416 under vårenterminen 2019 åt Baga Water Technology AB. Denna guide är till för att underlätta vid installation av systemet. Du förväntas ha kunskaper om den egna miljön som installationen sker i.

# Innehållsförteckning
- Förord
- Innehållsförteckning
- Webbserver
- Skapa API-Nyckel
- Hämta programvaran
- Konfigurationsfiler
- Avslutningsvis

# Webbserver
För att visa hemsidan så behöver du en webbserver, hur du sätter upp denna och hur du
gör med domännamn och HTTPS är upp till dig. Den här guiden utgår ifrån att du placerar
filerna i din webbservers webbroot-katalog.

# Skapa API-Nyckel
Instruktioner för att få Google maps API-nyckel:
1. Gå in på https://cloud.google.com/maps-platform/
1. Klicka “Get started”
1. Logga in med ditt Google-konto
1. Klicka i rutorna “Maps” och “Places”
1. Klicka “Continue”
1. Välj  “Create a new project” och döp det till något
1. Acceptera “Terms of Service” genom att klicka i “Yes“, sedan klicka Next”
1. Klicka “Create billing account”
1. Välj land och klicka sedan i att du accepterar “Terms of Service”
1. Klicka “Agree and continue”
1. Fyll i uppgifterna som behövs och klicka sedan “Start my free trial”
1. Klicka “Next” när rutan för “Enable your APIs” ploppar upp
1. Du ser din API-nyckel i rutan. Spara undan den tills vidare, den kommer att behövas snart.

# Hämta programvaran
Du kan antingen hämta den via git med kommandot
```
git clone https://github.com/vattenbagarna/Frontend.git
```
eller ladda ner den som en zip-fil från [https://github.com/vattenbagarna/Frontend](https://github.com/vattenbagarna/Frontend).
Om du har laddat ner zip-filen så måste du packa upp den till en mapp.

Placera samtliga filer i din webbroot.

# Konfigurationsfiler
Byt namn på filen `configVariablesExample.js` i mappen `js` till `configVariables.js` och
öppna den för redigering. Filen går att öppna med de flesta vanliga kod-redigeringsprogram så som Atom och VSCode men även Notepad++
och notepad.exe går bra.

byt ut värdet av `apiURL` till addressen för Baga Aqua System API (backend-repot) som du förväntas
ha satt upp.

Byt namn på filen `getKeyExample.js` i mappen `js/map/` till `getKey.js` och öppna den för redigering. Ändra "YOURKEYHERE" till din API-nyckel.

# Avslutningsvis
Du förväntas nu ha installerat båda delarna av systemet och är redo att börja använda det.
