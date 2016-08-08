package matlab;

import com.mathworks.toolbox.javabuilder.*;
import java.util.List;
import java.util.concurrent.*;
import java.util.logging.*;
import javax.annotation.*;
import javax.ejb.Stateless;
import save_ion_image_for_all_ranges_in_spreadsheet.Class1;

@Stateless
public class ExcelIonImageGenerator {

    private final Class1 clazz1;
    @Resource(name = "java:comp/DefaultManagedExecutorService")
    private ExecutorService pool;

    public ExcelIonImageGenerator() throws MWException {
        clazz1 = new Class1();
    }

    public void generate(String path, List<String> fileNames, Double[][] ranges) throws MWException {
        pool.submit(() -> generateHelper(path, fileNames, ranges, clazz1));
    }

    private void generateHelper(String path, List<String> fileNames, Double[][] ranges, Class1 clazz) {
        try {
            clazz.save_ion_image_for_all_ranges_in_spreadsheet(path, ranges, fileNames.toArray(new String[1]));
        } catch (MWException ex) {
            Logger.getLogger(ExcelIonImageGenerator.class.getName()).log(Level.SEVERE, null, ex);
        }
    }

    @PreDestroy
    private void dispose() {
        MWArray.disposeArray(clazz1);
        System.out.println("********** SHUTTING DOWN IN dispose() **********");
    }

}
