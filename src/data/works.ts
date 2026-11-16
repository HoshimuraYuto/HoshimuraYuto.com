export interface Work {
  name: string;
  url: string;
  updated: string;
  note?: string;
}

export interface DeadWork extends Work {
  created: string;
}

// First and last commit on the default branch, JST, as of 2026-11-16; pushed_at also moves on Dependabot branches.
const works: Work[] = [
    {
      name: "fadewise",
      url: "https://github.com/HoshimuraYuto/fadewise",
      updated: "2026-10-18",
      note: "YouTube Musicの音量を揃え、曲の終わりをなめらかにつなぐChrome拡張",
    },
    {
      name: "cloudflare-signed-email-alias",
      url: "https://github.com/HoshimuraYuto/cloudflare-signed-email-alias",
      updated: "2026-11-12",
      note: "サイトごとのメールアドレスを、保存なしで署名だけで受け付けるCloudflare Worker",
    },
    {
      name: "wall-scene",
      url: "https://github.com/HoshimuraYuto/wall-scene",
      updated: "2026-07-08",
      note: "仮想デスクトップごとに別の動画・画像を壁紙にできるmacOSアプリ",
    },
    {
      name: "furiwake",
      url: "https://github.com/HoshimuraYuto/furiwake",
      updated: "2026-03-14",
      note: "Claude CodeやCodexの要求を、複数のAIへ振り分ける中継",
    },
    {
      name: "credential-guard",
      url: "https://github.com/HoshimuraYuto/credential-guard",
      updated: "2026-03-16",
      note: "Claude Codeから秘密情報が漏れるのを防ぐプラグイン",
    },
    {
      name: "blue-switch",
      url: "https://github.com/HoshimuraYuto/blue-switch",
      updated: "2024-12-01",
      note: "Magic Keyboardなどを、ワンクリックで別のMacへ切り替えるアプリ",
    },
    {
      name: "official-swag-lists",
      url: "https://official-swag-lists.com",
      updated: "2023-04-01",
      note: "企業・団体の公式グッズ・ノベルティのリンク集",
    },
  ],
  smallWorks: Work[] = [
    {
      name: "cc-sidecar",
      url: "https://github.com/HoshimuraYuto/cc-sidecar",
      updated: "2026-09-20",
    },
    {
      name: "dotfiles",
      url: "https://github.com/HoshimuraYuto/dotfiles",
      updated: "2026-11-10",
    },
  ],
  deadWorks: DeadWork[] = [
    {
      name: "AutoEnvSetter",
      url: "https://github.com/HoshimuraYuto/AutoEnvSetter",
      created: "2023-03-08",
      updated: "2023-03-19",
    },
    {
      name: "ippo",
      url: "https://github.com/HoshimuraYuto/ippo",
      created: "2024-06-02",
      updated: "2024-06-08",
    },
    {
      name: "ImageEditor",
      url: "https://github.com/HoshimuraYuto/ImageEditor",
      created: "2021-08-31",
      updated: "2021-08-31",
    },
  ];

export { deadWorks, smallWorks, works };
