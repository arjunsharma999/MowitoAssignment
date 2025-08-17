import * as THREE from 'three'
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { SPLATLoader } from './SPLATLoader.js'

export class ModelViewer {
    constructor() {
        this.scene = null
        this.camera = null
        this.renderer = null
        this.controls = null
        this.model = null
        this.currentCheckpoint = 0
        this.currentFormat = 'PLY' // 'PLY' or 'SPLAT'
        this.checkpoints = [
            { name: 'Front View', rotation: { x: 0, y: 0, z: 0 }, position: { x: 0, y: 0, z: 0 } },
            { name: 'Right Side', rotation: { x: 0, y: Math.PI / 2, z: 0 }, position: { x: 0, y: 0, z: 0 } },
            { name: 'Left Side', rotation: { x: 0, y: -Math.PI / 2, z: 0 }, position: { x: 0, y: 0, z: 0 } },
            { name: 'Top View', rotation: { x: Math.PI / 2, y: 0, z: 0 }, position: { x: 0, y: 0, z: 0 } },
            { name: 'Bottom View', rotation: { x: -Math.PI / 2, y: 0, z: 0 }, position: { x: 0, y: 0, z: 0 } },
            { name: 'Isometric View', rotation: { x: -Math.PI / 4, y: Math.PI / 4, z: 0 }, position: { x: 0, y: 0, z: 0 } }
        ]
        
        this.init()
        this.createUI()
        this.loadModel()
        this.animate()
    }

    init() {
        // Create scene
        this.scene = new THREE.Scene()
        this.scene.background = new THREE.Color(0x1f2937)

        // Create camera
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
        this.camera.position.set(0, 0, 5)

        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true })
        this.renderer.setSize(window.innerWidth, window.innerHeight)
        this.renderer.setPixelRatio(window.devicePixelRatio)
        this.renderer.shadowMap.enabled = true
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap

        // Add renderer to DOM
        document.getElementById('app').appendChild(this.renderer.domElement)

        // Create controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement)
        this.controls.enableDamping = true
        this.controls.dampingFactor = 0.05

        // Add lights
        this.addLights()

        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize())
    }

    addLights() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6)
        this.scene.add(ambientLight)

        // Directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
        directionalLight.position.set(10, 10, 5)
        directionalLight.castShadow = true
        directionalLight.shadow.mapSize.width = 2048
        directionalLight.shadow.mapSize.height = 2048
        this.scene.add(directionalLight)

        // Point light
        const pointLight = new THREE.PointLight(0xffffff, 0.5)
        pointLight.position.set(-10, -10, -5)
        this.scene.add(pointLight)
    }

    createUI() {
        const container = document.getElementById('app')
        
        // Create UI overlay
        const uiOverlay = document.createElement('div')
        uiOverlay.className = 'absolute top-0 left-0 w-full h-full pointer-events-none z-10'
        
        // Header with title and format toggle
        const header = document.createElement('div')
        header.className = 'absolute top-4 left-4 right-4 pointer-events-auto'
        header.innerHTML = `
            <div class="bg-gray-800 bg-opacity-90 backdrop-blur-sm rounded-lg p-4 shadow-lg">
                <div class="text-center mb-2">
                    <h1 class="text-2xl font-bold text-white mb-2">3D Model Viewer</h1>
                    <p class="text-gray-300 text-sm mb-3">Model Format: <span id="current-format" class="font-semibold text-blue-400">${this.currentFormat}</span></p>
                    <div class="flex justify-center items-center space-x-4">
                        <label class="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" id="format-toggle" class="sr-only peer">
                            <div class="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            <span class="ml-3 text-sm font-medium text-gray-300">PLY/SPLAT</span>
                        </label>
                        <button id="reload-model" class="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors">
                            Reload Model
                        </button>
                    </div>
                </div>
            </div>
        `
        
        // Checkpoint list
        const checkpointList = document.createElement('div')
        checkpointList.className = 'absolute top-4 right-4 pointer-events-auto'
        checkpointList.innerHTML = `
            <div class="bg-gray-800 bg-opacity-90 backdrop-blur-sm rounded-lg p-4 shadow-lg w-64">
                <h3 class="text-lg font-semibold text-white mb-3">Checkpoints</h3>
                <div id="checkpoint-list" class="space-y-2">
                    ${this.checkpoints.map((checkpoint, index) => `
                        <div class="checkpoint-item p-2 rounded cursor-pointer ${index === 0 ? 'active' : ''}" 
                             data-index="${index}">
                            <span class="text-sm">${checkpoint.name}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `
        
        // Navigation controls
        const navigation = document.createElement('div')
        navigation.className = 'absolute bottom-4 left-1/2 transform -translate-x-1/2 pointer-events-auto'
        navigation.innerHTML = `
            <div class="bg-gray-800 bg-opacity-90 backdrop-blur-sm rounded-lg p-4 shadow-lg">
                <div class="flex items-center space-x-4">
                    <button id="prev-btn" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                        PREV
                    </button>
                    <span id="checkpoint-info" class="text-white font-medium px-4 py-2 bg-gray-700 rounded-lg">
                        ${this.checkpoints[0].name}
                    </span>
                    <button id="next-btn" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                        NEXT
                    </button>
                </div>
            </div>
        `
        
        // Loading indicator
        const loading = document.createElement('div')
        loading.id = 'loading'
        loading.className = 'absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto'
        loading.innerHTML = `
            <div class="bg-gray-800 bg-opacity-90 backdrop-blur-sm rounded-lg p-6 shadow-lg text-center">
                <div class="loading-spinner mx-auto mb-4"></div>
                <p class="text-white">Loading 3D Model...</p>
            </div>
        `
        
        uiOverlay.appendChild(header)
        uiOverlay.appendChild(checkpointList)
        uiOverlay.appendChild(navigation)
        uiOverlay.appendChild(loading)
        container.appendChild(uiOverlay)
        
        // Add event listeners
        this.addEventListeners()
    }

    addEventListeners() {
        // Navigation buttons
        document.getElementById('prev-btn').addEventListener('click', () => this.previousCheckpoint())
        document.getElementById('next-btn').addEventListener('click', () => this.nextCheckpoint())
        
        // Checkpoint list items
        document.getElementById('checkpoint-list').addEventListener('click', (e) => {
            if (e.target.closest('.checkpoint-item')) {
                const index = parseInt(e.target.closest('.checkpoint-item').dataset.index)
                this.goToCheckpoint(index)
            }
        })

        // Format toggle
        document.getElementById('format-toggle').addEventListener('change', (e) => {
            this.currentFormat = e.target.checked ? 'SPLAT' : 'PLY'
            this.updateFormatDisplay()
            this.reloadModel()
        })

        // Reload model button
        document.getElementById('reload-model').addEventListener('click', () => {
            this.reloadModel()
        })
    }

    updateFormatDisplay() {
        const formatElement = document.getElementById('current-format')
        if (formatElement) {
            formatElement.textContent = this.currentFormat
        }
    }

    reloadModel() {
        // Remove existing model
        if (this.model) {
            this.scene.remove(this.model)
            this.model = null
        }

        // Show loading indicator
        const loading = document.getElementById('loading')
        if (loading) {
            loading.style.display = 'block'
            loading.innerHTML = `
                <div class="bg-gray-800 bg-opacity-90 backdrop-blur-sm rounded-lg p-6 shadow-lg text-center">
                    <div class="loading-spinner mx-auto mb-4"></div>
                    <p class="text-white">Loading ${this.currentFormat} Model...</p>
                </div>
            `
        }

        // Load new model
        this.loadModel()
    }

    async loadModel() {
        try {
            if (this.currentFormat === 'PLY') {
                await this.loadPLYModel()
            } else {
                await this.loadSPLATModel()
            }
            
            // Hide loading indicator
            document.getElementById('loading').style.display = 'none'
            
            // Go to first checkpoint
            this.goToCheckpoint(0)
            
        } catch (error) {
            console.error('Error loading model:', error)
            document.getElementById('loading').innerHTML = `
                <div class="bg-red-800 bg-opacity-90 backdrop-blur-sm rounded-lg p-6 shadow-lg text-center">
                    <p class="text-white">Error loading ${this.currentFormat} model</p>
                    <p class="text-red-300 text-sm mt-2">${error.message}</p>
                </div>
            `
        }
    }

    async loadPLYModel() {
        try {
            // Load the actual PLY file
            const loader = new PLYLoader()
            const geometry = await new Promise((resolve, reject) => {
                loader.load(
                    '/models/Patchwork chair.ply', // Your PLY file path
                    (geometry) => resolve(geometry),
                    (progress) => {
                        console.log('Loading progress:', (progress.loaded / progress.total * 100) + '%')
                    },
                    (error) => reject(error)
                )
            })
            
            // Create material for the PLY model
            // Check if the geometry has vertex colors
            const hasVertexColors = geometry.attributes.color && geometry.attributes.color.count > 0
            
            const material = new THREE.MeshLambertMaterial({ 
                color: hasVertexColors ? 0xffffff : 0x3b82f6, // Use white if vertex colors exist
                vertexColors: hasVertexColors, // Enable vertex colors if they exist
                transparent: true,
                opacity: 0.9
            })
            
            this.model = new THREE.Mesh(geometry, material)
            this.model.castShadow = true
            this.model.receiveShadow = true
            
            // Center and scale the model appropriately
            this.centerAndScaleModel()
            
            this.scene.add(this.model)
            
        } catch (error) {
            console.error('Error loading PLY file:', error)
            // Fallback to sample model if loading fails
            this.createSamplePLYModel()
        }
    }

    async loadSPLATModel() {
        try {
            console.log('Starting SPLAT model loading...')
            
            // Load the actual SPLAT file
            const loader = new SPLATLoader()
            const geometry = await new Promise((resolve, reject) => {
                loader.load(
                    '/models/dino_30k_cropped.splat', // Your SPLAT file path
                    (geometry) => {
                        console.log('SPLAT geometry loaded:', geometry)
                        console.log('Position count:', geometry.attributes.position?.count || 0)
                        console.log('Color count:', geometry.attributes.color?.count || 0)
                        resolve(geometry)
                    },
                    (progress) => {
                        console.log('Loading SPLAT progress:', (progress.loaded / progress.total * 100) + '%')
                    },
                    (error) => {
                        console.error('SPLAT loader error:', error)
                        reject(error)
                    }
                )
            })
            
            // Check if the geometry has vertex colors
            const hasVertexColors = geometry.attributes.color && geometry.attributes.color.count > 0
            console.log('Has vertex colors:', hasVertexColors)
            
            // Create material for the SPLAT model
            const material = new THREE.PointsMaterial({ 
                size: 0.05, // Increased point size for better visibility
                vertexColors: hasVertexColors, // Enable vertex colors if they exist
                transparent: true,
                opacity: 0.9,
                sizeAttenuation: true
            })
            
            // Create points from the geometry
            this.model = new THREE.Points(geometry, material)
            console.log('SPLAT model created:', this.model)
            
            // Center and scale the model appropriately
            this.centerAndScaleModel()
            
            this.scene.add(this.model)
            console.log('SPLAT model added to scene')
            
        } catch (error) {
            console.error('Error loading SPLAT file:', error)
            // Fallback to sample model if loading fails
            console.log('Falling back to sample SPLAT model')
            this.createSampleSPLATModel()
        }
    }

    createSamplePLYModel() {
        // Create a sample geometry for PLY (box-based)
        const geometry = new THREE.BoxGeometry(2, 1, 1)
        const material = new THREE.MeshLambertMaterial({ 
            color: 0x3b82f6,
            transparent: true,
            opacity: 0.8
        })
        
        this.model = new THREE.Mesh(geometry, material)
        this.model.castShadow = true
        this.model.receiveShadow = true
        
        this.scene.add(this.model)
        
        // Add some additional geometry for visual interest
        const sphereGeometry = new THREE.SphereGeometry(0.3, 16, 16)
        const sphereMaterial = new THREE.MeshLambertMaterial({ color: 0xef4444 })
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial)
        sphere.position.set(1, 0.5, 0)
        sphere.castShadow = true
        this.scene.add(sphere)
        
        const cylinderGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.8, 16)
        const cylinderMaterial = new THREE.MeshLambertMaterial({ color: 0x10b981 })
        const cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial)
        cylinder.position.set(-1, -0.2, 0)
        cylinder.castShadow = true
        this.scene.add(cylinder)
    }

    createSampleSPLATModel() {
        // Create a sample geometry for SPLAT (sphere-based)
        const geometry = new THREE.SphereGeometry(1.5, 32, 32)
        const material = new THREE.MeshLambertMaterial({ 
            color: 0x8b5cf6,
            transparent: true,
            opacity: 0.9,
            wireframe: false
        })
        
        this.model = new THREE.Mesh(geometry, material)
        this.model.castShadow = true
        this.model.receiveShadow = true
        
        this.scene.add(this.model)
        
        // Add some additional geometry for SPLAT visual interest
        const torusGeometry = new THREE.TorusGeometry(0.8, 0.3, 16, 32)
        const torusMaterial = new THREE.MeshLambertMaterial({ color: 0xf59e0b })
        const torus = new THREE.Mesh(torusGeometry, torusMaterial)
        torus.position.set(0, 0, 0)
        torus.rotation.x = Math.PI / 2
        torus.castShadow = true
        this.scene.add(torus)
        
        const octahedronGeometry = new THREE.OctahedronGeometry(0.4)
        const octahedronMaterial = new THREE.MeshLambertMaterial({ color: 0xec4899 })
        const octahedron = new THREE.Mesh(octahedronGeometry, octahedronMaterial)
        octahedron.position.set(0, 1.5, 0)
        octahedron.castShadow = true
        this.scene.add(octahedron)
    }

    centerAndScaleModel() {
        if (!this.model) return
        
        // Compute bounding box to center and scale the model
        const box = new THREE.Box3().setFromObject(this.model)
        const center = box.getCenter(new THREE.Vector3())
        const size = box.getSize(new THREE.Vector3())
        
        // Center the model
        this.model.position.sub(center)
        
        // Scale the model to fit nicely in the viewport
        const maxDim = Math.max(size.x, size.y, size.z)
        const scale = 3 / maxDim // Scale to fit in a 3x3x3 box
        this.model.scale.setScalar(scale)
        
        // Adjust camera distance based on model size
        const distance = maxDim * 2
        this.camera.position.set(distance, distance, distance)
        this.controls.target.set(0, 0, 0)
        this.controls.update()
    }

    goToCheckpoint(index) {
        if (index < 0 || index >= this.checkpoints.length) return
        
        this.currentCheckpoint = index
        const checkpoint = this.checkpoints[index]
        
        // Update model orientation
        if (this.model) {
            this.model.rotation.set(checkpoint.rotation.x, checkpoint.rotation.y, checkpoint.rotation.z)
            this.model.position.set(checkpoint.position.x, checkpoint.position.y, checkpoint.position.z)
        }
        
        // Update UI
        this.updateUI()
        
        // Reset camera position
        this.camera.position.set(0, 0, 5)
        this.controls.reset()
    }

    nextCheckpoint() {
        const nextIndex = (this.currentCheckpoint + 1) % this.checkpoints.length
        this.goToCheckpoint(nextIndex)
    }

    previousCheckpoint() {
        const prevIndex = this.currentCheckpoint === 0 ? this.checkpoints.length - 1 : this.currentCheckpoint - 1
        this.goToCheckpoint(prevIndex)
    }

    updateUI() {
        // Update checkpoint info
        document.getElementById('checkpoint-info').textContent = this.checkpoints[this.currentCheckpoint].name
        
        // Update active checkpoint in list
        const checkpointItems = document.querySelectorAll('.checkpoint-item')
        checkpointItems.forEach((item, index) => {
            item.classList.toggle('active', index === this.currentCheckpoint)
        })
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight
        this.camera.updateProjectionMatrix()
        this.renderer.setSize(window.innerWidth, window.innerHeight)
    }

    animate() {
        requestAnimationFrame(() => this.animate())
        
        this.controls.update()
        this.renderer.render(this.scene, this.camera)
    }
}
