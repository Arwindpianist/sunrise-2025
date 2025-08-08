import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Users, MessageSquare, Clock, Star, ArrowRight, BookOpen, TrendingUp, Lightbulb, Heart } from "lucide-react"
import Link from "next/link"

interface BlogPost {
  id: string
  title: string
  excerpt: string
  category: string
  readTime: string
  date: string
  author: string
  featured?: boolean
  tags: string[]
}

const blogPosts: BlogPost[] = [
  {
    id: "ultimate-event-planning-guide",
    title: "The Ultimate Guide to Event Planning in 2025",
    excerpt: "Discover the latest trends, tools, and strategies for creating unforgettable events. From intimate gatherings to large-scale celebrations, learn how to plan every detail with precision and style.",
    category: "Event Planning",
    readTime: "8 min read",
    date: "January 15, 2025",
    author: "Sunrise Team",
    featured: true,
    tags: ["Event Planning", "Trends", "Guide"]
  },
  {
    id: "digital-invitation-strategies",
    title: "Digital Invitation Strategies That Actually Work",
    excerpt: "Learn how to leverage digital platforms to create engaging invitations that boost attendance rates. From email campaigns to social media integration, master the art of digital event marketing.",
    category: "Digital Marketing",
    readTime: "6 min read",
    date: "January 12, 2025",
    author: "Sunrise Team",
    tags: ["Digital Marketing", "Invitations", "Strategy"]
  },
  {
    id: "contact-management-best-practices",
    title: "Contact Management Best Practices for Event Organizers",
    excerpt: "Organize your guest lists like a pro with these proven contact management strategies. Learn how to segment contacts, track RSVPs, and maintain clean data for successful events.",
    category: "Contact Management",
    readTime: "5 min read",
    date: "January 10, 2025",
    author: "Sunrise Team",
    tags: ["Contact Management", "Organization", "Best Practices"]
  },
  {
    id: "multi-channel-communication",
    title: "Multi-Channel Communication: Reaching Your Audience Where They Are",
    excerpt: "Explore the benefits of communicating across multiple channels and learn how to create cohesive messaging strategies that ensure your event information reaches every guest effectively.",
    category: "Communication",
    readTime: "7 min read",
    date: "January 8, 2025",
    author: "Sunrise Team",
    tags: ["Communication", "Multi-Channel", "Strategy"]
  },
  {
    id: "event-automation-tools",
    title: "Event Automation Tools That Save Time and Money",
    excerpt: "Discover how automation can streamline your event planning process. From automated reminders to smart scheduling, learn which tools can help you focus on what matters most.",
    category: "Automation",
    readTime: "6 min read",
    date: "January 5, 2025",
    author: "Sunrise Team",
    tags: ["Automation", "Tools", "Efficiency"]
  },
  {
    id: "wedding-planning-tips",
    title: "Wedding Planning Tips: From Engagement to 'I Do'",
    excerpt: "A comprehensive guide to wedding planning that covers everything from the initial engagement to the big day. Learn timeline management, vendor coordination, and guest communication strategies.",
    category: "Wedding Planning",
    readTime: "10 min read",
    date: "January 3, 2025",
    author: "Sunrise Team",
    featured: true,
    tags: ["Wedding", "Planning", "Tips"]
  },
  {
    id: "corporate-event-success",
    title: "Corporate Event Success: Planning Professional Gatherings",
    excerpt: "Master the art of corporate event planning with these essential strategies. From team building events to client meetings, learn how to create professional experiences that drive business results.",
    category: "Corporate Events",
    readTime: "7 min read",
    date: "December 30, 2024",
    author: "Sunrise Team",
    tags: ["Corporate", "Business", "Professional"]
  },
  {
    id: "seasonal-event-ideas",
    title: "Seasonal Event Ideas: Celebrating Throughout the Year",
    excerpt: "Get inspired with creative event ideas for every season. From spring garden parties to winter holiday celebrations, discover unique themes and activities that make each season special.",
    category: "Event Ideas",
    readTime: "8 min read",
    date: "December 28, 2024",
    author: "Sunrise Team",
    tags: ["Seasonal", "Ideas", "Creativity"]
  }
]

const categories = [
  { name: "All", count: blogPosts.length },
  { name: "Event Planning", count: blogPosts.filter(post => post.category === "Event Planning").length },
  { name: "Digital Marketing", count: blogPosts.filter(post => post.category === "Digital Marketing").length },
  { name: "Contact Management", count: blogPosts.filter(post => post.category === "Contact Management").length },
  { name: "Communication", count: blogPosts.filter(post => post.category === "Communication").length },
  { name: "Automation", count: blogPosts.filter(post => post.category === "Automation").length },
  { name: "Wedding Planning", count: blogPosts.filter(post => post.category === "Wedding Planning").length },
  { name: "Corporate Events", count: blogPosts.filter(post => post.category === "Corporate Events").length },
  { name: "Event Ideas", count: blogPosts.filter(post => post.category === "Event Ideas").length }
]

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-rose-50 to-amber-50">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12 sm:py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center mb-6">
            <div className="p-3 bg-gradient-to-r from-orange-500 to-rose-500 rounded-full">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-orange-500 via-rose-500 to-amber-500 bg-clip-text text-transparent leading-tight">
            Event Management Blog
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-gray-600 mb-6 sm:mb-8 leading-relaxed px-2">
            Expert insights, tips, and strategies for creating unforgettable events. 
            From planning to execution, discover everything you need to know about event management.
          </p>
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {categories.slice(1, 6).map((category) => (
              <Badge key={category.name} variant="outline" className="bg-white/50 backdrop-blur-sm">
                {category.name} ({category.count})
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Posts */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-12 text-gray-800">Featured Articles</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {blogPosts.filter(post => post.featured).map((post) => (
            <Card key={post.id} className="border-orange-200 hover:shadow-xl transition-shadow duration-300 shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-2">
                  <Badge className="bg-orange-100 text-orange-700 border-orange-200">
                    {post.category}
                  </Badge>
                  <span className="text-sm text-gray-500">{post.readTime}</span>
                </div>
                <CardTitle className="text-xl sm:text-2xl font-bold text-gray-800 leading-tight">
                  {post.title}
                </CardTitle>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>By {post.author}</span>
                  <span>•</span>
                  <span>{post.date}</span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4 leading-relaxed">
                  {post.excerpt}
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {post.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <Link href={`/blog/${post.id}`}>
                  <Button className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600">
                    Read More
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* All Posts */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-12 text-gray-800">Latest Articles</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {blogPosts.map((post) => (
            <Card key={post.id} className="border-gray-200 hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline" className="text-xs">
                    {post.category}
                  </Badge>
                  <span className="text-xs text-gray-500">{post.readTime}</span>
                </div>
                <CardTitle className="text-lg font-semibold text-gray-800 leading-tight">
                  {post.title}
                </CardTitle>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>By {post.author}</span>
                  <span>•</span>
                  <span>{post.date}</span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                  {post.excerpt}
                </p>
                <div className="flex flex-wrap gap-1 mb-4">
                  {post.tags.slice(0, 2).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <Link href={`/blog/${post.id}`}>
                  <Button variant="outline" size="sm" className="w-full">
                    Read Article
                    <ArrowRight className="ml-2 h-3 w-3" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="bg-gradient-to-r from-orange-500 to-rose-500 text-white py-12 sm:py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">Stay Updated with Event Planning Tips</h2>
          <p className="text-lg sm:text-xl mb-6 sm:mb-8 opacity-90 max-w-2xl mx-auto">
            Get the latest event planning insights, tips, and strategies delivered to your inbox. 
            Join thousands of event organizers who trust our expert advice.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email address"
              className="flex-1 px-4 py-3 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-white"
            />
            <Button size="lg" variant="secondary" className="bg-white text-orange-500 hover:bg-gray-100">
              Subscribe
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-12 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-gray-800">
            Ready to Transform Your Event Planning?
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 mb-6 sm:mb-8">
            Put these insights into practice with Sunrise-2025. Start creating unforgettable events today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600">
                Start Free Trial
              </Button>
            </Link>
            <Link href="/features">
              <Button size="lg" variant="outline" className="border-orange-500 text-orange-500 hover:bg-orange-50">
                Explore Features
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
} 