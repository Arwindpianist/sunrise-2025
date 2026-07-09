import { Skeleton } from "@/components/ui/skeleton"

export default function OnboardingLoading() {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-12">
      <Skeleton className="mx-auto mb-6 h-10 w-3/4 max-w-md" />
      <Skeleton className="h-[420px] w-full rounded-xl" />
    </div>
  )
}
