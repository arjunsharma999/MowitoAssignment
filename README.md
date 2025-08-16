# 3D Model Viewer

A modern web application for displaying 3D models with checkpoint navigation, built with Three.js and Tailwind CSS.

## Features

- **3D Model Display**: View 3D models with high-quality rendering
- **Dual Format Support**: Toggle between PLY and SPLAT model formats
- **Checkpoint Navigation**: Four predefined orientations (Front, Side, Top, Isometric)
- **Interactive Controls**: Navigate between checkpoints using PREV/NEXT buttons
- **Drag & Rotate**: Freely manipulate the model orientation by dragging
- **Format Toggle**: Switch between PLY and SPLAT models with a toggle button
- **Modern UI**: Beautiful interface built with Tailwind CSS
- **Responsive Design**: Works on desktop and mobile devices

## Prerequisites

- Node.js (version 16 or higher)
- npm or yarn package manager

## Installation

1. Clone or download this repository
2. Navigate to the project directory:
   ```bash
   cd 3d-model-viewer
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

## Usage

### Development Mode

To run the app in development mode:

```bash
npm run dev
```

This will start a development server at `http://localhost:3000` and automatically open your browser.

### Production Build

To create a production build:

```bash
npm run build
```

To preview the production build:

```bash
npm run preview
```

## How to Use

1. **Launch the App**: The app will automatically load and display the 3D model
2. **Switch Formats**: Use the toggle button in the top-right to switch between PLY and SPLAT models
3. **Navigate Checkpoints**: Use the PREV and NEXT buttons to cycle through orientations
4. **Direct Selection**: Click on any checkpoint name in the right sidebar
5. **Free Rotation**: Click and drag on the 3D model to rotate it freely
6. **Zoom**: Use mouse wheel to zoom in/out
7. **Pan**: Right-click and drag to pan the view
8. **Reload Model**: Use the "Reload Model" button to refresh the current format

## Model Formats

### PLY (Polygon File Format)
- **Default Format**: Loads first on app launch
- **Sample Model**: Box-based geometry with sphere and cylinder additions
- **Color Scheme**: Blue primary with red and green accents

### SPLAT (Gaussian Splatting)
- **Alternative Format**: Accessible via toggle button
- **Sample Model**: Sphere-based geometry with torus and octahedron
- **Color Scheme**: Purple primary with orange and pink accents

## Checkpoints

The app includes four predefined orientations:

1. **Front View**: Standard front-facing orientation
2. **Side View**: 90-degree rotation around Y-axis
3. **Top View**: 90-degree rotation around X-axis
4. **Isometric View**: Combined rotation for 3D perspective

## Customization

### Adding Your Own PLY Models

To load your own PLY models:

1. Place your `.ply` file in the `public/models/` directory
2. Update the `loadPLYModel()` method in `src/ModelViewer.js`
3. Replace the `createSamplePLYModel()` call with actual PLY loading:

```javascript
const loader = new PLYLoader()
loader.load('/models/your-model.ply', (geometry) => {
    const material = new THREE.MeshLambertMaterial({ 
        color: 0x3b82f6,
        transparent: true,
        opacity: 0.8
    })
    this.model = new THREE.Mesh(geometry, material)
    this.model.castShadow = true
    this.model.receiveShadow = true
    this.scene.add(this.model)
    
    // Go to first checkpoint
    this.goToCheckpoint(0)
})
```

### Adding Your Own SPLAT Models

To load your own SPLAT models:

1. Place your `.splat` file in the `public/models/` directory
2. Update the `loadSPLATModel()` method in `src/ModelViewer.js`
3. Replace the `createSampleSPLATModel()` call with actual SPLAT loading:

```javascript
// Import SPLAT loader when available
// const loader = new SPLATLoader()
// loader.load('/models/your-model.splat', (geometry) => {
//     // Process the loaded SPLAT geometry
// })
```

### Modifying Checkpoints

Edit the `checkpoints` array in the constructor to customize orientations:

```javascript
this.checkpoints = [
    { name: 'Custom View', rotation: { x: 0, y: Math.PI, z: 0 }, position: { x: 0, y: 0, z: 0 } },
    // Add more checkpoints...
]
```

## Technology Stack

- **Frontend**: Vanilla JavaScript (ES6+)
- **3D Graphics**: Three.js
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **Package Manager**: npm

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Performance Tips

- For large models, consider using Level of Detail (LOD)
- Enable hardware acceleration in your browser
- Close unnecessary browser tabs for better performance
- SPLAT models may require more processing power

## Troubleshooting

### Model Not Loading
- Check browser console for errors
- Ensure your PLY/SPLAT files are valid
- Verify file path in the loader
- Try toggling between formats

### Performance Issues
- Reduce model complexity
- Lower shadow map resolution
- Disable shadows for complex scenes
- SPLAT models may be more resource-intensive

### UI Not Displaying
- Check if Tailwind CSS is properly imported
- Verify JavaScript console for errors
- Ensure all dependencies are installed

### Format Toggle Not Working
- Check if the toggle event listener is properly attached
- Verify the format state is being updated correctly
- Ensure the model reload function is working

## Deployment

### Local Deployment
The app can be served from any static file server after building.

### Cloud Deployment
The app is ready for deployment on:
- **AWS S3 + CloudFront**
- **Azure Static Web Apps**
- **Google Cloud Storage**
- **Netlify**
- **Vercel**

## Future Enhancements

- **Real SPLAT Loader**: Integration with actual Gaussian Splatting format
- **Model Comparison**: Side-by-side PLY vs SPLAT viewing
- **Advanced Materials**: PBR materials and custom shaders
- **Animation Support**: Keyframe animations and morphing
- **Export Functionality**: Save modified orientations

## License

This project is open source and available under the MIT License.

## Contributing

Feel free to submit issues and enhancement requests!

## Support

If you encounter any issues or have questions, please check the troubleshooting section above or create an issue in the repository.
