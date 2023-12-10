import * as ren from './renderer.js'
import * as io from './io.js'
import * as utils from './utils.js'
import * as math from './math.js'
import * as scenes from './scenes.js'

export {ren, io, utils, math, scenes};

export async function update(){
    var d = new Date(); //console.log(d.getSeconds());

    scenes.gameObjects[0]["clock"].transform.scale[1] = Math.sin(Date.now()/1000)+1.5
    scenes.gameObjects[0]["clock"].transform.scale[2] = Math.cos(Date.now()/1000)+1.5
    scenes.gameObjects[0]["seconds"].transform.rotation[0] = d.getSeconds()*6
    scenes.gameObjects[0]["minutes"].transform.rotation[0] = d.getMinutes()*6
    scenes.gameObjects[0]["hours"].transform.rotation[0] = d.getHours()*15
    //scenes.gameObjects[0][0].transform.rotation[1] = Date.now()
}