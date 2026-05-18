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

  /**
   * Evaluates the current environment state and triggers the active starter schema deployment.
   */
  public async handleLifecycleHook(): Promise<void> {
    const activeStarter = process.env.STRAPI_STARTER

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
      // Guard Check: Verify if pages have already been built to prevent asset/content collision
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

      // Execute specific provisioning pipelines based on the environment flag
      if (activeStarter === "travel-agent") {
        this.strapi.log.info(
          `⚡ Provisioning: Launching engine for [${activeStarter}]...`
        )

        // Temporarily feeding a minimum runtime manifest structure to verify the orchestration link
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
}
