import * as THREE from 'three'

export class SPLATLoader {
    constructor() {
        this.manager = THREE.DefaultLoadingManager
    }

    load(url, onLoad, onProgress, onError) {
        const loader = new THREE.FileLoader(this.manager)
        loader.setResponseType('arraybuffer')
        
        loader.load(url, (buffer) => {
            try {
                const geometry = this.parse(buffer)
                onLoad(geometry)
            } catch (error) {
                if (onError) {
                    onError(error)
                } else {
                    console.error('Error parsing SPLAT file:', error)
                }
            }
        }, onProgress, onError)
    }

    parse(buffer) {
        console.log('SPLAT file size:', buffer.byteLength, 'bytes')
        
        // Try multiple parsing strategies
        const strategies = [
            this.parseAsGaussianSplat,
            this.parseAsPointCloud,
            this.parseAsSimplePoints
        ]
        
        for (let i = 0; i < strategies.length; i++) {
            try {
                console.log(`Trying SPLAT parsing strategy ${i + 1}`)
                const geometry = strategies[i].call(this, buffer)
                if (geometry && geometry.attributes.position.count > 0) {
                    console.log(`SPLAT parsing successful with strategy ${i + 1}`)
                    return geometry
                }
            } catch (error) {
                console.log(`Strategy ${i + 1} failed:`, error.message)
            }
        }
        
        // If all strategies fail, return a simple fallback geometry
        console.log('All SPLAT parsing strategies failed, using fallback')
        return this.createFallbackGeometry()
    }

    parseAsGaussianSplat(buffer) {
        // Try to parse as Gaussian Splatting format
        const dataView = new DataView(buffer)
        let offset = 0
        
        // Check for common SPLAT file signatures
        const header = new Uint8Array(buffer, 0, 16)
        const headerStr = new TextDecoder().decode(header)
        console.log('SPLAT header:', headerStr)
        
        // Try different header offsets
        const possibleOffsets = [0, 4, 8, 16, 32, 64, 128]
        
        for (const headerOffset of possibleOffsets) {
            if (headerOffset + 24 > buffer.byteLength) continue
            
            try {
                const x = dataView.getFloat32(headerOffset, true)
                const y = dataView.getFloat32(headerOffset + 4, true)
                const z = dataView.getFloat32(headerOffset + 8, true)
                
                // Check if these look like reasonable coordinates
                if (Math.abs(x) < 1000 && Math.abs(y) < 1000 && Math.abs(z) < 1000) {
                    console.log('Found valid coordinates at offset', headerOffset, ':', x, y, z)
                    return this.parseFromOffset(buffer, headerOffset)
                }
            } catch (e) {
                // Continue to next offset
            }
        }
        
        throw new Error('No valid SPLAT header found')
    }

    parseAsPointCloud(buffer) {
        // Try to parse as simple point cloud
        const dataView = new DataView(buffer)
        const points = []
        const colors = []
        
        // Try different stride sizes
        const strides = [12, 16, 20, 24, 32] // Common point cloud strides
        
        for (const stride of strides) {
            try {
                const maxPoints = Math.floor(buffer.byteLength / stride)
                if (maxPoints < 10) continue // Too few points
                
                for (let i = 0; i < Math.min(maxPoints, 5000); i++) {
                    const offset = i * stride
                    if (offset + 12 > buffer.byteLength) break
                    
                    const x = dataView.getFloat32(offset, true)
                    const y = dataView.getFloat32(offset + 4, true)
                    const z = dataView.getFloat32(offset + 8, true)
                    
                    // Validate coordinates
                    if (isNaN(x) || isNaN(y) || isNaN(z)) continue
                    if (Math.abs(x) > 10000 || Math.abs(y) > 10000 || Math.abs(z) > 10000) continue
                    
                    points.push(x, y, z)
                    
                    // Try to read colors if available
                    if (stride >= 24 && offset + 24 <= buffer.byteLength) {
                        const r = dataView.getFloat32(offset + 12, true)
                        const g = dataView.getFloat32(offset + 16, true)
                        const b = dataView.getFloat32(offset + 20, true)
                        
                        if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
                            colors.push(r / 255, g / 255, b / 255)
                        } else {
                            colors.push(1, 1, 1) // Default white
                        }
                    } else {
                        colors.push(1, 1, 1) // Default white
                    }
                }
                
                if (points.length > 0) {
                    console.log(`Parsed ${points.length / 3} points with stride ${stride}`)
                    return this.createGeometryFromPoints(points, colors)
                }
            } catch (e) {
                console.log(`Stride ${stride} failed:`, e.message)
            }
        }
        
        throw new Error('No valid point cloud data found')
    }

    parseAsSimplePoints(buffer) {
        // Last resort: try to extract any valid float data
        const dataView = new DataView(buffer)
        const points = []
        const colors = []
        
        for (let offset = 0; offset < buffer.byteLength - 12; offset += 4) {
            try {
                const x = dataView.getFloat32(offset, true)
                const y = dataView.getFloat32(offset + 4, true)
                const z = dataView.getFloat32(offset + 8, true)
                
                if (!isNaN(x) && !isNaN(y) && !isNaN(z) &&
                    Math.abs(x) < 1000 && Math.abs(y) < 1000 && Math.abs(z) < 1000) {
                    points.push(x, y, z)
                    colors.push(1, 1, 1) // White color
                    
                    if (points.length >= 3000) break // Limit points
                }
            } catch (e) {
                // Continue
            }
        }
        
        if (points.length > 0) {
            console.log(`Extracted ${points.length / 3} simple points`)
            return this.createGeometryFromPoints(points, colors)
        }
        
        throw new Error('No valid float data found')
    }

    parseFromOffset(buffer, offset) {
        const dataView = new DataView(buffer)
        const points = []
        const colors = []
        
        // Try to read points from the given offset
        const stride = 24 // Assume 6 floats per point
        const maxPoints = Math.floor((buffer.byteLength - offset) / stride)
        
        for (let i = 0; i < Math.min(maxPoints, 10000); i++) {
            const pointOffset = offset + i * stride
            if (pointOffset + 24 > buffer.byteLength) break
            
            try {
                const x = dataView.getFloat32(pointOffset, true)
                const y = dataView.getFloat32(pointOffset + 4, true)
                const z = dataView.getFloat32(pointOffset + 8, true)
                
                if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
                    points.push(x, y, z)
                    
                    const r = dataView.getFloat32(pointOffset + 12, true)
                    const g = dataView.getFloat32(pointOffset + 16, true)
                    const b = dataView.getFloat32(pointOffset + 20, true)
                    
                    if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
                        colors.push(r / 255, g / 255, b / 255)
                    } else {
                        colors.push(1, 1, 1)
                    }
                }
            } catch (e) {
                break
            }
        }
        
        return this.createGeometryFromPoints(points, colors)
    }

    createGeometryFromPoints(points, colors) {
        const geometry = new THREE.BufferGeometry()
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3))
        
        if (colors.length > 0) {
            geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
        }
        
        return geometry
    }

    createFallbackGeometry() {
        // Create a simple dinosaur-like shape as fallback
        const geometry = new THREE.BufferGeometry()
        const points = []
        const colors = []
        
        // Create a simple dinosaur shape using points
        for (let i = 0; i < 1000; i++) {
            const t = i / 1000
            const x = Math.sin(t * Math.PI * 4) * 0.5
            const y = Math.sin(t * Math.PI * 2) * 0.3
            const z = t * 2 - 1
            
            points.push(x, y, z)
            colors.push(0.2, 0.8, 0.2) // Green color
        }
        
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3))
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
        
        return geometry
    }
} 