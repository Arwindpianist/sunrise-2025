"use client"

import * as React from "react"
import type { BrandId } from "@repo/shared-types"

const BrandContext = React.createContext<{ brand: BrandId }>({ brand: "sunrise" })

/**
 * Pass resolved brand from the root layout (compute with getEffectiveBrandId on the server).
 */
export function BrandProvider({
  children,
  brand,
}: {
  children: React.ReactNode
  brand: BrandId
}) {
  return (
    <BrandContext.Provider value={{ brand }}>{children}</BrandContext.Provider>
  )
}

export function useBrand(): BrandId {
  return React.useContext(BrandContext).brand
}
