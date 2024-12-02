import { ComponentFixture, TestBed } from '@angular/core/testing';

import { APIInterfaceComponent } from './api-interface.component';

describe('APIInterfaceComponent', () => {
  let component: APIInterfaceComponent;
  let fixture: ComponentFixture<APIInterfaceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [APIInterfaceComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(APIInterfaceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
