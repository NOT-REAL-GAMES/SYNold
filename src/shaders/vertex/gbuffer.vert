struct VSOut {
    @builtin(position) Position: vec4f,
    @location(0) uv: vec2f,
    @location(1) faceNormals : vec3<f32>,
    @location(2) vertexNormals : vec3<f32>
};

struct Uniforms {
    projMatrix: mat4x4<f32>
}


@group(2) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(0) var<uniform> modelMatrix: mat4x4<f32>;

@vertex
fn main(@location(0) inPos: vec3f, @location(2) faceNormals : vec3<f32>,
  @location(1) uv : vec2<f32>, @location(3) vertexNormals : vec3<f32>

) -> VSOut {
    var vsOut: VSOut;
    let worldPos = (modelMatrix * vec4(inPos,1.0)).xyz;
    vsOut.Position = (uniforms.projMatrix)*vec4f(worldPos, 1);
    vsOut.vertexNormals = normalize(vec4f(vertexNormals,1.0)).xyz;
    vsOut.faceNormals = normalize(vec4f(faceNormals,1.0)).xyz;
    return vsOut;
}
		