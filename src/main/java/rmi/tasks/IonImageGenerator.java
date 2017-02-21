package rmi.tasks;

import com.mathworks.toolbox.javabuilder.MWException;
import generate_ion_image_from_hdf.Class1;
import java.io.Serializable;
import org.slf4j.LoggerFactory;
import remote_proxy.Task;

/**
 *
 * @author NhuY
 */
public class IonImageGenerator extends Class1 implements Task<Object[]>, Serializable {
    private final double lowerBound;
    private final double upperBound;
    private final String[] filesToGenerateImageFor;

    
    public IonImageGenerator(double lowerBound, double upperBound, String[] filesToGenerateImageFor) throws MWException {
        this.lowerBound = lowerBound;
        this.upperBound = upperBound;
        this.filesToGenerateImageFor = filesToGenerateImageFor;
    }
    
    
    @Override
    public Object[] doTask() {
        try {
            return this.generate_ion_image_from_hdf(1, lowerBound, upperBound, filesToGenerateImageFor);
        } catch (MWException ex) {
            LoggerFactory.getLogger(IonImageGenerator.class.getName()).error(ex.getMessage());
            return null;
        }
    }
    
}
