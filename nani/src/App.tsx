import { useState, useRef, useCallback } from 'react'
import { 
  Upload, 
  Download, 
  Box, 
  Layers, 
  Sparkles, 
  RefreshCw,
  Image as ImageIcon,
  CircleDot,
  Square,
  Triangle,
  Cylinder,
  Trash2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Toaster } from '@/components/ui/sonner'
import './App.css'
import Viewer3D from './components/Viewer3D'
import TexturePreview from './components/TexturePreview'
import { generatePBRTextures, type PBRTextures } from './utils/pbrGenerator'

function App() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [pbrTextures, setPbrTextures] = useState<PBRTextures | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedMesh, setSelectedMesh] = useState<'sphere' | 'cube' | 'plane' | 'torus' | 'cylinder'>('sphere')
  const [aoIntensity, setAoIntensity] = useState(1)
  const [roughnessIntensity, setRoughnessIntensity] = useState(1)
  const [metallicIntensity, setMetallicIntensity] = useState(0.5)
  const [normalStrength, setNormalStrength] = useState(1)
  const [autoRotate, setAutoRotate] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      setUploadedImage(result)
      generateTextures(result)
    }
    reader.readAsDataURL(file)
  }, [])

  const generateTextures = async (imageSrc: string) => {
    setIsGenerating(true)
    try {
      const textures = await generatePBRTextures(imageSrc, {
        aoIntensity,
        roughnessIntensity,
        metallicIntensity,
        normalStrength
      })
      setPbrTextures(textures)
      toast.success('PBR textures generated successfully!')
    } catch (error) {
      toast.error('Failed to generate PBR textures')
      console.error(error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFileUpload(file)
  }, [handleFileUpload])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const regenerateTextures = () => {
    if (uploadedImage) {
      generateTextures(uploadedImage)
    }
  }

  const clearAll = () => {
    setUploadedImage(null)
    setPbrTextures(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const downloadTexture = (dataUrl: string, filename: string) => {
    const link = document.createElement('a')
    link.href = dataUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success(`Downloaded ${filename}`)
  }

  const downloadAll = () => {
    if (!pbrTextures) return
    
    const timestamp = Date.now()
    downloadTexture(pbrTextures.albedo, `fabrik_albedo_${timestamp}.png`)
    downloadTexture(pbrTextures.ao, `fabrik_ao_${timestamp}.png`)
    downloadTexture(pbrTextures.roughness, `fabrik_roughness_${timestamp}.png`)
    downloadTexture(pbrTextures.metallic, `fabrik_metallic_${timestamp}.png`)
    downloadTexture(pbrTextures.normal, `fabrik_normal_${timestamp}.png`)
  }

  return (
    <div className="min-h-screen bg-gradient-radial text-foreground">
      <Toaster position="top-right" theme="dark" />
      
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center glow-orange">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Fabrik</h1>
              <p className="text-xs text-muted-foreground">PBR Texture Generator</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {uploadedImage && (
              <Button variant="ghost" size="sm" onClick={clearAll} className="text-muted-foreground hover:text-destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Clear
              </Button>
            )}
            <a 
              href="https://github.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {!uploadedImage ? (
          /* Upload Area */
          <div 
            className="min-h-[60vh] flex items-center justify-center"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <Card className="w-full max-w-2xl border-2 border-dashed border-border hover:border-primary/50 transition-all duration-300 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-12 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                />
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-orange-500/20 to-amber-600/20 flex items-center justify-center animate-pulse-glow">
                  <Upload className="w-10 h-10 text-primary" />
                </div>
                <h2 className="text-2xl font-semibold mb-3">Drop your texture here</h2>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Upload an image to automatically generate PBR textures including Ambient Occlusion, Metallic, Roughness, and Normal maps.
                </p>
                <Button 
                  size="lg" 
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-primary hover:bg-primary/90"
                >
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Select Image
                </Button>
                <p className="text-xs text-muted-foreground mt-4">
                  Supports PNG, JPG, WEBP • Max 10MB
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Main Editor */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Panel - 3D Viewer */}
            <div className="space-y-4">
              <Card className="overflow-hidden bg-card/50 backdrop-blur-sm border-border/50">
                <div className="p-4 border-b border-border/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Box className="w-4 h-4 text-primary" />
                    <span className="font-medium">3D Preview</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-8 w-8 ${selectedMesh === 'sphere' ? 'bg-primary/20 text-primary' : ''}`}
                      onClick={() => setSelectedMesh('sphere')}
                    >
                      <CircleDot className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-8 w-8 ${selectedMesh === 'cube' ? 'bg-primary/20 text-primary' : ''}`}
                      onClick={() => setSelectedMesh('cube')}
                    >
                      <Square className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-8 w-8 ${selectedMesh === 'plane' ? 'bg-primary/20 text-primary' : ''}`}
                      onClick={() => setSelectedMesh('plane')}
                    >
                      <Layers className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-8 w-8 ${selectedMesh === 'torus' ? 'bg-primary/20 text-primary' : ''}`}
                      onClick={() => setSelectedMesh('torus')}
                    >
                      <Triangle className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-8 w-8 ${selectedMesh === 'cylinder' ? 'bg-primary/20 text-primary' : ''}`}
                      onClick={() => setSelectedMesh('cylinder')}
                    >
                      <Cylinder className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="aspect-square bg-gradient-to-b from-muted/30 to-muted/10 checkerboard">
                  {pbrTextures && (
                    <Viewer3D 
                      textures={pbrTextures}
                      meshType={selectedMesh}
                      autoRotate={autoRotate}
                    />
                  )}
                </div>
                <div className="p-3 border-t border-border/50 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Switch 
                        id="autorotate" 
                        checked={autoRotate}
                        onCheckedChange={setAutoRotate}
                      />
                      <Label htmlFor="autorotate" className="text-sm cursor-pointer">Auto-rotate</Label>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={regenerateTextures}
                    disabled={isGenerating}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
                    Regenerate
                  </Button>
                </div>
              </Card>

              {/* Parameters */}
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="font-medium">Generation Parameters</span>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <Label>AO Intensity</Label>
                        <span className="text-muted-foreground">{aoIntensity.toFixed(1)}</span>
                      </div>
                      <Slider 
                        value={[aoIntensity]} 
                        onValueChange={([v]) => setAoIntensity(v)}
                        min={0} 
                        max={2} 
                        step={0.1}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <Label>Roughness</Label>
                        <span className="text-muted-foreground">{roughnessIntensity.toFixed(1)}</span>
                      </div>
                      <Slider 
                        value={[roughnessIntensity]} 
                        onValueChange={([v]) => setRoughnessIntensity(v)}
                        min={0} 
                        max={2} 
                        step={0.1}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <Label>Metallic</Label>
                        <span className="text-muted-foreground">{metallicIntensity.toFixed(1)}</span>
                      </div>
                      <Slider 
                        value={[metallicIntensity]} 
                        onValueChange={([v]) => setMetallicIntensity(v)}
                        min={0} 
                        max={1} 
                        step={0.05}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <Label>Normal Strength</Label>
                        <span className="text-muted-foreground">{normalStrength.toFixed(1)}</span>
                      </div>
                      <Slider 
                        value={[normalStrength]} 
                        onValueChange={([v]) => setNormalStrength(v)}
                        min={0} 
                        max={2} 
                        step={0.1}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Panel - Texture Previews */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">Generated Textures</h3>
                <Button onClick={downloadAll} disabled={!pbrTextures} className="bg-primary hover:bg-primary/90">
                  <Download className="w-4 h-4 mr-2" />
                  Download All
                </Button>
              </div>

              <Tabs defaultValue="albedo" className="w-full">
                <TabsList className="grid grid-cols-5 mb-4">
                  <TabsTrigger value="albedo">Albedo</TabsTrigger>
                  <TabsTrigger value="ao">AO</TabsTrigger>
                  <TabsTrigger value="roughness">Rough</TabsTrigger>
                  <TabsTrigger value="metallic">Metal</TabsTrigger>
                  <TabsTrigger value="normal">Normal</TabsTrigger>
                </TabsList>
                
                <TabsContent value="albedo">
                  <TexturePreview 
                    title="Albedo / Base Color"
                    description="The base color of the material without lighting information."
                    dataUrl={pbrTextures?.albedo}
                    onDownload={() => pbrTextures?.albedo && downloadTexture(pbrTextures.albedo, 'fabrik_albedo.png')}
                  />
                </TabsContent>
                
                <TabsContent value="ao">
                  <TexturePreview 
                    title="Ambient Occlusion"
                    description="Shadows in crevices and corners where light is occluded."
                    dataUrl={pbrTextures?.ao}
                    onDownload={() => pbrTextures?.ao && downloadTexture(pbrTextures.ao, 'fabrik_ao.png')}
                  />
                </TabsContent>
                
                <TabsContent value="roughness">
                  <TexturePreview 
                    title="Roughness"
                    description="How rough or smooth the surface appears. White = rough, Black = smooth."
                    dataUrl={pbrTextures?.roughness}
                    onDownload={() => pbrTextures?.roughness && downloadTexture(pbrTextures.roughness, 'fabrik_roughness.png')}
                  />
                </TabsContent>
                
                <TabsContent value="metallic">
                  <TexturePreview 
                    title="Metallic"
                    description="Whether the material is metallic or dielectric. White = metal, Black = non-metal."
                    dataUrl={pbrTextures?.metallic}
                    onDownload={() => pbrTextures?.metallic && downloadTexture(pbrTextures.metallic, 'fabrik_metallic.png')}
                  />
                </TabsContent>
                
                <TabsContent value="normal">
                  <TexturePreview 
                    title="Normal Map"
                    description="Surface detail and bump information for lighting calculations."
                    dataUrl={pbrTextures?.normal}
                    onDownload={() => pbrTextures?.normal && downloadTexture(pbrTextures.normal, 'fabrik_normal.png')}
                  />
                </TabsContent>
              </Tabs>

              {/* Original Image */}
              <Card className="bg-card/50 backdrop-blur-sm border-border/50 overflow-hidden">
                <div className="p-3 border-b border-border/50">
                  <span className="font-medium text-sm">Original Image</span>
                </div>
                <div className="aspect-video bg-muted/30 flex items-center justify-center p-4">
                  <img 
                    src={uploadedImage} 
                    alt="Original" 
                    className="max-w-full max-h-full object-contain rounded-lg"
                  />
                </div>
              </Card>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 mt-12 py-6">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-muted-foreground">
          <p>Fabrik PBR Generator • Built with React, Three.js & Tailwind CSS</p>
        </div>
      </footer>
    </div>
  )
}

export default App
