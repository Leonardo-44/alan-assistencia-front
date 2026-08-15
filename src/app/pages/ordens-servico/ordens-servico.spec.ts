import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrdensServico } from './ordens-servico';

describe('OrdensServico', () => {
  let component: OrdensServico;
  let fixture: ComponentFixture<OrdensServico>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrdensServico],
    }).compileComponents();

    fixture = TestBed.createComponent(OrdensServico);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
