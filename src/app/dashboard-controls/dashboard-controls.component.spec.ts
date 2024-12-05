import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardControlsComponent } from './dashboard-controls.component';

describe('DashboardControlsComponent', () => {
  let component: DashboardControlsComponent;
  let fixture: ComponentFixture<DashboardControlsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardControlsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardControlsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
