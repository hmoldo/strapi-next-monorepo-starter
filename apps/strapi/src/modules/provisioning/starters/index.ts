// apps/strapi/src/modules/provisioning/starters/index.ts
import type { StarterManifest } from "../factory"
import { travelAgentManifest } from "./travel-agent"

/**
 * Central index mapping all available site starter packages.
 * Adding a new layout pattern down the road is as simple as importing it here.
 */
export const STARTER_REGISTRY: Record<string, StarterManifest> = {
  "travel-agent": travelAgentManifest,
  // "real-estate": realEstateManifest, <- Clean plug-and-play addition later!
}
