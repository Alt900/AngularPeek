import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InteractableListComponent } from './interactable-list.component';

describe('InteractableListComponent', () => {
  let component: InteractableListComponent;
  let fixture: ComponentFixture<InteractableListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InteractableListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InteractableListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
