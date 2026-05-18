import type { Core } from "@strapi/strapi"

import { registerPopulatePageMiddleware } from "./documentMiddlewares/page"
import { registerAdminUserSubscriber } from "./lifeCycles/adminUser"
import { registerUserSubscriber } from "./lifeCycles/user"
import { ProvisioningOrchestrator } from "./modules/provisioning/orchestrator"
import { getPopulateDynamicZoneConfig } from "./populateDynamicZone"

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register() {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    registerAdminUserSubscriber({ strapi })
    registerUserSubscriber({ strapi })

    // Generate dynamic zone populate configuration at startup to avoid doing it on the fly during requests.
    getPopulateDynamicZoneConfig()

    // Register Documents API middleware for dynamic zone population
    registerPopulatePageMiddleware({ strapi })

    // Dynamic, manifest-driven starter architecture
    const orchestrator = new ProvisioningOrchestrator(strapi)
    await orchestrator.handleLifecycleHook()

    strapi.log.info("🚀 Strapi application is ready.")
  },
}
