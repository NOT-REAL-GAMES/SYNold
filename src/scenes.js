import * as syn from './base.js'

export var mainScene = {};

export var gameObjects = []

export async function init(scene){
    mainScene = await syn.io.getJSON("./src/scenes/"+scene+".scene")
    gameObjects.push(mainScene.gameObjects);
    console.log(mainScene)
}