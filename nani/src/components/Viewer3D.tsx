import { useRef, useEffect, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Environment, Grid } from '@react-three/drei'
import * as THREE from 'three'
import type { PBRTextures } from '@/utils/pbrGenerator'

interface MeshProps {
  textures: PBRTextures
  meshType: 'sphere' | 'cube' | 'plane' | 'torus' | 'cylinder'
  autoRotate: boolean
}

function MaterialMesh({ textures, meshType, autoRotate }: MeshProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [material, setMaterial] = useState<THREE.MeshStandardMaterial | null>(null)
  
  useEffect(() => {
    const loader = new THREE.TextureLoader()
    
    // Load all textures
    const albedoMap = loader.load(textures.albedo)
    const aoMap = loader.load(textures.ao)
    const roughnessMap = loader.load(textures.roughness)
    const metallicMap = loader.load(textures.metallic)
    const normalMap = loader.load(textures.normal)
    
    // Configure textures
    albedoMap.colorSpace = THREE.SRGBColorSpace
    
    ;[albedoMap, aoMap, roughnessMap, metallicMap, normalMap].forEach(tex => {
      tex.wrapS = THREE.RepeatWrapping
      tex.wrapT = THREE.RepeatWrapping
    })
    
    // Create material
    const mat = new THREE.MeshStandardMaterial({
      map: albedoMap,
      aoMap: aoMap,
      roughnessMap: roughnessMap,
      metalnessMap: metallicMap,
      normalMap: normalMap,
      roughness: 1,
      metalness: 1,
    })
    
    setMaterial(mat)
    
    return () => {
      albedoMap.dispose()
      aoMap.dispose()
      roughnessMap.dispose()
      metallicMap.dispose()
      normalMap.dispose()
      mat.dispose()
    }
  }, [textures])
  
  // Auto rotation
  useFrame((_, delta) => {
    if (meshRef.current && autoRotate) {
      meshRef.current.rotation.y += delta * 0.5
      meshRef.current.rotation.x = Math.sin(Date.now() * 0.001) * 0.1
    }
  })
  
  if (!material) return null
  
  const renderMesh = () => {
    switch (meshType) {
      case 'sphere':
        return (
          <mesh ref={meshRef} material={material}>
            <sphereGeometry args={[1.5, 64, 64]} />
          </mesh>
        )
      case 'cube':
        return (
          <mesh ref={meshRef} material={material}>
            <boxGeometry args={[2.5, 2.5, 2.5]} />
          </mesh>
        )
      case 'plane':
        return (
          <mesh ref={meshRef} material={material} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[4, 4]} />
          </mesh>
        )
      case 'torus':
        return (
          <mesh ref={meshRef} material={material}>
            <torusKnotGeometry args={[1, 0.3, 128, 32]} />
          </mesh>
        )
      case 'cylinder':
        return (
          <mesh ref={meshRef} material={material}>
            <cylinderGeometry args={[1, 1, 3, 64]} />
          </mesh>
        )
      default:
        return null
    }
  }
  
  return renderMesh()
}

function Scene({ textures, meshType, autoRotate }: MeshProps) {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
      <directionalLight position={[-5, 3, -5]} intensity={0.5} />
      <pointLight position={[0, 5, 0]} intensity={0.5} />
      
      {/* Environment */}
      <Environment preset="studio" />
      
      {/* Grid */}
      <Grid
        position={[0, -2, 0]}
        args={[10, 10]}
        cellSize={0.5}
        cellThickness={0.5}
        cellColor="#444444"
        sectionSize={2}
        sectionThickness={1}
        sectionColor="#666666"
        fadeDistance={10}
        fadeStrength={1}
        infiniteGrid
      />
      
      {/* Mesh with PBR material */}
      <MaterialMesh 
        textures={textures} 
        meshType={meshType}
        autoRotate={autoRotate}
      />
      
      {/* Controls */}
      <OrbitControls 
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={3}
        maxDistance={10}
        target={[0, 0, 0]}
      />
    </>
  )
}

interface Viewer3DProps {
  textures: PBRTextures
  meshType: 'sphere' | 'cube' | 'plane' | 'torus' | 'cylinder'
  autoRotate: boolean
}

export default function Viewer3D({ textures, meshType, autoRotate }: Viewer3DProps) {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        gl={{ 
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance'
        }}
        dpr={[1, 2]}
      >
        <Scene 
          textures={textures} 
          meshType={meshType}
          autoRotate={autoRotate}
        />
      </Canvas>
    </div>
  )
}
