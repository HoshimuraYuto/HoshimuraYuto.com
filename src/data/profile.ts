interface Link {
  key: string;
  name: string;
  url?: string;
}

const GITHUB_USER = "HoshimuraYuto",
  GITHUB_URL = `https://github.com/${GITHUB_USER}`,
  CONTACT_URL = "https://sukiburo.jp/contact/",
  BLOG_PRIVACY_URL = "https://sukiburo.jp/privacy-policy/",
  SOURCE_URL = "https://github.com/hoshimurayuto/hoshimurayuto.com",
  SITE_CREATED = "2026-11-11",
  ZENN_URL = "https://zenn.dev/hoshimurayuto";

// Gathered from public sources on 2026-11-14: the dotfiles repository and linked sites.
const writing: Link[] = [
    { key: "blog", name: "sukiburo.jp", url: "https://sukiburo.jp" },
    { key: "memo", name: "sikou.blog", url: "https://sikou.blog" },
    { key: "zenn", name: "zenn.dev/hoshimurayuto", url: ZENN_URL },
  ],
  // From public repositories (languages API, package.json) and the dotfiles repository, 2026-11-14.
  uses: Link[] = [
    { key: "言語", name: "TypeScript / Swift / Go / Shell" },
    { key: "web", name: "Astro / Next.js / React / Tailwind CSS" },
    { key: "基盤", name: "Cloudflare Workers / Terraform" },
    {
      key: "品質",
      name: "lefthook / commitlint / semantic-release / secretlint / Playwright",
    },
    { key: "shell", name: "zsh / mise / Homebrew" },
    { key: "agents", name: "Claude Code / Codex / Gemini CLI / Hermes" },
  ],
  contact: Link[] = [
    { key: "form", name: "sukiburo.jpのお問い合わせ", url: CONTACT_URL },
    { key: "github", name: GITHUB_USER, url: GITHUB_URL },
    { key: "x", name: `@${GITHUB_USER}`, url: `https://x.com/${GITHUB_USER}` },
    { key: "zenn", name: "hoshimurayuto", url: ZENN_URL },
    {
      key: "ko-fi",
      name: "hoshimurayuto",
      url: "https://ko-fi.com/hoshimurayuto",
    },
  ],
  archive: Link[] = [
    { key: "version", name: "2026年版" },
    {
      key: "version",
      name: "2023年版",
      url: `${GITHUB_URL}/HoshimuraYuto.com-2023`,
    },
  ];

export {
  archive,
  GITHUB_USER,
  BLOG_PRIVACY_URL,
  contact,
  CONTACT_URL,
  SITE_CREATED,
  SOURCE_URL,
  uses,
  writing,
};
