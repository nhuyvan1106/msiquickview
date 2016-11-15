/* global d3, pnnl */

(function ($) {
    // Immediately populates these form fiels using their respective data saved locally before.
    $("form #user-dir").val(localStorage.getItem("user-dir"));
    $("form #dataset-name").val(sessionStorage.getItem("dataset-name") ? sessionStorage.getItem("dataset-name") : "");
    d3.select("#upload-cdf-hdf-form .upload").on("click", function () {
        var url = "/Java-Matlab-Integration/UploaderServlet/upload";
        //window.history.pushState({}, "", url);
        d3.event.stopImmediatePropagation();
        if (!pnnl.validation.validate("upload-cdf-hdf-form", "notes", "optical-image"))
            return;
        else {
            var files = Array.prototype.map.call(document.getElementById("file-name").files, function (file) {
                return file;
            });
            
            var isCdf = files.every(function(file) { return file.name.endsWith("cdf"); });
            var isHdf = files.every(function(file) { return file.name.endsWith("hdf"); });
            if (!isCdf && !isHdf) {
                errorCallback("Please either select cdf or hdf files only");
                return;
            }
            $("#upload-cdf-hdf-form-container").delay(250).fadeOut();
            $(".toggler").click();
            $(".error-dialog").fadeOut();
            // Store user-entered directory and dataset name in browser-specific database to improve UX
            var userDir = document.getElementById("user-dir").value;
            var datasetName = document.getElementById("dataset-name").value;
            var notes = $("#upload-cdf-hdf-form #notes").val();
            // We are using D3 Dispatches module to handle updating icon when an item is clicked in file selection dialog.
            var dispatch = d3.dispatch("selectionchange");
            dispatch.on("selectionchange", function () {
                var fileList = [];
                $(".file-selection-dialog li i").each(function () {
                    $(this).removeClass("fa-check fa-hand-o-left");
                    fileList.push(this.parentElement.id);
                });
                window.sessionStorage.setItem("file-names", fileList.join(","));
                window.localStorage.setItem("user-dir", userDir);
                window.sessionStorage.setItem("dataset-name", datasetName);
                $(this).find("i").addClass("fa-hand-o-left");
            });
            $(".file-selection-dialog").fadeOut().remove();
            var ul = $("<ul></ul>");
            files.forEach(function (file) {
                var fileName = pnnl.data.getFileName(file);
                ul.append("<li id='" + fileName + "'>" + fileName + "<i class='fa fa-spinner fa-pulse file-upload-spinner' style='position: absolute; right: 20px; top: 15px;'></i></li>");
            });

            pnnl.dialog.newDialogBuilder()
                    .createAlertDialog("file-selection-dialog", "file-selection-dialog")
                    .setHeaderTitle("Uploading...", "file-selection-dialog-header")
                    .setCloseActionButton()
                    .setMessageBody(ul)
                    .show();
            $("#file-selection-dialog").draggable({"handle": ".file-selection-dialog-header"})
                    .disableSelection()
                    .css("position", "absolute");
            $(window).scroll(function () {
                $("#file-selection-dialog").css({"top": (pnnl.utils.getScrollTop() + 20) + "px"});
            });
            pnnl.data.upload(url, userDir, datasetName, files, document.getElementById("optical-image").files[0], isCdf ? "cdf" : "hdf", notes,
                    function () {
                        $(document.documentElement).off("contextmenu").contextmenu(function (event) {
                            showContextDialog(event, "", function () {
                                switch (this.id) {
                                    case "hide-dialog":
                                        $(".file-selection-dialog").fadeOut();
                                        break;
                                    case "show-dialog":
                                        $(".file-selection-dialog").fadeIn().css({"top": event.pageY, "left": event.pageX});
                                        break;
                                }
                            });
                        });
                        $(".file-selection-dialog .alert-dialog-header-title").html("Click on file to load");
                        d3.select(".file-selection-dialog").selectAll("li").each(function (d, i) {
                            $(this).find(".file-upload-spinner").removeClass("fa-pulse fa-spinner").addClass("fa-check");
                            d3.select(this).on("click", function () {
                                if (sessionStorage.getItem("file-name") !== this.id || d3.select(".intensity-scan-chart").empty()) {
                                    pnnl.draw.drawSpinner();
                                    pnnl.draw.drawOverlay();
                                    dispatch.call("selectionchange", this);
                                    loadData(localStorage.getItem("user-dir"), sessionStorage.getItem("dataset-name"), this.id);
                                }
                            });
                        });
                    }, errorCallback);
        }
    });

    d3.select("#upload-excel-form .upload").on("click", function () {
        var url = "/Java-Matlab-Integration/UploaderServlet/extract-excel";
        //window.history.pushState({}, "", url);
        d3.event.stopImmediatePropagation();
        if (!pnnl.validation.validate("upload-excel-form", "notes"))
            return;
        else {
            var $excelForm = $(this.parentElement.parentElement);
            $(".buttons #status").show();
            var notes = $excelForm.find("#notes").val();
            var excelFile = $excelForm.find("#file-name").get(0).files[0];
            var excelFilename = excelFile.name;
            var fileNames = Array.prototype.map.call($excelForm.find("#file-names").get(0).files, function(d) {
                return d.name;
            });
            if (fileNames.some(function(d) { return !d.endsWith("cdf") && !d.endsWith("hdf");})) {
                errorCallback("Selection must either contain .cdf or .hdf files only.");
                return;
            }

            if (!excelFilename.endsWith("xls") && !excelFilename.endsWith("xlsx")) {
                errorCallback("File selected is not an excel file");
                return;
            }
            $excelForm.parent().delay(250).fadeOut();
            $(".error-dialog").fadeOut();
            $(".toggler").click();
            var formData = new FormData();
            formData.append("user-dir", $excelForm.find("#user-dir").val());
            formData.append("dataset-name", $excelForm.find("#dataset-name").val());
            formData.append("file-type", fileNames.some(function(d) { return d.endsWith("cdf"); }) ? "cdf" : "hdf");
            formData.append("excel-file", excelFile);
            formData.append("notes", notes);
            var websocket = null;
            var statusDetail = null;
            var statusInterval = null;
            var xhr = new XMLHttpRequest();
            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4) {
                    websocket.close();
                    clearInterval(statusInterval);
                    statusDetail.select("#time-remaining").text("0 seconds");
                    if (xhr.status === 200)
                        statusDetail.select("#job-progress").text("Done");
                    else
                        statusDetail.select("#job-progress").text("Error Occurred");
                }
            };
            xhr.open("POST", url);
            xhr.send(formData);
            statusDetail = d3.select("#status-container #status")
                    .append("tr")
                    .attr("class", "status-detail");
            statusDetail.append("td")
                    .text($excelForm.find("#dataset-name").val());
            statusDetail.append("td")
                    .text(excelFilename);
            statusDetail.append("td")
                    .attr("id", "time-remaining")
                    .text("Calculating...");
            statusDetail.append("td")
                    .attr("id", "job-progress")
                    .text("In progress");
            showButtons("#status-toggle");
            setTimeout(function() {
                websocket = new WebSocket("ws://" + location.host + "/Java-Matlab-Integration/excel-task-status");
                websocket.onmessage = function(event) {
                    statusDetail.select("#time-remaining").text(event.data + " seconds");
                };
                statusInterval = setInterval(function() {
                    websocket.send("");
                }, 3000);
            }, 20000);
        }
    });

    $("#load-more-container li").click(function () {
        var url = "/Java-Matlab-Integration/DirectoryInspectorServlet/load-more-images";
        $(this).parent().fadeOut();
        var $currentImageTab = $(".active-tab");
        var current = parseInt($currentImageTab.attr("data-current-quantity"));
        var total = parseInt($currentImageTab.attr("data-total-quantity"));
        if (current < total) {
            var activeImageTab = $(".active-tab").attr("id").replace("-tab", "");
            var limit = parseInt(this.id);
            if (current + limit > total)
                limit = total - current;
            pnnl.draw.drawOverlay();
            pnnl.draw.drawSpinner();
            $.ajax(url, {
                "data": {"limit": limit, "dataset-name": $("#selected-dataset").text(), "user-dir": localStorage.getItem("user-dir"),
                    "image-folder": activeImageTab.replace("-", "/"), "image-names": d3.selectAll("#" + activeImageTab + "-tab-content .image-container div").nodes().map(function(e) { return d3.select(e).text(); }).join("|")},
                "method": "GET",
                "success": function (data) {
                    current += data.imageData.length;
                    $currentImageTab.attr("data-current-quantity", current).attr("data-total-quantity", data.total);
                    $("#current").text(current);
                    $("#total").text(data.total);
                    $("#load-more-toggler").attr("disabled", data.total === current ? "disabled" : null);
                    appendImages(data, $currentImageTab.attr("id") + "-content");
                    pnnl.draw.removeSpinnerOverlay();
                },
                "error": function (xhr) {
                    pnnl.draw.removeSpinnerOverlay();
                    errorCallback(xhr.statusText);
                }

            });
        }
    });
    $("#tools li").click(function() {
        $("#select-tool-cancel").click().css("visibility", "visible");
        var $selectedTool = $("#select-a-tool-toggler span");
        if (this.id !== $selectedTool.attr("id")) {
            $selectedTool.text(this.innerHTML).attr("id", this.id);
            switch (this.id) {
                case "warp":
                    $(".image-container img").filter(function(){
                        return !$(this.parentElement).hasClass("roi-image-container");
                    }).css("cursor","pointer").off("click").click(function() {
                        $(this).toggleClass("selected-image");
                        switch ($(".selected-image").length) {
                            case 0:
                            case 1:
                                $("#select-tool-done").css("visibility", "hidden");
                                break;
                            case 2:
                                var $selectedImages = $(".selected-image");
                                if ($selectedImages.filter(".optical-image").length === 0) {
                                    errorCallback("Please select 1 optical image");
                                    $selectedImages.last().removeClass("selected-image");
                                }
                                else if ($selectedImages.filter(".optical-image").length === 2) {
                                    errorCallback("Please select 1 optical image only");
                                    $selectedImages.last().removeClass("selected-image");
                                }
                                else
                                    $("#select-tool-done").css("visibility", "visible");
                                break;
                            default:
                                errorCallback("Please select 2 images at most");
                                this.className = this.className.replace("selected-image", "").trim();
                                break;
                        }
                   });
                   break;

                case "mark-up-window":
                    document.getElementById("rois-roiImages-tab").click();
                    break;

                case "overlay-window":
                    $(".overlay-window").draggable({handle: ".header"}).fadeIn();
                    d3.select(".image-names").selectAll("div")
                            .data($("#images-tab-content img").get())
                            .text(function(img) { return img.alt; })
                            .enter()
                            .append("div")
                            .text(function(img) { return img.alt; })
                            .on("click", function(img) {
                                $.ajax("/Java-Matlab-Integration/DataFetcherServlet/image-data", {
                                    method: "GET",
                                    Accept: "application/json",
                                    data: {
                                        "user-dir": localStorage.getItem("user-dir"),
                                        "dataset-name": $("#selected-dataset").text(),
                                        "fileName": img.alt.replace(".png", "")
                                    },
                                    success: function(data) {
                                        data.imageData.forEach(function(array) { 
                                            array.forEach(function(numStr, index) {
                                               array[index] = parseInt(numStr);
                                            });
                                        });
                                        var colors = "0,2,4,6,8,10,12,14,16,18,20,22,24,26,28,30,32,34,36,38,40,42,44,46,48,50,52,54,56,58,60,62,64,66,68,70,72,74,76,78,80,82,84,86,88,90,92,94,96,98,100,102,104,106,108,110,112,114,116,118,120,122,124,126,128,130,132,134,136,138,140,142,144,146,148,150,152,154,156,158,160,162,164,166,168,170,172,174,176,178,180,182,184,186,188,190,192,194,196,198,200,202,204,206,208,210,212,214,216,218,220,222,224,226,228,230,232,234,236,238,240,242,244,246,248,250,252,255";
                                        var colorMap = [];
                                        switch (document.querySelector(".selected-color-map").id) {
                                            case "green":
                                               colors.split(",")
                                                        .forEach(function(color) { colorMap.push("rgb(0,"+color+",0)"); });
                                               break;
                                            case "blue":
                                               colors.split(",")
                                                        .forEach(function(color) { colorMap.push("rgb(0,0,"+color+")"); });
                                               break;
                                            default:
                                            case "red":
                                            colors.split(",")
                                                     .forEach(function(color) { colorMap.push("rgb("+color+",0,0)"); });
                                             break;
                                        }
                                        var imgDimensions = getNaturalImageSize(img);
                                        drawImage({hasContextMenu:false,setOpacity:true,shouldNotTranslate:true,idName:"overlay-images-container",className:"overlay-image"},
                                            data.imageData,imgDimensions.height,imgDimensions.width, img.alt, colorMap
                                        );
                                    },
                                    error: function(xhr) {
                                        errorCallback(xhr.statusText);
                                    }
                                });
                            });
                    break;
           }
       }
    });
    var clickCoords = null;
    $("#select-tool-done").click(function(event) {
        event.stopImmediatePropagation();
        this.style.visibility = "hidden";
        switch (document.querySelector("#select-a-tool-toggler span").id) {
            case "warp":
                clickCoords = {
                    "left-canvas":[],
                    "right-canvas":[]
                };
                var warpWindow = d3.select($(".warp-window").draggable().fadeIn().get(0));
                var selectedImages = $(".selected-image").removeClass("selected-image").get();
                var opticalImg = selectedImages.filter(function(image) { return image.className.indexOf("optical-image") !== -1; })[0];
                var regularImg = selectedImages.filter(function(image) { return image.className.indexOf("optical-image") === -1; })[0];
                warpWindow.select("#left-image")
                    .attr("src", opticalImg.src)
                    .attr("alt", opticalImg.alt);
                warpWindow.select("#right-image")
                        .attr("src", regularImg.src)
                        .attr("alt", regularImg.alt);
                d3.selectAll(".warp-window canvas").on("click", function() {
                    if (clickCoords[this.id].length+1 > 6)
                        errorCallback("Please select at most 6 points");
                    else {
                        clickCoords[this.id].push(markClickPoint(this.getContext("2d"), d3.mouse(this), 2));
                        if (clickCoords["left-canvas"].length === 6 && clickCoords["right-canvas"].length === 6)
                            document.querySelector(".warp-window #done").removeAttribute("disabled");
                    }
                });
               break;

            case "mark-up-window":
                break;

            case "overlay-window":
                break;
        }
    });
    $("#select-tool-cancel").click(function() {
        document.querySelector("#select-tool-done").style.visibility =  "hidden";
        this.style.visibility = "hidden";
        var selectedTool = document.querySelector("#select-a-tool-toggler span");
        if (selectedTool.id === "overlay-window")
            $(".overlay-window").fadeOut(400, function() {
                this.style.top = "10%",
                this.style.transform = "translate(0px,0px) scale(1,1)",
                this.style.left = "5%",
                this.style.opacity = "1";
            });
        else {
            $(".image-container img").off("click").css("cursor", "initial");
            $(".selected-image").removeClass("selected-image");
            if (selectedTool.id === "mark-up-window") {
                $(".roi").remove();
                $(".roi-metadata").fadeOut().find("form").get(0).reset();
                $(".validation-error-dialog").remove();
            }
            else
                clickCoords = null;
        }
        selectedTool.id = "none";
        selectedTool.innerHTML = "Select a tool";

    });
    $(".warp-window #done").click(function() {
        $("#select-a-tool-toggler span").attr("id", "none").text("Select a tool");
        $(".warp-window").fadeOut();
        convertToRealCoords(clickCoords["left-canvas"], getNaturalImageSize(document.querySelector(".warp-window #left-image")));
        convertToRealCoords(clickCoords["right-canvas"], getNaturalImageSize(document.querySelector(".warp-window #right-image")));
        document.querySelector("#select-tool-cancel").style.visibility = "hidden";
        document.querySelector(".warp-window #done").setAttribute("disabled", "disabled");
        document.querySelectorAll(".warp-window canvas").forEach(function(canvas) {
            canvas.getContext("2d").clearRect(0,0,320,235); 
         });
        var requestParams = {
            opticalCoords: clickCoords["left-canvas"],
            regularCoords: clickCoords["right-canvas"],
            opticalName: document.querySelector("#left-image").alt,
            regularName: document.querySelector("#right-image").alt
        };
        console.log(clickCoords);
        clickCoords = null;
    });
    $(".warp-window .clear").click(function() {
        this.previousElementSibling.getContext("2d").clearRect(0,0,320,235);
        clickCoords[this.previousElementSibling.id] = [];
        $(".warp-window #done").attr("disabled", "disabled");
    });
    
    $("#upload-optical-image").click(function() {
        pnnl.dialog.newDialogBuilder()
                .createAlertDialog("upload-optical-image-dialog")
                .setHeaderTitle("Select optical image")
                .setCloseActionButton("", function() { 
                    pnnl.draw.removeSpinnerOverlay();
                    $(".validation-error-dialog").remove();
                })
                .setMessageBody("<form name='upload-optical-image-form' id='upload-optical-image-form'>"+
                                "<input class='form-control' type='file' accept='image/*' id='optical-image'/><br/></form>")
                .setPositiveButton("Done", function() {
                    console.log(this, Object.keys(this));
                    if (!pnnl.validation.validate("upload-optical-image-form"))
                        return;
                    pnnl.draw.removeSpinnerOverlay();
                    this.hide();
                    var file = document.forms["upload-optical-image-form"].firstElementChild.files[0];
                    pnnl.utils.ajaxPost("/Java-Matlab-Integration/UploaderServlet/optical", {opticalImageFile:file}, function() {
                        pnnl.dialog.newDialogBuilder()
                                        .createAlertDialog("notification-dialog")
                                        .setMessageBody("Image uploaded successfully")
                                        .removeHeader()
                                        .show(function (id) { $(id).fadeIn().delay(5000).fadeOut(400, function() { $(id).remove(); }); });
                    }, errorCallback);
            }, "btn btn-default").show(function(id) {
                pnnl.draw.drawOverlay();
                $(id).fadeIn();
            });
    });
                        
    $("#action-container #add-roi").click(function() {
        if (this.getAttribute("disabled") !== "disabled") {
            $("#select-a-tool-toggler span").attr("id", "mark-up-window").text("Mark-Up Window");
            document.getElementById("images-tab").click();
            pnnl.dialog.newDialogBuilder()
                .createAlertDialog("add-roi-dialog")
                .setHeaderIcon("fa-info-circle", "add-roi-dialog-header")
                .setMessageBody("Click on an image to select to draw ROI")
                .show(function (id) { $(id).fadeIn().delay(5000).fadeOut(400, function() { $(id).remove(); }); });
            $(".image-container").filter(function() {
                return !$(this).hasClass("roi-image-container");
            }).find("img")
            .css("cursor", "pointer")
            .click(function() {
                var dim = getNaturalImageSize(this);
                drawROI(d3.select(this.parentElement), $(this), dim.height, dim.width);
            });
        }
    });

    $("#action-container #refresh").click(function () {
        var userDir = localStorage.getItem("user-dir");
        var dataset = $("#selected-dataset").text();
        var $activeTab = $(".active-tab");
        var folder = $activeTab.attr("id").replace("-tab", "");
        var target = $activeTab.data("activate");
        var url = "/Java-Matlab-Integration/DirectoryInspectorServlet/refresh";
        var callback;
        var requestParams = {"user-dir": userDir, "dataset-name": dataset, "folder": folder.replace("-", "/")};
        switch (folder) {
            case "cdf":
            case "hdf":
                callback = function (count) { populateList(userDir, "#" + target + " ul", count, true); };
                break;
            case "excel":
                callback = function (count) { populateList(userDir, "#" + target + " ul", count, false); };
                break;
            case "images":
            case "optical":
            case "rois-roiImages":
                callback = function (newTotal) { 
                    var url = "/Java-Matlab-Integration/DirectoryInspectorServlet/load-more-images";
                    $activeTab.attr("data-total-quantity", newTotal);
                    var params = {"limit": 10, "image-names": d3.selectAll("#" + folder + "-tab-content .caption").nodes().map(function(e) { return e.innerHTML; }).join("|"),
                        "dataset-name": $("#selected-dataset").text(), "user-dir": localStorage.getItem("user-dir"), "image-folder": folder.replace("-", "/")};
                    $("#total").text(newTotal);
                    $.ajax(url, {
                        "data": params,
                        "method": "GET",
                        "success": function (d) {
                            if ($activeTab.attr("data-current-quantity") !== $activeTab.attr("data-total-quantity")) {
                                var current = parseInt($activeTab.attr("data-current-quantity")) + d.imageData.length;
                                $("#load-more-toggler").attr("disabled", current === d.total ? "disabled" : null);
                                $("#current").text(current);
                                $activeTab.attr("data-current-quantity", current);
                                appendImages(d, $activeTab.attr("id") + "-content");
                            }
                        },
                        "error": function (xhr) {
                            errorCallback(xhr.statusText);
                        }
                    });
                };
                requestParams.restrict = "count";
                break;
        }
        $.ajax(url, {
            "method": "GET",
            "data": requestParams,
            "success": function(data) {
                $("<span class='refresh-status' style='border:none;margin-left:-50px;margin-top:15px;color:gray;font-size:large'>Done</span>").prependTo("#action-container");
                setTimeout(function() { $(".refresh-status").remove(); }, 2000);
                update("/Java-Matlab-Integration/DirectoryInspectorServlet/view-files", data.datasets);
                callback(data.payload);
            },
            "error": function (xhr) {
                errorCallback(xhr.statusMessage);
                $("<span class='refresh-status' style='border:none;margin-left:-50px;margin-top:15px;color:gray;font-size:large'>Done</span>").prependTo("#action-container");
                setTimeout(function() {
                    $(".refresh-status").remove();
                }, 2000);
            }
        });
    });

    d3.select("#show-uploaded-files-form .show").on("click", function () {
        var url = "/Java-Matlab-Integration/DirectoryInspectorServlet/view-files";
        //window.history.pushState({}, "", url);
        d3.event.stopImmediatePropagation();
        if (!pnnl.validation.validate("show-uploaded-files-form", "dataset-name"))
            return;
        else {
            $("#show-uploaded-files-form-container").delay(250).fadeOut();
            $(".toggler").click();
            exploreDir(url, $("#show-uploaded-files-form #user-dir").val(), $("#show-uploaded-files-form #dataset-name").val());
        }
    });

    var currentIndex = -1;
    var resultData = {};
    var offset = 0;
    var moveTo = 0;
    var totalElementsRead = 0;
    $(".next").click(function (event) {
        event.stopPropagation();
        if (currentIndex < resultData.pointCount.length - 1) {
            currentIndex++;
            moveTo += 690 / resultData.pointCount.length;
            pnnl.draw.moveIndicatorBar(moveTo);
            if (currentIndex % 20 === 0 && currentIndex !== 0 /*&& currentIndex !== resultData.length - 1*/) {
                var url = "/Java-Matlab-Integration/DataFetcherServlet/load-more";
                //window.history.pushState({}, "", url);
                pnnl.draw.drawOverlay();
                pnnl.draw.drawSpinner();
                var fileName = sessionStorage.getItem("file-name");
                var dataset = sessionStorage.getItem("dataset-name");
                var requestParams = {
                    "file-name": fileName,
                    "dataset-name": dataset ? dataset : $("#selected-dataset").text(),
                    "user-dir": localStorage.getItem("user-dir"),
                    "file-type": fileName.indexOf("hdf") !== -1 ? "hdf" : "cdf",
                    "offset": offset,
                    "direction": "forward",
                    "next-sum": resultData.pointCount.slice(currentIndex, currentIndex + 20).reduce(function (prev, next) {
                        return prev + next;
                    })
                };
                pnnl.data.fetch(url, requestParams, function (intensityMass) {
                    totalElementsRead = 0;
                    resultData.intensityMass = intensityMass;
                    drawIntensityMassChart(resultData.intensityMass.slice(totalElementsRead,
                            totalElementsRead + resultData.pointCount[currentIndex]));
                    totalElementsRead += resultData.pointCount[currentIndex];
                    offset += resultData.pointCount[currentIndex];
                    pnnl.draw.removeSpinnerOverlay();
                }, errorCallback);
            } else {
                drawIntensityMassChart(resultData.intensityMass.slice(totalElementsRead,
                        totalElementsRead + resultData.pointCount[currentIndex]));
                totalElementsRead += resultData.pointCount[currentIndex];
                offset += resultData.pointCount[currentIndex];
            }
        }

    });
    $(".prev").click(function (event) {
        event.stopImmediatePropagation();
        if (currentIndex > 0) {
            moveTo -= 690 / resultData.pointCount.length;
            pnnl.draw.moveIndicatorBar(moveTo);
            offset -= resultData.pointCount[currentIndex];
            totalElementsRead -= resultData.pointCount[currentIndex];
            if (currentIndex % 20 !== 0) {
                currentIndex--;
                drawIntensityMassChart(resultData.intensityMass.slice(totalElementsRead - resultData.pointCount[currentIndex], totalElementsRead));
            } else {
                var url = "/Java-Matlab-Integration/DataFetcherServlet/load-more";
                //window.history.pushState({}, "", url);
                pnnl.draw.drawSpinner();
                pnnl.draw.drawOverlay();
                var fileName = sessionStorage.getItem("file-name");
                var dataset = sessionStorage.getItem("dataset-name");
                var requestParams = {
                    "file-name": fileName,
                    "dataset-name": dataset ? dataset : $("#selected-dataset").text(),
                    "user-dir": localStorage.getItem("user-dir"),
                    "file-type": fileName.indexOf("hdf") !== -1 ? "hdf" : "cdf",
                    "offset": offset,
                    "direction": "backward",
                    "next-sum": resultData.pointCount.slice(currentIndex - 20, currentIndex).reduce(function (prev, next) {
                        return prev + next;
                    })
                };
                pnnl.data.fetch(url, requestParams, function (intensityMass) {
                    resultData.intensityMass = intensityMass;
                    totalElementsRead = intensityMass.length;
                    currentIndex--;
                    drawIntensityMassChart(intensityMass.slice(totalElementsRead - resultData.pointCount[currentIndex], totalElementsRead));
                    pnnl.draw.removeSpinnerOverlay();
                }, errorCallback);
            }
        };
    });
    // Convinient function so we don't have to repeat codes for next and previous buttons' event handlers.
    function drawIntensityMassChart(data) {
        var config = {
            "width": parseInt(d3.select('#intensity-mass-chart-id').style('width'), 10),
            "height": 500,
            "margin": {
                "top": 30,
                "right": 20,
                "bottom": 20,
                "left": 60
            },
            "yLabel": "1.0e+7",
            "className": "intensity-mass-chart",
            "idName": "intensity-mass-chart-id",
            "x": "m/z Values",
            "y": "Intensity"
        };
        pnnl.draw.drawLineGraph(config, data);
        /*
         * Intensity / Mass values chart may not be drawn to the screen yet, so we set a 500ms delay so d3.select()
         * will not be empty which will not render the brushable area otherwise.
         */
        setTimeout(function () {
            d3.select("." + config.className).append("g")
                    .attr("class", "brush")
                    .attr("transform", "translate(" + config.margin.left + "," + config.margin.top + ")")
                    .call(d3.brushX().extent([[0, 0], [config.width - config.margin.left - config.margin.right, config.height - config.margin.top - config.margin.bottom]])
                            .on("end", function () {
                                if (!d3.event.sourceEvent)
                                    return;
                                if (!d3.event.selection)
                                    return;
                                var x = d3.scaleLinear()
                                        .domain(d3.extent(data, function (d) { return d.x; }))
                                        .range([0, config.width - config.margin.left - config.margin.right]);
                                var range = d3.event.selection.map(x.invert);
                                $("." + config.className).off("contextmenu click").contextmenu(function (event) {
                                    showContextDialog(event, "<li id='generate-image'>Generate ion image</li>", function () {
                                        switch (this.id) {
                                            case "hide-dialog":
                                                $(".file-selection-dialog").fadeOut();
                                                break;
                                            case "show-dialog":
                                                $(".file-selection-dialog").fadeIn().css({"top": event.pageY, "left": event.pageX});
                                                break;
                                            case "generate-image":
                                                pnnl.draw.drawSpinner();
                                                pnnl.draw.drawOverlay();
                                                var fileNames = sessionStorage.getItem("file-names");
                                                var datasetName = sessionStorage.getItem("dataset-name");
                                                $.ajax("/Java-Matlab-Integration/IonImageGeneratorServlet/generate-image",
                                                        {
                                                            "method": "GET",
                                                            "data": {
                                                                "user-dir": localStorage.getItem("user-dir"),
                                                                "dataset-name": datasetName ? datasetName : $("#selected-dataset").text(),
                                                                "file-type": fileNames.indexOf("hdf") !== -1 ? "hdf" : "cdf",
                                                                "file-names": fileNames,
                                                                "lower-bound": range[0],
                                                                "upper-bound": range[1]
                                                            },
                                                            "success": function (data) {
                                                                pnnl.draw.removeSpinnerOverlay();
                                                                var config = {
                                                                    "idName": "ion-image-container",
                                                                    "className": "ion-image",
                                                                    hasContextMenu: true
                                                                };
                                                                data.pixels = data.pixels.map(function(e) { return e < 0 ? 0 : e; });
                                                                var result = [];
                                                                for (var i = 0; i < data.dimension[0]; i++) {
                                                                    result.push([]);
                                                                    for (var j = i; j < data.pixels.length; j += data.dimension[0])
                                                                        result[i].push(data.pixels[j]);
                                                                }
                                                                range.push(data.dimension[0], data.dimension[1]);
                                                                drawImage(config, result, data.dimension[0], data.dimension[1], range.join("_"));
                                                            },
                                                            "error": function (xhr) {
                                                                errorCallback(xhr.statusText);
                                                            }
                                                        });
                                                break;
                                        }
                                    });
                                });
                            }));
        }, 500);
    }
    // Just a convenient function to remove code duplication.
    function loadData(userDir, datasetName, fileName) {
        var url = "/Java-Matlab-Integration/DataFetcherServlet/load-data";
        //window.history.pushState({}, "", url);
        window.sessionStorage.setItem("file-name", fileName);
        var fileType = fileName.indexOf("hdf") !== -1 ? "hdf" : "cdf";
        var params = {"user-dir": userDir, "dataset-name": datasetName, "file-name": fileName, "file-type": fileType};
        pnnl.data.loadData(url, params, successCallback, errorCallback);
        currentIndex = -1;
        offset = 0;
        totalElementsRead = 0;
        moveTo = 0;
        function successCallback(data) {
            var config = {"width": parseInt(d3.select('#intensity-scan-chart-id').style('width'), 10), "height": 500,
                "margin": {"top": 30, "right": 20, "bottom": 20, "left": 60}, "yLabel": "1.0e+8", "className": "intensity-scan-chart", "idName": "intensity-scan-chart-id", "x": "Scan Acquisition Time", "y": "Intensity"
            };
            resultData.pointCount = data.pointCount;
            resultData.intensityMass = data.intensityValues.map(function (d, i) {
                return {"x": data.massValues[i], "y": d / Math.pow(10, 7)};
            });
            $(".intensity-mass-chart").remove();
            pnnl.draw.drawLineGraph(config, data.scanTime.map(function (e, i) {
                return {"x": e, "y": data.totalIntensity[i] / Math.pow(10, 8)};
            }));
            pnnl.draw.removeSpinnerOverlay();
        }
    }
    // Global HTTP request response error handling
    function errorCallback(msg) {
        pnnl.draw.removeSpinnerOverlay();
        var messageBody = "<div>" + msg + "</div>";
        $(".error-dialog").remove();
        pnnl.dialog.newDialogBuilder()
                .createAlertDialog("error-dialog", "error-dialog")
                .setHeaderIcon("fa-frown-o")
                .setMessageBody(messageBody)
                .setCloseActionButton()
                .show(function(id) { $(id).fadeIn(); });
        setTimeout(function() {
            $(".error-dialog").fadeOut();
        }, 5000);
    }
    function showContextDialog(event, dialogBody, clickFunction) {
        event.preventDefault();
        event.stopImmediatePropagation();
        var body = "<ul>";
        var fileSelectionDialog = $(".file-selection-dialog");
        if (fileSelectionDialog.length > 0) {
            body = "<ul><li id='show-dialog'>Show file selection widget</li>";
            if (fileSelectionDialog.css("display") === "block")
                body = "<ul><li id='hide-dialog'>Hide file selection widget</li>";
        }
        body += dialogBody + "</ul>";
        var dialog = $(".context-menu-dialog");
        if (dialog.length === 0)
            pnnl.dialog.newDialogBuilder()
                    .createAlertDialog("context-menu-dialog", "context-menu-dialog")
                    .setMessageBody(body)
                    .removeHeader()
                    .show(function (id) {
                        $(id).show().css({"top": event.pageY, "left": event.pageX});
                    });
        else {
            dialog.find(".message-body").remove();
            dialog.append("<div class='message-body'>" + body + "</div>")
                    .show()
                    .css({"top": event.pageY, "left": event.pageX});
        }
        $(".context-menu-dialog li").click(clickFunction);
    }
    
    function drawImage(config, dataArray, numRows, numCols, imageName, colorMap) {
        var margin = {top: 20, right: 15, bottom: 10, left: 15};
        var width = 350 - margin.left - margin.right;
        var height = 500 - margin.top - margin.bottom;
        var svg = d3.select("#" + config.idName)
                .append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height)
                .append("g")
                .attr("transform", config.shouldNotTranslate ? "" : "translate(" + margin.left + "," + margin.top + ")");
        for (var i = 0; i < numRows; i++) {
            var xScale = d3.scaleBand()
                    .domain(dataArray[i])
                    .range([0, width]);
            var yScale = d3.scaleOrdinal()
                    .domain([i])
                    .range([height / numRows]);
            var colors = null;
            if (!colorMap)
                colors = ["rgb(3,0,0)","rgb(5,0,0)","rgb(8,0,0)","rgb(11,0,0)","rgb(13,0,0)","rgb(16,0,0)","rgb(19,0,0)","rgb(21,0,0)","rgb(24,0,0)","rgb(27,0,0)","rgb(30,0,0)","rgb(32,0,0)","rgb(35,0,0)","rgb(38,0,0)","rgb(40,0,0)","rgb(43,0,0)","rgb(46,0,0)","rgb(48,0,0)","rgb(51,0,0)","rgb(54,0,0)","rgb(56,0,0)","rgb(59,0,0)","rgb(62,0,0)","rgb(64,0,0)","rgb(67,0,0)","rgb(70,0,0)","rgb(72,0,0)","rgb(75,0,0)","rgb(78,0,0)","rgb(81,0,0)","rgb(83,0,0)","rgb(86,0,0)","rgb(89,0,0)","rgb(91,0,0)","rgb(94,0,0)","rgb(97,0,0)","rgb(99,0,0)","rgb(102,0,0)","rgb(105,0,0)","rgb(107,0,0)","rgb(110,0,0)","rgb(113,0,0)","rgb(115,0,0)","rgb(118,0,0)","rgb(121,0,0)","rgb(123,0,0)","rgb(126,0,0)","rgb(129,0,0)","rgb(132,0,0)","rgb(134,0,0)","rgb(137,0,0)","rgb(140,0,0)","rgb(142,0,0)","rgb(145,0,0)","rgb(148,0,0)","rgb(150,0,0)","rgb(153,0,0)","rgb(156,0,0)","rgb(158,0,0)","rgb(161,0,0)","rgb(164,0,0)","rgb(166,0,0)","rgb(169,0,0)","rgb(172,0,0)","rgb(174,0,0)","rgb(177,0,0)","rgb(180,0,0)","rgb(183,0,0)","rgb(185,0,0)","rgb(188,0,0)","rgb(191,0,0)","rgb(193,0,0)","rgb(196,0,0)","rgb(199,0,0)","rgb(201,0,0)","rgb(204,0,0)","rgb(207,0,0)","rgb(209,0,0)","rgb(212,0,0)","rgb(215,0,0)","rgb(217,0,0)","rgb(220,0,0)","rgb(223,0,0)","rgb(225,0,0)","rgb(228,0,0)","rgb(231,0,0)","rgb(234,0,0)","rgb(236,0,0)","rgb(239,0,0)","rgb(242,0,0)","rgb(244,0,0)","rgb(247,0,0)","rgb(250,0,0)","rgb(252,0,0)","rgb(255,0,0)","rgb(255,3,0)","rgb(255,5,0)","rgb(255,8,0)","rgb(255,11,0)","rgb(255,13,0)","rgb(255,16,0)","rgb(255,19,0)","rgb(255,21,0)","rgb(255,24,0)","rgb(255,27,0)","rgb(255,30,0)","rgb(255,32,0)","rgb(255,35,0)","rgb(255,38,0)","rgb(255,40,0)","rgb(255,43,0)","rgb(255,46,0)","rgb(255,48,0)","rgb(255,51,0)","rgb(255,54,0)","rgb(255,56,0)","rgb(255,59,0)","rgb(255,62,0)","rgb(255,64,0)","rgb(255,67,0)","rgb(255,70,0)","rgb(255,72,0)","rgb(255,75,0)","rgb(255,78,0)","rgb(255,81,0)","rgb(255,83,0)","rgb(255,86,0)","rgb(255,89,0)","rgb(255,91,0)","rgb(255,94,0)","rgb(255,97,0)","rgb(255,99,0)","rgb(255,102,0)","rgb(255,105,0)","rgb(255,107,0)","rgb(255,110,0)","rgb(255,113,0)","rgb(255,115,0)","rgb(255,118,0)","rgb(255,121,0)","rgb(255,123,0)","rgb(255,126,0)","rgb(255,129,0)","rgb(255,132,0)","rgb(255,134,0)","rgb(255,137,0)","rgb(255,140,0)","rgb(255,142,0)","rgb(255,145,0)","rgb(255,148,0)","rgb(255,150,0)","rgb(255,153,0)","rgb(255,156,0)","rgb(255,158,0)","rgb(255,161,0)","rgb(255,164,0)","rgb(255,166,0)","rgb(255,169,0)","rgb(255,172,0)","rgb(255,174,0)","rgb(255,177,0)","rgb(255,180,0)","rgb(255,183,0)","rgb(255,185,0)","rgb(255,188,0)","rgb(255,191,0)","rgb(255,193,0)","rgb(255,196,0)","rgb(255,199,0)","rgb(255,201,0)","rgb(255,204,0)","rgb(255,207,0)","rgb(255,209,0)","rgb(255,212,0)","rgb(255,215,0)","rgb(255,217,0)","rgb(255,220,0)","rgb(255,223,0)","rgb(255,225,0)","rgb(255,228,0)","rgb(255,231,0)","rgb(255,234,0)","rgb(255,236,0)","rgb(255,239,0)","rgb(255,242,0)","rgb(255,244,0)","rgb(255,247,0)","rgb(255,250,0)","rgb(255,252,0)","rgb(255,255,0)","rgb(255,255,4)","rgb(255,255,8)","rgb(255,255,12)","rgb(255,255,16)","rgb(255,255,20)","rgb(255,255,24)","rgb(255,255,27)","rgb(255,255,31)","rgb(255,255,35)","rgb(255,255,39)","rgb(255,255,43)","rgb(255,255,47)","rgb(255,255,51)","rgb(255,255,55)","rgb(255,255,59)","rgb(255,255,63)","rgb(255,255,67)","rgb(255,255,71)","rgb(255,255,75)","rgb(255,255,78)","rgb(255,255,82)","rgb(255,255,86)","rgb(255,255,90)","rgb(255,255,94)","rgb(255,255,98)","rgb(255,255,102)","rgb(255,255,106)","rgb(255,255,110)","rgb(255,255,114)","rgb(255,255,118)","rgb(255,255,122)","rgb(255,255,126)","rgb(255,255,129)","rgb(255,255,133)","rgb(255,255,137)","rgb(255,255,141)","rgb(255,255,145)","rgb(255,255,149)","rgb(255,255,153)","rgb(255,255,157)","rgb(255,255,161)","rgb(255,255,165)","rgb(255,255,169)","rgb(255,255,173)","rgb(255,255,177)","rgb(255,255,180)","rgb(255,255,184)","rgb(255,255,188)","rgb(255,255,192)","rgb(255,255,196)","rgb(255,255,200)","rgb(255,255,204)","rgb(255,255,208)","rgb(255,255,212)","rgb(255,255,216)","rgb(255,255,220)","rgb(255,255,224)","rgb(255,255,228)","rgb(255,255,231)","rgb(255,255,235)","rgb(255,255,239)","rgb(255,255,243)","rgb(255,255,247)","rgb(255,255,251)","rgb(255,255,255)"];
            else
                colors = colorMap;
            var colorScale = d3.scaleQuantize()
                    .domain(d3.extent(dataArray[i]))
                    .range(colors);
            
            svg.selectAll(".tile-" + i)
                    .data(dataArray[i])
                    .enter()
                    .append("rect")
                    .attr("x", function (d) { return xScale(d); })
                    .attr("y", function () { return (yScale(i) / 2) * i; })
                    .attr("width", function () { return xScale.bandwidth(); })
                    .attr("height", function () { return yScale(i) / 2; })
                    .style("stroke-width", "0")
                    .style("fill", function (d) { return colorScale(d); });
            /*svg.append("text")
                    .attr("y", 250)
                    // We want to center the text under the image. 7.6968571429: Character width in the current font
                    .attr("x", (width - 7.6968571429 * id.length) / 2)
                    .text(id)
                    .style("font-family", "monospace");*/
        }
        var image = new Image();
        image.id = "image" + Date.now();
        if (config.setOpacity && d3.select("#" + config.idName).size() > 1)
            image.style.opacity = "0.5";
        if (config.hasContextMenu) {
            image.className = sessionStorage.getItem("dataset-name");
            image.title = "Right click to save this image on the server";
            image.oncontextmenu = function(event) {
                if ($("#select-a-tool-toggler span").attr("id") !== "none") {
                    event.preventDefault();
                    return;
                }
                var body = "<li id='save-image'>Save</li><li id='select-roi'>Select Region of Interest</li>";
                showContextDialog(event, body, function (e) {
                    switch (this.id) {
                        case "hide-dialog":
                            $(".file-selection-dialog").fadeOut();
                            break;
                        case "show-dialog":
                            $(".file-selection-dialog").fadeIn().css({"top": e.pageY, "left": e.pageX});
                            break;
                        case "select-roi":
                            drawROI(d3.select("#" + config.idName), $(image), numRows, numCols);
                            break;
                        case "save-image":
                            pnnl.draw.drawSpinner();
                            pnnl.draw.drawOverlay();
                            var url = "/Java-Matlab-Integration/UploaderServlet/save-image";
                            var formData = new FormData();
                            formData.append("user-dir", localStorage.getItem("user-dir"));
                            var datasetName = image.className;
                            formData.append("dataset-name", datasetName ? datasetName : $("#selected-dataset").text());
                            formData.append("image-name", imageName);
                            formData.append("image-data", image.src.replace("data:image/png;base64,", ""));
                            Object.keys(dataArray).forEach(function(key) {
                                formData.append(key, dataArray[key]);
                            });
                            var xhr = new XMLHttpRequest();
                            xhr.onreadystatechange = function () {
                                pnnl.draw.removeSpinnerOverlay();
                                if (xhr.readyState === 4) {
                                    if (xhr.status === 200)
                                        pnnl.dialog.newDialogBuilder()
                                                .createAlertDialog("notification-dialog")
                                                .setMessageBody("Image saved successfully")
                                                .removeHeader()
                                                .show(function (id) { $(id).fadeIn().delay(5000).fadeOut(400, function() { $(id).remove(); }); });
                                    else
                                        errorCallback(xhr.statusText);
                                }
                            };

                            xhr.open("POST", url);
                            xhr.send(formData);
                            break;
                    }
                });
            };
        }
        svgAsPngUri(svg.node(), {}, function (uri) {
            image.src = uri;
            image.onload = function() { $("#" + config.idName).append(image).find("svg").remove(); };
        });
    }
    function exploreDir(url, userDir, datasetName) {
        $.ajax(url, {
            "method": "GET",
            "data": {
                "user-dir": userDir,
                "dataset-name": datasetName
            },
            "success": function (data) {
                window.localStorage.setItem("user-dir", userDir);
                window.sessionStorage.setItem("dataset-name", datasetName);
                var payload = data.payload[0];
                update(url, data.datasets, payload.dataset);
                populateList(userDir, "#cdf-tab-content ul", payload.cdf, true);
                populateList(userDir, "#hdf-tab-content ul", payload.hdf, true);
                populateList(userDir, "#excel-tab-content ul", payload.excel, false);
                populateImages("#images-tab-content", payload.images, payload.ionImageData, "#images-tab");
                populateImages("#optical-tab-content", payload.optical, payload.opticalImageData, "#optical-tab", "optical-image");
                populateImages("#rois-roiImages-tab-content", payload.roiImages, payload.roiImageData, "#rois-roiImages-tab", "roi-image-container");
                showButtons("#tab-opener");
                d3.select("#tabs-container")
                           .transition()
                           .duration(800)
                           .style("transform", "scale(1,1)")
                           .style("top", pnnl.utils.getScrollTop() + 80 + "px")
                           .style("opacity", 1);
                $("#tabs-container").fadeIn()
                        .css({"transform": "scale(1,1)", "top": pnnl.utils.getScrollTop() + 80 + "px",
                                "left": (screen.width - $("#tabs-container").width()) / 2 + "px"})
                        .find("#cdf-tab")
                        .click();
            },
            "error": function (xhr) {
                errorCallback(xhr.statusText);
            }
        });
    }
    function populateList(userDir, selector, data, clickable) {
        var ul = d3.select(selector);
        ul.select(".empty-content").remove();
        var joined = ul.selectAll("li").data(data);
        joined.exit().remove();
        if (data.length === 0) {
            ul.append("div").attr("class", "empty-content").text("This folder is empty").style("text-align", "center");
            return;
        }
        joined.attr("id", function (d) { return d; })
                .select("span").text(function (d) { return d; });
        var enter = joined.enter()
                .append("li")
                .attr("id", function (d) { return d; });
        enter.append("span").text(function (d) { return d; });

        if (clickable)
            enter.append("i").attr("class", "fa fa-line-chart plot-graph")
                    .attr("title", "Plot graph for this file")
                    .on("click", function () {
                        pnnl.draw.drawOverlay();
                        pnnl.draw.drawSpinner();
                        var fileNames = Array.prototype.map.call(document.querySelectorAll(selector + " li"), function (li) {
                            $(li).css("background-color", "white");
                            return li.id;
                        });
                        $(this).parent().css("background-color", "lightblue");
                        window.sessionStorage.setItem("file-names", fileNames);
                        loadData(userDir, $("#dataset-selection-toggler #selected-dataset").text(), this.parentElement.id);
                    });
    }

    function populateImages(imageTabContentId, imageNames, imageData, tab, imageClassName) {
        d3.select(tab)
            .attr("data-current-quantity", imageData.length)
            .attr("data-total-quantity", imageNames.length);
        var d3imageTabContent = d3.select(imageTabContentId);
        d3imageTabContent.select(".empty-content").remove();
        $("#current").text(imageData.length);
        $("#total").text(imageNames.length);
        imageData = imageData.map(function (data) { 
            return "data:image/png;base64," + data;
        });

        var containers = d3imageTabContent
                .selectAll(".image-container")
                .data(imageData);
        containers.exit().remove();
        if (imageNames.length === 0)
            d3.select(tab + "-content")
                    .append("p")
                    .attr("class", "empty-content")
                    .style("text-align", "center")
                    .style("width", "100%")
                    .text("This folder is empty");
        containers.select("img")
                .attr("src", function (d) { return d; })
                .attr("alt", function (d, i) { return imageNames[i]; });
        containers.select(".caption")
                .text(function (d, i) { return imageNames[i]; });

        var enter = containers.enter()
                .append("div")
                .attr("class", "image-container");
        enter.append("img")
                .classed(imageClassName ? imageClassName : "", true)
                .attr("src", function (d) { return d; })
                .attr("alt", function (d, i) { return imageNames[i]; })
                .attr("id", function(d, i) { return "image" + imageNames[i].replace(/[._(?:png)]/g, ""); })
                .style("height", "235px")
                .style("width", "320px")
                .on("contextmenu", function() {
                    if ($("#select-a-tool-toggler span").attr("id") !== "none" || imageTabContentId === "#rois-roiImages-tab-content") {
                        d3.event.preventDefault();
                        return;
                    }
                    var body = "<li id='select-roi'>Select Region of Interest</li>";
                    var img = this;
                    showContextDialog(d3.event, body, function (e) {
                        switch (this.id) {
                            case "hide-dialog":
                                $(".file-selection-dialog").fadeOut();
                                break;
                            case "show-dialog":
                                $(".file-selection-dialog").fadeIn().css({"top": e.pageY, "left": e.pageX});
                                break;
                            case "select-roi":
                                var dim = getNaturalImageSize(img);
                                drawROI(d3.select(img.parentElement), $(img), dim.height, dim.width);
                                break;
                        }
                    });
                });
        enter.append("div")
                .attr("class", "caption")
                .text(function (d, i) { return imageNames[i]; });
    }

    function update(url, datasets, selected) {
        $("#dataset-selection-toggler #selected-dataset").text(selected);
        var joined = d3.select("#tabs-container .dataset-selection ul").selectAll("li").data(datasets);
        joined.exit().remove();
        joined.attr("id", function (d) { return d; })
                .text(function (d) { return d; });
        joined.enter()
                .append("li")
                .attr("id", function (d) { return d; })
                .text(function (d) { return d; })
                .on("click", function () {
                    window.sessionStorage.setItem("dataset-name", this.id);
                    $("#dataset-selection-toggler span").text(this.id);
                    exploreDir(url, localStorage.getItem("user-dir"), this.id);
                    $(this.parentElement).fadeOut();
                });
    }

    function appendImages(data, imageTabID) {
        var container = document.getElementById(imageTabID);
        $(container).find(".empty-content").remove();
        data.imageData.forEach(function (d, i) {
            var div = document.createElement("div");
            div.className = "image-container";
            var img = document.createElement("img");
            img.src = "data:image/png;base64," + d;
            img.id = "image" + Date.now();
            img.alt = data.imageNames[i];
            img.style.width = "320px";
            img.style.height = "235px";
            img.oncontextmenu = function(event) {
                if ($("#select-a-tool-toggler span").attr("id") !== "none") {
                    event.preventDefault();
                    return;
                }
                var body = "<li id='select-roi'>Select Region of Interest</li>";
                    var img = this;
                    showContextDialog(event, body, function (e) {
                        switch (this.id) {
                            case "hide-dialog":
                                $(".file-selection-dialog").fadeOut();
                                break;
                            case "show-dialog":
                                $(".file-selection-dialog").fadeIn().css({"top": e.pageY, "left": e.pageX});
                                break;
                            case "select-roi":
                                var dim = getNaturalImageSize(img);
                                drawROI(d3.select(img.parentElement), $(img), dim.height, dim.width);
                                break;
                        }
                    });
            };
            div.appendChild(img);
            var caption = document.createElement("div");
            caption.className = "caption";
            caption.innerHTML = data.imageNames[i];
            div.appendChild(caption);
            container.appendChild(div);
        });
    }
    
    function showButtons(buttonId) {
        var buttons = $(".buttons");
        buttons.css("display", "flex")
            .removeClass("fade-out")
            .addClass("fade-in")
            .find(buttonId)
            .css("display", "block");
        setTimeout(function() { buttons.removeClass("fade-in"); }, 10000);
    }
    
    function drawROI(imageContainer, $image, numRows, numCols) {
        $(".roi-metadata").fadeOut().find("form").get(0).reset();
        $(".validation-error-dialog").remove();
        var coordPairs = null;
        d3.selectAll(".roi").remove();
        var canvas = imageContainer.style("position", "relative")
                .insert("div", "#" + $image.get(0).id)
                .style("position", "absolute")
                .attr("class", "roi")
                .append("canvas")
                .classed("selected-image", true)
                .style("cursor", "url("+showPencilCursor()+") 0 20, auto")
                .attr("width", $image.width() + "px")
                .attr("height", $image.height() + "px")
                .on("mousedown", function() {
                    if (d3.event.which === 1) {
                        d3.event.preventDefault();
                        prepareCanvas();
                        var coords = d3.mouse(this.parentElement);
                        coords[0] += 0.5;
                        coords[0] = Math.floor(coords[0]);
                        context.strokeStyle = "yellow";
                        context.lineWidth = "5px";
                        context.beginPath();
                        context.moveTo(coords[0], coords[1]);
                        coordPairs.push(coords);
                        d3.select(this)
                            .on("mousemove", function() {
                                coords = d3.mouse(this.parentElement);
                                coords[0] = Math.floor(coords[0] + 0.5);
                                coordPairs.push(coords);
                                context.lineTo(coords[0], coords[1]);
                                context.stroke();
                            });
                    }
                })
                .on("contextmenu", function() {
                    var body = "<li id='clear'>Clear</li><li id='select-done'>Done</li>";
                    showContextDialog(d3.event, body, function (e) {
                        switch (this.id) {
                            case "hide-dialog":
                                $(".file-selection-dialog").fadeOut();
                                break;
                            case "show-dialog":
                                $(".file-selection-dialog").fadeIn().css({"top": e.pageY, "left": e.pageX});
                                break;
                            case "clear":
                                prepareCanvas();
                                $(".roi-metadata").fadeOut();
                                $(".validation-error-dialog").remove();
                                break;
                            case "select-done":
                                drawROIFinished(coordPairs, canvas, $image, numCols, numRows);
                                break;
                        }
                    });
                }).on("mouseup", function() {
                    if(d3.event.which === 1) {
                        context.closePath();
                        context.stroke();
                        d3.select(this).on("mousemove", null);
                        if (coordPairs.length > 10) {
                            var coords = canvas.parentElement.getBoundingClientRect();
                            $(".roi-metadata").css({"left": coords.right + 15, "top": coords.top + 20 + pnnl.utils.getScrollTop()})
                                    .draggable()
                                    .fadeIn()
                                    .find("#done")
                                    .off("click")
                                    .click(function(event) {
                                        event.stopImmediatePropagation();
                                        drawROIFinished(coordPairs, canvas, $image, numCols, numRows);
                            });
                        }
                    }
                })
                .node();
        d3.selectAll("body *");
        var context = canvas.getContext("2d");
        prepareCanvas();
        function prepareCanvas() {
            coordPairs = [];
            context.clearRect(0, 0, $image.width(), $image.height());
            context.fillStyle = "white";
            context.fillRect(0,0, $image.width(), $image.height());
            context.drawImage($image.get(0), 0, 0, $image.width(), $image.height());
        }
    }
    function drawROIFinished(coordPairs, canvas, $image, numCols, numRows) {
        if (!pnnl.validation.validate("roi-metadata", "roi-description") && coordPairs.length !== 0)
            return;
        d3.selectAll(".roi").remove();
        $(".validation-error-dialog").remove();
        $(".image-container img").css("cursor", "initial").off("click");
        $("#select-a-tool-toggler span").attr("id", "none").text("Select a tool");
        document.querySelector("#select-tool-cancel").style.visibility = "hidden";
        if (coordPairs.length === 0) {
            $(".roi-metadata").fadeOut().find("form").get(0).reset();
            return;
        }
        if (coordPairs.length > 0) {
            var selectedPixels  = [];
            var conversionFactor = numCols/$image.width();
            var bandHeight = Math.floor($image.height() / numRows);
            for (var i = 0; i < numRows; i++) {
                var lowerBound = bandHeight * i;
                var upperBound = bandHeight * (i+1);
                var intervals = [];
                var pixelsInRow = coordPairs.filter(function(pair) {
                    if (pair[1] >= lowerBound && pair[1] <= upperBound)
                        return true;
                    return false;
                })
                .map(function(pair) { return pair[0]; });
                if (pixelsInRow.length === 0)
                    continue;
                selectedPixels.push(i+1);
                intervals.push(pixelsInRow[0]);
                for (var j = 0; j < pixelsInRow.length-1; j++)
                    if (Math.abs(pixelsInRow[j] - pixelsInRow[j+1]) > 20) {
                        intervals.push(pixelsInRow[j]);
                        intervals.push(pixelsInRow[j+1]);
                    }
                intervals.push(pixelsInRow.pop());
                intervals = intervals.map(function(point) { return Math.floor(point * conversionFactor); });
                for (var k = 0; k < intervals.length - 1; k+=2) {
                    if (intervals[k] < intervals[k+1])
                        for (var l = intervals[k]; l <= intervals[k+1]; l++)
                            selectedPixels.push(l);
                    else if (intervals[k] > intervals[k+1])
                        for (var l = intervals[k]; l >= intervals[k+1]; l--)
                            selectedPixels.push(l);
                }
                selectedPixels.push(-1);
            }
            if (selectedPixels[selectedPixels.length-1] === -1)
                selectedPixels.pop();
            pnnl.utils.ajaxPost("/Java-Matlab-Integration/UploaderServlet/roi", {
                "selectedPixels": selectedPixels.join(" "), "roiImageData": canvas.toDataURL().replace("data:image/png;base64,", ""),
                "roiImageName": $(".roi-metadata #roi-name").val(), "user-dir": localStorage.getItem("user-dir"), "dataset-name": $("#selected-dataset").text()
            }, function(responseText) {
                console.log(responseText);
            }, errorCallback);
            $(".roi-metadata").fadeOut().find("form").get(0).reset();
        }
    }
    
    function markClickPoint(ctx, coords, markSize) {
        ctx.strokeStyle = "white";
        ctx.lineWidth = "10px";
        ctx.beginPath();
        ctx.moveTo(coords[0] - markSize, coords[1] - markSize);
        ctx.lineTo(coords[0] + markSize, coords[1] + markSize);
        ctx.moveTo(coords[0] - markSize, coords[1] + markSize);
        ctx.lineTo(coords[0] + markSize, coords[1] - markSize);
        ctx.stroke();
        return coords;
    }
    
    function convertToRealCoords(clickCoords, dim) {
        var rowHeight = 235 / dim.height;
        var conversionFactor = dim.width / 320;
        for (var x = 0; x < clickCoords.length; x++) {
            for (var row = 0; row < dim.height; row++)
                if (clickCoords[x][1] >= rowHeight * row && clickCoords[x][1] <= rowHeight * (row+1)) {
                    clickCoords[x][1] = row+1;
                    break;
                }
            clickCoords[x][0] = Math.floor(clickCoords[x][0] * conversionFactor);
        }
    }
    
    function getNaturalImageSize(imageObj) {
        var dimensions = imageObj.alt.split("_");
        var dim = {};
        if (dimensions.length > 2) {
            dim.width = parseInt(dimensions[3]);
            dim.height = parseInt(dimensions[2]);
        }
        else {
            dim.width = imageObj.naturalWidth;
            dim.height = imageObj.naturalHeight;
        }
        return dim;
    }
    
    function showPencilCursor() {
        var canvas = document.createElement("canvas");
        canvas.width = 25;
        canvas.height = 25;
        var ctx = canvas.getContext("2d");
        ctx.fillStyle = "white";
        ctx.font = "20px FontAwesome";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("\uf040", 12,12);
        return canvas.toDataURL('image/png');
    }

})(jQuery);