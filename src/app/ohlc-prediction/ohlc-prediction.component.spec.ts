import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OHLCPredictionComponent } from './ohlc-prediction.component';

describe('OHLCPredictionComponent', () => {
  let component: OHLCPredictionComponent;
  let fixture: ComponentFixture<OHLCPredictionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OHLCPredictionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OHLCPredictionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
