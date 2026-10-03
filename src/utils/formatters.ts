const currencyFormatter =
  new Intl.NumberFormat(
    'en-US',
    {
      style: 'currency',

      currency: 'USD',

      minimumFractionDigits: 2,

      maximumFractionDigits: 2,
    }
  );


const compactCurrencyFormatter =
  new Intl.NumberFormat(
    'en-US',
    {
      style: 'currency',

      currency: 'USD',

      notation: 'compact',

      maximumFractionDigits: 1,
    }
  );


const percentFormatter =
  new Intl.NumberFormat(
    'en-US',
    {
      style: 'percent',

      minimumFractionDigits: 1,

      maximumFractionDigits: 1,
    }
  );


const integerFormatter =
  new Intl.NumberFormat(
    'en-US',
    {
      maximumFractionDigits: 0,
    }
  );


const dateFormatter =
  new Intl.DateTimeFormat(
    'en-US',
    {
      month: 'short',

      day: 'numeric',

      year: 'numeric',
    }
  );


const monthYearFormatter =
  new Intl.DateTimeFormat(
    'en-US',
    {
      month: 'short',

      year: 'numeric',
    }
  );


export function formatCurrency(
  amount: number
): string {

  return currencyFormatter.format(
    amount || 0
  );
}


export function formatCompactCurrency(
  amount: number
): string {

  return compactCurrencyFormatter.format(
    amount || 0
  );
}


export function formatPercent(
  decimalOrHundred: number,
  isHundred: boolean = true
): string {

  const value =
    isHundred
      ? decimalOrHundred / 100
      : decimalOrHundred;


  return percentFormatter.format(
    value || 0
  );
}


export function formatInteger(
  num: number
): string {

  return integerFormatter.format(
    num || 0
  );
}


export function formatDate(
  dateString: string
): string {

  try {

    const d =
      new Date(
        dateString
      );


    if (
      isNaN(
        d.getTime()
      )
    ) {

      return dateString;
    }


    return dateFormatter.format(d);

  } catch {

    return dateString;
  }
}


export function formatMonthYear(
  dateString: string
): string {

  try {

    const d =
      new Date(
        dateString
      );


    if (
      isNaN(
        d.getTime()
      )
    ) {

      return dateString;
    }


    return monthYearFormatter.format(d);

  } catch {

    return dateString;
  }
}


/*
 * =========================================================
 * LIVE CLOUD FORMATTERS
 * =========================================================
 *
 * Real cloud APIs may not return every metric.
 *
 * For example:
 *
 * AWS CloudWatch normally gives EC2 CPU metrics,
 * but memory requires CloudWatch Agent.
 *
 * Therefore null must display as N/A.
 */


export function isMetricAvailable(
  value:
    | number
    | null
    | undefined
): value is number {

  return (
    typeof value === 'number' &&
    Number.isFinite(value)
  );
}


export function formatOptionalCurrency(
  amount:
    | number
    | null
    | undefined
): string {

  if (
    !isMetricAvailable(amount)
  ) {

    return 'N/A';
  }


  return currencyFormatter.format(
    amount
  );
}


export function formatOptionalPercent(
  value:
    | number
    | null
    | undefined
): string {

  if (
    !isMetricAvailable(value)
  ) {

    return 'N/A';
  }


  return `${value.toFixed(1)}%`;
}