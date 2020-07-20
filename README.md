# Network Graph with D3.js and Pixi.js using React and Typescript

## This is a simple demo for drawing multiple network graph using the combinination of D3.js and Pixi.js, which in theory will take advantage of fast rendering in Pixi.js and fast layout generating in D3.js.

===
## File Description
1. The main component to draw graph is in ```src/compoents/graph.tsx```.
2. The ways to setup data and change themes are defined in ```src/utils/themes.tsx```.

## Usage
1. Modify ```src/utils/themes.tsx``` to meet the needs.
2. Add files in ```public```.

## Notice
The delete function of demo page may not work properly in react development mode. In my case, after deleting a graph, it will not stop the ticker of Pixi Application, which will cause a huge drop in FPS after multiple creations/deletions, but this problem seems not to happen in production build.
