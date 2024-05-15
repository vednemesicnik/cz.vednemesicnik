import type { PodcastData } from "../utils/create-podcast"

export const podcastData: PodcastData = {
  slug: "vednemesicnik",
  title: "Vedneměsíčník",
  description:
    "Podcast studentských novin Vedneměsíčník. Redaktoři společně probírají své texty a články a baví se o věcech, které zajímají či trápí (nejen) mladou studentskou generaci.",
  episodes: [
    {
      slug: "na-skolni-rok-do-bavorska",
      title: "Na školní rok do Bavorska. Jaké to je?",
      description:
        "Jaké to je, žít jeden školní rok v Bavorsku, bydlet u německé rodiny a chodit tam do školy? To vše se dozvíte v prvním díle podcastu studentských novin Vedneměsíčník! O svých zkušenostech si s šéfredaktorkou Lucií Procházkovou povídá redaktorka Barbora Kortusová. Proč se jí ani nechtělo vracet zpátky do Čech? A jak se stalo, že skončila s učitelským sborem na skleničce?",
      publishedAt: new Date("2023-04-01"),
      published: true,
      links: [
        {
          label: "Poslechněte si na Spotify",
          url: "https://open.spotify.com/episode/1bvkvOUpQaeI5aWGV54lMw?si=m_d5aVnpTK6VjfqEpW0Agw",
        },
      ],
    },
    {
      slug: "jak-poznat-svet-a-moc-pri-tom-neutratit",
      title: "Jak poznat svět a moc při tom neutratit?",
      description:
        "Dánsko, Malta, Švýcarsko... to je jen malá část z výčtu zemí, které navštívila naše redaktorka Anna Peclová. V nové epizodě vypráví o svém dobrodružném přespání v dánském „shelteru“, radí kdy (ne)jet na Maltu nebo jak ve Švýcarsku neutratit korunu. O jejích cestách a nevšedních zážitcích si povídala s šéfredaktorkou Lucií Procházkovou. A dozvíte se také, na co je třeba dát si pozor, když čekáte na blikající Eiffelovku...",
      publishedAt: new Date("2023-05-01"),
      published: true,
      links: [
        {
          label: "Poslechněte si na Spotify",
          url: "https://open.spotify.com/episode/0RAPF7NiAWs30LRrRjeNjM?si=B2PtiyxJS2SAnZyJ2lv45g",
        },
      ],
    },
  ],
  cover: {
    altText: "Obálka Podcastu Vedneměsíčník",
    filePath: "prisma/assets/vednemesicnik_podcast_cover.jpg",
  },
}
