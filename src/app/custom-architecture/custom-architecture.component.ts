import { Component } from '@angular/core';
import { NgFor  } from '@angular/common';
import { CommonModule } from '@angular/common';


interface PreData {
  [Index:number]:{
    [Key:string]:number | string;//UTF timestamps
  }
}

@Component({
  selector: 'app-custom-architecture',
  standalone: true,
  imports: [NgFor,CommonModule],
  templateUrl: './custom-architecture.component.html',
  styleUrl: './custom-architecture.component.scss'
})

export class CustomArchitectureComponent {
  Accuracy: {} = {"Train":Float32Array,"Test":Float32Array}
  Loss: {} = {"Train":Float32Array,"Test":Float32Array}
  PreDataObject: PreData = {}
  Architecture: {}[] = [];
  ArchitectureOptions:string[] = [
    "LSTM Unidirectional",
    "Dropout",
    "Dense",
    "Tanh",
    "ReLU",
    "Leaky ReLU",
    "Sigmoid"
  ]

  AppendArchitecture(Item:string):void{
    if(Item==="Dropout"){
      this.Architecture.push({"ID":Item,Args:{"ID":"Dropout rate","Value":0.25}})
    } else {
      this.Architecture.push({"ID":Item,Args:null})
    }
  }

  HandleLayerArgs(Index:number,ID:string,NewValue:number):void{
    this.Architecture[Index]["Args"][ID]["Value"] = NewValue;
  }

  CalculateLeft(Index:number):string{
    return `${(Index+1)*12}%`; 
  }

  async Fetch(){
    const response = await fetch('/api/TestTSObject');
    let data = await response.json();
    data = data.payload
    this.PreDataObject = data.PreData as PreData ;
    this.Accuracy = data.Accuracy;
    this.Loss = data.Loss;
  }
}

