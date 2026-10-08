import Scramble from "./Scramble";

/** A section's small mono label: an index, a slash, a name — decrypted on first sight. */
export default function SectionLabel({ index, text }: { index: string; text: string }) {
  return (
    <p className="label">
      <span className="label-index">{index}</span>
      <Scramble text={text} />
    </p>
  );
}
