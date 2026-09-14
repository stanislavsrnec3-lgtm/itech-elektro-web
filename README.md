# iTECH elektro

Statický firemní web v HTML, CSS a JavaScriptu. Otevřít lze přímo soubor `index.html`; sestavení ani instalace balíčků nejsou pro provoz potřeba.

## Struktura

- Hlavní stránka: šest rovnocenných oblastí služeb, v úvodu elektroinstalace a slaboproud. Skutečné fotografie, recenze, informace o firmě a krátká poptávka.
- Navigace: Služby, Realizace a recenze, O firmě, Kontakt. DEHN zůstává mezi službami, bez samostatné položky v hlavním menu a bez zvláštního propagačního bloku.
- Recenze na NejŘemeslníci.cz jsou dostupné přímo z úvodu a tlačítkem u realizací. Jde o běžné odkazy bez externího widgetu a bez ručně uvedeného počtu hodnocení.
- `hvi-hromosvody.html`: izolované hromosvody DEHN HVI, montážní vybavení, podklady a nacenění. Zachována adresa rozpracované stránky.
- `datove-wifi-site-brno.html`: TP-Link Omada, Ubiquiti UniFi a datové sítě.
- `energeticky-management-loxone.html`: měření a řízení technologií pro firmy.
- `kamerove-systemy-zabezpeceni.html`: Jablotron, Hikvision, zvonky a videotelefony.
- Původní stránky elektroinstalací, revizí, SVJ a stavebních firem zůstávají dostupné na svých adresách.
- Všech 12 stránek je uvedeno v `sitemap.xml`. Hlavní doména je `https://itechelektro.cz/`.

## Údržba

Obsah, fotografie a dokumenty jsou přímo v HTML, dostupné i bez JavaScriptu. Při změně kontaktů nebo navigace je nutné upravit všechny stránky. `styles.css` je společný vzhled; `script.js` řeší menu, předvolbu služby a formulář.

Při nové stránce doplňte sitemap, odkazy z hlavní stránky a patičky, jedinečný titulek, popis, canonical a strukturovaná data. `lastmod` má odpovídat skutečné změně, ne se automaticky posouvat každý den.

Ikony jsou lokální výběr z Lucide 1.8.0. Licence je v `assets/icons/LICENSE-lucide.txt`. Web nevyžaduje externí fonty ani ikonový CDN. Nebyl přidán analytický nebo reklamní skript.

## Formulář

Zachovaný endpoint: `https://formspree.io/f/xgornoor`.

- Povinný je popis, lokalita a jeden kontakt. S JavaScriptem stačí e-mail nebo telefon; bez něj je kvůli nativní validaci povinný e-mail.
- Odkazy z jednotlivých služeb předvolí oblast poptávky.
- Volitelné přílohy: nejvýše 5 souborů, celkem 20 MB; JPG, PNG, WebP, HEIC/HEIF a PDF.
- Při chybě se obsah nemaže. Odesílání má časový limit a ochranu proti dvojímu kliknutí.
- Je vynechán prázdný e-mail i prázdná příloha, aby zbytečně nekolidovaly s validací služby.
- Událost `itech:inquiry-sent` se vyvolá až po úspěšné odpovědi. Obsahuje pouze kategorii služby, nikoli kontakt či text poptávky. Sama nic neposílá do analytiky.

**Před zveřejněním ověřit ve Formspree:** aktivaci endpointu, pravidla požadovaných polí (nyní může přijít pouze telefon), doménová omezení, příjem do správné schránky a tarif s podporou příloh. Místní testy skutečné doručení ani nastavení účtu nepotvrzují.

Informace u formuláře popisují účel a použitou službu; nejsou náhradou kompletního právního posouzení. Identifikační a případné další povinné údaje provozovatele je třeba doplnit podle skutečných podkladů. IČO, adresa, retenční lhůty ani certifikace nebyly vymyšleny.

## Ověření

- `python tests/check-site.py`: všech 12 stránek, interní odkazy a soubory, canonical, jedinečné titulky a popisy, JSON-LD, formulářové popisky, rozměry obrázků, společná navigace, rovnocenné karty služeb, odkaz na recenze a úplnost sitemap.
- `node --test tests/contact.test.cjs`: osm testů formuláře s lokálně simulovanými odpověďmi. Žádná zpráva ani osobní údaj se neodesílá.
- Ruční kontrola v prohlížeči: 36 kombinací (12 stránek v šířkách 320, 768 a 1440 px), navíc náhled a formulář v 390 px. Kontrola přetékání, načtených obrázků, menu, Escape, předvolby DEHN, validace a zachování údajů po chybě.
- Po úpravě priorit služeb znovu ověřena hlavní stránka v šířkách 320, 390, 768 a 1440 px, mobilní navigace a otevření správného profilu NejŘemeslníci.cz. Odkaz u realizací a v úvodu vede přímo na sekci `#reviews`.
- Syntaktická kontrola JavaScriptu a `git diff --check`.
- Nejde o úplný audit WCAG, nezávislý bezpečnostní audit ani měření rychlosti na reálném mobilním připojení.

`node tests/preview.cjs` spustí dočasný náhled pouze na loopback rozhraní. Zpřístupní jen povolené veřejné soubory, nikoli celý pracovní adresář. **Záměrně blokuje veškeré odesílání formuláře. Není určen k nasazení.**

## Nasazení a další ověření

Tato úprava sama nic nenahrává na hosting. Publikovat je potřeba HTML, CSS, JavaScript, sitemap, robots a použité soubory assets; adresář tests se nenasazuje.

Po nasazení ověřit přesměrování www na hlavní doménu, dostupnost všech stránek, načtení nových souborů bez staré cache a jednu skutečnou testovací poptávku s přílohou i bez ní. V Search Console a případně Bing Webmaster Tools zkontrolovat sitemap a indexaci nových služeb. Přístup do těchto účtů není součástí ověření.

Pro obchodní výsledky doplnit profily Google/Firmy.cz, skutečné reference DEHN a firemní realizace. Bez doložení nezveřejňovat partnerství s výrobci, certifikace ani procenta úspor. Viditelnost ve vyhledávání a AI nelze zaručit.

## Odborné podklady

Kontrolováno 14. 9. 2026:

- [Google: AI features and your website](https://developers.google.com/search/docs/appearance/ai-features)
- [W3C: WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- [DEHN: Bulletin 2026](https://www.dehn.cz/sites/default/files/media/files/bulletin_2026_ds137_cz_0725.pdf)
- [Loxone: energetický management](https://www.loxone.com/cscz/produkty/energie/)
- [Formspree: přílohy a limity](https://help.formspree.io/articles/building-your-form/file-uploads/)
