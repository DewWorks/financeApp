/**
 * Calcula o Coeficiente de Correlação de Pearson (r) entre duas séries numéricas.
 * Retorna um valor entre -1 e 1.
 */
export function calculatePearsonCorrelation(x: number[], y: number[]): number {
    const n = x.length;
    if (n === 0 || n !== y.length) return 0;

    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
    for (let i = 0; i < n; i++) {
        sumX += x[i];
        sumY += y[i];
        sumXY += x[i] * y[i];
        sumX2 += x[i] * x[i];
        sumY2 += y[i] * y[i];
    }

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    if (denominator === 0) return 0;
    return numerator / denominator;
}

/**
 * Calcula a Regressão Linear Simples (y = mx + b).
 * Retorna o slope (m) e o intercept (b).
 */
export function calculateLinearRegression(data: { x: number, y: number }[]): { slope: number, intercept: number } {
    const n = data.length;
    if (n < 2) return { slope: 0, intercept: data[0]?.y || 0 };

    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    for (const point of data) {
        sumX += point.x;
        sumY += point.y;
        sumXY += point.x * point.y;
        sumX2 += point.x * point.x;
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept };
}

/**
 * Remove Outliers básicos usando o Método do Intervalo Interquartil (IQR).
 * Ajuda a evitar que gastos acidentais únicos (ex: um carro) quebrem o modelo.
 */
export function removeOutliers(values: number[]): number[] {
    if (values.length < 4) return values;
    const sorted = [...values].sort((a, b) => a - b);
    const q1 = sorted[Math.floor(sorted.length / 4)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const iqr = q3 - q1;
    const lower = q1 - 1.5 * iqr;
    const upper = q3 + 1.5 * iqr;
    return values.filter(v => v >= lower && v <= upper);
}
