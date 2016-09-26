/* global d3, pnnl */

(function ($) {
    // Immediately populates these form fiels using their respective data saved locally before.
    $("form #user-dir").val(getItemLocal("user-dir"));
    $("form #dataset-name").val(getItemSession("dataset-name") ? getItemSession("dataset-name") : "");
    d3.select("#upload-cdf-hdf-form .upload").on("click", function () {
        var url = "/Java-Matlab-Integration/UploaderServlet/upload";
        //window.history.pushState({}, "", url);
        d3.event.stopImmediatePropagation();
        if (!pnnl.validation.validate("upload-cdf-hdf-form"))
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
            pnnl.data.upload(url, userDir, datasetName, files, isCdf ? "cdf" : "hdf",
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
                                if (getItemSession("file-name") !== this.id || d3.select(".intensity-scan-chart").empty()) {
                                    pnnl.draw.drawSpinner();
                                    pnnl.draw.drawOverlay();
                                    dispatch.call("selectionchange", this);
                                    loadData(getItemLocal("user-dir"), getItemSession("dataset-name"), this.id);
                                }
                            });
                        });
                    }, errorCallback);
        }
    });

    d3.select("#upload-excel-form .upload").on("click", function () {
        $(".buttons #status").show();
        var url = "/Java-Matlab-Integration/UploaderServlet/extract-excel";
        //window.history.pushState({}, "", url);
        d3.event.stopImmediatePropagation();
        if (!pnnl.validation.validate("upload-excel-form"))
            return;
        else {
            var excelFile = $("#upload-excel-form #file-name").get(0).files[0];
            var excelFilename = excelFile.name;
            var fileNames = Array.prototype.map.call($("#upload-excel-form #file-names").get(0).files, function(d) {
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
            $("#upload-excel-form-container").delay(250).fadeOut();
            $(".error-dialog").fadeOut();
            $(".toggler").click();
            var formData = new FormData();
            formData.append("user-dir", $("#upload-excel-form #user-dir").val());
            formData.append("dataset-name", $("#upload-excel-form #dataset-name").val());
            formData.append("file-type", fileNames.some(function(d) { return d.endsWith("cdf"); }) ? "cdf" : "hdf");
            formData.append("excel-file", excelFile);
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
                    .text($("#upload-excel-form #dataset-name").val());
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
        var current = parseInt($("#current").text());
        var total = parseInt($("#total").text());
        if (current < total) {
            var limit = parseInt(this.id);
            var skip = document.getElementById("images-tab-content").childElementCount;
            if (current + limit > total)
                limit = total - current;
            pnnl.draw.drawOverlay();
            pnnl.draw.drawSpinner();
            $.ajax(url, {
                "data": {"limit": limit, "skip": skip, "dataset-name": $("#selected-dataset").text(), "user-dir": getItemLocal("user-dir")},
                "method": "GET",
                "success": function (data) {
                    current += limit;
                    $("#current").text(current);
                    $("#total").text(data.total);
                    $("#load-more-toggler").attr("disabled", data.total === current ? "disabled" : null);
                    appendImages(data);
                    pnnl.draw.removeSpinnerOverlay();
                },
                "error": function (xhr) {
                    pnnl.draw.removeSpinnerOverlay();
                    errorCallback(xhr.statusText);
                }

            });
        }
    });

    $("#action-container #refresh").click(function () {
        var userDir = getItemLocal("user-dir");
        var dataset = $("#selected-dataset").text();
        var folder = $(".active-tab").text();
        var target = $(".active-tab").data("activate");
        var url = "/Java-Matlab-Integration/DirectoryInspectorServlet/refresh";
        var callback;
        var data = {"user-dir": userDir, "dataset-name": dataset, "folder": folder};
        switch (folder) {
            case "cdf":
            case "hdf":
                callback = function (count) { populateList(userDir, "#" + target + " ul", count, true); };
                break;
            case "excel":
                callback = function (count) { populateList(userDir, "#" + target + " ul", count, false); };
                break;
            case "images":
                callback = function (count) {
                    var currentTotal = parseInt($("#total").text());
                    $("#total").text(count);
                    var images = document.querySelectorAll("#images-tab-content .image-container");
                    if (count > 0) {
                        if (count < currentTotal) {
                            for (; count < currentTotal; count++)
                                images.removeChild(images[count]);
                            $("#current").text(currentTotal).attr("disabled", "disabled");
                        }
                        else {
                            var map = {"limit": 10, "image-names": d3.selectAll("#images-tab-content .image-container div").nodes().map(function(e) { return d3.select(e).text(); }).join("|"),
                                "dataset-name": $("#selected-dataset").text(), "user-dir": getItemLocal("user-dir")};
                            var url = "/Java-Matlab-Integration/DirectoryInspectorServlet/load-more-images";
                            $.ajax(url, {
                                "data": map,
                                "method": "GET",
                                "success": function (d) {
                                    var current = parseInt($("#current").text()) + d["image-data"].length;
                                    $("#load-more-toggler").attr("disabled", current === count ? "disabled" : null);
                                    $("#current").text(current);
                                    appendImages(d);
                                },
                                "error": function (xhr) {
                                    errorCallback(xhr.statusText);
                                }
                            });
                        }
                    } else
                        populateImages([], []);
                };
                data.restrict = "count";
                break;
        }
        $.ajax(url, {
            "method": "GET",
            "data": data,
            "success": function(data) {
                $("<span class='refresh-status' style='margin-left:-50px;margin-top:15px;color:gray;font-size:large'>Done</span>").insertBefore("#action-container");
                setTimeout(function() { $(".refresh-status").remove(); }, 2000);
                update("/Java-Matlab-Integration/DirectoryInspectorServlet/view-files", data.datasets);
                callback(data.payload);
            },
            "error": function (xhr) {
                errorCallback(xhr.statusMessage);
                $("<span class='refresh-status' style='margin-left:-50px;margin-top:15px;color:gray;font-size:large'>Done</span>").insertBefore("#action-container");
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
                var fileName = getItemSession("file-name");
                var dataset = getItemSession("dataset-name");
                var requestParams = {
                    "file-name": fileName,
                    "dataset-name": dataset ? dataset : $("#selected-dataset").text(),
                    "user-dir": getItemLocal("user-dir"),
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
                var fileName = getItemSession("file-name");
                var dataset = getItemSession("dataset-name");
                var requestParams = {
                    "file-name": fileName,
                    "dataset-name": dataset ? dataset : $("#selected-dataset").text(),
                    "user-dir": getItemLocal("user-dir"),
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
                "left": 100
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
                                        .domain(d3.extent(data, function (d) {
                                            return d.x;
                                        }))
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
                                                var fileNames = getItemSession("file-names");
                                                var datasetName = getItemSession("dataset-name");
                                                $.ajax("/Java-Matlab-Integration/IonImageGeneratorServlet/generate-image",
                                                        {
                                                            "method": "GET",
                                                            "data": {
                                                                "user-dir": getItemLocal("user-dir"),
                                                                "dataset-name": datasetName ? datasetName : $("#selected-dataset").text(),
                                                                "file-type": fileNames.indexOf("hdf") !== -1 ? "hdf" : "cdf",
                                                                "file-names": fileNames,
                                                                "lower-bound": range[0],
                                                                "upper-bound": range[1]
                                                            },
                                                            "success": function (data) {
                                                                pnnl.draw.removeSpinnerOverlay();
                                                                data = pnnl.data.parseData(data);
                                                                var config = {
                                                                    "idName": "ion-image-container",
                                                                    "className": "ion-image"
                                                                };
                                                                var dimensions = data[0];
                                                                data = data[1];
                                                                var minMax = d3.extent(data);
                                                                /*var fivePercent = Math.floor(minMax[1] * 0.05);
                                                                var remaining = minMax[1] - fivePercent;
                                                                data = data.map(function(e) { return e < fivePercent ? fivePercent : e > remaining ? remaining : e; });*/
                                                                data = data.map(function(e) { return e < 0 ? 0 : e; });
                                                                var result = [];
                                                                for (var i = 0; i < dimensions[0]; i++) {
                                                                    result.push([]);
                                                                    for (var j = i; j < data.length; j += dimensions[0])
                                                                        result[i].push(data[j]);
                                                                }
                                                                
                                                                drawImage(config, range, minMax, result, dimensions[0], data);
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
        var data = {"user-dir": userDir, "dataset-name": datasetName, "file-name": fileName, "file-type": fileType};
        pnnl.data.loadData(url, data, successCallback, errorCallback);
        currentIndex = -1;
        offset = 0;
        totalElementsRead = 0;
        moveTo = 0;
        function successCallback(totalIntensity, scanAcquisitionTime, intensityValues, massValues, pointCount) {
            var config = {"width": parseInt(d3.select('#intensity-scan-chart-id').style('width'), 10), "height": 500,
                "margin": {"top": 30, "right": 20, "bottom": 20, "left": 100}, "yLabel": "1.0e+8", "className": "intensity-scan-chart", "idName": "intensity-scan-chart-id", "x": "Scan Acquisition Time", "y": "Intensity"
            };
            resultData.pointCount = pointCount;
            resultData.intensityMass = intensityValues.map(function (d, i) {
                return {"x": massValues[i], "y": d / Math.pow(10, 7)};
            });
            $(".intensity-mass-chart").remove();
            pnnl.draw.drawLineGraph(config, scanAcquisitionTime.map(function (e, i) {
                return {"x": e, "y": totalIntensity[i] / Math.pow(10, 8)};
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
                .show();
    }
    function showContextDialog(event, dialogBody, clickFunction) {
        event.preventDefault();
        event.stopImmediatePropagation();
        var body = "<ul><li id='show-dialog'>Show file selection widget</li>";
        if ($(".file-selection-dialog").css("display") === "block")
            body = "<ul><li id='hide-dialog'>Hide file selection widget</li>";
        body += (dialogBody ? dialogBody : "") + "</ul>";
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

    function drawImage(config, range, minMax, dataArray, dimension, data) {
        var margin = {top: 20, right: 15, bottom: 10, left: 15};
        var width = 350 - margin.left - margin.right;
        var height = 500 - margin.top - margin.bottom;
        // We use selected range for this image id
        var id = range.join("-");
        var svg = d3.select("#" + config.idName)
                .append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height)
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
        for (var i = 0; i < dimension; i++) {
            var xScale = d3.scaleBand()
                    .domain(dataArray[i])
                    .range([0, width]);
            var yScale = d3.scaleOrdinal()
                    .domain([i])
                    .range([height / dimension]);
            var colors = "rgb(3,0,0)|rgb(5,0,0)|rgb(8,0,0)|rgb(11,0,0)|rgb(13,0,0)|rgb(16,0,0)|rgb(19,0,0)|rgb(21,0,0)|rgb(24,0,0)|rgb(27,0,0)|rgb(30,0,0)|rgb(32,0,0)|rgb(35,0,0)|rgb(38,0,0)|rgb(40,0,0)|rgb(43,0,0)|rgb(46,0,0)|rgb(48,0,0)|rgb(51,0,0)|rgb(54,0,0)|rgb(56,0,0)|rgb(59,0,0)|rgb(62,0,0)|rgb(64,0,0)|rgb(67,0,0)|rgb(70,0,0)|rgb(72,0,0)|rgb(75,0,0)|rgb(78,0,0)|rgb(81,0,0)|rgb(83,0,0)|rgb(86,0,0)|rgb(89,0,0)|rgb(91,0,0)|rgb(94,0,0)|rgb(97,0,0)|rgb(99,0,0)|rgb(102,0,0)|rgb(105,0,0)|rgb(107,0,0)|rgb(110,0,0)|rgb(113,0,0)|rgb(115,0,0)|rgb(118,0,0)|rgb(121,0,0)|rgb(123,0,0)|rgb(126,0,0)|rgb(129,0,0)|rgb(132,0,0)|rgb(134,0,0)|rgb(137,0,0)|rgb(140,0,0)|rgb(142,0,0)|rgb(145,0,0)|rgb(148,0,0)|rgb(150,0,0)|rgb(153,0,0)|rgb(156,0,0)|rgb(158,0,0)|rgb(161,0,0)|rgb(164,0,0)|rgb(166,0,0)|rgb(169,0,0)|rgb(172,0,0)|rgb(174,0,0)|rgb(177,0,0)|rgb(180,0,0)|rgb(183,0,0)|rgb(185,0,0)|rgb(188,0,0)|rgb(191,0,0)|rgb(193,0,0)|rgb(196,0,0)|rgb(199,0,0)|rgb(201,0,0)|rgb(204,0,0)|rgb(207,0,0)|rgb(209,0,0)|rgb(212,0,0)|rgb(215,0,0)|rgb(217,0,0)|rgb(220,0,0)|rgb(223,0,0)|rgb(225,0,0)|rgb(228,0,0)|rgb(231,0,0)|rgb(234,0,0)|rgb(236,0,0)|rgb(239,0,0)|rgb(242,0,0)|rgb(244,0,0)|rgb(247,0,0)|rgb(250,0,0)|rgb(252,0,0)|rgb(255,0,0)|rgb(255,3,0)|rgb(255,5,0)|rgb(255,8,0)|rgb(255,11,0)|rgb(255,13,0)|rgb(255,16,0)|rgb(255,19,0)|rgb(255,21,0)|rgb(255,24,0)|rgb(255,27,0)|rgb(255,30,0)|rgb(255,32,0)|rgb(255,35,0)|rgb(255,38,0)|rgb(255,40,0)|rgb(255,43,0)|rgb(255,46,0)|rgb(255,48,0)|rgb(255,51,0)|rgb(255,54,0)|rgb(255,56,0)|rgb(255,59,0)|rgb(255,62,0)|rgb(255,64,0)|rgb(255,67,0)|rgb(255,70,0)|rgb(255,72,0)|rgb(255,75,0)|rgb(255,78,0)|rgb(255,81,0)|rgb(255,83,0)|rgb(255,86,0)|rgb(255,89,0)|rgb(255,91,0)|rgb(255,94,0)|rgb(255,97,0)|rgb(255,99,0)|rgb(255,102,0)|rgb(255,105,0)|rgb(255,107,0)|rgb(255,110,0)|rgb(255,113,0)|rgb(255,115,0)|rgb(255,118,0)|rgb(255,121,0)|rgb(255,123,0)|rgb(255,126,0)|rgb(255,129,0)|rgb(255,132,0)|rgb(255,134,0)|rgb(255,137,0)|rgb(255,140,0)|rgb(255,142,0)|rgb(255,145,0)|rgb(255,148,0)|rgb(255,150,0)|rgb(255,153,0)|rgb(255,156,0)|rgb(255,158,0)|rgb(255,161,0)|rgb(255,164,0)|rgb(255,166,0)|rgb(255,169,0)|rgb(255,172,0)|rgb(255,174,0)|rgb(255,177,0)|rgb(255,180,0)|rgb(255,183,0)|rgb(255,185,0)|rgb(255,188,0)|rgb(255,191,0)|rgb(255,193,0)|rgb(255,196,0)|rgb(255,199,0)|rgb(255,201,0)|rgb(255,204,0)|rgb(255,207,0)|rgb(255,209,0)|rgb(255,212,0)|rgb(255,215,0)|rgb(255,217,0)|rgb(255,220,0)|rgb(255,223,0)|rgb(255,225,0)|rgb(255,228,0)|rgb(255,231,0)|rgb(255,234,0)|rgb(255,236,0)|rgb(255,239,0)|rgb(255,242,0)|rgb(255,244,0)|rgb(255,247,0)|rgb(255,250,0)|rgb(255,252,0)|rgb(255,255,0)|rgb(255,255,4)|rgb(255,255,8)|rgb(255,255,12)|rgb(255,255,16)|rgb(255,255,20)|rgb(255,255,24)|rgb(255,255,27)|rgb(255,255,31)|rgb(255,255,35)|rgb(255,255,39)|rgb(255,255,43)|rgb(255,255,47)|rgb(255,255,51)|rgb(255,255,55)|rgb(255,255,59)|rgb(255,255,63)|rgb(255,255,67)|rgb(255,255,71)|rgb(255,255,75)|rgb(255,255,78)|rgb(255,255,82)|rgb(255,255,86)|rgb(255,255,90)|rgb(255,255,94)|rgb(255,255,98)|rgb(255,255,102)|rgb(255,255,106)|rgb(255,255,110)|rgb(255,255,114)|rgb(255,255,118)|rgb(255,255,122)|rgb(255,255,126)|rgb(255,255,129)|rgb(255,255,133)|rgb(255,255,137)|rgb(255,255,141)|rgb(255,255,145)|rgb(255,255,149)|rgb(255,255,153)|rgb(255,255,157)|rgb(255,255,161)|rgb(255,255,165)|rgb(255,255,169)|rgb(255,255,173)|rgb(255,255,177)|rgb(255,255,180)|rgb(255,255,184)|rgb(255,255,188)|rgb(255,255,192)|rgb(255,255,196)|rgb(255,255,200)|rgb(255,255,204)|rgb(255,255,208)|rgb(255,255,212)|rgb(255,255,216)|rgb(255,255,220)|rgb(255,255,224)|rgb(255,255,228)|rgb(255,255,231)|rgb(255,255,235)|rgb(255,255,239)|rgb(255,255,243)|rgb(255,255,247)|rgb(255,255,251)|rgb(255,255,255)".split("|");
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
            svg.append("text")
                    .attr("y", 250)
                    // We want to center the text under the image. 7.6968571429: Character width in the current font
                    .attr("x", (width - 7.6968571429 * id.length) / 2)
                    .text(id)
                    .style("font-family", "monospace");
        }
        var image = new Image();
        image.id = id;
        image.className = getItemSession("dataset-name");
        image.title = "Right click to save this image on the server";
        image.style.marginLeft = "30px";
        image.style.marginBottom = "10px";
        image.oncontextmenu = function(event) {
            var body = "<li id='save-image'>Save</li>";
            showContextDialog(event, body, function (e) {
                switch (this.id) {
                    case "hide-dialog":
                        $(".file-selection-dialog").fadeOut();
                        break;
                    case "show-dialog":
                        $(".file-selection-dialog").fadeIn().css({"top": e.pageY, "left": e.pageX});
                        break;
                    case "save-image":
                        pnnl.draw.drawSpinner();
                        pnnl.draw.drawOverlay();
                        var url = "/Java-Matlab-Integration/UploaderServlet/save-image";
                        var formData = new FormData();
                        formData.append("user-dir", getItemLocal("user-dir"));
                        var datasetName = image.className;
                        formData.append("dataset-name", datasetName ? datasetName : $("#selected-dataset").text());
                        formData.append("image-name", image.id);
                        formData.append("image-data", image.src.replace("data:image/png;base64,", ""));
                        var xhr = new XMLHttpRequest();
                        xhr.onreadystatechange = function () {
                            pnnl.draw.removeSpinnerOverlay();
                            d3.select("#notification-dialog").remove();
                            if (xhr.readyState === 4) {
                                if (xhr.status === 200)
                                    pnnl.dialog.newDialogBuilder()
                                            .createAlertDialog("notification-dialog")
                                            .setMessageBody("Image saved successfully")
                                            .removeHeader()
                                            .show(function (id) { $(id).fadeIn().delay(5000).fadeOut(); });
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
                populateImages(payload.images, payload["image-data"]);
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

    function populateImages(imageNames, imageData) {
        d3.select("#images-tab-content .empty-content").remove();
        $("#current").text(imageData.length);
        $("#total").text(imageNames.length);
        var obj = imageData.map(function (data, i) { 
            return {"name": imageNames[i], "data": "data:image/png;base64," + data};
        });
        var containers = d3.select("#images-tab-content")
                .selectAll(".image-container")
                .data(obj);
        containers.exit().remove();
        if (imageNames.length === 0) {
            d3.select("#images-tab-content")
                    .append("p")
                    .attr("class", "empty-content")
                    .style("text-align", "center")
                    .style("width", "100%")
                    .text("This folder is empty");
            $("#load-more-toggler").attr("disabled", "disabled");
            return;
        }
        if (imageNames.length === imageData.length)
            $("#load-more-toggler").attr("disabled", "disabled");
        else
            $("#load-more-toggler").attr("disabled", null);
        containers.select("img")
                .attr("src", function (d) {
                    return d.data;
                })
                .attr("alt", function (d) {
                    return d.name;
                });
        containers.select(".caption")
                .text(function (d) {
                    return d.name;
                });


        var enter = containers.enter().append("div").attr("class", "image-container");
        enter.append("img")
                .attr("src", function (d) {
                    return d.data;
                })
                .attr("alt", function (d) {
                    return d.name;
                })
                .style("height", "200px")
                .style("width", "300px");
        enter.append("div")
                .attr("class", "caption")
                .text(function (d) {
                    return d.name;
                });

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
                    var id = this.id;
                    window.sessionStorage.setItem("dataset-name", id);
                    $("#dataset-selection-toggler span").text(id);
                    exploreDir(url, getItemLocal("user-dir"), id);
                    $(this).parent().fadeOut();
                });
    }

    function appendImages(data) {
        var container = document.getElementById("images-tab-content");
        $(container).find(".empty-content").remove();
        data["image-data"].forEach(function (d, i) {
            var div = document.createElement("div");
            div.className = "image-container";
            var img = document.createElement("img");
            img.src = "data:image/png;base64," + d;
            img.alt = data.images[i];
            img.style.width = "300px";
            img.style.height = "200px";
            div.appendChild(img);
            var caption = document.createElement("div");
            caption.className = "caption";
            caption.innerHTML = data.images[i];
            div.appendChild(caption);
            container.appendChild(div);
        });
    }
    function getItemLocal(name) {
        var value = window.localStorage.getItem(name);
        return value ? value : "";
    }
    function getItemSession(name) {
        var value = window.sessionStorage.getItem(name);
        return value ? value : "";
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
})(jQuery);