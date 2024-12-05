import {
  Component,
  Input,
  AfterViewInit,
  ViewChild,
  ElementRef,
  SimpleChanges
} from '@angular/core';

import * as d3 from 'd3';

interface MarginType{
  top:number;
  right:number;
  bottom:number;
  left:number
}

@Component({
  selector: 'app-univariate-chart',
  imports: [],
  templateUrl: './univariate-chart.component.html',
  styleUrl: './univariate-chart.component.scss'
})
export class UnivariateChartComponent {
  @Input()UnivariateData:number[]=[];
  Margin:MarginType={
    top:10,
    right:30,
    bottom:30,
    left:60
  }

  Height:number = 0;
  Width:number = 0;

  @ViewChild('ChartContainer',{static:true}) DivReference!: ElementRef<any>;
  @ViewChild('SVGContainer', { static: true }) SVGReference!: ElementRef<SVGSVGElement>;
  ChartSVG!:SVGSVGElement;

  ngOnChanges(changes:SimpleChanges):void{
    if(changes['UnivariateData'] && changes['UnivariateData'].currentValue.length>0){
      this.ConstructChart();
    }
  }

  ngAfterViewInit(): void {
    const ParentDiv = this.DivReference.nativeElement;
    const Rect = ParentDiv.getBoundingClientRect();
    this.Width = Rect.width-this.Margin.left-this.Margin.right;
    this.Height = Rect.height-this.Margin.top-this.Margin.bottom;
    this.ChartSVG = this.SVGReference.nativeElement;
    if(this.UnivariateData.length>0){
      this.ConstructChart();
    }
  }

  ConstructChart(){

    const Yaxis = this.UnivariateData.map((d:any)=>d.open);

    const X = d3.scaleLinear()
      .domain([0,this.UnivariateData.length])
      .range([0,this.Width]);

    const Y = d3.scaleLinear()
      .domain([0,Math.max(...Yaxis)])
      .range([this.Height,0]);

      const SVG = d3.select(this.SVGReference.nativeElement)
        .attr("width",this.Width+this.Margin.left+this.Margin.right)
        .attr("height",this.Height+this.Margin.top+this.Margin.bottom)
        .append("g")
        .attr("transform",`translate(${this.Margin.left},${this.Margin.top})`);

      SVG.append("g")
        .attr("transform",`translate(0,${this.Height})`)
        .call(d3.axisBottom(X));

      SVG.append("g")
        .call(d3.axisLeft(Y));

      SVG.append("path")
        .datum(Yaxis)
        .attr("fill","none")
        .attr("stroke","white")
        .attr("stroke-width",2)
        .attr("d",d=>d3.line<number>()
          .x(((_:any,Index:number)=>X(Index)))
          .y((d:any)=>Y(d))!(d)
        )
  }
}
