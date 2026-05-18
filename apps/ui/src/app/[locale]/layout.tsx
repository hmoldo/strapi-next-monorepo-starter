// apps/ui/src/app/[locale]/layout.tsx
import "@/styles/globals.css"

import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Script from "next/script"
import { setRequestLocale } from "next-intl/server"

import { ErrorBoundary } from "@/components/elementary/ErrorBoundary"
import StrapiPreviewListener from "@/components/elementary/StrapiPreviewListener"
import { TailwindIndicator } from "@/components/elementary/TailwindIndicator"
import StrapiFooter from "@/components/page-builder/single-types/footer/StrapiFooter"
import StrapiNavbar from "@/components/page-builder/single-types/navbar/StrapiNavbar"
import { ClientProviders } from "@/components/providers/ClientProviders"
import { ServerProviders } from "@/components/providers/ServerProviders"
import TrackingScripts from "@/components/providers/TrackingScripts"
import ThemeHydrator from "@/components/starter-extensions/ThemeHydrator"
import { Toaster } from "@/components/ui/sonner"
import { debugStaticParams } from "@/lib/build"
import { fontRoboto } from "@/lib/fonts"
import { isValidLocale, routing } from "@/lib/navigation"
import { cn } from "@/lib/styles"

export function generateStaticParams() {
  const locales = routing.locales.map((locale) => ({ locale }))
  debugStaticParams(locales, "[locale]")

  return locales
}

export const metadata: Metadata = {
  title: {
    template: "%s / Notum Technologies",
    default: "",
  },
}

const CSR_ENVs = [
  "NODE_ENV",
  "DEBUG_STRAPI_CLIENT_API_CALLS",
  "SHOW_NON_BLOCKING_ERRORS",
  "APP_PUBLIC_URL",
  "IMGPROXY_URL",
] as const

export default async function RootLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const { locale } = await params

  if (!isValidLocale(locale)) {
    notFound()
  }

  setRequestLocale(locale)

  // Pull our modular starter target config profile (defaults safely to travel-agent)
  const currentStarter = process.env.STRAPI_STARTER || "travel-agent"

  // Reduce the environment mapping config parameters cleanly
  const clientEnvConfig = CSR_ENVs.reduce(
    (acc, curr) => {
      acc[curr] = process.env[curr]

      return acc
    },
    {} as Record<string, string | undefined>
  )

  return (
    <html lang={locale} data-theme={currentStarter} suppressHydrationWarning>
      <head>
        <Script id="csr-config" strategy="beforeInteractive">
          {`
            window.CSR_CONFIG = window.CSR_CONFIG || {};
            Object.assign(window.CSR_CONFIG, ${JSON.stringify(clientEnvConfig)});
          `}
        </Script>
      </head>
      <body
        className={cn(
          "min-h-screen font-sans antialiased",
          fontRoboto.variable
        )}
      >
        {/* Isolated starter component synchronization node */}
        <ThemeHydrator theme={currentStarter} />

        <TrackingScripts />
        <ServerProviders>
          <StrapiPreviewListener />
          <ClientProviders>
            <div className="relative flex min-h-screen flex-col">
              <ErrorBoundary showErrorMessage>
                <StrapiNavbar locale={locale} />
              </ErrorBoundary>

              <div className="flex-1">
                <div>{children}</div>
              </div>

              <TailwindIndicator />

              <Toaster />

              <ErrorBoundary hideFallback>
                <StrapiFooter locale={locale} />
              </ErrorBoundary>
            </div>
          </ClientProviders>
        </ServerProviders>
      </body>
    </html>
  )
}
