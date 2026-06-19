# VillaNova

A web application that centralizes cultural events happening in Marseille and its surroundings: concerts, exhibitions, shows, festivals, all in one place, with a focus on accessibility and eco-design.

## Context

VillaNova was built as a front-end project for a local government brief. Despite a rich cultural program, participation among 18-40 year-olds in Marseille stays low because event information is scattered across too many platforms. VillaNova solves this by aggregating real cultural events into a single, fast, accessible interface.

## Stack

- **HTML5**: Semantic structure, lazy loading, `<picture>` and WebP for eco-design
- **SCSS**: Variables, mixins, Mobile First, compiled and split into partials by concern
- **JavaScript (ES6+, vanilla)**: Native modules, Fetch API, `async/await`, DOM manipulation, no framework
- **WCAG AA accessibility**: Skip link, keyboard navigation, `aria-live`, `aria-busy`, `aria-pressed`, visible focus states

## API

VillaNova fetches real event data from the [OpenAgenda](https://openagenda.com) public API, querying multiple agendas in parallel (`Promise.allSettled`) to cover concerts, museum events, and city-wide culture. Results are deduplicated, sorted, and cached in `sessionStorage` to limit redundant calls.

## Author

Nelson Grac-Aubert. B1 Jeux Vidéo et Systèmes Immersifs, La Plateforme