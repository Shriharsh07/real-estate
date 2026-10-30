import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PropertyList } from './property-list';

describe('PropertyList', () => {
  let component: PropertyList;
  let fixture: ComponentFixture<PropertyList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers:[provideHttpClient(),provideHttpClientTesting(),provideRouter([])],
      imports: [PropertyList],
    }).compileComponents();

    fixture = TestBed.createComponent(PropertyList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
