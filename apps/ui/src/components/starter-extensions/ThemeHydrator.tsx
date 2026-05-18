// apps/ui/src/components/starter-extensions/ThemeHydrator.tsx
"use client"

import { useEffect } from "react"

interface ThemeHydratorProps {
  theme: string
}

export default function ThemeHydrator({ theme }: ThemeHydratorProps) {
  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  return null
}
