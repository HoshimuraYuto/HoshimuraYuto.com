import siteConfig from "../../config/siteConfig";
import { Button } from "../elements/Button";

const Footer = () => {
  return (
    <footer className="p-10 lt-sm:px-6">
      <div className="m-auto max-w-[1200px] flex items-center justify-between">
        <p className="font-size-4 color-neutral-7 dark:color-neutral-2">
          {siteConfig.credit}
        </p>
        <div className="flex items-center gap-4">
          {siteConfig.footerLinks.map((link) => (
            <a
              href={link.url}
              target="_blank"
              key={link.icon}
              aria-label="sns link"
              className="flex items-center justify-center"
            >
              <Button
                variant="plain"
                size="original"
                className="p-0 outline-0"
                aria-label="sns link button"
              >
                <div
                  className={`${link.icon} color-neutral-4 wh-4 wh-6 dark:color-neutral-5`}
                />
              </Button>
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
