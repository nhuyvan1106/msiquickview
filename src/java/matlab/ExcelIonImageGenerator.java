/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package matlab;

import com.mathworks.toolbox.javabuilder.*;
import java.io.File;
import java.util.concurrent.*;
import java.util.logging.*;
import javax.annotation.PreDestroy;
import javax.annotation.Resource;
import javax.ejb.Stateless;
import javax.inject.Inject;
import save_ion_image_for_all_ranges_in_spreadsheet.Class1;

@Stateless
public class ExcelIonImageGenerator {

    private final Class1 clazz1;
    private final Class1 clazz2;
    @Resource(lookup = "java:comp/DefaultManagedExecutorService")
    private ExecutorService pool;

    public ExcelIonImageGenerator() throws MWException {
        clazz1 = new Class1();
        clazz2 = new Class1();
    }

    public void generate(String path, Double[][] ranges) throws MWException {

        /*Double[][] d1 = new Double[(int) Math.floor(ranges.length / 2)][2];
        System.arraycopy(ranges, 0, d1, 0, d1.length);
        Double[][] d2 = new Double[ranges.length - d1.length][2];
        System.arraycopy(ranges, d1.length, d2, 0, d2.length);*/
        pool.submit(() -> generateHelper(path, ranges, clazz1));
    }

    private void generateHelper(String path, Double[][] ranges, Class1 clazz) {
        try {
            clazz.save_ion_image_for_all_ranges_in_spreadsheet(path, ranges);
        } catch (MWException ex) {
            Logger.getLogger(ExcelIonImageGenerator.class.getName()).log(Level.SEVERE, null, ex);
        }
    }

    @PreDestroy
    private void dispose() {
        MWArray.disposeArray(clazz1);
        MWArray.disposeArray(clazz2);
        pool.shutdownNow();
        System.out.println("********** SHUTTING DOWN IN dispose() **********");
    }

}
