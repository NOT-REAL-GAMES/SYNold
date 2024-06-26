
@group(1) @binding(0) var gBufferNormal: texture_2d<f32>;
@group(1) @binding(1) var gBufferAlbedo: texture_2d<f32>;
@group(1) @binding(2) var gBufferDepth: texture_depth_2d;

struct LightData {
  position : vec4<f32>,
  color : vec3<f32>,
  radius : f32,
}
struct LightsBuffer {
  lights: array<LightData>,
}
@group(2) @binding(0) var<storage, read> lightsBuffer: LightsBuffer;

struct Uniforms {
    projMatrix: mat4x4<f32>
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var<uniform> resScale: f32;

fn world_from_screen_coord(coord : vec2<f32>, depth_sample: f32) -> vec3<f32> {
  // reconstruct world-space position from the screen coordinate.
  let posClip = vec4(coord.x * 2.0 - 1.0, (1.0 - coord.y) * 2.0 - 1.0, depth_sample, 1.0);
  let posWorldW = uniforms.projMatrix * posClip;
  let posWorld = posWorldW.xyz / posWorldW.www;
  return posWorld;
}

@fragment
fn main(
  @builtin(position) coord : vec4<f32>
) -> @location(0) vec4<f32> {
  var result : vec3<f32>;

  var depth = textureLoad(
    gBufferDepth,
    vec2<i32>(floor(coord.xy)/resScale),
    0
  );

  // Don't light the sky.
  if (depth >= 1.0) {
    discard;
  }

  //depth = pow(depth,128);

  let bufferSize = textureDimensions(gBufferDepth);
  let coordUV = coord.xy /resScale / vec2<f32>(bufferSize);
  let position = world_from_screen_coord(coordUV, depth);

  let normal = textureLoad(
    gBufferNormal,
    vec2<i32>(floor(coord.xy)/resScale),
    0
  ).xyz;

  let albedo = textureLoad(
    gBufferAlbedo,
    vec2<i32>(floor(coord.xy)/resScale),
    0
  ).rgb;

  for (var i = 0u; i < arrayLength(&lightsBuffer.lights); i++) {
    let L = lightsBuffer.lights[i].position.xyz - position;
    let distance = length(L);
    if (distance > lightsBuffer.lights[i].radius) {
      continue;
    }

    let wtl = (lightsBuffer.lights[i].position.xyz-vec3(uniforms.projMatrix[3][0],uniforms.projMatrix[3][1],uniforms.projMatrix[3][2]));

    let lambert = max(dot(normal, normalize(L)), 0.0);
    result += vec3<f32>(
      (albedo+lambert) * pow(1.0 - distance / lightsBuffer.lights[i].radius, 2.0) * (lightsBuffer.lights[i].color)
    );
  }

  // some manual ambient
  //result += vec3(0.2,0.075,0.15);

  return vec4(result, 1.0);
}
