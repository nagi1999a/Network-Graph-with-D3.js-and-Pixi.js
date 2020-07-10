import * as React from 'react';
import Graph from './graph';
export interface IgraphControlProps {
}

export interface IgraphControlState {
    graphs: JSX.Element[];
}
export default class graphControl extends React.Component<IgraphControlProps,IgraphControlState> {
  count: number;
  public constructor(props: IgraphControlProps){
    super(props);
    this.state = {graphs: []};
    this.count = 0;
  } 
  public addGraph(){
    const width = document.getElementById("width");
    const height = document.getElementById("height");
    if(width && height){
      let graph = <Graph width={Number(width.getAttribute("value"))} height={Number(height.getAttribute("value"))} id={`g_${this.count}`} key={`g_${this.count}`} />;
      this.count += 1;
      this.setState({graphs: this.state.graphs.concat([graph])})
    }
  }
  public render() {
    return (
    <div>
      <div style={{float:"left"}}>
        <input id="width" type="number" placeholder="width" value={500}></input>
        <input id="height" type="number" placeholder="height" value={500}></input>
        <button onClick={()=>{this.addGraph()}}>Add Graph</button>
      </div>
      <div style={{clear:"both"}} />
      <div>
          {this.state.graphs}
      </div>
    </div>
    );
  }
}
