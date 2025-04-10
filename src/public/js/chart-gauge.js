/**
 * Chart.js Gauge Plugin
 * A simple implementation of gauge charts for Chart.js
 */

(function(global) {
  // Check if Chart is available
  if (typeof Chart === 'undefined') {
    console.error('Chart.js is required to use the gauge plugin');
    return;
  }
  
  // Register the gauge chart type
  Chart.defaults.gauge = {
    cutoutPercentage: 50,
    rotation: -Math.PI / 2,
    circumference: Math.PI,
    legend: {
      display: false
    },
    animation: {
      animateRotate: true,
      animateScale: false
    }
  };
  
  // Extend the doughnut controller
  const gaugeController = Chart.controllers.doughnut.extend({
    draw: function() {
      Chart.controllers.doughnut.prototype.draw.apply(this, arguments);
      
      const chart = this.chart;
      const ctx = chart.ctx;
      const width = chart.width;
      const height = chart.height;
      
      const dataset = chart.data.datasets[0];
      const value = dataset.value || 0;
      const min = dataset.minValue || 0;
      const max = dataset.maxValue || 100;
      
      // Draw value text
      const fontSize = Math.min(width / 5, height / 5);
      ctx.font = fontSize + 'px Arial';
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';
      
      const text = value.toFixed(1) + '%';
      const textX = width / 2;
      const textY = height / 2 + fontSize / 4;
      
      ctx.fillStyle = '#333';
      ctx.fillText(text, textX, textY);
    }
  });
  
  Chart.controllers.gauge = gaugeController;
  
  // Register the gauge chart type
  Chart.defaults.gauge = Chart.helpers.merge(Chart.defaults.doughnut, {
    cutoutPercentage: 70,
    rotation: -Math.PI / 2,
    circumference: Math.PI,
    legend: {
      display: false
    },
    animation: {
      animateRotate: true,
      animateScale: false
    }
  });
  
})(window);