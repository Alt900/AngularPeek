import {
  Component,
  Input,
  ViewChild,
  ElementRef,
  SimpleChanges,
  OnInit,
  HostListener
} from '@angular/core';

import {
  AccLossPlot, 
  MultivariateChart, 
  DrawLSTMCell, 
  Draw1DConv,
  DrawLSTMLayer, 
  DrawDenseLayer,
  DrawConnectionLines,
} from '../Charts';

import { CommonModule } from '@angular/common';
import {ReactiveFormsModule, FormsModule} from '@angular/forms';

import {provideNativeDateAdapter} from '@angular/material/core';

import {MatButtonModule} from '@angular/material/button';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatListModule} from '@angular/material/list';

import { Utils } from '../utils';

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

interface DynamicInterface{[key:string]:any;}

@Component({
  selector: 'app-interactive-architecture',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    FormsModule,
    MatButtonModule,
    MatListModule,
    MatDatepickerModule,
    MatCheckboxModule
  ],
  providers:[provideNativeDateAdapter()],
  templateUrl: './interactive-architecture.component.html',
  styleUrl: './interactive-architecture.component.scss'
})
export class InteractiveArchitectureComponent{
  @Input() Primary!:string;
  @Input() Secondary!:string;
  @Input() AvailableTickers:string[]=["NULL"];
  
  LayerArgs:DynamicInterface[]=[];
  LayerBooleans:boolean[]=[];
  TempTicker:string="";
  TickersToDownload:string[]=[];
  SelectedEndDate!:Date;
  SelectedStartDate!:Date;
  SelectedInterval:string="1H";
  Overwrite:boolean=false;

  Hyperparameters:DynamicInterface={
    normalization:"Logarithmic",
    variables:["open"],
    ticker:this.AvailableTickers[0],
    optimizer:"Adam",
    batch_size:32,
    window_size:5,
    epochs:100,
    learning_rate:0.001,
    train_ratio:0.7,
    test_ratio:0.2,
    validation_ratio:0.1,
    prediction_steps:10,
  };

  HyperparameterKeys:string[]=Object.keys(this.Hyperparameters);
  LSTMKeys:string[]=['cell_count','dropout','activation','layertype']
  CNNKeys:string[]=['cell_count','kernel_size','filters','stride','padding','dilation','activation','layertype']

  PredictionData:PredictionData={Accuracy:[[]],Loss:[[]],Prediction:[]};
  SelectedSetting:string="Null";

  isTraining:boolean = false;

  Height:number = 0;
  Width:number = 0;
  viewBox = { x: 0, y: 0, width: 800, height: 600 };

  ArchSVG!:SVGSVGElement;
  D3SVG!:d3.Selection<SVGSVGElement, unknown, null, undefined>;

  @ViewChild('ArchSVGContainer', { static: true }) SVGReference!: ElementRef<SVGSVGElement>;
  @ViewChild('ArchContainer',{static:true}) DivReference!: ElementRef<any>;

  SettingOptions:string[]=[
    "General hyperparameters",
    "Layer hyperparameters",
    "Layer control",
    "Graphs"
  ];

  GraphOptions:string[] = [
    "Accuracy",
    "Loss",
    "Prediction",
    "Architecture"
  ];

  LayerOptions:string[] = [
    "LSTM Unidirectional",
    "Dense",
    "1D Convolution",
    "1D Pooling",//pooling type dictated by pooltype string dropdown 
  ];
  
  ActivationOptions:string[] = [
    "None",
    "ELU",
    "Hardshrink",
    "Hardsigmoid",
    "Hardtanh",
    "Hardswish",
    "LeakyReLU",
    "LogSigmoid",
    "PReLU",
    "ReLU",
    "ReLU6",
    "RReLU",
    "SELU",
    "CELU",
    "GELU",
    "Sigmoid",
    "SiLU",
    "Mish",
    "Softplus",
    "Softshrink",
    "Softsign",
    "Tanh",
    "Tanhshrink",
    "Threshold",
    "GLU"
  ];

  Optimizers:string[]=[
    "Adadelta",
    "Adafactor",
    "Adagrad",
    "Adam",
    "AdamW",
    "SparseAdam",
    "Adamax",
    "ASGD",
    "LBFGS",
    "NAdam",
    "RAdam",
    "RMSprop",
    "Rprop",
    "SGD"
  ]

  IntervalOptions:DynamicInterface[]=[
    {value:"1m",label:"1 Minute"},
    {value:"2m",label:"2 Minutes"},
    {value:"5m",label:"5 Minutes"},
    {value:"15m",label:"15 Minutes"},
    {value:"30m",label:"30 Minutes"},
    {value:"1h",label:"1 Hour"},
    {value:"1d",label:"1 Day"},
    {value:"5d",label:"5 Days"},
    {value:"1wk",label:"1 Week"},
    {value:"1mo",label:"1 Month"},
    {value:"3mo",label:"3 Months"},
  ]

  DropdownDispatcher:DynamicInterface = {
    "normalization": ["Logarithmic","MinMax","Z_Score"],
    "variables": ["open","high","low","close","volume"],
    "ticker": this.AvailableTickers,
    "activation": this.ActivationOptions,
    "optimizer": this.Optimizers
  }

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

  async DownloadTickers():Promise<void>{
    const To = this.SelectedEndDate!==null?this.SelectedEndDate.toISOString().split('T')[0]:null;
    const From = this.SelectedStartDate!==null?this.SelectedStartDate.toISOString().split("T")[0]:null;
    Utils.FetchRoute(
      `DownloadData?Tickers=${this.TickersToDownload}&to=${To}&from=${From}&interval=${this.SelectedInterval}&overwrite=${this.Overwrite}`);
    this.AvailableTickers = [...new Set([...this.AvailableTickers,...this.TickersToDownload])];
    this.DropdownDispatcher = {...this.DropdownDispatcher,"ticker":this.AvailableTickers}
  }

  SetSettings(value:string):void{
    this.SelectedSetting=value;
  }

  SetTempTicker(e:Event):void{
    this.TempTicker=<string>(<HTMLInputElement>e.target).value;;
  }

  RemoveTicker():void{
    const Index:number = this.TickersToDownload.indexOf(this.TempTicker);
    this.TickersToDownload.splice(Index,1);
    this.TempTicker = "";
  }

  AddTicker():void{
    if(!this.TickersToDownload.includes(this.TempTicker)){
      this.TickersToDownload.push(this.TempTicker);
      this.TempTicker = "";
    }
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

  HandleHyperparamChange(e:Event,i:number):void{
    const key = this.HyperparameterKeys[i];
    this.Hyperparameters={...this.Hyperparameters,[key]:+<string>(<HTMLInputElement>e.target).value}
  }

  HandleChanges(event:Event,Index:number,key:string):void{//
    this.LayerArgs[Index] = {...this.LayerArgs[Index],[key]:+<string>(<HTMLInputElement>event.target).value}
    this.LayerArgs = [...this.LayerArgs];
  }

  RemoveLayer(i:number):void{
    this.LayerArgs = this.LayerArgs.filter((item:DynamicInterface)=>item!==this.LayerArgs[i]);
    this.LayerBooleans = this.LayerBooleans.filter((item:boolean)=>item!=this.LayerBooleans[i])
    this.CallArchitect();
  }

  OffsetX:number = 0;
  OffsetY:number = 0;
  Dragging:boolean = false;
  Draggable:HTMLElement|null = null;

  DraggableMouseDown(e:MouseEvent):void{
    const target = e.target as HTMLElement;
    if(target.className.split(" ")[0].split("_")[1]==="draggable"){
      this.Dragging=true;
      this.Draggable=target;
      this.OffsetX=e.clientX-this.Draggable.offsetLeft;
      this.OffsetY=e.clientY-this.Draggable.offsetTop;
      this.Draggable.style.cursor="grabbing";
    }
  }
  @HostListener('document:mousemove', ['$event'])
  DraggableMouseMove(e:MouseEvent):void{
    if(this.Dragging && this.Draggable){
      this.Draggable.style.left=`${e.clientX-this.OffsetX}px`
      this.Draggable.style.top=`${e.clientY-this.OffsetY}px`
    }
  }
  @HostListener('document:mouseup')
  DraggableMouseUp():void{
    this.Dragging=false;
    this.Draggable=null;
  }

  FlipPopBoolean(e:any|number,boolref:boolean[]):void{
    let i:number = 0;
    if(typeof e === "object"){
      i = +e.target.id.split("_")[2]
    } else {
      i = e
    }
    boolref[i]=!boolref[i]
  }

  AddLayer=(Layer:string):void=>{
    if (Layer === "LSTM Unidirectional" || Layer === "Dense"){
      this.LayerArgs=([...this.LayerArgs,{
        cell_count: 10,
        dropout:0,
        activation:"None",
        layertype:Layer
      }])
    } else if (Layer === "1D Convolution" || Layer === "1D Pooling"){
      this.LayerArgs=([...this.LayerArgs,{
        cell_count:12,
        kernel_size:3,
        filters:16,
        dilation:0,
        stride:1,
        padding:0,
        activation:"None",
        layertype:Layer
      }])
    }
    this.LayerBooleans.push(false);//for layer pop-ups
    this.CallArchitect();
  }

  CalculateLeft(i:number,modifier?:number):string{return `${i*(modifier===undefined?1:modifier)}%`}
  CalculateTop(i:number,modifier?:number):string{return `${i*(modifier===undefined?1:modifier)}%`}

  SetGraph(chosen:string):void{
    this.D3SVG.call(this.zoomHandler.transform as any,d3.zoomIdentity);
    d3.selectAll("svg > *").remove();
    this.D3SVG.on('mouseover',null).on('mouseout',null);
    this.D3SVG = d3.select(this.SVGReference.nativeElement)
      .attr("viewBox",[0,0,this.Width,this.Height])

    if(chosen === "Loss" || chosen === "Accuracy"){
      this.D3SVG.call(d3.zoom<SVGSVGElement,unknown>().on("zoom",null));
      const Data = chosen==="Accuracy"?this.PredictionData.Accuracy:this.PredictionData.Loss;

      this.D3SVG.on('mouseout',(e:any)=>{this.MouseOutNavigation(e,this.D3SVG)})

      //python attach acc/loss colorscheme to 

      AccLossPlot(
        this.D3SVG,
        Data,
        this.Width,
        this.Height,
        ["orange","red"],
        ["train","test"],
        100,
      )
    } else if(chosen === "SVG"){
      //
      this.D3SVG.call(this.zoomHandler.transform as any,d3.zoomIdentity);
      this.D3SVG.on('mousemove',null);
      this.CallArchitect();

    } else {
      //
      this.D3SVG.call(this.zoomHandler.transform as any,d3.zoomIdentity);
      this.D3SVG.on('mouseover',null).on('mouseout',null);
      const Dates = this.PredictionData?.Prediction.map(d=>this.DateFormat(d["timestamp"]))
      const X:d3.ScaleBand<string> = d3.scaleBand().domain(Dates?Dates:[]).range([0,this.Width]); 
      const Data:number[][] = [];
      this.Hyperparameters["variables"].forEach(()=>Data.push([]));
      this.PredictionData.Prediction.forEach((obj:DataStructure)=>{
        this.Hyperparameters["variables"].forEach((key:string,index:number)=>{
          Data[index].push(obj[key as keyof DataStructure] as number)
        })
      });
      const Colors:string[][] = this.PredictionData.Prediction.map((d:DataStructure)=>d.colorscheme);
      console.log(Colors)
      MultivariateChart(
        this.D3SVG,
        Data,
        this.Width,
        this.Height,
        [Colors[0],Colors[Colors.length-1]],
        this.Hyperparameters["variables"],
        Math.log(Data[0].length),
        this.Hyperparameters["prediction_steps"]
        )
      }
  }

  ngOnChanges(changes:SimpleChanges):void{
    if(changes['isTraining']){

      this.AnimateTraining(Math.round(this.LayerArgs.length*1.15));

    }if(changes['AvailableTickers']){
      this.DropdownDispatcher["ticker"]=this.AvailableTickers
      this.HyperparameterKeys=[...this.HyperparameterKeys];//trigger re-render
    }
  }

  async BuildRunArch():Promise<void>{
    this.isTraining=true;
    const ParameterizedRoute:string = `CreateModel?Hyperparams=${JSON.stringify(this.Hyperparameters)}&LayerArgs=${JSON.stringify(this.LayerArgs)}`;
    this.PredictionData = await Utils.FetchRoute(ParameterizedRoute);
    this.isTraining=false;
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

  private SVG_Renderer(
    Y:d3.ScaleLinear<number, number, never>,
    X:d3.ScaleLinear<number,number,never>,
    Index:number,
    CurrentLayer:DynamicInterface,
    PreviousLayer:DynamicInterface|null//if the first layer is the only layer this will be null
  ):void{
    //perform X and Y axis coordinate calculations for each 
    const ScaledSize:number = Y(5);
    const SubX:number = X(Index*100);
    const H:number = this.Height
    const PColor:string = this.Primary;
    const SColor:string = this.Secondary;

    const Group:d3.Selection<SVGGElement, unknown, null, undefined> = this.D3SVG.append("g").attr("class",`group-${Index}`)
    
    const L1_Type:string = CurrentLayer['layertype'];
    const L1_Dropout:boolean[]=[];
    if(L1_Type==='LSTM Unidirectional' || L1_Type==='Dense'){
      for(let i = 0; i<CurrentLayer['cell_count']; i++){
        L1_Dropout.push(Math.random()<CurrentLayer['dropout']);
      }
    }

    function GuassianMouseOver(e:any):void{
      if(e.target.id.split("_")[0]==="LayerBoundingBox"){
        d3.select('svg').append("defs")
        const TemporaryFilter = d3.select("#LayerBoundingBox")
        TemporaryFilter.append("filter")
          .attr("id","TemporaryFilter")
          .append("feGaussianBlur")
          .attr("in","SourceGraphic")
          .attr("stdDeviation",0)
          .attr("id","TempGaussian");
        d3.select("#TempGaussian")
          .transition()
          .duration(2000)
          .attr("stdDeviation",10)
      }
    }

    function GaussianMouseOut(e:any):void{
      if(e.target.id.split("_")[0]==="LayerBoundingBox"){
        d3.select("#LayerBoundingBox").remove()
      }
    }

    const Dispatcher:DynamicInterface={
      "LSTM Unidirectional":DrawLSTMLayer,
      "Dense":DrawDenseLayer,
      "1D Convolution":Draw1DConv,
      "1D Pooling":Draw1DConv
    }

    const Args:any[]={
      "LSTM Unidirectional":[
        Group,
        Y,
        H,
        SubX,
        CurrentLayer['cell_count'],
        Index,
        PColor,
        SColor,
        ScaledSize,
        L1_Dropout,
        GuassianMouseOver,
        GaussianMouseOut,
        this.LayerBooleans,//had to pass the reference to this variable so its not lost in D3
        this.FlipPopBoolean
      ],
      "Dense":[
        Group,
        Y,
        SubX,
        CurrentLayer['cell_count'],
        PColor,
        SColor,
        Index,
        ScaledSize,
        H,
        L1_Dropout,
        this.LayerBooleans,
        this.FlipPopBoolean
      ],
      "1D Convolution":[
        Group,
        Y,
        SubX,
        CurrentLayer['cell_count'],
        CurrentLayer['kernel_size'],
        CurrentLayer['dilation'],
        CurrentLayer['stride'],
        CurrentLayer['padding'],
        Index,
        PColor,
        SColor,
        ScaledSize,
        H/2,
        this.LayerBooleans,
        this.FlipPopBoolean
      ],
      "1D Pooling":[
        Group,
        Y,
        SubX,
        CurrentLayer['cell_count'],
        CurrentLayer['kernel_size'],
        CurrentLayer['dilation'],
        CurrentLayer['stride'],
        CurrentLayer['padding'],
        Index,
        PColor,
        SColor,
        ScaledSize,
        H/2,
        this.LayerBooleans,
        this.FlipPopBoolean
      ]
    }[L1_Type] as any[];//never undefined

    //draw connection lines if there is a previous layer
    if(PreviousLayer!==null){

      const L2_Type:string = PreviousLayer['layertype'];
      const L1_Oscillation:boolean = L1_Type==='1D Convolution'||L1_Type==='1D Pooling'?false:true;
      const L2_Oscillation:boolean = L2_Type==='1D Convolution'||L2_Type==='1D Pooling'?false:true;
      //draw connection lines 
      DrawConnectionLines(
        Group,
        Y,
        L2_Type==="1D Convolution"||L2_Type==="1D Pooling"?SubX-45:SubX-97,
        L2_Type==="LSTM Unidirectional"||L2_Type==="Dense"?PreviousLayer['cell_count']:Math.round((PreviousLayer['cell_count']-PreviousLayer['kernel_size']+2*(PreviousLayer['padding']-PreviousLayer['dilation']))/PreviousLayer['stride'])+1,
        CurrentLayer['cell_count'],
        H,
        SubX,
        L1_Type==="LSTM Unidirectional"||L1_Type==="Dense"?L1_Dropout:[],
        SColor,
        Index,
        L2_Oscillation,
        L1_Oscillation
      )
    }
    //draw layer 1
    Dispatcher[L1_Type](...Args);
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
      
    this.LayerArgs.forEach((Layer:DynamicInterface,Index:number)=>{
      this.SVG_Renderer(X,Y,Index,Layer,Index>=1?this.LayerArgs[Index-1]:null);
    })
  }
}