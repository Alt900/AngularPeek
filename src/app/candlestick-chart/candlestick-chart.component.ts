import { 
  Component,
  Input,
  ElementRef,
  ViewChild,
  AfterViewInit,
  SimpleChanges,
} from '@angular/core';
import {CandleStick} from '../Charts'
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

@Component({
  selector: 'app-candlestick-chart',
  standalone: true,
  imports: [],
  templateUrl: './candlestick-chart.component.html',
  styleUrls: ['./candlestick-chart.component.scss']
})

export class CandlestickChartComponent implements AfterViewInit{
  Height:number = 0;
  Width:number = 0;
  Margins:number[]=[20,30,30,40]
  sleep:Function = (ms: number) => new Promise((r) => setTimeout(r, ms));

  ChartSVG!:d3.Selection<SVGSVGElement, unknown, null, undefined>;

  @Input()Data:DataStructure[]=[];

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
    if(changes['Data'] && changes['Data'].currentValue.length>0){
      const Dates:string[] = this.Data.map(d=>this.DateFormat(d.timestamp));
      const X:d3.ScaleBand<string> = d3
        .scaleBand()
        .domain(Dates)
        .range([this.Margins[3],this.Width-this.Margins[2]]); 
  
      const Y:d3.ScaleLogarithmic<number, number, never> = d3
        .scaleLog()
        .domain([d3.min(this.Data,(d:DataStructure)=>d.low),d3.max(this.Data,(d:any)=>d.high)] as [number,number])
        .rangeRound([this.Height - this.Margins[1], this.Margins[0]]);
      d3.selectAll("svg > *").remove();

      function HandleZoom(e:any):void{
        const {x,k} = e.transform;
        d3.select(e.target).attr("transform",`translate(${x},0) scale(${k},1)`)
      }
      
      this.ChartSVG = d3.select(this.SVGReference.nativeElement)
        .attr("viewBox",[0,0,this.Width,this.Height])
        .call(d3.zoom<SVGSVGElement,unknown>().on("zoom",(e:any)=>HandleZoom(e)))

      CandleStick(
        X,
        Y,
        this.Data,
        this.ChartSVG,
        this.Height,
        this.Width,
        this.Margins,
        Dates
      );
    }
  }

  @ViewChild('ChartContainer',{static:true}) DivReference!: ElementRef<any>;
  @ViewChild('SVGContainer', { static: true }) SVGReference!: ElementRef<SVGSVGElement>;
  
  

  async ngAfterViewInit(): Promise<void> {
    //Fetch calculated H/W from parent div
    const ParentDiv = this.DivReference.nativeElement;
    const Rect = ParentDiv.getBoundingClientRect();
    //hook D3 to SVG element
    //if the data is already available then render, if not it will have to be rendered by ngonchanges
   
    this.Width = Rect.width;
    this.Height = Rect.height;
    if(this.Data.length>0){
      const Dates:string[] = this.Data.map(d=>this.DateFormat(d.timestamp));
      const X:d3.ScaleBand<string> = d3
        .scaleBand()
        .domain(Dates)
        .range([this.Margins[3],this.Width-this.Margins[2]]); 
  
      const Y:d3.ScaleLogarithmic<number, number, never> = d3
        .scaleLog()
        .domain([d3.min(this.Data,(d:DataStructure)=>d.low),d3.max(this.Data,(d:any)=>d.high)] as [number,number])
        .rangeRound([this.Height - this.Margins[0], this.Margins[1]]);
      d3.selectAll("svg > *").remove();
      
      function HandleZoom(e:any):void{
        const {x,k} = e.transform;
        d3.select(e.target).attr("transform",`translate(${x},0) scale(${k},1)`)
      }
      
      this.ChartSVG = d3.select(this.SVGReference.nativeElement)
        .attr("viewBox",[0,0,this.Width,this.Height])
        .call(d3.zoom<SVGSVGElement,unknown>().on("zoom",(e:any)=>HandleZoom(e)))
      
        CandleStick(
        X,
        Y,
        this.Data,
        this.ChartSVG,
        this.Height,
        this.Width,
        this.Margins,
        Dates
      );
    }
  }
}
