import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement, // Necesario para gráficos de barras
  ArcElement, // Necesario para gráficos de pastel/donas (si los usas)
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2'; // Importa los tipos de gráfico que usarás

// Registra los componentes necesarios de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// Componente genérico para gráficos
const DynamicChart = ({ chartType, data, options, title }) => {
  if (!data || !data.labels || !data.datasets || data.datasets.length === 0) {
    return <p style={{ textAlign: 'center', color: '#666' }}>No hay datos disponibles para mostrar el gráfico.</p>;
  }

  // Determinar qué componente de Chart.js usar
  let ChartComponent;
  switch (chartType) {
    case 'line':
      ChartComponent = Line;
      break;
    case 'bar':
      ChartComponent = Bar;
      break;
    case 'pie':
      ChartComponent = Pie;
      break;
    // Puedes añadir más tipos de gráficos aquí (doughnut, etc.)
    default:
      console.warn('Tipo de gráfico no reconocido. Usando gráfico de barras por defecto.');
      ChartComponent = Bar;
  }

  return (
    <div style={{ maxWidth: '100%', maxHeight: '400px', margin: '20px auto' }}>
      {title && <h3 style={{ textAlign: 'center', color: '#333' }}>{title}</h3>}
      <ChartComponent data={data} options={options} />
    </div>
  );
};

export default DynamicChart;