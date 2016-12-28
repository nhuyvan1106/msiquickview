<%@page contentType="text/html" pageEncoding="UTF-8"%>
<!DOCTYPE html>
<html>
    <head>
        <title>MSI Quickview</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="front-end-frameworks/external/bootstrap-3.3.7-dist/css/bootstrap.min.css"/>
        <link rel="stylesheet" href="front-end-frameworks/external/font-awesome-4.6.3/css/font-awesome.min.css"/>
        <link rel="stylesheet" href="front-end-frameworks/css/main.css"/>
        <link rel="stylesheet" href="front-end-frameworks/css/jquery-ui.min.css"/>
        <script src="https://code.jquery.com/jquery-3.1.1.min.js"></script>
        <script src="front-end-frameworks/external/jquery-ui.min.js"></script>
        <script src="front-end-frameworks/external/bootstrap-3.3.7-dist/js/bootstrap.min.js"></script>
        <script src="front-end-frameworks/external/d3/d3.4.0.0.min.js"></script>
        <script src="front-end-frameworks/external/saveSvgAsPng.js"></script>
        <script src="front-end-frameworks/javascript/pnnl.js"></script>        
    </head>
    <body>
        <div class="overlay" style="display:none;position:fixed;top:0;width:100%;margin:0;height:100%;z-index:20;background:rgba(0,256,256,0.25)"></div>
        
        <div class="wrapper">
            <div class="toggler">
                <i class="fa fa-arrow-right fa-2x" aria-hidden="true"></i>
            </div>
            <header>
                MSI QUICKVIEW
            </header>
            <nav class="closed" >
                <!-- Brand and toggle get grouped for better mobile display -->
                <div id="discoveryPage" class="">
                    <a target="_blank" href="http://172.18.10.36:5601/app/kibana#/discover/Scientist-Name,-Dataset-Name,-Notes,-Folder-Location,-m-slash-z-list,-m-slash-z-list-file-name-and-sheet-name,-%23-of-raw-files-per-dataset?_g=(refreshInterval:(display:Off,pause:!f,value:0),time:(from:now-15m,mode:quick,to:now))&_a=(columns:!('Scientist%20Name','%23%20Raw%20Files','Dataset%20Name',Notes,'Folder%20Location','User%20Selected%20m%2Fz%20list%20to%20save','m%2Fz%20Excel%20File','m%2Fz%20Excel%20File%20Sheet%20Name'),filters:!(),index:multi-modal,interval:auto,query:(query_string:(analyze_wildcard:!t,query:'*')),sort:!(_score,desc))">Discovery</a>
                </div>
                <div id="dashboard" class="">
                    <a target="_blank" href="http://172.18.10.36:5601/app/kibana#/dashboard/Default-Mass-Spec-1?_g=(refreshInterval:(display:Off,pause:!f,value:0),time:(from:now-15m,mode:quick,to:now))&_a=(filters:!(),options:(darkTheme:!t),panels:!((col:1,id:%23-of-Datasets-per-Scientist-with-Dataset-Name-and-Date-of-acquisition,panelIndex:1,row:1,size_x:7,size_y:5,type:visualization),(col:1,id:%23-of-Raw-Files-Per-Dataset,panelIndex:2,row:6,size_x:4,size_y:9,type:visualization),(col:9,id:Aspect-Ratios-per-Dataset,panelIndex:3,row:6,size_x:4,size_y:9,type:visualization),(col:8,id:'Table-with-Scientist-Name-and-basic-stats-like-Unique-%23-of-user-selected-m-slash-z-list-to-save,-std-dev-of-%23-of-raw-files,-Average-%23-of-Raw-files',panelIndex:4,row:1,size_x:5,size_y:5,type:visualization),(col:1,columns:!('Scientist%20Name','%23%20Raw%20Files','Dataset%20Name',Notes,'Folder%20Location','User%20Selected%20m%2Fz%20list%20to%20save','m%2Fz%20Excel%20File','m%2Fz%20Excel%20File%20Sheet%20Name'),id:'Scientist-Name,-Dataset-Name,-Notes,-Folder-Location,-m-slash-z-list,-m-slash-z-list-file-name-and-sheet-name,-%23-of-raw-files-per-dataset',panelIndex:5,row:15,size_x:12,size_y:6,sort:!(_score,desc),type:search),(col:5,id:Dataset-Types-vs.-Scientists-for-Nano-Desi,panelIndex:6,row:6,size_x:4,size_y:5,type:visualization),(col:5,id:Avergae-%23-of-Raw-files-vs.-Dataset-Type,panelIndex:7,row:11,size_x:4,size_y:4,type:visualization)),query:(query_string:(analyze_wildcard:!t,query:'*')),title:'Default%20Mass%20Spec%201',uiState:(P-2:(spy:(mode:(fill:!f,name:table)))))">Dashboard</a>
                </div>
                <div id="upload-cdf-hdf-container" class="">
                    <a id="upload-cdf-hdf" class="" data-activate="upload-cdf-hdf-form-container">
                        Upload .cdf / .hdf Files
                        <i class="fa fa-chevron-right fa-lg" aria-hidden="true" style="margin-left: 20px; margin-right: 0px;"></i>
                    </a>
                </div>
                <div id="upload-excel-container" class="">
                    <a id="upload-excel" class="" data-activate="upload-excel-form-container">
                        Upload Excel Files
                        <i class="fa fa-chevron-right fa-lg" aria-hidden="true" style="margin-left: 50px"></i>
                    </a>
                </div>
                <div id="show-uploaded-files-container" class="">
                    <a id="show-uploaded-files" class="" data-activate="show-uploaded-files-form-container">
                        Show Uploaded Files
                        <i class="fa fa-chevron-right fa-lg" aria-hidden="true" style="margin-left: 20px"></i>
                    </a>
                </div>
                <div id="logout-container" class="">
                    <a id="logout" class="" href="/Java-Matlab-Integration/logout">
                        Logout
                    </a>
                </div>
            </nav>        
            <div class="form-container" id="upload-cdf-hdf-form-container">
                <div style="text-align: right">
                    <i class="fa fa-close fa-2x close-btn"></i>
                </div>
                <form name="upload-cdf-hdf-form" id="upload-cdf-hdf-form">
                    <div class="form-group">
                        <label class="label label-primary">Select Files</label>
                        <input type="file" multiple="multiple" required="required" class="form-control" name="file-name" id="file-name"/>
                    </div>
                    <div class="form-group">
                        <label class="label label-primary">Select Optical Image (Optional)</label>
                        <input accept="image/*" type="file" multiple="multiple" required="required" class="form-control" name="file-name" id="optical-image"/>
                    </div>
<!--                    <div class="form-group">
                        <label class="label label-primary">Username</label>
                        <input type="text" required="required" class="form-control" name="user-dir" id="user-dir"/>
                    </div>-->
                    <div class="form-group">
                        <label class="label label-primary">DataSet Name</label>
                        <input type="text" required="required" class="form-control" name="dataset-name" id="dataset-name"/>
                    </div>
                    <div class="form-group">
                        <label class="label label-primary">Additional Notes (Optional)</label>
                        <textarea cols="36" rows="3" id="notes"></textarea>
                    </div>
                    <div class="form-group">
                        <button type="button" class="btn btn-default upload">
                            Upload
                        </button>
                    </div>
                </form>
            </div>
            <div class="form-container" id="upload-excel-form-container">
                <div style="text-align: right">
                    <i class="fa fa-close fa-2x close-btn"></i>
                </div>
                <form name="upload-excel-form" id="upload-excel-form">
                    <div class="form-group">
                        <label class="label label-primary">Select Excel File</label>
                        <input type="file" required="required" class="form-control" id="file-name"/>
                    </div>
                    <div class="form-group">
                        <label class="label label-primary">Select Files to Generate Images for</label>
                        <input type="file" multiple="multiple" required="required" class="form-control" id="file-names" style="width:275px"/>
                    </div>
<!--                    <div class="form-group">
                        <label class="label label-primary">Username</label>
                        <input type="text" required="required" class="form-control" name="user-dir" id="user-dir"/>
                    </div>-->
                    <div class="form-group">
                        <label class="label label-primary">DataSet Name</label>
                        <input type="text" required="required" class="form-control" name="dataset-name" id="dataset-name"/>
                    </div>
                    <div class="form-group">
                        <label class="label label-primary">Additional Notes (Optional)</label>
                        <textarea cols="36" rows="3" id="notes"></textarea>
                    </div>
                    <div class="form-group">
                        <button type="button" class="btn btn-default upload">
                            Upload
                        </button>
                    </div>
                </form>
            </div>
            <div class="form-container" id="show-uploaded-files-form-container">
                <div style="text-align: right">
                    <i class="fa fa-close fa-2x close-btn"></i>
                </div>
                <form name="show-uploaded-files-form" id="show-uploaded-files-form">
<!--                    <div class="form-group">
                        <label class="label label-primary">Username</label>
                        <input type="text" required="required" class="form-control" name="user-dir" id="user-dir"/>
                    </div>-->
                    <div class="form-group">
                        <label class="label label-primary">DataSet Name</label>
                        <input type="text" placeholder="Leave empty to target all datasets" required="required" class="form-control" name="dataset-name" id="dataset-name"/>
                    </div>
                    <div class="form-group">
                        <button type="button" class="btn btn-default show">
                            Show
                        </button>
                    </div>
                </form>
            </div>

            <div class="tabs-container" id="tabs-container">
                <div class="header">
                    <div class="dataset-selection">
                        <div>
                            <a href="" onclick="return false;" class="btn btn-default" id="dataset-selection-toggler">
                                <span id="selected-dataset">Select a data to view</span>
                                <i class="fa fa-chevron-right" aria-hidden="true"></i>
                            </a>
                            <ul class="floating-list"></ul>
                        </div>
                    </div>
                    <div id="load-more-container">
                        <div>
                            <a href="" onclick="return false;" class="btn btn-default" id="load-more-toggler">
                                <span>Load More</span>
                                <i class="fa fa-chevron-down" aria-hidden="true"></i>
                            </a>
                            <ul class="floating-list">
                                <li id="10">10</li>
                                <li id="20">20</li>
                                <li id="30">30</li>
                            </ul>
                        </div>

                        <div id="quantity">
                            <span id="current">10</span> / <span id="total">12</span>
                        </div>
                    </div>

                    <div id="tools">
                        <div>
                            <a class="btn btn-default" id="select-a-tool-toggler">
                                <span id="none">Select a tool</span>
                                <i class="fa fa-chevron-down" aria-hidden="true" style="margin-left: 70px;"></i>
                            </a>
                            <ul class="floating-list">
                                <li id="warp">Warp</li>
                                <li id="mark-up-window">Mark-Up Window</li>
                                <li id="overlay-window">Overlay Window</li>
                            </ul>
                        </div>
                        <a href="" onclick="event.preventDefault()" id="select-tool-cancel">
                            <i class="fa fa-close fa-2x" aria-hidden="true"></i>
                        </a>
                        <a href="" onclick="event.preventDefault()" id="select-tool-done">
                            <i class="fa fa-check fa-2x" aria-hidden="true"></i>
                        </a>
                    </div>

                    <div id="action-container">
                        <i class="fa fa-upload" id="upload-optical-image" title="Upload an optical image" aria-hidden="true"></i>
                        <i class="fa fa-plus" id="add-roi" aria-hidden="true" title="Create a new ROI" data-toggle="tooltip" data-placement="bottom"></i>
                        <i class="fa fa-refresh" id="refresh" aria-hidden="true" title="Refresh" data-toggle="tooltip" data-placement="bottom"></i>
                        <i style="text-align: right" class="fa fa-close fa-1x close-tab-btn" title="Close" data-toggle="tooltip" data-placement="bottom"></i>
                    </div>

                </div>
                <div class="tab-body" id="tab-body">
                    <div class="tabs">
                        <div class="tab" id="cdf-tab" data-activate="cdf-tab-content">cdf</div>
                        <div class="tab" id="hdf-tab" data-activate="hdf-tab-content">hdf</div>
                        <div class="tab" id="excel-tab" data-activate="excel-tab-content">excel</div>
                        <div class="tab" id="images-tab" data-activate="images-tab-content">images</div>
                        <div class="tab" id="optical-tab" data-activate="optical-tab-content">optical images</div>
                        <div class="tab" id="rois-roiImages-tab" data-activate="rois-roiImages-tab-content">ROI images</div>
                    </div>
                    <div class="tab-content" id="tab-content">
                        <div id="cdf-tab-content">
                            <ul></ul>
                        </div>
                        <div id="hdf-tab-content">
                            <ul></ul>
                        </div>
                        <div id="excel-tab-content">
                            <ul></ul>
                        </div>
                        <div id="images-tab-content">
                        </div>
                        <div id="optical-tab-content">
                        </div>
                        <div id="rois-roiImages-tab-content">
                        </div>
                    </div>
                </div>
            </div>
            <div class="buttons">
                <div id="tab-opener">
                    <i class="fa fa-long-arrow-up fa-lg" aria-hidden="true"></i>
                </div>

                <div id="status-container">
                    <a id="status-toggle" href="" onclick="event.preventDefault()">
                        <i class="fa fa-hourglass-o fa-medium" aria-hidden="true"></i>
                    </a>
                    <table id="status">
                        <tr>
                            <th>Dataset</th>
                            <th>Job For</th>
                            <th>Time Remaining</th>
                            <th>Status</th>
                        </tr>
                    </table>
                </div>
            </div>


            <div class="panels">
                <div class="panel-row">
                    <div class="panel">
                        <div class="panel-heading">
                            <div class="panel-title">
                                <h4>Intensity-Time Spectra</h4>
                            </div>
                        </div>
                        <div class="panel-body">
                            <div id="intensity-scan-chart-id"></div>
                            <div class="options">
                                <button type="button" class="btn btn-default prev" title="Show data for previous point">
                                    <i class="fa fa-arrow-left fa-1x"></i>
                                </button> 
                                <button type="button" class="btn btn-default next" title="Show data for next point">
                                    <i class="fa fa-arrow-right fa-1x"></i>
                                </button>
                                <button type="button" class="btn btn-default backward" title="Start continuous BACKWARD scroll through the different Scan Acquisition Times and corresponding Intensity vs m/z spectra">
                                    <i class="fa fa-fast-backward fa-1x"></i>
                                </button>
                                <button type="button" class="btn btn-default forward" title="Start continuous FORWARD scroll through the different Scan Acquisition Times and corresponding Intensity vs m/z spectra">
                                    <i class="fa fa-play fa-1x"></i>
                                </button>
                                <button type="button" class="btn btn-default stop" title="STOP continuous scroll through the different Scan Acquisition Times and corresponding Intensity vs m/z spectra">
                                    <i class="fa fa-stop fa-1x"></i>
                                </button>                                        
                            </div>
                        </div>
                    </div>
                    <div class="panel">
                        <div class="panel-heading">
                            <div class="panel-title">
                                <h4>Intensity-m/z Spectra</h4>
                            </div>
                        </div>
                        <div class="panel-body">
                            <div id="intensity-mass-chart-id"></div>
                        </div>
                    </div>

                </div>
                <div class="panel-row">
                    <div class="panel ion-image">
                        <div class="panel-heading">
                            <div class="panel-title">
                                <h4>Ion Image</h4>
                            </div>
                            <div class="options">
                                <a class="btn btn-default" id="remove-images" title="Remove all images"><i class="fa fa-trash-o" aria-hidden="true"></i></a>
                            </div>
                        </div>
                        <div class="panel-body">
                            <div id="ion-image-container" class="image-container"></div>
                        </div>
                    </div>
                </div>
            </div>
            <footer style="text-align:center;font-size:small;margin-top:20px;position:relative">
                <a href="" onclick="event.preventDefault()" id="pub">Publications</a>&nbsp;&nbsp;|&nbsp;&nbsp;
                <a href="" onclick="event.preventDefault()" id="usage-guide">Usage Guide</a>&nbsp;&nbsp;|&nbsp;&nbsp;
                <a href="" id="contact-us" onclick="event.preventDefault()">Contact Us</a>
            </footer>

            <div class="window my-dialog publications">
                <div class="my-dialog-header">
                    <div class="my-dialog-close-btn">
                        <i class="fa fa-close"></i>
                    </div>
                </div>
                <div class="my-dialog-body" onclick="event.stopImmediatePropagation()">
                    <ol>
                        <h4>References</h4>
                        <li>
                            Thomas M, BS Heath, J Laskin, D Li, EC Liu, KL Hui, AP Kuprat, K Kleese van Dam, and JP Carson.  2012.  "Visualization of High Resolution Spatial Mass Spectrometric Data during Acquisition."  In <em>2012 Annual International Conference of the IEEE Engineering in Medicine and Biology Society (EMBC), August 28 - September 1, San Diego, California</em>, pp. 5545-5548.  IEEE, Piscataway, NJ.  doi:10.1109/EMBC.2012.6347250
                            [<a target="_blank" href="http://ieeexplore.ieee.org/stamp/stamp.jsp?arnumber=6347250">Link</a>]
                        </li>
                        <li>
                            Lanekoff IT, BS Heath, AV Liyu, M Thomas, JP Carson, and J Laskin.  2012.  "An Automated Platform for High-Resolution Tissue Imaging Using Nanospray Desorption Electrospray Ionization Mass Spectrometry."  <em>Analytical Chemistry</em> 84(19):8351-8356
                            [<a target="_blank" href="http://pubs.acs.org/doi/abs/10.1021/ac301909a">Link</a>]
                        </li>
                        <li>
                            Kleese van Dam K, JP Carson, AL Corrigan, DR Einstein, ZC Guillen, BS Heath, AP Kuprat, IT Lanekoff, CS Lansing, J Laskin, D Li, Y Liu, MJ Marshall, EA Miller, G Orr, P Pinheiro da Silva, S Ryu, CJ Szymanski, and M Thomas.  2013.  "Velo and REXAN - Integrated Data Management and High Speed Analysis for Experimental Facilities."  In <em>Proceedings of the IEEE 8th International Conference on EScience, October 8-12, 2012, Chicago, Illinois</em>.  IEEE Press, Los Alamitos, CA.  doi: 10.1109/eScience.2012.6404463 
                            [<a target="_blank" href="http://ieeexplore.ieee.org/abstract/document/6404463/">Link</a>]
                        </li>
                        <li>
                            Lanekoff IT, M Thomas, JP Carson, JN Smith, C Timchalk, and J Laskin.  2013.  "Imaging Nicotine in Rat Brain Tissue by Use of Nanospray Desorption Electrospray Ionization Mass Spectrometry."  <em>Analytical Chemistry</em> 85(2):882-889.  doi:10.1021/ac302308p 
                            [<a target="_blank" href="http://pubs.acs.org/doi/abs/10.1021/ac302308p">Link</a>]
                        </li>
                        <li>
                            Lanekoff IT, KE Burnum-Johnson, M Thomas, JTL Short, JP Carson, J Cha, SK Dey, P Yang, MC Prieto Conaway, and J Laskin.  2013.  "High-Speed Tandem Mass Spectrometric in Situ Imaging by Nanospray Desorption Electrospray Ionization Mass Spectrometry."  <em>Analytical Chemistry</em> 85(20):9596-9603. doi:10.1021/ac401760s 
                            [<a target="_blank" href="http://pubs.acs.org/doi/abs/10.1021/ac401760s">Link</a>]
                        </li>
                        <li>
                            Lanekoff IT, M Thomas, and J Laskin.  2014.  "Shotgun Approach for Quantitative Imaging of Phospholipids Using Nanospray Desorption Electrospray Ionization Mass Spectrometry."  <em>Analytical Chemistry</em> 86(3):1872-1880.  doi:10.1021/ac403931r
                            [<a target="_blank" href="http://pubs.acs.org/doi/abs/10.1021/ac403931r">Link</a>]
                        </li>
                        <li>
                            Lanekoff IT, KE Burnum-Johnson, M Thomas, J Cha, SK Dey, P yang, M Prieto, and J Laskin.  2015.  "Three-Dimensional Imaging of Lipids and Metabolites in Tissues by Nanospray Desorption Electrospray Ionization Mass Spectrometry."  <em>Analytical and Bioanalytical Chemistry</em> 407(8):2063-2071. doi:10.1007/s00216-014-8174-0
                            [<a target="_blank" href="https://www.ncbi.nlm.nih.gov/pubmed/25395201">Link</a>]
                        </li>
                        <li>
                            Thomas M, K Kleese van Dam, MJ Marshall, AP Kuprat, JP Carson, CS Lansing, ZC Guillen, EA Miller, I Lanekoff, and J Laskin.  2015.  "Towards adaptive, streaming analysis of x-ray tomography data."  <em>Synchrotron Radiation News</em> 28(2):10-14.  doi:10.1080/08940886.2015.1013414
                            [<a target="_blank" href="http://www.tandfonline.com/doi/full/10.1080/08940886.2015.1013414">Link</a>]
                        </li>
                        <li>
                            Thomas M, J Laskin, B Raju, EG Stephan, TO Elsethagen, NYS Van, and SN Nguyen.  2016.  "Enabling Re-executable Workflows with Near-real-time Visualization, Provenance Capture and Advanced Querying for Mass Spectrometry Data."  In <em>NYSDS 2016 - Data-Driven Discovery</em>.  No publisher listed.  [In Press]
                        </li>
                        <h4>External Publications</h4>
                        <li>
                            Rao, W., Pan, N. & Yang, Z. J. Am. Soc. Mass Spectrom. 2015. "High Resolution Tissue Imaging Using the Single-probe Mass Spectrometry under Ambient Conditions." 26: 986. doi:10.1007/s13361-015-1091-4
                            [<a target="_blank" href="https://www.ncbi.nlm.nih.gov/pubmed/25804891">Link</a>]
                        </li>
                        <li>
                            Hilde-Marléne Bergman, Erik Lundin, Malin Andersson and Ingela Lanekoff: “Quantitative mass spectrometry imaging of small-molecule neurotransmitters in rat brain tissue sections using nanospray desorption electrospray ionization.” Analyst, 2016, 141, 3686. 
                            [<a target="_blank" href="https://www.ncbi.nlm.nih.gov/pubmed/26859000">Link</a>]
                        </li>
                        <li>
                            Rao, Wei et al. “High-Resolution Ambient MS Imaging of Negative Ions in Positive Ion Mode: Using Dicationic Reagents with the Single-Probe.” <em>Journal of the American Society for Mass Spectrometry</em> 27.1 (2016): 124–134. PMC. Web. 12 Sept. 2016.
                            [<a target="_blank" href="https://www.ncbi.nlm.nih.gov/pubmed/26489411">Link</a>]
                        </li>
                        <li>
                            Rao, W., Pan, N., Yang, Z. "Applications of the Single-probe: Mass Spectrometry Imaging and Single Cell Analysis under Ambient Conditions. J. Vis. Exp. (112), e53911, doi:10.3791/53911 (2016).
                            [<a target="_blank" href="https://www.ncbi.nlm.nih.gov/pubmed/27341402">Link</a>]
                        </li>
                    </ol>
                </div>
            </div>
            <div class="window my-dialog how-to">
                <div class="my-dialog-header">
                    <div class="my-dialog-close-btn">
                        <i class="fa fa-close"></i>
                    </div>
                </div>
                <div class="my-dialog-body" onclick="event.stopImmediatePropagation()">
                    <ul>
                        <li>
                            <strong><i style="display:inline-block;width:30px;line-height:30px;text-align:center;border:1px solid gray;border-radius:50%" class="fa fa-arrow-right" aria-hidden="true"></i>
                            </strong>: Display site menu.
                        </li>
                        <li>
                            <strong>Discovery</strong>: Navigate to Kibana Discovery page.
                        </li>
                        <li>
                            <strong>Dashboard</strong>: Navigate to Kibana Dashboard page.
                        </li>
                        <li>
                            <strong>Upload .cdf / .hdf Files</strong>: Display a form allowing to select files with either .cdf or .hdf format.
                            <ul>
                                <li>
                                    <strong>Select Files</strong>: (Required) Open file selection widget. All files selected <em>must</em> either have .cdf or .hdf extension.
                                </li>
                                <li>
                                    <strong>Username</strong>: (Required) Files uploaded will be stored
                                    inside a central storage location under a folder specific to a particular user
                                    . This application uses this unique username to generate a separate folder 
                                    for each unique user<strong>. Please choose a unique name</strong> to identify this location on the server. This name
                                    will be needed later on to access uploaded files or to upload new files.
                                </li>
                                <li>
                                    <strong>Dataset Name</strong>: (Required) Name of the dataset corresponding to the files being uploaded.
                                </li>
                                <li>
                                    <strong>Additional Notes (Optional)</strong>: This field is optional.
                                </li>
                            </ul>
                        </li>
                        <li>
                            <strong>Upload Excel File</strong>: Entry point to a long-running backend process to
                            generate ion images from data in the uploaded excel file. Progress tracking is available as soon as the file is uploaded.
                            <ul>
                                <li>
                                    <strong>Select Excel File</strong>: (Required) Excel file to be uploaded and processed.
                                </li>
                                <li>
                                    <strong>Select Files to Generate Images for</strong>: (Required) For which files the images are generated.
                                    <em>Note:</em> The images are ONLY generated for .cdf or .hdf files which are already present on the server
                                    under the folder location specific to the current user.
                                </li>
                                <li>
                                    <strong>Username</strong>: (Required) Current user's folder location.
                                </li>
                                <li>
                                    <strong>Additional Notes (Optional)</strong>: This field is optional.
                                </li>
                            </ul>
                        </li>
                        <li>
                            <strong>Show Uploaded Files</strong>: A convenient widget enabling browsing through
                            the folder generated for the current user to view uploaded files.
                            <ul>
                                <li>
                                    <strong>Username</strong>: (Required) Folder location designated for the current user.
                                </li>
                                <li>
                                    <strong>Dataset Name</strong>: Retrieve uploaded files for a specific dataset
                                    or leave empty to view files for all available datasets.
                                </li>
                            </ul>
                        </li>
                    </ul>
                </div>
            </div>
            <div class='window my-dialog contact-us'>
                <div class="my-dialog-header">
                    <div class='my-dialog-title'>
                        Please forward any questions and concerns to
                    </div>
                    <div class="my-dialog-close-btn">
                        <i class="fa fa-close"></i>
                    </div>
                </div>
                <div class='my-dialog-body'>
                    <div class="email-container">
                        <span class="envelop"><i class="fa fa-envelope-square" aria-hidden="true"></i></span>
                        <a href="mailto:Mathew.Thomas@pnnl.gov" class="email">Mathew.Thomas@pnnl.gov</a>
                    </div>
                    <div class="email-container">
                        <span class="envelop"><i class="fa fa-envelope-square" aria-hidden="true"></i></span>
                        <a href="mailto:nhuy.van@pnnl.gov" class="email">Nhuy.Van@pnnl.gov</a>
                    </div>
                </div>
            </div>

            <div class='window my-dialog warp-window'>
                <div class="my-dialog-header">
                    <div class="my-dialog-close-btn">
                        <i class="fa fa-close"></i>
                    </div>
                </div>
                <div class='my-dialog-body'>
                    <div>
                        <img id="left-image" src=""/>
                        <canvas id="left-canvas" width="320" height="235"></canvas>
                        <button type="button" class="clear">Clear</button>
                    </div>
                    <div>
                        <img id="right-image" src=""/>
                        <canvas id="right-canvas" width="320" height="235"></canvas>
                        <button type="button" class="clear">Clear</button>
                    </div>
                    <br/>
                    <button type="button" id="done" disabled="disabled">Done</button>
                </div>
            </div>
            <div class="overlay-window window my-dialog" id="overlay-window">
                <div class="header">
                    <div class="color-map-selection">
                        <div>
                            <a class="btn btn-default" id="color-map-selection-toggler">
                                <span class="selected-color-map" id="none">Select a color map</span>
                                <i class="fa fa-chevron-right" aria-hidden="true" style="margin-left: 70px;"></i>
                            </a>
                            <ul class="floating-list color-map-list">
                                <li>
                                    <canvas id="red" width="128" height="1"></canvas>
                                </li>
                                <li>
                                    <canvas id="green" width="128" height="1"></canvas>
                                </li>
                                <li>
                                    <canvas id="blue" width="128" height="1"></canvas>
                                </li>
                            </ul>
                        </div>

                    </div>
                    <div id="action-container">
                        <i style="text-align: right" class="fa fa-close fa-1x close-tab-btn" title="Close" data-toggle="tooltip" data-placement="bottom"></i>
                    </div>

                </div>
                <div class="tab-body" id="tab-body">
                    <div class="tabs image-names">
                    </div>
                    <div class="tab-content overlay-images" id="tab-content">
                        <div class="overlay-images-container" id="overlay-images-container"></div>
                    </div>
                </div>
            </div>
            <div class="roi-metadata">
                <form name="roi-metadata">
                    <div class="form-group">
                        <label class="label label-primary">Name</label>
                        <input type="text" class="form-control" id="roi-name"/>
                    </div>
                    <div class="form-group">
                        <label class="label label-primary">Description (Optional)</label>
                        <textarea cols="10" rows="3" class="form-control" id="roi-description"></textarea>
                    </div>
                    <button type="button" id="clear" class="btn btn-default">Clear</button>
                    <button type="button" id="done" class="btn btn-default">Done</button>
                </form>
            </div>
        </div>
        <i class="spinner fa fa-spinner fa-pulse" style="position:absolute;left:48%;font-size:8em;line-height:100%;display:none;z-index:25"></i>
        <script src="front-end-frameworks/javascript/main.js"></script>
        <script>
            
            (function ($) {
                /*
                 * Static behaviors of UI components that are likely never changed should be defined here so 
                 * they can be set up on page load, any code that talks to a server should be implemented in a separate file.
                 */
                var nav = d3.select("nav");
                nav.selectAll("div").each(function (p, index) {
                    $(this).css("top", index * 104 + index * 5 + "px");
                });
                $(".toggler").click(function (event) {
                    event.stopImmediatePropagation();
                    nav.selectAll("div").classed("selected", false);
                    if (nav.classed("closed")) {
                        nav.classed("closed", false)
                                .selectAll("div")
                                .transition()
                                .ease(d3.easeBackOut)
                                .duration(700)
                                .delay(function (d, index) {
                                    return index * 90;
                                })
                                .style("opacity", 1)
                                .style("left", "0px");
                        d3.select(this).transition().duration(500).style("transform", "rotate(180deg)");
                    } else {
                        nav.classed("closed", true)
                                .selectAll("div")
                                .transition()
                                .duration(500)
                                .ease(d3.easeBackIn)
                                .delay(function (p, index, group) { return (group.length - index) * 90; })
                                .style("opacity", "0")
                                .style("left", "-300px");
                        $(".form-container").fadeOut();
                        $(".validation-error-dialog").fadeOut(400, function () { $(this).remove(); });
                        d3.select(this).transition().duration(500).style("transform", "rotate(0deg)");
                    }
                });
                $(document.documentElement).click(function (event) {
                    if (!$.contains($("nav").get(0), event.target) && $(".form-container").has(event.target).length === 0
                            && !$(event.target).hasClass("form-container") && !$("nav").hasClass("closed"))
                        $(".toggler").click();
                    $(".context-menu-dialog").hide();
                    $(".floating-list").fadeOut();
                });
                $("#dataset-selection-toggler, #color-map-selection-toggler").click(function (event) {
                    event.stopImmediatePropagation();
                    $(this).next("ul").fadeToggle();
                });
                $("#load-more-toggler, #select-a-tool-toggler").click(function () {
                    event.stopImmediatePropagation();
                    if (this.getAttribute("disabled") !== "disabled")
                        $(this).next("ul").fadeToggle();
                });
                $(".color-map-list canvas").each(function() {
                    var colors = "0,2,4,6,8,10,12,14,16,18,20,22,24,26,28,30,32,34,36,38,40,42,44,46,48,50,52,54,56,58,60,62,64,66,68,70,72,74,76,78,80,82,84,86,88,90,92,94,96,98,100,102,104,106,108,110,112,114,116,118,120,122,124,126,128,130,132,134,136,138,140,142,144,146,148,150,152,154,156,158,160,162,164,166,168,170,172,174,176,178,180,182,184,186,188,190,192,194,196,198,200,202,204,206,208,210,212,214,216,218,220,222,224,226,228,230,232,234,236,238,240,242,244,246,248,250,252,255";
                    var ctx = this.getContext("2d");
                    var imageData = ctx.getImageData(0,0,128,1);
                    var data = imageData.data;
                    var colorMap = [];
                    switch (this.id) {
                        case "red":
                           colors.split(",")
                                    .forEach(function(color) { colorMap.push(parseInt(color),0,0,255); });
                        case "green":
                           colors.split(",")
                                    .forEach(function(color) { colorMap.push(0,parseInt(color),0,255); });
                           break;
                        case "blue":
                           colors.split(",")
                                    .forEach(function(color) { colorMap.push(0,0,parseInt(color),255); });
                           break;
                    }
                    for (var i = 0; i < colorMap.length; i++)
                        data[i] = colorMap[i];
                    ctx.putImageData(imageData,0,0);
                }).click(function() { 
                    $(".selected-color-map").attr("id", this.id).text(this.id); 
                });
                
                $("#tabs-container").draggable({"handle": ".header"}).find(".tab").click(function (event) {
                    event.stopImmediatePropagation();
                    var $this = $(this);
                    if (this.id !== $(".active-tab").attr("id")) {
                        $(".roi-metadata").fadeOut();
                        $(".validation-error-dialog").remove();
                        $(".tab").each(function () {
                            $(this).removeClass("active-tab");
                            $("#" + $(this).data("activate")).hide();
                        });
                        $this.addClass("active-tab");
                        $("#" + $this.data("activate")).fadeIn()
                                .find("li")
                                .each(function (i, e) { $(e).css("background-color", "white");});
                        $("#add-roi, #upload-optical-image").css("display","none");
                        if (this.id === "images-tab" || this.id === "optical-tab" || this.id === "rois-roiImages-tab") {
                            $("#quantity #current").text(this.dataset.currentQuantity)
                                        .next()
                                        .text(this.dataset.totalQuantity);
                            if (document.querySelector("#select-a-tool-toggler span").id !== "none")
                                document.querySelector("#tools #select-tool-cancel").style.visibility = "visible";
                            if (document.querySelectorAll(".selected-image").length === 2)
                                document.querySelector("#tools #select-tool-done").style.visibility = "visible";
                            if (this.dataset.currentQuantity === this.dataset.totalQuantity)
                                document.querySelector("#load-more-toggler").setAttribute("disabled", "disabled");
                            else
                                document.querySelector("#load-more-toggler").removeAttribute("disabled");
                            $("#load-more-container, #tools").css("visibility", "visible");

                            if (this.id === "rois-roiImages-tab") {
                                $("#tools, #tools > a").css("visibility","hidden");
                                document.querySelector("#add-roi").style.display = "inline-block";
                            }
                            else if (this.id === "optical-tab")
                                document.querySelector("#upload-optical-image").style.display = "inline-block";
                        } else
                            $("#load-more-container, #tools, #select-tool-cancel, #select-tool-done").css("visibility", "hidden");
                    }
                });

                $(".close-btn").click(function (event) {
                    event.stopImmediatePropagation();
                    d3.selectAll(".validation-error-dialog")
                            .transition()
                            .style("opacity", 0)
                            .duration(500)
                            .remove();
                    $(this).parent().parent().fadeOut();
                });

                $(".close-tab-btn").click(function (event) {
                    event.stopImmediatePropagation();
                    var $parent = $(this.parentElement.parentElement.parentElement);
                    var offset = $parent.offset();
                    d3.select($parent.get(0))
                            .style("transform-origin", "0 100%")
                            .transition()
                            .duration(800)
                            .style("opacity", 0)
                            .style("transform", "translate(-" + offset.left + "px,"
                                    + (document.documentElement.clientHeight - 5 - offset.top - $parent.height() + pnnl.utils.getScrollTop())
                                    + "px) scale(0,0)");
                });
                $("#tab-opener").click(function (event) {
                    event.stopImmediatePropagation();
                    d3.select("#tabs-container")
                            .transition()
                            .duration(800)
                            .style("transform", "scale(1,1)")
                            .style("top", pnnl.utils.getScrollTop() + 80 + "px")
                            .style("opacity", 1);
                    d3.select(".overlay-window")
                            .transition()
                            .duration(800)
                            .style("transform", "scale(1,1)")
                            .style("top", pnnl.utils.getScrollTop() + 80 + "px")
                            .style("opacity", 1);
                });

                $("#upload-cdf-hdf, #upload-excel, #show-uploaded-files").click(function (event) {
                    event.stopImmediatePropagation();
                    $("nav > div").removeClass("selected");
                    $(this).parent().addClass("selected");
                    $(".form-container").fadeOut();
                    $(".validation-error-dialog").fadeOut(400, function () { $(this).remove(); });
                    $("#" + $(this).data("activate")).fadeIn().css({"left": $(this).width() + 10 + "px", "top": $(this).offset().top - 150 + "px"});
                });
                var handle;
                $(".forward").click(function (event) {
                    event.stopImmediatePropagation();
                    handle = setInterval(function () { $(".next").get(0).click(); }, 500);
                });

                $(".backward").click(function (event) {
                    event.stopImmediatePropagation();
                    handle = setInterval(function () { $(".prev").get(0).click(); }, 500);
                });

                $(".stop").click(function (event) {
                    event.stopImmediatePropagation();
                    clearInterval(handle);
                });

                $("footer #pub").click(function (event) {
                    event.stopImmediatePropagation();
                    d3.select(".publications")
                            .transition()
                            .duration(400)
                            .style("display", "block")
                            .style("opacity", "1")
                            .select(".my-dialog-body")
                            .style("opacity", "1")
                            .selectAll("li")
                            .transition()
                            .duration(800)
                            .ease(d3.easeCubicOut)
                            .delay(function (d, i) { return i * 100; })
                            .style("left", "0px")
                            .style("opacity", "1");
                });
                $("footer #usage-guide").click(function (event) {
                    event.stopImmediatePropagation();
                    $(".how-to").fadeIn();
                });
                $("footer #contact-us").click(function (event) {
                    event.stopImmediatePropagation();
                    $(".contact-us").fadeIn();
                });
                $(".publications .my-dialog-close-btn").click(function (event) {
                    event.stopImmediatePropagation();
                    $(".publications").fadeOut(400, function () {
                        $(this).css("opacity", "0")
                            .find(".my-dialog-body")
                            .css("opacity", "0")
                            .find("li")
                            .css({"opacity": "0", "left": "500px"});
                    });
                });
                $(".my-dialog-close-btn").click(function() {
                   $(".my-dialog").fadeOut(); 
                });

                $(".warp-window .my-dialog-close-btn").click(function() {
                   $(".my-dialog").fadeOut();
                   document.querySelector("#select-a-tool-toggler").removeAttribute("disabled");
                   document.querySelectorAll(".warp-window canvas").forEach(function(canvas) {
                      canvas.getContext("2d").clearRect(0,0,320,235); 
                   });
                });
                $("#remove-images").click(function () {
                    $("#ion-image-container > *").remove();
                });
            })(jQuery);
        </script>
    </body>
</html>