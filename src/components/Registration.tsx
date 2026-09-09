/* ============================================================================
 * REGISTRATION
 *
 * Crop marks at the corners of the sheet and a measured tick scale down the
 * left edge. On press these are how a sheet is aligned; here they are the
 * quietest possible statement that the page is a document rather than a
 * screen. Opacity is deliberately near the floor — this is detail that
 * rewards a second look and must not register on the first.
 * ========================================================================= */

const CORNERS = [
  "left-4 top-4 border-l border-t",
  "right-4 top-4 border-r border-t",
  "left-4 bottom-4 border-l border-b",
  "right-4 bottom-4 border-r border-b",
];

export function Registration() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-[2] hidden lg:block"
      aria-hidden="true"
    >
      {CORNERS.map((c) => (
        <span key={c} className={`absolute h-4 w-4 border-rule-3/45 ${c}`} />
      ))}

      {/* A tick scale on the left gutter: every fifth mark runs longer, the
          way a rule is graduated. */}
      <div className="absolute bottom-16 left-4 top-16 flex flex-col justify-between">
        {Array.from({ length: 21 }, (_, i) => (
          <span
            key={i}
            className={`block h-px bg-rule-3/40 ${i % 5 === 0 ? "w-2.5" : "w-1"}`}
          />
        ))}
      </div>
    </div>
  );
}
