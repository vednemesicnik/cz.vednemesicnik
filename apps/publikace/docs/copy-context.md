# Kontext pro copywriting

Tenhle text je jediná věc, kterou copywriter o aplikaci ví, aniž by se ho někdo ptal. Je **jen ke
čtení** — je to popis toho, co aplikace dělá (zatím podle návrhu, kód ještě nevznikl), a přepsat
ho znamená přepsat aplikaci, ne text.

Vede se v repozitáři jako `docs/copy-context.md` a copywriter ho dostává **celý v otevíracím tahu
každého vlákna**: jeho nástroje `ask_*` neotevírají soubory. Když si všimneš, že něco tady nesedí
s tím, co ti přišlo v otázce, **je to nález**: řekni to, neopravuj to.

## Co je to za aplikaci

Publikace je aplikace redakce studentského časopisu Vedneměsíčník na `publikace.vednemesicnik.cz`.
Provází jedno vydání od založení po podklady pro tisk:

- **Šéfredakce** (pár lidí, přihlášení přes Google) zakládá vydání, posílá redakci odkazy,
  zakládá skupiny obrazových děl, vidí, kde je který článek a dílo, a rozhoduje o odpovědích,
  kterým systém nerozuměl.
- **Redakce** se nepřihlašuje. Dostane od šéfredakce odkaz (obvykle do WhatsAppu) a jím založí
  článek. Otevírá ho většinou na telefonu ve vestavěném prohlížeči messengeru.
- **Poskytovatel děl** (autor článku, ilustrátor, fotograf) je ten, koho formulář uvádí jménem
  a e-mailem: dává souhlas s licencí odpovědí na e-mail. Díla za něj může nahrát i někdo jiný,
  kdo má odkaz na nahrání obrazových děl, takže věta na stránce nepředpokládá, že nahrává sám.
- **Korektoři** jsou pevná skupina lidí s vlastní skupinou Google. Do aplikace se nepřihlašují
  a nevidí ji. Od aplikace dostanou jen e-mail, když je článek předaný ke korektuře, a další,
  když šéfredakce předání zruší. Jejich adresu vyplňuje šéfredakce v Nastavení. Dokud ji
  nevyplní, předání projde, jen e-mail neodejde.

Psaní a korektura probíhají v dokumentu Google, mimo aplikaci. Kdo text dopíše (autor nebo
redaktor), **předá ho ke korektuře**. Návrh na to dává dokumentu položku _Publikace › Předat ke
korektuře_ a šéfredakci totéž v aplikaci, kde předání umí i zrušit. Ani jedno zatím neexistuje:
dnes autor **dá vědět šéfredakci** a menu dokumentu _✦ Publikace_ má jen položky korektorů
_Označit probíhající korekturu_ a _Označit finální verzi_ a dvě položky k metadatům. Text, který
autor čte dnes, proto žádnou položku k předání nejmenuje.

Souhlas s finální verzí textu i s užitím děl se dává **odpovědí přesně „Souhlasím“** na e-mail.
Jiná odpověď jde ke kontrole šéfredakci. Autor článku tím souhlasí s **redakční doložkou**
v e-mailu, tedy nejen s textem finální verze: i s jejím zveřejněním, s licencí pro časopis,
s jazykovými úpravami a zkrácením a s tvarem jména v podpisu.

**Komentáře a návrhy úprav** v dokumentu píše kdokoli, kdo ho má otevřený, nejčastěji při
korektuře, až je text dopsaný. Autorům o nich chodí e-mail nejvýš čtyřikrát denně, a jen když
v některém jejich článku přibylo něco nového. E-mail říká, _že_ v článku přibyly komentáře,
odpovědi nebo návrhy úprav, ne _co_ v nich je: u každého článku má odkaz do dokumentu. Komentáře
autorů článku do něj nejdou.

## Termíny: co se nesmí přejmenovat

| Termín                      | Význam                                                                                |
| --------------------------- | ------------------------------------------------------------------------------------- |
| **vydání**                  | Připravované číslo časopisu, `VDM_2026_5`. Ne „číslo“: to je na webu hotový výtisk.   |
| **článek**                  | Text s autory a dokumentem Google.                                                    |
| **skupina obrazových děl**  | Obrázky bez vlastního článku (obálka, ilustrace k více textům).                       |
| **obrazové dílo**, **dílo** | Jeden nahraný obrázek. V nadpisech „obrazová díla“, v běžné větě „dílo“.              |
| **poskytovatel**            | Koho formulář uvádí a kdo dává souhlas. **Autor díla** je jen jméno do podpisu.       |
| **souhlas**                 | Odpověď „Souhlasím“ na e-mail. Nikdy „schválení“ pro to, co dělá autor.               |
| **redakční doložka**        | Text v e-mailu s finální verzí, se kterým autor souhlasí. Viz níže.                   |
| **podklady pro tisk**       | Složka pro grafika se schválenými texty a díly.                                       |
| **odkaz**                   | Adresa, která umí jednu věc: založit článek, nebo nahrát díla.                        |
| **šéfredakce**              | Lidé s přístupem do aplikace. Ne „administrátor“, ne „admin“.                         |
| **správce**                 | Šéfredaktor, který smí měnit přístup. Ne „admin“.                                     |
| **přístup**                 | Kdo se smí přihlásit: jmenované účty a skupiny Google. Ne „oprávnění“.                |
| **připojit**, **připojení** | Trvalé spojení aplikace s účtem `publikace.app@`. Ne „přihlásit“: to dělá šéfredakce. |

**Co aplikace smí dělat s Diskem účtu `publikace.app@`** se neříká přístupem ani oprávněním, ale
činností: _povolit aplikaci pracovat se soubory na Disku_. _Povolení_ pak odkazuje jen na tuto
činnost. _Přístup_ zůstává jen pro to, kdo se smí přihlásit.

**Redakční doložka** má dva významy a oba se jmenují stejně:

- **Text v e-mailu**, který dostane každý autor článku s PDF finální verze. Autor jím potvrzuje,
  že se s verzí seznámil a souhlasí s jejím zveřejněním, že je autorem a nikdo jiný nemá k dílu
  práva, která by užití bránila, že spolku dává bezúplatnou nevýhradní licenci (tisk, web,
  archiv, sociální sítě), že souhlasí s jazykovými úpravami a zkrácením a s uvedením jména
  v daném tvaru. Je to licence a její znění zůstává slovo od slova jako ve skriptu; kolem ní se
  smí měnit jen převod do vykání.
- **Záznam souhlasu jednoho autora.** Každý autor má k článku svou doložku se stavem (_K
  odeslání_, _Čeká na odpověď_…). V Evidenci je list _Redakční doložky_ s řádkem za každého
  autora a rozbalený řádek článku v detailu vydání ukazuje doložky autorů po jednom.

## Stavy: přesná jména

Štítky, jak je aplikace ukazuje (zdroj pravdy je stránka `01 Stavy a souhlasy` v návrhu):

- Článek: _Píše se_, _Dopsáno_, _Korektura_, _K souhlasu_, _Ke kontrole_, _Schváleno_, _Upraveno
  po schválení_, _Chyba_. _Dopsáno_ znamená, že je článek předaný ke korektuře a žádný korektor
  zatím neoznačil, že na něm pracuje. _Korektura_ znamená, že korektura probíhá. _K souhlasu_
  znamená, že finální verze jde autorům a čeká se na „Souhlasím“ od každého z nich.
- Obrazové dílo: _Zpracovává se_, _U poskytovatele_, _Ke kontrole_, _Schváleno_, _Chyba_.
- Vydání: _Nedokončené_, _Aktivní_, _Uzavřené_.

V Evidenci (tabulka na Disku) mají stavy jiná jména (_Rozpracováno_, _Čeká na odpověď_,
_Souhlas udělen_…). Šéfredakce je zná z tabulky; aplikace je v textu nepoužívá, kromě míst, kde
výslovně mluví o tabulce. Výjimka: _Dopsáno_ se v Evidenci jmenuje stejně.

## Hlas

- **Aplikace vyká** a mluví neosobně, bez omluv. Nemá já ani osobnost.
- **E-maily a stránky z odkazu mluví za redakci** a smějí mít _my_ („Na ‹e-mail› jsme poslali
  žádost o souhlas.“). Hlášky aplikace _my_ nemají.
- **E-maily vykají, ale přátelsky.** Čtou je členové redakce, se kterými se známe, a zároveň
  mluví za časopis: tón je slušný, reprezentativní a trochu formální, ne úřední. Začínají „Dobrý
  den“ jako e-maily v návrhu: uvítání autorů, žádost o souhlas s díly, e-maily korektorům.
  Dnešní e-mail s redakční doložkou tyká a začíná „Ahoj“, stejně jako dnešní uvítání autorů.
  Vzorem není.
- **Dialog v dokumentu Google mluví hlasem aplikace.** Co se ukáže po kliknutí v menu
  _Publikace_, vrací aplikace, takže dialog vyká a nemá _my_. Čte ho autor nebo redaktor, který
  v aplikaci nic nenastaví: věta mu říká, co udělat sám, ne co má opravit šéfredakce.
- **Aplikace ví, že e-mail odešel, ne že došel.** Věta smí říct _odešel_, nikdy _korektoři
  dostali_ ani _vědí_. A když se e-mail vrátí jako nedoručitelný, neprokazuje to špatnou adresu:
  skupina Google může odmítat zprávy z `publikace@`, i když adresa platí.
- **Chybová věta začíná tím, co udělat**: _Zkraťte název na nejvýš 200 znaků._, _Vyberte obrázek
  do 15 MB — ples.tif má 22 MB._ Výjimka: když udělat nejde nic, věta řekne, co platí.
- **Nikdy nepojmenuje stroj.** Žádná tabulka, řádek, server, token, metadata. Výjimka:
  **Registr** a **Evidence** jsou dokumenty, které šéfredakce zná jménem a v nichž dohledává
  licence, takže se smějí jmenovat, i jako tabulky, když se o nich mluví jako o dokumentu. Popis
  vnitřního provozu (fronta, zápis, přepis) tuhle výjimku nemá. Skutečný ovládací prvek se
  jmenuje přesně, jak se jmenuje, i se zakázaným slovem: _Publikace › Nastavit metadata článku_
  je položka nabídky v dokumentu Google a každý dokument nese její vlastní kopii.
- **Aplikace nezná rod.** O člověku ví jen adresu a po přihlášení jméno z Googlu. Věta o něm nesmí
  rod ani pád jména odhadovat: _poslední přihlášení včera_, _účet přidán 10. 11. 2026_, ne
  _přihlásila se_, ne _Odebrat Jakuba?_
- **Čas dalšího běhu úlohy aplikace jen odhaduje.** Úlohy na pozadí spouští Google v intervalu,
  ale minutu si volí sám, takže věta smí slíbit jen přibližný čas. Úloha, která neběží, žádný
  další běh nemá.
- Kratší vyhrává, ale nikdy za cenu tvrzení, které není pravda.

## Formáty a typografie

- Datum v aplikaci `14. 11. 2026`, čas `9:12`. V e-mailech totéž. V aktuálním roce smí rok
  odpadnout: _zjištěno 14. 11. v 8:12_, _naposledy 10. 11._
- Před časem se píše „ve“ u hodin 2, 3, 4, 12, 13, 14 a 20–23, jinak „v“: _ve 2:15_, _ve 13:30_,
  _ve 21:47_, _v 9:12_, _v 18:04_. Platí v aplikaci i v e-mailech. Je to konvence Publikace, ne
  obecné pravidlo češtiny.
- Počet souhlasících autorů se píše _souhlas N z/ze M autora/autorů_. „Ze“ se píše při M = 2, 3,
  4, 6 a 7, jinak „z“, protože rozhoduje výslovnost čísla ve 2. pádě („ze dvou“, „z pěti“). Při
  M = 1 je tvar „autora“, při M = 2 až 10 „autorů“: _souhlas 0 z 1 autora_, _souhlas 1 ze 2
  autorů_, _souhlas 2 z 5 autorů_. N tvar ani předložku nemění a „souhlas“ zůstává v jednotném
  čísle. Platí pro tuto řádku a pro 1 až 10 autorů, ne jako obecné pravidlo skloňování.
- Časové okno se píše rozsahem: _9:00–10:00_.
- Pomlčka ve větě je em dash `—` s mezerami.
- Uvozovky české „…“.

## Co v otázce nikdy nebude

Žádná skutečná data. Jména jsou vymyšlená, odkazy a ID na Disku smyšlené. Repozitář je veřejný.
Adresy stojí na dvou doménách `.test`, které nikdo nezaregistruje a na které žádný e-mail nedojde:

- **`vednemesicnik.test`** pro redakci: šéfredaktory, účty a skupiny v Přístupu. Ve skutečnosti
  přihlášení pustí jen adresu `@vednemesicnik.cz`; ukázka na ni míří, ale nikoho skutečného
  nejmenuje.
- **`external.test`** pro všechny zvenku: autory, poskytovatele a adresu, kterou přihlášení
  odmítne.

Vlastní účty aplikace (`publikace.app@vednemesicnik.cz`, `publikace@vednemesicnik.cz`) jsou
skutečné a smějí se jmenovat, když je text na obrazovce jmenuje.

Když v otázce uvidíš něco, co vypadá jako skutečný záznam, **je to nález** — řekni to.

## Jak má vypadat odpověď

- **Dvě nebo tři varianty**, ne jedna. U každé, co získává a co obětuje.
- **Termín se smí napadnout, ale musí se pojmenovat** — a s důvodem.
- Když věta nemůže být pravdivá a krátká zároveň, **řekni to** a nech rozhodnout.
- Když otázka nenese kontext, který by odpověď rozhodl, **zeptej se** místo hádání.
