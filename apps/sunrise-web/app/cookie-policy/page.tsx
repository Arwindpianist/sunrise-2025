import { resolveEffectiveBrandId } from "@/lib/request-brand"

const SUNRISE_URL = process.env.NEXT_PUBLIC_SUNRISE_URL ?? "https://sunrise-2025.com"
const SUNSET_URL = process.env.NEXT_PUBLIC_SUNSET_URL ?? "https://sunset-2025.com"

export default async function CookiePolicyPage() {
  const isSunset = (await resolveEffectiveBrandId("sunrise")) === "sunset"
  const pageBg = isSunset
    ? "sunset-marketing min-h-screen bg-background text-foreground"
    : "min-h-screen bg-gradient-to-br from-orange-50 via-rose-50 to-amber-50"
  const panel = isSunset
    ? "sunset-panel rounded-lg border border-border p-8 space-y-6"
    : "bg-white/50 backdrop-blur-sm rounded-lg p-8 space-y-6"
  const h1 = isSunset ? "text-4xl font-bold text-foreground mb-8" : "text-4xl font-bold text-gray-800 mb-8"
  const h2 = isSunset ? "text-xl font-semibold text-foreground mb-3" : "text-xl font-semibold text-gray-800 mb-3"
  const h3 = isSunset ? "font-semibold text-foreground mb-2" : "font-semibold text-gray-700 mb-2"
  const h4 = isSunset ? "font-semibold text-foreground mb-2" : "font-semibold text-gray-800 mb-2"
  const body = isSunset ? "text-muted-foreground" : "text-gray-600"
  const meta = isSunset ? "text-sm text-muted-foreground mb-6" : "text-sm text-gray-500 mb-6"
  const link = isSunset ? "text-primary hover:text-primary/90 underline-offset-2" : "text-orange-500 hover:text-orange-600"
  const h3footer = isSunset ? "text-lg font-semibold text-foreground mb-3" : "text-lg font-semibold text-gray-800 mb-3"
  const borderFoot = isSunset ? "border-t border-border pt-6 mt-6" : "border-t border-gray-200 pt-6 mt-6"
  const tableBorder = isSunset ? "border-border" : "border-gray-300"
  const tableHead = isSunset ? "bg-muted/50" : "bg-gray-50"

  return (
    <div className={pageBg}>
      <div className="container mx-auto py-16 px-4">
        <h1 className={h1}>Cookie Policy</h1>
        <div className={panel}>
          <div className={meta}>
            <strong>Effective Date:</strong> January 2025
            <br />
            <strong>Last Updated:</strong> January 2025
          </div>

          <p className={body}>
            This Cookie Policy explains how <strong className={isSunset ? "text-foreground" : ""}>Sunrise Sunset Services</strong>{" "}
            (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) uses cookies when you visit{" "}
            <strong className={isSunset ? "text-foreground" : ""}>Sunrise</strong> or{" "}
            <strong className={isSunset ? "text-foreground" : ""}>Sunset</strong> sites, including{" "}
            <a href={SUNRISE_URL} className={link}>
              {SUNRISE_URL.replace(/^https?:\/\//, "")}
            </a>{" "}
            and{" "}
            <a href={SUNSET_URL} className={link}>
              {SUNSET_URL.replace(/^https?:\/\//, "")}
            </a>
            . Read this alongside our Privacy Policy and Terms of Service.
          </p>

          <div>
            <h2 className={h2}>1. What Are Cookies?</h2>
            <p className={`${body} mb-3`}>
              Cookies are small text files stored on your device when you visit a website. They help remember preferences and
              improve your experience.
            </p>
            <p className={body}>
              We use cookies and similar technologies to enhance your experience, analyze site usage, and provide personalized
              content and advertisements where allowed.
            </p>
          </div>

          <div>
            <h2 className={h2}>2. Types of Cookies We Use</h2>
            <div className="space-y-4">
              <div>
                <h3 className={h3}>Essential Cookies</h3>
                <p className={`${body} mb-2`}>
                  Necessary for the website to function. Usually set in response to actions you take:
                </p>
                <ul className={`list-disc list-inside space-y-1 ml-4 ${body}`}>
                  <li>Privacy preferences</li>
                  <li>Logging in or filling in forms</li>
                  <li>Session security</li>
                  <li>Authentication status</li>
                </ul>
              </div>

              <div>
                <h3 className={h3}>Performance Cookies</h3>
                <p className={`${body} mb-2`}>
                  Help us measure visits and traffic sources. Information is typically aggregated.
                </p>
                <ul className={`list-disc list-inside space-y-1 ml-4 ${body}`}>
                  <li>Google Analytics cookies</li>
                  <li>Site performance monitoring</li>
                  <li>Error tracking and reporting</li>
                </ul>
              </div>

              <div>
                <h3 className={h3}>Functional Cookies</h3>
                <p className={`${body} mb-2`}>Enable enhanced functionality and personalization.</p>
                <ul className={`list-disc list-inside space-y-1 ml-4 ${body}`}>
                  <li>Language preferences</li>
                  <li>User interface customization</li>
                  <li>Form auto-completion</li>
                  <li>Feature preferences</li>
                </ul>
              </div>

              <div>
                <h3 className={h3}>Marketing Cookies</h3>
                <p className={`${body} mb-2`}>
                  May be set by advertising partners to build a profile of interests. Requires consent where required.
                </p>
                <ul className={`list-disc list-inside space-y-1 ml-4 ${body}`}>
                  <li>Google AdSense cookies</li>
                  <li>Social media integration cookies</li>
                  <li>Advertising tracking cookies</li>
                </ul>
              </div>
            </div>
          </div>

          <div>
            <h2 className={h2}>3. Third-Party Cookies</h2>
            <p className={`${body} mb-3`}>
              Third-party services may set cookies to help us provide a better experience.
            </p>
            <div className="space-y-3">
              <div className={isSunset ? "rounded-lg border border-border bg-card/80 p-4" : "rounded-lg border border-blue-200 bg-blue-50 p-4"}>
                <h4 className={h4}>Google Services</h4>
                <ul className={`text-sm space-y-1 ${isSunset ? "text-muted-foreground" : "text-blue-700"}`}>
                  <li>
                    <strong className={isSunset ? "text-foreground" : ""}>Google Analytics:</strong> analytics and performance
                  </li>
                  <li>
                    <strong className={isSunset ? "text-foreground" : ""}>Google AdSense:</strong> advertising
                  </li>
                  <li>
                    <strong className={isSunset ? "text-foreground" : ""}>Google Fonts:</strong> typography
                  </li>
                </ul>
              </div>

              <div className={isSunset ? "rounded-lg border border-border bg-card/80 p-4" : "rounded-lg border border-green-200 bg-green-50 p-4"}>
                <h4 className={h4}>App data and sign-in</h4>
                <ul className={`text-sm space-y-1 ${isSunset ? "text-muted-foreground" : "text-green-700"}`}>
                  <li>
                    <strong className={isSunset ? "text-foreground" : ""}>Neon (PostgreSQL):</strong> application data storage
                  </li>
                  <li>
                    <strong className={isSunset ? "text-foreground" : ""}>NextAuth.js:</strong> login, sessions, and auth cookies
                    where applicable
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div>
            <h2 className={h2}>4. How to Control Cookies</h2>
            <div className="space-y-4">
              <div>
                <h3 className={h3}>Browser Settings</h3>
                <p className={`${body} mb-2`}>
                  Most browsers let you control cookies through settings. Restricting cookies may affect functionality.
                </p>
                <ul className={`list-disc list-inside space-y-1 ml-4 ${body}`}>
                  <li>Chrome: Settings → Privacy and security → Cookies and other site data</li>
                  <li>Firefox: Options → Privacy &amp; Security → Cookies and Site Data</li>
                  <li>Safari: Preferences → Privacy → Manage Website Data</li>
                  <li>Edge: Settings → Cookies and site permissions → Cookies</li>
                </ul>
              </div>

              <div>
                <h3 className={h3}>Cookie Consent</h3>
                <p className={body}>
                  When you first visit, you may see a cookie banner. You can change preferences via cookie settings in the
                  footer where available.
                </p>
              </div>

              <div>
                <h3 className={h3}>Opt-Out Links</h3>
                <p className={`${body} mb-2`}>For some third-party cookies, you can opt out directly:</p>
                <ul className={`list-disc list-inside space-y-1 ml-4 ${body}`}>
                  <li>
                    <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className={link}>
                      Google Analytics Opt-out
                    </a>
                  </li>
                  <li>
                    <a href="https://adssettings.google.com/" target="_blank" rel="noopener noreferrer" className={link}>
                      Google AdSense Settings
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div>
            <h2 className={h2}>5. Cookie Retention Periods</h2>
            <div className="overflow-x-auto">
              <table className={`w-full border-collapse border ${tableBorder}`}>
                <thead>
                  <tr className={tableHead}>
                    <th className={`border px-4 py-2 text-left ${tableBorder}`}>Cookie Type</th>
                    <th className={`border px-4 py-2 text-left ${tableBorder}`}>Purpose</th>
                    <th className={`border px-4 py-2 text-left ${tableBorder}`}>Duration</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className={`border px-4 py-2 ${tableBorder} ${body}`}>Session Cookies</td>
                    <td className={`border px-4 py-2 ${tableBorder} ${body}`}>Maintain user session</td>
                    <td className={`border px-4 py-2 ${tableBorder} ${body}`}>Until browser closes</td>
                  </tr>
                  <tr>
                    <td className={`border px-4 py-2 ${tableBorder} ${body}`}>Authentication</td>
                    <td className={`border px-4 py-2 ${tableBorder} ${body}`}>User login status</td>
                    <td className={`border px-4 py-2 ${tableBorder} ${body}`}>1 year</td>
                  </tr>
                  <tr>
                    <td className={`border px-4 py-2 ${tableBorder} ${body}`}>Analytics</td>
                    <td className={`border px-4 py-2 ${tableBorder} ${body}`}>Website performance</td>
                    <td className={`border px-4 py-2 ${tableBorder} ${body}`}>2 years</td>
                  </tr>
                  <tr>
                    <td className={`border px-4 py-2 ${tableBorder} ${body}`}>Preferences</td>
                    <td className={`border px-4 py-2 ${tableBorder} ${body}`}>User settings</td>
                    <td className={`border px-4 py-2 ${tableBorder} ${body}`}>1 year</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h2 className={h2}>6. Updates to This Policy</h2>
            <p className={body}>
              We may update this Cookie Policy from time to time. Material changes will be posted here with an updated
              &quot;Last Updated&quot; date.
            </p>
          </div>

          <div className={borderFoot}>
            <h3 className={h3footer}>Contact Us</h3>
            <p className={`${body} mb-2`}>Questions about cookies:</p>
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
              <p>Malaysia</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
