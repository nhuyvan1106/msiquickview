/* global d3 */
var pnnl = {
    data: {
        fetch: function (url, requestParams, successCallback, errorCallback) {
            $.ajax(url, {
                method: 'GET',
                data: requestParams,
                success: function (data) {
                    successCallback(data.intensityValues.map(function (d, i) {
                        return {x: data.massValues[i], y: d / Math.pow(10, 7)};
                    }));
                },
                error: function (xhr) {
                    errorCallback(xhr.statusText);
                }
            });
        },
        // Since IE gives us the absolute URI of the file name C:\path\to\file\example.cdf instead of the file name itself e.g. example.cdf
        getFileName: function (file) {
            var fileName = file.name;
            var index = fileName.lastIndexOf('\\');
            return index !== -1 ? fileName.substring(index + 1) : fileName;
        }
    },
    draw: {
        /*
         * @param {Object} config Must look like this 
         {
         'width': number, 'height': number, 'yLabel': 'label', 'className': 'graph_class_name',
         'margin': {'top': number, 'right': number, 'bottom': number, 'left': number }
         }
         * @param {Array} data Must be an array of JSON objects and look like such: [{x: number, y: number},.....]
         * @returns {undefined}
         */
        drawLineGraph: function (config, data) {
            d3.select('.' + config.className).remove();
            var width = config.width - config.margin.left - config.margin.right;
            var height = config.height - config.margin.top - config.margin.bottom;
            var svg = d3.select('#' + config.idName)
                    .append('svg')
                    .attr('class', config.className)
                    .attr('height', height + config.margin.top + config.margin.bottom)
                    .attr('width', width + config.margin.left + config.margin.right)
                    .append('g')
                    .attr('transform', 'translate(' + config.margin.left + ',' + config.margin.top + ')');
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
            svg.append('g')
                    .attr('class', 'x axis')
                    .attr('transform', 'translate(0,' + height + ')')
                    .style('opacity', '0')
                    .call(xAxis)
                    .transition()
                    .duration(500)
                    .style('opacity', '1');
            svg.append('g')
                    .call(yAxis)
                    .style('opacity', '0')
                    .attr('class', 'y axis')
                    .transition()
                    .duration(500)
                    .style('opacity', '1')
                    .each(function () {
                        d3.select(this)
                                .append('text')
                                .attr('x', 50)
                                .text(config.yLabel)
                                .style('fill', 'black');
                    });
            svg.append('path')
                    .attr('class', 'line')
                    .attr('fill', 'none')
                    .attr('stroke', 'steelblue')
                    .attr('stroke-width', '1.75px')
                    .style('opacity', '0')
                    .datum(data)
                    .attr('d', lineData)
                    .transition()
                    .duration(500)
                    .style('opacity', '1');
            // now add titles to the axes
            svg.append('text')
                    .attr('text-anchor', 'middle')  // this makes it easy to centre the text as the transform is applied to the anchor
                    .attr('transform', 'translate(' + (-50) + ',' + (height / 2) + ')rotate(-90)')  // text is drawn off the screen top left, move down and out and rotate
                    .text(config.x);

            svg.append('text')
                    .attr('text-anchor', 'middle')  // this makes it easy to centre the text as the transform is applied to the anchor
                    .attr('transform', 'translate(' + (width / 2) + ',' + (0) + ')')  // centre below axis
                    .text(config.y);

        },
        drawOverlay: function () {
            $('.overlay').fadeIn('slow').prependTo('body');
        },
        drawSpinner: function () {
            $('.spinner').fadeIn().css('top', ($(window).height() / 3 + pnnl.utils.getScrollTop()) + 'px');
        },
        removeSpinnerOverlay: function () {
            $('.spinner, .overlay').fadeOut();
            $('.validation-error-dialog, .hint-dialog').fadeOut(400, function () {
                $(this).remove();
            });
        },
        /*
         * @param {number} x The new x coordinate of the indicator line to move to relative to the y axis.
         */
        moveIndicatorBar: function (x) {
            if (d3.select('.intensity-scan-chart .nth-point-indicator').empty())
                d3.select('.intensity-scan-chart g:first-child')
                        .append('path')
                        .attr('class', 'nth-point-indicator')
                        .style('stroke', 'black')
                        .style('stroke-width', '1px');
            d3.select('.nth-point-indicator').attr('d', 'M' + x + ' 0,' + x + ' ' + ($('svg').height() - 50));
        }
    },

    /*********** DIALOG MODULE ***********/
    dialog: {
        // create and return a dialog object template
        createDialog: function (id, classes) {
            if (!id)
                throw new Error('Dialog id is required.');
            var __dialogFragment = document.createDocumentFragment();
            var __dialog = pnnl.utils.createElem('div', {
                className: id + ' app-dialog' + (classes ? ' ' + classes : ''),
                id: id
            });
            __dialogFragment.appendChild(__dialog);

            var dialogHeader = pnnl.utils.createElem('div', {
                className: 'app-dialog-header'
            });
            __dialog.appendChild(dialogHeader);

            var dialogBody = pnnl.utils.createElem('div', {
                className: 'app-dialog-body'
            });
            __dialog.appendChild(dialogBody);

            var btnGroup = pnnl.utils.createElem('div', {
                className: 'btn-group'
            });
            __dialog.appendChild(btnGroup);
            return {
                __dialogFragment: __dialogFragment,
                __dialog: __dialog,
                __onOpenCallback: null,
                __onClosedCallback: null,
                getDialog: function () {
                    return this.__dialog;
                },
                /*
                 * EITHER dialog header's icon OR title can be set at any given time.
                 * @param {string} faHeaderIcon Check FontAwesome website for a list of available icon classes. Default value is fa-info-circle
                 * @returns This dialog object
                 */
                setHeaderIcon: function (faHeaderIcon) {
                    var dialogHeader = this.__dialog.querySelector('.app-dialog-header');
                    if (!dialogHeader)
                        throw new Error('Dialog header was removed');
                    if (!faHeaderIcon)
                        faHeaderIcon = 'fa-info-circle';
                    var headerTitle = dialogHeader.querySelector('.app-dialog-header-title');
                    if (headerTitle)
                        dialogHeader.removeChild(headerTitle);
                    var headerIcon = pnnl.utils.createElem('i', {
                        className: 'fa fa-2x app-dialog-header-icon' + ' ' + faHeaderIcon
                    });
                    dialogHeader.appendChild(headerIcon);
                    return this;
                },
                /*
                 * EITHER dialog header's icon OR title can be set at any given time.
                 * @param {string} title Title for our dialog box
                 * @returns This dialog object
                 */
                setHeaderTitle: function (title) {
                    if (!title && title !== '')
                        throw new Error('Header title may be an empty string, but must not be null');
                    var dialogHeader = this.__dialog.querySelector('.app-dialog-header');
                    if (!dialogHeader)
                        throw new Error('Dialog header was removed');
                    var headerIcon = dialogHeader.querySelector('.app-dialog-header-icon');
                    if (headerIcon)
                        dialogHeader.removeChild(headerIcon);
                    var headerTitle = pnnl.utils.createElem('span', {
                        className: 'app-dialog-header-title',
                        textContent: title
                    });
                    dialogHeader.appendChild(headerTitle);
                    return this;
                },
                /*
                 * @param {string} faIcon Optional. Default value is 'fa fa-lg fa-close'. Check FontAwesome website for a list of available icon classes
                 * @returns This dialog object
                 */
                setCloseActionButton: function (faIcon) {
                    var dialogHeader = this.__dialog.querySelector('.app-dialog-header');
                    var thisDialog = this;
                    if (!faIcon)
                        faIcon = 'fa fa-lg fa-close';
                    var closeBtn = pnnl.utils.createElem('i', {
                        className: 'app-dialog-close-btn' + ' ' + faIcon,
                        onclick: function () {
                            if (thisDialog.__onClosedCallback)
                                thisDialog.__onClosedCallback.call(thisDialog, '#' + thisDialog.__dialog.id);
                            thisDialog.hide();
                        }
                    });
                    dialogHeader.appendChild(closeBtn);
                    return this;
                },
                /*
                 * @param {string} content Could contain HTML markup to create custom message body or just plain text.
                 * @returns This dialog object
                 */
                setDialogBody: function (content) {
                    if (!content)
                        throw new Error('Message body can\'t be null');
                    this.__dialog.querySelector('.app-dialog-body').innerHTML = content;
                    return this;
                },
                /*
                 * @param {string} posBtnLabel This argument is required.
                 * @param {function} clickHandler This argument is required
                 * @returns This dialog object
                 */
                setPositiveButton: function (posBtnLabel, clickHandler) {
                    if (!posBtnLabel)
                        throw new Error('Label for positive button is null.');
                    if (!clickHandler)
                        throw new Error('Positive button click handler is null.');
                    var thisDialog = this;
                    var btnGroup = thisDialog.__dialog.querySelector('.btn-group');
                    var positiveBtn = pnnl.utils.createElem('button', {
                        className: 'btn btn-default positive-btn',
                        type: 'button',
                        onclick: function () {
                            clickHandler.call(thisDialog, '#' + thisDialog.__dialog.id);
                        },
                        textContent: posBtnLabel
                    });
                    btnGroup.appendChild(positiveBtn);
                    return this;
                },
                setNegativeButton: function (negBtnLabel) {
                    var thisDialog = this;
                    var btnGroup = thisDialog.__dialog.querySelector('.btn-group');
                    var negativeBtn = pnnl.utils.createElem('button', {
                        className: 'btn btn-default negative-btn',
                        type: 'button',
                        onclick: function () {
                            if (thisDialog.__onClosedCallback)
                                thisDialog.__onClosedCallback.call(thisDialog, '#' + thisDialog.__dialog.id);
                            thisDialog.hide();
                        },
                        textContent: negBtnLabel ? negBtnLabel : 'Cancel'
                    });
                    btnGroup.appendChild(negativeBtn);
                    return this;
                },
                // Used to run any initialization code
                setOnOpenCallback: function (cb) {
                    this.__onOpenCallback = cb;
                    return this;
                },
                // Clean up code
                setOnClosedCallback: function (cb) {
                    this.__onClosedCallback = cb;
                    return this;
                },
                // Not all dialogs need a header, this is a convenience function to easily remove it
                remove: function (selector) {
                    this.__dialog.removeChild(this.__dialog.querySelector(selector));
                    return this;
                },
                /*
                 * @param {boolean} shouldDrawOverlay required. Should the overlay be drawn
                 * @param {function} showBehavior Optional. How to show the dialog
                 * @returns undefined
                 */
                show: function (shouldDrawOverlay, showBehavior) {
                    if (typeof arguments[0] !== 'boolean')
                        throw new Error('shouldDrawOverlay argument must be a boolean');
                    document.body.appendChild(this.__dialogFragment);
                    if (this.__onOpenCallback)
                        this.__onOpenCallback.call(this, '#' + this.__dialog.id);
                    if (shouldDrawOverlay)
                        pnnl.draw.drawOverlay();

                    if (showBehavior)
                        showBehavior.call(this, '#' + this.__dialog.id);
                    else
                        this.__dialog.classList.add('expand');
                },
                /*
                 * @param {function} hideBehavior Optional. How to hide the dialog
                 * @returns undefined
                 */
                hide: function (hideBehavior) {
                    pnnl.draw.removeSpinnerOverlay();
                    if (this.__onClosedCallback)
                        this.__onClosedCallback.call(this, '#' + this.__dialog.id);
                    if (hideBehavior)
                        hideBehavior.call(this, '#' + this.__dialog.id);
                    else
                        this.__dialog.classList.add('collapse');
                    var dialog = this.__dialog;
                    setTimeout(function () {
                        document.body.removeChild(dialog);
                    }, 2000);
                }
            };
        },
        showHintDialog: function (dialogClass, body, inputElem) {
            if (inputElem.dataset.state !== 'valid' && !document.querySelector('#' + dialogClass + '-' + inputElem.id)) {
                var inputElemRect = inputElem.getBoundingClientRect();
                pnnl.dialog.createDialog(dialogClass + '-' + inputElem.id, dialogClass)
                        .setDialogBody(body)
                        .remove('.app-dialog-header')
                        .remove('.btn-group')
                        .show(false, function (id) {
                            var $dialog = $(id);
                            $dialog.fadeIn()
                                    .css({
                                        'left': (inputElemRect.right + 30) + 'px',
                                        'top': (inputElemRect.top - ($dialog.height() > inputElemRect.height ? inputElemRect.height / 2 : 0) + pnnl.utils.getScrollTop()) + 'px'
                                    });
                        });
            }
        },
        showToast: function (error, message, showDuration) {
            pnnl.draw.removeSpinnerOverlay();
            pnnl.dialog.createDialog('toast')
                    .setDialogBody(message)
                    .remove('.app-dialog-header')
                    .remove('.btn-group')
                    .setOnOpenCallback(function () {
                        if (error)
                            this.getDialog().style.backgroundColor = 'red';
                    })
                    .show(false, function () {
                        this.getDialog().classList.add('expand');
                        var dialog = this;
                        setTimeout(function () {
                            dialog.hide();
                        }, showDuration ? showDuration : 5000);
                    });
        },
        showContextDialog: function (event, dialogBody, clickFunction) {
            event.preventDefault();
            event.stopImmediatePropagation();
            var body = '<ul>';
            var $uploadedFilesContainer = $('#uploaded-files-container');
            if ($uploadedFilesContainer.length === 1) {
                if ($uploadedFilesContainer.hasClass('slide-to-right'))
                    body = '<ul><li id="show-dialog">Show file selection widget</li>';
                else
                    body = '<ul><li id="hide-dialog">Hide file selection widget</li>';
            }
            body += dialogBody + '</ul>';
            var $dialog = $('.context-menu-dialog');
            if ($dialog.length === 0)
                pnnl.dialog.createDialog('context-menu-dialog')
                        .setDialogBody(body)
                        .remove('.app-dialog-header')
                        .remove('.btn-group')
                        .show(false, function (id) {
                            $(id).show().css({'top': event.pageY, 'left': event.pageX});
                        });
            else
                $dialog.css({'top': event.pageY, 'left': event.pageX})
                        .show()
                        .find('.app-dialog-body')
                        .html(body);
            $('.context-menu-dialog li').click(function(event) {
                event.stopImmediatePropagation();
                $('.context-menu-dialog').hide();
                clickFunction.call(this);
            });
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
                throw new Error('Form with name \'' + formName + '\' does not exist.');
            var emptyInputElements = Array.prototype.filter
                    .call(document.forms[formName].elements, function (elem) {
                        return (elem.tagName === 'INPUT' || elem.tagName === 'SELECT' || elem.tagName === 'TEXTAREA') && !elem.value;
                    })
                    .filter(function (elem) {
                        return excludes ? !excludes.some(function (e) {
                            return e === elem.id;
                        }) : true;
                    });
            if (emptyInputElements.length !== 0) {
                emptyInputElements.forEach(function (elem) {
                    pnnl.dialog.showHintDialog('validation-error-dialog', '<span style="color:red;">This field can\'t be empty</span>', elem);
                    elem.onchange = elem.onkeyup = function () {
                        d3.selectAll('.validation-error-dialog')
                                .transition()
                                .style('opacity', 0)
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
                    .attr('data-state', 'invalid')
                    .focusin(function () {
                        pnnl.dialog.showHintDialog('hint-dialog', '<span>' + errorMsg + '</span>', this);
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
                                        return '\\' + matched;
                                    });
                                    return new RegExp('^' + enteredPassword + '$', regex.flags).test(inputElem.value);
                                }

                                // If the user decides to change their input, then regex will still has its old lastIndex whatever that might be
                                // So we just copy its source and flag so we can basically reset its lastIndex property because lastIndex is readonly
                                return new RegExp(regex.source, regex.flags).test(inputElem.value);
                            });
                            if (validationResult) {
                                $('#hint-dialog-' + inputElem.id).remove();
                                inputElem.setAttribute('data-state', 'valid');
                                inputElem.style.border = '1px solid #ccc';
                            } else {
                                inputElem.setAttribute('data-state', 'invalid');
                                inputElem.style.border = '2px solid red';
                                pnnl.dialog.showHintDialog('hint-dialog', '<span>' + errorMsg + '</span>', inputElem);
                            }
                        } else
                            $('#hint-dialog-' + this.id).remove();
                    });
        }
    },
    utils: {
        getScrollTop: function () {
            return document.body.scrollTop ? document.body.scrollTop : document.documentElement.scrollTop;
        },
        populateQuestions: function populateQuestions() {
            $.ajax('/msiquickview/app/questions', {
                method: 'GET',
                accept: 'application/json',
                success: function (data) {
                    var uls = document.querySelectorAll('.security-questions-container ul');
                    uls.forEach(function (ul) {
                        var joined = d3.select(ul)
                                .selectAll('li')
                                .data(data.payload);

                        joined.enter()
                                .append('li')
                                .attr('id', function (questionObj) {
                                    return questionObj.primaryKey;
                                })
                                .text(function (questionObj) {
                                    return questionObj.questionContent;
                                })
                                .on('click', function (questionObj) {
                                    var $securityQuestionsContainer = $(this).parents('.security-questions-container');
                                    var answerInputElemSelector = $securityQuestionsContainer.find('div')
                                            .attr('title', this.textContent)
                                            .find('.selected-question-id')
                                            .attr('id', questionObj.primaryKey)
                                            .text(this.textContent)
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
            var selectedQuestionId = selectedQuestionContainerElem.querySelector('.selected-question-id').id;
            var selectedQuestionIds = $('.selected-question-id')
                    .get()
                    .filter(function (elem) {
                        return elem.id !== selectedQuestionId && elem.id;
                    })
                    .map(function (elem) {
                        return '#' + elem.id;
                    })
                    .reduce(function (prev, next) {
                        return prev + ',' + next;
                    }, 'none');
            // Only show the questions that are not selected
            var $questionList = $(selectedQuestionContainerElem).next('ul');
            $questionList.css('bottom', 'initial');
            $questionList.fadeToggle()
                    .children()
                    .css('display', 'block')
                    .filter(selectedQuestionIds)
                    .css('display', 'none');
            $questionList.css('bottom', ($questionList.offset().top + $questionList.height() - screen.availHeight) > 25 ? '100%' : 'initial');
        },
        sendFormData: function (url, params, successCallback, errorCallback, cleanupCallback) {
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
            xhr.open('POST', url);
            xhr.setRequestHeader('enctype', 'multipart/form-data');
            xhr.send(formData);
        },
        createElem: function (tag, props) {
            if (typeof tag !== 'string') {
                throw new Error('element tag name is required');
                return;
            }
            var elem = document.createElement(tag.toUpperCase());
            if (props)
                Object.keys(props).forEach(function (key) {
                    elem[key] = props[key];
                });
            return elem;
        }
    }
};