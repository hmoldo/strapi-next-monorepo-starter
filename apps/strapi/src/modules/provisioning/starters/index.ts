// apps/strapi/src/modules/provisioning/index.ts
import type { Core } from "@strapi/strapi"

import { initTravelAgent } from "./travel-agent"

export const provisionStarter = async (strapi: Core.Strapi) => {
  const starterId = process.env.STRAPI_STARTER

  if (!starterId) {
    return // No starter requested, proceed normally
  }

  strapi.log.info(
    `🛠️  Provisioning Engine: Detected request for [${starterId}]`
  )

  switch (starterId) {
    case "travel-agent":
      strapi.log.info("✈️  Executing Travel Agent initialization...")
      await initTravelAgent(strapi)
      break

    default:
      strapi.log.warn(
        `⚠️  Unknown starter ID: "${starterId}". No provisioning performed.`
      )
  }
}
