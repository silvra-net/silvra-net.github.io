import type { ReactNode } from "react";

const EMAIL = /([\w.+-]+@[\w-]+(?:\.[\w-]+)+)/;

/**
 * Copy that names an e-mail address, with the address set as a mailto link: written into a
 * sentence it is still the way to reach us. The optional subject pre-fills the message.
 */
export default function MailText({ text, subject }: { text: string; subject?: string }) {
  const href = (to: string) => `mailto:${to}${subject ? `?subject=${encodeURIComponent(subject)}` : ""}`;
  const parts: ReactNode[] = text.split(EMAIL).map((part, i) =>
    i % 2 ? (
      <a key={i} href={href(part)}>
        {part}
      </a>
    ) : (
      part
    ),
  );
  return <>{parts}</>;
}
