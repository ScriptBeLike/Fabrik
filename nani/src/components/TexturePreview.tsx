import { Download, ZoomIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'

interface TexturePreviewProps {
  title: string
  description: string
  dataUrl: string | undefined
  onDownload: () => void
}

export default function TexturePreview({ title, description, dataUrl, onDownload }: TexturePreviewProps) {
  if (!dataUrl) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardContent className="p-8 text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-muted animate-pulse" />
          <p className="text-muted-foreground">Generating texture...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50 overflow-hidden">
      <CardContent className="p-0">
        {/* Image Preview */}
        <div className="aspect-square bg-muted/30 checkerboard relative group">
          <img 
            src={dataUrl} 
            alt={title}
            className="w-full h-full object-contain"
          />
          
          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="secondary" size="sm">
                  <ZoomIn className="w-4 h-4 mr-2" />
                  View Full
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl p-0 bg-background/95 backdrop-blur-xl">
                <div className="p-4">
                  <h3 className="text-lg font-semibold mb-2">{title}</h3>
                  <div className="aspect-square bg-muted/30 checkerboard rounded-lg overflow-hidden">
                    <img 
                      src={dataUrl} 
                      alt={title}
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            
            <Button variant="secondary" size="sm" onClick={onDownload}>
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>
        </div>
        
        {/* Info */}
        <div className="p-4 border-t border-border/50">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h4 className="font-medium text-sm">{title}</h4>
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            </div>
            <Button variant="ghost" size="icon" className="shrink-0" onClick={onDownload}>
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
