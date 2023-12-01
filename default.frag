@group(1) @binding(0) var smp: sampler;
@group(1) @binding(1) var tex: texture_2d<f32>;

@fragment
fn main(
    @location(0) uv : vec2<f32>) -> @location(0) vec4f {
    
    return textureSample(tex, smp, uv);
}