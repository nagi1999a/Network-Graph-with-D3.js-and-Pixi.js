import * as React from 'react';
import Graph from './graph'
import { nodeInfo } from '../utils/theme'
export interface IgraphInfoProps {
  width: number;
  height: number;
}

export interface IgraphInfoState {
  data: any;
}
export default class GraphInfo extends React.Component<IgraphInfoProps> {
  state: IgraphInfoState;
  info: nodeInfo;
  public constructor(props: IgraphInfoProps){
    super(props);
    this.state = {data:{}};
    this.setState=this.setState.bind(this)
    this.info = {
      name:"",
      group:0  
    }
  }
  public render() {
    let info: JSX.Element[] = [];
    for(const key in this.info){
      info.push(
        <tr key={key}>
          <td style={{border:"2px solid green"}}>{key}</td>
          <td style={{border:"2px solid green"}}>{String(this.state.data[key])}</td>
        </tr>
      )
    }
    return (
      <div>
        <div style={{padding:"15px"}}>
          <table style={{background:"0xFFFFFF",border:"3px solid green"}}>
            <tbody>
              {info}
            </tbody>
          </table>
        </div>
        <div>
          <Graph width={this.props.width} height={this.props.height} showGraphInfo={this.setState}/>
        </div>
      </div>
    );
  }
}
