import { Component, Input, Output, SimpleChanges, EventEmitter} from '@angular/core';
import {FormsModule} from '@angular/forms';

import {MatDatepickerModule} from '@angular/material/datepicker';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import {MatFormFieldModule} from '@angular/material/form-field';
import {provideNativeDateAdapter} from '@angular/material/core';

import { CommonModule } from '@angular/common';
import { Utils } from '../utils';

interface Formatted {
  value:string,
  label:string
}

@Component({
  selector: 'app-api-interface',
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatDatepickerModule,
    FormsModule,
    CommonModule
  ],
  providers:[provideNativeDateAdapter()],
  templateUrl: './api-interface.component.html',
  styleUrl: './api-interface.component.scss'
})

export class APIInterfaceComponent{

  @Input()OnHandTickers!:string[];
  @Output() TickerData = new EventEmitter<any>();

  SelectedStartDate: Date | null = null;
  SelectedEndDate: Date | null = null;
  SelectedInterval: string = "1H";

  TickersToDownload:string[] = [];
  TempTicker:string="";
  AvailableTickers:string[]=this.OnHandTickers;
  SelectedTicker:string="";

  IntervalOptions:Formatted[]=[
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

  ngOnChanges(changes:SimpleChanges):void{
    if(changes['OnHandTickers'] && changes['OnHandTickers'].currentValue.length>0){
      this.AvailableTickers=this.OnHandTickers;
      if (this.AvailableTickers.length>0){
        this.SelectedTicker=this.AvailableTickers[0];
      }
    }
  }

  HandleTickerInput(event:Event):void{
    this.TempTicker= <string>(<HTMLInputElement>event.target).value;
  }

  AppendTicker():void{
    if(!this.TickersToDownload.includes(this.TempTicker) && this.TempTicker.length >= 3){
      this.TickersToDownload.push(this.TempTicker);
      this.TempTicker = "";
    }
  }
  RemoveTicker():void{
    const Index:number = this.TickersToDownload.indexOf(this.TempTicker);
    if(Index!==-1){
      this.TickersToDownload.splice(Index,1);
      this.TempTicker = "";
    }
  }

  async FetchTickerData():Promise<void>{
    Utils.FetchRoute(`FetchJSON?ticker=${this.SelectedTicker}`)
    .then((Result)=>{
      this.TickerData.emit(Result);
    })
  }

  async DownloadTickers():Promise<void>{
    const To = this.SelectedEndDate!==null?this.SelectedEndDate.toISOString().split('T')[0]:null;
    const From = this.SelectedStartDate!==null?this.SelectedStartDate.toISOString().split("T")[0]:null;
    Utils.FetchRoute(
      `DownloadData?Tickers=${this.TickersToDownload}&to=${To}&from=${From}&interval=${this.SelectedInterval}`);
    this.AvailableTickers = [...new Set([...this.AvailableTickers,...this.TickersToDownload])];
  }
}
