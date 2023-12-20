import * as ren from './renderer.js'
import * as io from './io.js'
import * as utils from './utils.js'
import * as math from './math.js'
import * as scenes from './scenes.js'

export {ren, io, utils, math, scenes};

export async function update(){
    var d = new Date(); //console.log(d.getMilliseconds());

    
    //scenes.gameObjects[0]["clock"].transform.scale[1] = Math.sin(Date.now()/1000)+1.5
    //scenes.gameObjects[0]["clock"].transform.scale[2] = Math.cos(Date.now()/1000)+1.5
    scenes.gameObjects[0]["seconds"].transform.rotation[0] = d.getSeconds()*6
    scenes.gameObjects[0]["minutes"].transform.rotation[0] = d.getMinutes()*6
    scenes.gameObjects[0]["hours"].transform.rotation[0] = d.getHours()*30;
    scenes.gameObjects[0]["camera"].transform.rotation[1] = (math.moreRecentNow())/(1000/360)/-(3.14159*2)-180
    scenes.gameObjects[0]["clock"].transform.rotation[1] = (math.moreRecentNow()%86400000)/1000*360/(3.14159*2)+270
    scenes.gameObjects[0]["camera"].transform.position[2] = Math.cos(math.moreRecentNow()/1000)*50
    scenes.gameObjects[0]["camera"].transform.position[0] = Math.sin(math.moreRecentNow()/1000)*50+40
    
}