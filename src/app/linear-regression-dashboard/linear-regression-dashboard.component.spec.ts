import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LinearRegressionDashboardComponent } from './linear-regression-dashboard.component';

describe('LinearRegressionDashboardComponent', () => {
  let component: LinearRegressionDashboardComponent;
  let fixture: ComponentFixture<LinearRegressionDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LinearRegressionDashboardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LinearRegressionDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
