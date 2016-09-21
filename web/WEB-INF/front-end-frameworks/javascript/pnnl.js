/* global d3 */
var pnnl = {
    /*********** DATA LOADING RELATED MODULE ***********/
    data: {
        upload: function (url, userDir, datasetName, files, folder, successCallback, errorCallback) {
            var formData = new FormData();
            formData.append("user-dir", userDir);
            formData.append("dataset-name", datasetName);
            formData.append("folder", folder);
            var xhr = new XMLHttpRequest();
            files.forEach(function (file, i) { formData.append("file-" + i, file); });
            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200)
                        successCallback();
                    else
                        errorCallback(xhr.statusText);
                }

            };
            xhr.open("POST", url);
            xhr.setRequestHeader("enctype", "multipart/form-data");
            xhr.send(formData);
        },
        loadData: function (url, data, successCallback, errorCallback) {
            //window.history.pushState({"user-dir": userDir, "file-name": fileName}, "", "http://localhost:8080/Java-Matlab-Integration/DataFetcherServlet/load-data");
            $.ajax(url, {
                "method": "GET",
                "data": data,
                "success": function (data) {
                    var result = pnnl.data.parseData(data);
                    var totalIntensity = result[0];
                    var scanAcquisitionTime = result[1];
                    var intensityValues = result[2];
                    var massValues = result[3];
                    var pointCount = result[4];
                    successCallback(totalIntensity, scanAcquisitionTime, intensityValues, massValues, pointCount);
                },
                "error": function (xhr) {
                    errorCallback(xhr.statusText);
                }
            });
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
        fetch: function (url, requestParams, successCallback, errorCallback) {
            $.ajax(url, {
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
                "error": function (xhr) {
                    errorCallback(xhr.statusText);
                }
            });
        },
        /*
         * @param {Array} rawData Data in Matlab array format returned from server. Data is a string separated by "|"
         *                        e.g. "[array1]|[array2]|.....|[arrayN]"
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
    /*********** DRAWING-RELATED MODULE ***********/
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
            var padding = 4;
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
                    .attr("fill", "none")
                    .attr("stroke", "steelblue")
                    .attr("stroke-width", "1.75px")
                    .style("opacity", "0")
                    .datum(data)
                    .attr("d", lineData)
                    .transition()
                    .duration(500)
                    .style("opacity", "1");
            // now add titles to the axes
            svg.append("text")
                    .attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor
                    .attr("transform", "translate(" + (-50) + "," + (height / 2) + ")rotate(-90)")  // text is drawn off the screen top left, move down and out and rotate
                    .text(config.x);

            svg.append("text")
                    .attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor
                    .attr("transform", "translate(" + (width / 2) + "," + (0) + ")")  // centre below axis
                    .text(config.y);
            /*svg.append("rect")
                    .attr("class", "zoom")
                    .attr("width", width + config.margin.left + config.margin.right)
                    .attr("height", height + config.margin.top + config.margin.bottom)
                    .call(d3.zoom()
                            .scaleExtent([1, 5])
                            .translateExtent([[-100, -100], [width + 90, height + 100]])
                            .on("zoom", zoomed));

            function zoomed() {
                svg.attr("transform", d3.event.transform);
            }*/
        },
        drawOverlay: function () {
            $(".overlay").fadeIn("slow").prependTo("body");
        },
        drawSpinner: function () {
            $(".spinner").fadeIn().css("top", ($(window).height() / 3 + pnnl.utils.getScrollTop()) + "px");
        },
        removeSpinnerOverlay: function () {
            $(".spinner, .overlay").fadeOut();
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
    /*********** DIALOG MODULE ***********/
    dialog: {
        // This function is the entry point to the dialog APIs
        newDialogBuilder: function () {
            return {
                dialogClassName: "",
                dialogId: "",
                /*
                 * @param {string} alertDialogClass Required. Create a new dialog with the given class name. This class should
                 *                                @extend(SASS feature) from "alert-dialog" class to inherit default styles.
                 * @param {string} id An optional id attribute for this dialog
                 * @returns An empty dialog object
                 */
                createAlertDialog: function (alertDialogClass, id) {
                    if (!alertDialogClass)
                        throw new Error("Dialog class name is required.");
                    this.dialogClassName = alertDialogClass;
                    this.dialogId = id ? id : alertDialogClass;
                    d3.select("body")
                            .append("div")
                            .attr("class", this.dialogClassName)
                            .attr("id", this.dialogId)
                            .append("div")
                            .attr("class", "alert-dialog-header");
                    return this;
                },
                /*
                 * EITHER dialog header's icon OR title can be set at any given time.
                 * @param {string} faHeaderIcon Check FontAwesome website for a list of available icon classes. Default value is fa-info-circle
                 * @param {string} headerClass Optional class for dialog header. Default is "alert-dialog-header"
                 * @returns This dialog object
                 */
                setHeaderIcon: function (faHeaderIcon, headerClass) {
                    var dialogHeaderClass = "#" + this.dialogId + " " + ".alert-dialog-header";
                    $(dialogHeaderClass).addClass(headerClass ? headerClass : "");
                    if (!faHeaderIcon)
                        faHeaderIcon = "fa-info-circle";
                    d3.select(dialogHeaderClass).select(".alert-dialog-header-title").remove();
                    d3.select(dialogHeaderClass).append("i")
                            .attr("class", "fa fa-2x alert-dialog-header-icon" + " " + faHeaderIcon);
                    return this;
                },
                /*
                 * EITHER dialog header's icon OR title can be set at any given time.
                 * @param {string} title Title for our dialog box
                 * @param {string} headerClass Optional class for dialog header. Default is "alert-dialog-header"
                 * @returns This dialog object
                 */
                setHeaderTitle: function (title, headerClass) {
                    var dialogHeaderClass = "#" + this.dialogId + " " + ".alert-dialog-header";
                    if (!title && title !== "")
                        throw new Error("Header title may be an empty string, but must not be null");
                    $(dialogHeaderClass).addClass(headerClass ? headerClass : "");
                    d3.select(dialogHeaderClass).select(".alert-dialog-header-icon").remove();
                    d3.select(dialogHeaderClass).append("span")
                            .attr("class", "alert-dialog-header-title")
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
                    var dialog = this;
                    if (!faIcon)
                        faIcon = "fa fa-lg fa-close";
                    closeButtonClass = closeButtonClass ? closeButtonClass : "alert-dialog-header-close-action-icon";
                    d3.select("#" + this.dialogId + " " + ".alert-dialog-header")
                            .append("i")
                            .attr("class", faIcon + " " + closeButtonClass)
                            .on("click", closeAction ? function () {
                                closeAction("#" + dialog.dialogId);
                                dialog.hide();
                            } : function () {
                                dialog.hide();
                            });
                    return this;
                },
                /*
                 * @param {string} content Could contain HTML markup to create custom message body or just plain text.
                 * @param {string} bodyClass Optional class for dialog body. Default is "message-body"
                 * @returns This dialog object
                 */
                setMessageBody: function (content, bodyClass) {
                    var id = "#" + this.dialogId;
                    if (!content)
                        throw new Error("Message body can't be null");
                    d3.select(id)
                            .append("div")
                            .attr("class", "message-body" + (bodyClass ? " " + bodyClass : ""));
                    $(id + " " + ".message-body").append(content);
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
                    var id = "#" + this.dialogId;
                    var dialog = this;
                    var btnGroup = d3.select(id + " " + ".btn-group");
                    posBtnClassName = posBtnClassName ? posBtnClassName : "btn btn-default positive-btn";
                    if (!posBtnLabel)
                        throw new Error("Label for positive button is null.");
                    if (!posBtnBehavior)
                        throw new Error("Positive button click behavior is null.");
                    if (btnGroup.empty())
                        btnGroup = d3.select(id).append("div").attr("class", "btn-group");
                    btnGroup.append("button")
                            .attr("type", "button")
                            .attr("class", posBtnClassName)
                            .text(posBtnLabel)
                            .on("click", function () {
                                dialog.hide();
                                posBtnBehavior(id);
                            });
                    return this;
                },
                /*
                 * Usage is similar to #dialog.setPositiveButton() function but for the negative button. But
                 * negBtnBehavior argument is optional. Default behavior is used if not given.
                 */
                setNegativeButton: function (negBtnlabel, negBtnBehavior, negBtnClassName) {
                    var id = "#" + this.dialogId;
                    var btnGroup = d3.select(id + " " + ".btn-group");
                    var dialog = this;
                    negBtnClassName = negBtnClassName ? negBtnClassName : "btn btn-default negative-btn";
                    if (!negBtnlabel)
                        throw new Error("Label for no button is null.");
                    if (btnGroup.empty())
                        btnGroup = d3.select(id).append("div").attr("class", "btn-group");
                    btnGroup.append("button")
                            .attr("type", "button")
                            .attr("class", negBtnClassName)
                            .on("click", negBtnBehavior ? function () {
                                dialog.hide();
                                negBtnBehavior(id);
                            } : dialog.hide)
                            .text(negBtnlabel);
                    return this;
                },
                // Not all dialog need a header, this is a convenience function to easily remove it
                removeHeader: function () {
                    d3.select("#" + this.dialogId + " " + ".alert-dialog-header").remove();
                    return this;
                },
                /*
                 * @param {function} showBehavior Optional. How to show the dialog
                 * @returns undefined
                 */
                show: function (showBehavior) {
                    var id = "#" + this.dialogId + " ";
                    if (!showBehavior)
                        showBehavior = function (id) {
                            $(id).fadeIn().css({"top": 10 + pnnl.utils.getScrollTop() + "px"});
                            if (d3.event)
                                d3.event.stopImmediatePropagation();
                        };
                    $(id + ".message-body").insertAfter(id + ".alert-dialog-header");
                    $(id + ".btn-group").insertAfter(id + ".message-body");
                    showBehavior("#" + this.dialogId);
                },
                /*
                 * @param {function} hideBehavior Optional. How to hide the dialog
                 * @returns undefined
                 */
                hide: function (hideBehavior) {
                    var id = "#" + this.dialogId;
                    if (!hideBehavior)
                        $(id).fadeOut();
                    else
                        hideBehavior(id);
                    d3.event.stopImmediatePropagation();
                    /*setTimeout(function () {
                     d3.select(dialogClass).remove();
                     }, 500);*/
                }
            };
        }
    },
    /*********** FORM INPUT VALIDATION MODULE ***********/
    validation: {
        /*
         * @param {string} formName value of form's name attribute
         * @return true if validation passes, false otherwise
         */
        validate: function (formName) {
            var excludes = arguments.length > 1 ? Array.prototype.slice.call(arguments, 1) : -1;
            if (document.forms[formName].length === 0)
                throw new Error("Form with name \"" + formName + "\" does not exist.");
            var emptyInputElements = Array.prototype.filter.call(document.forms[formName].elements, function (elem) {
                return (elem.tagName === "INPUT" || elem.tagName === "SELECT" || elem.tagName === "TEXTAREA") && !elem.value;
            }).filter(function(elem) {
                return excludes !== -1 ? !excludes.some(function(e) {
                    return e === elem.id;
                }) : true;
            });
            if (emptyInputElements.length !== 0) {
                emptyInputElements.forEach(function (elem, i) {
                    if (d3.select("#validation-error-dialog-" + i).empty()) {
                        var dialog = pnnl.dialog.newDialogBuilder()
                                .createAlertDialog("validation-error-dialog", "validation-error-dialog-" + i);
                        $("." + dialog.dialogClassName).addClass("alert-dialog");
                        dialog.setMessageBody("<span style='color:red;'>This field can\'t be empty</span > ")
                                .show(function (dialogClass) {
                                    $(dialogClass).fadeIn()
                                            .css({"left": (elem.getBoundingClientRect().right + 30) + "px", "top": elem.getBoundingClientRect().top + "px"});
                                });
                        d3.select(elem)
                                .on("change keyup", function () {
                                    d3.selectAll("." + dialog.dialogClassName)
                                            .transition()
                                            .style("opacity", 0)
                                            .duration(500)
                                            .remove();
                                });
                    }
                });
                return false;
            } else
                return true;
        }
    },
    /*********** HANDLES BROWSERS INCONSISTENCIES ***********/
    utils: {
        getScrollTop: function () {
        return document.body.scrollTop ? document.body.scrollTop : document.documentElement.scrollTop;
        }
    }
};