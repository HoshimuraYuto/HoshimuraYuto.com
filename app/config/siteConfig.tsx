const siteConfig = {
  headerIcon: (
    <div className="i-carbon-star-filled color-neutral-9 wh-6 dark:color-neutral-1" />
  ),
  headerPageNav: [
    {
      title: "home",
      slug: "/",
    },
    {
      title: "blog",
      slug: "/blog",
    },
    {
      title: "about",
      slug: "/about",
    },
    {
      title: "contact",
      slug: "/contact",
    },
  ],
  credit: `MIT ${new Date().getFullYear()} © hoshimurayuto.com`,
  footerLinks: [
    {
      icon: "i-ri-twitter-x-fill",
      url: "https://twitter.com/HoshimuraYuto",
    },
    {
      icon: "i-ri-github-fill",
      url: "https://github.com/HoshimuraYuto",
    },
  ],
};

export default siteConfig;
