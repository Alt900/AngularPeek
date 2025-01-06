import {
  Component,
  Input,
  ViewChild,
  ElementRef,
  SimpleChanges,
  OnInit
} from '@angular/core';
import {AccLossPlot, CandleStick, DrawLSTMCell} from '../Charts'
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

interface PredictionData{
  Accuracy: number[][],
  Loss: number[][],
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
  @Input() PredictionData:PredictionData={Accuracy:[[]],Loss:[[]],Prediction:[]};
  @Input() ChosenVariables:string[] = [];

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

  private zoomHandler = d3.zoom()
    .on("zoom",(e:any)=>{
      d3.selectAll("g").attr("transform",e.transform)
    })

  MouseOutNavigation(e:any,SVG:d3.Selection<SVGSVGElement, unknown, null, undefined>):void{
    if(e.target.id!=="SVGContainer"){
      SVG.selectAll("#NavigationCircle").remove();
      SVG.selectAll("#NavigationText").remove();
    }
  }

  ngOnChanges(changes:SimpleChanges):void{
    if(changes['Architecture'] || changes['LayerArgs']){
      this.CallArchitect();

    } else if(changes['isTraining']){

      this.AnimateTraining(Math.round(this.Architecture[0].nodes*1.15));

    } else if (changes['SelectedGraph']){
      //
      this.D3SVG.call(this.zoomHandler.transform as any,d3.zoomIdentity);
      d3.selectAll("svg > *").remove();
      this.D3SVG.on('mouseover',null).on('mouseout',null);
      if(this.SelectedGraph == 0 || this.SelectedGraph == 1){
        this.D3SVG.call(d3.zoom<SVGSVGElement,unknown>().on("zoom",null));
        const Data = this.SelectedGraph==0?this.PredictionData.Accuracy:this.PredictionData.Loss;

        this.D3SVG.on('mouseout',(e:any)=>{this.MouseOutNavigation(e,this.D3SVG)})

        AccLossPlot(
          this.D3SVG,
          Data,
          this.Width,
          this.Height,
          ["orange","red"],
          ["train","test"],
          100
        )
      } else if(this.SelectedGraph == 3){
        //
        this.D3SVG.call(this.zoomHandler.transform as any,d3.zoomIdentity);
        this.D3SVG.on('mousemove',null);
        this.CallArchitect();

      } else {
        //
        this.D3SVG.call(this.zoomHandler.transform as any,d3.zoomIdentity);
        this.D3SVG.on('mouseover',null).on('mouseout',null);
        const Dates = this.PredictionData?.Prediction.map(d=>this.DateFormat(d["timestamp"]))
        const X:d3.ScaleBand<string> = d3.scaleBand().domain(Dates?Dates:[]).range([this.Margins[3],this.Width-this.Margins[2]]); 

        if(["open","high","low","close"].every((key:string)=>key in this.PredictionData.Prediction[0])){

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

        } else {

          const Data:number[][] = [];
          this.ChosenVariables.forEach(()=>Data.push([]));
          this.PredictionData.Prediction.forEach((obj:DataStructure)=>{
            this.ChosenVariables.forEach((key:string,index:number)=>{
              Data[index].push(obj[key as keyof DataStructure] as number)
            })
          });
          console.log(Data)
          AccLossPlot(
            this.D3SVG,
            Data,
            this.Width,
            this.Height,
            this.PredictionData.Prediction[this.PredictionData.Prediction.length-1].colorscheme,
            this.ChosenVariables,
            Math.log(Data[0].length)
          )
        }
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

  MouseClick(e:any):void{
    const ID = e.target.id
    const Constituent_IDs:string[] = ID.split("_");
    const LayerType = Constituent_IDs[0];
    if(LayerType==="LSTM"){
      //clear on-screen SVG, remove listeners, and reset viewbox
      d3.selectAll("svg > *").remove();
      this.D3SVG.on('mouseover',null).on('mouseout',null);
      //call LSTM cell draw
      DrawLSTMCell(this.D3SVG,this.Width,this.Height);
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

    

      this.D3SVG = d3.select(this.SVGReference.nativeElement)
        .attr("id","SVGContainer")
        .attr("viewBox",[0,0,this.Width,this.Height])
        .on('mouseover',MouseOver)
        .on('mouseout',MouseOut)
        .on('click',(e:any)=>this.MouseClick(e))
        .call(dragHandler)
        .call(this.zoomHandler as any)
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