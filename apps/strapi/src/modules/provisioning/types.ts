import type { Core } from "@strapi/strapi"

/**
 * Universal interface that every starter plan must implement.
 * This guarantees the Orchestrator can execute any layout strategy seamlessly.
 */
export interface IStarterPlan {
  /** Unique string identifier matching STRAPI_STARTER (e.g., 'travel-agent') */
  readonly id: string

  /** Human-readable name for logging profiles */
  readonly displayName: string

  /**
   * The entry point execution sequence called by the Provisioning Orchestrator.
   * Handles check validations, entity creation, media upload, and localization trees.
   */
  bootstrap: (strapi: Core.Strapi) => Promise<void>
}

/**
 * Structural shape representing generic single-component page layouts
 * inside a Dynamic Zone payload context.
 */
export interface IComponentPayload {
  __component: string
  [key: string]: any
}

/**
 * Common shape for seeding Standardized Page structures through factories.
 */
export interface IPageSeedDefinition {
  title: string
  breadcrumbTitle: string
  slug: string
  fullPath: string
  content: IComponentPayload[]
}

/**
 * Standard utility link definition used to provision Navbars, Footers, and CTA blocks
 */
export interface ILinkDefinition {
  type: "page" | "external"
  label: string
  href: string
  newTab?: boolean
}
