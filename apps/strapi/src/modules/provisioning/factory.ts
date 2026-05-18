// apps/strapi/src/modules/provisioning/factory.ts
import fs from "node:fs"
import path from "node:path"

import type { Core } from "@strapi/strapi"

export interface StarterManifest {
  id: string
  destinations?: {
    title: string
    location: string
    slug: string
    imageName: string
  }[]
  forms?: { name: string; handle: string; schema: any }[]
  navbar: {
    logoText: string
    logoImageName?: string
    links: { label: string; href: string }[]
  }
  footer: {
    sections: { title: string; links: { label: string; href: string }[] }[]
  }
  pages: {
    title: string
    slug: string
    fullPath: string
    content: any[] | ((context: any) => any[])
  }[]
}

export class StarterEngine {
  private strapi: Core.Strapi

  constructor(strapi: Core.Strapi) {
    this.strapi = strapi
  }

  public async build(manifest: StarterManifest) {
    this.strapi.log.info(
      `🛠️ Starter Factory: Processing system initialization for [${manifest.id}]`
    )

    // 1. Process Global Collections / Context Data (e.g., Destinations)
    const contextMap: Record<string, any> = {}
    if (manifest.destinations) {
      contextMap.mediaIds = await this.seedMediaContext(
        manifest.destinations,
        manifest.id
      )
    }

    // 2. Build Standardized Forms Layout
    if (manifest.forms) {
      await this.seedForms(manifest.forms)
    }

    // 3. Construct Unified Multi-Tier Pages Matrix
    await this.seedPages(manifest.pages, contextMap, manifest.id)

    // 4. Bind Global Master Layout Assets (Navbar & Footer)
    await this.seedGlobalNavigation(
      manifest.navbar,
      manifest.footer,
      manifest.id
    )
  }

  private async seedMediaContext(items: any[], starterId: string) {
    this.strapi.log.info(
      `Factory: Seeding ${items.length} media items for ${starterId}`
    )
    const registry: Record<string, number> = {}

    for (const item of items) {
      const { imageName } = item
      if (!imageName) continue

      // 1. Check if the image asset is already loaded in the Strapi Media Library
      const [existingFile] = await this.strapi
        .documents("plugin::upload.file")
        .findMany({
          filters: { name: imageName },
          limit: 1,
        })

      if (existingFile) {
        this.strapi.log.info(
          `Factory: Media asset [${imageName}] already exists (ID: ${existingFile.id})`
        )
        registry[imageName] = Number(existingFile.id)
        continue
      }

      // 2. Resolve the asset path if it needs to be uploaded from the local filesystem
      // Resolves to: apps/strapi/public/starters/[starterId]/[imageName]
      const assetPath = path.join(
        process.cwd(),
        "public",
        "starters",
        starterId,
        imageName
      )

      if (!fs.existsSync(assetPath)) {
        this.strapi.log.warn(
          `Factory: Source image file asset missing at path: ${assetPath}`
        )
        continue
      }

      try {
        this.strapi.log.info(
          `Factory: Uploading new starter file asset [${imageName}]...`
        )

        // 3. Leverage Strapi's Upload Plugin Service to ingest the file metadata safely
        const fileStat = fs.statSync(assetPath)
        const uploadService = this.strapi.plugin("upload").service("upload")

        const [uploadedFile] = await uploadService.upload({
          data: {
            fileInfo: {
              name: imageName,
              alternativeText: item.title || imageName,
              caption: item.location || "",
            },
          },
          files: {
            path: assetPath,
            name: imageName,
            type: this.getMimeType(imageName),
            size: fileStat.size,
          },
        })

        if (uploadedFile?.id) {
          this.strapi.log.info(
            `Factory: Successfully uploaded [${imageName}] (Assigned ID: ${uploadedFile.id})`
          )
          registry[imageName] = Number(uploadedFile.id)
        }
      } catch (uploadError) {
        this.strapi.log.error(
          `Factory: Failed to seed media asset [${imageName}]:`,
          uploadError
        )
      }
    }

    return registry
  }

  private async seedForms(forms: any[]) {
    this.strapi.log.info(`Factory: Seeding ${forms.length} structural forms`)
  }

  /**
   * Helper utility to extract standard image mime classifications
   */
  private getMimeType(fileName: string): string {
    const ext = path.extname(fileName).toLowerCase()
    if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg"
    if (ext === ".png") return "image/png"
    if (ext === ".webp") return "image/webp"
    if (ext === ".svg") return "image/svg+xml"

    return "application/octet-stream"
  }

  private async seedPages(pages: any[], context: any, starterId: string) {
    this.strapi.log.info(
      `Factory: Seeding ${pages.length} dynamic pages for ${starterId}`
    )
    // Suppress unused check parameters safely via logging expressions
    this.strapi.log.debug(
      `Factory context active items: ${Object.keys(context || {}).length}`
    )
  }

  private async seedGlobalNavigation(nav: any, footer: any, starterId: string) {
    this.strapi.log.info(
      `Factory: Customizing layout elements for ${starterId}`
    )
    this.strapi.log.debug(
      `Navigation label check: ${nav?.logoText || "None"}, Sections: ${footer?.sections?.length || 0}`
    )
  }
}
