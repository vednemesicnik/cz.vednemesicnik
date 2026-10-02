# Kontext pro copywriting

Tenhle text je jediná věc, kterou copywriter o aplikaci ví, aniž by se ho někdo ptal. Je **jen ke
čtení** — popisuje, co kód doopravdy dělá, a přepsat ho znamená přepsat aplikaci, ne text.

Vede se v repozitáři jako `docs/_copy-context.md` a copywriter ho dostává **celý v otevíracím tahu
každého vlákna**: jeho nářadí jsou nástroje `ask_*` a žádný z nich neotevírá soubor. Co drží ve
vlákně, je otisk téhle chvíle — a když něco tady nesedí s tím, co přišlo v otázce, **je to
nález**: řekni to, neopravuj to.

## Co je to za aplikaci

Web a redakční systém studentského časopisu **Vedneměsíčník**, který vydává spolek
Vedneměsíčník, z. s. Na webu jsou články, podcasty s epizodami, archiv tištěných čísel v PDF,
stránka redakce, spolku, podpory a dotací. V administraci redakce obsah píše, schvaluje,
zveřejňuje a archivuje.

Jádro časopisu jsou **články na webu**. Tištěné číslo vychází **zpravidla čtyřikrát ročně** —
redakci dělají studenti, takže někdy vyjdou jen tři, jindy i pět — a nese **tytéž
články**, které už vyšly na webu. **Archiv** je proto záznam toho, co se vytisklo, ne další čtení
navíc. **Podcast byl vždycky vedlejší a dnes skoro nežije.** Text, který staví na poslechu, slibuje
v čísle obsah, který na webu není, nebo slibuje pravidelnost („každý měsíc“), je nepravda.

**Jméno** vzniklo jako hříčka na název kavárny, která už neexistuje. Na webu se původ jména
nevysvětluje a hesla na něm nestaví. Na tištěném záhlaví stálo pod jménem heslo **Studentské
nekritické noviny**. Je to kus historie časopisu, ne nápad z webu, a na úvodu webu pod jménem
zůstává.

Texty nečte jeden druh člověka:

| Kde                 | Kdo to čte                          | Jaký je to text                                   |
| ------------------- | ----------------------------------- | ------------------------------------------------- |
| veřejný web         | čtenář — studenti, rodiče, veřejnost | časopis — smí mít hlas redakce                    |
| administrace        | redakce — autoři, koordinátoři       | nástroj — stručný a věcný                         |
| e‑mail a formulář   | kdo se přihlašuje nebo nás podporuje | zpráva — lidská, krátká                           |

Věta, která je správně v administraci, bývá špatně na webu a naopak. Otázka vždycky říká, o
který případ jde; když to neříká, je to chyba otázky — zeptej se.

## Termíny: co se nesmí přejmenovat

Tohle jsou **jména věcí**, které mají v aplikaci svou obrazovku nebo svůj sloupec. Synonymum je
rozpojí.

- **článek** — příspěvek na webu. Ne „příspěvek“, ne „post“.
- **rubrika** — tematické zařazení článku. Článek jich může mít **víc**.
- **štítek** — volnější označení článku; článek jich má obvykle víc.
- **podcast** / **epizoda** — podcast je pořad, epizoda jeden díl. V rozhraní jen *podcast*,
  ne *pořad*.
- **číslo** — **tištěné** číslo časopisu v PDF, v sekci **Archiv**. Obsahem jsou tytéž články
  jako na webu, aplikace je ale s číslem nepropojuje: není to skupina článků na webu a články
  k číslům nepatří. V aplikaci se dnes pro totéž píše i **vydání** (*Datum
  vydání*, *Správa vydání časopisu*) — to je nesjednocené, ne dva různé pojmy. Nový návrh
  *vydání* u článku ani epizody nepoužívá: jejich datum je **datum publikace**.
- **Archiv** (sekce) vs. **archivováno** (stav) — dvě různé věci. *Archiv* jsou tištěná čísla;
  *archivovaný* je obsah stažený z oběhu. Věta, která je smíchá, je nepravda.
- **autor** vs. **uživatel** — *uživatel* je účet, kterým se přihlašuje do administrace; *autor*
  je jméno, pod kterým se obsah publikuje. Každý uživatel má autora, ale role mají zvlášť.
- **redakce** — lidé, kteří časopis dělají (stránka *Redakce* na webu).
- **spolek** — Vedneměsíčník, z. s., právnická osoba za časopisem.

Když ti některý z termínů přijde špatný, **řekni to a pojmenuj ho**. Nevyměňuj ho potichu —
přejmenování termínu je změna aplikace na všech místech naráz.

## Stavy obsahu a akce

Každý obsah (článek, rubrika, štítek, podcast, epizoda, číslo) je v právě jednom stavu. Štítky
stavů jsou `Koncept` · `Publikováno` · `Archivováno`.

Akce, jak je dnes nese administrace: `Schválit` · `Zveřejnit` (a `Zveřejnit zpětně` s dřívějším
datem) · `Stáhnout z publikace` (vrátí do konceptu) · `Archivovat` · `Obnovit` (z archivu zpět
do konceptu, jen Koordinátor) · `Smazat` (koncept; archivovaný jen Koordinátor).

Pozor na dvojici **Zveřejnit / Publikováno**: tlačítko a stav dnes používají jiné slovo pro
tentýž čin. Je to známá nesrovnalost, ne dva různé kroky.

## Role

Dvě nezávislé osy. **Autorská role** říká, co člověk smí s obsahem; **uživatelská role**, co
smí s účty.

- Autor: `Přispěvatel` (jen vlastní koncepty) · `Tvůrce` (vlastní obsah, vidí cizí koncepty) ·
  `Koordinátor` (všechno, schvaluje).
- Uživatel: `Člen` (jen vlastní účet) · `Administrátor` (účty kromě vlastníka) · `Vlastník`
  (jeden jediný).

## Co aplikace ví a co neví

Chyby, kterých se tenhle postup bojí, jsou **plynulé věty, které tvrdí něco, co aplikace
nedělá**. Poznají se jen podle modelu:

- **Schvaluje jen Koordinátor.** Obsah autora s nižší rolí — Přispěvatele i Tvůrce — jde
  zveřejnit až po schválení Koordinátorem. Věta, která Tvůrci slibuje, že zveřejní sám, nebo
  že schválit může kdokoli z redakce, je nepravda.
- **Krok „odeslat ke schválení“ zatím neexistuje.** Čekající obsah je dnes každý koncept autora
  s nižší rolí. Věta, která mluví o „odeslaném“ konceptu, popisuje budoucí aplikaci.
- **Publikovaný obsah se nemaže.** Smazat jde koncept, a archivovaný obsah jen Koordinátor.
  Publikovaný se nejdřív stáhne nebo archivuje.
- **Publikovaný obsah nejde upravit na místě** — nejdřív se stáhne z publikace do konceptu.
- **Datum vydání nastaví jen Koordinátor, a nikdy do budoucnosti.** Nic se neplánuje: publikovaný
  článek je na webu hned. Věta, která slibuje „naplánované zveřejnění“, je nepravda.
- **Na webu vidí koncept a archivovaný článek jen ten, kdo ho vidí v administraci** — jako
  náhled, dnes nijak odlišený od publikovaného. Přispěvatel jen vlastní, Tvůrce jakýkoli koncept
  a vlastní archivovaný, Koordinátor všechno. Nepřihlášený čtenář vidí jen publikované.
- **Číslo nenese články.** Viz termíny.

## Nový návrh administrace (rozhodnuto, zatím nepostaveno)

Administrace se překresluje. Otázka vždycky řekne, jestli jde o texty dnešní aplikace, nebo
o obrazovku z nového návrhu. Pro nový návrh platí místo částí výše tohle (rozhodnuto 27.–28. 9. 2026):

- **Odeslat ke schválení existuje.** Autor hotový koncept odešle. Štítky jsou pak `Koncept` ·
  `Čeká na schválení` · `Schváleno` · `Publikováno` · `Archivováno`. V datech zůstávají tři stavy,
  čekání a schválení jsou příznaky konceptu; v rozhraní se ale ukazují jako štítky.
- **Schvaluje i publikuje jen Koordinátor, a jsou to dva kroky.** U čekajícího textu má
  `Schválit` (text zůstane mimo web) a `Schválit a publikovat…`; u schváleného pak `Publikovat…`.
  Schválit zvlášť existuje kvůli **pořadí na webu**: web řadí podle data publikace, Koordinátor
  texty schválí, jak přicházejí, a publikuje je pohromadě v pořadí, v jakém mají stát.
- **Tvůrce ani Přispěvatel neschvalují ani nepublikují**, ani vlastní text. Jejich cesta končí
  odesláním ke schválení. Věta, která Tvůrci slibuje, že publikuje sám, je v novém návrhu nepravda.
- **`Vzít zpět do konceptu`** (autor) a **`Vrátit k úpravám`** (Koordinátor) vrátí text do
  konceptu a smažou schválení. Archivovaný obsah vrací **`Obnovit jako koncept`**.
- **`Stáhnout z publikace`** vrátí článek jako koncept neodeslaný a neschválený. Koordinátor ho
  smí publikovat rovnou, bez nového schválení; věta „vrátí se až po novém schválení“ je nepravda.
- **Tlačítko je `Publikovat`, ne `Zveřejnit`** — sjednocuje se se stavem `Publikováno`.
- **Hromadné publikování má pořadí**, které jde před potvrzením změnit; jak ho dialog ukazuje
  shora dolů, tak budou texty stát na webu.
- **Datum publikace**, ne *datum vydání* (*vydání* je tištěné číslo). Umí i čas (jen Koordinátor,
  nikdy do budoucnosti) — kvůli zařazení zapomenutého článku mezi dva vydané.
- **Článek může mít víc autorů** a každý z nich ho má za vlastní: upraví ho, odešle i vezme zpět.
  Věta s jedním autorem v jednotném čísle (*autor článek neodeslal*) je pro spoluautorství
  nepravda.
- **Přispěvatel má místo fronty `Ke schválení` pilulku `Odeslané`**: jsou v ní jeho čekající
  i schválené články. Nic neschvaluje, jen čeká.
- **Editor článku se ukládá sám** a drží **zámek**: článek upravuje vždy jen jedna záložka jednoho
  člověka, Koordinátor smí úpravu převzít. Posledních pár vteřin psaní se při převzetí může
  ztratit; věta, že se „nic neztratí“, je nepravda.
- **Publikovaná rubrika a štítek se neupravují** stejně jako článek: nejdřív se stáhnou.
- **Číslo** (tištěné, v Archivu) nemá datum vydání. Tvoří ho rok, pořadí v roce, název bez roku
  (`zima` → zobrazeně `zima 2026`) a vzácně doplněk: samostatně vytištěná část, která se do
  čísla nevešla (ne dotisk).

Týká se to i veřejného webu:

- **Náhled konceptu na webu zůstává, ale je vidět, že je to koncept.** Vidí ho jen ten, kdo daný
  obsah vidí v administraci: Přispěvatel jen vlastní koncepty, Tvůrce a Koordinátor jakékoli. Pro
  ostatní je cizí koncept, jako pro čtenáře, stránka, která neexistuje.
- **Přejmenovaný publikovaný obsah se přesměruje** ze staré adresy na novou. Věta na chybové
  stránce, že se obsah „možná přejmenoval“, je proto nepravda.

## Přihlášení do administrace

- **Přihlásit se jde jen adresou `@vednemesicnik.cz`.** Doménu vlastní spolek, ne škola: je to
  redakční účet Google, ne „školní“.
- **Hlavní cesty jsou Google, passkey a odkaz v e‑mailu.** Odkaz platí 15 minut a jen jednou,
  nový nahradí předchozí. Samo otevření odkazu nepřihlásí nic, přihlásí až potvrzení na stránce.
- **Heslo je nouzová cesta a v provozu je vypnuté.** Věta, která heslo nabízí jako běžnou cestu
  nebo jako záchranu při ztrátě telefonu, je nepravda.
- **Dvoufázové ověření je nepovinné** a ptá se jen po hesle. Google, passkey ani odkaz ho
  nechtějí. Aplikace pro kódy je **ověřovací aplikace**, ne *autentikační*.
- **Přihlášení drží prohlížeč, ne zařízení.** Jiný prohlížeč téhož počítače, prohlížeč uvnitř
  poštovní aplikace i anonymní okno jsou jiné přihlášení. Věta „na tomto zařízení“ tam, kde jde
  o prohlížeč, je nepravda.
- Změna hesla, dvoufázového ověření nebo passkey chce přihlášení z posledních 10 minut, jinak
  se člověk musí znovu ověřit.
- **Uživatelská role**, ne *role účtu*.

## Dary a formuláře na webu (rozhodnuto 28.–29. 9. 2026)

- **Dar se posílá převodem.** Platební brána není, web nic neplatí: dárce zaplatí podle QR kódu
  nebo platebních údajů. **Transparentní účet nebude** a web nikdy neukáže, kolik se vybralo.
- **Dary a dotace platí tisk i web**, akce jen možná. Věta, která dar váže jen k tisku („každý
  dar pomůže vydat další číslo“), nebo slibuje akce jako jistotu, je nepravda.
- **Potvrzení o daru** vystaví spolek na žádost. Údaje ze žádosti se drží jen do vystavení
  a odeslání potvrzení; kdo potvrzení ztratí, požádá znovu.
- **Web nemá stránku o zpracování osobních údajů.** Každý formulář nese vlastní odstavec nad
  tlačítkem, který musí obstát sám, a žádné zaškrtávací pole. Odkaz typu *Jak s údaji
  zacházíme* nemá kam vést. Pro dotazy k údajům bude jedna společná adresa, zatím nevybraná.
- **Přihláška do spolku**: členem se člověk stane až **schválením vedením spolku**, ne odesláním
  ani e‑mailem. Neschválená přihláška se po 12 měsících od podání smaže, schválená zůstává.
- **Přihláška do redakce**: nic nesmí slibovat, že se někdo ozve, ani lhůtu. O přijetí
  rozhoduje šéfredakce.

## Hlas

**Administrace** mluví neosobně a vyká: `Zadejte šestimístný kód z ověřovací aplikace`.
Nemá já ani my, neomlouvá se. Chybová věta říká, co udělat; důvod patří za pomlčku.

- **Jména dosazuje aplikace jen v 1. pádě a bez rodové shody** — skloňovat je neumí a rod
  člověka nezná. Ne *od Anny Dvořákové* ani *úpravu převzala*, ale `Autoři: Anna Dvořáková`
  a `Úpravu přebírá Marie Horáková`. Jméno je jeden řetězec, křestní zvlášť aplikace nezná:
  ne *Jakub bude…*, ale věta bez jména nebo `Jakub Novák` celé.
- **Názvy rolí velkým písmenem i ve větě**: `Schválit může Koordinátor.` Slovo *autor* je malým,
  autor článku není role.
- **Slova z návrhu do rozhraní nepatří**: *dlaždice*, *fronta*, *krok 2 ze 3*.

**Veřejný web** má hlas redakce: mluví za *my* a čtenáři **vyká** (`Jsme tu pro vás`,
`Máte nějaký nápad nebo nám chcete něco sdělit?`). Vyká **všude**, bez výjimky (rozhodnuto
28. 9. 2026). Dnešní heslo úvodu `Čti, poslouchej a objevuj` je jediné tykání a odchází: úvod
nového návrhu nese jen jméno a pod ním `Studentské nekritické noviny`.

Web **nesmí znít jako text od AI**. Prozrazuje to věta ve dvou půlkách spojená pomlčkou,
výčet obsahu jako popis produktu, obecná sebevědomá hesla, která by pasovala na jakýkoli časopis,
a slova jako *najdete tu*. Lepší je obyčejná čeština s trochou nadhledu, jak by psal člověk
z redakce.

V obou:

- **Nikdy nepojmenuje stroj.** Žádný server, požadavek, databáze, validace, pole.
- **Kratší vyhrává**, ale nikdy za cenu tvrzení, které není pravda.

## Formáty a typografie

- Datum na webu `21. července 2026`. Seznamy v administraci ho dnes ukazují jako `2026-07-21`;
  nový návrh přechází na `21. 7. 2026`, **vždy s rokem**, i na mobilu. Čas uložení `uloženo dnes
  v 14:02`, starší `uloženo 25. 9. 2026 v 14:02`. Do formulářů webu se datum píše den, měsíc, rok
  s tečkami; projde `14. 5. 1990` i `14.05.1990`, takže příklad se píše čtenářsky.
- Pomlčka ve větě je `—` s mezerami, ne spojovník. Uvozovky české „…“.
- Měna `Kč` za částkou s mezerou: `500 Kč`.

## Co v otázce nikdy nebude

Žádná skutečná data. Jména, e‑maily a tituly článků v příkladech jsou vymyšlené, e‑maily končí na
`priklad.cz`. Výjimka jsou účty administrace: pozvat jde jen adresu `@vednemesicnik.cz`, takže
ukázka účtu stojí na této doméně, s vymyšleným jménem. Když uvidíš něco, co vypadá jako skutečný záznam, **je to nález** — řekni to.

## Jak má vypadat odpověď

- **Dvě nebo tři varianty**, ne jedna. U každé, co získává a co obětuje.
- **Termín se smí napadnout, ale musí se pojmenovat** — a s důvodem.
- Když věta nemůže být pravdivá a krátká zároveň, **řekni to** a nech rozhodnout.
- Když otázka nenese kontext, který by odpověď rozhodl, **zeptej se** místo hádání.
