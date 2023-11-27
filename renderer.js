export var device;
export var context;

export var contextTexture;
export var depthTexture;

export var canvas;

var pipelinePaths = ["./default.pipeline"]
var pipelines = []

import * as syn from './base.js'

var transformBuffer = {};

var buffers = {};

export async function initializeBuffer(name,subnames,size,usage,visibility,bst){
	buffers[name] = {};

	buffers[name].buffer = {};
	buffers[name].binding = {};

	for(var i=0;i<subnames.length;++i){	
		buffers[name].buffer[subnames[i]] = device.createBuffer({
			usage: usage,
			size: size[i]
		});

		buffers[name].binding[subnames[i]] = {
			buffer: buffers[name].buffer[subnames[i]],
			size: size[i],
			offset: 0
		};
	}

	buffers[name].bindGroupEntries = [];
	buffers[name].bindGroupLayoutEntries = [];

	for(var i=0;i<Object.keys(buffers[name].binding).length;++i){
		buffers[name].bindGroupEntries.push({
			resource: buffers[name].binding[subnames[i]],
			binding: i
		});
	
		buffers[name].bindGroupLayoutEntries.push({
			visibility: visibility[i],
			binding: i
		});
	}

	for(var i=0;i<bst.length;++i){
		if(bst[i]==="buffer"){
			buffers[name].bindGroupLayoutEntries[i].buffer = { type: "uniform" };
		}
	}

	buffers[name].bindGroupLayout = 
		device.createBindGroupLayout({
			entries: buffers[name].bindGroupLayoutEntries
		});

	buffers[name].bindGroup = 
		device.createBindGroup({
			layout: buffers[name].bindGroupLayout,
			entries: buffers[name].bindGroupEntries
		});
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


	//tHeRe'S gOt tO bE A bEtTeR wAy!!!
	initializeBuffer(
		"transform", ["buffer"], [4*16], [GPUBufferUsage.UNIFORM | 
		GPUBufferUsage.COPY_DST], [GPUShaderStage.VERTEX] ,["buffer"],0)

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
	projmat = syn.math.mat4.translate(projmat,[0,0,-10])
	
	device.queue.writeBuffer(buffers["transform"].buffer["buffer"], 0, projmat);

	pass.setPipeline(pipelines[0]);

	pass.setBindGroup(0,buffers["transform"].bindGroup);

	pass.setVertexBuffer(0,vertexBuffers[0]);

	pass.setIndexBuffer(indexBuffers[0],'uint16')

	pass.drawIndexed(36,1);

	pass.end();

	device.queue.submit([encoder.finish()]);
	//requestAnimationFrame(render);

}

var vertexBuffers = Array()
var vertexBufferDescs = []

var indexBuffers = [];

export async function createPipelines(){
	
console.log(Object.values(buffers));

	for(var i = 0; i<pipelinePaths.length;++i){

		var bindGroupLayouts = []

		for(var j=0;j<Object.keys(buffers).length;++j){
			bindGroupLayouts.push(Object.values(buffers)[j].bindGroupLayout)
		}

		console.log(bindGroupLayouts)
		
		var layout = device.createPipelineLayout({
			bindGroupLayouts: bindGroupLayouts 
		});

		var pipeline = await syn.io.getJSON(pipelinePaths[i]);
		var shader = await syn.io.getJSON(pipeline.shader);


		//create buffers found in shader
		for(var i=0;i<shader.vertexBuffers.length;++i){
			console.log(shader.vertexBuffers[i])

			vertexBufferDescs.push(
				{
					attributes: shader.vertexBuffers[i].attributes,
					arrayStride: shader.vertexBuffers[i].arrayStride,
					stepMode: shader.vertexBuffers[i].stepMode
				}
			)


			var model = await syn.io.getJSON('./cube.model')
			
			var arr = new Float32Array(model.indices.length*3);
			var idx = new Int16Array(model.indices.length);

			for(var j=0;j<model.indices.length;){
				var cur = model.indices[j];
				arr[j*3]=(model.positions[cur*3])
				arr[j*3+1]=(model.positions[cur*3+1])
				arr[j*3+2]=(model.positions[cur*3+2])

				idx[j]=(model.indices[j]);
				++j;
			}

			console.log(arr);

			vertexBuffers.push(await (syn.utils.createBuffer(arr,GPUBufferUsage.VERTEX)));
			indexBuffers.push(await (syn.utils.createBuffer(idx,GPUBufferUsage.INDEX)))
		}



		console.log(vertexBuffers)

		var vertex = device.createShaderModule({
			code:await syn.io.getRaw(shader.vertex)});
		var fragment = device.createShaderModule({
			code:await syn.io.getRaw(shader.fragment)});

		pipelines.push(
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