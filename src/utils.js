import { device } from "./renderer.js";

export async function createBuffer(array,usage){
	//console.log((array.length* + 4) & ~3);
	let mult = usage == GPUBufferUsage.VERTEX ?
		4 : 4;
	let desc = {
		size: (array.length*mult) & ~3,
		usage,
		mappedAtCreation: true
	};
	let buffer = await device.createBuffer(desc);
	//TODO: write switch case for every possible usage.
	let bla = (buffer.getMappedRange());
	//console.log(bla);
	const writeArray =
		usage == GPUBufferUsage.VERTEX
		? new Float32Array(bla)
		: new Uint16Array(bla);
	writeArray.set(array,0);
	buffer.unmap();
	return buffer;
}

export async function createSolidColorTexture(r, g, b, a) {
	const data = new Uint8Array([
		r * 255, g * 255, b * 255, a * 255, r * 255, g * 255, b * 255, a * 255,r * 255, g * 255, b * 255, a * 255,r * 255, g * 255, b * 255, a * 255,
		r * 255, g * 255, b * 255, a * 255, r * 255, g * 255, b * 255, a * 255, r * 255, g * 255, b * 255, a * 255,r * 255, g * 255, b * 255, a * 255,
		r * 255, g * 255, b * 255, a * 255, r * 255, g * 255, b * 255, a * 255, r * 255, g * 255, b * 255, a * 255, r * 255, g * 255, b * 255, a * 255,
		r * 255, g * 255, b * 255, a * 255,r * 255, g * 255, b * 255, a * 255, r * 255, g * 255, b * 255, a * 255, r * 255, g * 255, b * 255, a * 255]);
	const texture = device.createTexture({
	  size: { width: 4, height: 4 },
	  format: "rgba8unorm",
	  usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
	});
	device.queue.writeTexture({ texture }, data, {bytesPerRow:16}, { width: 4, height: 4 });
	return texture;
  }