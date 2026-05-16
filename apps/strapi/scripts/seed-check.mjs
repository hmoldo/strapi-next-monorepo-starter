#!/usr/bin/env node

/* eslint-disable no-console */

import { createRequire } from "node:module"
import path from "node:path"
import process from "node:process"
import { fileURLToPath } from "node:url"

const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const require = createRequire(import.meta.url)

const REQUIRED_DOCUMENTS = [
  { label: "Page", uid: "api::page.page" },
  { label: "Navbar", uid: "api::navbar.navbar" },
  { label: "Footer", uid: "api::footer.footer" },
]

// Ensure telemetry configurations are disabled early
process.env.STRAPI_TELEMETRY_DISABLED ??= "1"
normalizeDatabaseHost()

const { compileStrapi, createStrapi } = require("@strapi/strapi")

async function loadStrapi() {
  const appContext = await compileStrapi({
    appDir,
    distDir: path.join(appDir, "dist"),
    autoReload: false,
    serveAdminPanel: false,
  })

  const app = createStrapi(appContext)
  app.log.level = "error" // Suppress standard boot spam logs

  return app.load()
}

function normalizeDatabaseHost() {
  if (process.env.DATABASE_HOST === "0.0.0.0") {
    process.env.DATABASE_HOST = "localhost"
  }
}

async function runCheck() {
  let strapiInstance = null
  let exitCode = 0

  try {
    strapiInstance = await loadStrapi()

    const states = []
    for (const { label, uid } of REQUIRED_DOCUMENTS) {
      const doc = await strapiInstance.documents(uid).findFirst({
        fields: ["documentId"],
      })

      const exists = doc !== null
      console.log(`[seed:check] ${label}: ${exists ? "exists" : "missing"}`)
      states.push({ label, exists })
    }

    const missing = states.filter(({ exists }) => !exists)

    if (missing.length > 0) {
      console.log(
        `[seed:check] Missing baseline content in: ${missing.map((m) => m.label).join(", ")}`
      )
      exitCode = 10
    } else {
      console.log("[seed:check] Baseline content exists.")
    }
  } catch (error) {
    console.error("[seed:check] Failed to check seed state.")
    console.error(error instanceof Error ? error.stack || error.message : error)
    exitCode = 1
  } finally {
    if (strapiInstance) {
      try {
        // Give hidden background queries a tiny window to settle down
        await new Promise((resolve) => setTimeout(resolve, 100))
        await strapiInstance.destroy()
      } catch {
        // Suppress any leftover pool complaints during teardown
      }
    }

    process.exit(exitCode)
  }
}

// Execute clean engine pipeline
await runCheck()
