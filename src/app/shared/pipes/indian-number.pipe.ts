import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'indianNumber',
  standalone: true,
})
export class IndianNumberPipe implements PipeTransform {
  private readonly formatter = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2,
  });

  transform(value: number | string | null | undefined): string {
    if (value === null || value === undefined || value === '') return '';

    const amount = Number(value);
    return Number.isFinite(amount) ? this.formatter.format(amount) : String(value);
  }
}
