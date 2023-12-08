import * as ren from './renderer.js'
import * as io from './io.js'
import * as utils from './utils.js'
import * as math from './math.js'
import * as scenes from './scenes.js'

export {ren, io, utils, math, scenes};

export async function update(){
    scenes.gameObjects[0][0].transform.rotation[1] = Math.cos(Date.now()/1000)*90
    //scenes.gameObjects[0][0].transform.rotation[1] = Date.now()
    scenes.gameObjects[0][0].transform.rotation[2] = Math.sin(Date.now()/1000)*90
}