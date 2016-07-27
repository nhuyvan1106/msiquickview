/* global d3, pnnl */

(function ($) {
    // Immediately populates these form fiels using their respective data saved locally before.
    $("form #user-dir").val(getItemLocal("user-dir"));
    $("form #dataset-name").val(getItemSession("dataset-name") ? getItemSession("dataset-name") : "");
    d3.select("#upload-cdf-hdf-form .upload").on("click", function () {
        var url = "http://localhost:8080/Java-Matlab-Integration/UploaderServlet/upload";
        //window.history.pushState({}, "", url);
        d3.event.stopImmediatePropagation();
        if (!pnnl.validation.validate("upload-cdf-hdf-form"))
            return;
        else {
            var files = Array.prototype.map.call(document.getElementById("file-name").files, function (file) {
                return file;
            });

            if (files.some(function (file) {
                return !file.name.endsWith("cdf") && !file.name.endsWith("hdf");
            })) {
                errorCallback("Some files in your selection are not .cdf or .hdf files");
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
            pnnl.data.upload(url, userDir, datasetName, files,
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
                                    window.sessionStorage.setItem("file-name", this.id);
                                }
                            });
                        });
                    }, errorCallback);
        }
    });

    d3.select("#upload-excel-form .upload").on("click", function () {
        var url = "http://localhost:8080/Java-Matlab-Integration/UploaderServlet/extract-excel";
        //window.history.pushState({}, "", url);
        d3.event.stopImmediatePropagation();
        if (!pnnl.validation.validate("upload-excel-form"))
            return;
        else {
            var file = $("#upload-excel-form #file-name").get(0).files[0];
            if (!file.name.endsWith("xls") && !file.name.endsWith("xlsx")) {
                errorCallback("File selected is not an excel file");
                return;
            }
            $("#upload-excel-form-container").delay(250).fadeOut();
            $(".error-dialog").fadeOut();
            $(".toggler").click();
            var formData = new FormData();
            formData.append("user-dir", "vann363");
            formData.append("dataset-name", "nic");
            formData.append("excel-file", file);

            var xhr = new XMLHttpRequest();
            xhr.onreadystatechange = function () {
                if (xhr.readystate === 4) {
                    if (xhr.status === 200)
                        console.log("SUCCESS");
                    else
                        console.log("FAILURE");
                }
            };
            xhr.open("POST", url);
            xhr.send(formData);
        }
    });

    $("#load-more-container li").click(function () {
        var url = "http://localhost:8080/Java-Matlab-Integration/DirectoryInspectorServlet/load-more-images";
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
        var url = "http://localhost:8080/Java-Matlab-Integration/DirectoryInspectorServlet/refresh";
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
                            var url = "http://localhost:8080/Java-Matlab-Integration/DirectoryInspectorServlet/load-more-images";
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
                $("<span class='refresh-status' style='position:absolute;margin-left:-50px;margin-top:15px;color:gray;font-size:large'>Done</span>").insertBefore("#action-container");
                setTimeout(function() {
                    $(".refresh-status").remove();
                }, 2000);
                update("http://localhost:8080/Java-Matlab-Integration/DirectoryInspectorServlet/view-files", data.datasets);
                callback(data.payload);
            },
            "error": function (xhr) {
                errorCallback(xhr.statusMessage);
                $("<span class='refresh-status' style='position:absolute;margin-left:-50px;margin-top:15px;color:gray;font-size:large'>Done</span>").insertBefore("#action-container");
                setTimeout(function() {
                    $(".refresh-status").remove();
                }, 2000);
            }
        });
    });

    d3.select("#show-uploaded-files-form .show").on("click", function () {
        var url = "http://localhost:8080/Java-Matlab-Integration/DirectoryInspectorServlet/view-files";
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
                var url = "http://localhost:8080/Java-Matlab-Integration/DataFetcherServlet/load-more";
                //window.history.pushState({}, "", url);
                pnnl.draw.drawOverlay();
                pnnl.draw.drawSpinner();
                var fileName = getItemSession("file-name");
                var requestParams = {
                    "file-name": fileName,
                    "dataset-name": getItemSession("dataset-name"),
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
                log("***************************");
                log("TOTAL ELEMENTS READ: " + offset);
                log("CURRENT INDEX: " + currentIndex);
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
                var url = "http://localhost:8080/Java-Matlab-Integration/DataFetcherServlet/load-more";
                //window.history.pushState({}, "", url);
                pnnl.draw.drawSpinner();
                pnnl.draw.drawOverlay();
                var fileName = getItemSession("file-name");
                var requestParams = {
                    "file-name": fileName,
                    "dataset-name": getItemSession("dataset-name"),
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
        }
        log("***************************");
        log("TOTAL ELEMENTS READ: " + offset);
        log("CURRENT INDEX: " + currentIndex);
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
                                log(range);
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
                                                $.ajax("http://localhost:8080/Java-Matlab-Integration/IonImageGeneratorServlet/generate-image",
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
                                                                var result = [];
                                                                for (var i = 0; i < dimensions[0]; i++) {
                                                                    result.push([]);
                                                                    for (var j = i; j < data.length; j += dimensions[0])
                                                                        result[i].push(data[j]);
                                                                }
                                                                drawImage(config, range, d3.extent(data, function (d) {
                                                                    return d;
                                                                }), result, dimensions[0]);
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
        var url = "http://localhost:8080/Java-Matlab-Integration/DataFetcherServlet/load-data";
        //window.history.pushState({}, "", url);
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

    function drawImage(config, range, bounds, dataArray, dimension) {
        var margin = {top: 20, right: 15, bottom: 10, left: 15};
        var width = 350 - margin.left - margin.right;
        var height = 500 - margin.top - margin.bottom;
        // We use selected range for this image id
        var id = range.join("-");
        var svg = d3.select("#" + config.idName)
                .append("svg")
                .attr("id", id)
                .attr("class", getItemSession("dataset-name"))
                // Show a dialog when user right clicks on an image
                .on("contextmenu", function () {
                    var body = "<li id='save-image'>Save</li>";
                    var selectedImageId = d3.event.currentTarget.id;
                    showContextDialog(d3.event, body, function (event) {
                        switch (this.id) {
                            case "hide-dialog":
                                $(".file-selection-dialog").fadeOut();
                                break;
                            case "show-dialog":
                                $(".file-selection-dialog").fadeIn().css({"top": event.pageY, "left": event.pageX});
                                break;
                            case "save-image":
                                pnnl.draw.drawSpinner();
                                pnnl.draw.drawOverlay();

                                svgAsPngUri(document.getElementById(selectedImageId), {}, function (uri) {
                                    var url = "http://localhost:8080/Java-Matlab-Integration/UploaderServlet/save-image";
                                    var formData = new FormData();
                                    formData.append("user-dir", getItemLocal("user-dir"));
                                    var datasetName = document.getElementById(selectedImageId).className.baseVal;
                                    formData.append("dataset-name", datasetName ? datasetName : $("#selected-dataset").text());
                                    formData.append("image-name", selectedImageId);
                                    formData.append("image-data", uri.replace("data:image/png;base64,", ""));
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
                                                        .show(function (id) {
                                                            $(id).fadeIn()
                                                                    //.css({"bottom": "10px", "position": "fixed"})
                                                                    .delay(5000).fadeOut();
                                                        });
                                            else
                                                errorCallback(xhr.statusText);
                                        }
                                    };

                                    xhr.open("POST", url);
                                    xhr.send(formData);
                                });
                                break;
                        }
                    });
                })
                .attr("width", width + margin.left + margin.right)
                .attr("height", 280)
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        for (var i = 0; i < dimension; ++i) {
            var xScale = d3.scaleBand()
                    .domain(dataArray[i])
                    .range([0, width]);
            var yScale = d3.scaleOrdinal()
                    .domain([i])
                    .range([height / dimension]);
            var interval = Math.floor(bounds[1] / 5);
            var colorScale = d3.scaleLinear()
                    .domain([bounds[0], interval, interval * 2, interval * 3, interval * 4, bounds[1]])
                    .range(["#0a0", "#6c0", "#ee0", "#eb4", "#eb9", "#fff"]);


            svg.selectAll(".tile-" + i)
                    .data(dataArray[i])
                    .enter()
                    .append("rect")
                    .attr("class", "tile-" + i)
                    .attr("x", function (d) {
                        return xScale(d);
                    })
                    .attr("y", function (d) {
                        return (yScale(i) / 2) * i;
                    })
                    .attr("width", function (d) {
                        return xScale.bandwidth();
                    })
                    .attr("height", function () {
                        return yScale(i) / 2;
                    })
                    .style("stroke-width", "0")
                    .style("fill", function (d) {
                        return colorScale(d);
                    });
            svg.append("text")
                    .attr("y", 250)
                    // We want to center the text under the image. 7.6968571429: Character width in the current font
                    .attr("x", (width - 7.6968571429 * id.length) / 2)
                    .text(id)
                    .style("font-family", "monospace");
        }
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
                $("#tabs-container").fadeIn()
                        .css("left", (screen.width - $("#tabs-container").width()) / 2 + "px")
                        .find("#cdf-tab")
                        .click();
            },
            "error": function (xhr) {
                errorCallback(xhr.statusText);
                console.log(xhr);
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
        joined.attr("id", function (d) {
            return d;
        }).select("span").text(function (d) {
            return d;
        });
        var enter = joined.enter().append("li").attr("id", function (d) {
            return d;
        });
        enter.append("span").text(function (d) {
            return d;
        });

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
                });
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
        data["image-data"].forEach(function (d, i) {
            var div = document.createElement("div");
            div.className = "image-container";
            var img = document.createElement("img");
            img.src = "data:image/png;base64," + d;
            img.alt = data.images[i];
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
    function log(msg) {
        console.log(msg);
    }

})(jQuery);