export function getLevenshteinDistance(a: string, b: string): number {
    const matrix = [];
    let i, j;
    for (i = 0; i <= b.length; i++) matrix[i] = [i];
    for (j = 0; j <= a.length; j++) matrix[0][j] = j;

    for (i = 1; i <= b.length; i++) {
        for (j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // Substituição
                    Math.min(
                        matrix[i][j - 1] + 1, // Inserção
                        matrix[i - 1][j] + 1  // Deleção
                    )
                );
            }
        }
    }
    return matrix[b.length][a.length];
}

export function areStringsSimilar(str1: string, str2: string, threshold = 3): boolean {
    const s1 = (str1 || "").toLowerCase().trim();
    const s2 = (str2 || "").toLowerCase().trim();
    return getLevenshteinDistance(s1, s2) <= threshold;
}
