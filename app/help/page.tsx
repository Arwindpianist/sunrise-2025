"use client"

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle, HelpCircle, Mail, MessageSquare, Send } from 'lucide-react'

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-rose-50 to-amber-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <h1 className="text-4xl font-bold text-center mb-8">Sunrise-2025 Help Center</h1>
        <p className="text-xl text-center text-gray-700 mb-12">
          Everything you need to know about using Sunrise-2025 to create amazing events
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Navigation Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
              <h2 className="text-lg font-semibold mb-4 text-gray-800">Quick Navigation</h2>
              <nav className="space-y-2">
                <a href="#getting-started" className="block text-orange-600 hover:text-orange-700 font-medium">
                  Getting Started
                </a>
                <a href="#contacts" className="block text-gray-600 hover:text-orange-600">
                  Managing Contacts
                </a>
                <a href="#events" className="block text-gray-600 hover:text-orange-600">
                  Creating Events
                </a>
                <a href="#messaging" className="block text-gray-600 hover:text-orange-600">
                  Sending Messages
                </a>
                <a href="#templates" className="block text-gray-600 hover:text-orange-600">
                  Using Templates
                </a>
                <a href="#tokens" className="block text-gray-600 hover:text-orange-600">
                  Understanding Tokens
                </a>
                <a href="#troubleshooting" className="block text-gray-600 hover:text-orange-600">
                  Troubleshooting
                </a>
                <a href="#support" className="block text-gray-600 hover:text-orange-600">
                  Getting Support
                </a>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Getting Started */}
            <section id="getting-started" className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">Getting Started with Sunrise-2025</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-gray-800">1. Create Your Account</h3>
                  <p className="text-gray-600 mb-3">
                    Sign up for a free account to get started. You'll receive 15 free tokens to explore all features.
                  </p>
                  <ul className="text-gray-600 text-sm space-y-1 ml-4">
                    <li>• Visit our registration page</li>
                    <li>• Enter your email and create a password</li>
                    <li>• Verify your email address</li>
                    <li>• Complete your profile setup</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2 text-gray-800">2. Set Up Your Profile</h3>
                  <p className="text-gray-600 mb-3">
                    Customize your profile with your name, organization, and preferences to get the most out of Sunrise-2025.
                  </p>
                  <ul className="text-gray-600 text-sm space-y-1 ml-4">
                    <li>• Add your personal or business information</li>
                    <li>• Upload your logo (Pro+ users)</li>
                    <li>• Set your timezone and preferences</li>
                    <li>• Configure notification settings</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2 text-gray-800">3. Import Your First Contacts</h3>
                  <p className="text-gray-600 mb-3">
                    Start building your contact database by importing contacts from various sources.
                  </p>
                  <ul className="text-gray-600 text-sm space-y-1 ml-4">
                    <li>• Connect your Google Contacts account</li>
                    <li>• Upload vCard or CSV files</li>
                    <li>• Add contacts manually</li>
                    <li>• Organize contacts into categories</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Managing Contacts */}
            <section id="contacts" className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">Managing Your Contacts</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-gray-800">Contact Import Methods</h3>
                  <p className="text-gray-600 mb-3">
                    Sunrise-2025 supports multiple ways to add contacts to your database.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-800 mb-2">Google Contacts</h4>
                      <p className="text-gray-600 text-sm">
                        Connect your Google account to automatically sync contacts. Updates are real-time and secure.
                      </p>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-800 mb-2">File Upload</h4>
                      <p className="text-gray-600 text-sm">
                        Upload vCard (.vcf) or CSV files. Our system automatically detects and maps contact fields.
                      </p>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-800 mb-2">Manual Entry</h4>
                      <p className="text-gray-600 text-sm">
                        Add contacts one by one with our simple form. Perfect for adding new contacts on the go.
                      </p>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-800 mb-2">Public Forms</h4>
                      <p className="text-gray-600 text-sm">
                        Share a public form link to let contacts add themselves to your database.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2 text-gray-800">Organizing with Categories</h3>
                  <p className="text-gray-600 mb-3">
                    Use categories to organize your contacts and create targeted communication campaigns.
                  </p>
                  <ul className="text-gray-600 text-sm space-y-1 ml-4">
                    <li>• Create custom categories (Family, Friends, Colleagues, etc.)</li>
                    <li>• Assign multiple categories to each contact</li>
                    <li>• Use color coding for visual organization</li>
                    <li>• Filter contacts by category for targeted messaging</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2 text-gray-800">Contact Management Best Practices</h3>
                  <ul className="text-gray-600 text-sm space-y-1 ml-4">
                    <li>• Keep contact information up to date</li>
                    <li>• Use consistent naming conventions</li>
                    <li>• Regularly clean duplicate contacts</li>
                    <li>• Segment contacts by engagement level</li>
                    <li>• Respect privacy preferences and permissions</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Creating Events */}
            <section id="events" className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">Creating and Managing Events</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-gray-800">Event Creation Process</h3>
                  <p className="text-gray-600 mb-3">
                    Follow these steps to create a successful event in Sunrise-2025.
                  </p>
                  
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="bg-orange-100 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">
                        <span className="text-orange-600 font-semibold text-sm">1</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800">Basic Information</h4>
                        <p className="text-gray-600 text-sm">
                          Enter event name, date, time, location, and description. Add any special instructions or requirements.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="bg-rose-100 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">
                        <span className="text-rose-600 font-semibold text-sm">2</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800">Select Recipients</h4>
                        <p className="text-gray-600 text-sm">
                          Choose which contacts or categories will receive invitations. You can select all contacts or specific groups.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="bg-amber-100 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">
                        <span className="text-amber-600 font-semibold text-sm">3</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800">Choose Template</h4>
                        <p className="text-gray-600 text-sm">
                          Select from our professional templates or create a custom design that matches your event theme.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="bg-green-100 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">
                        <span className="text-green-600 font-semibold text-sm">4</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800">Schedule Messages</h4>
                        <p className="text-gray-600 text-sm">
                          Set when invitations and reminders should be sent. Use our smart scheduling for optimal timing.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2 text-gray-800">Event Types and Templates</h3>
                  <p className="text-gray-600 mb-3">
                    We offer specialized templates for various event types to save you time and ensure professional results.
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="text-center">
                      <div className="bg-orange-100 rounded-lg p-3 mb-2">
                        <span className="text-2xl">💒</span>
                      </div>
                      <p className="text-sm font-medium text-gray-800">Weddings</p>
                    </div>
                    <div className="text-center">
                      <div className="bg-rose-100 rounded-lg p-3 mb-2">
                        <span className="text-2xl">🎂</span>
                      </div>
                      <p className="text-sm font-medium text-gray-800">Birthdays</p>
                    </div>
                    <div className="text-center">
                      <div className="bg-amber-100 rounded-lg p-3 mb-2">
                        <span className="text-2xl">🏢</span>
                      </div>
                      <p className="text-sm font-medium text-gray-800">Corporate</p>
                    </div>
                    <div className="text-center">
                      <div className="bg-green-100 rounded-lg p-3 mb-2">
                        <span className="text-2xl">🎉</span>
                      </div>
                      <p className="text-sm font-medium text-gray-800">Parties</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Messaging */}
            <section id="messaging" className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">Sending Messages and Invitations</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-gray-800">Multi-Channel Communication</h3>
                  <p className="text-gray-600 mb-3">
                    Reach your contacts through their preferred communication channels.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-800 mb-2">Email (1 token)</h4>
                      <p className="text-gray-600 text-sm">
                        Professional email templates with tracking and analytics. Perfect for formal invitations and detailed information.
                      </p>
                    </div>
                    
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-800 mb-2">Telegram (2 tokens)</h4>
                      <p className="text-gray-600 text-sm">
                        Instant messaging for quick updates and reminders. Great for informal events and urgent communications.
                      </p>
                    </div>
                    
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-800 mb-2">Discord (1 token)</h4>
                      <p className="text-gray-600 text-sm">
                        Community platform integration for gaming events, online communities, and group activities.
                      </p>
                    </div>
                    
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-800 mb-2">Slack (1 token)</h4>
                      <p className="text-gray-600 text-sm">
                        Business communication for corporate events, team meetings, and professional gatherings.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2 text-gray-800">Message Scheduling</h3>
                  <p className="text-gray-600 mb-3">
                    Plan your communication strategy with smart scheduling and automation.
                  </p>
                  <ul className="text-gray-600 text-sm space-y-1 ml-4">
                    <li>• Send invitations well in advance (recommended: 2-4 weeks)</li>
                    <li>• Schedule reminder messages 1 week and 1 day before the event</li>
                    <li>• Use timezone-aware scheduling for global events</li>
                    <li>• Set up automated follow-up sequences</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Templates */}
            <section id="templates" className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">Using Email Templates</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-gray-800">Template Categories</h3>
                  <p className="text-gray-600 mb-3">
                    Choose from our professionally designed templates for every occasion.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-semibold text-gray-800 mb-2">Formal Events</h4>
                      <p className="text-gray-600 text-sm">
                        Elegant designs for weddings, corporate events, and formal celebrations
                      </p>
                    </div>
                    
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-semibold text-gray-800 mb-2">Casual Gatherings</h4>
                      <p className="text-gray-600 text-sm">
                        Fun and friendly templates for birthdays, parties, and informal events
                      </p>
                    </div>
                    
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-semibold text-gray-800 mb-2">Business Events</h4>
                      <p className="text-gray-600 text-sm">
                        Professional templates for meetings, conferences, and business functions
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2 text-gray-800">Customization Options</h3>
                  <ul className="text-gray-600 text-sm space-y-1 ml-4">
                    <li>• Change colors and fonts to match your brand</li>
                    <li>• Add your logo and company information</li>
                    <li>• Customize text content and messaging</li>
                    <li>• Adjust layout and spacing</li>
                    <li>• Preview changes before sending</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Tokens */}
            <section id="tokens" className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">Understanding the Token System</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-gray-800">How Tokens Work</h3>
                  <p className="text-gray-600 mb-3">
                    Our token system ensures you only pay for what you use, making event planning affordable for everyone.
                  </p>
                  
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-2">Token Usage Examples</h4>
                    <ul className="text-gray-600 text-sm space-y-1">
                      <li>• Sending an email invitation: 1 token</li>
                      <li>• Sending a Telegram message: 2 tokens</li>
                      <li>• Creating an event: 1 token</li>
                      <li>• Sending a reminder: 1 token</li>
                    </ul>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2 text-gray-800">Subscription Benefits</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-800 mb-2">Free Tier</h4>
                      <ul className="text-gray-600 text-sm space-y-1">
                        <li>• 15 free tokens</li>
                        <li>• Basic templates</li>
                        <li>• Email support</li>
                      </ul>
                    </div>
                    
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-800 mb-2">Paid Tiers</h4>
                      <ul className="text-gray-600 text-sm space-y-1">
                        <li>• Discounted token rates</li>
                        <li>• Advanced features</li>
                        <li>• Priority support</li>
                        <li>• Custom branding</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Troubleshooting */}
            <section id="troubleshooting" className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">Common Issues and Solutions</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-gray-800">Frequently Asked Questions</h3>
                  
                  <div className="space-y-4">
                    <div className="border-l-4 border-orange-500 pl-4">
                      <h4 className="font-semibold text-gray-800 mb-1">Why aren't my messages being sent?</h4>
                      <p className="text-gray-600 text-sm">
                        Check if you have sufficient tokens, verify contact email addresses, and ensure your account is active.
                      </p>
                    </div>
                    
                    <div className="border-l-4 border-rose-500 pl-4">
                      <h4 className="font-semibold text-gray-800 mb-1">How do I import contacts from Google?</h4>
                      <p className="text-gray-600 text-sm">
                        Go to Contacts → Import → Google Contacts, authorize the connection, and select which contacts to import.
                      </p>
                    </div>
                    
                    <div className="border-l-4 border-amber-500 pl-4">
                      <h4 className="font-semibold text-gray-800 mb-1">Can I customize email templates?</h4>
                      <p className="text-gray-600 text-sm">
                        Yes! Pro and Enterprise users can fully customize templates with their branding and colors.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Support */}
            <section id="support" className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">Getting Help and Support</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-gray-800">Support Options</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-800 mb-2">Email Support</h4>
                      <p className="text-gray-600 text-sm">
                        Send us a detailed message and we'll respond within 24 hours.
                      </p>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-800 mb-2">Help Center</h4>
                      <p className="text-gray-600 text-sm">
                        Browse our comprehensive documentation and guides for self-service help.
                      </p>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-800 mb-2">Community Forum</h4>
                      <p className="text-gray-600 text-sm">
                        Connect with other users to share tips and get advice.
                      </p>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-800 mb-2">Priority Support</h4>
                      <p className="text-gray-600 text-sm">
                        Pro and Enterprise users get faster response times and dedicated support.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-orange-50 to-rose-50 border border-orange-200 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Still Need Help?</h3>
                  <p className="text-gray-700 mb-4">
                    Our support team is here to help you succeed with Sunrise-2025. Don't hesitate to reach out!
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <a href="/contact" className="bg-gradient-to-r from-orange-500 to-rose-500 text-white px-6 py-3 rounded-lg font-medium text-center hover:from-orange-600 hover:to-rose-600 transition-colors">
                      Contact Support
                    </a>
                    <a href="/faq" className="border border-orange-300 text-orange-700 px-6 py-3 rounded-lg font-medium text-center hover:bg-orange-50 transition-colors">
                      View FAQ
                    </a>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
} 