import { Component,OnInit  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { Utils } from './utils';

import { ColorEvent } from 'ngx-color';
import { ColorSketchModule } from 'ngx-color/sketch';

import { DashboardControlsComponent } from './dashboard-controls/dashboard-controls.component';
import { CandlestickChartComponent } from './candlestick-chart/candlestick-chart.component'
import { APIInterfaceComponent } from './api-interface/api-interface.component';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    DashboardControlsComponent,
    CandlestickChartComponent,
    APIInterfaceComponent,
    ColorSketchModule,
    CommonModule
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})

export class AppComponent {
  CandlestickData!:[];

  ChildBooleanPrimary:boolean = false;
  ChildBooleanSecondary:boolean = false;

  HandleInput(payload:any){
    console.log(payload);
    if(payload[0]){
      this.ChildBooleanPrimary = payload[1];
    } else{
      this.ChildBooleanSecondary = payload[1];
    }
  }

  Primary_Color:string = "rgba(0,0,0,1)";
  Secondary_Color:string = "rgba(0,210,255,1)";

  ngOnInit():void{
    const FetchedTickers: Promise<any> = Utils.FetchRoute("GetTickers");
    Utils.FetchRoute("FetchJSON?ticker=LMT")
    .then((Result)=>{
      this.CandlestickData=Result
    })
    const Tickers:Promise<string[]> = FetchedTickers as Promise<string[]>
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
