/* global d3, pnnl */

(function ($) {
    var currentIndex = -1;
    var resultData = {};
    var offset = 0;
    var moveTo = 0;
    var totalElementsRead = 0;
    var dispatch = d3.dispatch("selectionchange");
    dispatch.on("selectionchange", function () {
        d3.selectAll(".file-selection-dialog li i")
                .transition()
                .duration(200)
                .style("opacity", 0)
                .each(function () {
                    $(this).removeClass("fa-check fa-hand-o-left");
                });
        $(this).find("i").addClass("fa-hand-o-left").animate({"opacity": "1.0"});
    });
    $("#user-dir").val(window.localStorage.getItem("user-dir") ? window.localStorage.getItem("user-dir") : "");
    d3.select(".load-data").on("click", function () {
        d3.event.stopImmediatePropagation();
        pnnl.data.upload(document.getElementById("user-dir").value, document.getElementById("file-name").files,
                function () {
                    log("DONE");
                    /*var dispatch = d3.dispatch("selectionchange");
                     dispatch.on("selectionchange", function () {
                     d3.selectAll(".file-selection-dialog li i")
                     .transition()
                     .duration(500)
                     .style("opacity", 0)
                     .each(function () {
                     $(this).removeClass("fa-check fa-hand-o-left");
                     });
                     $(this).find("i").addClass("fa-hand-o-left");
                     });*/
                    $(".file-selection-dialog .alert-dialog-header-title").html("Click on file to load");
                    d3.select(".file-selection-dialog").selectAll("li").each(function (d, i) {
                        $(this).find(".file-upload-spinner" + i).removeClass("fa-pulse fa-spinner").addClass("fa-check");
                        var elem = this;
                        /*setTimeout(function () {
                         d3.select(elem).select("i")
                         .transition()
                         .duration(500)
                         .style("opacity", 0)
                         .each(function () {
                         $(this).removeClass("fa-check");
                         });
                         }, 2000);*/
                        d3.select(this).on("click", function () {
                            if (window.sessionStorage.getItem("file-name") !== this.id || d3.select(".intensity-scan-chart").empty()) {
                                pnnl.draw.drawSpinner().drawOverlay();
                                loadData(window.localStorage.getItem("user-dir"), this.id);
                                window.sessionStorage.setItem("file-name", this.id);
                                dispatch.call("selectionchange", this);
                            }
                        });
                    });
                }, errorCallback);
    });


    $(".next").click(function () {
        if (currentIndex < resultData.pointCount.length - 1) {
            currentIndex++;
            //if (currentIndex !== resultData.pointCount.length) {
            moveTo += 690 / resultData.pointCount.length;
            pnnl.draw.moveIndicatorBar(moveTo);
            //}
            if (currentIndex % 20 === 0 && currentIndex !== 0 && currentIndex !== resultData.length - 1) {
                pnnl.draw.drawOverlay().drawSpinner();
                pnnl.data.fetch(offset, "forward", currentIndex, currentIndex + 20, successCallback, errorCallback);
                function successCallback(intensityMass) {
                    totalElementsRead = 0;
                    resultData.intensityMass = intensityMass;
                    drawIntensityMassChart(resultData.intensityMass.slice(totalElementsRead,
                            totalElementsRead + resultData.pointCount[currentIndex]));
                    totalElementsRead += resultData.pointCount[currentIndex];
                    offset += resultData.pointCount[currentIndex];
                    pnnl.draw.removeSpinnerOverlay();
                }
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
        }
        if (currentIndex > 0 && currentIndex % 20 !== 0) {
            currentIndex--;
            drawIntensityMassChart(resultData.intensityMass.slice(totalElementsRead - resultData.pointCount[currentIndex], totalElementsRead));
        } else if (currentIndex > 0) {
            pnnl.draw.drawSpinner().drawOverlay();
            pnnl.data.fetch(offset, "backward", currentIndex - 20, currentIndex, successCallback, errorCallback);
            function successCallback(intensityMass) {
                resultData.intensityMass = intensityMass;
                totalElementsRead = intensityMass.length;
                currentIndex--;
                drawIntensityMassChart(intensityMass.slice(totalElementsRead - resultData.pointCount[currentIndex], totalElementsRead));
                pnnl.draw.removeSpinnerOverlay();
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
                "left": 50
            },
            "yLabel": "1.0e+7",
            "className": "intensity-mass-chart",
            "idName": "intensity-mass-chart-id"
        };
        pnnl.draw.drawLineGraph(config, data);
        /*
         * Intensity / Mass values chart may not be drawn to the screen yet, so we set a 500ms delay so d3.select()
         * will not be empty which will not render the brushable area otherwise.
         */
        setTimeout(function () {
            d3.select(".intensity-mass-chart").append("g")
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
                                log(d3.event.selection.map(x.invert));
                            }));
        }, 500);
    }
    // Just a convenient function to remove code duplication.
    function loadData(userDir, file) {
        var url = "http://localhost:8080/Java-Matlab-Integration/DataFetcherServlet/load-data";
        pnnl.data.loadData(userDir, file, successCallback, errorCallback);
        currentIndex = -1;
        offset = 0;
        totalElementsRead = 0;
        moveTo = 0;
        function successCallback(totalIntensity, scanAcquisitionTime, intensityValues, massValues, pointCount) {
            var config = {"width": parseInt(d3.select('#intensity-scan-chart-id').style('width'), 10), "height": 500,
                "margin": {"top": 30, "right": 20, "bottom": 20, "left": 50}, "yLabel": "1.0e+8", "className": "intensity-scan-chart", "idName": "intensity-scan-chart-id"
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
        var messageBody = "<div>Status Code: " + xhr.status + "</div>" +
                "<div>Status Message: " + xhr.statusText + "</div>Please contact technical support";
        /*if ($(".alert-dialog").attr("class").split(" ").length === 1)
         d3.select("." + pnnl.dialog.dialogClassName).remove();*/
        pnnl.dialog.newDialogBuilder()
                .createAlertDialog("alert-dialog")
                .setHeaderIcon("fa-frown-o")
                .setMessageBody(messageBody)
                .setCloseActionButton()
                .show();
    }
    function log(msg) {
        console.log(msg);
    }
    
})(jQuery);