import { resolveEffectiveBrandId } from "@/lib/request-brand"

const SUNRISE_URL = process.env.NEXT_PUBLIC_SUNRISE_URL ?? "https://sunrise-2025.com"
const SUNSET_URL = process.env.NEXT_PUBLIC_SUNSET_URL ?? "https://sunset-2025.com"

export default async function TermsPage() {
  const isSunset = (await resolveEffectiveBrandId("sunrise")) === "sunset"
  const pageBg = isSunset
    ? "sunset-marketing min-h-screen bg-background text-foreground"
    : "min-h-screen bg-gradient-to-br from-orange-50 via-rose-50 to-amber-50"
  const panel = isSunset
    ? "sunset-panel rounded-lg border border-border p-8 space-y-6"
    : "rounded-lg border border-border bg-card/80 p-8 backdrop-blur-sm space-y-6"
  const h1 = "mb-8 text-4xl font-bold text-foreground"
  const h2 = "mb-3 text-xl font-semibold text-foreground"
  const body = "text-muted-foreground"
  const meta = "mb-6 text-sm text-muted-foreground"
  const link = isSunset ? "text-primary hover:text-primary/90 underline-offset-2" : "text-orange-500 hover:text-orange-600"
  const h3 = "mb-3 text-lg font-semibold text-foreground"
  const borderFoot = "mt-6 border-t border-border pt-6"

  const primarySite = isSunset ? SUNSET_URL : SUNRISE_URL
  const productName = isSunset ? "Sunset" : "Sunrise"

  return (
    <div className={pageBg}>
      <div className="container mx-auto py-16 px-4">
        <h1 className={h1}>Terms of Service</h1>
        <div className={panel}>
          <div className={meta}>
            <strong>Effective Date:</strong> July 19, 2025
          </div>

          <p className={body}>
            By accessing{" "}
            <a href={primarySite} className={link}>
              {primarySite.replace(/^https?:\/\//, "")}
            </a>{" "}
            and related <strong className={isSunset ? "text-foreground" : ""}>Sunrise</strong> and{" "}
            <strong className={isSunset ? "text-foreground" : ""}>Sunset</strong> services, you agree to these terms. The
            services are operated by <strong className={isSunset ? "text-foreground" : ""}>Sunrise Sunset Services</strong>{" "}
            (also referred to as &quot;we&quot; or &quot;us&quot;). {productName} is one brand experience; your account may
            apply across both brands under the same operator.
          </p>
          <p className={`${body} text-sm`}>
            Reference sites:{" "}
            <a href={SUNRISE_URL} className={link}>
              Sunrise
            </a>
            {" · "}
            <a href={SUNSET_URL} className={link}>
              Sunset
            </a>
            .
          </p>

          <div>
            <h2 className={h2}>1. Use of the Site</h2>
            <p className={`${body} mb-2`}>You agree to:</p>
            <ul className={`list-disc list-inside space-y-1 ${body}`}>
              <li>Use this site only for lawful purposes</li>
              <li>Not attempt to disrupt, reverse engineer, or exploit the site</li>
              <li>Not reuse or reproduce content without permission</li>
            </ul>
          </div>

          <div>
            <h2 className={h2}>2. Intellectual Property</h2>
            <p className={body}>
              All tools, content, and branding are the property of Sunrise Sunset Services unless otherwise stated.
              Unauthorized use or reproduction is prohibited.
            </p>
          </div>

          <div>
            <h2 className={h2}>3. Payment (If Applicable)</h2>
            <p className={`${body} mb-2`}>For any premium services:</p>
            <ul className={`list-disc list-inside space-y-1 ${body}`}>
              <li>You agree to provide accurate payment information</li>
              <li>Refunds are not guaranteed unless legally required</li>
            </ul>
          </div>

          <div>
            <h2 className={h2}>4. Limitation of Liability</h2>
            <p className={`${body} mb-2`}>We are not responsible for:</p>
            <ul className={`list-disc list-inside space-y-1 ${body}`}>
              <li>Service downtime</li>
              <li>Loss of data</li>
              <li>Inaccurate results or damages arising from use</li>
            </ul>
          </div>

          <div>
            <h2 className={h2}>5. Termination</h2>
            <p className={body}>We reserve the right to suspend access for violations of these terms.</p>
          </div>

          <div>
            <h2 className={h2}>6. Governing Law</h2>
            <p className={body}>
              These terms are governed by the laws of <strong className={isSunset ? "text-foreground" : ""}>Malaysia</strong>.
            </p>
          </div>

          <div className={borderFoot}>
            <h3 className={h3}>Contact Us</h3>
            <div className={`${body} space-y-1`}>
              <p>
                Email:{" "}
                <a href="mailto:admin@sunrise-2025.com" className={link}>
                  admin@sunrise-2025.com
                </a>
              </p>
              <p>
                <strong className={isSunset ? "text-foreground" : ""}>Sunrise Sunset Services</strong>
              </p>
              <p>Business Registration No: 202503184225 (CT0152300-K)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
