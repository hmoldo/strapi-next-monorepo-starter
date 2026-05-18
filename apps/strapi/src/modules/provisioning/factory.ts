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

    // 1. Process Global Collections & Ingest Media Buffers
    const contextMap: Record<string, any> = {}
    if (manifest.destinations) {
      contextMap.mediaIds = await this.seedMediaContext(
        manifest.destinations,
        manifest.id
      )

      // Seed collection data entries into api::destination.destination
      await this.seedDestinationsCollection(
        manifest.destinations,
        contextMap.mediaIds
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

      // 1. Check if asset profile already exists in Media Library
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

      // 2. Locate files on the host system canvas
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
        const fileStat = fs.statSync(assetPath)
        const fileBuffer = fs.readFileSync(assetPath)

        const uploadPlugin = this.strapi.plugin("upload")

        // 3. Construct a standard Strapi 5 file structure descriptor map
        const fileData: any = {
          name: imageName,
          hash: `${path.parse(imageName).name}_${Date.now()}`,
          ext: path.extname(imageName),
          mime: this.getMimeType(imageName),
          size: fileStat.size / 1024, // KB
          buffer: fileBuffer,
          provider: "local",
        }

        // 4. Transmit the raw asset data buffer to physical disk storage
        await uploadPlugin.provider.upload(fileData)

        // 5. Use Document Service with exact properties required by Strapi 5 schema definition tables
        const savedFileInfo = await (
          this.strapi.documents("plugin::upload.file").create as any
        )({
          data: {
            name: fileData.name,
            hash: fileData.hash,
            ext: fileData.ext,
            mime: fileData.mime,
            size: fileData.size,
            provider: fileData.provider,
            url: `/uploads/${fileData.hash}${fileData.ext}`, // Populate fallback required path mapping
            folderPath: "/", // Set fallback required folder root mapping
            alternativeText: item.title || imageName,
            caption: item.location || "",
          },
          status: "published",
        })

        if (savedFileInfo?.id) {
          this.strapi.log.info(
            `Factory: Successfully uploaded [${imageName}] (Assigned ID: ${savedFileInfo.id})`
          )
          registry[imageName] = Number(savedFileInfo.id)
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

  private async seedDestinationsCollection(
    destinations: any[],
    mediaIds: Record<string, number>
  ) {
    this.strapi.log.info(
      `Factory: Processing ${destinations.length} database collection rows for Destinations...`
    )

    for (const dest of destinations) {
      try {
        const associatedImageId = mediaIds[dest.imageName]

        await this.strapi.documents("api::destination.destination").create({
          data: {
            title: dest.title,
            location: dest.location,
            slug: dest.slug,
            locale: "en",
            publishedAt: new Date().toISOString(),
            // Connect the relation if we successfully retrieved an image asset reference ID
            image: associatedImageId ? [associatedImageId] : [],
          },
          status: "published",
        })
        this.strapi.log.info(
          `✅ Factory: Populated destination row entries for [${dest.title}]`
        )
      } catch (err) {
        this.strapi.log.error(
          `❌ Factory: Failed to insert collection entry for [${dest.title}]:`,
          err
        )
      }
    }
  }

  private async seedForms(forms: any[]) {
    this.strapi.log.info(`Factory: Seeding ${forms.length} structural forms`)
  }

  private async seedPages(pages: any[], context: any, starterId: string) {
    this.strapi.log.info(
      `Factory: Seeding ${pages.length} dynamic pages for ${starterId}`
    )

    for (const page of pages) {
      try {
        const evaluatedContent =
          typeof page.content === "function"
            ? page.content(context)
            : page.content

        await this.strapi.documents("api::page.page").create({
          data: {
            title: page.title,
            slug: page.slug,
            fullPath: page.fullPath,
            locale: "en",
            publishedAt: new Date().toISOString(),
            content: evaluatedContent || [],
          },
          status: "published",
        })
        this.strapi.log.info(
          `✅ Factory: Successfully created page [${page.title}]`
        )
      } catch (pageError) {
        this.strapi.log.error(
          `❌ Factory: Failed to provision page entry [${page.title}]:`,
          pageError
        )
      }
    }
  }

  private async seedGlobalNavigation(nav: any, footer: any, starterId: string) {
    this.strapi.log.info(
      `Factory: Customizing layout elements for ${starterId}`
    )
  }

  private getMimeType(fileName: string): string {
    const ext = path.extname(fileName).toLowerCase()
    if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg"
    if (ext === ".png") return "image/png"
    if (ext === ".webp") return "image/webp"
    if (ext === ".svg") return "image/svg+xml"

    return "application/octet-stream"
  }
}
