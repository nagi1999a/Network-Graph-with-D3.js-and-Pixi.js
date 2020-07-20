import * as React from 'react';
import * as PIXI from 'pixi.js';
import * as Viewport from 'pixi-viewport'
import Stats from 'stats.js'
import * as d3 from 'd3-force';
import {dataLoader,nodeInfo, edgeInfo, generateNodeTextures, getNodeColor, getLineColor, getNodeTextureIndex } from '../utils/theme'

export interface IGraphProps {
    width: number;
    height: number;
    showGraphInfo: Function;
}

export default class Graph extends React.Component<IGraphProps> {
    app: PIXI.Application;
    graphRef: React.RefObject<HTMLDivElement>;
    statsRef: React.RefObject<HTMLDivElement>;
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
    originalSelect: string;
    loadingText: PIXI.Text;
    forceCharge: d3.ForceManyBody<nodeInfo>;
    forceCenter: d3.ForceCenter<nodeInfo>;
    forceLink: d3.ForceLink<nodeInfo, edgeInfo>;

    public constructor(props: IGraphProps) {
        super(props);
        
        // Create Pixi Application & Viewport
        this.app = new PIXI.Application({
            height: props.height,
            width: props.width,
            antialias:true,
            autoDensity: true,
            resolution: 2,
            transparent: true
        })
        this.viewport = new Viewport.Viewport({passiveWheel: false, screenWidth: this.props.width, screenHeight: this.props.height, interaction: this.app.renderer.plugins.interaction})
        this.arrowOffset = 10;
        this.viewport.drag().pinch().wheel().decelerate();
        this.app.stage.addChild(this.viewport);
        this.app.view.addEventListener("pointerdown",(event)=>{event.preventDefault();}) // prevent from selecting unwanted things while dragging outside

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
        this.arrowTexture = PIXI.Texture.from('/pngs/internal/arrow.png')
        this.edgeGFX = new PIXI.Graphics();
        this.stageEdge.addChild(this.edgeGFX);
        this.focusNode = undefined;
        this.focusNodeGFX = PIXI.Sprite.from('/pngs/internal/click.png');
        this.focusNodeGFX.anchor.set(0.5);
        this.focusNodeGFX.scale.set(0.5);
        this.viewport.on("pointerdown",(event: PIXI.InteractionEvent)=>{
            const pos = this.viewport.toLocal(new PIXI.Point(event.data.global.x,event.data.global.y))
            this.focusNode = this.simulation.find(pos.x,pos.y,10);
            if(this.focusNode){
                this.props.showGraphInfo({data:this.focusNode});
                this.simulation.alpha(0.1);
                this.simulation.alphaDecay(0);
                this.simulation.restart();
                this.viewport.plugins.pause("drag");
                this.focusNodeGFX.x = pos.x;
                this.focusNodeGFX.y = pos.y;
                this.stageNode.addChild(this.focusNodeGFX);
            }
        });
        this.viewport.on("pointermove", (event: PIXI.InteractionEvent)=>{
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
            if(this.focusNode && this.focusNodeGFX){
                this.simulation.alphaDecay(0.01);
                this.focusNode.fx = null;
                this.focusNode.fy = null;
                this.focusNode = undefined;
                this.viewport.plugins.resume("drag");
                this.stageNode.removeChild(this.focusNodeGFX);
            }
        });
        this.viewport.on("pointerupoutside",()=>{
            if(this.focusNode && this.focusNodeGFX){
                this.simulation.alphaDecay(0.01);
                this.focusNode.fx = null;
                this.focusNode.fy = null;
                this.focusNode = undefined;
                this.viewport.plugins.resume("drag");
                this.stageNode.removeChild(this.focusNodeGFX);
            }
        });

        // Create reference to let pixi manage its DOM
        this.graphRef = React.createRef();
        this.statsRef = React.createRef();

        // Initialize d3 objects
        this.nodes = [];
        this.edges = [];

        // Create D3-force simulation object
        this.simulation = d3.forceSimulation();
        this.simulation.stop();
        this.forceCharge = d3.forceManyBody();
        this.forceCenter = d3.forceCenter(this.props.width/2,this.props.height/2);
        this.forceLink = d3.forceLink();
        
        // Bind tick function to instance self to let tick function access data
        this.tick = this.tick.bind(this);
        this.contentChangeHandler = this.contentChangeHandler.bind(this);

        // Stats.js Preference
        this.stats = new Stats();
        this.stats.dom.style.position="absolute";
        this.stats.dom.style.top="0px";
        this.stats.dom.style.left="0px";

        // Save Original dragging style
        this.originalSelect = document.body.style.userSelect;

        // Loading Text
        this.loadingText = new PIXI.Text('Loading...')
        this.loadingText.x = this.props.width/2;
        this.loadingText.y = this.props.height/2;
        this.loadingText.anchor.set(0.5);
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
        this.simulation.force("charge", this.forceCharge);
        this.simulation.force("center", this.forceCenter);
        this.simulation.force("links",this.forceLink.links(this.edges));
        this.simulation.alpha(1);
        this.simulation.restart();
        this.app.stage.removeChild(this.loadingText);
    }

    public componentDidMount() {
        this.app.stage.addChild(this.loadingText);
        this.app.ticker.add(this.tick);
        this.graphRef.current?.appendChild(this.app.view);
        this.statsRef.current?.appendChild(this.stats.dom);
        dataLoader(this.contentChangeHandler);
    }

    public componentWillUnmount(){
        this.graphRef.current?.removeChild(this.app.view);
        this.statsRef.current?.removeChild(this.stats.dom);
        this.app.destroy(false, {children:true}); // will trigger children destroy method and also all plugins like TickerPlugin
        this.simulation.stop();
        this.simulation.force("links", null);
        this.simulation.force("center", null);
        this.simulation.force("charge", null);
        this.simulation.nodes([]);
    }

    public render() {
        return (
            <div className="graph">
                <div style={{position: "relative"}}>
                    <div ref={this.statsRef}/>
                    <div style={{border:"3px solid orange"}} ref={this.graphRef}/>
                </div>
            </div>
        );
    }
}
