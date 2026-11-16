interface Service {
  name: string;
  what: string;
  policy: string;
  policyLabel?: string;
}

// Every host the browser talks to, including the Web Analytics beacon Cloudflare injects when serving.
const services: Service[] = [
  {
    name: "Cloudflare Workers",
    what: "このサイトの配信と、アクセス解析(Cloudflare Web Analytics)に使っています。",
    policy: "https://www.cloudflare.com/privacypolicy/",
  },
  {
    name: "Iowa Environmental Mesonet(Iowa State University)",
    what: "トップの空に重ねる羽田の観測(METAR・SPECI)を取得しています。",
    policy: "https://www.policy.iastate.edu/policy/privacy",
  },
  {
    name: "気象庁",
    what: "観測が取れないときに、東京の天気予報を取得しています。",
    policy: "https://www.jma.go.jp/jma/kishou/info/coment.html",
    policyLabel: "利用規約・個人情報保護",
  },
  {
    name: "GitHub",
    what: "「now」に出す最後の作業時刻を取得しています。",
    policy:
      "https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement",
  },
];

export { services };
