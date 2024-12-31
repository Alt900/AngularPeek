import { Component, Input, Output, EventEmitter} from '@angular/core';
import { NgFor  } from '@angular/common';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard-controls',
  standalone: true,
  imports: [NgFor,CommonModule],
  templateUrl: './dashboard-controls.component.html',
  styleUrls: ['./dashboard-controls.component.scss']
})
export class DashboardControlsComponent {
  @Output() DasboardChangeEvent = new EventEmitter;
  @Output() ChildBoolean = new EventEmitter<boolean[]>();
  @Input() RGBAPrimary:string = "rgba(0,0,0,1)";
  @Input() RGBASecondary:string = "rgba(0,210,255,1)";

  Selections: string[] = [
    "API Interface",
    "OHLC prediction",
    "Custom Architecture"
  ]
  //"Custom model architecture"
  //"Linear Regression",
  //"Statistical metrics"
  ShowPrimary:boolean = false;
  ShowSecondary:boolean = false;

  ToggleColorSelect(button:boolean){
    if(button){
      this.ShowPrimary=!this.ShowPrimary;
      this.ChildBoolean.emit([this.ShowPrimary,true])
    } else {
      this.ShowSecondary=!this.ShowSecondary;
      this.ChildBoolean.emit([this.ShowSecondary,false])
    }
  }

  //SCSS calculations
  CalculateTop(Index:number):string{
    return `${(Index+3)*12}%`;
  }
  //SCSS color customization handlers
  ChangeSCSS(){
    document.documentElement.style.setProperty('--primary_color',this.RGBAPrimary);
    document.documentElement.style.setProperty('--secondary_color',this.RGBASecondary);
  }
  //Dashboard control handler
  HandleDashboardOption(Chosen:string){
    this.DasboardChangeEvent.emit(Chosen)
  }
}
