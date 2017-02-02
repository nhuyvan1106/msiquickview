<%@page contentType="text/html" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="shiro" uri="http://shiro.apache.org/tags" %>

<!DOCTYPE html>
<html>
    <head>
        <title>MSI Quickview</title>
        <meta charset="UTF-8">
        <base href="Java-Matlab-Integration"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="front-end-frameworks/external/bootstrap-3.3.7-dist/css/bootstrap.min.css"/>
        <link rel="stylesheet" href="front-end-frameworks/external/font-awesome-4.7.0/css/font-awesome.min.css"/>
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
            <header>
                <div class="menu-toggler-container">
                    <input type="checkbox" id='menu-toggler'/>
                    <span class='bar first-bar'></span>
                    <span class='bar second-bar'></span>
                    <span class='bar third-bar'></span>
                </div>
                <div class='app-title'>
                    MSI QUICKVIEW
                </div>
            </header>
            <nav class="main-menu" >
                <!-- Brand and toggle get grouped for better mobile display -->
                <ul class="menu">
                    <li class="menu-item-container">
                        <input type='radio' onclick="this.nextElementSibling.click()"/>
                        <a class="menu-item" target="_blank" href="http://172.18.10.36:5601/app/kibana#/discover/Scientist-Name,-Dataset-Name,-Notes,-Folder-Location,-m-slash-z-list,-m-slash-z-list-file-name-and-sheet-name,-%23-of-raw-files-per-dataset?_g=(refreshInterval:(display:Off,pause:!f,value:0),time:(from:now-15m,mode:quick,to:now))&_a=(columns:!('Scientist%20Name','%23%20Raw%20Files','Dataset%20Name',Notes,'Folder%20Location','User%20Selected%20m%2Fz%20list%20to%20save','m%2Fz%20Excel%20File','m%2Fz%20Excel%20File%20Sheet%20Name'),filters:!(),index:multi-modal,interval:auto,query:(query_string:(analyze_wildcard:!t,query:'*')),sort:!(_score,desc))">
                            <i class="fa fa-wpexplorer menu-item-icon" aria-hidden="true"></i>
                            <span class="menu-item-title">Discovery</span>
                        </a>
                    </li>
                    <li class="menu-item-container">
                        <input type='radio' onclick="this.nextElementSibling.click()"/>
                        <a class="menu-item" target="_blank" href="http://172.18.10.36:5601/app/kibana#/dashboard/Default-Mass-Spec-1?_g=(refreshInterval:(display:Off,pause:!f,value:0),time:(from:now-15m,mode:quick,to:now))&_a=(filters:!(),options:(darkTheme:!t),panels:!((col:1,id:%23-of-Datasets-per-Scientist-with-Dataset-Name-and-Date-of-acquisition,panelIndex:1,row:1,size_x:7,size_y:5,type:visualization),(col:1,id:%23-of-Raw-Files-Per-Dataset,panelIndex:2,row:6,size_x:4,size_y:9,type:visualization),(col:9,id:Aspect-Ratios-per-Dataset,panelIndex:3,row:6,size_x:4,size_y:9,type:visualization),(col:8,id:'Table-with-Scientist-Name-and-basic-stats-like-Unique-%23-of-user-selected-m-slash-z-list-to-save,-std-dev-of-%23-of-raw-files,-Average-%23-of-Raw-files',panelIndex:4,row:1,size_x:5,size_y:5,type:visualization),(col:1,columns:!('Scientist%20Name','%23%20Raw%20Files','Dataset%20Name',Notes,'Folder%20Location','User%20Selected%20m%2Fz%20list%20to%20save','m%2Fz%20Excel%20File','m%2Fz%20Excel%20File%20Sheet%20Name'),id:'Scientist-Name,-Dataset-Name,-Notes,-Folder-Location,-m-slash-z-list,-m-slash-z-list-file-name-and-sheet-name,-%23-of-raw-files-per-dataset',panelIndex:5,row:15,size_x:12,size_y:6,sort:!(_score,desc),type:search),(col:5,id:Dataset-Types-vs.-Scientists-for-Nano-Desi,panelIndex:6,row:6,size_x:4,size_y:5,type:visualization),(col:5,id:Avergae-%23-of-Raw-files-vs.-Dataset-Type,panelIndex:7,row:11,size_x:4,size_y:4,type:visualization)),query:(query_string:(analyze_wildcard:!t,query:'*')),title:'Default%20Mass%20Spec%201',uiState:(P-2:(spy:(mode:(fill:!f,name:table)))))">
                            <i class="fa fa-dashboard menu-item-icon" aria-hidden="true"></i>
                            <span class="menu-item-title">Dashboard</span>
                        </a>
                    </li>
                    <li class="menu-item-container">
                        <input id="upload-cdf-hdf" type="radio" name="main-menu"/>
                        <a class="menu-item">
                            <i class="fa fa-upload menu-item-icon" aria-hidden="true"></i>
                            <span class="menu-item-title">Upload .cdf / .hdf files</span>
                            <i class="fa fa-chevron-right more-icon" aria-hidden="true"></i>
                        </a>
                        <form name="upload-cdf-hdf-form" id="upload-cdf-hdf-form">
                            <div class="form-group">
                                <label class="label label-primary">Select Files</label>
                                <input type="file" multiple="multiple" required="required" class="form-control" name="files-to-upload" id="files-to-upload"/>
                            </div>
                            <div class="form-group">
                                <label class="label label-primary">Select Optical Image (Optional)</label>
                                <input accept="image/*" type="file" multiple="multiple" required="required" class="form-control" name="file-name" id="optical-image"/>
                            </div>
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
                    </li>
                    <li class="menu-item-container">
                        <input id="upload-excel" type="radio" name="main-menu"/>
                        <a class="menu-item">
                            <i class="fa fa-upload menu-item-icon" aria-hidden="true"></i>
                            <span class="menu-item-title">Upload excel file</span>
                            <i class="fa fa-chevron-right more-icon" aria-hidden="true"></i>
                        </a>
                        <form name="upload-excel-form" id="upload-excel-form">
                            <div class="form-group">
                                <label class="label label-primary">Select Excel File</label>
                                <input type="file" required="required" class="form-control" id="file-name"/>
                            </div>
                            <div class="form-group">
                                <label class="label label-primary">Select Files to Generate Images for</label>
                                <input type="file" multiple="multiple" required="required" class="form-control" id="file-names" style="width:275px"/>
                            </div>
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
                    </li>
                    <li class="menu-item-container">
                        <input id="show-uploaded-files" type="radio" name="main-menu"/>
                        <a class="menu-item">
                            <i class="fa fa-database menu-item-icon" aria-hidden="true"></i>
                            <span class="menu-item-title">Show uploaded files</span>
                            <i class="fa fa-chevron-right more-icon" aria-hidden="true"></i>
                        </a>
                        <form name="show-uploaded-files-form" id="show-uploaded-files-form">
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
                    </li>
                    <shiro:hasRole name="ADMIN">
                        <li class="menu-item-container">
                            <input type='radio' id='show-admin-console'/>
                            <a class="menu-item" onclick="return false">
                                <i class="fa fa-shield menu-item-icon" aria-hidden="true"></i>
                                <span class="menu-item-title">Admin Console</span>
                            </a>
                        </li>
                    </shiro:hasRole>
                    <li class="menu-item-container">
                        <input id="show-edit-account-details" type='radio'/>
                        <a class="menu-item" onclick="return false">
                            <i class="fa fa-pencil menu-item-icon" aria-hidden="true"></i>
                            <span class="menu-item-title">Edit account details</span>
                        </a>
                    </li>   
                    <li class="menu-item-container">
                        <input type='radio' onclick="this.nextElementSibling.click()"/>
                        <a id="logout" class="menu-item" href='logout'>
                            <i class="fa fa-power-off menu-item-icon" aria-hidden="true"></i>
                            <span class="menu-item-title">Logout</span>
                        </a>
                    </li>
                </ul>
            </nav>

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
                                <i class="fa fa-chevron-down" aria-hidden="true"></i>
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
            <footer style="z-index:0;text-align:center;font-size:small;margin-top:20px;position:relative;margin-bottom:1em;">
                <a onclick="return false;" id="pub">Publications</a>&nbsp;&nbsp;|&nbsp;&nbsp;
                <a onclick="return false;" id="usage-guide">Usage Guide</a>&nbsp;&nbsp;|&nbsp;&nbsp;
                <a onclick="return false;" id="contact-us" >Contact Us</a>
            </footer>

            <div class="window my-dialog publications"></div>
            <div class="window my-dialog how-to"></div>
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
                                <i class="fa fa-chevron-right" aria-hidden="true"></i>
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
            <shiro:hasRole name="ADMIN">
                <div class="admin-console" style='display:none'>
                </div>
            </shiro:hasRole>
            <div class='edit-account-details-container'></div>
            <div id="frag"></div>
        </div>
        <i class="spinner fa fa-spinner fa-pulse" style="position:absolute;left:48%;font-size:8em;line-height:100%;display:none;z-index:25"></i>
        <script src="front-end-frameworks/javascript/main.js"></script>
        <script>
                    (function ($) {
                        // main menu toggle
                        $("#menu-toggler").change(function () {
                            if (this.checked)
                                $(".main-menu").removeClass("slide-to-left").addClass("slide-from-left");
                            else {
                                $(".main-menu").addClass("slide-to-left")
                                        .removeClass("slide-from-left")
                                        .find('input[name="main-menu"]')
                                        .prop('checked', false)
                                        .change();
                            }
                        });

                        // When the user clicks anywhere else except for the main menu itself and its children
                        // We close it
                        $(document.documentElement).click(function (event) {
                            $(".floating-list").fadeOut();
                            $(".app-dropdown-menu ul").fadeOut();
                            $('#uploaded-files-container').removeClass('slide-to-right')
                                    .addClass('slide-to-right');
                            var isMainMenuOpen = $(".main-menu").offset().left === 0;
                            var isMenuToggler = event.target.id === 'menu-toggler';
                            var isMainMenuItem = event.target.name === 'main-menu';
                            var isFormElem = $("form").has(event.target).length !== 0;
                            var isForm = event.target.tagName === "FORM";
                            if (isMainMenuOpen && !isMenuToggler && !isMainMenuItem && !isFormElem && !isForm)
                                $("#menu-toggler").prop("checked", false).change();
                        });

                        $("#show-edit-account-details").click(function () {
                            var successCallback = function (body) {
                                pnnl.dialog.createDialog("edit-account-details-dialog")
                                        .setHeaderTitle("Edit Account Details")
                                        .setCloseActionButton()
                                        .setPositiveButton("Save", function () {
                                            if (!pnnl.validation.validateNotEmpty("security-check-form"))
                                                return;
                                            var editedInputElems = {};
                                            var passwordRepeatElem = document.forms["edit-account-details-form"].elements["password-repeat"];
                                            if ($('#edit-account-details-form #password-repeat').data('state') !== $('#edit-account-details-form #password').data('state')) {
                                                pnnl.dialog.showToast(new Error('Password and password repeat don\'t match'), 'Make sure your new password conforms to our guidelines.');
                                                return;
                                            } else if (passwordRepeatElem.dataset.state === 'valid')
                                                editedInputElems['password-repeat'] = passwordRepeatElem.value;

                                            $(".security-questions-container .selected-question-id")
                                                    .filter(function () {
                                                        return this.id !== 'none' && $('#edit-account-details-form #' + this.dataset.for).data('state') === 'valid';
                                                    })
                                                    .each(function () {
                                                        var questionToEdit = this;
                                                        var $matchedQuestionId = $('#security-check-form .question').filter(function () {
                                                            // questionToEdit.id contains the id of the newly selected question
                                                            // we are comparing it to the questions that the user selected at account registration
                                                            // if both ids matches, they just want to change the answer, so we need to use correct id(primary key)
                                                            // for the corresponding accountSecurityQuestion row. Otherwise, we can just update any of the 3 rows in
                                                            // account quetion answer table that correspond to this user. That way they won't have 2 questions with the same content.
                                                            return questionToEdit.id === this.dataset.questionId;
                                                        });
                                                        var key;
                                                        //$matchedQuestionIds must be 1 or 0, or else, there is a bug
                                                        if ($matchedQuestionId.length === 1)
                                                            key = $matchedQuestionId.data('accountQuestionPrimaryKey');
                                                        else if ($matchedQuestionId.length === 0)
                                                            key = questionToEdit.dataset.accountQuestionPrimaryKey;
                                                        else
                                                            console.error('There is a bug');
                                                        editedInputElems[key] = {
                                                            questionId: questionToEdit.id,
                                                            answer: $('#' + questionToEdit.dataset.for).val()
                                                        };
                                                        console.log($matchedQuestionId.get());
                                                    });
                                            console.log(editedInputElems);
                                            if (Object.keys(editedInputElems).length > 0)
                                                $.ajax("security/accounts/<%= org.apache.shiro.SecurityUtils.getSubject().getPrincipal()%>", {
                                                    contentType: "application/json",
                                                    method: "PUT",
                                                    data: JSON.stringify(editedInputElems),
                                                    success: function () {
                                                        pnnl.dialog.showToast(null, "Account details updated successfully.<br/>You will be automatically signed out in 5 seconds");
                                                        setTimeout(function () {
                                                            document.querySelector("#logout").click();
                                                        }, 5000);
                                                    },
                                                    error: function () {
                                                        pnnl.dialog.showToast(new Error("Internal Server Error"), "Something went wrong. Please try again or contact site admin.");
                                                    }
                                                });
                                            else
                                                pnnl.dialog.showToast(null, 'Nothing was updated');
                                            this.hide();
                                        })
                                        .setNegativeButton("Cancel")
                                        .setDialogBody(body)
                                        .setOnOpenCallback(function (dialogId) {
                                            // Get the current account details to populate the form, e.g. username, email, list of questions
                                            $.ajax("security/accounts/<%= org.apache.shiro.SecurityUtils.getSubject().getPrincipal()%>", {method: "GET", dataType: "json"})
                                                    .then(function (accountObj) {
                                                        $(dialogId + " #username").text(accountObj.primaryKey);
                                                        $(dialogId + " #email").val(accountObj.email);
                                                        accountObj.questions.forEach(function (question, index) {
                                                            $('#security-check-form #check-question-' + (index + 1))
                                                                    .text(question.questionContent)
                                                                    .nextAll("input")
                                                                    .attr("data-account-question-primary-key", question.accountQuestionPrimaryKey)
                                                                    .attr('data-question-id', question.questionId);
                                                            $('#edit-account-details-form .selected-question-id:nth-child(' + (index + 1) + ')').attr('data-account-question-primary-key', question.accountQuestionPrimaryKey);
                                                        });
                                                        pnnl.utils.populateQuestions();
                                                        $(".security-questions-container > div > a")
                                                                .click(function (event) {
                                                                    event.preventDefault();
                                                                    pnnl.utils.filterOutSelectedQuestions(this);
                                                                })
                                                                .find('span')
                                                                .attr('id', 'none');
                                                    })
                                                    .catch(function (xhr) {
                                                        console.log(xhr, "Something went wrong, please try again");
                                                    });
                                            $('#edit-account-details-dialog .positive-btn').attr('disabled', 'disabled');
                                            pnnl.validation.initValidationForInput("#edit-account-details-form #email", [/[^@]@[^@]/g], "Invalid email format");
                                            pnnl.validation.initValidationForInput("#edit-account-details-form #password", [/[a-z]+/g, /[A-Z]+/g, /\d+/g, /[_!@#$]+/g, /^.{8,100}$/g], "Valid password must contain a combination of lowercase and uppercase letters, numbers, and one or more of these special characters <strong>!</strong>, <strong>@</strong>, <strong>#</strong>, <strong>$</strong>, <strong>_</strong> and be between 8 to 100 characters long.");
                                            pnnl.validation.initValidationForInput("#edit-account-details-form #password-repeat", [new RegExp("", "g")], "Passwords don't match", "#edit-account-details-form #password");
                                            pnnl.validation.initValidationForInput("#edit-account-details-form .question input", [new RegExp("^[a-zA-Z0-9\\s]{4,}$")], "Valid answer must contain letters, numbers, and spaces only and be at least 4 characters long");
                                            pnnl.validation.initValidationForInput('#edit-account-details-form input[id*="answer"', [new RegExp("^[a-zA-Z0-9\\s]{4,}$")], "Valid answer must contain letters, numbers, and spaces only and be at least 4 characters long");

                                            $("#security-check-form #security-check").click(function () {
                                                if (!pnnl.validation.validateNotEmpty("security-check-form"))
                                                    return;
                                                var payload = {
                                                    password: $("#security-check-form #check-current-password").val(),
                                                    answers: $("#security-check-form .question")
                                                            .map(function () {
                                                                return {accountQuestionPrimaryKey: +this.dataset.accountQuestionPrimaryKey, answer: this.value};
                                                            }).get()
                                                };
                                                $.ajax("security/accounts/<%= org.apache.shiro.SecurityUtils.getSubject().getPrincipal()%>/authentication", {method: "POST", contentType: "application/json", data: JSON.stringify(payload)})
                                                        .then(function () {
                                                            $('#edit-account-details-form input[type="password"').prop("disabled", false);
                                                            pnnl.dialog.showToast(null, "Security checks were successful. You can now edit your account details.");
                                                            document.forms["security-check-form"].setAttribute("data-state", "valid");
                                                            $(dialogId + ' .positive-btn').attr('disabled', null);
                                                        })
                                                        .catch(function () {
                                                            pnnl.dialog.showToast(new Error("Authentication Failed"), "Some of the answers did not match what we have in our records. Please try again.");
                                                            $('#edit-account-details-dialog .positive-btn').attr('disabled', 'disabled');
                                                        });
                                            });
                                        })
                                        .show(true);
                            };
                            getHtmlFragment('edit-account-details-form-fragment.html', successCallback, true);
                        });

                        $("#dataset-selection-toggler, #color-map-selection-toggler").click(function (event) {
                            event.stopImmediatePropagation();
                            $(this).next("ul").fadeToggle();
                        });
                        $("#load-more-toggler, #select-a-tool-toggler").click(function (event) {
                            event.stopImmediatePropagation();
                            if (this.getAttribute("disabled") !== "disabled")
                                $(this).next("ul").fadeToggle();
                        });
                        $(".color-map-list canvas").each(function () {
                            var colors = "0,2,4,6,8,10,12,14,16,18,20,22,24,26,28,30,32,34,36,38,40,42,44,46,48,50,52,54,56,58,60,62,64,66,68,70,72,74,76,78,80,82,84,86,88,90,92,94,96,98,100,102,104,106,108,110,112,114,116,118,120,122,124,126,128,130,132,134,136,138,140,142,144,146,148,150,152,154,156,158,160,162,164,166,168,170,172,174,176,178,180,182,184,186,188,190,192,194,196,198,200,202,204,206,208,210,212,214,216,218,220,222,224,226,228,230,232,234,236,238,240,242,244,246,248,250,252,255";
                            var ctx = this.getContext("2d");
                            var imageData = ctx.getImageData(0, 0, 128, 1);
                            var data = imageData.data;
                            var colorMap = [];
                            switch (this.id) {
                                case "red":
                                    colors.split(",")
                                            .forEach(function (color) {
                                                colorMap.push(parseInt(color), 0, 0, 255);
                                            });
                                case "green":
                                    colors.split(",")
                                            .forEach(function (color) {
                                                colorMap.push(0, parseInt(color), 0, 255);
                                            });
                                    break;
                                case "blue":
                                    colors.split(",")
                                            .forEach(function (color) {
                                                colorMap.push(0, 0, parseInt(color), 255);
                                            });
                                    break;
                            }
                            for (var i = 0; i < colorMap.length; i++)
                                data[i] = colorMap[i];
                            ctx.putImageData(imageData, 0, 0);
                        }).click(function () {
                            $(".selected-color-map").attr("id", this.id).text(this.id);
                        });

                        $("#tabs-container")
                                .draggable({"handle": ".header"})
                                .find(".tab")
                                .click(function (event) {
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
                                        $("#" + $this.data("activate"))
                                                .fadeIn()
                                                .find("li")
                                                .css("background-color", "white");
                                        $("#add-roi, #upload-optical-image").css("display", "none");
                                        if (this.id === "images-tab" || this.id === "optical-tab" || this.id === "rois-roiImages-tab") {
                                            $("#quantity #current")
                                                    .text(this.dataset.currentQuantity)
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
                                                $("#tools, #tools > a").css("visibility", "hidden");
                                                document.querySelector("#add-roi").style.display = "inline-block";
                                            } else if (this.id === "optical-tab")
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

                        $(".main-menu input[name='main-menu']").change(function () {
                            $(".validation-error-dialog").fadeOut(400, function () {
                                $(this).remove();
                            });
                        });
                        var handle;
                        $(".forward").click(function (event) {
                            event.stopImmediatePropagation();
                            handle = setInterval(function () {
                                $(".next").get(0).click();
                            }, 500);
                        });

                        $(".backward").click(function (event) {
                            event.stopImmediatePropagation();
                            handle = setInterval(function () {
                                $(".prev").get(0).click();
                            }, 500);
                        });

                        $(".stop").click(function (event) {
                            event.stopImmediatePropagation();
                            clearInterval(handle);
                        });

                        $("footer #pub").click(function (event) {
                            event.stopImmediatePropagation();
                            var successCallback = function (pubFragment) {
                                d3.select('.publications')
                                        .html(pubFragment)
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
                                        .delay(function (d, i) {
                                            return i * 100;
                                        })
                                        .style("left", "0px")
                                        .style("opacity", "1");
                                $(".publications .my-dialog-close-btn").click(function (event) {
                                    event.stopImmediatePropagation();
                                    // .publications element
                                    $(this.parentElement.parentElement).fadeOut(400, function () {
                                        $(this).css("opacity", "0")
                                                .find(".my-dialog-body")
                                                .css("opacity", "0")
                                                .find("li")
                                                .css({"opacity": "0", "left": "500px"});
                                    });
                                });
                            };
                            getHtmlFragment('publications-fragment.html', successCallback, d3.select('.publications > *').empty());
                        });


                        $("footer #usage-guide").click(function (event) {
                            event.stopImmediatePropagation();
                            var $HowtoContainer = $('.how-to');
                            var successCallback = function (fragment) {
                                $HowtoContainer.html(fragment)
                                        .fadeIn();
                            };
                            getHtmlFragment('usage-guide-fragment.html', successCallback, $HowtoContainer.children().length === 0);
                        });
                        $("footer #contact-us").click(function (event) {
                            event.stopImmediatePropagation();
                            $(".contact-us").fadeIn();
                        });

                        $(".my-dialog-close-btn").click(function () {
                            $(".my-dialog").fadeOut();
                        });

                        $(".warp-window .my-dialog-close-btn").click(function () {
                            $(".my-dialog").fadeOut();
                            document.querySelector("#select-a-tool-toggler").removeAttribute("disabled");
                            document.querySelectorAll(".warp-window canvas").forEach(function (canvas) {
                                canvas.getContext("2d").clearRect(0, 0, 320, 235);
                            });
                        });
                        $("#remove-images").click(function () {
                            $("#ion-image-container > *").remove();
                        });

                        $("#show-admin-console").click(function () {
                            var $AdminConsoleContainer = $('.admin-console');
                            var successCallback = function (fragment) {
                                if (fragment)
                                    $AdminConsoleContainer.html(fragment);
                                $AdminConsoleContainer.fadeIn();
                            };
                            getHtmlFragment('admin-console-fragment.html', successCallback, $AdminConsoleContainer.children().length === 0);
                        });
                        // retrievePredicate: under what condition should the ajax call be made to retrieve the fragment
                        // just another way to prevent hitting the server too much
                        function getHtmlFragment(fragmentName, successCallback, retrievePredicate) {
                            if (arguments.length !== 3)
                                console.log('Incorrect number of parameters passed. Required fragmentName, successCallback, retrievePredicate');
                            if (retrievePredicate)
                                $.ajax('protected/' + fragmentName)
                                        .then(function (html) {
                                            successCallback(html);
                                        });
                        }
                    })(jQuery);
        </script>
    </body>
</html>