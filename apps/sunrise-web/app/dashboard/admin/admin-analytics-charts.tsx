"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  TrendingUp,
  DollarSign,
  PieChart,
  MessageSquare,
} from "lucide-react"
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts"

export interface AdminChartStats {
  userGrowthData?: Array<{ date: string; users: number }>
  revenueData?: Array<{ date: string; revenue: number }>
  subscriptionData?: Array<{ tier: string; count: number }>
  messageData?: Array<{ date: string; emails: number; telegram: number }>
  totalContacts?: number
  totalEvents?: number
  totalTokensPurchased?: number
}

const chartColors = {
  primary: "#3b82f6",
  secondary: "#10b981",
  accent: "#f59e0b",
  danger: "#ef4444",
  purple: "#8b5cf6",
  pink: "#ec4899",
}

const pieChartColors = [
  chartColors.primary,
  chartColors.secondary,
  chartColors.accent,
  chartColors.purple,
]

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
  }).format(amount)
}

export function AdminAnalyticsCharts({
  stats,
  chartTimeRange,
  onChartTimeRangeChange,
}: {
  stats: AdminChartStats | null
  chartTimeRange: string
  onChartTimeRangeChange: (range: string) => void
}) {
  return (
    <>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Analytics Dashboard</h3>
        <div className="flex gap-2">
          <Button
            variant={chartTimeRange === "7d" ? "default" : "outline"}
            size="sm"
            onClick={() => onChartTimeRangeChange("7d")}
          >
            7 Days
          </Button>
          <Button
            variant={chartTimeRange === "30d" ? "default" : "outline"}
            size="sm"
            onClick={() => onChartTimeRangeChange("30d")}
          >
            30 Days
          </Button>
          <Button
            variant={chartTimeRange === "90d" ? "default" : "outline"}
            size="sm"
            onClick={() => onChartTimeRangeChange("90d")}
          >
            90 Days
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              User Growth
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.userGrowthData && stats.userGrowthData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <RechartsLineChart data={stats.userGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => new Date(value).toLocaleDateString()}
                  />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    formatter={(value) => [value, "Users"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="users"
                    stroke={chartColors.primary}
                    strokeWidth={2}
                    dot={{ fill: chartColors.primary }}
                  />
                </RechartsLineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <TrendingUp className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
                  <p>No user growth data available</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Revenue Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.revenueData && stats.revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={stats.revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => new Date(value).toLocaleDateString()}
                  />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    formatter={(value) => [formatCurrency(Number(value)), "Revenue"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke={chartColors.secondary}
                    fill={chartColors.secondary}
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <DollarSign className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
                  <p>No revenue data available</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Subscription Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.subscriptionData && stats.subscriptionData.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={stats.subscriptionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ tier, percent }: { tier?: string; percent?: number }) =>
                        `${tier ?? ""} ${percent != null ? (percent * 100).toFixed(0) : 0}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {stats.subscriptionData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={pieChartColors[index % pieChartColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [value, name]} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <PieChart className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
                  <p>No subscription data available</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Message Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.messageData && stats.messageData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.messageData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => new Date(value).toLocaleDateString()}
                  />
                  <YAxis />
                  <Tooltip labelFormatter={(value) => new Date(value).toLocaleDateString()} />
                  <Bar dataKey="emails" fill={chartColors.primary} name="Emails" />
                  <Bar dataKey="telegram" fill={chartColors.secondary} name="Telegram" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <MessageSquare className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
                  <p>No message data available</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalContacts?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">Across all users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalEvents?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">Created by users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Tokens Purchased</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalTokensPurchased?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">Total tokens sold</p>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
