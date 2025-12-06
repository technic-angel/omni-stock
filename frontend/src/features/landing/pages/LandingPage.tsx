import React from 'react'
import { Link } from 'react-router-dom'
import { Package, TrendingUp, BarChart3, Shield, Zap, Users } from 'lucide-react'

import { Button } from '../../../components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card'

/**
 * LandingPage - Public landing page for non-authenticated users
 *
 * This page serves as the entry point for new visitors. It showcases
 * the value proposition of Omni-Stock and encourages sign-up.
 */
const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Navigation Header */}
      <header className="bg-brand-primary">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-8">
          <Link to="/" className="inline-flex items-center space-x-3">
            <img
              src="/branding/omni-stock-logo-horizontal-gem-tiffany.svg"
              alt="Omni-Stock"
              className="h-8"
            />
          </Link>
          <div className="flex items-center space-x-3">
            <Button variant="ghost" className="text-white hover:text-white" asChild>
              <Link to="/login">Log in</Link>
            </Button>
            <Button asChild className="bg-white text-brand-primary hover:bg-gray-100">
              <Link to="/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32 text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
          Track Your Collectibles
          <span className="block text-brand-primary">With Confidence</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          The all-in-one inventory management platform for collectors and vendors. Track, value, and
          manage your collectibles effortlessly.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            asChild
            className="bg-brand-primary hover:bg-brand-primary-dark text-lg px-8"
          >
            <Link to="/register">Get Started</Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="text-lg px-8">
            <Link to="/login">Log In</Link>
          </Button>
        </div>
      </section>

      {/* Feature Cards Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          Everything You Need to Manage Your Collection
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard
            icon={<Package className="h-10 w-10 text-brand-primary" />}
            title="Inventory Tracking"
            description="Organize and track every item in your collection. Add photos, conditions, purchase prices, and custom fields."
          />
          <FeatureCard
            icon={<TrendingUp className="h-10 w-10 text-emerald-500" />}
            title="Portfolio Valuation"
            description="Real-time market values for your collectibles. Watch your portfolio grow with automatic price updates."
          />
          <FeatureCard
            icon={<BarChart3 className="h-10 w-10 text-blue-500" />}
            title="Analytics & Insights"
            description="Understand your collection with powerful analytics. See trends, top performers, and investment returns."
          />
        </div>
      </section>

      {/* Secondary Features */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <SecondaryFeature
              icon={<Shield className="h-6 w-6" />}
              title="Secure & Private"
              description="Your data is encrypted and never shared. You own your collection data."
            />
            <SecondaryFeature
              icon={<Zap className="h-6 w-6" />}
              title="Lightning Fast"
              description="Add items in seconds with barcode scanning and smart auto-fill."
            />
            <SecondaryFeature
              icon={<Users className="h-6 w-6" />}
              title="Multi-Vendor Support"
              description="Manage multiple storefronts or collections from one dashboard."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Start Tracking?</h2>
        <p className="text-lg text-gray-600 mb-8 max-w-xl mx-auto">
          Join collectors who trust Omni-Stock to manage their inventory.
        </p>
        <Button
          size="lg"
          asChild
          className="bg-brand-primary hover:bg-brand-primary-dark text-lg px-8"
        >
          <Link to="/register">Create Account</Link>
        </Button>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white py-8">
        <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
          <p>© {new Date().getFullYear()} Omni-Stock. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

/**
 * FeatureCard - Primary feature highlight card
 */
interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  description: string
}

const FeatureCard = ({ icon, title, description }: FeatureCardProps) => (
  <Card className="text-center hover:shadow-lg transition-shadow duration-300">
    <CardHeader>
      <div className="mx-auto mb-4 p-3 bg-gray-50 rounded-full w-fit">{icon}</div>
      <CardTitle className="text-xl">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <CardDescription className="text-base">{description}</CardDescription>
    </CardContent>
  </Card>
)

/**
 * SecondaryFeature - Smaller feature highlight
 */
interface SecondaryFeatureProps {
  icon: React.ReactNode
  title: string
  description: string
}

const SecondaryFeature = ({ icon, title, description }: SecondaryFeatureProps) => (
  <div className="flex items-start space-x-4">
    <div className="p-2 bg-brand-primary/10 rounded-lg text-brand-primary flex-shrink-0">
      {icon}
    </div>
    <div>
      <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </div>
  </div>
)

export default LandingPage
