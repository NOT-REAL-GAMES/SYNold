@group(1) @binding(0) var smp: sampler;
@group(1) @binding(1) var tex: texture_2d<f32>;

struct GBufferOutput {
  @location(0) normal : vec4<f32>,

  // Textures: diffuse color, specular color, smoothness, emissive etc. could go here
  @location(1) albedo : vec4<f32>,
}

@fragment
fn main(
    @location(0) uv : vec2<f32>,
    @location(1) faceNormals : vec3<f32>,
    @location(2) vertexNormals : vec3<f32>
    ) -> GBufferOutput {
    
    var out : GBufferOutput;
    out.normal = vec4(normalize((faceNormals*0.25+vertexNormals*0.75)), 1.0);
    out.albedo = textureSample(tex, smp, uv);
    return out;
}