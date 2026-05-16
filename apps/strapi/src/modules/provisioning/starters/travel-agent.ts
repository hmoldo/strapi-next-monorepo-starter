import type { Core } from "@strapi/strapi"

import { uploadLocalFile } from "../utils"

const DESTINATIONS_SEED = [
  { title: "Bali", location: "Indonesia", slug: "bali", imageName: "bali.jpg" },
  {
    title: "Lalibela",
    location: "Ethiopia",
    slug: "lalibela",
    imageName: "lalibela.jpg",
  },
  {
    title: "Santorini",
    location: "Greece",
    slug: "santorini",
    imageName: "santorini.jpg",
  },
  { title: "Kyoto", location: "Japan", slug: "kyoto", imageName: "kyoto.jpg" },
]

async function findExistingMedia(strapi: Core.Strapi, filename: string) {
  const files = await strapi.entityService.findMany("plugin::upload.file", {
    filters: {
      $or: [
        { name: filename },
        { name: filename.split(".")[0] },
        { hash: { $contains: filename.split(".")[0] } },
      ],
    },
  })

  return Array.isArray(files) && files.length > 0 ? files[0] : null
}

export const initTravelAgent = async (strapi: Core.Strapi) => {
  strapi.log.info("🌴 Travel Agent: starting data check...")

  const destinationType = strapi.contentTypes["api::destination.destination"]
  const pageType = strapi.contentTypes["api::page.page"]
  if (!destinationType || !pageType) {
    strapi.log.warn("❌ Missing required content schemas for execution.")

    return
  }

  const existingDestinations = await strapi.entityService.count(
    "api::destination.destination"
  )
  const existingPages = await strapi.entityService.findMany("api::page.page", {
    filters: { slug: "home" },
  })

  const hasHome = Array.isArray(existingPages) && existingPages.length > 0

  if (existingDestinations > 0 && hasHome) {
    strapi.log.info(
      "ℹ️ Destinations and Home Page are both already configured. Skipping seed engine."
    )

    return
  }

  // Array to hold references of created records to feed into the page carousel
  const carouselImagesData: any[] = []

  // 1. Seed Destinations
  if (existingDestinations === 0) {
    strapi.log.info("✨ Seeding text and media assets for destinations...")
    for (const data of DESTINATIONS_SEED) {
      try {
        let uploadedImage = await findExistingMedia(strapi, data.imageName)

        if (!uploadedImage) {
          const imagePath = `starters/travel-agent/${data.imageName}`
          uploadedImage = await uploadLocalFile(strapi, imagePath)
        }

        await strapi.entityService.create("api::destination.destination", {
          data: {
            title: data.title,
            location: data.location,
            slug: data.slug,
            image: uploadedImage ? [uploadedImage.id] : [],
            publishedAt: new Date(),
          },
        })
        strapi.log.info(`   ✅ Seeded Destination Content: ${data.title}`)

        // Capture properties to build the companion homepage carousel item
        if (uploadedImage) {
          carouselImagesData.push({
            image: {
              media: uploadedImage.id,
              alt: `${data.title}, ${data.location}`,
              width: uploadedImage.width || 1200,
              height: uploadedImage.height || 800,
            },
            link: {
              type: "page",
              label: `Explore ${data.title}`,
              href: `/destinations/${data.slug}`,
              newTab: false,
            },
          })
        }
      } catch (err: any) {
        strapi.log.error(
          `   🛑 Destination pipeline error [${data.title}]: ${err.message}`
        )
      }
    }
  } else {
    // Fallback: If destinations already existed, fetch media nodes to reconstruct links
    strapi.log.info(
      "ℹ️ Destinations exist. Re-indexing reference links for landing composition..."
    )
    const destinations = await strapi.entityService.findMany(
      "api::destination.destination",
      {
        populate: { image: true },
      }
    )

    for (const dest of destinations as any[]) {
      const mediaItem =
        Array.isArray(dest.image) && dest.image.length > 0
          ? dest.image[0]
          : null
      if (mediaItem) {
        carouselImagesData.push({
          image: {
            media: mediaItem.id,
            alt: dest.title,
            width: mediaItem.width || 1200,
            height: mediaItem.height || 800,
          },
          link: {
            type: "page",
            label: `Explore ${dest.title}`,
            href: `/destinations/${dest.slug}`,
            newTab: false,
          },
        })
      }
    }
  }

  // 2. Seed Home Page
  if (!hasHome) {
    try {
      strapi.log.info(
        "📄 Constructing landing infrastructure tree hierarchy..."
      )

      let heroBgFile = await findExistingMedia(strapi, "hero-bg.jpg")

      if (!heroBgFile) {
        heroBgFile = await uploadLocalFile(
          strapi,
          "starters/travel-agent/hero-bg.jpg"
        )
      }

      if (!heroBgFile) {
        throw new Error("Could not resolve or upload master hero-bg.jpg asset.")
      }

      const homePage = await strapi.entityService.create("api::page.page", {
        data: {
          title: "Welcome to Worldly Travel",
          breadcrumbTitle: "Home",
          slug: "home",
          fullPath: "/",
          publishedAt: new Date(),
          content: [
            {
              __component: "sections.image-with-cta-button",
              title: "Wander Farther. Discover Deeper.",
              subText:
                "Custom luxury itineraries designed around authentic cultural excursions.",
              image: {
                media: heroBgFile.id,
                alt: "Worldly Travel Masthead Background",
                width: 1920,
                height: 1080,
              },
              link: {
                type: "page",
                label: "Explore Packages",
                href: "/destinations",
                newTab: false,
              },
            },
            {
              __component: "sections.heading-with-cta-button",
              title: "Featured Destinations",
              subText: "Handpicked locations perfect for your next getaway.",
              cta: {
                type: "page",
                label: "View All Locations",
                href: "/destinations",
                newTab: false,
              },
            },
            {
              __component: "sections.carousel",
              radius: "md",
              images: carouselImagesData,
            },
          ],
        },
      })

      if (homePage && homePage.fullPath !== "/") {
        await strapi.entityService.update("api::page.page", homePage.id, {
          data: { fullPath: "/" },
        })
      }

      strapi.log.info(
        "   🎉 Seeding engine executed successfully. Home page created with dynamic carousel data."
      )
    } catch (pageErr: any) {
      strapi.log.error(
        `   🛑 Landing page composition failed: ${pageErr.message}`
      )
    }
  }
}
