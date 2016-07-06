/* global pnnl, d3 */

(function ($) {
    var currentIndex = 0;
    var resultData = {};
    var offset = 0;
    var pointWidth = 0;
    var totalElementsRead = 0;
    d3.select(document.documentElement).on("click", function () {
        if (!$(d3.event.target).parents().hasClass(pnnl.dialog.dialogClassName) && $(".alert-dialog").css("display") !== "none") {
            pnnl.dialog.hide();
            pnnl.draw.removeSpinnerOverlay();
        }
    });
    d3.select(".load-data").on("click", function () {
        d3.event.stopImmediatePropagation();
        if (window.localStorage.getItem("should-show") !== "true") {
            var messageBody = "<span>" +
                    "Initial request to load a new file often takes more or less than 20 seconds." +
                    " Do you wish to proceed?" +
                    "</span>" +
                    "<form style='text-align: center; width:320px'>" +
                    "<input type='checkbox' class='should-show' id='should-show'/>&nbsp;" +
                    "<label for='should-show'>Never show me this</label>" +
                    "</form>";
            pnnl.dialog.createAlertDialog()
                    .setHeaderIcon()
                    .setCloseActionButton()
                    .setPositiveButton("Yes", loadData)
                    .setNegativeButton("Cancel")
                    .setMessageBody(messageBody)
                    .show();
            d3.select("#should-show").on("change", function() {
                window.localStorage.setItem("should-show", this.checked);
            });
        } else
            loadData();
    });

    $(".next").click(function () {
        if (currentIndex < resultData.pointCount.length - 1) {
            currentIndex++;
            if (currentIndex !== resultData.pointCount.length) {
                pointWidth += 690 / resultData.pointCount.length;
                pnnl.draw.moveIndicatorBar(pointWidth);
            }
            if (currentIndex % 20 === 0 && currentIndex !== 0 && currentIndex !== resultData.length - 1) {
                pnnl.draw.drawOverlay().drawSpinner();
                pnnl.data.fetch(offset, "forward", currentIndex, currentIndex + 20, successCallback, errorHandler);
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
            pointWidth -= 690 / resultData.pointCount.length;
            pnnl.draw.moveIndicatorBar(pointWidth);
            offset -= resultData.pointCount[currentIndex];
            totalElementsRead -= resultData.pointCount[currentIndex];
        }
        if (currentIndex > 0 && currentIndex % 20 !== 0) {
            currentIndex--;
            drawIntensityMassChart(resultData.intensityMass.slice(totalElementsRead - resultData.pointCount[currentIndex], totalElementsRead));
        } else if (currentIndex > 0) {
            pnnl.draw.drawSpinner().drawOverlay();
            pnnl.data.fetch(offset, "backward", currentIndex - 20, currentIndex, successCallback, errorHandler);
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
            "width": 760,
            "height": 500,
            "margin": {
                "top": 30,
                "right": 20,
                "bottom": 20,
                "left": 50
            },
            "yLabel": "1.0e+7",
            "className": "intensity-mass-chart"
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
    // Just a convinient function to remove code duplication.
    function loadData() {
        pnnl.draw.drawSpinner();
        pnnl.draw.drawOverlay();
        var file = document.getElementById("file-name").files[0];
        if (d3.select("svg").empty() || window.sessionStorage.getItem("file-name") !== pnnl.data.getFileName(file)) {
            pnnl.data.loadData(file, successCallback, errorHandler);
            currentIndex = -1;
        }
        function successCallback(totalIntensity, scanAcquisitionTime, intensityValues, massValues, pointCount) {
            var config = {"width": 760, "height": 500,
                "margin": {"top": 30, "right": 20, "bottom": 20, "left": 50}, "yLabel": "1.0e+8", "className": "intensity-scan-chart"
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
                    .css({"position": "absolute", "top": config.height + config.top + config.bottom, "left": config.width / 2 - 25});
        }
    }
    
    function errorHandler(xhr) {
        pnnl.draw.removeSpinnerOverlay();
        var messageBody = "<div>Status Code: " + xhr.status + "</div>" + 
                          "<div>Status Message: " + xhr.statusText + "</div>Please contact technical support";
        d3.select("." + pnnl.dialog.dialogClassName).remove();
            pnnl.dialog.createAlertDialog("error-alert-dialog")
                .setHeaderIcon("fa-frown-o")
                .setMessageBody(messageBody)
                .setCloseActionButton()
                .show(); 
    }
    function log(msg) {
        console.log(msg);
    }
})(jQuery);