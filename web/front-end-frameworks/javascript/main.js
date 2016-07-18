/* global d3, pnnl */

(function ($) {
    var currentIndex = -1;
    var resultData = {};
    var offset = 0;
    var moveTo = 0;
    var totalElementsRead = 0;

    // Immediately populates these form fiels using their respective data saved locally before.
    $("#user-dir").val(window.localStorage.getItem("user-dir") ? window.localStorage.getItem("user-dir") : "");
    $("#dataset-name").val(window.sessionStorage.getItem("dataset-name") ? window.sessionStorage.getItem("dataset-name") : "");
    d3.select(".upload").on("click", function () {
        var url = "http://localhost:8080/Java-Matlab-Integration/UploaderServlet/upload";
        //window.history.pushState({}, "", url);
        d3.event.stopImmediatePropagation();
        if (!pnnl.validation.validate("upload"))
            return;
        else {
            // We are using D3 Dispatches module to handle updating icon when an item is clicked in file selection dialog.
            var dispatch = d3.dispatch("selectionchange");
            dispatch.on("selectionchange", function () {
                $(".file-selection-dialog li i").each(function() {
                    $(this).removeClass("fa-check fa-hand-o-left");
                });
                $(this).find("i").addClass("fa-hand-o-left");
            });
            $(".file-selection-dialog").fadeOut().remove();
            var ul = $("<ul></ul>");
            var files = Array.prototype.map.call(document.getElementById("file-name").files, function (file) {
                return file;
            });
            // Store user-entered directory and dataset name in browser-specific database to improve UI
            var userDir = document.getElementById("user-dir").value;
            var datasetName = document.getElementById("dataset-name").value;

            window.sessionStorage.setItem("file-names", files.map(function (file) {
                var fileName = pnnl.data.getFileName(file);
                ul.append("<li id='" + fileName + "'>" + fileName + "<i class='fa fa-spinner fa-pulse file-upload-spinner' style='position: absolute; right: 20px; top: 15px;'></i></li>");
                return fileName;
            }).reduce(function (prev, next) {
                return prev + "," + next;
            }));
            window.localStorage.setItem("user-dir", userDir);
            window.sessionStorage.setItem("dataset-name", datasetName);

            pnnl.dialog.newDialogBuilder()
                    .createAlertDialog("file-selection-dialog", "file-selection-dialog")
                    .setHeaderTitle("Uploading...", "file-selection-dialog-header")
                    .setCloseActionButton()
                    .setMessageBody(ul)
                    .show();
            $(".file-selection-dialog").css("position", "absolute");
            $(".file-selection-dialog-header").mousedown(function (e) {
                var fileDialog = document.getElementById("file-selection-dialog");
                var top = e.pageY - fileDialog.getBoundingClientRect().top - pnnl.utils.getScrollTop();
                var left = e.pageX - fileDialog.getBoundingClientRect().left;

                $(fileDialog).mousemove(function (event) {
                    event.stopImmediatePropagation();
                    $(this).css({"top": event.pageY - top, "left": event.pageX - left, "bottom": "initial", "right": "initial"});
                });
            });
            $(document.documentElement).on("mouseup", function () {
                $(".file-selection-dialog").off("mousemove");
            });
            pnnl.data.upload(url, userDir, datasetName, files,
                    function () {
                        $(document.documentElement).off("contextmenu click").contextmenu(function (event) {
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
                        }).click(function () {
                            $(".context-menu-dialog").hide();
                        });
                        $(".file-selection-dialog .alert-dialog-header-title").html("Click on file to load");
                        d3.select(".file-selection-dialog").selectAll("li").each(function (d, i) {
                            $(this).find(".file-upload-spinner").removeClass("fa-pulse fa-spinner").addClass("fa-check");
                            d3.select(this).on("click", function () {
                                if (window.sessionStorage.getItem("file-name") !== this.id || d3.select(".intensity-scan-chart").empty()) {
                                    pnnl.draw.drawSpinner();
                                    pnnl.draw.drawOverlay();
                                    loadData(window.localStorage.getItem("user-dir"), window.sessionStorage.getItem("dataset-name"), this.id);
                                    window.sessionStorage.setItem("file-name", this.id);
                                    dispatch.call("selectionchange", this);
                                }
                            });
                        });
                    }, errorCallback);
        }
    });


    $(".next").click(function () {
        if (currentIndex < resultData.pointCount.length - 1) {
            currentIndex++;
            moveTo += 690 / resultData.pointCount.length;
            pnnl.draw.moveIndicatorBar(moveTo);
            if (currentIndex % 20 === 0 && currentIndex !== 0 /*&& currentIndex !== resultData.length - 1*/) {
                var url = "http://localhost:8080/Java-Matlab-Integration/DataFetcherServlet/load-more";
                //window.history.pushState({}, "", url);
                pnnl.draw.drawOverlay().drawSpinner();
                var fileName = window.sessionStorage.getItem("file-name");
                var requestParams = {
                    "file-name": fileName,
                    "dataset-name": window.sessionStorage.getItem("dataset-name"),
                    "user-dir": window.localStorage.getItem("user-dir"),
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
    $(".prev").click(function () {
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
                pnnl.draw.drawSpinner().drawOverlay();
                var fileName = window.sessionStorage.getItem("file-name");
                var requestParams = {
                    "file-name": fileName,
                    "dataset-name": window.sessionStorage.getItem("dataset-name"),
                    "user-dir": window.localStorage.getItem("user-dir"),
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
                                                pnnl.draw.drawOverlay().drawSpinner();
                                                var fileNames = window.sessionStorage.getItem("file-names");
                                                $.ajax("http://localhost:8080/Java-Matlab-Integration/IonImageGeneratorServlet/generate-image",
                                                        {
                                                            "method": "GET",
                                                            "data": {
                                                                "user-dir": window.localStorage.getItem("user-dir"),
                                                                "dataset-name": window.sessionStorage.getItem("dataset-name"),
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
                                                                //$(".ion-image").remove();
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
                                                                errorCallback(xhr);
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
            $(".nav-buttons").hide();
            $(".nav-buttons").show()
                    .insertAfter("svg")
                    .css({"position": "relative", "top": config.height + config.top + config.bottom, "left": config.width / 2 - 25});
        }
    }
    // Global HTTP request response error handling
    function errorCallback(xhr) {
        pnnl.draw.removeSpinnerOverlay();
        var messageBody = "<div>Error Code: " + xhr.status + "</div>" +
                "<div>Error Message: " + xhr.statusText + "</div>Please contact technical support";
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
                                pnnl.draw.drawSpinner().drawOverlay();
                                svgAsPngUri(document.getElementById(selectedImageId), {}, function (uri) {
                                    var url = "http://localhost:8080/Java-Matlab-Integration/UploaderServlet/save-image";
                                    var formData = new FormData();
                                    formData.append("user-dir", window.localStorage.getItem("user-dir"));
                                    formData.append("dataset-name", window.sessionStorage.getItem("dataset-name"));
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
                                                                    .css("top", 10 + pnnl.utils.getScrollTop() + "px")
                                                                    .delay(5000).fadeOut();
                                                        });
                                            else
                                                errorCallback(xhr);
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
    function log(msg) {
        console.log(msg);
    }

})(jQuery);