import xlsx from "xlsx";

export const readExcel = (file, indexSheet) => {
    try {
        const workbook = xlsx.readFile(file);
        const sheetName = workbook.SheetNames[indexSheet];
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet);
        return data;
    } catch (error) {
        throw error;
    }
};