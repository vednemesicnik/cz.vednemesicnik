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
- **Poskytovatel děl** (autor článku, ilustrátor, fotograf) dostane odkaz na nahrání obrazových
  děl, nahraje je a pak souhlasí s licencí odpovědí na e-mail.

Psaní a korektura probíhají v dokumentu Google, mimo aplikaci. Souhlas s finální verzí textu i
s užitím děl se dává **odpovědí přesně „Souhlasím“** na e-mail. Jiná odpověď jde ke kontrole
šéfredakci.

## Termíny: co se nesmí přejmenovat

| Termín                      | Význam                                                                              |
| --------------------------- | ----------------------------------------------------------------------------------- |
| **vydání**                  | Připravované číslo časopisu, `VDM_2026_5`. Ne „číslo“: to je na webu hotový výtisk. |
| **článek**                  | Text s autory a dokumentem Google.                                                  |
| **skupina obrazových děl**  | Obrázky bez vlastního článku (obálka, ilustrace k více textům).                     |
| **obrazové dílo**, **dílo** | Jeden nahraný obrázek. V nadpisech „obrazová díla“, v běžné větě „dílo“.            |
| **poskytovatel**            | Kdo dílo nahrál a dává souhlas. **Autor díla** je jen jméno do podpisu.             |
| **souhlas**                 | Odpověď „Souhlasím“ na e-mail. Nikdy „schválení“ pro to, co dělá autor.             |
| **podklady pro tisk**       | Složka pro grafika se schválenými texty a díly.                                     |
| **odkaz**                   | Adresa, která umí jednu věc: založit článek, nebo nahrát díla.                      |
| **šéfredakce**              | Lidé s přístupem do aplikace. Ne „administrátor“, ne „admin“.                       |
| **správce**                 | Šéfredaktor, který smí měnit přístup. Ne „admin“.                                   |
| **přístup**                 | Kdo se smí přihlásit: jmenované účty a skupiny Google. Ne „oprávnění“.              |

## Stavy: přesná jména

Štítky, jak je aplikace ukazuje (zdroj pravdy je stránka `01 Stavy a souhlasy` v návrhu):

- Článek: _Píše se_, _Korektura_, _U autorů_, _Ke kontrole_, _Schváleno_, _Upraveno po schválení_, _Chyba_.
- Obrazové dílo: _Zpracovává se_, _U poskytovatele_, _Ke kontrole_, _Schváleno_, _Chyba_.
- Vydání: _Aktivní_, _Uzavřené_.

V Evidenci (tabulka na Disku) mají stavy jiná jména (_Rozpracováno_, _Čeká na odpověď_,
_Souhlas udělen_…). Šéfredakce je zná z tabulky; aplikace je v textu nepoužívá, kromě míst, kde
výslovně mluví o tabulce.

## Hlas

- **Aplikace vyká** a mluví neosobně, bez omluv. Nemá já ani osobnost.
- **E-maily a stránky z odkazu mluví za redakci** a smějí mít _my_ („Na e-mail jsme poslali
  licence.“). Hlášky aplikace _my_ nemají.
- **Chybová věta začíná tím, co udělat**: _Zkraťte název na nejvýš 200 znaků._, _Vyberte obrázek
  do 15 MB — ples.tif má 22 MB._ Výjimka: když udělat nejde nic, věta řekne, co platí.
- **Nikdy nepojmenuje stroj.** Žádná tabulka, řádek, server, token, metadata.
- Kratší vyhrává, ale nikdy za cenu tvrzení, které není pravda.

## Formáty a typografie

- Datum v aplikaci `14. 11. 2026`, čas `9:12`. V e-mailech totéž.
- Pomlčka ve větě je em dash `—` s mezerami.
- Uvozovky české „…“.

## Co v otázce nikdy nebude

Žádná skutečná data. Jména autorů a poskytovatelů jsou vymyšlená, e-maily končí na `priklad.cz`,
odkazy a ID na Disku jsou smyšlené. Repozitář je veřejný.

Když v otázce uvidíš něco, co vypadá jako skutečný záznam, **je to nález** — řekni to.

## Jak má vypadat odpověď

- **Dvě nebo tři varianty**, ne jedna. U každé, co získává a co obětuje.
- **Termín se smí napadnout, ale musí se pojmenovat** — a s důvodem.
- Když věta nemůže být pravdivá a krátká zároveň, **řekni to** a nech rozhodnout.
- Když otázka nenese kontext, který by odpověď rozhodl, **zeptej se** místo hádání.
