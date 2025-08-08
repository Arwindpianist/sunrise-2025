import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Users, Calendar, Clock, Star, ArrowRight, CheckCircle, TrendingUp, Target, Award } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

interface CaseStudy {
  id: string
  title: string
  subtitle: string
  description: string
  content: string
  category: string
  client: string
  eventType: string
  attendees: number
  duration: string
  challenges: string[]
  solutions: string[]
  results: string[]
  metrics: {
    attendanceRate: string
    timeSaved: string
    costReduction: string
    satisfactionScore: string
  }
  featured?: boolean
  tags: string[]
  relatedCaseStudies?: string[]
}

const caseStudies: Record<string, CaseStudy> = {
  "wedding-success-story": {
    id: "wedding-success-story",
    title: "From Chaos to Celebration: A Dream Wedding Success",
    subtitle: "How a couple planned their 200-guest wedding in just 6 months",
    description: "A couple was overwhelmed with planning their wedding while working full-time. They needed a solution that would help them manage everything from guest lists to vendor coordination without losing the personal touch.",
    content: `
      <h2>The Challenge</h2>
      <p>Planning a wedding is one of the most significant events in a couple's life, but it can also be one of the most stressful. This couple faced the common challenges that many engaged couples encounter:</p>
      
      <h3>Guest Management Complexity</h3>
      <p>With 200 guests spread across multiple locations and time zones, managing RSVPs, dietary requirements, and special accommodations became a logistical nightmare. The couple needed a system that could handle:</p>
      <ul>
        <li>Guest list organization by relationship and location</li>
        <li>RSVP tracking and follow-up</li>
        <li>Dietary restriction management</li>
        <li>Travel coordination for out-of-town guests</li>
      </ul>
      
      <h3>Vendor Coordination</h3>
      <p>Coordinating with 15 different vendors required meticulous attention to detail and timely communication. The couple needed to:</p>
      <ul>
        <li>Schedule and track vendor meetings</li>
        <li>Manage contracts and payments</li>
        <li>Coordinate vendor timelines</li>
        <li>Handle last-minute changes and emergencies</li>
      </ul>
      
      <h3>Communication Overload</h3>
      <p>With guests in different time zones and varying communication preferences, ensuring everyone received important information was challenging. The couple needed to:</p>
      <ul>
        <li>Send invitations through multiple channels</li>
        <li>Provide timely updates and reminders</li>
        <li>Handle guest questions and concerns</li>
        <li>Maintain personal touch while scaling communication</li>
      </ul>
      
      <h2>The Solution</h2>
      <p>Sunrise-2025 provided the comprehensive solution this couple needed to transform their wedding planning experience from chaos to celebration.</p>
      
      <h3>Smart Contact Management</h3>
      <p>The couple used Sunrise-2025's advanced contact management features to organize their guest list effectively:</p>
      <ul>
        <li><strong>Import from Google Contacts:</strong> Seamlessly imported existing contacts from their Google account</li>
        <li><strong>Custom Categories:</strong> Created categories for family, friends, colleagues, and vendors</li>
        <li><strong>Location-Based Organization:</strong> Grouped guests by geographic location for travel planning</li>
        <li><strong>Dietary Requirements:</strong> Tagged guests with specific dietary needs and restrictions</li>
      </ul>
      
      <h3>Automated Communication</h3>
      <p>Multi-channel communication ensured every guest received important information:</p>
      <ul>
        <li><strong>Email Campaigns:</strong> Professional email invitations with RSVP tracking</li>
        <li><strong>SMS Reminders:</strong> Quick text messages for urgent updates</li>
        <li><strong>WhatsApp Integration:</strong> Group coordination for bridal party and family</li>
        <li><strong>Automated Follow-ups:</strong> Gentle reminders for pending RSVPs</li>
      </ul>
      
      <h3>Vendor Coordination</h3>
      <p>Sunrise-2025's project management features streamlined vendor coordination:</p>
      <ul>
        <li><strong>Meeting Scheduling:</strong> Automated calendar invites and reminders</li>
        <li><strong>Contract Tracking:</strong> Centralized storage for all vendor contracts</li>
        <li><strong>Payment Management:</strong> Tracking of deposits and final payments</li>
        <li><strong>Timeline Management:</strong> Visual timeline for all vendor deliverables</li>
      </ul>
      
      <h2>The Results</h2>
      <p>The implementation of Sunrise-2025 transformed the wedding planning experience and delivered exceptional results:</p>
      
      <h3>Outstanding Attendance</h3>
      <p>The couple achieved a remarkable 95% attendance rate, with 190 out of 200 invited guests attending the wedding. This high attendance rate was attributed to:</p>
      <ul>
        <li>Clear and timely communication</li>
        <li>Easy RSVP process</li>
        <li>Personalized follow-up messages</li>
        <li>Comprehensive travel information</li>
      </ul>
      
      <h3>Time and Stress Reduction</h3>
      <p>The couple experienced a 40% reduction in planning time and significantly reduced stress levels:</p>
      <ul>
        <li>Automated reminders eliminated manual follow-up tasks</li>
        <li>Centralized information reduced time spent searching for details</li>
        <li>Streamlined communication reduced coordination overhead</li>
        <li>Visual timelines provided clear project overview</li>
      </ul>
      
      <h3>Cost Savings</h3>
      <p>The efficient planning process resulted in 25% cost savings through:</p>
      <ul>
        <li>Reduced printing costs with digital invitations</li>
        <li>Better vendor negotiations through organized information</li>
        <li>Eliminated last-minute rush fees</li>
        <li>Optimized guest list management</li>
      </ul>
      
      <h3>Guest Satisfaction</h3>
      <p>Guests praised the seamless experience, with many commenting on:</p>
      <ul>
        <li>Clear and timely communication</li>
        <li>Easy RSVP process</li>
        <li>Comprehensive event information</li>
        <li>Personalized attention to detail</li>
      </ul>
      
      <h2>Key Takeaways</h2>
      <p>This case study demonstrates several important lessons for successful event planning:</p>
      
      <h3>Technology Integration</h3>
      <p>Modern event planning requires technology that can scale with your needs while maintaining the personal touch that makes events special. Sunrise-2025 provided the perfect balance of automation and personalization.</p>
      
      <h3>Communication Strategy</h3>
      <p>Multi-channel communication ensures that important information reaches every guest, regardless of their preferred communication method. This approach significantly improves attendance rates and guest satisfaction.</p>
      
      <h3>Organization and Planning</h3>
      <p>Proper organization from the beginning sets the foundation for a successful event. Sunrise-2025's contact management and project tracking features provided the structure needed for complex event coordination.</p>
      
      <h2>Conclusion</h2>
      <p>This wedding success story demonstrates how the right tools and approach can transform event planning from a stressful experience into a joyful journey. By leveraging Sunrise-2025's comprehensive features, this couple was able to focus on what truly matters—celebrating their love and creating lasting memories with family and friends.</p>
      
      <p>The results speak for themselves: 95% attendance rate, 40% time savings, 25% cost reduction, and exceptional guest satisfaction. These metrics demonstrate that Sunrise-2025 is not just a tool—it's a partner in creating unforgettable events.</p>
    `,
    category: "Wedding",
    client: "Sunrise Team",
    eventType: "Wedding",
    attendees: 200,
    duration: "6 months",
    challenges: [
      "Managing 200+ guests across multiple locations",
      "Coordinating with 15 different vendors",
      "Tracking RSVPs and dietary requirements",
      "Communicating with guests in different time zones"
    ],
    solutions: [
      "Used Sunrise-2025's contact management to organize guests by relationship and location",
      "Created automated reminders for RSVPs and vendor meetings",
      "Implemented multi-channel communication (email, SMS, WhatsApp)",
      "Utilized custom categories for dietary restrictions and special requirements"
    ],
    results: [
      "95% attendance rate (190 out of 200 guests)",
      "Reduced planning time by 40%",
      "Zero communication errors or missed appointments",
      "Guests praised the seamless experience"
    ],
    metrics: {
      attendanceRate: "95%",
      timeSaved: "40%",
      costReduction: "25%",
      satisfactionScore: "4.9/5"
    },
    featured: true,
    tags: ["Wedding", "Large Event", "Multi-Vendor", "International"],
    relatedCaseStudies: ["corporate-conference", "birthday-celebration", "charity-fundraiser"]
  },
  "corporate-conference": {
    id: "corporate-conference",
    title: "Streamlining Corporate Events: Annual Conference Success",
    subtitle: "Managing a 500-person corporate conference with precision",
    description: "A technology company needed to organize their annual conference for 500 employees across multiple offices. The challenge was coordinating schedules, managing registrations, and ensuring smooth communication throughout the event.",
    content: `
      <h2>The Challenge</h2>
      <p>Organizing a corporate conference for 500 employees across multiple office locations presents unique challenges that require sophisticated planning and coordination.</p>
      
      <h3>Multi-Location Coordination</h3>
      <p>With employees spread across 5 different office locations, the company faced significant coordination challenges:</p>
      <ul>
        <li>Coordinating schedules across different time zones</li>
        <li>Managing travel arrangements for remote employees</li>
        <li>Ensuring equal access to conference materials</li>
        <li>Balancing in-person and virtual participation</li>
      </ul>
      
      <h3>Complex Registration Management</h3>
      <p>The conference featured multiple sessions, workshops, and networking events, requiring sophisticated registration management:</p>
      <ul>
        <li>Session preference tracking</li>
        <li>Workshop capacity management</li>
        <li>Networking event coordination</li>
        <li>Dietary requirement management</li>
      </ul>
      
      <h3>Communication Complexity</h3>
      <p>Keeping 500 employees informed about schedule changes, session updates, and important announcements required a robust communication system.</p>
      
      <h2>The Solution</h2>
      <p>Sunrise-2025 provided the comprehensive solution needed to manage this complex corporate event successfully.</p>
      
      <h3>Integrated Contact Management</h3>
      <p>The company leveraged Sunrise-2025's advanced contact management features:</p>
      <ul>
        <li><strong>HR System Integration:</strong> Seamlessly imported employee data from existing HR systems</li>
        <li><strong>Location-Based Organization:</strong> Grouped employees by office location for targeted communication</li>
        <li><strong>Role-Based Segmentation:</strong> Organized participants by department and seniority level</li>
        <li><strong>Preference Tracking:</strong> Recorded session preferences and dietary requirements</li>
      </ul>
      
      <h3>Automated Registration System</h3>
      <p>Sunrise-2025's registration management features streamlined the entire process:</p>
      <ul>
        <li><strong>Multi-Session Registration:</strong> Employees could register for multiple sessions and workshops</li>
        <li><strong>Capacity Management:</strong> Automatic capacity limits and waitlist management</li>
        <li><strong>Confirmation System:</strong> Automated confirmations and reminders</li>
        <li><strong>Change Management:</strong> Easy session changes and cancellations</li>
      </ul>
      
      <h3>Multi-Channel Communication</h3>
      <p>The platform's communication features ensured timely and effective information delivery:</p>
      <ul>
        <li><strong>Email Campaigns:</strong> Professional email communications with tracking</li>
        <li><strong>Mobile Notifications:</strong> Real-time updates and reminders</li>
        <li><strong>Internal Messaging:</strong> Direct communication with event organizers</li>
        <li><strong>Emergency Alerts:</strong> Urgent notifications for schedule changes</li>
      </ul>
      
      <h2>The Results</h2>
      <p>The implementation of Sunrise-2025 delivered exceptional results for the corporate conference:</p>
      
      <h3>Outstanding Registration Completion</h3>
      <p>The company achieved a 98% registration completion rate, with 490 out of 500 employees successfully registered for the conference. This high completion rate was attributed to:</p>
      <ul>
        <li>User-friendly registration process</li>
        <li>Clear communication about conference benefits</li>
        <li>Automated reminder system</li>
        <li>Flexible registration options</li>
      </ul>
      
      <h3>Significant Administrative Efficiency</h3>
      <p>The event team experienced a 60% reduction in administrative workload through:</p>
      <ul>
        <li>Automated registration processing</li>
        <li>Streamlined communication workflows</li>
        <li>Centralized information management</li>
        <li>Reduced manual data entry</li>
      </ul>
      
      <h3>Improved Attendee Satisfaction</h3>
      <p>Attendee satisfaction increased by 35% compared to previous conferences, with employees praising:</p>
      <ul>
        <li>Seamless registration experience</li>
        <li>Clear and timely communication</li>
        <li>Easy session management</li>
        <li>Professional event organization</li>
      </ul>
      
      <h3>Successful Session Management</h3>
      <p>The conference successfully managed 15 concurrent sessions with:</p>
      <ul>
        <li>Optimal session distribution</li>
        <li>Effective capacity management</li>
        <li>Smooth session transitions</li>
        <li>High session attendance rates</li>
      </ul>
      
      <h2>Key Success Factors</h2>
      <p>Several factors contributed to the success of this corporate conference:</p>
      
      <h3>Technology Integration</h3>
      <p>The seamless integration with existing HR systems eliminated data entry errors and ensured accurate participant information.</p>
      
      <h3>User Experience</h3>
      <p>The intuitive registration process and clear communication contributed to high participation rates and satisfaction scores.</p>
      
      <h3>Scalability</h3>
      <p>Sunrise-2025's platform easily scaled to handle the complex requirements of a large corporate event.</p>
      
      <h2>Conclusion</h2>
      <p>This corporate conference case study demonstrates how the right technology can transform complex event planning into a streamlined, efficient process. By leveraging Sunrise-2025's comprehensive features, the company was able to deliver an exceptional conference experience while significantly reducing administrative overhead.</p>
      
      <p>The results—98% registration completion, 60% administrative efficiency improvement, 35% satisfaction increase, and successful management of 15 concurrent sessions—demonstrate that Sunrise-2025 is the ideal solution for corporate event planning at scale.</p>
    `,
    category: "Corporate",
    client: "Sunrise Team",
    eventType: "Corporate Conference",
    attendees: 500,
    duration: "3 months",
    challenges: [
      "Coordinating 500 employees across 5 office locations",
      "Managing complex registration and session preferences",
      "Ensuring timely communication about schedule changes",
      "Tracking attendance and engagement metrics"
    ],
    solutions: [
      "Implemented Sunrise-2025's contact import from HR system",
      "Created automated registration confirmations and reminders",
      "Used multi-channel messaging for urgent updates",
      "Leveraged analytics to track engagement and attendance"
    ],
    results: [
      "98% registration completion rate",
      "Reduced administrative workload by 60%",
      "Improved attendee satisfaction by 35%",
      "Successfully managed 15 concurrent sessions"
    ],
    metrics: {
      attendanceRate: "98%",
      timeSaved: "60%",
      costReduction: "30%",
      satisfactionScore: "4.7/5"
    },
    featured: true,
    tags: ["Corporate", "Conference", "Large Scale", "Multi-Location"],
    relatedCaseStudies: ["wedding-success-story", "birthday-celebration", "charity-fundraiser"]
  }
}

export default function CaseStudyPage({ params }: { params: { slug: string } }) {
  const caseStudy = caseStudies[params.slug]
  
  if (!caseStudy) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-rose-50 to-amber-50">
      <div className="container mx-auto px-4 py-8">
        {/* Back to Case Studies */}
        <div className="mb-8">
          <Link href="/case-studies">
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Case Studies
            </Button>
          </Link>
        </div>

        {/* Case Study Header */}
        <article className="max-w-4xl mx-auto">
          <div className="bg-white/50 backdrop-blur-sm rounded-lg p-6 sm:p-8 mb-8 shadow-lg">
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge className="bg-orange-100 text-orange-700 border-orange-200">
                {caseStudy.category}
              </Badge>
              {caseStudy.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
            
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800 mb-4 leading-tight">
              {caseStudy.title}
            </h1>
            
            <p className="text-orange-600 font-medium text-lg mb-4">{caseStudy.subtitle}</p>
            
            <p className="text-base sm:text-lg text-gray-600 mb-6 leading-relaxed">
              {caseStudy.description}
            </p>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{caseStudy.attendees}</div>
                <div className="text-xs text-gray-600">Attendees</div>
              </div>
              <div className="text-center p-3 bg-rose-50 rounded-lg">
                <div className="text-2xl font-bold text-rose-600">{caseStudy.duration}</div>
                <div className="text-xs text-gray-600">Duration</div>
              </div>
              <div className="text-center p-3 bg-amber-50 rounded-lg">
                <div className="text-2xl font-bold text-amber-600">{caseStudy.metrics.attendanceRate}</div>
                <div className="text-xs text-gray-600">Attendance</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{caseStudy.metrics.timeSaved}</div>
                <div className="text-xs text-gray-600">Time Saved</div>
              </div>
            </div>
          </div>

          {/* Case Study Content */}
          <div className="bg-white/50 backdrop-blur-sm rounded-lg p-6 sm:p-8 mb-8 shadow-lg">
            <div 
              className="prose prose-lg max-w-none prose-headings:text-gray-800 prose-p:text-gray-600 prose-ul:text-gray-600 prose-li:text-gray-600"
              dangerouslySetInnerHTML={{ __html: caseStudy.content }}
            />
          </div>

          {/* Challenges and Solutions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-800">
                  <Target className="h-5 w-5" />
                  Challenges
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {caseStudy.challenges.map((challenge, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-gray-600">{challenge}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="h-5 w-5" />
                  Solutions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {caseStudy.solutions.map((solution, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-gray-600">{solution}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Results */}
          <Card className="border-blue-200 mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <TrendingUp className="h-5 w-5" />
                Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {caseStudy.results.map((result, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-600">{result}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Related Case Studies */}
          {caseStudy.relatedCaseStudies && caseStudy.relatedCaseStudies.length > 0 && (
            <div className="bg-white/50 backdrop-blur-sm rounded-lg p-6 sm:p-8 shadow-lg">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6">Related Success Stories</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {caseStudy.relatedCaseStudies.map((relatedId) => {
                  const relatedCaseStudy = caseStudies[relatedId]
                  if (!relatedCaseStudy) return null
                  
                  return (
                    <Card key={relatedId} className="border-gray-200 hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline" className="text-xs">
                            {relatedCaseStudy.category}
                          </Badge>
                          <span className="text-xs text-gray-500">{relatedCaseStudy.attendees} attendees</span>
                        </div>
                        <CardTitle className="text-lg font-semibold text-gray-800 leading-tight">
                          {relatedCaseStudy.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                          {relatedCaseStudy.description}
                        </p>
                        <Link href={`/case-studies/${relatedCaseStudy.id}`}>
                          <Button variant="outline" size="sm" className="w-full">
                            Read Story
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}
        </article>
      </div>
    </div>
  )
} 