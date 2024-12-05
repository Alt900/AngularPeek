import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MultivariateChartComponent } from './multivariate-chart.component';

describe('MultivariateChartComponent', () => {
  let component: MultivariateChartComponent;
  let fixture: ComponentFixture<MultivariateChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MultivariateChartComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MultivariateChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
