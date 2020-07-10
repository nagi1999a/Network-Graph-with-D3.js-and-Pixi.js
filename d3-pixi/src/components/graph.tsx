import * as React from 'react';
import * as PIXI from 'pixi.js';
import * as Viewport from 'pixi-viewport'
import Stats from 'stats.js'
import * as d3 from 'd3-force';
import {dataLoader,nodeInfo, edgeInfo, generateNodeTextures, getNodeColor, getLineColor, getNodeTextureIndex } from '../utils/theme'
export interface IGraphProps {
    width: number;
    height: number;
    id: string;
    key?: string;
}

export default class Graph extends React.Component<IGraphProps> {
    app: PIXI.Application;
    rootRef: React.RefObject<HTMLDivElement>;
    stats : Stats;
    stageEdge: PIXI.Container;
    stageNode: PIXI.Container;
    nodes: nodeInfo[];
    edges: edgeInfo[];
    simulation: d3.Simulation<nodeInfo, edgeInfo>;
    edgeGFX: PIXI.Graphics;
    nodeTextures: PIXI.Texture[];
    viewport: Viewport.Viewport;
    focusNode: nodeInfo | undefined;
    focusNodeGFX: PIXI.Sprite;
    stageNodes: PIXI.ParticleContainer[];
    stageArrow: PIXI.ParticleContainer;
    arrowOffset: number;
    arrowTexture: PIXI.Texture;

    public constructor(props: IGraphProps) {
        super(props);
        
        // Create Pixi Application & Viewport
        this.app = new PIXI.Application({
            backgroundColor: 0xFFFFFF,
            height: props.height,
            width: props.width,
            antialias:true
        })
        this.viewport = new Viewport.Viewport({screenWidth: this.props.width, screenHeight: this.props.height, interaction: this.app.renderer.plugins.interaction})
        this.arrowOffset = 10;
        this.viewport.drag().pinch().wheel().decelerate();
        this.app.stage.addChild(this.viewport);
        // Get node Textures
        this.nodeTextures = generateNodeTextures();

        // Create multiple stage to easy manage
        this.stageEdge = new PIXI.Container();
        this.stageArrow = new PIXI.ParticleContainer(100000,{rotation: true});
        this.stageNode = new PIXI.Container();
        this.viewport.addChild(this.stageEdge);
        this.viewport.addChild(this.stageArrow);
        this.viewport.addChild(this.stageNode);
        this.stageNodes = [];
        for(let i = 0; i < this.nodeTextures.length; i++){
            let stage = new PIXI.ParticleContainer(100000);
            this.stageNodes.push(stage);
            this.stageNode.addChild(stage);
        }

        // Create Empty Edge Graphic and Transparent Interact graphic
        this.arrowTexture = PIXI.Texture.from('/pngs/arrow.png')
        this.edgeGFX = new PIXI.Graphics();
        this.stageEdge.addChild(this.edgeGFX);
        this.focusNode = undefined;
        this.focusNodeGFX = PIXI.Sprite.from('/pngs/click.png');
        this.focusNodeGFX.anchor.set(0.5);
        this.focusNodeGFX.scale.set(0.5);
        this.viewport.on("pointerdown",(event: PIXI.InteractionEvent)=>{
            const pos = this.viewport.toLocal(new PIXI.Point(event.data.global.x,event.data.global.y))
            this.focusNode = this.simulation.find(pos.x,pos.y,10);
            if(this.focusNode){
                console.log(this.focusNode);
                this.simulation.alpha(0.1);
                this.simulation.alphaDecay(0);
                this.simulation.restart();
                this.viewport.plugins.pause("drag");
                this.focusNodeGFX.x = pos.x;
                this.focusNodeGFX.y = pos.y;
                this.stageNode.addChild(this.focusNodeGFX);
            }
        });
        this.viewport.on("mousemove", (event: PIXI.InteractionEvent)=>{
            this.simulation.restart();
            if(this.focusNode && this.focusNodeGFX){
                const pos = this.viewport.toLocal(new PIXI.Point(event.data.global.x,event.data.global.y))
                this.focusNode.fx = pos.x;
                this.focusNode.fy = pos.y;
                this.focusNodeGFX.x = pos.x;
                this.focusNodeGFX.y = pos.y;
            }
        })
        this.viewport.on("pointerup",()=>{
            this.simulation.alphaDecay(0.01);
            if(this.focusNode && this.focusNodeGFX){
                this.focusNode.fx = null;
                this.focusNode.fy = null;
                this.focusNode = undefined;
                this.viewport.plugins.resume("drag");
                this.stageNode.removeChild(this.focusNodeGFX);
            }
        });

        // Create reference to let pixi manage its DOM
        this.rootRef = React.createRef();

        // Initialize d3 objects
        this.nodes = [];
        this.edges = [];

        // Create D3-force simulation object
        this.simulation = d3.forceSimulation();
        this.simulation.force("charge", d3.forceManyBody());
        this.simulation.force("center", d3.forceCenter(this.props.width/2,this.props.height/2));
        this.simulation.force("links",d3.forceLink());
        
        // Bind tick function to instance self to let tick function access data
        this.tick = this.tick.bind(this);
        this.contentChangeHandler = this.contentChangeHandler.bind(this);
        this.stats = new Stats();
        this.stats.dom.style.position="relative";
	    this.stats.dom.style.top="50px";
    }
    public tick() {
        this.stats.begin();
        for(const node of this.nodes)
            if(node.gfx && node.gfx.position )
                node.gfx.position = new PIXI.Point(node.x, node.y);
        
        this.edgeGFX.clear();
        for(const edge of this.edges){
            const source = (edge.source as nodeInfo);
            const target = (edge.target as nodeInfo);
            if(source.x && source.y && target.x && target.y && edge.gfx){
                let a = target.x - source.x;
                let b = target.y - source.y;
                let unit_x = a / Math.sqrt(a * a + b * b);
                let unit_y = b / Math.sqrt(a * a + b * b);
                edge.gfx.x = target.x - unit_x * this.arrowOffset;
                edge.gfx.y = target.y - unit_y * this.arrowOffset;
                edge.gfx.rotation = Math.atan2(target.y-source.y, target.x-source.x);
                this.edgeGFX.lineStyle(2,getLineColor(edge));
                this.edgeGFX.moveTo(source.x,source.y)
                this.edgeGFX.lineTo(target.x,target.y)
            }
            
        }
        this.stats.end();
    }
    public contentChangeHandler(nodes: nodeInfo[],edges: edgeInfo[]){
        this.nodes = nodes;
        this.edges = edges;
        this.simulation.nodes(this.nodes)
        this.simulation.force("links",d3.forceLink(this.edges));
        for(const node of this.nodes){
            let nodeSprite = new PIXI.Sprite();
            nodeSprite.texture = this.nodeTextures[getNodeTextureIndex(node)];
            nodeSprite.anchor.set(0.5);
            nodeSprite.scale.set(0.5);
            nodeSprite.tint = getNodeColor(node);
            node.gfx = nodeSprite;
            this.stageNodes[getNodeTextureIndex(node)].addChild(nodeSprite);
        }
        for(const edge of this.edges){
            let arrowSprite = new PIXI.Sprite();
            arrowSprite.texture = this.arrowTexture;
            arrowSprite.anchor.set(0.5);
            arrowSprite.scale.set(0.5);
            arrowSprite.tint = getLineColor(edge);
            edge.gfx = arrowSprite;
            this.stageArrow.addChild(arrowSprite)
        }
    }
    public componentDidMount() {
        dataLoader(this.contentChangeHandler);
        this.app.ticker.add(this.tick);
        document.getElementById(`stat_${this.props.id}`)?.appendChild( this.stats.dom );
        this.rootRef.current?.appendChild(this.app.view);
    }
    public componentWillUnmount(){
        this.rootRef.current?.removeChild(this.app.view);
        document.body.removeChild(this.stats.dom);
        this.app.ticker.remove(this.tick);
        this.app.destroy();
        this.simulation.nodes([]);
        this.simulation.force("links",d3.forceLink([]));
        this.simulation.stop();
    }
    public render() {
        return (
            <div id={this.props.id} className="graph">
                <div id={`stat_${this.props.id}`} />
                <div ref={this.rootRef} />
            </div>
        );
    }
}