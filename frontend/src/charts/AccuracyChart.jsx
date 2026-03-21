import ChartPanel, { CHART_COLORS } from '../components/ChartPanel';

const AccuracyChart = ({ data }) => {
  // Demo data if no real data provided
  const chartData = data || [];

  return (
    <ChartPanel
      title="Accuracy Trend"
      subtitle="Your performance over time"
      type="line"
      data={chartData}
      dataKeys={['accuracy']}
      colors={[CHART_COLORS.gold]}
      height={280}
    />
  );
};

export default AccuracyChart;
