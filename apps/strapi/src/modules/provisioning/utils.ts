import fs from "node:fs"
import path from "node:path"

import type { Core } from "@strapi/strapi"

export const uploadLocalFile = async (
  strapi: Core.Strapi,
  relativePath: string
) => {
  const filePath = path.join(process.cwd(), "public", relativePath)

  if (!fs.existsSync(filePath)) {
    strapi.log.warn(`⚠️ File not found: ${filePath}`)

    return null
  }

  const stats = fs.statSync(filePath)
  const fileName = path.basename(filePath)

  // We map directly to the service provider layer using standard physical structure configurations
  const enhancementProviderFiles = {
    // Legacy fields (Strapi v4)
    path: filePath,
    name: fileName,
    type: "image/jpeg",

    // Modern fields (Strapi v5 / Formidable v3+)
    filepath: filePath,
    originalFilename: fileName,
    mimetype: "image/jpeg",

    // Shared fields
    size: stats.size,
  }

  // Utilize the clean, top-level service endpoint API mapping for plugin engine assets
  const uploadedFiles = await strapi.service("plugin::upload.upload").upload({
    data: {}, // Can include fileInfo here if needed
    files: enhancementProviderFiles,
  })

  // Return the processed attachment meta object
  return Array.isArray(uploadedFiles) ? uploadedFiles[0] : uploadedFiles
}
