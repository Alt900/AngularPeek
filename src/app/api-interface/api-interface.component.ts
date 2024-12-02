import { Component } from '@angular/core';
import {FormsModule} from '@angular/forms';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import {MatFormFieldModule} from '@angular/material/form-field';
import { DatepickerComponent } from '../datepicker/datepicker.component';

interface Formatted{
  value:string,
  label:string
}

@Component({
  selector: 'app-api-interface',
  standalone: true,
  imports: [
    DatepickerComponent,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    FormsModule
  ],
  templateUrl: './api-interface.component.html',
  styleUrl: './api-interface.component.scss'
})

export class APIInterfaceComponent{
  SelectedInterval: string = "1H";
  IntervalOptions:Formatted[]=[
    {value:"1M",label:"1 Minute"},
    {value:"2M",label:"2 Minutes"},
    {value:"5M",label:"5 Minutes"},
    {value:"15M",label:"15 Minutes"},
    {value:"30M",label:"30 Minutes"},
    {value:"1H",label:"1 Hour"},
    {value:"1D",label:"1 Day"},
    {value:"5D",label:"5 Days"},
    {value:"1W",label:"1 Week"},
    {value:"1Month",label:"1 Month"},
    {value:"3Month",label:"3 Months"},
  ]
}
