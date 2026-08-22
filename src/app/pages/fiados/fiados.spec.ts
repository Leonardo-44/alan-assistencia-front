import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Fiados } from './fiados';

describe('Fiados', () => {
  let component: Fiados;
  let fixture: ComponentFixture<Fiados>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Fiados],
    }).compileComponents();

    fixture = TestBed.createComponent(Fiados);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
