(function (root) {
  'use strict';
  function buildBill(order, items) {
    const lines = items.map(item => ({ price: Number(item.price) || 0, quantity: Number(item.quantity) || 1 }));
    lines.forEach(line => { line.base = Math.round(line.price * line.quantity); });
    const baseTotal = lines.reduce((sum, line) => sum + line.base, 0);
    const subtotal = Number(order.subtotal ?? baseTotal);
    const tax = Number(order.tax_amount ?? order.taxAmount ?? Math.round(subtotal * 0.18));
    const delivery = Number(order.delivery_charge ?? order.deliveryCharge ?? 0);
    const total = Number(order.total_amount ?? order.totalAmount ?? (subtotal + tax + delivery));
    let cumulativeBase = 0;
    let allocatedTax = 0;
    // Cumulative rounding keeps the displayed item taxes equal to the saved order tax.
    lines.forEach(line => {
      cumulativeBase += line.base;
      const cumulativeTax = baseTotal ? Math.round(tax * cumulativeBase / baseTotal) : 0;
      line.tax = cumulativeTax - allocatedTax;
      allocatedTax = cumulativeTax;
      line.total = line.base + line.tax;
    });
    return { lines, subtotal, tax, delivery, total };
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { buildBill };
  if (root) {
    root.dtfBuildBill = buildBill;
    root.dtfBillBarcode = function (reference) {
      if (!reference) return '';
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      root.JsBarcode(svg, String(reference), { format: 'CODE128', width: 1.2, height: 38, displayValue: false, margin: 8 });
      return svg.outerHTML;
    };
  }
})(typeof window !== 'undefined' ? window : null);
