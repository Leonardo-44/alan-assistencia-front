import { TestBed } from '@angular/core/testing';

import { Fiado } from './fiado';

describe('Fiado', () => {
  let service: Fiado;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Fiado);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
