// apps/strapi/src/modules/provisioning/index.ts
import type { Core } from "@strapi/strapi"

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
      // We will import the actual logic here in the next step
      break

    default:
      strapi.log.warn(
        `⚠️  Unknown starter ID: "${starterId}". No provisioning performed.`
      )
  }
}
