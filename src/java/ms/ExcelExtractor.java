/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package ms;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import org.apache.poi.ss.usermodel.*;
/**
 *
 * @author NhuY
 */
public class ExcelExtractor {

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
