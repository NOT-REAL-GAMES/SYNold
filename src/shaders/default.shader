{
    "vertex": "./src/shaders/vertex/default.vert",
    "defaultVertexCode": false,
    "fragment": "./src/shaders/fragment/default.frag",
    "defaultFragmentCode": false,

    "vertexBuffers": [{
        "target": "positions",
        "attributes": [{
            "shaderLocation": 0,
            "offset": 0,
            "format": "float32x3"
        }],
        "arrayStride": 12,
        "stepMode": "vertex"
    },{
        "target": "uv",
        "attributes": [{
            "shaderLocation": 1,
            "offset": 0,
            "format": "float32x2"
        }],
        "arrayStride": 8,
        "stepMode": "vertex"
    }]
}