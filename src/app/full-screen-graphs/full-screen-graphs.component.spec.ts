import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FullScreenGraphsComponent } from './full-screen-graphs.component';

describe('FullScreenGraphsComponent', () => {
  let component: FullScreenGraphsComponent;
  let fixture: ComponentFixture<FullScreenGraphsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FullScreenGraphsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FullScreenGraphsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
