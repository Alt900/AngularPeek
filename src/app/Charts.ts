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

export function MultivariateChart(
  SVG:d3.Selection<SVGSVGElement, unknown, null, undefined>, 
  Metric:number[][],
  W:number,
  H:number,
  color:string[][],
  Labels:string[],
  duration:number,
  CutOff:number
):void{
  const Variates:number = Metric.length-1;
  let Min = 0;
  let Max = 0;
  for(let i = 0; i<=Variates; i++){
    Min = Math.min(Min,...Metric[i]);
    Max = Math.max(Max,...Metric[i])
  }
  const len:number = Metric[0].length;
  const PredictionCutOff = len-CutOff;
  const BaseColor = color[0];
  const PredictionColor = color[1];
  const X:d3.ScaleLinear<number, number, never> = d3
      .scaleLinear()
      .domain([0,len])
      .range([0,W]); 
  const XPredictionCutOff = X(PredictionCutOff);
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
        const Color = x>XPredictionCutOff?BaseColor:PredictionColor;
        if(PrevY !== 0 && Math.abs(PrevY-YCord) < 30){
          SVG.append("circle")
            .attr("cx",x)
            .attr("cy",YCord+Modifier)
            .attr("r",5)
            .attr("id","NavigationCircle")
            .attr("stroke",Color[Index]);
          SVG.append("text")
            .attr("x",x)
            .attr("y",YCord+Modifier)
            .text(`${Labels[Index]}: ${YValue}`)
            .attr("id","NavigationText")
            .attr("color",Color[Index])
            .attr("stroke",Color[Index]);
          PrevY = YCord+Modifier;
          Modifier += 30;

        } else {
          SVG.append("circle")
            .attr("cx",x)
            .attr("cy",YCord)
            .attr("r",5)
            .attr("id","NavigationCircle")
            .attr("stroke",Color);
          SVG.append("text")
            .attr("x",x)
            .attr("y",YCord)
            .text(`${Labels[Index]}: ${YValue}`)
            .attr("id","NavigationText")
            .attr("color",Color[Index])
            .attr("stroke",Color[Index]);
          PrevY = YCord;
        }
      }
    }
  }

  SVG.on('mousemove',(e:MouseEvent)=>{MouseMoveNavigation(e)})

  for(let TTV = 0; TTV <= Variates; TTV++){
      const G = SVG.append("g")
      for(let i = 0; i <= len-2; i++){
          const Color = i>PredictionCutOff?BaseColor:PredictionColor;
          G.append("line")
              .attr("x1",X(i))
              .attr("x2",X(i+1))
              .attr("y1",Y(Metric[TTV][i]))
              .attr("y2",Y(Metric[TTV][i]))
              .attr("stroke",Color[TTV])
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

export function AccLossPlot(
  SVG:d3.Selection<SVGSVGElement, unknown, null, undefined>, 
  Metric:number[][],
  W:number,
  H:number,
  color:string[],
  Labels:string[],
  duration:number,
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
        const Color = color[Index]
        if(PrevY !== 0 && Math.abs(PrevY-YCord) < 30){
          SVG.append("circle")
            .attr("cx",x)
            .attr("cy",YCord+Modifier)
            .attr("r",5)
            .attr("id","NavigationCircle")
            .attr("stroke",Color);
          SVG.append("text")
            .attr("x",x)
            .attr("y",YCord+Modifier)
            .text(`${Labels[Index]}: ${YValue}`)
            .attr("id","NavigationText")
            .attr("color",Color)
            .attr("stroke",Color);
          PrevY = YCord+Modifier;
          Modifier += 30;

        } else {
          SVG.append("circle")
            .attr("cx",x)
            .attr("cy",YCord)
            .attr("r",5)
            .attr("id","NavigationCircle")
            .attr("stroke",Color);
          SVG.append("text")
            .attr("x",x)
            .attr("y",YCord)
            .text(`${Labels[Index]}: ${YValue}`)
            .attr("id","NavigationText")
            .attr("color",Color)
            .attr("stroke",Color);
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
              .attr("stroke",color[TTV])
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
    XAxis:string[]
):void{
    const Xgroup = (g: d3.Selection<SVGGElement,unknown,null,undefined>):void=>{
      g
        .attr("transform",`translate(0,${H-30})`)
        .call(d3.axisBottom(X).tickValues(XAxis))
        .selectAll("text")
        .style("font-size","4px")
        .attr("dx","-8em")
        .attr("transform","rotate(-90)")
        .call((g:any)=>g.select(".domain").remove());//is selection type but wont accept SVGSVG
    }
    const Ygroup = (g:d3.Selection<SVGGElement,unknown,null,undefined>)=>
      g
        .attr("transform",`translate(${40},0)`)
        .call(d3.axisLeft(Y))
        .selectAll("text")
        .style("font-size","4px")
        .call((g:any)=>g
          .selectAll(".tick line")
          .clone()
          .attr("stroke-opacity",.2)
          .attr("x2",W-40-30)
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

export function DrawConnectionLines(
  Group:d3.Selection<SVGGElement, unknown, null, undefined>,
  YFunc:d3.ScaleLinear<number, number, never>,
  NextX:number,
  cell_count:number,
  next_cell_count:number,
  Height:number,
  SubX:number,
  DropoutArray:boolean[],
  Secondary:string,
  Index:number,
  SubYOscillation:boolean,
  TargetYOscillation:boolean
):void{
  const H2:number = Height/2
  for(let N = 1; N<=cell_count; N++){
    let SubY = 0;
    if(SubYOscillation){
      SubY = N%2===0 ? H2-YFunc(N*10) : H2+YFunc(N*10);
    } else{
      SubY = H2-YFunc(N*5);
    }

    for(let NNode = 1; NNode<=next_cell_count; NNode++){
      let TargetY = 0;
      if(TargetYOscillation){
        TargetY = NNode%2===0?H2-YFunc(NNode*10):H2+YFunc(NNode*10);
      } else {
        TargetY = H2-YFunc(NNode*5);//alter
      }

      if(!DropoutArray[N]){
        Group.append("line")
          .attr("x1",SubX)
          .attr("x2",SubX)
          .attr("y1",TargetY)
          .attr("y2",TargetY)
          .attr("stroke",Secondary)
          .attr("stroke-width",.2)
          .transition()
            .duration(1000*Index)
            .attr("x2",NextX)
            .attr("y2",SubY);
      }
    }
  }
}

export function DrawLSTMLayer(
  Group:d3.Selection<SVGGElement, unknown, null, undefined>,
  YFunc:d3.ScaleLinear<number, number, never>,
  Height:number,
  SubX:number,
  cell_count:number,
  Index:number,
  Primary:string,
  Secondary:string,
  ScaledSize:number,
  DropoutArray:boolean[],
  OverHandler:(e:any)=>void,
  OutHandler:(e:any)=>void,
  LayerBooleanReference:boolean[],
  ClickHandler:(e:any,boolref:boolean[])=>void
):void{

  const MaxY:number = Height/2-YFunc(cell_count*10);
  const MinY:number = Height/2+YFunc(cell_count*10);
  Group.on("mouseover",null).on("mouseout",null)
  Group.append("rect")
    .attr("x",SubX-ScaledSize*2)
    .attr("width",ScaledSize*4)
    .attr("y",cell_count%2===0?MaxY-15:MaxY)
    .attr("height",0)
    .attr("stroke",Secondary)
    .attr("fill","#00000000")
    .attr("id",`LayerBoundingBox_LSTM_${Index}`)
    .transition()
      .duration(5000)
      .attr("height",(MinY-MaxY)+15)

    Group.on("mouseover",OverHandler).on("mouseout",OutHandler)
    Group.on("click",(e:any)=>{ClickHandler(e,LayerBooleanReference)})

  for(let N = 1; N<=cell_count; N++){
    const SubY = N%2===0 ? Height/2-YFunc(N*10) : Height/2+YFunc(N*10);
    Group.append("rect")
      .attr("x",SubX-ScaledSize/2)
      .attr("y",SubY-ScaledSize/2)
      .attr("height",0)
      .attr("width",0)
      .attr("stroke",DropoutArray[N]?Primary:Secondary)
      .attr("fill",DropoutArray[N]?Secondary:Primary)
      .attr("id",DropoutArray[N]?`Dropout_${Index}_${N}`:`LSTM_${Index}_${N}`)
      .transition()
        .duration(1000*Index)
        .attr("width",ScaledSize)
        .attr("height",ScaledSize)
  }
}

export function DrawDenseLayer(
  Group:d3.Selection<SVGGElement, unknown, null, undefined>,
  YFunc: d3.ScaleLinear<number, number, never>,
  SubX:number,
  cell_count:number,
  Primary:string,
  Secondary:string,
  Index:number,
  ScaledRadius:number,
  Height:number,
  DropoutArray:boolean[],
  LayerBooleanReference:boolean[],
  ClickHandler:(e:any,boolref:boolean[])=>void
):void{

  const MaxY:number = Height/2-YFunc(cell_count*10);
  const MinY:number = Height/2+YFunc(cell_count*10);
  Group.on("mouseover",null).on("mouseout",null)
  Group.append("rect")
    .attr("x",SubX-ScaledRadius*2)
    .attr("width",ScaledRadius*4)
    .attr("y",cell_count%2===0?MaxY-15:MaxY)
    .attr("height",0)
    .attr("stroke",Secondary)
    .attr("fill","#00000000")
    .attr("id",`LayerBoundingBox_Dense_${Index}`)
    .transition()
      .duration(5000)
      .attr("height",(MinY-MaxY)+15)
    Group.on("click",(e:any)=>{ClickHandler(e,LayerBooleanReference)})

  for(let N = 1; N<=cell_count; N++){
    const SubY = N%2===0 ? Height/2-YFunc(N*10) : Height/2+YFunc(N*10);
    Group.append("circle")
    .attr("cx",SubX)
    .attr("cy",SubY)
    .attr("r",0)
    .attr("stroke",DropoutArray[N]?Primary:Secondary)
    .attr("fill",DropoutArray[N]?Secondary:Primary)
    .attr("id",DropoutArray[N]?`Dropout_${Index}_${N}`:`Dense_${Index}_${N}`)
    .transition()
      .duration(1000*Index)
      .attr("r",ScaledRadius)
  }
}


export function Draw1DConv(
  Group:d3.Selection<SVGGElement, unknown, null, undefined>,
  YFunc:d3.ScaleLinear<number, number, never>,
  SubX:number,
  LayerShape:number,
  KernelSize:number,
  Dilation:number,
  Stride:number,
  Padding:number,
  Index:number,
  Primary:string,
  Secondary:string,
  ScaledSize:number,
  Height:number,
  LayerBooleanReference:boolean[],
  ClickHandler:(e:any,boolref:boolean[])=>void
):void{
  const KernelModifier = YFunc((KernelSize+1)*5);
  const MinY = Height-YFunc(5);
  const MaxY = Height-KernelModifier;
  const YStart = Height-YFunc((LayerShape+1)*5);

  Group.on("mouseover",null).on("mouseout",null)
  Group.append("rect")
    .attr("x",SubX-ScaledSize*2)
    .attr("width",ScaledSize*14)
    .attr("y",YStart)
    .attr("height",0)
    .attr("stroke",Secondary)
    .attr("fill","#00000000")
    .attr("id",`LayerBoundingBox_Dense_${Index}`)
    .transition()
      .duration(5000)
      .attr("height",MinY-(YStart-10))
    Group.on("click",(e:any)=>{ClickHandler(e,LayerBooleanReference)})

  const BaseDuration = 1000*Index;
  for(let N = 1; N<=LayerShape; N++){//Convolution base
    const SubY = Height-YFunc(N*5);
    Group.append("rect")
      .attr("x",SubX)
      .attr("y",SubY)
      .attr('height',0)
      .attr('width',0)
      .attr("stroke",Secondary)
      .attr("fill",Primary)
      .attr("id",`Conv1D_${Index}_${N}`)
      .transition()
        .duration(BaseDuration)
        .attr("width",ScaledSize)
        .attr("height",ScaledSize)
  }
  //draw triangle from kernel start-end to start of featuremap

  Group.append("line")
    .attr("x1",SubX+5)
    .attr("x2",SubX)
    .attr("y1",MaxY+KernelModifier)
    .attr("y2",MinY+5)
    .attr("stroke",Secondary)
    .transition()
      .duration(BaseDuration+50)
      .attr("x2",SubX+50);
  
  Group.append("line")
    .attr("x1",SubX+5)
    .attr("x2",SubX)
    .attr("y1",MaxY+5)
    .attr("y2",MinY)
    .attr("stroke",Secondary)
    .transition()
      .duration(BaseDuration+50)
      .attr("x2",SubX+50);

  const FeatureMapShape = Math.round((LayerShape-KernelSize+2*(Padding-Dilation))/Stride)+1;
  for(let N = 1; N<=FeatureMapShape+1; N++){//kernel is displayed at the top 
    const SubY = Height-YFunc(N*5);
    Group.append("rect")
      .attr("x",SubX+50)
      .attr("y",SubY)
      .attr('height',0)
      .attr('width',0)
      .attr("stroke",Secondary)
      .attr("fill",Primary)
      .attr("id",`Conv1D_Kernel_${Index}_${N}`)
      .transition()
        .duration(BaseDuration)
        .attr("width",ScaledSize)
        .attr("height",ScaledSize)
  }
  //draw featuremap
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