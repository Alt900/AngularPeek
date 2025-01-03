import {
  Component,
  Input,
  ViewChild,
  ElementRef,
  SimpleChanges,
  OnInit
} from '@angular/core';
import {AccLossPlot, CandleStick} from '../Charts'
import * as d3 from 'd3';

interface DataStructure {
  close:number;
  high:number;
  low:number;
  open:number
  timestamp:string;
  volume:number; 
  colorscheme?:string;
}

interface PredictionData{
  Accuracy: number[][],
  Loss: number[][],
  PreData:DataStructure[],
  Prediction:DataStructure[]
}

interface ArchitectureRect{
  x:number,
  nodes:number,//cell count
  n_1_nodes:number,//n+1 cell count
  LayerType:string,
  activation:string,
  weights:number[],
  bias:number,
}

interface LayerArguments{
  cell_count:number,
  dropout:number,
  layer_type:string
}

@Component({
  selector: 'app-interactive-architecture',
  imports: [],
  templateUrl: './interactive-architecture.component.html',
  styleUrl: './interactive-architecture.component.scss'
})
export class InteractiveArchitectureComponent{
  @Input() Primary!:string;
  @Input() Secondary!:string;
  @Input() Architecture:ArchitectureRect[]=[];
  @Input() LayerArgs!:LayerArguments[];
  @Input() isTraining!:boolean;
  @Input() SelectedGraph!:number;
  @Input() PredictionData:PredictionData={Accuracy:[[]],Loss:[[]],PreData:[],Prediction:[]};

  Height:number = 0;
  Width:number = 0;
  viewBox = { x: 0, y: 0, width: 800, height: 600 };
  protected Margins:number[]=[20,30,30,40];

  ArchSVG!:SVGSVGElement;
  D3SVG!:d3.Selection<SVGSVGElement, unknown, null, undefined>;

  @ViewChild('ArchSVGContainer', { static: true }) SVGReference!: ElementRef<SVGSVGElement>;
  @ViewChild('ArchContainer',{static:true}) DivReference!: ElementRef<any>;

  ngOnInit():void{
    const ParentDiv = this.DivReference.nativeElement;
    const Rect = ParentDiv.getBoundingClientRect();
    this.Width = Rect.width;
    this.Height = Rect.height;
    this.ArchSVG = this.SVGReference.nativeElement;
    this.CallArchitect();
  }

  private DateFormat(d:string):string{
    const DateObj = new Date(d);
    return DateObj.toLocaleDateString('en-US',{
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).replace(',',' :')
  }

  ngOnChanges(changes:SimpleChanges):void{
    if(changes['Primary'] || changes['Secondary'] || changes['Architecture'] || changes['LayerArgs']){
      this.CallArchitect();
    } else if(changes['isTraining']){
      this.AnimateTraining(Math.round(this.Architecture[0].nodes*1.15));
    } else if (changes['SelectedGraph']){
      d3.selectAll("svg > *").remove();
      this.D3SVG.on('mouseover',null).on('mouseout',null);
      if(this.SelectedGraph == 0 || this.SelectedGraph == 1){
        AccLossPlot(
          this.D3SVG,
          this.SelectedGraph==0?this.PredictionData.Accuracy:this.PredictionData.Loss,
          this.Width,
          this.Height
        )
      } else if(this.SelectedGraph == 3){
        this.CallArchitect();
      } else {
        d3.selectAll("svg > *").remove();
        this.D3SVG.on('mouseover',null).on('mouseout',null);
        const Dates = this.PredictionData?.Prediction.map(d=>this.DateFormat(d["timestamp"]))
        const X:d3.ScaleBand<string> = d3.scaleBand().domain(Dates?Dates:[]).range([this.Margins[3],this.Width-this.Margins[2]]); 
        const Min = Math.min(...this.PredictionData.Prediction.map((d:DataStructure)=>d.low))
        const Max = Math.max(...this.PredictionData.Prediction.map((d:DataStructure)=>d.high))
        const Y:d3.ScaleLogarithmic<number, number, never> = 
        d3.scaleLog()
          .domain([Min,Max])
          .rangeRound([this.Height - this.Margins[1], this.Margins[0]]);

        function HandleZoom(e:any):void{
          const {x,k} = e.transform;
          d3.select(e.target).attr("transform",`translate(${x},0) scale(${k},1)`)
        }
        
        this.D3SVG = d3.select(this.SVGReference.nativeElement)
          .attr("viewBox",[0,0,this.Width,this.Height])
          .call(d3.zoom<SVGSVGElement,unknown>().on("zoom",(e:any)=>HandleZoom(e)))
        
        CandleStick(
          X,
          Y,
          this.PredictionData.Prediction,
          this.D3SVG,
          this.Height,
          this.Width,
          this.Margins,
          Dates
        )
      }
    }
  }

  async AnimateTraining(N:number):Promise<void>{
    const primarycolor = this.Primary;
    const secondarycolor = this.Secondary;

    const lines = d3.selectAll("line").nodes();
    const circles = d3.selectAll("circle").nodes();
    const rects = d3.selectAll("rect").nodes();
    while(this.isTraining){
      const RandomLines = d3.shuffle(lines as any).slice(0,N);
      const RandomCircles = d3.shuffle(circles as any).slice(0,N);
      const RandomRects = d3.shuffle(rects as any).slice(0,N);
      const _1 = async () => {
        RandomLines.forEach((e:any)=>{
          d3.select(e).attr("stroke",primarycolor).attr("fill",secondarycolor)
        })
      }
      const _2 = async () => {
        RandomCircles.forEach((e:any)=>{
          d3.select(e).attr("stroke",primarycolor).attr("fill",secondarycolor)
        })
      }
      const _3 = async () => {
        RandomRects.forEach((e:any)=>{
          d3.select(e).attr("stroke",primarycolor).attr("fill",secondarycolor)
        })
      }

      await Promise.all([_1(),_2(),_3()]);
      await new Promise(r => setTimeout(r, 300));

      const _4 = async () => {
        RandomLines.forEach((e:any)=>{
          d3.select(e).attr("stroke",secondarycolor).attr("fill",primarycolor)
        })
      }
      const _5 = async () => {
        RandomCircles.forEach((e:any)=>{
          d3.select(e).attr("stroke",secondarycolor).attr("fill",primarycolor)
        })
      }
      const _6 = async () => {
        RandomRects.forEach((e:any)=>{
          d3.select(e).attr("stroke",secondarycolor).attr("fill",primarycolor)
        })
      }

      await Promise.all([_4(),_5(),_6()]);
      await new Promise(r => setTimeout(r, 200));
    }
  }

  private DrawLSTM():void{
    const X = d3.scaleLinear().domain(Array.from({length:this.Width},(_:any,i:number)=>i))
    const Y = d3.scaleLinear().domain(Array.from({length:this.Height},(_:any,i:number)=>i))
    const primarycolor = this.Primary;
    const secondarycolor = this.Secondary;
    const Group = this.D3SVG.append("g").attr("class","LSTM cell");
    const H = Y(this.Height);
    const W = X(this.Width);

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
      .attr("stroke",primarycolor)
      .attr("fill",secondarycolor)
      .transition()
        .duration(1000)
        .attr("width",W*.05)
        .attr("height",H*.05);

      Group.append("text")
      .attr("x",HWCalc[i]+10)
      .attr("y",HWCalc[1]+(H*.05)/2)
      .attr("dy", ".35em")
      .attr("dx",".5em")
      .attr("color",primarycolor)
      .attr("stroke",primarycolor)
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
      .attr("stroke",primarycolor)
      .attr("fill",secondarycolor)
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
      .attr("color",primarycolor)
      .attr("stroke",primarycolor)
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
      .attr("color",secondarycolor)
      .attr("stroke",secondarycolor)
      .style("font-size","30px")
      .text("+");

      Group.append("rect")
        .attr("id","EscapeLSTM")
        .attr("x",W*.7)
        .attr("y",H*.3)
        .attr("height",0)
        .attr("width",0)
        .attr("stroke",primarycolor)
        .attr("fill",secondarycolor)
        .transition()
          .duration(1000)
          .attr("width",W*.05)
          .attr("height",H*.05);

      Group.append("text")
        .attr("x",W*.7+((W*.05)/2))
        .attr("y",H*.3+30)
        .attr("dx","-1.5em")
        .attr("color",primarycolor)
        .attr("stroke",primarycolor)
        .text("Exit")
      //initial cell state
      Group.append("rect")
        .attr("x",W*.05)
        .attr("y",H*.48)
        .attr("height",0)
        .attr("width",0)
        .attr("stroke",primarycolor)
        .attr("fill",secondarycolor)
        .transition()
          .duration(1000)
          .attr("width",W*.05)
          .attr("height",H*.05);

      Group.append("text")
        .attr("x",W*.05+((W*.05)/2))
        .attr("y",H*.48+30)
        .attr("dx","-2em")
        .attr("color",primarycolor)
        .attr("stroke",primarycolor)
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
        .attr("stroke",primarycolor)
        .attr("fill",secondarycolor)
        .transition()
          .duration(1000)
          .attr("width",W*.05)
          .attr("height",H*.05);

      Group.append("text")
        .attr("x",W*.05+((W*.05)/2))
        .attr("y",HWCalc[0]+10)
        .attr("dx","-3em")
        .style("font-size","12px")
        .attr("color",primarycolor)
        .attr("stroke",primarycolor)
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
        .attr("stroke",primarycolor)
        .attr("fill",secondarycolor)
        .transition()
          .duration(1000)
          .attr("width",W*.05)
          .attr("height",H*.05);

      Group.append("text")
        .attr("x",W*.7+((W*.05)/2))
        .attr("y",H*.48+30)
        .attr("dx","-2em")
        .attr("color",primarycolor)
        .attr("stroke",primarycolor)
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
        .attr("stroke",primarycolor)
        .attr("fill",secondarycolor)
        .transition()
          .duration(1000)
          .attr("width",W*.05)
          .attr("height",H*.05);

      Group.append("text")
        .attr("x",W*.7+((W*.05)/2))
        .attr("y",HWCalc[0]+10)
        .attr("dx","-3em")
        .style("font-size","12px")
        .attr("color",primarycolor)
        .attr("stroke",primarycolor)
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

  MouseClick(e:any):void{
    const ID = e.target.id
    const Constituent_IDs:string[] = ID.split("_");
    const LayerType = Constituent_IDs[0];
    if(LayerType==="LSTM"){
      //clear on-screen SVG, remove listeners, and reset viewbox
      d3.selectAll("svg > *").remove();
      this.D3SVG.on('mouseover',null).on('mouseout',null);
      //call LSTM cell draw
      this.DrawLSTM();
    } else if(ID==="EscapeLSTM"){
      //clear SVG
      d3.selectAll("svg > *").remove();
      //re-draw
      this.CallArchitect();
    }
  }

  private CallArchitect():void{
    
    d3.selectAll("svg > *").remove();
    const X = d3.scaleLinear().domain(Array.from({length:this.Width},(_:any,i:number)=>i))
    const Y = d3.scaleLinear().domain(Array.from({length:this.Height},(_:any,i:number)=>i))
    const primarycolor = this.Primary;
    const secondarycolor = this.Secondary;

    function MouseOver(e:any):void{
      if(e.target.id!=="SVGContainer" || e.target.id.split("_")[0]!=="Dropout"){
        d3.select(e.target)
          .attr("fill",secondarycolor)
          .attr("stroke",primarycolor)
      }
    }

    function MouseOut(e:any):void{
      if(e.target.id.split("_")[0]!=="Dropout"){
        d3.select(e.target)
          .attr("fill",primarycolor)
          .attr("stroke",secondarycolor)
      }
    }

    const dragHandler: d3.DragBehavior<SVGSVGElement, unknown, unknown> = d3.drag<SVGSVGElement, unknown>();

    dragHandler
      .on("start",(_:any)=>{})
      .on("drag",(e:any)=>{
        this.viewBox.x -= e.dx;
        this.viewBox.y -= e.dy;
        this.D3SVG.attr('viewBox',`${this.viewBox.x} ${this.viewBox.y} ${this.Width} ${this.Height}`);
      })
      .on("end",(_:any)=>{})

    const zoomHandler = d3.zoom()
      .on("zoom",(e:any)=>{
        d3.selectAll("g").attr("transform",e.transform)
      })

      this.D3SVG = d3.select(this.SVGReference.nativeElement)
        .attr("id","SVGContainer")
        .attr("viewBox",[0,0,this.Width,this.Height])
        .on('mouseover',MouseOver)
        .on('mouseout',MouseOut)
        .on('click',(e:any)=>this.MouseClick(e))
        .call(dragHandler)
        .call(zoomHandler as any)
      const defs = this.D3SVG.append("defs");
      const filter = defs.append("filter").attr("id","glow");
      filter.append("feGaussianBlur")
        .attr("stdDeviation",4)
        .attr("result","coloredBlur");
      filter.append("feMerge")
        .selectAll("feMergeNode")
        .data(["coloredBlur","coloredBlur","SourceGraphic"])
        .enter()
        .append("feMergeNode")
        .attr("in",(d:any)=>d);
      this.D3SVG.attr("filter","url(#glow)")

    const ScaledRadius = Y(5);
    this.Architecture.forEach((Layer:ArchitectureRect,Index:number)=>{
        const DropoutArray:boolean[] = [];
        for(let i = 0; i<this.LayerArgs[Index].cell_count; i++){
          DropoutArray.push(Math.random()<this.LayerArgs[Index].dropout);
        }
      
      const SubX = X(Layer.x)
      const Group = this.D3SVG.append("g")
        .attr("class",`group-${Index}`)

      for(let N=1; N<=this.LayerArgs[Index].cell_count+1; N++){
        const SubY = N%2===0 ? this.Height/2-Y(N*10) : this.Height/2+Y(N*10);
        if(this.Architecture[Index+1]){
          const NextX = X(this.Architecture[Index+1].x);
          for(let NNode = 1; NNode <= this.LayerArgs[Index+1].cell_count+1; NNode++){
            const TargetY = NNode%2===0?this.Height/2-Y(NNode*10):this.Height/2+Y(NNode*10);
            if(!DropoutArray[N]){
              Group.append("line")
              .attr("x1",SubX)
              .attr("x2",SubX)
              .attr("y1",SubY)
              .attr("y2",SubY)
              .attr("stroke",this.Secondary)
              .attr("stroke-width",.2)
              .transition()
                .duration(1000*Index)
                .attr("x2",NextX)
                .attr("y2",TargetY);
            }
          }
        }
        if (Layer.LayerType==="LSTM Unidirectional"){
          const ScaledSize = Y(5)
          Group.append("rect")
          .attr("x",SubX-ScaledSize/2)
          .attr("y",SubY-ScaledSize/2)
          .attr("height",0)
          .attr("width",0)
          .attr("stroke",DropoutArray[N]?this.Primary:this.Secondary)
          .attr("fill",DropoutArray[N]?this.Secondary:this.Primary)
          .attr("id",DropoutArray[N]?`Dropout_${Index}_${N}`:`LSTM_${Index}_${N}`)
          .transition()
            .duration(1000*Index)
            .attr("width",ScaledSize)
            .attr("height",ScaledSize)
        } else if (Layer.LayerType==="Dense"){
          Group.append("circle")
          .attr("cx",SubX)
          .attr("cy",SubY)
          .attr("r",0)
          .attr("stroke",DropoutArray[N]?this.Primary:this.Secondary)
          .attr("fill",DropoutArray[N]?this.Secondary:this.Primary)
          .attr("id",DropoutArray[N]?`Dropout_${Index}_${N}`:`Dense_${Index}_${N}`)
          .transition()
            .duration(1000*Index)
            .attr("r",ScaledRadius)
        }
      }
    })
  }
}