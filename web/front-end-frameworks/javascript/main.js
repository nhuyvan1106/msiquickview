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
            var currTime = Date.now();
            var statusDetail = d3.select("#status-container #status").append("div")
                    .attr("class", "status-detail");
            statusDetail.append("div")
                    .attr("id", currTime)
                    .text(excelFilename);
            statusDetail.append("div")
                    .attr("id", currTime + "-job-progress")
                    .text("In progress");
            showButtons("#status-toggle");
            
            $("#upload-excel-form-container").delay(250).fadeOut();
            $(".error-dialog").fadeOut();
            $(".toggler").click();
            var formData = new FormData();
            formData.append("user-dir", $("#upload-excel-form #user-dir").val());
            formData.append("dataset-name", $("#upload-excel-form #dataset-name").val());
            formData.append("file-type", fileNames.some(function(d) { return d.endsWith("cdf"); }) ? "cdf" : "hdf");
            formData.append("excel-file", excelFile);
            var xhr = new XMLHttpRequest();
            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        console.log("SUCCESS");
                        $(".status-detail #" + currTime + "-job-progress").text("Done");
                    }
                    else {
                        console.log("FAILURE");
                        $(".status-detail #" + currTime + "-job-progress").text("Error occurred");
                    }
                }
            };
            xhr.open("POST", url);
            xhr.send(formData);
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
                callback = function (count) {
                    populateList(userDir, "#" + target + " ul", count, true);
                };
                break;
            case "excel":
                callback = function (count) {
                    populateList(userDir, "#" + target + " ul", count, false);
                };
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
                        } else {
                            var map = {"limit": 10, "skip": images.length, "dataset-name": $("#selected-dataset").text(), "user-dir": getItemLocal("user-dir")};
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
                setTimeout(function() {
                    $(".refresh-status").remove();
                }, 2000);
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
            /*var interval = Math.floor(minMax[1] / 50);
            var domain = [];
            for (var k = 0; k < 49; k++)
                domain.push(k*interval);
            domain.push(minMax[1]);
            var colors = [];
            for (var j = 0; j < 50; j++) {
                var r = interpolate(0, 136, 50, j);
                var g = interpolate(0, 14, 50, j);
                var b = interpolate(0, 79, 50, j);
                colors.push("rgb(" + r + "," + g + "," + b + ")");
            }
            function interpolate(start, end, steps, count) {
                return Math.floor(start + ((end-start)/steps)*count);
            }*/
            //var colors = "000004,010005,010106,010108,02010a,02020c,02020e,030210,040312,040314,050417,060419,07051b,08051d,09061f,0a0722,0b0724,0c0826,0d0829,0e092b,10092d,110a30,120a32,140b34,150b37,160b39,180c3c,190c3e,1b0c41,1c0c43,1e0c45,1f0c48,210c4a,230c4c,240c4f,260c51,280b53,290b55,2b0b57,2d0b59,2f0a5b,310a5c,320a5e,340a5f,360961,380962,390963,3b0964,3d0965,3e0966,400a67,420a68,440a68,450a69,470b6a,490b6a,4a0c6b,4c0c6b,4d0d6c,4f0d6c,510e6c,520e6d,540f6d,550f6d,57106e,59106e,5a116e,5c126e,5d126e,5f136e,61136e,62146e,64156e,65156e,67166e,69166e,6a176e,6c186e,6d186e,6f196e,71196e,721a6e,741a6e,751b6e,771c6d,781c6d,7a1d6d,7c1d6d,7d1e6d,7f1e6c,801f6c,82206c,84206b,85216b,87216b,88226a,8a226a,8c2369,8d2369,8f2469,902568,922568,932667,952667,972766,982766,9a2865,9b2964,9d2964,9f2a63,a02a63,a22b62,a32c61,a52c60,a62d60,a82e5f,a92e5e,ab2f5e,ad305d,ae305c,b0315b,b1325a,b3325a,b43359,b63458,b73557,b93556,ba3655,bc3754,bd3853,bf3952,c03a51,c13a50,c33b4f,c43c4e,c63d4d,c73e4c,c83f4b,ca404a,cb4149,cc4248,ce4347,cf4446,d04545,d24644,d34743,d44842,d54a41,d74b3f,d84c3e,d94d3d,da4e3c,db503b,dd513a,de5238,df5337,e05536,e15635,e25734,e35933,e45a31,e55c30,e65d2f,e75e2e,e8602d,e9612b,ea632a,eb6429,eb6628,ec6726,ed6925,ee6a24,ef6c23,ef6e21,f06f20,f1711f,f1731d,f2741c,f3761b,f37819,f47918,f57b17,f57d15,f67e14,f68013,f78212,f78410,f8850f,f8870e,f8890c,f98b0b,f98c0a,f98e09,fa9008,fa9207,fa9407,fb9606,fb9706,fb9906,fb9b06,fb9d07,fc9f07,fca108,fca309,fca50a,fca60c,fca80d,fcaa0f,fcac11,fcae12,fcb014,fcb216,fcb418,fbb61a,fbb81d,fbba1f,fbbc21,fbbe23,fac026,fac228,fac42a,fac62d,f9c72f,f9c932,f9cb35,f8cd37,f8cf3a,f7d13d,f7d340,f6d543,f6d746,f5d949,f5db4c,f4dd4f,f4df53,f4e156,f3e35a,f3e55d,f2e661,f2e865,f2ea69,f1ec6d,f1ed71,f1ef75,f1f179,f2f27d,f2f482,f3f586,f3f68a,f4f88e,f5f992,f6fa96,f8fb9a,f9fc9d,fafda1,fcffa4";
            //var colors = "rgb(59,76,192)|rgb(60,78,194)|rgb(61,80,195)|rgb(62,81,197)|rgb(63,83,198)|rgb(64,85,200)|rgb(66,87,201)|rgb(67,88,203)|rgb(68,90,204)|rgb(69,92,206)|rgb(70,93,207)|rgb(71,95,209)|rgb(73,97,210)|rgb(74,99,211)|rgb(75,100,213)|rgb(76,102,214)|rgb(77,104,215)|rgb(79,105,217)|rgb(80,107,218)|rgb(81,109,219)|rgb(82,110,221)|rgb(84,112,222)|rgb(85,114,223)|rgb(86,115,224)|rgb(87,117,225)|rgb(89,119,226)|rgb(90,120,228)|rgb(91,122,229)|rgb(93,123,230)|rgb(94,125,231)|rgb(95,127,232)|rgb(96,128,233)|rgb(98,130,234)|rgb(99,131,235)|rgb(100,133,236)|rgb(102,135,237)|rgb(103,136,238)|rgb(104,138,239)|rgb(106,139,239)|rgb(107,141,240)|rgb(108,142,241)|rgb(110,144,242)|rgb(111,145,243)|rgb(112,147,243)|rgb(114,148,244)|rgb(115,150,245)|rgb(116,151,246)|rgb(118,153,246)|rgb(119,154,247)|rgb(120,156,247)|rgb(122,157,248)|rgb(123,158,249)|rgb(124,160,249)|rgb(126,161,250)|rgb(127,163,250)|rgb(129,164,251)|rgb(130,165,251)|rgb(131,167,252)|rgb(133,168,252)|rgb(134,169,252)|rgb(135,171,253)|rgb(137,172,253)|rgb(138,173,253)|rgb(140,174,254)|rgb(141,176,254)|rgb(142,177,254)|rgb(144,178,254)|rgb(145,179,254)|rgb(147,181,255)|rgb(148,182,255)|rgb(149,183,255)|rgb(151,184,255)|rgb(152,185,255)|rgb(153,186,255)|rgb(155,187,255)|rgb(156,188,255)|rgb(158,190,255)|rgb(159,191,255)|rgb(160,192,255)|rgb(162,193,255)|rgb(163,194,255)|rgb(164,195,254)|rgb(166,196,254)|rgb(167,197,254)|rgb(168,198,254)|rgb(170,199,253)|rgb(171,199,253)|rgb(172,200,253)|rgb(174,201,253)|rgb(175,202,252)|rgb(176,203,252)|rgb(178,204,251)|rgb(179,205,251)|rgb(180,205,251)|rgb(182,206,250)|rgb(183,207,250)|rgb(184,208,249)|rgb(185,208,248)|rgb(187,209,248)|rgb(188,210,247)|rgb(189,210,247)|rgb(190,211,246)|rgb(192,212,245)|rgb(193,212,245)|rgb(194,213,244)|rgb(195,213,243)|rgb(197,214,243)|rgb(198,214,242)|rgb(199,215,241)|rgb(200,215,240)|rgb(201,216,239)|rgb(203,216,238)|rgb(204,217,238)|rgb(205,217,237)|rgb(206,217,236)|rgb(207,218,235)|rgb(208,218,234)|rgb(209,219,233)|rgb(210,219,232)|rgb(211,219,231)|rgb(213,219,230)|rgb(214,220,229)|rgb(215,220,228)|rgb(216,220,227)|rgb(217,220,225)|rgb(218,220,224)|rgb(219,220,223)|rgb(220,221,222)|rgb(221,221,221)|rgb(222,220,219)|rgb(223,220,218)|rgb(224,219,216)|rgb(225,219,215)|rgb(226,218,214)|rgb(227,218,212)|rgb(228,217,211)|rgb(229,216,209)|rgb(230,216,208)|rgb(231,215,206)|rgb(232,215,205)|rgb(232,214,203)|rgb(233,213,202)|rgb(234,212,200)|rgb(235,212,199)|rgb(236,211,197)|rgb(236,210,196)|rgb(237,209,194)|rgb(238,209,193)|rgb(238,208,191)|rgb(239,207,190)|rgb(240,206,188)|rgb(240,205,187)|rgb(241,204,185)|rgb(241,203,184)|rgb(242,202,182)|rgb(242,201,181)|rgb(243,200,179)|rgb(243,199,178)|rgb(244,198,176)|rgb(244,197,174)|rgb(245,196,173)|rgb(245,195,171)|rgb(245,194,170)|rgb(245,193,168)|rgb(246,192,167)|rgb(246,191,165)|rgb(246,190,163)|rgb(246,188,162)|rgb(247,187,160)|rgb(247,186,159)|rgb(247,185,157)|rgb(247,184,156)|rgb(247,182,154)|rgb(247,181,152)|rgb(247,180,151)|rgb(247,178,149)|rgb(247,177,148)|rgb(247,176,146)|rgb(247,174,145)|rgb(247,173,143)|rgb(247,172,141)|rgb(247,170,140)|rgb(247,169,138)|rgb(247,167,137)|rgb(247,166,135)|rgb(246,164,134)|rgb(246,163,132)|rgb(246,161,131)|rgb(246,160,129)|rgb(245,158,127)|rgb(245,157,126)|rgb(245,155,124)|rgb(244,154,123)|rgb(244,152,121)|rgb(244,151,120)|rgb(243,149,118)|rgb(243,147,117)|rgb(242,146,115)|rgb(242,144,114)|rgb(241,142,112)|rgb(241,141,111)|rgb(240,139,109)|rgb(240,137,108)|rgb(239,136,106)|rgb(238,134,105)|rgb(238,132,103)|rgb(237,130,102)|rgb(236,129,100)|rgb(236,127,99)|rgb(235,125,97)|rgb(234,123,96)|rgb(233,121,95)|rgb(233,120,93)|rgb(232,118,92)|rgb(231,116,90)|rgb(230,114,89)|rgb(229,112,88)|rgb(228,110,86)|rgb(227,108,85)|rgb(227,106,83)|rgb(226,104,82)|rgb(225,102,81)|rgb(224,100,79)|rgb(223,98,78)|rgb(222,96,77)|rgb(221,94,75)|rgb(220,92,74)|rgb(218,90,73)|rgb(217,88,71)|rgb(216,86,70)|rgb(215,84,69)|rgb(214,82,67)|rgb(213,80,66)|rgb(212,78,65)|rgb(210,75,64)|rgb(209,73,62)|rgb(208,71,61)|rgb(207,69,60)|rgb(205,66,59)|rgb(204,64,57)|rgb(203,62,56)|rgb(202,59,55)|rgb(200,57,54)|rgb(199,54,53)|rgb(198,51,52)|rgb(196,49,50)|rgb(195,46,49)|rgb(193,43,48)|rgb(192,40,47)|rgb(190,37,46)|rgb(189,34,45)|rgb(188,30,44)|rgb(186,26,43)|rgb(185,22,41)|rgb(183,17,40)|rgb(181,11,39)|rgb(180,4,38)";
            var colors = "rgb(3,0,0)|rgb(5,0,0)|rgb(8,0,0)|rgb(11,0,0)|rgb(13,0,0)|rgb(16,0,0)|rgb(19,0,0)|rgb(21,0,0)|rgb(24,0,0)|rgb(27,0,0)|rgb(30,0,0)|rgb(32,0,0)|rgb(35,0,0)|rgb(38,0,0)|rgb(40,0,0)|rgb(43,0,0)|rgb(46,0,0)|rgb(48,0,0)|rgb(51,0,0)|rgb(54,0,0)|rgb(56,0,0)|rgb(59,0,0)|rgb(62,0,0)|rgb(64,0,0)|rgb(67,0,0)|rgb(70,0,0)|rgb(72,0,0)|rgb(75,0,0)|rgb(78,0,0)|rgb(81,0,0)|rgb(83,0,0)|rgb(86,0,0)|rgb(89,0,0)|rgb(91,0,0)|rgb(94,0,0)|rgb(97,0,0)|rgb(99,0,0)|rgb(102,0,0)|rgb(105,0,0)|rgb(107,0,0)|rgb(110,0,0)|rgb(113,0,0)|rgb(115,0,0)|rgb(118,0,0)|rgb(121,0,0)|rgb(123,0,0)|rgb(126,0,0)|rgb(129,0,0)|rgb(132,0,0)|rgb(134,0,0)|rgb(137,0,0)|rgb(140,0,0)|rgb(142,0,0)|rgb(145,0,0)|rgb(148,0,0)|rgb(150,0,0)|rgb(153,0,0)|rgb(156,0,0)|rgb(158,0,0)|rgb(161,0,0)|rgb(164,0,0)|rgb(166,0,0)|rgb(169,0,0)|rgb(172,0,0)|rgb(174,0,0)|rgb(177,0,0)|rgb(180,0,0)|rgb(183,0,0)|rgb(185,0,0)|rgb(188,0,0)|rgb(191,0,0)|rgb(193,0,0)|rgb(196,0,0)|rgb(199,0,0)|rgb(201,0,0)|rgb(204,0,0)|rgb(207,0,0)|rgb(209,0,0)|rgb(212,0,0)|rgb(215,0,0)|rgb(217,0,0)|rgb(220,0,0)|rgb(223,0,0)|rgb(225,0,0)|rgb(228,0,0)|rgb(231,0,0)|rgb(234,0,0)|rgb(236,0,0)|rgb(239,0,0)|rgb(242,0,0)|rgb(244,0,0)|rgb(247,0,0)|rgb(250,0,0)|rgb(252,0,0)|rgb(255,0,0)|rgb(255,3,0)|rgb(255,5,0)|rgb(255,8,0)|rgb(255,11,0)|rgb(255,13,0)|rgb(255,16,0)|rgb(255,19,0)|rgb(255,21,0)|rgb(255,24,0)|rgb(255,27,0)|rgb(255,30,0)|rgb(255,32,0)|rgb(255,35,0)|rgb(255,38,0)|rgb(255,40,0)|rgb(255,43,0)|rgb(255,46,0)|rgb(255,48,0)|rgb(255,51,0)|rgb(255,54,0)|rgb(255,56,0)|rgb(255,59,0)|rgb(255,62,0)|rgb(255,64,0)|rgb(255,67,0)|rgb(255,70,0)|rgb(255,72,0)|rgb(255,75,0)|rgb(255,78,0)|rgb(255,81,0)|rgb(255,83,0)|rgb(255,86,0)|rgb(255,89,0)|rgb(255,91,0)|rgb(255,94,0)|rgb(255,97,0)|rgb(255,99,0)|rgb(255,102,0)|rgb(255,105,0)|rgb(255,107,0)|rgb(255,110,0)|rgb(255,113,0)|rgb(255,115,0)|rgb(255,118,0)|rgb(255,121,0)|rgb(255,123,0)|rgb(255,126,0)|rgb(255,129,0)|rgb(255,132,0)|rgb(255,134,0)|rgb(255,137,0)|rgb(255,140,0)|rgb(255,142,0)|rgb(255,145,0)|rgb(255,148,0)|rgb(255,150,0)|rgb(255,153,0)|rgb(255,156,0)|rgb(255,158,0)|rgb(255,161,0)|rgb(255,164,0)|rgb(255,166,0)|rgb(255,169,0)|rgb(255,172,0)|rgb(255,174,0)|rgb(255,177,0)|rgb(255,180,0)|rgb(255,183,0)|rgb(255,185,0)|rgb(255,188,0)|rgb(255,191,0)|rgb(255,193,0)|rgb(255,196,0)|rgb(255,199,0)|rgb(255,201,0)|rgb(255,204,0)|rgb(255,207,0)|rgb(255,209,0)|rgb(255,212,0)|rgb(255,215,0)|rgb(255,217,0)|rgb(255,220,0)|rgb(255,223,0)|rgb(255,225,0)|rgb(255,228,0)|rgb(255,231,0)|rgb(255,234,0)|rgb(255,236,0)|rgb(255,239,0)|rgb(255,242,0)|rgb(255,244,0)|rgb(255,247,0)|rgb(255,250,0)|rgb(255,252,0)|rgb(255,255,0)|rgb(255,255,4)|rgb(255,255,8)|rgb(255,255,12)|rgb(255,255,16)|rgb(255,255,20)|rgb(255,255,24)|rgb(255,255,27)|rgb(255,255,31)|rgb(255,255,35)|rgb(255,255,39)|rgb(255,255,43)|rgb(255,255,47)|rgb(255,255,51)|rgb(255,255,55)|rgb(255,255,59)|rgb(255,255,63)|rgb(255,255,67)|rgb(255,255,71)|rgb(255,255,75)|rgb(255,255,78)|rgb(255,255,82)|rgb(255,255,86)|rgb(255,255,90)|rgb(255,255,94)|rgb(255,255,98)|rgb(255,255,102)|rgb(255,255,106)|rgb(255,255,110)|rgb(255,255,114)|rgb(255,255,118)|rgb(255,255,122)|rgb(255,255,126)|rgb(255,255,129)|rgb(255,255,133)|rgb(255,255,137)|rgb(255,255,141)|rgb(255,255,145)|rgb(255,255,149)|rgb(255,255,153)|rgb(255,255,157)|rgb(255,255,161)|rgb(255,255,165)|rgb(255,255,169)|rgb(255,255,173)|rgb(255,255,177)|rgb(255,255,180)|rgb(255,255,184)|rgb(255,255,188)|rgb(255,255,192)|rgb(255,255,196)|rgb(255,255,200)|rgb(255,255,204)|rgb(255,255,208)|rgb(255,255,212)|rgb(255,255,216)|rgb(255,255,220)|rgb(255,255,224)|rgb(255,255,228)|rgb(255,255,231)|rgb(255,255,235)|rgb(255,255,239)|rgb(255,255,243)|rgb(255,255,247)|rgb(255,255,251)|rgb(255,255,255)".split("|");
            //colors = colors.split(",").map(function(d) { return "#" + d; });
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