// apps/strapi/src/modules/provisioning/orchestrator.ts
import type { Core } from "@strapi/strapi"

import { StarterEngine } from "./factory"

export class ProvisioningOrchestrator {
  private strapi: Core.Strapi
  private engine: StarterEngine

  constructor(strapi: Core.Strapi) {
    this.strapi = strapi
    this.engine = new StarterEngine(strapi)
  }

  public async handleLifecycleHook(): Promise<void> {
    const activeStarter = process.env.STRAPI_STARTER
    const forceCleanup = process.env.STRAPI_FORCE_CLEANUP === "true"

    if (!activeStarter) {
      this.strapi.log.info(
        "🚀 Provisioning: No STRAPI_STARTER variable specified. Skipping seed phase."
      )

      return
    }

    this.strapi.log.info(
      `🚀 Provisioning: Detected target profile [${activeStarter}]. Checking system state...`
    )

    try {
      // 1. If force cleanup is explicitly enabled, purge existing entries before the collision check
      if (forceCleanup) {
        this.strapi.log.warn(
          `🔥 Provisioning: STRAPI_FORCE_CLEANUP is active! Purging core entities...`
        )
        await this.executeDatabasePurge()
      }

      // 2. Guard Check: Verify if pages exist to prevent accidental asset/content collision
      const existingPages = await this.strapi
        .documents("api::page.page")
        .findMany({
          limit: 1,
        })

      if (existingPages && existingPages.length > 0) {
        this.strapi.log.info(
          "⏸️ Provisioning: Content already exists in database. Aborting seed routing to prevent overwrite."
        )

        return
      }

      // 3. Execute specific provisioning pipelines based on the environment flag
      if (activeStarter === "travel-agent") {
        this.strapi.log.info(
          `⚡ Provisioning: Launching engine for [${activeStarter}]...`
        )

        await this.engine.build({
          id: "travel-agent",
          navbar: { logoText: "Travel Agent Starter", links: [] },
          footer: { sections: [] },
          pages: [],
          destinations: [],
        })

        this.strapi.log.info(
          `✅ Provisioning: Successfully initialized target starter profile [${activeStarter}].`
        )
      } else {
        this.strapi.log.warn(
          `⚠️ Provisioning: Unknown starter profile [${activeStarter}] requested.`
        )
      }
    } catch (error) {
      this.strapi.log.error(
        "❌ Provisioning: Critical execution error encountered during bootstrap phase:",
        error
      )
    }
  }

  /**
   * Drops existing page elements safely to reset the operational baseline
   */
  private async executeDatabasePurge(): Promise<void> {
    const pages = await this.strapi.documents("api::page.page").findMany()

    this.strapi.log.info(
      `🔥 Provisioning: Purging ${pages.length} dynamic page collections...`
    )
    for (const page of pages) {
      await this.strapi.documents("api::page.page").delete({
        documentId: page.documentId,
      })
    }

    // Single types like Navbar/Footer will overwrite natively during seeding,
    // but clearing collections keeps the environment perfectly pristine.
  }
}
