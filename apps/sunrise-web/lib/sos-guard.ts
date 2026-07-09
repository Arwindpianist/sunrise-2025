import { NextResponse } from "next/server"
import { featureFlags } from "@/lib/feature-flags"

export const getSosDisabledResponse = () =>
  NextResponse.json(
    { error: "SOS is temporarily paused while upgrades are in progress." },
    { status: 503 },
  )

export const isSosEnabled = () => featureFlags.enableSos

