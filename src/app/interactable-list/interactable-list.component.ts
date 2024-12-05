import { NgFor  } from '@angular/common';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-interactable-list',
  templateUrl: './interactable-list.component.html',
  styleUrl: './interactable-list.component.scss',
  imports: [NgFor,CommonModule],
  standalone: true
})
export class InteractableListComponent {
  Variables: string[] = ["open","high","low","close","volume","vwap"];
  VariablesSelected: boolean[] = [false,false,false,false,false,false];
  Indicies: number[] = Array.from(this.Variables.keys());
  
  CalculateTop(Index:number):string{
    return `${Index*10}%`;
  }

  HandleVariable(Index:number){
    this.VariablesSelected[Index] = !this.VariablesSelected[Index];
  }
}
