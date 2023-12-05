struct VSOut {
    @builtin(position) Position: vec4f,
    @location(0) uv: vec2f,
    @location(1) normals : vec3<f32>
};

    struct Uniforms {
    projMatrix: mat4x4<f32>,
    normalModelMatrix : mat4x4<f32>

}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;

@vertex
fn main(@location(0) inPos: vec3f, @location(2) normals : vec3<f32>,
  @location(1) uv : vec2<f32>
) -> VSOut {
    var vsOut: VSOut;
    vsOut.Position = uniforms.projMatrix*vec4f(inPos, 1);
    vsOut.normals = normalize(vec4(normals,1.0)).xyz;
    return vsOut;
}
		