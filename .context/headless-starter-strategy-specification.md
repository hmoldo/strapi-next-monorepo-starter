# Technical Specification: Modular Provisioning & Starter Strategy

## Project: Blocksy-Style Headless Architecture (Strapi 5 + Next.js 15)

### 1. Executive Summary

The goal is to implement a "One-Step" starter selection system that synchronizes the API (Strapi) and the UI (Next.js). This system allows for the rapid deployment of pre-configured site templates (e.g., "Travel Agent") by automating schema creation, data seeding, asset management, and frontend component mapping.

### 2. Core Architecture: The Modular Provisioning Engine

Instead of hardcoding site logic, we use a **Manifest-Driven** approach.

#### A. The Orchestrator

A central service in Strapi that listens for a "Provision" command. It validates the environment, checks for existing data to prevent collisions, and executes the selected "Starter Plan."

#### B. The Starter Plan (The "Manifest")

Each starter is a self-contained module containing:

- **Seed Data:** JSON objects representing the initial content.
- **Media Assets:** Local files to be uploaded to the Strapi Media Library.
- **Component Maps:** Instructions on which Page Builder blocks to create.

---

### 3. Implementation Roadmap: Step-by-Step

#### Step 1: Provisioning Infrastructure (Strapi)

1. **Create Directory:** `apps/strapi/src/modules/provisioning/`
2. **Define Base Interface:** Create an interface that all starters must follow (e.g., `execute(strapi: Strapi): Promise<void>`).
3. **The Registry:** A central file that maps starter IDs (e.g., `travel-agent`) to their specific logic files.

#### Step 2: Starter Manifest Development

1. **The Data Plan:** Define the `Destination` and `Member` collection types in Strapi.
2. **The Seeder Script:** Write the logic to check if data exists and create entries if missing.
3. **Asset Handling:** Implement a utility to read files from `apps/strapi/public/starters/[id]/` and upload them via the Strapi `upload` plugin.

#### Step 3: Frontend Adaptation (Next.js)

1. **Component Library:** Build the specialized React components (e.g., `FeaturedDestinations`, `TeamGrid`).
2. **Component Registry:** Register these components in the `PageBuilder` index so they can be rendered dynamically.
3. **Theme Config:** Create a mechanism (via a Global Single Type in Strapi) to send brand colors and fonts to the Tailwind configuration.

---

### 4. File & Content Type Manifest

#### Strapi Content Types (The "Blueprints")

| Type Name       | Type        | Key Fields                                      |
| :-------------- | :---------- | :---------------------------------------------- |
| **StarterKit**  | Single Type | active_starter (String), install_date (Date)    |
| **Destination** | Collection  | title, slug, location, image (Media)            |
| **Member**      | Collection  | name, role, avatar (Media), social_links (Comp) |
| **Global**      | Single Type | theme_config (JSON), logo (Media), site_name    |

#### Core Files (The "Engine")

- `apps/strapi/src/modules/provisioning/index.ts`: The main orchestrator.
- `apps/strapi/src/modules/provisioning/starters/travel-agent.ts`: The Travel Agent logic.
- `apps/strapi/src/index.ts`: Updated `bootstrap` function to trigger the orchestrator.
- `apps/ui/src/components/page-builder/components/sections/StrapiFeaturedDestinations.tsx`: The UI grid.
- `apps/ui/src/theme/starter-presets.json`: Tailwind configuration overrides per starter.

---

### 5. AI Context & Future Usage

When starting a new development thread or continuing this project, the following context is critical:

1. **Environment:** Strapi 5 (TypeScript) + Next.js 15 (App Router).
2. **Pillar Fixes:** The system must include the URL Hierarchy Fix (lifecycles), the Deep Populate Fix (API Server), and the Image URL Prefix logic.
3. **Provisioning Command:** The intended execution is `STRAPI_STARTER=id pnpm dev` or a custom CLI command.

### 6. Summary of Benefits

- **Zero Technical Debt:** Starters are modular and can be removed/updated without touching the core Strapi engine.
- **Portability:** The entire "Travel Agent" world can be ported to a new project by moving one folder.
- **Blocksy Experience:** Users get a fully functional, professional site in one step.
