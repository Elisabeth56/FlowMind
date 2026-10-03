import Image from 'next/image'

// The three notes the stage types, tidies and files. Order matters: s1 lands first.
const NOTES = [
  {
    raw: 'call ada about the invoice before fri',
    tidy: 'Call Ada about the invoice',
    chips: [
      { label: 'Clients', tone: 'ai' },
      { label: 'Fri', tone: 'n due', delay: 'd1' },
    ],
  },
  {
    raw: 'kemi’s deck notes → before thurs pitch',
    tidy: 'Review Kemi’s deck notes',
    chips: [
      { label: 'Pitch prep', tone: 'ai', delay: 'd1' },
      { label: 'Thu', tone: 'n', delay: 'd2' },
    ],
  },
  {
    raw: 'idea: monthly recap email for clients',
    tidy: 'Monthly recap email',
    chips: [{ label: 'Idea', tone: 'apr', delay: 'd2' }],
  },
]

const Edges = () => (
  <>
    <span className="edge" />
    <span className="edge2" />
  </>
)

/**
 * The page's one signature moment: a note is typed, drops onto a pile, is tidied into
 * a titled card with chips, then flies into the tray as a paper slip. It is decoration
 * (the headline beside it says the same thing), so it is hidden from screen readers.
 * The motion is in landing.css.
 */
export function HeroStage() {
  return (
    <div className="stage-wrap" aria-hidden="true">
      <div className="stage">
        <Image src="/images/hero-tray.webp" alt="" fill priority sizes="(min-width: 768px) 55vw, 100vw" />

        <div className="cap">
          <span className="ty-wrap">
            <span className="ty-ph">Drop in a task, note, link or idea</span>
            {NOTES.map((note, i) => (
              <span key={note.raw} className={`typing${i + 1}`}>
                {note.raw}
              </span>
            ))}
          </span>
          <span className="caret" />
          <span className="enter">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </span>
        </div>
        <span className="tape">Press N anywhere</span>

        <p className="filed">
          Filed <span className="chip ai">Clients</span>
          <span className="chip ai">Pitch prep</span>
          <span className="chip apr">Ideas</span>{' '}
          <span className="tick-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--fm-bg)" strokeWidth="3">
              <path d="M5 12l5 5 9-10" />
            </svg>
          </span>
        </p>

        {/* slips filed earlier: the stack the new notes land on */}
        {[0, 1, 2].map((i) => (
          <span key={i} className={`pf pf${i}`}>
            <Edges />
          </span>
        ))}

        {NOTES.map((note, i) => (
          <div key={note.raw} className={`st s${i + 1}`}>
            <Edges />
            <span className="lines">
              <span className="raw">{note.raw}</span>
              <span className="done">{note.tidy}</span>
            </span>
            <span className="tags">
              {note.chips.map((chip) => (
                <span key={chip.label} className={`chip cp ${chip.tone} ${chip.delay ?? ''}`}>
                  {chip.label}
                </span>
              ))}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
