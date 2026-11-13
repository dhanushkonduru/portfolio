# Dhanush Konduru — Portfolio

One page, built around one idea: a model that forgets where you point.

A cloud of about thirty thousand points sits behind the whole page. In the hero
it is a breathing sphere, the model. Move the cursor over it and the points
under the cursor are pushed out and go dark, which is the thing the research
is about: making a model forget, then proving it did. As the page scrolls the
same points become a loss landscape behind the projects, a vortex behind the
patents, and the model again at the end.

## Stack

| Layer     | Choice                                                    |
| --------- | --------------------------------------------------------- |
| Framework | Next.js 15 (App Router), React 19, TypeScript             |
| Styling   | Tailwind CSS v4, tokens in `src/app/globals.css`          |
| 3D        | three.js through React Three Fiber, one custom shader     |
| Motion    | framer-motion, tokens in `src/lib/motion-tokens.ts`       |
| Scroll    | A small inertial smoother, `src/lib/scroll.ts`            |
| Type      | Geist, Geist Mono, Instrument Serif through `next/font`   |

## Layout of the code

| Path                              | What it holds                                              |
| --------------------------------- | ---------------------------------------------------------- |
| `src/app/page.tsx`                | Section order                                              |
| `src/components/site/Particles.tsx` | The point cloud: geometry, shader, scroll and pointer    |
| `src/components/site/*.tsx`       | Nav, Hero, About, Work, Research, Experience, Contact      |
| `src/components/ProjectVisual.tsx`| One SVG diagram per project, drawn in code                 |
| `src/components/ProjectModal.tsx` | The case-study sheet                                       |
| `src/data/*.ts`                   | All content                                                |

## Updating the content

Nothing is written in the components. Edit the data and the page follows.

| File              | Holds                                                  |
| ----------------- | ------------------------------------------------------ |
| `profile.ts`      | Name, headline, summary, links, the four hero numbers  |
| `research.ts`     | Patent applications and manuscripts                    |
| `projects.ts`     | Projects. The four cards are listed in `Work.tsx`      |
| `experience.ts`   | Roles and education                                    |
| `skills.ts`       | Skill groups and the marquee list                      |
| `achievements.ts` | Hackathons and certifications                          |

The résumé download is `public/Dhanush-Konduru-Resume.pdf`.

## Running it

```bash
npm install
npm run dev
```

`npm run build` makes the production build. Set `NEXT_PUBLIC_SITE_URL` to the
deployed origin so metadata, the sitemap and the share image use it.

## Notes for future edits

- The page never sets `scroll-behavior: smooth`. The smoother in
  `src/lib/scroll.ts` animates anchors itself and the two would fight.
- Touch scrolling is left alone. Any panel that scrolls on its own opts out
  with `data-scroll-ignore`.
- The point cloud drops its point count and pixel ratio on weaker devices, and
  holds still under `prefers-reduced-motion`.
- The project deck only pins on screens that are wide and tall enough to show
  a whole card (the `deck:` variant). Elsewhere the cards stack.
- Colours are written out by hand in three places that cannot read CSS
  variables: the shader, the share image and the favicon.
- The footer year is a literal so server and client cannot disagree. Bump it
  by hand.
