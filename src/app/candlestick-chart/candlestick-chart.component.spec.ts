import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CandlestickChartComponent } from './candlestick-chart.component';

describe('CandlestickChartComponent', () => {
  let component: CandlestickChartComponent;
  let fixture: ComponentFixture<CandlestickChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CandlestickChartComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CandlestickChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
