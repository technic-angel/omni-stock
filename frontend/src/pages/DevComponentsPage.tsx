import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Package, 
  AlertTriangle, 
  CheckCircle, 
  Info,
  Plus,
  Upload,
  Heart,
  Building2
} from 'lucide-react'

/**
 * DevComponentsPage - Visual component testing playground
 * 
 * This page is for development only. Add it to routes with:
 * <Route path="/dev/components" element={<DevComponentsPage />} />
 * 
 * Use this instead of Storybook for quick component testing.
 */
export default function DevComponentsPage() {
  if (import.meta.env.PROD) {
    return <div>404 - Not Found</div>
  }

  return (
    <div className="min-h-screen bg-brand-bg p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Component Playground</h1>
          <p className="text-slate-600">
            Quick visual testing of ShadCN UI components with Tiffany blue branding
          </p>
        </div>

        <Tabs defaultValue="buttons" className="w-full">
          <TabsList>
            <TabsTrigger value="buttons">Buttons</TabsTrigger>
            <TabsTrigger value="cards">Cards</TabsTrigger>
            <TabsTrigger value="forms">Forms</TabsTrigger>
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
            <TabsTrigger value="data">Data Display</TabsTrigger>
          </TabsList>

          {/* Buttons Tab */}
          <TabsContent value="buttons" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Button Variants</CardTitle>
                <CardDescription>All button styles with brand colors</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="mb-2 block">Primary (Tiffany Blue)</Label>
                  <div className="flex flex-wrap gap-2">
                    <Button className="bg-brand-primary hover:bg-brand-primaryDark">
                      Primary Button
                    </Button>
                    <Button className="bg-brand-primary hover:bg-brand-primaryDark rounded-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Item
                    </Button>
                    <Button className="bg-brand-primary hover:bg-brand-primaryDark" size="sm">
                      Small Primary
                    </Button>
                    <Button className="bg-brand-primary hover:bg-brand-primaryDark" size="lg">
                      Large Primary
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="mb-2 block">Outline</Label>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" className="border-brand-border">
                      Outline Default
                    </Button>
                    <Button variant="outline" className="border-brand-border">
                      <Upload className="h-4 w-4 mr-2" />
                      Import CSV
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="mb-2 block">Secondary & Ghost</Label>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="secondary">Secondary</Button>
                    <Button variant="ghost">Ghost</Button>
                    <Button variant="link">Link Button</Button>
                  </div>
                </div>

                <div>
                  <Label className="mb-2 block">States</Label>
                  <div className="flex flex-wrap gap-2">
                    <Button disabled>Disabled</Button>
                    <Button className="bg-brand-primary hover:bg-brand-primaryDark">
                      <span className="animate-spin mr-2">⏳</span>
                      Loading...
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cards Tab */}
          <TabsContent value="cards" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card className="bg-brand-surface border-brand-border hover:border-brand-primary transition-colors">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Badge className="bg-slate-100 text-slate-600 text-[10px]">
                      Trading Cards
                    </Badge>
                  </div>
                  <CardTitle className="text-base">Charizard VMAX</CardTitle>
                  <CardDescription>Pokémon Champion's Path</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="aspect-square bg-slate-100 rounded-lg mb-3 flex items-center justify-center">
                    <Package className="h-12 w-12 text-slate-300" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <Building2 className="h-3 w-3" />
                      <span>TCG Wholesale</span>
                    </div>
                    <div className="text-sm font-semibold text-slate-900">$299.99</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-brand-primarySoft border-brand-primary">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-brand-primary" />
                    Grail Item
                  </CardTitle>
                  <CardDescription>Featured collectible</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600">
                    This card uses the brand's soft background (primarySoft) with primary border
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white border-brand-border">
                <CardHeader>
                  <CardTitle>Stats Card</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-slate-900 mb-1">1,234</div>
                  <p className="text-xs text-slate-500">Total Items</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Forms Tab */}
          <TabsContent value="forms" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Form Components</CardTitle>
                <CardDescription>Inputs, labels, and form controls</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="item-name">Item Name</Label>
                  <Input 
                    id="item-name" 
                    placeholder="Enter collectible name..." 
                    className="mt-1 border-brand-border focus:ring-brand-primary"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price">Price</Label>
                    <Input 
                      id="price" 
                      type="number" 
                      placeholder="0.00" 
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input 
                      id="quantity" 
                      type="number" 
                      placeholder="1" 
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button className="bg-brand-primary hover:bg-brand-primaryDark">
                    Save Item
                  </Button>
                  <Button variant="outline">Cancel</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Feedback Tab */}
          <TabsContent value="feedback" className="space-y-6">
            <div className="space-y-4">
              <Alert className="border-brand-primary bg-brand-primarySoft">
                <Info className="h-4 w-4 text-brand-primary" />
                <AlertTitle className="text-brand-primaryDark">Info Alert</AlertTitle>
                <AlertDescription className="text-slate-700">
                  This is an informational message using brand colors
                </AlertDescription>
              </Alert>

              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">Success</AlertTitle>
                <AlertDescription className="text-green-700">
                  Your item has been added successfully!
                </AlertDescription>
              </Alert>

              <Alert className="border-amber-200 bg-amber-50">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertTitle className="text-amber-800">Warning</AlertTitle>
                <AlertDescription className="text-amber-700">
                  This item is low in stock
                </AlertDescription>
              </Alert>

              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertTitle className="text-red-800">Error</AlertTitle>
                <AlertDescription className="text-red-700">
                  Failed to save item. Please try again.
                </AlertDescription>
              </Alert>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Loading Skeletons</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-12 w-12 rounded" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Data Display Tab */}
          <TabsContent value="data" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Badges & Pills</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="mb-2 block">Status Pills</Label>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-state-goodBg text-state-goodText rounded-full text-[11px]">
                      Mint in Box
                    </Badge>
                    <Badge className="bg-state-newBg text-state-newText rounded-full text-[11px]">
                      New
                    </Badge>
                    <Badge className="bg-slate-100 text-slate-600 rounded-full text-[11px]">
                      Used
                    </Badge>
                    <Badge className="bg-brand-primarySoft text-brand-primary rounded-full text-[11px]">
                      Featured
                    </Badge>
                  </div>
                </div>

                <div>
                  <Label className="mb-2 block">Category Badges</Label>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">Trading Cards</Badge>
                    <Badge variant="secondary">Video Games</Badge>
                    <Badge variant="secondary">Fashion</Badge>
                    <Badge variant="secondary">Beauty</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Avatars</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-brand-primarySoft text-brand-primary">
                      MB
                    </AvatarFallback>
                  </Avatar>
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-slate-100 text-slate-600 text-sm">
                      JD
                    </AvatarFallback>
                  </Avatar>
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-brand-primarySoft text-brand-primary text-xs">
                      AK
                    </AvatarFallback>
                  </Avatar>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card className="bg-brand-primarySoft border-brand-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-brand-primary" />
              Usage Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-700 space-y-2">
            <p>
              <strong>This page is development-only.</strong> It won't be accessible in production.
            </p>
            <p>
              Use this to quickly test component styling without Storybook overhead.
            </p>
            <p>
              <strong>Tip:</strong> Open React Query DevTools (bottom-right) to inspect API calls.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}