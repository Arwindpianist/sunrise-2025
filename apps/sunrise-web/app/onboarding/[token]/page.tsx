import { OnboardingForm } from "./onboarding-form"

export default async function OnboardingPage(props: { params: Promise<{ token: string }> }) {
  const { token } = await props.params
  return <OnboardingForm token={token} />
}
