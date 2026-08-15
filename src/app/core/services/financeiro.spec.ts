import { TestBed } from '@angular/core/testing';

import { Financeiro } from './financeiro';

describe('Financeiro', () => {
  let service: Financeiro;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Financeiro);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
