// apps/strapi/src/modules/provisioning/starters/travel-agent.ts
import type { StarterManifest } from "../factory"

export const travelAgentManifest: StarterManifest = {
  id: "travel-agent",
  destinations: [
    {
      title: "Santorini Getaway",
      location: "Greece",
      slug: "santorini",
      imageName: "santorini.jpg",
    },
    {
      title: "Kyoto Exploration",
      location: "Japan",
      slug: "kyoto",
      imageName: "kyoto.jpg",
    },
  ],
  navbar: {
    logoText: "Roam & Explore",
    links: [
      { label: "Home", href: "/" },
      { label: "Destinations", href: "/destinations" },
      { label: "Contact Us", href: "/contact" },
    ],
  },
  footer: {
    sections: [
      {
        title: "Company",
        links: [
          { label: "About Us", href: "/about" },
          { label: "Careers", href: "/careers" },
        ],
      },
    ],
  },
  pages: [
    {
      title: "Homepage",
      slug: "home",
      fullPath: "/",
      content: [
        {
          __component: "sections.hero",
          title: "Discover Your Next Great Adventure",
          description:
            "Tailor-made luxury itineraries managed by expert regional guides.",
          ctaButtons: [
            { label: "Explore Trips", href: "/destinations", type: "primary" },
          ],
        },
      ],
    },
  ],
}
