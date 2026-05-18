// apps/strapi/src/modules/provisioning/orchestrator.ts
import type { Core } from "@strapi/strapi"

import { StarterEngine } from "./factory"
import { STARTER_REGISTRY } from "./starters" // Import the map lookup layout

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

    // 1. Look up the requested starter target configuration inside our map registry index
    const manifest = STARTER_REGISTRY[activeStarter]

    if (!manifest) {
      this.strapi.log.warn(
        `⚠️ Provisioning: Target starter profile [${activeStarter}] requested but not registered in system maps.`
      )

      return
    }

    this.strapi.log.info(
      `🚀 Provisioning: Detected valid target profile [${activeStarter}]. Checking system state...`
    )

    try {
      // 2. Clear old data elements first if explicitly instructed
      if (forceCleanup) {
        this.strapi.log.warn(
          `🔥 Provisioning: STRAPI_FORCE_CLEANUP is active! Purging core entities...`
        )
        await this.executeDatabasePurge()
      }

      // 3. Collision Guard Check: Verify if pages already exist
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

      // 4. Zero conditional code branches. Pass the decoupled object directly into the engine.
      this.strapi.log.info(
        `⚡ Provisioning: Launching engine for manifest ID: [${manifest.id}]...`
      )
      await this.engine.build(manifest)

      this.strapi.log.info(
        `✅ Provisioning: Successfully initialized target starter profile [${activeStarter}].`
      )
    } catch (error) {
      this.strapi.log.error(
        "❌ Provisioning: Critical execution error encountered during bootstrap phase:",
        error
      )
    }
  }

  private async executeDatabasePurge(): Promise<void> {
    // 1. Purge Pages with explicit high pagination limit
    const pages = await this.strapi.documents("api::page.page").findMany({
      page: 1,
      pageSize: 1000,
    })

    this.strapi.log.info(
      `🔥 Provisioning: Purging ${pages.length} dynamic page collections...`
    )
    for (const page of pages) {
      await this.strapi.documents("api::page.page").delete({
        documentId: page.documentId,
      })
    }

    // 2. Purge Destinations with explicit high pagination limit
    const destinations = await this.strapi
      .documents("api::destination.destination")
      .findMany({
        page: 1,
        pageSize: 1000,
      })

    this.strapi.log.info(
      `🔥 Provisioning: Purging ${destinations.length} stale destination entry items...`
    )
    for (const dest of destinations) {
      await this.strapi.documents("api::destination.destination").delete({
        documentId: dest.documentId,
      })
    }
  }
}
