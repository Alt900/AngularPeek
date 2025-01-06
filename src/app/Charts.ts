import * as d3 from 'd3';

interface DataStructure {
  close:number;
  high:number;
  low:number;
  open:number
  timestamp:string;
  volume:number; 
  colorscheme:string[];
}

export function AccLossPlot(
  SVG:d3.Selection<SVGSVGElement, unknown, null, undefined>, 
  Metric:number[][],
  W:number,
  H:number,
  color:string[],
  Labels:string[],
  duration:number
):void{
  const Variates:number = Metric.length-1;
  let Min = 0;
  let Max = 0;
  for(let i = 0; i<=Variates; i++){
    Min = Math.min(Min,...Metric[i]);
    Max = Math.max(Max,...Metric[i])
  }
  const len:number = Metric[0].length;
  const X:d3.ScaleLinear<number, number, never> = d3
      .scaleLinear()
      .domain([0,len])
      .range([0,W]); 
  const Y:d3.ScaleLinear<number, number, never> = d3
      .scaleLinear()
      .domain([Min,Max])
      .rangeRound([H,0]);

  function MouseMoveNavigation(e:MouseEvent):void{
    let [x] = d3.pointer(e,e.target);
    x = Math.round(x);
    SVG.selectAll("#NavigationCircle").remove();
    SVG.selectAll("#NavigationText").remove();
    let PrevY = 0;
    let Modifier = 30;
    for(let Index=0; Index<=Variates; Index++){
      if(Metric[Index][Math.round(X.invert(x))]!==undefined){
        const YValue = Metric[Index][Math.round(X.invert(x))];
        const YCord = Y(YValue);
        if(PrevY !== 0 && Math.abs(PrevY-YCord) < 30){
          SVG.append("circle")
            .attr("cx",x)
            .attr("cy",YCord+Modifier)
            .attr("r",5)
            .attr("id","NavigationCircle")
            .attr("stroke",color[Index]);
          SVG.append("text")
            .attr("x",x)
            .attr("y",YCord+Modifier)
            .text(`${Labels[Index]}: ${YValue}`)
            .attr("id","NavigationText")
            .attr("color",color[Index])
            .attr("stroke",color[Index]);
          PrevY = YCord+Modifier;
          Modifier += 30;

        } else {
          SVG.append("circle")
            .attr("cx",x)
            .attr("cy",YCord)
            .attr("r",5)
            .attr("id","NavigationCircle")
            .attr("stroke",color[Index]);
          SVG.append("text")
            .attr("x",x)
            .attr("y",YCord)
            .text(`${Labels[Index]}: ${YValue}`)
            .attr("id","NavigationText")
            .attr("color",color[Index])
            .attr("stroke",color[Index]);
          PrevY = YCord;
        }
      }
    }
  }

  SVG.on('mousemove',(e:MouseEvent)=>{MouseMoveNavigation(e)})

  for(let TTV = 0; TTV <= Variates; TTV++){
      const G = SVG.append("g")
        .attr("stroke",color[TTV])
      for(let i = 0; i <= len-2; i++){
          G.append("line")
              .attr("x1",X(i))
              .attr("x2",X(i+1))
              .attr("y1",Y(Metric[TTV][i]))
              .attr("y2",Y(Metric[TTV][i]))
              .transition()
                  .duration(duration*i)
                  .attr("y2",Y(Metric[TTV][i+1]));
      }
  }
  SVG.append("g")
    .attr("class","x-grid")
    .attr("transform",`translate(0,${H})`)
    .call(
      d3.axisBottom(X)
        .tickSize(-H)
    );
  SVG.append("g")
    .attr("class","y-grid")
    .call(
      d3.axisLeft(Y)
        .tickSize(-W)
    )
}

export function CandleStick(
    X:d3.ScaleBand<string>,
    Y:d3.ScaleLogarithmic<number, number, never>,
    Data:DataStructure[],//as datascheme interface 
    Reference:d3.Selection<SVGSVGElement, unknown, null, undefined>,
    H:number,
    W:number,
    Margin:number[],//0 top 1 bottom 2 right 3 left
    XAxis:string[]
):void{
    const Xgroup = (g: d3.Selection<SVGGElement,unknown,null,undefined>):void=>{
      g
        .attr("transform",`translate(0,${H-Margin[1]})`)
        .call(d3.axisBottom(X).tickValues(XAxis))
        .selectAll("text")
        .style("font-size","4px")
        .attr("dx","-8em")
        .attr("transform","rotate(-90)")
        .call((g:any)=>g.select(".domain").remove());//is selection type but wont accept SVGSVG
    }
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

export function DrawLSTMCell(
  Reference:d3.Selection<SVGSVGElement, unknown, null, undefined>,
  Width:number,
  Height:number,
):void{
  const X = d3.scaleLinear().domain(Array.from({length:Width},(_:any,i:number)=>i))
  const Y = d3.scaleLinear().domain(Array.from({length:Height},(_:any,i:number)=>i))
  const Group = Reference.append("g").attr("class","LSTM cell");
  const H = Y(Height);
  const W = X(Width);

  const HWCalc=[H*.9, H*.8, H*.7, W*.15, W*.3, W*.45, W*.6]
  //H90 = 0
  //H80 = 1
  //H70 = 2
  //W15 = 3
  //W30 = 4
  //W45 = 5
  //W60 = 6

  Group.append("line")
    .attr("x1",HWCalc[4]+20)
    .attr("x2",HWCalc[4]+20)
    .attr("y1",HWCalc[1])
    .attr("y2",HWCalc[1])
    .transition()
      .duration(1000+(1000/HWCalc[4]))
      .attr("y2",HWCalc[2]);
  
  Group.append("line")
    .attr("x1",HWCalc[4]+20)
    .attr("x2",HWCalc[4]+20)
    .attr("y1",HWCalc[2])
    .attr("y2",HWCalc[2])
    .transition()
      .duration(1000+(1000*.3))
      .attr("x2",HWCalc[5]+20);

  Group.append("line")
    .attr("x1",HWCalc[5]+20)
    .attr("x2",HWCalc[5]+20)
    .attr("y1",HWCalc[1])
    .attr("y2",HWCalc[1])
    .transition()
      .duration(1000+(1000*.45))
      .attr("y2",HWCalc[2]);

  for(let i = 3; i<7; i++){
    if(i!=4){//draw dot products
      const CY = i==3?H*.5:HWCalc[2]
      Group.append("circle")
      .attr("cx",HWCalc[i]+20)
      .attr("cy",CY)
      .attr("r",0)
      .transition()
        .duration(1000)
        .attr("r",15);

      Group.append("circle")
      .attr("cx",HWCalc[i]+20)
      .attr("cy",CY)
      .attr("r",0)
      .transition()
        .duration(2000)
        .attr("r",5);


      Group.append("circle")
      .attr("cx",HWCalc[i]+20)
      .attr("cy",CY)
      .attr("r",0)
      .transition()
        .duration(3000)
        .attr("r",2);

      Group.append("line")
      .attr("x1",HWCalc[i]+20)
      .attr("x2",HWCalc[i]+20)
      .attr("y1",CY)
      .attr("y2",CY)
      .transition()
        .duration(2000)
        .attr("y2",HWCalc[1]);
    }
    Group.append("line")
    .attr("x1",HWCalc[i]+20)
    .attr("x2",HWCalc[i]+20)
    .attr("y1",HWCalc[1])
    .attr("y2",HWCalc[1])
    .transition()
      .duration(1000+(1000/HWCalc[i]))
      .attr("y2",HWCalc[0]);

    Group.append("rect")
    .attr("x",HWCalc[i])
    .attr("y",HWCalc[1])
    .attr("height",0)
    .attr("width",0)
    //
    .transition()
      .duration(1000)
      .attr("width",W*.05)
      .attr("height",H*.05);

    Group.append("text")
    .attr("x",HWCalc[i]+10)
    .attr("y",HWCalc[1]+(H*.05)/2)
    .attr("dy", ".35em")
    .attr("dx",".5em")
    //
    .text(HWCalc[i]===HWCalc[5]?"Tanh":"σ")
  }

  Group.append("line")
    .attr("x1",HWCalc[3]+20)
    .attr("x2",HWCalc[3]+20)
    .attr("y1",H*.5)
    .attr("y2",H*.5)
    .transition()
      .duration(1000)
      .attr("x2",HWCalc[5]+20)

  Group.append("line")
    .attr("x1",HWCalc[5]+20)
    .attr("x2",HWCalc[5]+20)
    .attr("y1",HWCalc[2])
    .attr("y2",HWCalc[2])
    .transition()
      .duration(1000)
      .attr("y2",H*.5)

  Group.append("rect")
    .attr("x",HWCalc[6])
    .attr("y",H*.57)
    .attr("height",0)
    .attr("width",0)
    //
    .transition()
      .duration(1000)
      .attr("width",W*.05)
      .attr("height",H*.05);

  Group.append("line")
    .attr("x1",HWCalc[6]+20)
    .attr("x2",HWCalc[6]+20)
    .attr("y1",H*.5)
    .attr("y2",H*.5)
    .transition()
      .duration(1000)
      .attr("y2",H*.57);

  Group.append("line")
    .attr("x1",HWCalc[6]+20)
    .attr("x2",HWCalc[6]+20)
    .attr("y1",HWCalc[2])
    .attr("y2",HWCalc[2])
    .transition()
      .duration(1000)
      .attr("y2",H*.57);

  Group.append("line")
    .attr("x1",HWCalc[5]+20)
    .attr("x2",HWCalc[5]+20)
    .attr("y1",H*.5)
    .attr("y2",H*.5)
    .transition()
      .duration(1000)
      .attr("x2",HWCalc[6]+20);

  Group.append("text")
    .attr("x",HWCalc[6]+((W*.05)/2))
    .attr("y",H*.57+30)
    .attr("dx","-1.5em")
    //
    .text("Tanh")
    

  Group.append("line")
    .attr("x1",HWCalc[3])
    .attr("y1",HWCalc[0])
    .attr("y2",HWCalc[0])
    .attr("x2",HWCalc[3])
    .transition()
      .duration(1000+(1000/(HWCalc.length/(4/3))))
      .attr("x2",HWCalc[6]+20);

  Group.append("circle")
  .attr("cx",HWCalc[5]+20)
  .attr("cy",H*.5)
  .attr("r",0)
  .transition()
    .duration(1000)
    .attr("r",15);

  Group.append("text")
    .attr("x",HWCalc[5]+15)
    .attr("y",(H*.5)+5)
    .attr("dy",".15em")
    .attr("dx","-.10em")
    //
    .style("font-size","30px")
    .text("+");

    Group.append("rect")
      .attr("id","EscapeLSTM")
      .attr("x",W*.7)
      .attr("y",H*.3)
      .attr("height",0)
      .attr("width",0)
      //
      .transition()
        .duration(1000)
        .attr("width",W*.05)
        .attr("height",H*.05);

    Group.append("text")
      .attr("x",W*.7+((W*.05)/2))
      .attr("y",H*.3+30)
      .attr("dx","-1.5em")
      //
      .text("Exit")
    //initial cell state
    Group.append("rect")
      .attr("x",W*.05)
      .attr("y",H*.48)
      .attr("height",0)
      .attr("width",0)
      //
      .transition()
        .duration(1000)
        .attr("width",W*.05)
        .attr("height",H*.05);

    Group.append("text")
      .attr("x",W*.05+((W*.05)/2))
      .attr("y",H*.48+30)
      .attr("dx","-2em")
      //
      .text("Cell state")

    Group.append("line")
      .attr("x1",W*.05+((W*.05)/2))
      .attr("x2",W*.05+((W*.05)/2))
      .attr("y1",H*.5)
      .attr("y2",H*.5)
      .attr("height",0)
      .attr("width",0)
      .transition()
        .duration(1000)
        .attr("x2",HWCalc[3]+20)

    //initial hidden state
    Group.append("rect")
      .attr("x",W*.05)
      .attr("y",HWCalc[0]-20)
      .attr("height",0)
      .attr("width",0)
      //
      .transition()
        .duration(1000)
        .attr("width",W*.05)
        .attr("height",H*.05);

    Group.append("text")
      .attr("x",W*.05+((W*.05)/2))
      .attr("y",HWCalc[0]+10)
      .attr("dx","-3em")
      .style("font-size","12px")
      //
      .text("Hidden state")

    Group.append("line")
      .attr("x1",W*.05+((W*.05)/2))
      .attr("x2",W*.05+((W*.05)/2))
      .attr("y1",HWCalc[0])
      .attr("y2",HWCalc[0])
      .attr("height",0)
      .attr("width",0)
      .transition()
        .duration(1000)
        .attr("x2",HWCalc[3]+20)

    //final cell state

    Group.append("rect")
      .attr("x",W*.7)
      .attr("y",H*.5-20)
      .attr("height",0)
      .attr("width",0)
      //
      .transition()
        .duration(1000)
        .attr("width",W*.05)
        .attr("height",H*.05);

    Group.append("text")
      .attr("x",W*.7+((W*.05)/2))
      .attr("y",H*.48+30)
      .attr("dx","-2em")
      //
      .text("Cell state")

    Group.append("line")
      .attr("x1",HWCalc[6]+20)
      .attr("x2",HWCalc[6]+20)
      .attr("y1",H*.5)
      .attr("y2",H*.5)
      .attr("height",0)
      .attr("width",0)
      .transition()
        .duration(1000)
        .attr("x2",W*.7)


    //final hidden state

    Group.append("rect")
      .attr("x",W*.7)
      .attr("y",HWCalc[0]-20)
      .attr("height",0)
      .attr("width",0)
      //
      .transition()
        .duration(1000)
        .attr("width",W*.05)
        .attr("height",H*.05);

    Group.append("text")
      .attr("x",W*.7+((W*.05)/2))
      .attr("y",HWCalc[0]+10)
      .attr("dx","-3em")
      .style("font-size","12px")
      //
      .text("Hidden state")

    Group.append("line")
      .attr("x1",HWCalc[6]+20)
      .attr("x2",HWCalc[6]+20)
      .attr("y1",HWCalc[0])
      .attr("y2",HWCalc[0])
      .attr("height",0)
      .attr("width",0)
      .transition()
        .duration(1000)
        .attr("x2",W*.7)
}