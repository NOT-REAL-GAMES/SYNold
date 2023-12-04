export var device;
export var context;

export var contextTexture;
export var depthTexture;

export var canvas;

var pipelinePaths = ["./src/pipelines/default.pipeline"]
var pipelines = {}

import * as syn from './base.js'

var transformBuffer = {};

var buffers = {};

var materialsLoaded = {};

const BindingLayoutType = {
	Buffer: "buffer",
	Sampler: "sampler",
	Texture: "texture"
}
var sampler;

export async function initializeBuffer(name,subbuffers=[{}],includeInLayout=true){
	buffers[name] = {};

	buffers[name].buffer = {};
	buffers[name].binding = {};

	buffers[name].bindGroupEntries = [];
	buffers[name].bindGroupLayoutEntries = [];

	for(var j=0;j<Object.values(subbuffers).length;++j)
	{
		var currentSubBuffer = Object.values(subbuffers)[j]
			
			if(currentSubBuffer.bindingLayoutType===BindingLayoutType.Buffer){
			
				buffers[name].buffer[currentSubBuffer.name] = device.createBuffer({
					usage: currentSubBuffer.usage,
					size: currentSubBuffer.size
				});

				buffers[name].binding[currentSubBuffer.name] = {
					buffer: buffers[name].buffer[currentSubBuffer.name],
					size: currentSubBuffer.size,
					offset: 0
				};
			}

		if(currentSubBuffer.bindingLayoutType===BindingLayoutType.Buffer){

			buffers[name].bindGroupEntries.push({
				resource: buffers[name].binding[currentSubBuffer.name],
				binding: j
			});
		} else if (currentSubBuffer.bindingLayoutType===BindingLayoutType.Sampler){
			buffers[name].bindGroupEntries.push({
				resource: sampler,
				binding: j
			});
		} else if (currentSubBuffer.bindingLayoutType===BindingLayoutType.Texture){
			

			buffers[name].bindGroupEntries.push({
				resource: currentSubBuffer.texture.createView(),
				binding: j
			});
		}

		await buffers[name].bindGroupLayoutEntries.push({
			visibility: currentSubBuffer.visibility,
			binding: j
		});
		
		if(currentSubBuffer.bindingLayoutType===BindingLayoutType.Buffer){
			buffers[name].bindGroupLayoutEntries[j].buffer = { type: "uniform" };
		} else if (currentSubBuffer.bindingLayoutType===BindingLayoutType.Sampler){
			buffers[name].bindGroupLayoutEntries[j].sampler = { type: "filtering" };
		} else if (currentSubBuffer.bindingLayoutType===BindingLayoutType.Texture){
			buffers[name].bindGroupLayoutEntries[j].texture = { type: "float" };
		}
		
	}

	buffers[name].bindGroupLayout = 
		await device.createBindGroupLayout({
			entries: buffers[name].bindGroupLayoutEntries
		});

	buffers[name].bindGroup = 
		await device.createBindGroup({
			layout: buffers[name].bindGroupLayout,
			entries: buffers[name].bindGroupEntries
		});

	buffers[name].includeInLayout = includeInLayout;

	return buffers[name].bindGroup
}

async function initializeMaterials(){
	//console.log(syn.scenes.gameObjects)
	var obj = syn.scenes.gameObjects[0];
	for(var i=0;i<obj.length;++i){			
		var bufParams = [];
		//console.log(obj[i].components)
		if(obj[i].components.renderer.materials.length>0){
			
			var materials = obj[i].components.renderer.materials;

			for(var j=0;j<materials.length;++j){
				
				if(Object.keys(materials[j]).length==0){
					continue;
				}
				var mat = await syn.io.getJSON("./src/materials/"+materials[j]+".material")
								
				materialsLoaded[materials[j]] = materials[j];

				var bufferName = mat.name;
				
				//var bufParam = [{}];				

				for(var k=0;k<mat.buffers.length;++k){	
					bufParams.push({})
					var bufParam = bufParams[k];
					
					var buf = mat.buffers[k]

					bufParam.name = buf["name"];

					console.log(buf)

					if(buf.size !== undefined){
						bufParam.size = buf.size;
					}

					if(buf.usage !== undefined){
						//TODO: implement all use cases
						if(buf.usage == ["UNIFORM","COPY_DST"]){
							bufParam.usage = 
								GPUTextureUsage.UNIFORM|
								GPUTextureUsage.COPY_DST;
						}
					}

					if(buf.visibility=="fragment"){
						bufParam.visibility = GPUShaderStage.FRAGMENT;
					}
					

					bufParam.bindingLayoutType = buf.bindingLayoutType;
					
					if(buf.bindingLayoutType=="texture"){
						if(buf.textureSrc === null){
							bufParam.texture = await syn.utils.createSolidColorTexture(
								buf.color[0], buf.color[1],
								buf.color[2], buf.color[3]
							)
						}
					}
				console.log(bufParam)
				}
			}
			console.log(bufParams)
			materialsLoaded[materials[0]] = await initializeBuffer(bufferName,bufParams,false);
		}
	}
}

export async function init(){

	var adapter = await navigator.gpu.requestAdapter();
	device = await adapter.requestDevice();

	canvas = document.querySelector("#syn");
	context = canvas.getContext("webgpu");

	context.configure({ 
		device: device, 
		format: navigator.gpu.getPreferredCanvasFormat(), 
		usage: GPUTextureUsage.COPY_SRC |
			GPUTextureUsage.RENDER_ATTACHMENT
	});

	sampler = device.createSampler({
		addressModeU: 'repeat',
		addressModeV: 'repeat',
		magFilter: 'nearest',
		minFilter: 'nearest',
	});

	//tHeRe'S gOt tO bE A bEtTeR wAy!!!

	initializeBuffer(
		"transform",[{
			name: "buffer",
			size: 4*16,
			usage: GPUBufferUsage.UNIFORM | 
					GPUBufferUsage.COPY_DST,
			visibility: GPUShaderStage.VERTEX,
			bindingLayoutType: BindingLayoutType.Buffer
		}]
	);
	
	await initializeBuffer("default", [{
		name: "sampler",
		visibility: GPUShaderStage.FRAGMENT,
		bindingLayoutType: BindingLayoutType.Sampler
	},{
		name: "albedo",
		visibility: GPUShaderStage.FRAGMENT,
		bindingLayoutType: BindingLayoutType.Texture,
		texture: await syn.utils.createSolidColorTexture(1,0,0.2,1)
	}]);
	
	await initializeMaterials();

	await createPipelines();
	
	setInterval(render,20);


}
	

//  TEACH THIS vvv

//	var bar;

//	var foo = bar = {};

//	foo.key = "value";

//	console.log(bar.key);


var colorAttachment;
var depthAttachment;

export async function render(){	
	canvas.width = canvas.clientWidth;
	canvas.height = canvas.clientHeight;

	contextTexture = context.getCurrentTexture();
	depthTexture = device.createTexture({
		size: [contextTexture.width,contextTexture.height,1],
		usage:  GPUTextureUsage.COPY_SRC | 
			GPUTextureUsage.RENDER_ATTACHMENT,
		format: 'depth24plus-stencil8',
		dimension: '2d'
	});

	var encoder = await device.createCommandEncoder();

	colorAttachment = {
		view: contextTexture.createView(),
		clearValue: {r:0,g:0,b:0,a:1},
		loadOp: 'clear',
		storeOp: 'store'
	};

	depthAttachment = {
		view: depthTexture.createView(),
		depthClearValue: 1,
		depthLoadOp: 'clear',
		depthStoreOp: 'store',
		stencilClearValue: 0,
		stencilLoadOp: 'clear',
		stencilStoreOp: 'store'
	}

	var pass = encoder.beginRenderPass({
		colorAttachments: [colorAttachment],
		depthStencilAttachment: depthAttachment
	});

	var projmat = syn.math.mat4.perspective(2, canvas.clientWidth/canvas.clientHeight, 0.01, 1000000.0);
	projmat = syn.math.mat4.translate(projmat,[Math.sin(Date.now()/1000),0,-10]);
	
	device.queue.writeBuffer(buffers["transform"].buffer["buffer"], 0, projmat);

	pass.setPipeline(pipelines["default"]);

	pass.setBindGroup(0,buffers["transform"].bindGroup);

	for(var a=0;a<syn.scenes.gameObjects[0].length;++a){

		var obj = syn.scenes.gameObjects[0][a];
		var ren = obj.components.renderer;

		if(Object.keys(ren.materials[0]).length>0){
			pass.setBindGroup(1,materialsLoaded[ren.materials[0]]);
		} else{
			//console.log(name+" has no material, reverting to default.")
			pass.setBindGroup(1,buffers["default"].bindGroup);
		}

		pass.setVertexBuffer(0,ren.vertexBuffers.unmodified);
		pass.setVertexBuffer(1,ren.uvBuffer);

		pass.setIndexBuffer(ren.indexBuffer,'uint16')

		pass.drawIndexed(ren.indexCount,1);
	}

	

	pass.end();

	device.queue.submit([encoder.finish()]);
	//requestAnimationFrame(render);

}

var vertexBuffers = Array()
var vertexBufferDescs = []

var uvBuffers = [];

var indexBuffers = [];

var totalIndex = [];

export async function getBuffersFromGameObjects(){
	for(var x=0;x<syn.scenes.gameObjects[0].length;++x){

		var vtx = Array();
		var idx = Array();	
		var uvs = Array();

		//console.log(syn.scenes.mainScene.gameObjects[x].name)

		var obj = syn.scenes.gameObjects[0][x]
		var ren = obj.components.renderer;

		var model = await syn.io.getJSON(ren.modelSource);

		var modelName = await obj.name;
			
		ren.indexCount = (0)

		for(var j=0;j<model.indices.length;){
			var cur = model.indices[j];
			vtx.push(model.positions[cur*3])
			vtx.push(model.positions[cur*3+1])
			vtx.push(model.positions[cur*3+2])

			uvs.push(model.uv[cur*3])
			uvs.push(model.uv[cur*3+1])
			uvs.push(model.uv[cur*3+2])

			ren.indexCount += 1;

			idx.push(model.indices[j]);
			++j;
		}

		ren.vertexBuffers={};
		ren.vertexBuffers.unmodified=(await (syn.utils.createBuffer(vtx,GPUBufferUsage.VERTEX)));
		ren.indexBuffer=(await (syn.utils.createBuffer(idx,GPUBufferUsage.INDEX)))
		ren.uvBuffer=(await (syn.utils.createBuffer(uvs,GPUBufferUsage.VERTEX)))

	}
}

export async function createPipelines(){
	
	for(var i = 0; i<pipelinePaths.length;++i){

		var bindGroupLayouts = []

		for(var j=0;j<Object.keys(buffers).length;++j){
			if(Object.values(buffers)[j].includeInLayout){
				bindGroupLayouts.push(Object.values(buffers)[j].bindGroupLayout)
			}
		}
		
		var layout = device.createPipelineLayout({
			bindGroupLayouts: bindGroupLayouts 
		});

		var pipeline = await syn.io.getJSON(pipelinePaths[i]);
		var shader = await syn.io.getJSON(pipeline.shader);


		//create buffers found in shader
		for(var i=0;i<shader.vertexBuffers.length;++i){

			vertexBufferDescs.push(
				{
					attributes: shader.vertexBuffers[i].attributes,
					arrayStride: shader.vertexBuffers[i].arrayStride,
					stepMode: shader.vertexBuffers[i].stepMode
				}
			)

			//find way to automate this
			await getBuffersFromGameObjects();
		}

		var vertex = device.createShaderModule({
			code:await syn.io.getRaw(shader.vertex)});
		var fragment = device.createShaderModule({
			code:await syn.io.getRaw(shader.fragment)});
			
		pipelines[pipeline.name]=(
			device.createRenderPipeline({
				layout: layout,
				vertex: {
					module: vertex,
					entryPoint: 'main',
					buffers: vertexBufferDescs
				},
				fragment: {
					module: fragment,
					entryPoint: 'main',
					targets: [{format: pipeline.format}]
				},
				primitive: {
					frontFace: 'cw',
					cullMode: pipeline.cullMode,
					topology: 'triangle-list'
				},
				depthStencil: {
					depthWriteEnabled: true,
					depthCompare: pipeline.depthCompare,
					format: 'depth24plus-stencil8'
				}
			})
		);
	}
}