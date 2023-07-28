# Field Zoo

An open source platform for collaboratively developing online field guides and multi-branching taxonomic keys.

_UNDER DEVELOPMENT_

(Note: GitHub is incorrect. This project uses [kysely-mapper](https://github.com/jtlapp/kysely-mapper), not **kysely-orm**.)

## Overview

This platform implements a website and web API having the following features:

- Users can collaboratively create and maintain a data structure that equally supports field guides, multi-branching taxonomic keys, glossaries, and taxonomies.
- Users are owners, editors, and end users. Owners have control who can serve as editors. Editors can modify the data structures. End users can walk the data structures and post feedback.
- Users can annotate images and reference those annotations from text. Editor annotations are public, while end user annotations are only visible to editors.
- All data is version controlled so editors can see the evolution of the data structures and revert edits as needed.
- All hypotheses and decisions are tracked so editors can be sure not to undo prior understanding as they incorporate new understanding.
- Tracks outstanding issues with the data structures that editors would like to eventually resolve.
- Will eventually support filtering the data structure by end user location.

## Objective

To improve the health of biodiversity on this planet by fostering taxonomic expertise among amateurs, enabling lay folks to accurately identify organisms for themselves, and spurring new generations of naturalists and taxonomists who care about and monitor this world.

## Motivation

Study after study reports biodiversity loss and threats of additional loss. To stem this loss we must both accurately monitor species and increase the number of people who care about conserving species. To care about species, we must be able to name the species we see and associate information with their names; when we can’t distinguish species, we can’t hang knowledge on their names, and we can neither see nor appreciate their diversity. Teaching the world to see and name species teaches the world to care about them.

Taxonomists are the experts in distinguishing species based on appearance, but because genetics funding has largely supplanted natural history funding, taxonomists are retiring faster than they are being replaced. Taxonomy is literally dying out. We are losing identification expertise for both known organisms and organisms not yet discovered.

But amateurs can learn to do taxonomy, and they can learn to do it well. They can even become experts. Consider my story. I'm a software developer who merely wanted to learn how to identify North American crab spiders (Thomisidae) from their color patterns. Suitable field guides were not (and still are not) available. I collaborated remotely with spider taxonomists and with amateurs on BugGuide.net as I learned to identify spiders morphologically. In the process, I discovered new species and was given the opportunity to revise the official American Arachnological Society key to the Thomisids north of Mexico.

This platform proposal is largely born of my experience and the collaboration tools I wished I had available to assist me with learning to do taxonomy and work remotely with others. The proposal seeks to empower amateurs to accurately identify organisms and even to foster a new cadre of taxonomists to help replace the losses in taxonomy. Perhaps the future of taxonomy is a global network of amateurs all assisting one another to achieve professional accuracy.

And if amateurs can learn to do taxonomy, they can also create field guides for the lay public in order to better engage the public with biodiversity.

## Technologies

[Nx](https://nx.dev/), a tool for managing monorepos. This platform consists of several apps and tools that need to share code, and monorepos make this possible. It will operate on the same monorepos as Turborepo but runs much faster and produces far more readable output.

[pnpm](https://pnpm.io/), a tool for managing packages. I chose pnpm because it vastly faster and more space efficient than npm and yarn for monorepo management.

[Node.js](https://nodejs.org/en/about/), a server-side JavaScript runtime. Node's asynchronous, non-blocking event-driven architecture makes it easy to build high-throughput web apps. Node is also easy to deploy on any OS, and it allows backend devs to also work on frontend code in the same language.

[TypeScript](https://typescriptlang.org/), a statically-typed superset of JavaScript. TypeScript allows for running JavaScript on Node with static typing checking, eliminating a whole class of errors at compile time and making it easy to refactor code from VSCode.

[SvelteKit](https://kit.svelte.dev/), a compiled reactive library for building web components. I began this project with Next.js and React, but being experienced with [Svelte](https://svelte.dev/), I began seeing how I'd have to deal with issues in React that simply cannot arise in Svelte. And React was requiring twice as much code and taking three times as long. In order to maximize my productivity, I decided it would be best to stick with Svelte, despite the greater job opportunities with React.

[TailwindCSS](https://tailwindcss.com/), a CSS utility library for components. I find that CSS sometimes requires much trial and error to resolve unexpected interactions between classes, and I'm hoping that I'll be dealing with this less in TailWind than in vanilla CSS or Bootstrap.

[PostgreSQL](https://www.postgresql.org/), an advanced, open-source RDBMS. Postgres seems to be the best open source RDBMS, allowing for object queries and minimally-blocking transactions. I briefly considered using NoSQL such as MongoDB but it seemed to vastly increase the complexity of working with non-static relational data. It doesn't appear realistic to generically support both Postgres and MySQL, but it will be possible to add MySQL and other DB support in a way that entails redundantly maintaining code.

[Kysely](https://github.com/kysely-org/kysely), a type-safe, autocompleting typescript SQL query builder. This library leverages TypeScript's amazing type support to allow for writing SQL queries that are free of syntax errors and typos in table and column names, eliminating another class of errors.

[kysely-mapper](https://github.com/jtlapp/kysely-mapper), a flexible Kysely-based utility I created for mapping between objects and database tables. It reduces the amount of code needed for mapping and allows for highly customized mapping.

[TypeBox](https://github.com/sinclairzx81/typebox), a super-fast data validator. It provides tools for creating JSON schemas and precompiles (at runtime) the schemas into efficient validators. I'm exploring ways to integrate TypeBox with Kysely for error-free SQL development.

[typebox-validators](https://github.com/jtlapp/typebox-validators), a libarary I created for safely and performantly validating TypeBox JSON Schemas, supporting custom error messages.

[vitest](https://vitest.dev/), a test runner for use with ESM-built TypeScript.

I'm also experimenting with techniques for writing robust TypeScript using [Domain-Driven Design (DDD)](https://medium.com/ssense-tech/domain-driven-design-everything-you-always-wanted-to-know-about-it-but-were-afraid-to-ask-a85e7b74497a). This aspect of the solution is likely to evolve until I'm happy with a particular approach.

## Installation

The following must be globally installed before installing this package:

- [Node.js](https://nodejs.org/en) (which also installs npm)
- [pnpm](https://pnpm.io/)
- [Docker](https://docs.docker.com/engine/install/)
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- [Nx](https://nx.dev/) (optional, as you can also run Nx via `npx nx`)

Install and build the repo as follows:

```bash
git clone https://github.com/jtlapp/fieldzoo.git
cd fieldzoo
pnpm install
pnpm build
```

This platform uses the following environment variables in `.env` (for production and development) and `.env.test` (for the test suite):

```
PUBLIC_SUPABASE_URL=http://localhost:54321
PUBLIC_SUPABASE_ANON_KEY=key-goes-here

POSTGRES_URL=postgresql://postgres:postgres@localhost:54422/postgres
POSTGRES_DATABASE=fieldzoo_test
POSTGRES_USER=fieldzoo_tester
POSTGRES_PASSWORD=password
POSTGRES_MAX_CONNECTIONS=1
```

## Testing

To test, you'll first need to acquire a Supabase access token, which you can do after you've created a Supabase account. You'll use this token to login to Supabase.

The test instance gets its environment from `.env.test`. After building the repo and starting the Docker daemon, you can run the tests as follows:

```bash
cd fieldzoo/
pnpm start-test-instance
pnpm test
pnpm stop-test-instance
```

Stopping the supabase instance is optional.

The development instance gets its environment from `.env`. Run it as follows:

```bash
cd fieldzoo/
pnpm start-dev-instance
nx run website:dev
pnpm stop-dev-instance
```

## License

The project is licensed under GPL-3.0, except for the generically useful libraries, which use the MIT license. These generic libraries are found in `utils/` and have their own LICENSE files.
