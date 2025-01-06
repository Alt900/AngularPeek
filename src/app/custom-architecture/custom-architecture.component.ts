import { Component, Input, SimpleChanges } from '@angular/core';
import { InteractiveArchitectureComponent } from '../interactive-architecture/interactive-architecture.component';
import { CommonModule } from '@angular/common';
import {FormsModule} from '@angular/forms';

import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import {MatFormFieldModule} from '@angular/material/form-field';
import { Utils } from '../utils';

interface PredictionData{
  Accuracy: number[][],
  Loss: number[][],
  PreData:[],
  Prediction:[]
}
interface ArchitectureRect{
  x:number,
  nodes:number,
  n_1_nodes:number,
  LayerType:string,
  activation:string,
  weights:number[],
  bias:number,
  Dropout:number
};

interface LayerArguments{
  cell_count:number,
  dropout:number,
  layer_type:string
}

@Component({
  selector: 'app-custom-architecture',
  imports: [
    InteractiveArchitectureComponent,
    CommonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    FormsModule
  ],
  templateUrl: './custom-architecture.component.html',
  styleUrl: './custom-architecture.component.scss'
})

export class CustomArchitectureComponent {
  @Input() Primary!:string;
  @Input() Secondary!:string;
  @Input() AvailableTickers!:string[];
  SelectedTicker:string="";
  SelectedMethod:string="Logarithmic"
  SelectedVariables:string[]=[];
  LayerArgs:LayerArguments[]=[];
  isTraining:boolean = false;
  SelectedGraph:number = -1;
  PredictionData:PredictionData={Accuracy:[[]],Loss:[[]],PreData:[],Prediction:[]};

  GraphOptions:string[] = [
    "Accuracy",
    "Loss",
    "Prediction",
    "Architecture"
  ];

  NormMethods:string[] = [
    "Logarithmic",
    "MinMax",
    "Z_Score"
  ];

  VariableOptions:string[]=[
    "open",
    "high",
    "low",
    "close",
    "volume"
  ] ;

  LayerOptions:string[] = [
    "LSTM Unidirectional",
    "Dense"
  ];

  Hyperparameters:string[]=[
    "batch size",
    "window size",
    "epochs",
    "train ratio",
    "test ratio",
    "validation ratio",
    "timesteps to predict"
  ];

  HyperparameterValues:number[]=[
    32,
    5,
    50,
    0.7,
    0.2,
    0.1,
    5
  ];

  Architecture:ArchitectureRect[]=[];

  ngOnChanges(changes:SimpleChanges):void{
    if(changes['AvailableTickers'] && this.AvailableTickers.length>0){
      this.SelectedTicker=this.AvailableTickers[0];
    }
  }

  async BuildRunArch():Promise<void>{
    this.isTraining=true;
    const ParameterizedRoute:string = `CreateModel?Hyperparams=[${this.HyperparameterValues}]&LayerArgs=${JSON.stringify(this.LayerArgs)}&NormMethod=${this.SelectedMethod}&Ticker=${this.SelectedTicker}&Variables=[${this.SelectedVariables}]`;
    this.PredictionData = await Utils.FetchRoute(ParameterizedRoute);
    this.isTraining=false;
  }

  RenderGraph(Index:number):void{
    this.SelectedGraph = Index
    console.log(Index)
  }

  HandleHyperparamChange(e:Event,Index:number):void{
    this.HyperparameterValues[Index]=+<string>(<HTMLInputElement>e.target).value;
  }

  HandleCellChange(event:Event,Index:number):void{
    this.LayerArgs[Index].cell_count=+<string>(<HTMLInputElement>event.target).value;
    this.LayerArgs=[...this.LayerArgs]
    this.Architecture[Index].weights=this.LayerArgs[Index-1]?[this.LayerArgs[Index-1].cell_count,this.LayerArgs[Index].cell_count]:[this.LayerArgs[Index].cell_count,this.LayerArgs[Index].cell_count]
  }

  HandleDropoutChange(event:Event,Index:number):void{
    this.LayerArgs[Index].dropout=+<string>(<HTMLInputElement>event.target).value;
    this.LayerArgs=[...this.LayerArgs]
  }

  RemoveLayer(i:number):void{
    this.LayerArgs = this.LayerArgs.filter((item:LayerArguments)=>item!==this.LayerArgs[i]);
    this.Architecture = this.Architecture.filter((item:ArchitectureRect)=>item!==this.Architecture[i]);
  }

  AddLayer=(Layer:string):void=>{
    const N_1 = this.Architecture.length-1;
    if(N_1>-1){
      this.Architecture=([...this.Architecture,{
        x:this.Architecture[N_1].x+100,
        nodes:this.Architecture[N_1].nodes+2,
        n_1_nodes: this.Architecture[N_1].nodes,
        LayerType: Layer,
        activation:"tanh",
        weights:[this.Architecture[N_1].nodes,this.Architecture[N_1].nodes+2],
        bias: this.Architecture[N_1].nodes+2,
        Dropout: 0.00
      }]);
      this.LayerArgs=[...this.LayerArgs,{
        cell_count:this.Architecture[N_1].nodes+2,
        dropout:0.00,
        layer_type:Layer
      }]
    } else {
      this.Architecture=([...this.Architecture,{
        x:100,
        nodes:10,
        n_1_nodes: 0,
        LayerType: Layer,
        activation:"tanh",
        weights: [10,10],
        bias: 10,
        Dropout: 0.00
      }])
      this.LayerArgs=[...this.LayerArgs,{
        cell_count:10,
        dropout:0.00,
        layer_type:Layer
      }]
    }
  }

  CalculateLeft(i:number,modifier?:number):string{return `${i*(modifier===undefined?1:modifier)}%`}
  CalculateTop(i:number,modifier?:number):string{return `${i*(modifier===undefined?1:modifier)}%`}
}
