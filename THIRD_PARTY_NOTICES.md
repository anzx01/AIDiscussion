# Third-Party Notices

This repository is licensed under the MIT License. Third-party packages,
fonts, UI snippets, and service SDKs keep their own licenses and notices.

## Direct Runtime and Development Dependencies

The direct dependencies declared in `package.json` are primarily MIT,
Apache-2.0, ISC, and Unlicense packages. Notable direct dependencies include:

- Next.js, React, React DOM, Radix UI, React Hook Form, Sonner, Tailwind CSS,
  Tailwind Merge, and Zod: MIT-family licenses.
- Drizzle ORM and Drizzle Zod: Apache-2.0.
- class-variance-authority and TypeScript: Apache-2.0.
- lucide-react: ISC.
- postgres: Unlicense.
- better-auth: MIT, based on npm package metadata checked during this review.

## Notable Transitive Licenses

The dependency metadata review found transitive packages with additional
obligations:

- LGPL-3.0-or-later: sharp/libvips platform packages pulled transitively by
  image tooling.
- MPL-2.0: lightningcss platform packages and axe-core.
- CC-BY-4.0: caniuse-lite browser compatibility data.
- Python-2.0: argparse.

Keep these package notices intact when redistributing built artifacts that
bundle third-party code.

## Source Snippets and Assets

- shadcn/ui component patterns are used via Radix UI and local component code.
  Treat those snippets as MIT-licensed third-party material.
- Geist font files under `src/app/fonts/` are third-party font assets from the
  Next.js starter ecosystem. Keep their upstream license notices when
  replacing, bundling, or redistributing them.
- Removed unused default Next.js/Vercel template logo assets to avoid implying
  affiliation or endorsement.

## Generated Notice Maintenance

Before each public release, rerun a dependency license report with the selected
package manager and update this file if new license families appear.
