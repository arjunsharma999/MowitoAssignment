import * as THREE from 'three'

export class ModelLoader {
    constructor() {
        this.plyLoader = new THREE.PLYLoader()
       
    }

    async loadPLYModel(url, onProgress, onError) {
        return new Promise((resolve, reject) => {
            this.plyLoader.load(
                url,
                (geometry) => {
                    try {
                      
                        const material = new THREE.MeshLambertMaterial({
                            color: 0x3b82f6,
                            transparent: true,
                            opacity: 0.9,
                            side: THREE.DoubleSide
                        })

                       
                        const mesh = new THREE.Mesh(geometry, material)
                        
                        mesh.castShadow = true
                        mesh.receiveShadow = true

                       
                        geometry.computeBoundingBox()
                        const center = geometry.boundingBox.getCenter(new THREE.Vector3())
                        geometry.translate(-center.x, -center.y, -center.z)

                      
                        const size = geometry.boundingBox.getSize(new THREE.Vector3())
                        const maxDim = Math.max(size.x, size.y, size.z)
                        const scale = 4 / maxDim
                        mesh.scale.setScalar(scale)

                        resolve(mesh)
                    } catch (error) {
                        reject(new Error(`Error processing PLY model: ${error.message}`))
                    }
                },
                onProgress,
                (error) => {
                    reject(new Error(`Failed to load PLY file: ${error.message}`))
                }
            )
        })
    }

    async loadSPLATModel(url, onProgress, onError) {
        return new Promise((resolve, reject) => {
     
            try {
                
                const geometry = new THREE.SphereGeometry(1.5, 32, 32)
                const material = new THREE.MeshLambertMaterial({
                    color: 0x8b5cf6,
                    transparent: true,
                    opacity: 0.9,
                    side: THREE.DoubleSide
                })

                const mesh = new THREE.Mesh(geometry, material)
                mesh.castShadow = true
                mesh.receiveShadow = true

                
                const torusGeometry = new THREE.TorusGeometry(0.8, 0.3, 16, 32)
                const torusMaterial = new THREE.MeshLambertMaterial({ color: 0xf59e0b })
                const torus = new THREE.Mesh(torusGeometry, torusMaterial)
                torus.position.set(0, 0, 0)
                torus.rotation.x = Math.PI / 2
                torus.castShadow = true

                
                const group = new THREE.Group()
                group.add(mesh)
                group.add(torus)

             
                const octahedronGeometry = new THREE.OctahedronGeometry(0.4)
                const octahedronMaterial = new THREE.MeshLambertMaterial({ color: 0xec4899 })
                const octahedron = new THREE.Mesh(octahedronGeometry, octahedronMaterial)
                octahedron.position.set(0, 1.5, 0)
                octahedron.castShadow = true
                group.add(octahedron)

                resolve(group)
            } catch (error) {
                reject(new Error(`Error creating SPLAT model: ${error.message}`))
            }
        })
    }

 
    createProgressBar() {
        const progressContainer = document.createElement('div')
        progressContainer.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50'
        progressContainer.innerHTML = `
            <div class="bg-gray-800 bg-opacity-95 backdrop-blur-sm rounded-lg p-6 shadow-xl text-center min-w-80">
                <div class="loading-spinner mx-auto mb-4"></div>
                <h3 class="text-lg font-semibold text-white mb-3">Loading 3D Model</h3>
                <div class="w-full bg-gray-700 rounded-full h-2 mb-3">
                    <div id="progress-bar" class="bg-blue-600 h-2 rounded-full transition-all duration-300" style="width: 0%"></div>
                </div>
                <p id="progress-text" class="text-gray-300 text-sm">0%</p>
            </div>
        `
        return progressContainer
    }

  
    updateProgress(progressElement, textElement, progress) {
        if (progressElement && textElement) {
            const percentage = Math.round(progress * 100)
            progressElement.style.width = `${percentage}%`
            textElement.textContent = `${percentage}%`
        }
    }

    
    removeProgressBar(progressContainer) {
        if (progressContainer && progressContainer.parentNode) {
            progressContainer.parentNode.removeChild(progressContainer)
        }
    }
}
