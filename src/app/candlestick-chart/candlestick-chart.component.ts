import { 
  Component,
  Input,
  ElementRef,
  ViewChild,
  AfterViewInit,
  SimpleChanges,
} from '@angular/core';

import * as d3 from 'd3';

interface DataStructure {
  close:number;
  high:number;
  low:number;
  open:number
  timestamp:string;
  volume:number; 
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
  MarginTop:number = 20;
  MarginRight:number = 30;
  MarginBottom:number = 30;
  MarginLeft:number = 40;

  ChartSVG!:SVGSVGElement;

  @Input()Data:DataStructure[]=[];

  private X: d3.ScaleBand<string>;
  private Y: d3.ScaleLogarithmic<number, number, never>;

  constructor(){
    this.X = d3.scaleBand();
    this.Y = d3.scaleLog();
  }

  ngOnChanges(changes:SimpleChanges):void{
    if(changes['Data'] && changes['Data'].currentValue.length>0){
      this.RenderCandleStick();
    }
  }

  @ViewChild('SVGContainer', { static: true }) SVGReference!: ElementRef<SVGSVGElement>;
  @ViewChild('ChartContainer',{static:true}) DivReference!: ElementRef<any>;

  ngAfterViewInit(): void {
    //Fetch calculated H/W from parent div
    const ParentDiv = this.DivReference.nativeElement;
    const Rect = ParentDiv.getBoundingClientRect();
    this.Width = Rect.width;
    this.Height = Rect.height;
    //hook D3 to SVG element
    this.ChartSVG = this.SVGReference.nativeElement;
    //if the data is already available then render, if not it will have to be rendered by ngonchanges
    if(this.Data.length>0){
      this.RenderCandleStick();
    }
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

  private RenderCandleStick():void{//everything is being rendered to the left of the chart due to a undefined X coordinate in translate
    const Dates = this.Data.map(d=>this.DateFormat(d.timestamp));
    this.X = d3
      .scaleBand()
      .domain(Dates)
      .range([this.MarginLeft,this.Width-this.MarginRight]); 

    this.Y = d3
      .scaleLog()
      .domain([d3.min(this.Data,(d:any)=>d.low),d3.max(this.Data,(d:any)=>d.high)] as [number,number])
      .rangeRound([this.Height - this.MarginBottom, this.MarginTop]);

    const SVG = d3.select(this.SVGReference.nativeElement)
      .attr("viewBox",[0,0,this.Width,this.Height]);

    const XAxis = (g: d3.Selection<SVGGElement,unknown,null,undefined>)=>
      g
        .attr("transform",`translate(0,${this.Height-this.MarginBottom})`)
        .call(d3.axisBottom(this.X).tickValues(Dates))
        .selectAll("text")
        .style("font-size","4px")
        .attr("dx","-8em")
        .attr("transform","rotate(-90)")
        .call((g:any)=>g.select(".domain").remove());

    const YAxis = (g:d3.Selection<SVGGElement,unknown,null,undefined>)=>
      g
        .attr("transform",`translate(${this.MarginLeft},0)`)//not this one
        .call(d3.axisLeft(this.Y))
        .selectAll("text")
        .style("font-size","4px")
        .call((g:any)=>g
          .selectAll(".tick line")
          .clone()
          .attr("stroke-opacity",.2)
          .attr("x2",this.Width-this.MarginLeft-this.MarginRight)
        )
        .call((g:any)=>g.select(".domain").remove());
    SVG.append("g").call(XAxis);
    SVG.append("g").call(YAxis);

    const g = SVG.append("g")
      .attr("stroke-linecap","round")
      .attr("stroke","black")
      .selectAll("g")
      .data(this.Data)
      .join("g")
      .attr("transform",((_:any,Index:number)=>`translate(${this.X(Dates[Index])},0)`))//produces all number types
    g.append("line")
      .attr("y1",(d:any)=>this.Y(d.low))
      .attr("y2",(d:any)=>this.Y(d.high));

    g.append("line")
      .attr("y1",(d:any)=>this.Y(d.open))
      .attr("y2",(d:any)=>this.Y(d.close))
      .attr("stroke-width",this.X.bandwidth()) 
      .attr("stroke",(d:any)=>d.open>d.close ? d3.schemeSet1[0] : d.close > d.open ? d3.schemeSet1[2]: d3.schemeSet1[8]);

    const SVGNode = SVG.node();
    if(SVGNode !== null){
      this.ChartSVG = SVGNode;
    }
  }
}
