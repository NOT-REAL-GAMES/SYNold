import * as syn from './base.js'

export var mainScene = {};

export async function init(scene){
    mainScene = await syn.io.getJSON("./src/scenes/"+scene+".scene")
    console.log(mainScene)
}