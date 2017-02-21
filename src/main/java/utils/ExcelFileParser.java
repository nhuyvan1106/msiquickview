package utils;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import org.apache.poi.ss.usermodel.*;
/**
 *
 * @author NhuY
 */
public class ExcelFileParser {

    public static double[][] extractSheet(Workbook wb) {
        Iterator<Row> rows = wb.getSheetAt(0).iterator();
        List<double[]> list = new ArrayList<>();
        
        while(rows.hasNext()) {
            Row row = rows.next();
            list.add(new double[] { row.getCell(0).getNumericCellValue(), row.getCell(1).getNumericCellValue() });
        }
        return list.toArray(new double[list.size()][2]);
    }
}
