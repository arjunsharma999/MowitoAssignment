# 3D Models Directory

Place your 3D model files in this directory.

## Supported Formats

### PLY (Polygon File Format) - Primary Format
- **File Extension**: `.ply`
- **Description**: Standard polygon mesh format
- **Use Case**: Traditional 3D models, scanned objects, architectural models
- **Loader**: `PLYLoader` from Three.js

### SPLAT (Gaussian Splatting) - Alternative Format
- **File Extension**: `.splat`
- **Description**: Point cloud and Gaussian splatting format
- **Use Case**: Neural radiance fields, point clouds, volumetric data
- **Loader**: Custom SPLAT loader (to be implemented)

## File Naming

Use descriptive names for your models:
- `car-model.ply`
- `building.ply`
- `character.ply`
- `scene.splat`
- `object.splat`

## Loading Models

### PLY Models
To load a PLY model, update the `loadPLYModel()` method in `src/ModelViewer.js`:

```javascript
const loader = new PLYLoader()
loader.load('/models/your-model.ply', (geometry) => {
    // Process the loaded geometry
})
```

### SPLAT Models
To load a SPLAT model, update the `loadSPLATModel()` method in `src/ModelViewer.js`:

```javascript
// When SPLAT loader is available:
// const loader = new SPLATLoader()
// loader.load('/models/your-model.splat', (geometry) => {
//     // Process the loaded SPLAT geometry
// })
```

## Model Requirements

### PLY Files
- Ensure your PLY files are valid and properly formatted
- Large models (>10MB) may take longer to load
- Consider optimizing complex models for better performance
- Supports vertex colors, normals, and texture coordinates

### SPLAT Files
- SPLAT format is currently simulated with sample geometry
- Real SPLAT loader implementation pending
- May require more processing power than PLY models
- Ideal for point cloud and volumetric data

## Performance Considerations

- **PLY Models**: Good performance, standard format
- **SPLAT Models**: May be more resource-intensive
- **Large Models**: Consider using Level of Detail (LOD)
- **Complex Scenes**: Optimize geometry and materials

## Sample Models

You can find sample models from:

### PLY Models
- [Stanford 3D Scanning Repository](http://graphics.stanford.edu/data/3Dscanrep/)
- [TurboSquid](https://www.turbosquid.com/)
- [Sketchfab](https://sketchfab.com/)

### SPLAT Models
- [Gaussian Splatting Community](https://github.com/graphdeco-inria/gaussian-splatting)
- [Neural Radiance Fields](https://github.com/bmild/nerf)
- [Point Cloud Libraries](https://pointclouds.org/)

## Format Toggle

The app includes a toggle button to switch between PLY and SPLAT formats:
- **Toggle Position**: Top-right corner of the header
- **Functionality**: Switches between model formats
- **Reload**: Automatically reloads the model when switching formats
- **State Persistence**: Remembers the selected format during the session

## Troubleshooting

### Model Not Loading
- Check file format compatibility
- Verify file path and permissions
- Ensure file is not corrupted
- Check browser console for errors

### Performance Issues
- Reduce model complexity
- Optimize geometry (reduce polygon count)
- Use appropriate material settings
- Consider format-specific optimizations
