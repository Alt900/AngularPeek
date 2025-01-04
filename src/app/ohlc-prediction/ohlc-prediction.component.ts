import { Component, Input } from '@angular/core';
import { CandlestickChartComponent } from '../candlestick-chart/candlestick-chart.component';

import {MatSelectModule} from '@angular/material/select';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import {provideNativeDateAdapter} from '@angular/material/core';
import { FormsModule } from '@angular/forms';

import { CommonModule } from '@angular/common';
import { Utils } from '../utils';

interface DataStructure {
  close:number;
  high:number;
  low:number;
  open:number
  timestamp:string;
  volume:number; 
  colorscheme?:string;
}

interface IDVAL {ID:string;value:any}

@Component({
  selector: 'app-ohlc-prediction',
  imports: [
    CandlestickChartComponent,
    MatSelectModule,
    MatFormFieldModule,
    CommonModule,
    FormsModule,
    MatInputModule
  ],
  providers:[provideNativeDateAdapter()],
  templateUrl: './ohlc-prediction.component.html',
  styleUrl: './ohlc-prediction.component.scss'
})
export class OHLCPredictionComponent {
  @Input()TickerData!:DataStructure[];
  @Input() AvailableTickers!:string[];
  Prediction:DataStructure[]=[];

  NormalizationOptions:string[]=["Logarithmic","MinMax","Z_Score"]
  Hyperparameters:IDVAL[]=[
    {"ID":"Epochs",value:100},
    {"ID":"Batch Size",value:32},
    {"ID":"Window Size",value:5},
    {"ID":"Cell Count",value:32},
    {"ID":"Training Ratio",value:.7},
    {"ID":"Testing Ratio",value:.2},
    {"ID":"Validation Ratio",value:.1},
  ];
  HyperparameterArray:number[]=[100,32,5,32,.7,.2,.1];

  NormalizationMethod:string="";
  ChosenTicker:string="";

  HandleHyperparameters(Index:number,ValueEvent:Event):void{
    const ResolvedEventValue = <any>(<HTMLInputElement>ValueEvent.target).value;
    const CopyID = this.Hyperparameters[Index].ID;
    this.Hyperparameters[Index]={"ID":CopyID,value:ResolvedEventValue};
  }

  CalculateTop(index:number):string{return `${(index+4)*5}%`}
  GetID(i:number):string{return this.Hyperparameters[i].ID}

  TrainModel(){
    const StringifiedHyperparams = JSON.stringify(this.Hyperparameters);
    const Formatted = `?NormMethod=${this.NormalizationMethod}&Ticker=${this.ChosenTicker}&hyperparameters=${StringifiedHyperparams}`
    Utils.FetchRoute("OHLC_Multivariate"+Formatted)
    .then(Result=>{
      this.Prediction=Result;
    });
  }
}
