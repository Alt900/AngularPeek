import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GraphSelectionComponent } from './graph-selection.component';

describe('GraphSelectionComponent', () => {
  let component: GraphSelectionComponent;
  let fixture: ComponentFixture<GraphSelectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GraphSelectionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GraphSelectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
