import * as React from 'react';
import GraphInfo from './graphInfo'
export interface IgraphControlProps {
}
export interface IgraphControlState {
  height: number;
  width: number;
  graphs: JSX.Element[];
  index: string[];
}
export default class graphControl extends React.Component<IgraphControlProps,IgraphControlState> {
  count: number;
  public constructor(props: IgraphControlProps){
    super(props);
    this.state = {height: 500, width: 500, index:[], graphs: []};
    this.count = 0;
    this.handleWidthChange = this.handleWidthChange.bind(this);
    this.handleHeightChange = this.handleHeightChange.bind(this);
    this.handleDelete = this.handleDelete.bind(this);
  } 
  public addGraph(){
    const width = document.getElementById("width");
    const height = document.getElementById("height");
    if(width && height){
      let id = `g_${this.count}`;
      let graph = ( 
      <div id={id} style={{position:"relative",float:"left"}} key={this.count}>
        <GraphInfo width={this.state.width} height={this.state.height}/>
        <button name="delete" style={{position:"absolute",right:"0%",bottom:"0%"}} onClick={this.handleDelete}>Delete</button>
      </div>
      )
      this.setState({index: this.state.index.concat([id]),graphs: this.state.graphs.concat([graph])});
      this.count += 1;
    }
  }
  public handleDelete(e: React.MouseEvent<HTMLButtonElement>){
    let graphs = [...this.state.graphs];
    let index = [...this.state.index];
    let key = e.currentTarget.parentElement?.getAttribute("id")
    if(key){
      graphs.splice(index.indexOf(key),1);
      index.splice(index.indexOf(key),1);
      this.setState({index: index, graphs: graphs});
    }
  }
  public handleWidthChange(e: React.ChangeEvent<HTMLInputElement>){
    this.setState({width: Number(e.target.value)})
  }
  public handleHeightChange(e: React.ChangeEvent<HTMLInputElement>){
    this.setState({height: Number(e.target.value)})
  }
  public render() {
    return (
    <div>
      <div style={{textAlign:"center"}}>
        width:
        <input id="width" type="number" placeholder="width" value={this.state.width} onChange={this.handleWidthChange}></input>
        <br/>
        height:
        <input id="height" type="number" placeholder="height" value={this.state.height} onChange={this.handleHeightChange}></input>
        <br/>
        <button onClick={()=>{this.addGraph()}}>Add Graph</button>
        <br/>
      </div>
      <h2 style={{textAlign:"center"}}>Graphs will show here:</h2>
      <div>
          {this.state.graphs}
      </div>
    </div>
    );
  }
}
