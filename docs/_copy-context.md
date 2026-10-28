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

Pro čtenáře je hlavní **tištěné číslo**, studenti ho čtou nejraději. Vychází **zpravidla
čtyřikrát ročně** — redakci dělají studenti, takže někdy vyjdou jen tři, jindy i pět. **Web ho
doplňuje**: nese tytéž články a občas i další, které v čísle nejsou (rozhodnuto 3. 10. 2026).
**Archiv** je proto záznam toho, co se vytisklo, ne další čtení navíc. **Podcast byl vždycky vedlejší a dnes skoro nežije.** Text, který staví na poslechu, slibuje
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
- **název platformy** — jméno odkazu epizody, jak ho čtenář vidí na webu (`Spotify`,
  `YouTube`). U známé adresy ho aplikace doplní sama, jinak ho redaktor napíše. Nese ho pole
  i věty o neúplných odkazech (`2 odkazy nemají název platformy.`); ne *název odkazu* ani
  *text odkazu* (rozhodnuto 26.–27. 10. 2026).
- **číslo** — **tištěné** číslo časopisu v PDF, v sekci **Archiv**. Obsahem jsou tytéž články
  jako na webu, aplikace je ale s číslem nepropojuje: není to skupina článků na webu a články
  k číslům nepatří. V aplikaci se dnes pro totéž píše i **vydání** (*Datum
  vydání*, *Správa vydání časopisu*) — to je nesjednocené, ne dva různé pojmy. Nový návrh
  *vydání* u článku ani epizody nepoužívá: jejich datum je **datum publikace**.
  U epizody je *číslo* její číselný údaj v podcastu (popisek pole `Číslo`, v nadpisu `#13`), ne
  tištěné číslo; rozliší je obrazovka a tvar hodnoty (`#13` proti `3/2026`). Jiné slovo pro něj
  nehledej (rozhodnuto 26. 10. 2026).
- **Archiv** (sekce) vs. **archivováno** (stav) — dvě různé věci. *Archiv* jsou tištěná čísla;
  *archivovaný* je obsah stažený z oběhu. Věta, která je smíchá, je nepravda.
  Velké *A* jen jako jméno v menu a v nadpisu; v běžném textu malé: `tištěná čísla jsou
  v archivu` (rozhodnuto 2. 10. 2026).
- **autor** vs. **uživatel** — *uživatel* je účet, kterým se přihlašuje do administrace; *autor*
  je jméno, pod kterým se obsah publikuje. Každý uživatel má autora, ale role mají zvlášť.
- **redakce** — lidé, kteří časopis dělají (stránka *Redakce* na webu).
- **spolek** — Vedneměsíčník, z. s., právnická osoba za časopisem. Spolek **nejsou studenti**:
  jsou to lidé, kteří studenty jsou nebo byli a studenty podporují. Časopis tvoří **nezávislá
  studentská redakce**, do obsahu spolek redakčně nezasahuje a předem ho nekontroluje.

Když ti některý z termínů přijde špatný, **řekni to a pojmenuj ho**. Nevyměňuj ho potichu —
přejmenování termínu je změna aplikace na všech místech naráz.

## Stavy obsahu a akce

Každý obsah (článek, rubrika, štítek, podcast, epizoda, číslo) je v právě jednom stavu. Štítky
stavů jsou `Koncept` · `Publikováno` · `Archivováno`.

Akce, jak je dnes nese administrace: `Odeslat ke schválení` a `Vzít zpět do konceptu` (autor) ·
`Schválit` · `Vrátit k úpravám` (Koordinátor) · `Publikovat…` · `Stáhnout z publikace` (vrátí
do konceptu) · `Archivovat` · `Obnovit jako koncept` (z archivu zpět do konceptu, jen
Koordinátor) · `Smazat` (koncept; archivovaný jen Koordinátor). Odeslaný obsah má štítek
`Čeká na schválení`, schválený `Schváleno`.

U článku a epizody otevřou `Publikovat…` a `Schválit a publikovat…` dialog s datem publikace
(`Dnes` · `Jiný den`, u dříve publikovaného navíc `Původní datum`); zpětné datum se volí tam,
ne zvláštním tlačítkem. Publikovaný článek a epizoda mají v „⋯“ `Změnit datum publikace…`.
Tlačítko `Zveřejnit` aplikace už nemá: čin i stav se jmenují *publikovat* / `Publikováno`.

## Role

Dvě nezávislé osy. **Autorská role** říká, co člověk smí s obsahem; **uživatelská role**, co
smí s účty.

- Autor: `Přispěvatel` (píše vlastní koncepty a odesílá je ke schválení) · `Tvůrce` (totéž,
  vidí i cizí koncepty a vlastní publikovaný obsah stahuje a archivuje) · `Koordinátor`
  (všechen obsah: schvaluje, publikuje, stahuje, archivuje i obnovuje).
- Uživatel: `Člen` (jen vlastní účet) · `Administrátor` (účty kromě vlastníka) · `Vlastník`
  (jeden jediný).

## Co aplikace ví a co neví

Chyby, kterých se tenhle postup bojí, jsou **plynulé věty, které tvrdí něco, co aplikace
nedělá**. Poznají se jen podle modelu:

- **Schvaluje a zveřejňuje jen Koordinátor**, u všeho obsahu. Přispěvatel ani Tvůrce
  nezveřejní nic, ani vlastní. Koordinátor smí zveřejnit i neodeslaný koncept: zveřejnění je
  schválení. Věta, která Tvůrci slibuje, že zveřejní sám, nebo že schválit může kdokoli
  z redakce, je nepravda.
- **Odeslat ke schválení existuje u všeho obsahu** — článku, rubriky, štítku, podcastu,
  epizody i čísla. Autor hotový koncept odešle, a dokud ho nevezme zpět, needituje ho ani
  nesmaže; Koordinátor ho smí opravit a schválení tím nezmizí. Na přehledu čeká jen odeslané
  a neschválené.
- **Publikovaný obsah se nemaže.** Smazat jde koncept, a archivovaný obsah jen Koordinátor.
  Publikovaný se nejdřív stáhne nebo archivuje.
- **Publikovaný obsah nejde upravit na místě** — nejdřív se stáhne z publikace do konceptu.
- **Datum publikace nastaví jen Koordinátor, a nikdy do budoucnosti.** Nic se neplánuje: publikovaný
  článek je na webu hned. Věta, která slibuje „naplánované zveřejnění“, je nepravda.
- **Na webu vidí koncept a archivovaný článek jen ten, kdo ho vidí v administraci** — jako
  náhled, dnes nijak odlišený od publikovaného. Přispěvatel jen vlastní, Tvůrce jakýkoli koncept
  a vlastní archivovaný, Koordinátor všechno. Nepřihlášený čtenář vidí jen publikované.
- **Číslo nenese články.** Viz termíny.

## Nový návrh administrace (rozhodnuto, postaveno)

Administrace je překreslená podle nového návrhu. Kde se s ním části výše rozcházejí, platí
tohle (rozhodnuto 27.–28. 9. 2026):

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
- **Přispěvatel má ve filtru `Stav` místo hodnoty `Ke schválení` hodnotu `Odeslané`**: jsou v ní
  jeho čekající i schválené články. Nic neschvaluje, jen čeká.
- **Editor článku se ukládá sám** a drží **zámek**: článek upravuje vždy jen jedna záložka jednoho
  člověka, Koordinátor smí úpravu převzít. Posledních pár vteřin psaní se při převzetí může
  ztratit; věta, že se „nic neztratí“, je nepravda.
- **Publikovaná rubrika a štítek se neupravují** stejně jako článek: nejdřív se stáhnou.
- **Číslo** (tištěné, v archivu) nemá datum vydání. Tvoří ho rok, pořadí v roce, název bez roku
  (`zima` → zobrazeně `zima 2026`) a vzácně doplněk: samostatně vytištěná část, která se do
  čísla nevešla (ne dotisk).

Týká se to i veřejného webu (rozhodnuto, zatím nepostaveno):

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
- **Passkey může být v zařízení, ve vlastním telefonu nebo na bezpečnostním klíči** (rozhodnuto
  11. 10. 2026). Telefon se k počítači připojí přes QR kód, klíč se zapojí do USB nebo přiloží
  přes NFC. Vybírá se v okně prohlížeče, ne na stránce; prohlížeč nabízí nejdřív tento počítač.
  Na sdíleném počítači je bezpečný jen passkey ve vlastním telefonu nebo na vlastním klíči. Věta,
  která passkey váže na otisk prstu nebo obličej tohoto zařízení, je neúplná.
- **Heslo je nouzová cesta a v provozu je vypnuté.** Věta, která heslo nabízí jako běžnou cestu
  nebo jako záchranu při ztrátě telefonu, je nepravda.
- **Nouzový režim zapíná jeden přepínač** při výpadku Googlu, a to jen ten, kdo spravuje
  provoz. Otevře heslo (jen Vlastník a Administrátor, kteří si ho nastavili) a **nouzový
  odkaz** (rozhodnuto 12. 10. 2026). Nouzový odkaz vydá Vlastník nebo Administrátor pro účet,
  který smí upravit, nikdy pro sebe ani pro Vlastníka. Předá ho telefonem nebo v chatu, nikdy
  e‑mailem, až po ověření totožnosti osobně nebo při hlasovém hovoru. Platí 15 minut a jen
  jednou, nový nahradí předchozí; po vypnutí režimu neplatí žádný. Samo otevření nepřihlásí
  nic, přihlásí až potvrzení na stránce. *Odkaz od:* jmenuje toho, kdo odkaz vydal, ne
  *vydání* (to slovo nese tištěné číslo).
- **Dvoufázové ověření je nepovinné** a ptá se jen po hesle. Google, passkey ani odkaz ho
  nechtějí. Aplikace pro kódy je **ověřovací aplikace**, ne *autentikační*.
- **Přihlášení drží prohlížeč, ne zařízení.** Jiný prohlížeč téhož počítače, prohlížeč uvnitř
  poštovní aplikace i anonymní okno jsou jiné přihlášení. Věta „na tomto zařízení“ tam, kde jde
  o prohlížeč, je nepravda.
- Změna hesla, dvoufázového ověření nebo passkey chce přihlášení nebo ověření z posledních
  10 minut, jinak se člověk musí znovu ověřit. Ověření (passkey, Google nebo odkaz v e‑mailu)
  nikoho neodhlásí a platí pro prohlížeč, ve kterém proběhlo.
- **Uživatelská role**, ne *role účtu*.
- **Nový účet zakládá Administrátor pozvánkou** (rozhodnuto 28. 9. 2026). Heslo za nikoho
  nevymýšlí. Pozvánka je obyčejný odkaz v e‑mailu se jménem toho, kdo zve, a vede do
  Nastavení. Prošlou pozvánku nikdo znovu neposílá: nový člověk si na stránce přihlášení
  pošle odkaz sám, nebo se přihlásí přes Google. Tlačítko „poslat znovu“ neexistuje.
- **Tentýž přihlašovací e‑mail** odchází při přihlášení i při ověření totožnosti
  v Nastavení. Jeho text proto musí platit pro obojí.

## Dary a formuláře na webu (rozhodnuto 28.–29. 9. 2026)

- **Dar se posílá převodem.** Platební brána není, web nic neplatí: dárce zaplatí podle QR kódu
  nebo platebních údajů. **Transparentní účet nebude** a web nikdy neukáže, kolik se vybralo.
- **Dary a dotace platí tisk i web**, akce jen možná. Věta, která dar váže jen k tisku („každý
  dar pomůže vydat další číslo“), nebo slibuje akce jako jistotu, je nepravda.
- **Potvrzení o daru** vystaví spolek na žádost. Údaje ze žádosti se drží jen do vystavení
  a odeslání potvrzení; kdo potvrzení ztratí, požádá znovu.
- **Web nemá stránku o zpracování osobních údajů.** Každý formulář nese vlastní odstavec nad
  tlačítkem, který musí obstát sám, a žádné zaškrtávací pole. Odkaz typu *Jak s údaji
  zacházíme* nemá kam vést. Dotazy k údajům jdou na jednu společnou adresu
  `udaje@vednemesicnik.cz` (rozhodnuto 2. 10. 2026).
- **Přihláška do spolku**: členem se člověk stane až **schválením vedením spolku**, ne odesláním
  ani e‑mailem. Neschválená přihláška se po 12 měsících od podání smaže, schválená zůstává.
- **Přihláška do redakce**: nic nesmí slibovat, že se někdo ozve, ani lhůtu. O přijetí
  rozhoduje šéfredakce.
- **Obě přihlášky jsou skryté.** Web na ně nikde neodkazuje a vyhledávače je neindexují. Do
  redakce vede QR kód z letáku, do spolku odkaz od vedení. Kdo by chtěl do spolku, napíše na
  `clenstvi@vednemesicnik.cz` (rozhodnuto 2. 10. 2026). Věta, která na webu zve
  k vyplnění přihlášky, je nepravda.

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

Výjimkou je stránka **O spolku**: text o spolku je ve **třetí osobě** (*Spolek Vedneměsíčník
vydává…*), za *my* mluví jen výzvy pod ním (`Napište nám`, `Podpořte nás`). Text napsala redakce
a prošel beze změny (rozhodnuto 3. 10. 2026). Fakta v něm jsou stálá: České Budějovice, střední
školy a gymnázia (rozlišené schválně), akce spolku. Nezávislost redakce stránka nezmiňuje.

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
ukázka účtu stojí na této doméně, s vymyšleným jménem. Skutečné jsou jen veřejné kontakty spolku,
které web ukazuje nebo ukazovat bude: `podpora@`, `redakce@`, `dary@`, `udaje@` a `clenstvi@vednemesicnik.cz`. Jmenují
schránky podle tématu, česky a bez diakritiky. Když uvidíš něco jiného, co vypadá jako
skutečný záznam, **je to nález** — řekni to.

## Jak má vypadat odpověď

- **Dvě nebo tři varianty**, ne jedna. U každé, co získává a co obětuje.
- **Termín se smí napadnout, ale musí se pojmenovat** — a s důvodem.
- Když věta nemůže být pravdivá a krátká zároveň, **řekni to** a nech rozhodnout.
- Když otázka nenese kontext, který by odpověď rozhodl, **zeptej se** místo hádání.
