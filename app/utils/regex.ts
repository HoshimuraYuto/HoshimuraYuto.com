const match = (target: string) => (regex: RegExp) => {
  const match = regex.exec(target);
  return match?.[1] ?? null;
};

export const getTitleFromHTML = (html: string) => {
  return match(html)(/<title.*>(.*?)<\/title>/i);
};

export const getDescriptionFromHTML = (html: string) => {
  return match(html)(
    /<meta\s+name=["']description["']\s+content=["'](.*?)["']\s*\/?>/i,
  );
};

export const getBaseDomainFromURL = (url: string) => {
  return match(url)(/^(?:https?:\/\/)?(?:www\.)?([^/]+)/i);
};

export const getLastPathFromURL = (url: string) => {
  return match(url)(/\/([^/?]+)(?:\?.*)?$/);
};

export const getFileNameWithoutExtension = (filename: string) => {
  return match(filename)(/^(.+)(?:\.\w+)$/);
};

export const isInternalLink = (url: string) => {
  return match(url)(/^(https?:\/\/)[\w+.]+[\w+]{2,}/) === null;
};
