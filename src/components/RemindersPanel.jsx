// routes/remindersRoutes.js
const express = require('express');
const router = express.Router();

// Clasificación:
// ALTO: días >= 15
// BAJO:  1..14
// POR_VENCER: días <= 0 (incluye vence hoy y fechas futuras)
function deriveSeverity(daysLate) {
  if (daysLate >= 15) return 'ALTO';
  if (daysLate > 0) return 'BAJO';
  return 'POR_VENCER'; // daysLate <= 0
}

// Estimar cuotas vencidas (semanal simple)
function estimateOverdueCount(sale, daysLate) {
  if (!sale || !sale.isCredit) return 0;
  return sale.weeklyPaymentAmount && daysLate > 0
    ? Math.floor(daysLate / 7)
    : 0;
}

// Normaliza a inicio de día para evitar errores por horas
function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

module.exports = (models) => {
  const { Sale, Client, Payment } = models;

  router.get('/overdue', async (req, res) => {
    try {
      const sales = await Sale.findAll({
        where: { isCredit: true },
        include: [
          {
            model: Client,
            as: 'client',
            required: true,
            attributes: ['id', 'name', 'lastName', 'phone', 'address', 'city'],
          },
          {
            model: Payment,
            as: 'payments',
            required: false,
            attributes: ['id', 'amount', 'paymentDate', 'paymentMethod'],
          },
        ],
        order: [['id', 'DESC']],
      });

      const today = startOfDay(new Date());
      const out = [];

      for (const sale of sales) {
        const client = sale.client;
        if (!client) continue;

        const balanceDue = Number(sale.balanceDue || 0);
        if (balanceDue <= 0) continue; // solo clientes con saldo

        // 1) Determinar base temporal: último pago o fecha de venta
        const paymentsSorted = [...(sale.payments || [])].sort(
          (a, b) => new Date(b.paymentDate) - new Date(a.paymentDate)
        );
        const lastPaymentDate = paymentsSorted.length
          ? startOfDay(new Date(paymentsSorted[0].paymentDate))
          : null;

        const saleDate = sale.saleDate ? startOfDay(new Date(sale.saleDate)) : today;

        // 2) Determinar nextDue
        let nextDue = null;

        if (sale.nextDueDate) {
          // si viene de BD, respetar
          nextDue = startOfDay(new Date(sale.nextDueDate));
        } else {
          // Si no hay nextDueDate, calcular simple semanal:
          const base = lastPaymentDate || saleDate;
          nextDue = new Date(base.getTime() + 7 * 24 * 60 * 60 * 1000);
          nextDue = startOfDay(nextDue);
        }

        // 3) Calcular daysLate (positivo = vencido, 0 = hoy, negativo = futuro)
        const diffMs = today.getTime() - nextDue.getTime();
        const daysLate = Math.floor(diffMs / (24 * 60 * 60 * 1000));

        // 4) Clasificar con la nueva regla (POR_VENCER incluye 0 y negativos)
        const severity = deriveSeverity(daysLate);
        const overdueCount = estimateOverdueCount(sale, daysLate);

        const lastPayment = paymentsSorted[0] || null;

        out.push({
          client: {
            id: client.id,
            name: client.name,
            lastName: client.lastName,
            phone: client.phone,
            address: client.address,
            city: client.city,
          },
          sale: {
            id: sale.id,
            balanceDue,
            weeklyPaymentAmount: Number(sale.weeklyPaymentAmount || 0),
            totalAmount: Number(sale.totalAmount || 0),
            nextDueDate: nextDue.toISOString(),
          },
          daysLate,                 // <= 0 = POR_VENCER, >0 = vencido
          overdueCount,
          severity,                // "ALTO" | "BAJO" | "POR_VENCER"
          lastPayment: lastPayment
            ? {
                id: lastPayment.id,
                amount: Number(lastPayment.amount || 0),
                paymentDate: startOfDay(new Date(lastPayment.paymentDate)).toISOString(),
                paymentMethod: lastPayment.paymentMethod || null,
              }
            : null,
        });
      }

      res.json(out);
    } catch (err) {
      console.error('GET /api/reminders/overdue error:', err);
      res.status(500).json({ message: 'Error al calcular recorditorios de pago.' });
    }
  });

  return router;
};
