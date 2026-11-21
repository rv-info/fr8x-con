# ART 3D ASSETS REPOSITORY

This directory is designated for interactive and renderable 3D models used in FR8X Connect.

## Guidelines & Supported Formats
1. **Preferred Formats**: GLB (binary glTF) or glTF 2.0 with embedded buffers.
2. **Use Cases**:
   - 3D ISO Container models (20DV, 40HC, Reefer, Flat Rack, Open Top)
   - Maritime Vessel / Container Ship interactive inspection models
   - Air Freight ULD (Unit Load Device) pallet models
3. **Optimization Constraints**:
   - Low polygon count (target < 50,000 triangles) for smooth WebGL rendering.
   - PBR textures compressed to max 1024x1024.
   - Total file size strictly bounded to < 5MB per model.
4. **Naming Convention**:
   - `model_container_20dv.glb`
   - `model_container_40hc.glb`
   - `model_vessel_liner.glb`
