package rmi.tasks;

import com.mathworks.toolbox.javabuilder.MWException;
import java.util.logging.Level;
import java.util.logging.Logger;
import remote_proxy.Task;
import send_data_to_Proven.Class1;

public class ProvenanceDataTask extends Class1 implements Task<Void> {

    private String inputNames = "{'ApplicationName'; 'uniqueID'; 'date'; 'scientistName'; 'notes'; 'datasetName'; "
            + "'folderLocation'; 'numRawFiles'; 'rawStartNo'; 'aspectRatio'; 'mzRange'; 'mzPlotVals'; 'mzPlotValsThresh'; "
            + "'normalizeData'; 'applyChangesToAllImages'; 'saveSettings'; 'redoImage'; 'redoImageExcelfileName'; "
            + "'redoImageExcelSheetName'; 'redoImageExcelmzRows'; 'redoImagePDFno'; 'exportPixelsValsToExcel'; "
            + "'alignImage'; 'removeLines'; 'interpolatedDataValues'; 'scaleImageValues'; 'colorMap'; 'saveImage'; "
            + "'imageListToSave'; 'dpiVal'; 'includeAxisImageSave'}";
    private String msiQuickViewVersion = "1.0";
    private String inputData = "{{'MSI QuickView'; 'A001'; '01/01/16'; 'Julia Laskin'; 'null'; 'null'; 'null'; 'null'; "
            + "'null'; 'null'; 'null'; 'null'; 'null'; 'null'; 'null'; 'null'; 'null'; 'null'; 'null'; 'null'; 'null'; "
            + "'null'; 'null'; 'null'; 'null'; 'null'; 'null'; 'null'; 'null'; 'null'; 'null'}";
    
    public ProvenanceDataTask(String version, String inputData) throws MWException {
        this.msiQuickViewVersion = version;
        this.inputData = inputData;
    }
    
    public ProvenanceDataTask(String inputData) throws MWException {
        this.inputData = inputData;
    }

    public ProvenanceDataTask() throws MWException {
    }
    
    @Override
    public Void doTask() {
        try {
            this.send_data_to_Proven(msiQuickViewVersion, inputNames, inputData);
        } catch (MWException ex) {
            Logger.getLogger(ProvenanceDataTask.class.getName()).log(Level.SEVERE, null, ex);
        }
        return null;
    }
    
}
