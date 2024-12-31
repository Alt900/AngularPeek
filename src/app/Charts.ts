import * as d3 from 'd3';

export function AccLossPlot(SVG:d3.Selection<SVGSVGElement, unknown, null, undefined>, Metric:number[][],W:number,H:number):void{
    const Min = Math.min(...Metric[0],...Metric[1]);
    const Max = Math.max(...Metric[0],...Metric[1]);
    const length = Metric[0].length;
    const X:d3.ScaleLinear<number, number, never> = d3
        .scaleLinear()
        .domain(Array.from({length},(_,i)=>i))
        .range([0,W*.1]); 
    const Y:d3.ScaleLinear<number, number, never> = d3
        .scaleLinear()
        .domain([Min,Max])
        .rangeRound([0,H]);
    for(let TTV = 0; TTV <= 1; TTV++){
        for(let i = 1; i <= length; i++){
            SVG.append("line")
                .attr("x1",X(i-1))
                .attr("x2",X(i))
                .attr("y1",Y(Metric[TTV][i-1]))
                .attr("y2",Y(Metric[TTV][i-1]))
                .transition()
                    .duration(100*i)
                    .attr("y2",Y(Metric[TTV][i]));
        }
    }
}

export function CandleStick(
    X:d3.ScaleBand<string>,
    Y:d3.ScaleLogarithmic<number, number, never>,
    Data:any,//as datascheme interface 
    Reference:d3.Selection<SVGSVGElement, unknown, null, undefined>,
    H:number,
    W:number,
    Margin:number[],//0 top 1 bottom 2 right 3 left
    XAxis:string[]
):void{
    const Xgroup = (g: d3.Selection<SVGGElement,unknown,null,undefined>)=>
      g
        .attr("transform",`translate(0,${H-Margin[1]})`)
        .call(d3.axisBottom(X).tickValues(XAxis))
        .selectAll("text")
        .style("font-size","4px")
        .attr("dx","-8em")
        .attr("transform","rotate(-90)")
        .call((g:any)=>g.select(".domain").remove());

    const Ygroup = (g:d3.Selection<SVGGElement,unknown,null,undefined>)=>
      g
        .attr("transform",`translate(${Margin[3]},0)`)
        .call(d3.axisLeft(Y))
        .selectAll("text")
        .style("font-size","4px")
        .call((g:any)=>g
          .selectAll(".tick line")
          .clone()
          .attr("stroke-opacity",.2)
          .attr("x2",W-Margin[3]-Margin[2])
        )
        .call((g:any)=>g.select(".domain").remove());
    Reference.append("g").call(Xgroup);
    Reference.append("g").call(Ygroup);

    const g = Reference.append("g")
      .attr("stroke-linecap","round")
      .attr("stroke","black")
      .selectAll("g")
      .data(Data)
      .join("g")
      .attr("transform",((_:any,Index:number)=>`translate(${X(XAxis[Index])},0)`))//produces all number types
    g.append("line")
      .attr("y1",(d:any)=>Y(d.low))
      .attr("y2",(d:any)=>Y(d.high));

    g.append("line")
      .attr("y1",(d:any)=>Y(d.open))
      .attr("y2",(d:any)=>Y(d.open))//this.Data[0].colorscheme <T> = string | undefined
      .attr("stroke-width",X.bandwidth()) //[red,green,grey]
      .attr("stroke",
        Data[0].colorscheme===undefined?
          (d:any)=>d.open>d.close ? d3.schemeSet1[0] : d.close > d.open ? d3.schemeSet1[2] : d3.schemeSet1[8]
          :(d:any)=> d.open>d.close ? d.colorscheme[0] : d.close > d.open ? d.colorscheme[1]: d.colorscheme[2]
        )
      .transition()
        .duration(1000)
        .attr("y2",(d:any)=>Y(d.close))
  }

export function Heatmap(Container:SVGSVGElement):d3.Selection<SVGSVGElement, unknown, null, undefined>{
    const SVG:d3.Selection<SVGSVGElement, unknown, null, undefined> = d3.select(Container);
    return SVG
}

export function Complexity(Container:SVGSVGElement):d3.Selection<SVGSVGElement, unknown, null, undefined>{
    const SVG:d3.Selection<SVGSVGElement, unknown, null, undefined> = d3.select(Container);
    return SVG
}