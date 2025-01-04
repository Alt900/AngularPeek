import { Component,OnInit  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { Utils } from './utils';

import { ColorEvent } from 'ngx-color';
import { ColorSketchModule } from 'ngx-color/sketch';

import { DashboardControlsComponent } from './dashboard-controls/dashboard-controls.component';
import { CandlestickChartComponent } from './candlestick-chart/candlestick-chart.component';
import { APIInterfaceComponent } from './api-interface/api-interface.component';
import { OHLCPredictionComponent } from './ohlc-prediction/ohlc-prediction.component';
import { CustomArchitectureComponent } from './custom-architecture/custom-architecture.component';
interface DataStructure {
  close:number;
  high:number;
  low:number;
  open:number
  timestamp:string;
  volume:number; 
  colorscheme?:string;
}
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    DashboardControlsComponent,
    CandlestickChartComponent,
    APIInterfaceComponent,
    OHLCPredictionComponent,
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

  ChildBooleanPrimary:boolean = false;
  ChildBooleanSecondary:boolean = false;

  ChosenDashboard:string="Custom Architecture";

  HandleInput(payload:any){
    if(payload[1]){
      this.ChildBooleanPrimary = payload[0];
    } else{
      this.ChildBooleanSecondary = payload[0];
    }
  }

  HandleIncomingData(payload:any){
    this.CandlestickData = payload as DataStructure[];
  }

  HandleDashboardChange(payload:any){
    this.ChosenDashboard=payload as string;
  }

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
  }
  HandleSecondaryChange($event:ColorEvent){
    this.Secondary_Color = `rgba(${$event.color.rgb.r},${$event.color.rgb.g},${$event.color.rgb.b},${$event.color.rgb.a})`
  }

  title = 'Peek';
}
