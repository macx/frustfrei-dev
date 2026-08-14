# frustfrei.dev

![Maintenance](https://img.shields.io/badge/maintained-yes-brightgreen)
![Generator](https://img.shields.io/badge/generator-Astro-orange)

[frustfrei.dev](https://frustfrei.dev) is a free learning platform for HTML, CSS and UI/UX, maintained by [David Eiken](https://davideiken.de). It grew out of "GT 1191", a seminar he taught for 11 years at HAWK University of Applied Science and Art in Hildesheim, and now lives on independently as an open resource with tutorials, a website starterkit and curated links — no longer tied to any specific course. This repository is the source code of the website. It's not related to HAWK as a publisher of this information.

> **Note:** The repository is still named `hawk-gt1191` and the origin remote still
> points there — the rename to match the new domain is planned but not yet done.
> See `RELAUNCH-STRATEGIE.md` (untracked, local) for the full migration plan.

The web framework [Astro](https://astro.build/) is used to generate the static HTML.

## Prequisites

Clone this repository to start working on it:

```sh
$ git clone git@github.com:macx/hawk-gt1191.git && cd hawk-gt1191
```

In order to run this project, you need to install the following depenencies with [Homebrew](https://brew.sh/index_de):

```sh
$ brew install node
$ corepack enable
$ pnpm install
```

## Development

You have the following options to run the development tasks:

```sh
# Start a development server with live-reload
$ pnpm dev

# Deploy this site to /public folder
$ pnpm build
```

Inside the Projects, you'll see the following folders and files:

```plaintext
/
├── public/
├── src/
│   └── pages/
│       └── index.astro
└── package.json
```

Astro looks for `.astro` or `.md` files in the `src/pages/` directory. Each page is exposed as a route based on its file name.

There's nothing special about `src/components/`, but that's where we like to put any Astro/React/Vue/Svelte/Preact components.

Any static assets, like images, can be placed in the `public/` directory.

## Deployment

The deployment is done through GitHub Actions. Tags and releases are done via release-it.
