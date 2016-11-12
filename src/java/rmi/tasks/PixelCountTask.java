package rmi.tasks;

import com.mathworks.toolbox.javabuilder.*;
import java.io.Serializable;
import java.util.logging.*;
import remote_proxy.Task;
import total_count_of_pixels_in_ROI.Class1;

public class PixelCountTask extends Class1 implements Task<Object[]>, Serializable {

    private final int[] pixels;
    public PixelCountTask(int[] pixels) throws MWException {
        this.pixels = pixels;
    }

    @Override
    public Object[] doTask() {
        return doTaskMWNumericArray();
    }

    private Object[] doTaskMWNumericArray() {
        int[] dimension = {1, pixels.length};
        MWNumericArray array = MWNumericArray.newInstance(dimension, pixels, MWClassID.INT32);
        try {
            return this.total_count_of_pixels_in_ROI(1, array);
        } catch (MWException ex) {
            Logger.getLogger(PixelCountTask.class.getName()).log(Level.SEVERE, null, ex);
            return null;
        }
    }
}
