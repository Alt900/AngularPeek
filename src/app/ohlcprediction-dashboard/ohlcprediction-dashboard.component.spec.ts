import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OHLCPredictionDashboardComponent } from './ohlcprediction-dashboard.component';

describe('OHLCPredictionDashboardComponent', () => {
  let component: OHLCPredictionDashboardComponent;
  let fixture: ComponentFixture<OHLCPredictionDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OHLCPredictionDashboardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OHLCPredictionDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
