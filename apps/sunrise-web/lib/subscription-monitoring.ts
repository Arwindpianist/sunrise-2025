import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
})

export interface SecurityAlert {
  id: string
  type: 'critical' | 'warning' | 'info'
  message: string
  userId?: string
  details: any
  timestamp: Date
  resolved: boolean
}

export interface SubscriptionAnomaly {
  userId: string
  type: 'payment_failure' | 'unauthorized_change' | 'verification_failure' | 'limit_exceeded'
  severity: 'high' | 'medium' | 'low'
  details: any
  timestamp: Date
}

/**
 * Monitor subscription system for security issues
 */
export class SubscriptionMonitor {
  private static instance: SubscriptionMonitor
  private alerts: SecurityAlert[] = []
  private anomalies: SubscriptionAnomaly[] = []

  static getInstance(): SubscriptionMonitor {
    if (!SubscriptionMonitor.instance) {
      SubscriptionMonitor.instance = new SubscriptionMonitor()
    }
    return SubscriptionMonitor.instance
  }

  /**
   * Add a security alert
   */
  addAlert(alert: Omit<SecurityAlert, 'id' | 'timestamp'>): void {
    const newAlert: SecurityAlert = {
      ...alert,
      id: crypto.randomUUID(),
      timestamp: new Date()
    }
    
    this.alerts.push(newAlert)
    this.logAlert(newAlert)
    
    // Send critical alerts immediately
    if (alert.type === 'critical') {
      this.sendCriticalAlert(newAlert)
    }
  }

  /**
   * Add a subscription anomaly
   */
  addAnomaly(anomaly: Omit<SubscriptionAnomaly, 'timestamp'>): void {
    const newAnomaly: SubscriptionAnomaly = {
      ...anomaly,
      timestamp: new Date()
    }
    
    this.anomalies.push(newAnomaly)
    this.logAnomaly(newAnomaly)
    
    // Send high severity anomalies immediately
    if (anomaly.severity === 'high') {
      this.sendAnomalyAlert(newAnomaly)
    }
  }

  /**
   * Check for subscription inconsistencies
   */
  async checkSubscriptionConsistency(userId: string): Promise<{
    hasIssues: boolean
    issues: string[]
  }> {
    const supabase = createRouteHandlerClient({ cookies })
    const issues: string[] = []

    try {
      // Get user's subscription from database
      const { data: dbSubscription } = await supabase
        .from("user_subscriptions")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "active")
        .single()

      if (!dbSubscription) {
        return { hasIssues: false, issues: [] }
      }

      // Verify with Stripe
      if (dbSubscription.stripe_subscription_id) {
        try {
          const stripeSubscription = await stripe.subscriptions.retrieve(dbSubscription.stripe_subscription_id)
          
          // Check for mismatches
          if (stripeSubscription.status !== 'active' && stripeSubscription.status !== 'trialing') {
            issues.push(`Stripe subscription status (${stripeSubscription.status}) doesn't match database status (active)`)
          }

          if (stripeSubscription.metadata?.user_id !== userId) {
            issues.push('User ID mismatch between Stripe and database')
          }

          if (stripeSubscription.metadata?.plan !== dbSubscription.tier) {
            issues.push(`Tier mismatch: Stripe (${stripeSubscription.metadata?.plan}) vs Database (${dbSubscription.tier})`)
          }

          if (stripeSubscription.status === 'past_due' || stripeSubscription.status === 'unpaid') {
            issues.push(`Payment issues detected: ${stripeSubscription.status}`)
          }
        } catch (error) {
          issues.push('Unable to verify subscription with Stripe')
        }
      } else if (dbSubscription.tier !== 'free') {
        issues.push('Paid subscription missing Stripe subscription ID')
      }

      // Check for duplicate active subscriptions
      const { data: duplicateSubscriptions } = await supabase
        .from("user_subscriptions")
        .select("id, tier, status")
        .eq("user_id", userId)
        .eq("status", "active")

      if (duplicateSubscriptions && duplicateSubscriptions.length > 1) {
        issues.push(`Multiple active subscriptions found: ${duplicateSubscriptions.length}`)
      }

      // Check for recent suspicious activity
      const recentAlerts = this.alerts.filter(
        alert => alert.userId === userId && 
        alert.timestamp > new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
      )

      if (recentAlerts.length > 5) {
        issues.push(`High number of security alerts in last 24 hours: ${recentAlerts.length}`)
      }

    } catch (error) {
      issues.push('Error checking subscription consistency')
    }

    return {
      hasIssues: issues.length > 0,
      issues
    }
  }

  /**
   * Monitor for unusual subscription patterns
   */
  async detectUnusualPatterns(): Promise<void> {
    const supabase = createRouteHandlerClient({ cookies })

    try {
      // Check for rapid subscription changes
      const { data: recentChanges } = await supabase
        .from("subscription_audit_log")
        .select("*")
        .gte("created_at", new Date(Date.now() - 60 * 60 * 1000).toISOString()) // Last hour
        .order("created_at", { ascending: false })

      if (recentChanges) {
        const changesByUser = new Map<string, number>()
        
        recentChanges.forEach(change => {
          const count = changesByUser.get(change.user_id) || 0
          changesByUser.set(change.user_id, count + 1)
        })

        // Alert on users with more than 3 changes in an hour
        changesByUser.forEach((count, userId) => {
          if (count > 3) {
            this.addAnomaly({
              userId,
              type: 'unauthorized_change',
              severity: 'high',
              details: { changesInLastHour: count }
            })
          }
        })
      }

      // Check for payment failures
      const { data: failedPayments } = await supabase
        .from("user_subscriptions")
        .select("user_id, tier")
        .eq("status", "past_due")

      if (failedPayments) {
        failedPayments.forEach(subscription => {
          this.addAnomaly({
            userId: subscription.user_id,
            type: 'payment_failure',
            severity: 'medium',
            details: { tier: subscription.tier }
          })
        })
      }

    } catch (error) {
      console.error('Error detecting unusual patterns:', error)
    }
  }

  /**
   * Generate security report
   */
  async generateSecurityReport(): Promise<{
    totalAlerts: number
    criticalAlerts: number
    unresolvedAlerts: number
    totalAnomalies: number
    highSeverityAnomalies: number
    recentActivity: any[]
  }> {
    const unresolvedAlerts = this.alerts.filter(alert => !alert.resolved)
    const criticalAlerts = this.alerts.filter(alert => alert.type === 'critical')
    const highSeverityAnomalies = this.anomalies.filter(anomaly => anomaly.severity === 'high')

    const recentActivity = [
      ...this.alerts.slice(-10).map(alert => ({
        type: 'alert',
        ...alert
      })),
      ...this.anomalies.slice(-10).map(anomaly => ({
        type: 'anomaly',
        ...anomaly
      }))
    ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

    return {
      totalAlerts: this.alerts.length,
      criticalAlerts: criticalAlerts.length,
      unresolvedAlerts: unresolvedAlerts.length,
      totalAnomalies: this.anomalies.length,
      highSeverityAnomalies: highSeverityAnomalies.length,
      recentActivity
    }
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId)
    if (alert) {
      alert.resolved = true
    }
  }

  /**
   * Get alerts for a specific user
   */
  getUserAlerts(userId: string): SecurityAlert[] {
    return this.alerts.filter(alert => alert.userId === userId)
  }

  /**
   * Get anomalies for a specific user
   */
  getUserAnomalies(userId: string): SubscriptionAnomaly[] {
    return this.anomalies.filter(anomaly => anomaly.userId === userId)
  }

  private logAlert(alert: SecurityAlert): void {
    console.log(`[SECURITY ALERT] ${alert.type.toUpperCase()}: ${alert.message}`, {
      userId: alert.userId,
      details: alert.details,
      timestamp: alert.timestamp
    })
  }

  private logAnomaly(anomaly: SubscriptionAnomaly): void {
    console.log(`[SUBSCRIPTION ANOMALY] ${anomaly.severity.toUpperCase()}: ${anomaly.type}`, {
      userId: anomaly.userId,
      details: anomaly.details,
      timestamp: anomaly.timestamp
    })
  }

  private async sendCriticalAlert(alert: SecurityAlert): Promise<void> {
    // In production, this would send to your monitoring system
    // For now, we'll just log it
    console.error(`[CRITICAL ALERT] ${alert.message}`, alert)
    
    // You could integrate with services like:
    // - Slack webhook
    // - Email service
    // - PagerDuty
    // - Custom monitoring dashboard
  }

  private async sendAnomalyAlert(anomaly: SubscriptionAnomaly): Promise<void> {
    // In production, this would send to your monitoring system
    console.error(`[HIGH SEVERITY ANOMALY] ${anomaly.type} for user ${anomaly.userId}`, anomaly)
  }
}

// Export singleton instance
export const subscriptionMonitor = SubscriptionMonitor.getInstance() 