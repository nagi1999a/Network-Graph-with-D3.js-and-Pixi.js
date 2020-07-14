import * as PIXI from 'pixi.js'
import * as d3 from 'd3-force'

export interface nodeInfo extends d3.SimulationNodeDatum{
    name: string;
    group: number;
    gfx?: PIXI.DisplayObject;
}

export interface edgeInfo extends d3.SimulationLinkDatum<nodeInfo>{
    weight: number;
    gfx?: PIXI.DisplayObject;
}

export function dataLoader(next: Function){
    setTimeout(() => {
        dataGenerator(next)
    }, 3000);
}

function dataGenerator(next: Function){
    let nodes: nodeInfo[] = [];
    let edges: edgeInfo[] = [];
    for(let i = 0; i < 101; i++)
        nodes.push({name: String(i), group: Math.ceil(Math.random()*9)});
    for(let i = 0 ; i < 200; i++)
        edges.push({source: Math.ceil(Math.random()*100),target: Math.ceil(Math.random()*100),weight: Math.ceil(Math.random()*5)})
    next(nodes,edges);
}
export function generateNodeTextures(){
    let Textures: PIXI.Texture[] = [];
    for(let i = 1; i <= 10; i++){
        Textures.push(PIXI.Texture.from(`pngs/group_${i}.png`))
    }
    return Textures;
}
export function getNodeColor(node: nodeInfo){
    const colors: number[] = [0x7DB37B, 0xBFD192, 0xF5E49E, 0xF7C6A3, 0xF4A28B, 0xD7BFFF, 0xF1FFA9, 0xC0FFC0, 0xFFD8D8, 0xD8F0FF];
    return colors[node.group];
} 

export function getLineColor(edge: edgeInfo){
    const colors: number[] = [0x7DB37B, 0xBFD192, 0xF5E49E, 0xF7C6A3, 0xF4A28B, 0xD7BFFF];
    return colors[edge.weight];
}

export function getNodeTextureIndex(node: nodeInfo){
    return node.group;
}