var pnnl = {
    data: {
        /*
         * @param {File} file The file to upload
         * @param {Function} success Called when the server processes the request successfully. It is passed five arguments in
         *                           this order: totalIntensity, scanAcquisitionTime, intensityValues, massValues, pointCount
         * @param {Function} error Called when there was an error while processing the request. It is passed the original XHR object
         * @returns {undefined}
         */
        loadData: function (file, success, error) {
            window.sessionStorage.setItem("file-name", pnnl.data.getFileName(file));
            var formData = new FormData();
            formData.append("file-name", file);
            var xhr = new XMLHttpRequest();
            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4 && xhr.status === 200) {
                    var result = pnnl.data.parseData(xhr.responseText);
                    var totalIntensity = result[0];
                    var scanAcquisitionTime = result[1];
                    var intensityValues = result[2];
                    var massValues = result[3];
                    var pointCount = result[4];
                    success(totalIntensity, scanAcquisitionTime, intensityValues, massValues, pointCount);

                } else if (xhr.readyState === 4 && xhr.status !== 200)
                    error(xhr);
            };
            xhr.open("POST", "http://localhost:8080/Java-Matlab-Integration/ControllerServlet/load-data");
            xhr.setRequestHeader("enctype", "multipart/form-data");

            xhr.send(formData);
        },
        /*
         * @param {integer} offset Total number of elements read so far in the intensity/mass values arrays
         * @param {string} direction Fetch next 20 or previous 20. Accepted values are "forward" or "backward
         * @param {integer} start Where to start fetching our new batch of 20 inclusive
         * @param {integer} end Where to end fetching our new batch of 20 exclusive
         * @param {function} successCallback Called when server returns result successfully, this function is passed 
         *                                   an array of JSON objects e.g [ {x: x_value, y: y_value },...]where x_value
         *                                   is an element from intensity values array and y_value is from mass values array.
         * @param {function} errorCallback  Called when an error occurs on the server side. It is passed the jQuery XHR object, the
         *                                  error object, and the error message;
         * @returns {undefined}
         */
        fetch: function (offset, direction, start, end, successCallback, errorCallback) {
            var requestParams = {
                "file-name": window.sessionStorage.getItem("file-name"),
                "offset": offset,
                "direction": direction,
                "start": start,
                "end": end
            };
            $.ajax("http://localhost:8080/Java-Matlab-Integration/DataFetcherServlet/load-more", {
                "method": "GET",
                "data": requestParams,
                "success": function (data) {
                    var result = pnnl.data.parseData(data);
                    var intensityValues = result[0];

                    var massValues = result[1];
                    successCallback(intensityValues.map(function (d, i) {
                        return {"x": massValues[i], "y": d / Math.pow(10, 7)};
                    }));
                },
                "error": function (xhr, error, message) {
                    errorCallback(xhr, error, message);
                }
            });
        },
        /*
         * @param {Array} rawData Data in Matlab array format returned from server
         * @returns {Array} An array of arrays of numbers.
         */
        parseData: function (rawData) {
            return rawData.split("|").map(function (e) {
                return e.replace(/[\[\]]/g, "").split(",").map(function (e) {
                    return Number(e);
                });
            });
        },
        // Since IE gives us the absolute URI of the file name C:\path\to\file\example.cdf instead of the file name itself e.g. example.cdf
        getFileName: function (file) {
            var fileName = file.name;
            var index = fileName.lastIndexOf("\\");
            return index !== -1 ? fileName.substring(index + 1) : fileName;
        }
    },
    draw: {
        /*
         * @param {Object} config Must look like this 
         {
         "width": number, "height": number, "yLabel": "label", "className": "graph_class_name",
         "margin": {"top": number, "right": number, "bottom": number, "left": number }
         }
         * @param {Array} data Must be an array of JSON objects and look like such: [{x: number, y: number},.....]
         * @returns {undefined}
         */
        drawLineGraph: function (config, data) {
            d3.select("." + config.className).remove();
            var width = config.width - config.margin.left - config.margin.right;
            var height = config.height - config.margin.top - config.margin.bottom;
            var svg = d3.select("#" + config.idName)
                    .append("svg")
                    .attr("class", config.className)
                    .attr("height", height + config.margin.top + config.margin.bottom)
                    .attr("width", width + config.margin.left + config.margin.right)
                    .append("g")
                    .attr("transform", "translate(" + config.margin.left + "," + config.margin.top + ")");

            var xScale = d3.scaleLinear()
                    .domain(d3.extent(data, function (d) {
                        return d.x;
                    }))
                    .range([0, width])
                    .nice();
            var yScale = d3.scaleLinear()
                    .domain(d3.extent(data, function (d) {
                        return d.y;
                    }))
                    .range([height, 0])
                    .nice();

            var xAxis = d3.axisBottom(xScale);
            var yAxis = d3.axisLeft(yScale);
            var lineData = d3.line()
                    .x(function (d) {
                        return xScale(d.x);
                    })
                    .y(function (d) {
                        return yScale(d.y);
                    });
            svg.append("g")
                    .attr("class", "x axis")
                    .attr("transform", "translate(0," + height + ")")
                    .style("opacity", "0")
                    .call(xAxis)
                    .transition()
                    .duration(500)
                    .style("opacity", "1");

            svg.append("g")
                    .call(yAxis)
                    .style("opacity", "0")
                    .attr("class", "y axis")
                    .transition()
                    .duration(500)
                    .style("opacity", "1")
                    .each(function () {
                        d3.select(this)
                                .append("text")
                                .attr("x", 50)
                                .text(config.yLabel)
                                .style("fill", "black");
                    });                                

            svg.append("path")
                    .attr("class", "line")
                    .style("opacity", "0")
                    .datum(data)
                    .attr("d", lineData)
                    .transition()
                    .duration(500)
                    .style("opacity", "1");
        },
        drawOverlay: function () {
            $("body").css("overflow", "hidden");
            $("<div></div>").css({
                "position": "absolute",
                "width": "100%",
                "magin": "0",
                "height": $(window).height() + $(window).scrollTop() + "px",
                "z-index": "10",
                "background": "rgba(256,256,256,0.25)"
            }).attr("class", "overlay").fadeIn("slow").prependTo("body");

            return this;
        },
        drawSpinner: function () {
            $("<i></i>").css(
                    {"position": "absolute", "top": ($(window).height() / 3 + $(window).scrollTop()) + "px",
                        "left": "48%", "font-size": "8em", "line-height": "100%", "display": "hidden", "z-index": "11"
                    })
                    .attr({"class": "spinner fa fa-spinner fa-pulse", "aria-hidden": "true"})
                    .fadeIn()
                    .appendTo("body");
            return this;
        },
        removeSpinnerOverlay: function () {
            $("body").css("overflow", "visible");
            $(".spinner, .overlay").fadeOut().delay(1000).remove();
        },
        /*
         * @param {number} x The new x coordinate of the indicator line to move to relative to the y axis.
         */
        moveIndicatorBar: function (x) {
            if (d3.select(".intensity-scan-chart .nth-point-indicator").empty())
                d3.select(".intensity-scan-chart g:first-child")
                        .append("path")
                        .attr("class", "nth-point-indicator")
                        .style("stroke", "black")
                        .style("stroke-width", "1px");
            d3.select(".nth-point-indicator").attr("d", "M" + x + " 0," + x + " " + ($("svg").height() - 50));
        }
    },
    dialog: {
        // Default class for our dialog
        dialogClassName: "alert-dialog",
        // Create a new dialog with the given class name if exists or falls back to default value otherwise
        createAlertDialog: function (alertDialogClass) {
            var cssClass = "alert-dialog";
            if (alertDialogClass) {
                this.dialogClassName = alertDialogClass;
                cssClass += " " + alertDialogClass;
            }
            d3.select("body").append("div").attr("class", cssClass);
            return this;
        },
        /*
         * EITHER dialog header's icon OR title can be set at any give time.
         * @param {string} faHeaderIcon Check FontAwesome website for a list of available icon classes. Default value is fa-info-circle
         * @param {string} headerClass Optional clas for dialog header. Default is "alert-dialog-header"
         * @returns This dialog object
         */
        setHeaderIcon: function (faHeaderIcon, headerClass) {
            if (!faHeaderIcon)
                faHeaderIcon = "fa-info-circle";
            var alertDialogHeader = d3.select(".alert-dialog .alert-dialog-header");
            if (alertDialogHeader.empty())
                d3.select(".alert-dialog")
                        .append("div")
                        .attr("class", "alert-dialog-header" + (headerClass ? " " + headerClass : ""));
            alertDialogHeader.select(".alert-dialog-header-title").remove();
            d3.select(".alert-dialog .alert-dialog-header").append("i")
                    .attr("class", "fa fa-2x alert-dialog-header-icon" + " " + faHeaderIcon);
            return this;
        },
        /*
         * EITHER dialog header's icon OR title can be set at any give time.
         * @param {string} title Title for our dialog box
         * @param {string} headerClass Optional clas for dialog header. Default is "alert-dialog-header"
         * @returns This dialog object
         */
        setHeaderTitle: function (title, headerClass) {
            if (!title)
                throw new Error("Header title must contain a value");
            var alertDialogHeader = d3.select(".alert-dialog .alert-dialog-header");
            if (alertDialogHeader.empty())
                d3.select(".alert-dialog")
                        .append("div")
                        .attr("class", "alert-dialog-header" + (headerClass ? " " + headerClass : ""));
            alertDialogHeader.select(".alert-dialog-header-icon").remove();
            d3.select(".alert-dialog .alert-dialog-header")
                    .append("span")
                    .attr("class", "alert-dialog-header-title" + " " + headerClass)
                    .html(title);
            return this;
        },
        /*
         * @param {string} faIcon Optional. Default value is "fa fa-lg fa-close". Check FontAwesome website for a list of available icon classes
         * @param {string} closeAction Optional. A Default function is used if not specified. How to close our dialog
         *                              when the close button is clicked.
         * @param {string} closeButtonClass A custom class for dialog close button which is located at the
         *                                  upper right hand corner of the dialog. Otherwise, a default value
         *                                  "alert-dialog-header-close-action-icon" is used.
         * @returns This dialog object
         */
        setCloseActionButton: function (faIcon, closeAction, closeButtonClass) {
            if (!faIcon)
                faIcon = "fa fa-lg fa-close";
            closeButtonClass = closeButtonClass ? closeButtonClass : "alert-dialog-header-close-action-icon";
            d3.select(".alert-dialog-header")
                    .append("i")
                    .attr("class", faIcon + " " + closeButtonClass)
                    .on("click", closeAction ? function () {
                        closeAction("." + pnnl.dialog.dialogClassName);
                        pnnl.dialog.hide();
                        pnnl.draw.removeSpinnerOverlay();
                    } : function () {
                        pnnl.dialog.hide();
                        pnnl.draw.removeSpinnerOverlay();
                    });
            return this;
        },
        /*
         * @param {string} content Could contain HTML markup to create custom message body or just plain text.
         * @param {string} bodyClass Optional class for dialog body. Default is "message-body"
         * @returns This dialog object
         */
        setMessageBody: function (content, bodyClass) {
            if (!content)
                throw new Error("Message body can't be null");
            d3.select(".alert-dialog")
                    .append("div")
                    .attr("class", "message-body" + (bodyClass ? " " + bodyClass : ""));
            $(".message-body").append(content);
            return this;
        },
        /*
         * @param {string} posBtnLabel This argument is required.
         * @param {function} posBtnBehavior This argument is required
         * @param {string} posBtnClassName Optional. Class name of the positive button to use in a confirmation
         *                                 dialog box. Default value is postive-btn
         * @returns This dialog object
         */
        setPositiveButton: function (posBtnLabel, posBtnBehavior, posBtnClassName) {
            var dialogClass = "." + pnnl.dialog.dialogClassName;
            var btnGroup = d3.select(dialogClass + " " + ".btn-group");
            posBtnClassName = posBtnClassName ? posBtnClassName : "btn btn-default positive-btn";
            if (!posBtnLabel)
                throw new Error("Label for positive button is null.");
            if (!posBtnBehavior)
                throw new Error("Positive button click behavior is null.");
            if (btnGroup.empty())
                btnGroup = d3.select(dialogClass).append("div").attr("class", "btn-group");
            btnGroup.append("button")
                    .attr("type", "button")
                    .attr("class", posBtnClassName)
                    .text(posBtnLabel)
                    .on("click", function () {
                        pnnl.dialog.hide();
                        posBtnBehavior(dialogClass);
                    });
            return this;
        },
        /*
         * Usage is similar to #dialog.setPositiveButton() function but for the negative button. But
         * negBtnBehavior argument is optional. Default behavior is used if not given.
         */
        setNegativeButton: function (negBtnlabel, negBtnBehavior, negBtnClassName) {
            var dialogClass = "." + pnnl.dialog.dialogClassName;
            var btnGroup = d3.select(dialogClass + " " + ".btn-group");
            negBtnClassName = negBtnClassName ? negBtnClassName : "btn btn-default negative-btn";
            if (!negBtnlabel)
                throw new Error("Label for no button is null.");
            if (btnGroup.empty())
                btnGroup = d3.select(dialogClass).append("div").attr("class", "btn-group");
            btnGroup.append("button")
                    .attr("type", "button")
                    .attr("class", negBtnClassName)
                    .on("click", negBtnBehavior ? function () {
                        pnnl.dialog.hide();
                        negBtnBehavior(dialogClass);
                        pnnl.draw.removeSpinnerOverlay();
                    } : function () {
                        pnnl.dialog.hide();
                        pnnl.draw.removeSpinnerOverlay();
                    })
                    .text(negBtnlabel);
            return this;
        },
        /*
         * @param {function} showBehavior Optional. How to show the dialog
         * @returns undefined
         */
        show: function (showBehavior) {
            if (!showBehavior)
                showBehavior = function (dialogClassName) {
                    pnnl.draw.drawOverlay();
                    $(dialogClassName).slideDown();
                    if (d3.event)
                        d3.event.stopImmediatePropagation();
                };
            $(".message-body").insertAfter(".alert-dialog-header");
            $(".btn-group").insertAfter(".message-body");
            showBehavior("." + pnnl.dialog.dialogClassName);
        },
        /*
         * @param {function} hideBehavior Optional. How to hide the dialog
         * @returns undefined
         */
        hide: function (hideBehavior) {
            if (!hideBehavior)
                $("." + pnnl.dialog.dialogClassName).slideUp();
            else
                hideBehavior("." + pnnl.dialog.dialogClassName);
            d3.event.stopImmediatePropagation();
            setTimeout(function () {
                d3.select("." + pnnl.dialog.dialogClassName).remove();
            }, 500);

        }
    }
};