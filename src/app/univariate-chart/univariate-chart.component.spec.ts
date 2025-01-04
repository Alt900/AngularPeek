import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UnivariateChartComponent } from './univariate-chart.component';

describe('UnivariateChartComponent', () => {
  let component: UnivariateChartComponent;
  let fixture: ComponentFixture<UnivariateChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UnivariateChartComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UnivariateChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
