<img width="1918" height="940" alt="image of my portfolio website" src="https://github.com/user-attachments/assets/ea3fcd55-163b-413f-8c4e-6ab607a6f2fc" />

# DevPortfolio

this repo is customized for my resume, thanks to [this amazing project!](https://github.com/RyanFitzgerald/devportfolio)

built with Astro and Tailwind CSS. 


## Preview

To view a live preview of the site, [click here](https://slotfi.ir/).

## Built With

- **[Astro](https://astro.build/)** - Static site generator for modern web apps
- **[Tailwind CSS v4](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Tabler Icons](https://tabler.io/icons)** - Free and open source icons
- **TypeScript** - For type-safe configuration


## Project Structure

```
devportfolio/
├── public/
│   └── favicon.svg          # Site favicon
├── src/
│   ├── components/          # Astro components
│   │   ├── About.astro      # About section
│   │   ├── Education.astro  # Education section
│   │   ├── Experience.astro # Work experience section
│   │   ├── Footer.astro     # Site footer
│   │   ├── Header.astro     # Navigation header
│   │   ├── Hero.astro       # Hero/intro section
│   │   └── Projects.astro   # Projects showcase
│   ├── pages/
│   │   └── index.astro      # Main page layout
│   ├── styles/
│   │   └── global.css       # Global styles
│   └── config.ts            # Site configuration
├── astro.config.mjs         # Astro configuration
├── package.json             # Project dependencies
├── tailwind.config.js       # Tailwind configuration
└── tsconfig.json            # TypeScript configuration
```

## Local Development

If you'd like to run it locally:

```
git clone https://github.com/RyanFitzgerald/devportfolio.git
cd devportfolio
npm install
```

After that, start up the Astro dev server with:

```
npm run dev
```

