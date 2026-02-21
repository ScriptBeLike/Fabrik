export interface PBRTextures {
  albedo: string
  ao: string
  roughness: string
  metallic: string
  normal: string
}

export interface PBROptions {
  aoIntensity: number
  roughnessIntensity: number
  metallicIntensity: number
  normalStrength: number
}

// Sobel operators for edge detection
const SOBEL_X = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]]
const SOBEL_Y = [[-1, -2, -1], [0, 0, 0], [1, 2, 1]]

function getPixel(data: Uint8ClampedArray, width: number, x: number, y: number): [number, number, number, number] {
  const idx = (y * width + x) * 4
  return [data[idx], data[idx + 1], data[idx + 2], data[idx + 3]]
}

function setPixel(data: Uint8ClampedArray, width: number, x: number, y: number, r: number, g: number, b: number, a: number = 255) {
  const idx = (y * width + x) * 4
  data[idx] = r
  data[idx + 1] = g
  data[idx + 2] = b
  data[idx + 3] = a
}

function grayscale(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

// Generate Ambient Occlusion from luminance variations
function generateAO(srcData: Uint8ClampedArray, width: number, height: number, intensity: number): Uint8ClampedArray {
  const dstData = new Uint8ClampedArray(width * height * 4)
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const [r, g, b] = getPixel(srcData, width, x, y)
      const lum = grayscale(r, g, b)
      
      // Calculate local contrast for AO effect
      let contrast = 0
      let count = 0
      
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          const nx = x + dx
          const ny = y + dy
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const [nr, ng, nb] = getPixel(srcData, width, nx, ny)
            const nLum = grayscale(nr, ng, nb)
            contrast += Math.abs(lum - nLum)
            count++
          }
        }
      }
      
      const avgContrast = contrast / count
      // Darker areas with high contrast get darker AO
      const aoValue = clamp(255 - (avgContrast * intensity * 2) - (255 - lum) * 0.3, 0, 255)
      
      setPixel(dstData, width, x, y, aoValue, aoValue, aoValue)
    }
  }
  
  return dstData
}

// Generate Roughness from color variation and luminance
function generateRoughness(srcData: Uint8ClampedArray, width: number, height: number, intensity: number): Uint8ClampedArray {
  const dstData = new Uint8ClampedArray(width * height * 4)
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const [r, g, b] = getPixel(srcData, width, x, y)
      const lum = grayscale(r, g, b)
      
      // Calculate color variance in local area
      let variance = 0
      let count = 0
      
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx
          const ny = y + dy
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const [nr, ng, nb] = getPixel(srcData, width, nx, ny)
            variance += Math.abs(r - nr) + Math.abs(g - ng) + Math.abs(b - nb)
            count++
          }
        }
      }
      
      const avgVariance = variance / count
      // Higher variance = rougher surface
      const roughness = clamp((avgVariance * intensity * 0.5) + (255 - lum) * 0.3, 0, 255)
      
      setPixel(dstData, width, x, y, roughness, roughness, roughness)
    }
  }
  
  return dstData
}

// Generate Metallic from brightness and color saturation
function generateMetallic(srcData: Uint8ClampedArray, width: number, height: number, intensity: number): Uint8ClampedArray {
  const dstData = new Uint8ClampedArray(width * height * 4)
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const [r, g, b] = getPixel(srcData, width, x, y)
      const lum = grayscale(r, g, b)
      
      // Calculate saturation
      const max = Math.max(r, g, b)
      const min = Math.min(r, g, b)
      const saturation = max === 0 ? 0 : (max - min) / max
      
      // Bright, desaturated areas tend to be more metallic
      // Dark, saturated areas tend to be less metallic
      const metallic = clamp(
        (lum * intensity) * (1 - saturation * 0.5),
        0, 255
      )
      
      setPixel(dstData, width, x, y, metallic, metallic, metallic)
    }
  }
  
  return dstData
}

// Generate Normal map from height map derived from luminance
function generateNormal(srcData: Uint8ClampedArray, width: number, height: number, strength: number): Uint8ClampedArray {
  const dstData = new Uint8ClampedArray(width * height * 4)
  
  // First create height map from luminance
  const heightMap = new Float32Array(width * height)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const [r, g, b] = getPixel(srcData, width, x, y)
      heightMap[y * width + x] = grayscale(r, g, b) / 255
    }
  }
  
  // Apply Sobel filter to get normals
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let dx = 0
      let dy = 0
      
      // Apply Sobel operators
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const nx = clamp(x + kx, 0, width - 1)
          const ny = clamp(y + ky, 0, height - 1)
          const heightVal = heightMap[ny * width + nx]
          
          dx += heightVal * SOBEL_X[ky + 1][kx + 1]
          dy += heightVal * SOBEL_Y[ky + 1][kx + 1]
        }
      }
      
      // Calculate normal vector
      const normalX = -dx * strength
      const normalY = -dy * strength
      const normalZ = 1
      
      // Normalize
      const len = Math.sqrt(normalX * normalX + normalY * normalY + normalZ * normalZ)
      const nx = (normalX / len + 1) * 0.5 * 255
      const ny = (normalY / len + 1) * 0.5 * 255
      const nz = (normalZ / len + 1) * 0.5 * 255
      
      setPixel(dstData, width, x, y, nx, ny, nz)
    }
  }
  
  return dstData
}

export async function generatePBRTextures(
  imageSrc: string, 
  options: PBROptions
): Promise<PBRTextures> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')!
        
        // Limit size for performance
        const maxSize = 1024
        let width = img.width
        let height = img.height
        
        if (width > maxSize || height > maxSize) {
          const ratio = Math.min(maxSize / width, maxSize / height)
          width = Math.floor(width * ratio)
          height = Math.floor(height * ratio)
        }
        
        canvas.width = width
        canvas.height = height
        
        // Draw original image
        ctx.drawImage(img, 0, 0, width, height)
        
        // Get image data
        const imageData = ctx.getImageData(0, 0, width, height)
        const srcData = imageData.data
        
        // Generate Albedo (just the original image)
        const albedoCanvas = document.createElement('canvas')
        albedoCanvas.width = width
        albedoCanvas.height = height
        const albedoCtx = albedoCanvas.getContext('2d')!
        albedoCtx.drawImage(img, 0, 0, width, height)
        
        // Generate AO
        const aoData = generateAO(srcData, width, height, options.aoIntensity)
        const aoCanvas = document.createElement('canvas')
        aoCanvas.width = width
        aoCanvas.height = height
        const aoCtx = aoCanvas.getContext('2d')!
        const aoImageData = ctx.createImageData(width, height)
        aoImageData.data.set(aoData)
        aoCtx.putImageData(aoImageData, 0, 0)
        
        // Generate Roughness
        const roughnessData = generateRoughness(srcData, width, height, options.roughnessIntensity)
        const roughnessCanvas = document.createElement('canvas')
        roughnessCanvas.width = width
        roughnessCanvas.height = height
        const roughnessCtx = roughnessCanvas.getContext('2d')!
        const roughnessImageData = ctx.createImageData(width, height)
        roughnessImageData.data.set(roughnessData)
        roughnessCtx.putImageData(roughnessImageData, 0, 0)
        
        // Generate Metallic
        const metallicData = generateMetallic(srcData, width, height, options.metallicIntensity)
        const metallicCanvas = document.createElement('canvas')
        metallicCanvas.width = width
        metallicCanvas.height = height
        const metallicCtx = metallicCanvas.getContext('2d')!
        const metallicImageData = ctx.createImageData(width, height)
        metallicImageData.data.set(metallicData)
        metallicCtx.putImageData(metallicImageData, 0, 0)
        
        // Generate Normal
        const normalData = generateNormal(srcData, width, height, options.normalStrength)
        const normalCanvas = document.createElement('canvas')
        normalCanvas.width = width
        normalCanvas.height = height
        const normalCtx = normalCanvas.getContext('2d')!
        const normalImageData = ctx.createImageData(width, height)
        normalImageData.data.set(normalData)
        normalCtx.putImageData(normalImageData, 0, 0)
        
        resolve({
          albedo: albedoCanvas.toDataURL('image/png'),
          ao: aoCanvas.toDataURL('image/png'),
          roughness: roughnessCanvas.toDataURL('image/png'),
          metallic: metallicCanvas.toDataURL('image/png'),
          normal: normalCanvas.toDataURL('image/png')
        })
      } catch (error) {
        reject(error)
      }
    }
    
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = imageSrc
  })
}
