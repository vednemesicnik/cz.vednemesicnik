export type Grant = {
  slug: string
  name: string
  year: number
  sponsor: string
  fundingStatement: string
  summary: string
  description: string[]
}

export const grants: Grant[] = [
  {
    description: [
      'Projekt spočívá v zajištění celoroční činnosti studentského kulturního časopisu Vedneměsíčník v roce 2026. V rámci projektu vzniknou maximálně čtyři tištěná čísla časopisu, která budou bezplatně distribuována studentům a veřejnosti v Českých Budějovicích.',
      'Obsah časopisu tvoří autorské texty studentů středních škol a gymnázií zaměřené na kulturu, veřejný prostor, místní témata a společenské dění ve městě. Projekt podporuje aktivní zapojení mladých lidí do kulturní tvorby a rozvíjí jejich dovednosti v oblasti psaní, editace, práce s médiem a týmové spolupráce.',
      'Součástí projektu je také provoz webových stránek sloužících jako otevřená publikační platforma pro studentské autory. Web umožňuje průběžné zveřejňování článků a rozšiřuje dostupnost kulturního obsahu i mimo tištěnou podobu časopisu.',
      'Projekt přirozeně reaguje na kulturní dění ve městě České Budějovice a vytváří prostor pro studentskou reflexi aktivit místních kulturních institucí a iniciativ, například aktivit spojených s projektem Evropské hlavní město kultury 2028 nebo kulturní produkce Jihočeského divadla.',
      'Součástí projektu jsou také aktivity na sociálních sítích, které slouží k propagaci studentské tvorby, informování o vydání jednotlivých čísel časopisu a zpřístupnění kulturního obsahu širší veřejnosti, zejména mladé generaci.',
      'Projekt má nekomerční charakter a dlouhodobě přispívá k obohacení kulturní nabídky města České Budějovice o autentický pohled mladé generace.',
    ],
    fundingStatement:
      'Tento projekt je spolufinancován Statutárním městem České Budějovice',
    name: 'Vedneměsíčník 2026',
    slug: 'vednemesicnik-2026',
    sponsor: 'Statutární město České Budějovice',
    summary:
      'Zajištění celoroční činnosti studentského kulturního časopisu Vedneměsíčník v roce 2026 včetně vydání tištěných čísel, provozu webu a aktivit na sociálních sítích.',
    year: 2026,
  },
]

export const getGrantBySlug = (slug: string): Grant | undefined => {
  return grants.find((grant) => grant.slug === slug)
}
