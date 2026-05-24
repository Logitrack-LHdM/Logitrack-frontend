/**
 * Convierte un arreglo de objetos (JSON) a una cadena de texto en formato CSV
 * y fuerza la descarga en el navegador.
 * 
 * @param filename Nombre del archivo que se descargará (ej. 'reporte.csv')
 * @param data Arreglo de objetos con los datos a exportar
 */
export function downloadCsv(filename: string, data: Record<string, any>[]) {
    if (!data || data.length === 0) {
        console.warn('No hay datos para exportar a CSV');
        return;
    }

    // 1. Extraer las cabeceras a partir de las claves del primer objeto
    const headers = Object.keys(data[0]);

    // 2. Construir el contenido del CSV
    const csvRows = [];

    // Agregar la fila de cabeceras
    csvRows.push(headers.join(','));

    // Iterar sobre los datos para armar cada fila
    for (const row of data) {
        const values = headers.map(header => {
            const val = row[header] === null || row[header] === undefined ? '' : String(row[header]);

            // Si el valor tiene comas, comillas dobles o saltos de línea, lo envolvemos en comillas
            // y escapamos las comillas internas (doblándolas, estándar de CSV)
            if (val.includes(',') || val.includes('"') || val.includes('\n')) {
                return `"${val.replace(/"/g, '""')}"`;
            }
            return val;
        });

        csvRows.push(values.join(','));
    }

    const csvString = csvRows.join('\n');

    // 3. Crear el Blob con el BOM para garantizar soporte UTF-8 en Excel (Criterio 2)
    const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });

    // 4. Crear el enlace invisible y forzar la descarga (Criterio 1)
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);

    // Añadir al DOM, hacer clic y limpiar
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}