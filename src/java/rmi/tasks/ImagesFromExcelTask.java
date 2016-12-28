package rmi.tasks;

import com.mathworks.toolbox.javabuilder.MWException;
import java.io.Serializable;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;
import remote_proxy.Task;
import save_ion_image_for_all_ranges_in_spreadsheet.Class1;

public class ImagesFromExcelTask extends Class1 implements Task<Void>, Serializable {

    private final String path;
    private final List<String> fileNames;
    private final double[][] ranges;
    private static final long serialVersionUID = 227L;
    private final int threshold;
    private final String dataset;
    public ImagesFromExcelTask(String path, List<String> fileNames, double[][] ranges, int threshold, String dataset) throws MWException {
        this.path = path;
        this.fileNames = fileNames;
        this.ranges = ranges;
        this.threshold = threshold;
        this.dataset = dataset;
    }

    @Override
    public Void doTask() {
        try {
            this.save_ion_image_for_all_ranges_in_spreadsheet(path, ranges, fileNames.toArray(new String[1]), threshold, dataset);
        } catch (MWException ex) {
            Logger.getLogger(ImagesFromExcelTask.class.getName()).log(Level.SEVERE, null, ex);
        }
        return null;
    }
}
