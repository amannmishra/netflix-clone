import { TestBed } from '@angular/core/testing';

import { ErrorHandlerService } from './error-handler-service';

describe('ErrorHandler', () => {
  let service: ErrorHandlerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ErrorHandlerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
