package matlab;
import com.mathworks.toolbox.javabuilder.*;
import generate_ion_image_from_hdf.*;
import javax.annotation.PreDestroy;
import javax.ejb.Stateful;

@Stateful
public class IonImageGenerator {
    private Class1 clazz;

    public IonImageGenerator() throws MWException {
        clazz = new Class1();
    }

    public Object[] generate(double lower, double upper, String[] fileNames) throws MWException {
        return clazz.generate_ion_image_from_hdf(1, lower, upper, fileNames);
    }

    @PreDestroy
    private void dispose() {
        System.out.println("********* DESTROYING " + this.getClass().getName() + " *********");
        Class1.disposeAllInstances();
        MWArray.disposeArray(clazz);
    }
}
