/* global d3 */
var pnnl = {
    /*********** DATA LOADING RELATED MODULE ***********/
    data: {
        upload: function (url, datasetName, files, opticalImage, folder, successCallback, errorCallback) {
            var params = [];
            params[0] = ["dataset-name", datasetName];
            params[1] = ["folder", folder];
            params[2] = ["opticalImage", opticalImage];
            files.forEach(function (file, i) {
                params[(3 + i)] = ["file-" + i, file];
            });
            pnnl.utils.ajaxPost(url, params, successCallback, errorCallback);
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
                    successCallback(data.intensityValues.map(function (d, i) {
                        return {"x": data.massValues[i], "y": d / Math.pow(10, 7)};
                    }));
                },
                "error": function (xhr) {
                    errorCallback(xhr.statusText);
                }
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

        },
        drawOverlay: function () {
            $(".overlay").fadeIn("slow").prependTo("body");
        },
        drawSpinner: function () {
            $(".spinner").fadeIn().css("top", ($(window).height() / 3 + pnnl.utils.getScrollTop()) + "px");
        },
        removeSpinnerOverlay: function () {
            $(".spinner, .overlay").fadeOut();
            $(".validation-error-dialog, .hint-dialog").fadeOut(400, function () {
                $(this).remove();
            });
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
    /*dialog: {
     newDialogBuilder: function (alertDialogClass, id, addtionClasses) {
     
     if (!alertDialogClass)
     throw new Error("Dialog class name is required.");
     var __dialogClassName = alertDialogClass;
     var __dialogId = id ? id : alertDialogClass;
     d3.select("body")
     .append("div")
     .attr("class", __dialogClassName)
     .classed(addtionClasses, addtionClasses ? true : false)
     .attr("id", __dialogId)
     .append("div")
     .attr("class", "alert-dialog-header");
     return this;
     }
     },*/

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
                createAlertDialog: function (alertDialogClass, id, addtionClasses) {
                    if (!alertDialogClass)
                        throw new Error("Dialog class name is required.");
                    this.dialogClassName = alertDialogClass;
                    this.dialogId = id ? id : alertDialogClass;
                    d3.select("body")
                            .append("div")
                            .attr("class", this.dialogClassName)
                            .classed(addtionClasses, addtionClasses ? true : false)
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
                            .on("click", function () {
                                if (closeAction)
                                    closeAction.call(this, "#" + dialog.dialogId);
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
                                posBtnBehavior.call(dialog, id);
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
                            .on("click", function () {
                                if (negBtnBehavior)
                                    negBtnBehavior.call(dialog, id);
                                dialog.hide();
                            })
                            .text(negBtnlabel);
                    return this;
                },
                // Not all dialog need a header, this is a convenience function to easily remove it
                removeHeader: function () {
                    d3.select("#" + this.dialogId + " " + ".alert-dialog-header").remove();
                    return this;
                },
                /*
                 * @param {boolean} shouldDrawOverlay required. Should the overlay be drawn
                 * @param {function} showBehavior Optional. How to show the dialog
                 * @returns undefined
                 */
                show: function (shouldDrawOverlay, showBehavior) {
                    if (typeof arguments[0] !== "boolean")
                        throw new Error("shouldDrawOverlay argument must be a boolean");
                    var id = "#" + this.dialogId;
                    $(id + " .message-body").insertAfter(id + " .alert-dialog-header");
                    $(id + " .btn-group").insertAfter(id + " .message-body");
                    if (shouldDrawOverlay)
                        pnnl.draw.drawOverlay();
                    if (showBehavior)
                        showBehavior.call(this, id);
                    else
                        $(id).css({
                            "top": "calc(" + (screen.availHeight - $(id).height()) + "/2)",
                            "left": "calc((100% - " + $(id).width() + "px)/2)"
                        }).fadeIn();
                },
                /*
                 * @param {function} hideBehavior Optional. How to hide the dialog
                 * @returns undefined
                 */
                hide: function (hideBehavior) {
                    pnnl.draw.removeSpinnerOverlay();
                    var id = "#" + this.dialogId;
                    $(id).fadeOut();
                    if (hideBehavior)
                        hideBehavior.call(this, id);
                    setTimeout(function () {
                        d3.select(id).remove();
                    }, 500);
                },
                init: function (func) {
                    func("#" + this.dialogId);
                    return this;
                }
            };
        },
        showHintDialog: function (dialogClass, body, inputElem, addtionClasses) {
            if (inputElem.dataset.state !== "valid" && !document.querySelector("#" + dialogClass + "-" + inputElem.id)) {
                var inputElemRect = inputElem.getBoundingClientRect();
                pnnl.dialog.newDialogBuilder()
                        .createAlertDialog(dialogClass, dialogClass + "-" + inputElem.id, addtionClasses)
                        .setMessageBody(body)
                        .removeHeader()
                        .show(false, function (id) {
                            var $dialog = $(id);
                            $dialog.fadeIn()
                                    .css({
                                        "left": (inputElemRect.right + 30) + "px",
                                        "top": (inputElemRect.top - ($dialog.height() > inputElemRect.height ? inputElemRect.height / 2 : 0) + pnnl.utils.getScrollTop()) + "px"
                                    });
                        });
            }
        },
        showToast: function (error, message) {
            $(".notification-dialog").remove();
            pnnl.dialog.newDialogBuilder()
                    .createAlertDialog("notification-dialog")
                    .setMessageBody(message)
                    .removeHeader()
                    .show(false, function (id) {
                        $(id).fadeIn()
                                .delay(7000)
                                .fadeOut(400, function () {
                                    $(id).remove();
                                });
                    });
            if (error)
                $(".notification-dialog").css("background-color", "red");
        }
    },
    /*********** FORM INPUT VALIDATION MODULE ***********/
    validation: {
        /*
         * @param {string} formName value of form's name attribute
         * @return true if validation passes, false otherwise
         */
        validateNotEmpty: function (formName) {
            var excludes = arguments.length > 1 ? Array.prototype.slice.call(arguments, 1) : null;
            if (document.forms[formName].length === 0)
                throw new Error("Form with name \"" + formName + "\" does not exist.");
            var emptyInputElements = Array.prototype.filter
                    .call(document.forms[formName].elements, function (elem) {
                        return (elem.tagName === "INPUT" || elem.tagName === "SELECT" || elem.tagName === "TEXTAREA") && !elem.value;
                    })
                    .filter(function (elem) {
                        return excludes ? !excludes.some(function (e) {
                            return e === elem.id;
                        }) : true;
                    });
            if (emptyInputElements.length !== 0) {
                emptyInputElements.forEach(function (elem) {
                    pnnl.dialog.showHintDialog("validation-error-dialog", "<span style='color:red;'>This field can\'t be empty</span>", elem, "alert-dialog");
                    elem.onchange = elem.onkeyup = function () {
                        d3.selectAll(".validation-error-dialog")
                                .transition()
                                .style("opacity", 0)
                                .duration(500)
                                .remove();
                    };
                });
                return false;
            } else
                return true;
        },
        initValidationForInput: function (inputElemSelector, regexes, errorMsg, passwordElemSelector) {
            return $(inputElemSelector)
                    .attr("data-state", "invalid")
                    .focusin(function () {
                        pnnl.dialog.showHintDialog("hint-dialog", "<span>" + errorMsg + "</span>", this);
                    })
                    .focusout(function () {
                        if (this.value) {
                            var inputElem = this;
                            var validationResult = regexes.every(function (regex) {
                                if (passwordElemSelector) {
                                    // Because we initialize the validation on startup so the user has not entered the password at this point
                                    // so we use this passwordElemSelector flag to figure out if this input element is the password repeat one because its regex
                                    // is based off of the value of the entered password which is gonna be empty when this function is called.
                                    var enteredPassword = document.querySelector(passwordElemSelector).value;
                                    enteredPassword = enteredPassword.replace(/[$]/g, function (matched) {
                                        // If enteredPassword contains $, it needs to be escaped
                                        return "\\" + matched;
                                    });
                                    return new RegExp("^" + enteredPassword + "$", regex.flags).test(inputElem.value);
                                }

                                // If the user decides to change their input, then regex will still has its old lastIndex whatever that might be
                                // So we just copy its source and flag so we can basically reset its lastIndex property because lastIndex is readonly
                                return new RegExp(regex.source, regex.flags).test(inputElem.value);
                            });
                            if (validationResult) {
                                $("#hint-dialog-" + inputElem.id).remove();
                                inputElem.setAttribute("data-state", "valid");
                                inputElem.style.border = "1px solid #ccc";
                            } else {
                                inputElem.setAttribute("data-state", "invalid");
                                inputElem.style.border = "2px solid red";
                                pnnl.dialog.showHintDialog("hint-dialog", "<span>" + errorMsg + "</span>", inputElem);
                            }
                        } else
                            $("#hint-dialog-" + this.id).remove();
                    });
        }
    },
    utils: {
        getScrollTop: function () {
            return document.body.scrollTop ? document.body.scrollTop : document.documentElement.scrollTop;
        },
        populateQuestions: function populateQuestions() {
            $.ajax("security/questions", {
                method: "GET",
                Accept: "application/json",
                success: function (data) {
                    var uls = document.querySelectorAll(".security-questions-container ul");
                    uls.forEach(function (ul) {
                        var joined = d3.select(ul)
                                .selectAll("li")
                                .data(data.payload);

                        joined.enter()
                                .append("li")
                                .attr("id", function (questionObj) {
                                    return questionObj.primaryKey;
                                })
                                .text(function (questionObj) {
                                    return questionObj.questionContent;
                                })
                                .on("click", function (questionObj) {
                                    var $securityQuestionsContainer = $(this).parents(".security-questions-container");
                                    var answerInputElemSelector = $securityQuestionsContainer.find("div")
                                            .attr("title", this.innerHTML)
                                            .find(".selected-question-id")
                                            .attr("id", questionObj.primaryKey)
                                            .text(this.innerHTML)
                                            .data('for');
                                    document.querySelector('#' + answerInputElemSelector).removeAttribute('disabled');
                                    $securityQuestionsContainer.find('ul')
                                            .fadeOut();
                                });
                    });
                },
                error: console.error
            });
        },
        filterOutSelectedQuestions: function (selectedQuestionContainerElem) {
            var selectedQuestionId = selectedQuestionContainerElem.querySelector(".selected-question-id").id;
            var selectedQuestionIds = $(".selected-question-id")
                    .get()
                    .filter(function (elem) {
                        return elem.id !== selectedQuestionId && elem.id;
                    })
                    .map(function (elem) {
                        return "#" + elem.id;
                    })
                    .reduce(function (prev, next) {
                        return prev + "," + next;
                    }, "none");
            // Only show the questions that are not selected
            var $questionList = $(selectedQuestionContainerElem).next("ul");
            $questionList.css('bottom', 'initial');
            $questionList.fadeToggle()
                    .children()
                    .css("display", "block")
                    .filter(selectedQuestionIds)
                    .css("display", "none");
            $questionList.css('bottom', ($questionList.offset().top + $questionList.height() - screen.availHeight) > 25 ? '100%' : 'initial');
        },
        ajaxPost: function (url, params, successCallback, errorCallback, cleanupCallback) {
            var formData = new FormData();
            params.forEach(function (param) {
                formData.append(param[0], param[1]);
            });
            var xhr = new XMLHttpRequest();
            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4) {
                    if (cleanupCallback)
                        cleanupCallback();
                    switch (xhr.status) {
                        case 200:
                            successCallback(xhr.responseText);
                            break;
                        default:
                            errorCallback(xhr.statusText);
                            break;
                    }
                }
            };
            xhr.open("POST", url);
            xhr.setRequestHeader("enctype", "multipart/form-data");
            xhr.send(formData);
        }
    }
};