import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomArchitectureComponent } from './custom-architecture.component';

describe('CustomArchitectureComponent', () => {
  let component: CustomArchitectureComponent;
  let fixture: ComponentFixture<CustomArchitectureComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomArchitectureComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomArchitectureComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
