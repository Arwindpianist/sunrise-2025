import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Calendar, Clock, User, Share2, BookOpen, Heart, MessageSquare } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

interface BlogPost {
  id: string
  title: string
  content: string
  excerpt: string
  category: string
  readTime: string
  date: string
  author: string
  featured?: boolean
  tags: string[]
  relatedPosts?: string[]
}

const blogPosts: Record<string, BlogPost> = {
  "ultimate-event-planning-guide": {
    id: "ultimate-event-planning-guide",
    title: "The Ultimate Guide to Event Planning in 2025",
    excerpt: "Discover the latest trends, tools, and strategies for creating unforgettable events. From intimate gatherings to large-scale celebrations, learn how to plan every detail with precision and style.",
    content: `
      <h2>Introduction to Modern Event Planning</h2>
      <p>Event planning has evolved significantly in recent years, with technology playing a crucial role in how we organize and execute successful events. In 2025, successful event planners need to master both traditional planning techniques and modern digital tools.</p>
      
      <h2>Key Trends in Event Planning for 2025</h2>
      <h3>1. Hybrid and Virtual Events</h3>
      <p>The pandemic has permanently changed how we think about events. Hybrid events that combine in-person and virtual elements are becoming the new standard. This approach allows for greater reach and accessibility while maintaining the personal touch that makes events special.</p>
      
      <h3>2. Sustainability Focus</h3>
      <p>Environmental consciousness is no longer optional. Event planners are increasingly incorporating sustainable practices, from digital invitations to eco-friendly venues and zero-waste catering options.</p>
      
      <h3>3. Personalization at Scale</h3>
      <p>Technology enables us to personalize experiences for large groups. From customized communication to tailored content, personalization is key to creating memorable events.</p>
      
      <h2>Essential Event Planning Tools</h2>
      <h3>Digital Communication Platforms</h3>
      <p>Modern event planning requires robust communication tools. Platforms like Sunrise-2025 offer multi-channel messaging capabilities, allowing you to reach guests through email, SMS, WhatsApp, and social media platforms.</p>
      
      <h3>Contact Management Systems</h3>
      <p>Efficient contact management is crucial for successful events. Look for systems that offer:</p>
      <ul>
        <li>Easy import from various sources (Google Contacts, CSV, vCard)</li>
        <li>Smart categorization and tagging</li>
        <li>RSVP tracking and management</li>
        <li>Automated follow-up capabilities</li>
      </ul>
      
      <h3>Project Management Tools</h3>
      <p>Event planning involves managing multiple tasks and deadlines. Use project management tools to:</p>
      <ul>
        <li>Create detailed timelines</li>
        <li>Assign tasks to team members</li>
        <li>Track progress and milestones</li>
        <li>Manage budgets and expenses</li>
      </ul>
      
      <h2>Step-by-Step Event Planning Process</h2>
      <h3>Phase 1: Pre-Planning (6-12 months before)</h3>
      <p>This phase sets the foundation for your event:</p>
      <ul>
        <li>Define event objectives and goals</li>
        <li>Establish budget and timeline</li>
        <li>Research and select venue</li>
        <li>Begin vendor research and selection</li>
      </ul>
      
      <h3>Phase 2: Planning (3-6 months before)</h3>
      <p>Detailed planning and coordination:</p>
      <ul>
        <li>Finalize vendor contracts</li>
        <li>Develop marketing and communication strategy</li>
        <li>Create event timeline and run-of-show</li>
        <li>Begin guest list compilation</li>
      </ul>
      
      <h3>Phase 3: Execution (1-3 months before)</h3>
      <p>Final preparations and coordination:</p>
      <ul>
        <li>Send invitations and track RSVPs</li>
        <li>Coordinate with vendors and venue</li>
        <li>Conduct rehearsals and walkthroughs</li>
        <li>Prepare emergency contingency plans</li>
      </ul>
      
      <h3>Phase 4: Event Day</h3>
      <p>Execution and management:</p>
      <ul>
        <li>Arrive early for setup and coordination</li>
        <li>Manage vendor coordination</li>
        <li>Handle any last-minute issues</li>
        <li>Ensure smooth event flow</li>
      </ul>
      
      <h3>Phase 5: Post-Event</h3>
      <p>Follow-up and evaluation:</p>
      <ul>
        <li>Send thank-you messages to guests</li>
        <li>Gather feedback and testimonials</li>
        <li>Evaluate event success against objectives</li>
        <li>Document lessons learned for future events</li>
      </ul>
      
      <h2>Communication Strategies</h2>
      <h3>Multi-Channel Approach</h3>
      <p>Don't rely on a single communication channel. Use multiple platforms to ensure your message reaches everyone:</p>
      <ul>
        <li><strong>Email:</strong> Formal invitations and detailed information</li>
        <li><strong>SMS:</strong> Quick reminders and urgent updates</li>
        <li><strong>Social Media:</strong> Event promotion and engagement</li>
        <li><strong>WhatsApp/Telegram:</strong> Group coordination and updates</li>
      </ul>
      
      <h3>Timing and Frequency</h3>
      <p>Strategic timing is crucial for effective communication:</p>
      <ul>
        <li>Send initial invitations 6-8 weeks before the event</li>
        <li>Follow up with reminders 2-3 weeks before</li>
        <li>Send final details 1 week before</li>
        <li>Provide day-of updates and directions</li>
      </ul>
      
      <h2>Technology Integration</h2>
      <h3>Event Management Software</h3>
      <p>Modern event planning software can streamline your entire process:</p>
      <ul>
        <li>Automated invitation and reminder systems</li>
        <li>RSVP tracking and management</li>
        <li>Guest list organization and segmentation</li>
        <li>Communication history and analytics</li>
      </ul>
      
      <h3>Mobile Apps</h3>
      <p>Mobile apps can enhance the event experience:</p>
      <ul>
        <li>Digital check-in systems</li>
        <li>Interactive event schedules</li>
        <li>Networking features</li>
        <li>Real-time updates and notifications</li>
      </ul>
      
      <h2>Budget Management</h2>
      <h3>Creating a Comprehensive Budget</h3>
      <p>A well-planned budget is essential for event success:</p>
      <ul>
        <li>Venue and catering costs</li>
        <li>Vendor fees and services</li>
        <li>Marketing and promotion expenses</li>
        <li>Technology and equipment rentals</li>
        <li>Contingency fund (10-15% of total budget)</li>
      </ul>
      
      <h3>Cost-Saving Strategies</h3>
      <p>Smart planning can help you stay within budget:</p>
      <ul>
        <li>Negotiate with vendors for better rates</li>
        <li>Consider off-peak dates and times</li>
        <li>Use digital tools to reduce printing costs</li>
        <li>Leverage partnerships and sponsorships</li>
      </ul>
      
      <h2>Risk Management</h2>
      <h3>Identifying Potential Risks</h3>
      <p>Proactive risk management can prevent problems:</p>
      <ul>
        <li>Weather-related issues</li>
        <li>Vendor cancellations or delays</li>
        <li>Technical difficulties</li>
        <li>Health and safety concerns</li>
      </ul>
      
      <h3>Contingency Planning</h3>
      <p>Always have backup plans for critical elements:</p>
      <ul>
        <li>Alternative venues or dates</li>
        <li>Backup vendors and suppliers</li>
        <li>Emergency contact procedures</li>
        <li>Insurance coverage</li>
      </ul>
      
      <h2>Measuring Event Success</h2>
      <h3>Key Performance Indicators</h3>
      <p>Track these metrics to evaluate your event:</p>
      <ul>
        <li>Attendance rates and engagement</li>
        <li>Guest satisfaction scores</li>
        <li>Social media reach and engagement</li>
        <li>Return on investment (ROI)</li>
        <li>Post-event actions (purchases, sign-ups, etc.)</li>
      </ul>
      
      <h3>Feedback Collection</h3>
      <p>Gather feedback through multiple channels:</p>
      <ul>
        <li>Post-event surveys</li>
        <li>Social media monitoring</li>
        <li>Direct conversations with attendees</li>
        <li>Vendor feedback</li>
      </ul>
      
      <h2>Conclusion</h2>
      <p>Successful event planning in 2025 requires a combination of traditional planning skills and modern technology. By staying current with trends, leveraging the right tools, and maintaining focus on the guest experience, you can create memorable events that achieve your objectives.</p>
      
      <p>Remember, the key to successful event planning is not just about managing logistics—it's about creating meaningful experiences that connect people and achieve your goals. With the right approach and tools, every event can be a success.</p>
    `,
    category: "Event Planning",
    readTime: "8 min read",
    date: "January 15, 2025",
    author: "Sunrise Team",
    featured: true,
    tags: ["Event Planning", "Trends", "Guide"],
    relatedPosts: ["digital-invitation-strategies", "contact-management-best-practices", "multi-channel-communication"]
  },
  "digital-invitation-strategies": {
    id: "digital-invitation-strategies",
    title: "Digital Invitation Strategies That Actually Work",
    excerpt: "Learn how to leverage digital platforms to create engaging invitations that boost attendance rates. From email campaigns to social media integration, master the art of digital event marketing.",
    content: `
      <h2>The Evolution of Digital Invitations</h2>
      <p>Digital invitations have revolutionized how we invite people to events. Gone are the days of paper invitations and manual RSVP tracking. Today's digital solutions offer unprecedented reach, tracking capabilities, and engagement opportunities.</p>
      
      <h2>Why Digital Invitations Matter</h2>
      <h3>Cost Effectiveness</h3>
      <p>Digital invitations eliminate printing and postage costs while allowing for unlimited distribution. This makes them ideal for both small intimate gatherings and large-scale events.</p>
      
      <h3>Real-time Tracking</h3>
      <p>Digital platforms provide instant feedback on invitation opens, clicks, and RSVPs, allowing you to adjust your strategy in real-time.</p>
      
      <h3>Environmental Impact</h3>
      <p>By reducing paper waste, digital invitations contribute to sustainability goals and appeal to environmentally conscious attendees.</p>
      
      <h2>Platform Selection Strategy</h2>
      <h3>Email Marketing Platforms</h3>
      <p>Email remains the most reliable digital invitation method:</p>
      <ul>
        <li>High deliverability rates</li>
        <li>Professional appearance</li>
        <li>Detailed analytics and tracking</li>
        <li>Easy personalization</li>
      </ul>
      
      <h3>Social Media Integration</h3>
      <p>Social platforms offer unique engagement opportunities:</p>
      <ul>
        <li>Facebook Events for community building</li>
        <li>Instagram Stories for visual appeal</li>
        <li>LinkedIn for professional events</li>
        <li>Twitter for real-time updates</li>
      </ul>
      
      <h3>Messaging Apps</h3>
      <p>Direct messaging apps provide personal touch:</p>
      <ul>
        <li>WhatsApp for group coordination</li>
        <li>Telegram for instant updates</li>
        <li>SMS for urgent communications</li>
      </ul>
      
      <h2>Designing Effective Digital Invitations</h2>
      <h3>Visual Design Principles</h3>
      <p>Your invitation design should reflect your event's tone and purpose:</p>
      <ul>
        <li>Use high-quality images and graphics</li>
        <li>Maintain consistent branding</li>
        <li>Ensure mobile-friendly design</li>
        <li>Include clear call-to-action buttons</li>
      </ul>
      
      <h3>Content Strategy</h3>
      <p>Compelling content drives engagement:</p>
      <ul>
        <li>Write compelling subject lines</li>
        <li>Include all essential event details</li>
        <li>Add personal touches and stories</li>
        <li>Create urgency and excitement</li>
      </ul>
      
      <h2>Personalization Techniques</h2>
      <h3>Data-Driven Personalization</h3>
      <p>Use attendee data to create personalized experiences:</p>
      <ul>
        <li>Address recipients by name</li>
        <li>Reference past interactions</li>
        <li>Tailor content to interests</li>
        <li>Customize timing based on behavior</li>
      </ul>
      
      <h3>Segmentation Strategies</h3>
      <p>Group your audience for targeted messaging:</p>
      <ul>
        <li>By relationship type (family, friends, colleagues)</li>
        <li>By geographic location</li>
        <li>By past event attendance</li>
        <li>By engagement level</li>
      </ul>
      
      <h2>Timing and Frequency</h2>
      <h3>Optimal Sending Times</h3>
      <p>Timing significantly impacts open rates:</p>
      <ul>
        <li>Tuesday-Thursday: 10 AM - 2 PM</li>
        <li>Avoid Monday mornings and Friday afternoons</li>
        <li>Consider time zones for international events</li>
        <li>Test different times with your audience</li>
      </ul>
      
      <h3>Follow-up Strategy</h3>
      <p>Strategic follow-ups increase attendance:</p>
      <ul>
        <li>Send initial invitation 6-8 weeks before</li>
        <li>Follow up 2-3 weeks before</li>
        <li>Send final reminder 1 week before</li>
        <li>Provide day-of updates</li>
      </ul>
      
      <h2>Engagement and Interaction</h2>
      <h3>Interactive Elements</h3>
      <p>Engage recipients with interactive features:</p>
      <ul>
        <li>Polls and surveys</li>
        <li>Social media sharing buttons</li>
        <li>Photo galleries and videos</li>
        <li>Countdown timers</li>
      </ul>
      
      <h3>Social Proof</h3>
      <p>Leverage social proof to increase interest:</p>
      <ul>
        <li>Show attendee lists (with permission)</li>
        <li>Display testimonials from past events</li>
        <li>Share photos from previous gatherings</li>
        <li>Highlight special guests or speakers</li>
      </ul>
      
      <h2>Analytics and Optimization</h2>
      <h3>Key Metrics to Track</h3>
      <p>Monitor these metrics to improve performance:</p>
      <ul>
        <li>Open rates and click-through rates</li>
        <li>RSVP conversion rates</li>
        <li>Time spent on invitation</li>
        <li>Social sharing statistics</li>
      </ul>
      
      <h3>A/B Testing</h3>
      <p>Test different elements to optimize performance:</p>
      <ul>
        <li>Subject lines and headlines</li>
        <li>Design layouts and colors</li>
        <li>Call-to-action buttons</li>
        <li>Sending times and frequency</li>
      </ul>
      
      <h2>Integration with Event Management</h2>
      <h3>Seamless Workflow</h3>
      <p>Integrate invitations with your overall event management:</p>
      <ul>
        <li>Automatic RSVP tracking</li>
        <li>Guest list management</li>
        <li>Communication history</li>
        <li>Follow-up automation</li>
      </ul>
      
      <h3>Data Management</h3>
      <p>Maintain clean, organized data:</p>
      <ul>
        <li>Centralized contact database</li>
        <li>Consistent data formatting</li>
        <li>Regular data cleaning</li>
        <li>Privacy compliance</li>
      </ul>
      
      <h2>Common Pitfalls to Avoid</h2>
      <h3>Technical Issues</h3>
      <p>Avoid these common technical problems:</p>
      <ul>
        <li>Poor mobile optimization</li>
        <li>Slow loading times</li>
        <li>Broken links and images</li>
        <li>Compatibility issues</li>
      </ul>
      
      <h3>Content Mistakes</h3>
      <p>Steer clear of content errors:</p>
      <ul>
        <li>Missing essential information</li>
        <li>Unclear call-to-actions</li>
        <li>Poor grammar and spelling</li>
        <li>Overwhelming design</li>
      </ul>
      
      <h2>Future Trends</h2>
      <h3>Emerging Technologies</h3>
      <p>Stay ahead with these emerging trends:</p>
      <ul>
        <li>AI-powered personalization</li>
        <li>Virtual and augmented reality</li>
        <li>Voice-activated invitations</li>
        <li>Blockchain-based RSVPs</li>
      </ul>
      
      <h3>Integration Opportunities</h3>
      <p>Look for integration possibilities:</p>
      <ul>
        <li>Calendar integration</li>
        <li>Payment processing</li>
        <li>Travel booking</li>
        <li>Accommodation arrangements</li>
      </ul>
      
      <h2>Conclusion</h2>
      <p>Digital invitations are more than just a modern convenience—they're a powerful tool for event success. By understanding your audience, leveraging the right platforms, and continuously optimizing your approach, you can create digital invitations that not only inform but also inspire and engage.</p>
      
      <p>Remember, the best digital invitation strategy is one that combines technology with human connection. Use data and automation to enhance, not replace, the personal touch that makes events special.</p>
    `,
    category: "Digital Marketing",
    readTime: "6 min read",
    date: "January 12, 2025",
    author: "Sunrise Team",
    tags: ["Digital Marketing", "Invitations", "Strategy"],
    relatedPosts: ["ultimate-event-planning-guide", "multi-channel-communication", "contact-management-best-practices"]
  }
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = blogPosts[params.slug]
  
  if (!post) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-rose-50 to-amber-50">
      <div className="container mx-auto px-4 py-8">
        {/* Back to Blog */}
        <div className="mb-8">
          <Link href="/blog">
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Blog
            </Button>
          </Link>
        </div>

        {/* Article Header */}
        <article className="max-w-4xl mx-auto">
          <div className="bg-white/50 backdrop-blur-sm rounded-lg p-6 sm:p-8 mb-8 shadow-lg">
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge className="bg-orange-100 text-orange-700 border-orange-200">
                {post.category}
              </Badge>
              {post.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
            
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800 mb-4 leading-tight">
              {post.title}
            </h1>
            
            <p className="text-base sm:text-lg text-gray-600 mb-6 leading-relaxed">
              {post.excerpt}
            </p>
            
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm text-gray-500 border-t border-gray-200 pt-6">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>By {post.author}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{post.date}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{post.readTime}</span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                <span>Event Planning</span>
              </div>
            </div>
          </div>

          {/* Article Content */}
          <div className="bg-white/50 backdrop-blur-sm rounded-lg p-6 sm:p-8 mb-8 shadow-lg">
            <div 
              className="prose prose-lg max-w-none prose-headings:text-gray-800 prose-p:text-gray-600 prose-ul:text-gray-600 prose-li:text-gray-600"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </div>

          {/* Article Footer */}
          <div className="bg-white/50 backdrop-blur-sm rounded-lg p-6 sm:p-8 mb-8 shadow-lg">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Button variant="outline" className="flex items-center gap-2">
                  <Heart className="h-4 w-4" />
                  Like Article
                </Button>
                <Button variant="outline" className="flex items-center gap-2">
                  <Share2 className="h-4 w-4" />
                  Share
                </Button>
              </div>
              <div className="text-sm text-gray-500">
                <span>Published on {post.date}</span>
              </div>
            </div>
          </div>

          {/* Related Articles */}
          {post.relatedPosts && post.relatedPosts.length > 0 && (
            <div className="bg-white/50 backdrop-blur-sm rounded-lg p-6 sm:p-8 shadow-lg">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6">Related Articles</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {post.relatedPosts.map((relatedId) => {
                  const relatedPost = blogPosts[relatedId]
                  if (!relatedPost) return null
                  
                  return (
                    <Card key={relatedId} className="border-gray-200 hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline" className="text-xs">
                            {relatedPost.category}
                          </Badge>
                          <span className="text-xs text-gray-500">{relatedPost.readTime}</span>
                        </div>
                        <CardTitle className="text-lg font-semibold text-gray-800 leading-tight">
                          {relatedPost.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                          {relatedPost.excerpt}
                        </p>
                        <Link href={`/blog/${relatedPost.id}`}>
                          <Button variant="outline" size="sm" className="w-full">
                            Read Article
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