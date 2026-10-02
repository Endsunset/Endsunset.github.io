# LinkMap web style guide

Use white backgrounds throughout the website. Red is the distinguishing accent:
apply it to selected text, actions, active navigation, and the trailing edge of
badges. Keep long-form reading text neutral and surfaces quiet.

## Color tokens

Define shared website colors in `styles.css`; the privacy page uses `policy.css`. DocC owns its generated documentation styles.

| Token | Value | Use |
| --- | --- | --- |
| `--surface` | `#ffffff` | Page, section, card, button, badge, and illustration backgrounds |
| `--ink` | `#202124` | Headings and primary body text |
| `--muted` | `#5f6368` | Supporting text and descriptions |
| `--accent` | `#b4232c` | Red emphasis, links, focus outlines, and accent edges |
| `--accent-hover` | `#8e1820` | Hover emphasis for actions |
| `--line` | `#dedfe2` | Quiet separators and card borders |

Avoid colored section fills, dark background bands, cream panels, and secondary
accent colors. Use spacing and borders to separate white surfaces. Apple’s
SDK-owned authentication buttons retain their official appearance.

## Accent placement

- Highlight a short phrase in a headline, rather than coloring the entire page red.
- Use red for text links; underline links within prose.
- Keep buttons white with red labels and borders. Primary buttons have a thicker
  trailing border to distinguish them from secondary actions.
- Badges use white fill, a neutral thin border, red text, and a 3px red trailing
  edge. Use `border-inline-end` so the edge follows the text direction. The shared
  `.badge` class and map labels demonstrate this treatment.
- Active documentation links use bold red text and a trailing red edge. Preserve
  `aria-current="page"`; color alone must not communicate the active state.
- Map illustrations use white surfaces, fine neutral grid lines, and red or dark
  paths. Numbered markers remain readable on white.

## Typography and layout

The homepage uses Space Grotesk for headings and DM Sans for body text. Documentation
and policy pages use system fonts for reading. Keep body text at least 16px, and
small labels at least 14px. Use comfortable line spacing for paragraphs and lists.

Keep the existing responsive page structure. Let controls and footer links wrap,
collapse guide cards on narrow screens, and keep long documentation readable.

## Accessibility and interaction

Red text must remain legible against white. The accent token has greater than 6:1
contrast on white; primary and muted text also exceed 4.5:1. Keep visible keyboard
focus outlines, meaningful link labels, text explanations for errors, and reduced
motion support. Do not use red alone to distinguish errors from ordinary emphasis.

## Maintenance

Apply these rules to the homepage, privacy policy, and future website pages.
Update shared styles instead of adding conflicting page-specific color values.
Follow `AGENTS.md` for clean folder links. DocC owns its documentation styles.

Website chrome uses the shared Endsunset templates in `../partials/` and scoped
styles in `../assets/styles/`. Preserve their existing dark appearance while
keeping LinkMap content white with red accents. The old LinkMap header/footer
components remain as inactive source. Refresh checked-in website pages with
`python3 scripts/build-headers.py` and `python3 scripts/build-footers.py`; regenerate
DocC and privacy pages with their own generators.

## Documentation

Swift-DocC provides navigation, search, and article layout for the single
LinkMap documentation library. Author topics in `docc/LinkMap.docc`; do not
recreate the former website sidebar or article renderer. Curate Essentials,
the platform handbook branches, Shared Concepts, and Reference with `## Topics`.

Sign in actions link to `login/`, which uses the existing white account-page layout
and Apple’s SDK sign-in button. Sign-in links carry the originating page in a
`redirect` query parameter. Signed-in sessions return there, or to the homepage
when no valid return page is provided.
Use `account/` for authentication status, account identity, retry, and the SDK
sign-out button.
