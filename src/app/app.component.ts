import { Component,OnInit  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { Utils } from './utils';

import { ColorEvent } from 'ngx-color';
import { ColorSketchModule } from 'ngx-color/sketch';

import { CandlestickChartComponent } from './candlestick-chart/candlestick-chart.component';
import { APIInterfaceComponent } from './api-interface/api-interface.component';
import { CustomArchitectureComponent } from './custom-architecture/custom-architecture.component';
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
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    CandlestickChartComponent,
    APIInterfaceComponent,
    CustomArchitectureComponent,
    
    ColorSketchModule,
    
    CommonModule
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})

export class AppComponent {
  CandlestickData!:DataStructure[];
  AvailableTickers!:string[];

  ShowPrimary:boolean = false;
  ShowSecondary:boolean = false;

  ChosenDashboard:string="Custom Architecture (Prediction)";



  ChangeSCSS(){
    document.documentElement.style.setProperty('--primary_color',this.Primary_Color);
    document.documentElement.style.setProperty('--secondary_color',this.Secondary_Color);
  }

  HandleColorBool(which:number):void{
    if(which===1){this.ShowPrimary=!this.ShowPrimary}
    else{this.ShowSecondary=!this.ShowSecondary}
  }

  HandleIncomingData(payload:any){
    this.CandlestickData = payload as DataStructure[];
  }

  ChangeDashboard(ID:string):void{this.ChosenDashboard=ID}

  Primary_Color:string = "rgba(0,0,0,1)";
  Secondary_Color:string = "rgba(0,210,255,1)";

  ngOnInit():void{
    Utils.FetchRoute("GetTickers")
    .then((Result)=>{
      this.AvailableTickers=Result;//undefined
      console.log(this.AvailableTickers)
    })

    Utils.FetchRoute("FetchJSON?ticker=LMT")
    .then((Result)=>{
      this.CandlestickData=Result
    })
    document.documentElement.style.setProperty('--primary_color',this.Primary_Color);
    document.documentElement.style.setProperty('--secondary_color',this.Secondary_Color);
  }

  HandlePrimaryChange($event:ColorEvent){
    this.Primary_Color = `rgba(${$event.color.rgb.r},${$event.color.rgb.g},${$event.color.rgb.b},${$event.color.rgb.a})`
    this.ChangeSCSS();
  }
  HandleSecondaryChange($event:ColorEvent){
    this.Secondary_Color = `rgba(${$event.color.rgb.r},${$event.color.rgb.g},${$event.color.rgb.b},${$event.color.rgb.a})`
    this.ChangeSCSS();
  }

  title = 'Peek';
}
