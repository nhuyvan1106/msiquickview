/* global d3, pnnl */
(function ($) {
    d3.select('#upload-cdf-hdf-form .upload').on('click', function () {
        var url = '/msiquickview/app/uploader/cdf-hdf';
        d3.event.stopImmediatePropagation();
        if (!pnnl.validation.validateNotEmpty('upload-cdf-hdf-form', 'notes', 'optical-image'))
            return;
        else {
            var filesToUpload = $.makeArray(document.querySelector('#upload-cdf-hdf-form #files-to-upload').files);
            var isCdf = filesToUpload.every(function (file) {
                return file.name.endsWith('cdf');
            });
            var isHdf = filesToUpload.every(function (file) {
                return file.name.endsWith('hdf');
            });
            if (!isCdf && !isHdf) {
                errorCallback('Please either select cdf or hdf files only');
                return;
            }
            $('#menu-toggler').click();
            $('#uploaded-files-container').remove();
            var datasetName = document.querySelector('#upload-cdf-hdf-form #dataset-name').value;
            var notes = document.querySelector('#upload-cdf-hdf-form #notes').value;
            notes = notes ? notes : '';
            var uploadedFilesContainerFragment = document.createDocumentFragment();
            var list = pnnl.utils.createElem('ul', {
                id: 'uploaded-files-container'
            });
            // Used to hold the partial update request body that is sent the the /_update endpoint
            var esRequestBody = { doc: {}, upsert: {} };
            filesToUpload.forEach(function (file) {
                esRequestBody.doc[file.name] = notes;
                esRequestBody.upsert[file.name] = notes;
                var li = pnnl.utils.createElem('li');
                var input = pnnl.utils.createElem('input', {
                    type: 'radio',
                    value: file.name,
                    name: 'file-to-graph'
                });
                li.appendChild(input);

                var span = pnnl.utils.createElem('span', {
                    textContent: file.name
                });
                li.appendChild(span);
                var i = pnnl.utils.createElem('i', {
                    className: 'fa fa-spinner fa-pulse'
                });
                li.appendChild(i);
                list.appendChild(li);
            });
            uploadedFilesContainerFragment.appendChild(list);
            document.querySelector('.wrapper').appendChild(uploadedFilesContainerFragment);
            $('#uploaded-files-container').removeClass('slide-to-right')
                    .addClass('slide-from-right');
            var fileType = isCdf ? 'cdf' : 'hdf';
            var params = [
                ['datasetName', datasetName],
                ['folder', fileType],
                ['esRequestBody', JSON.stringify(esRequestBody)]
            ];
            console.log(params[2][1]);
            filesToUpload.forEach(function (file) {
                params.push(['files', file]);
            });
            var onSuccess = function () {
                $(document.documentElement)
                        .off('contextmenu')
                        .contextmenu(function (event) {
                            pnnl.dialog.showContextDialog(event, '', function (event) {
                                event.stopImmediatePropagation();
                                switch (this.id) {
                                    case 'hide-dialog':
                                        $('#uploaded-files-container').removeClass('slide-to-right')
                                                .addClass('slide-to-right');
                                        break;
                                    case 'show-dialog':
                                        $('#uploaded-files-container').removeClass('slide-from-right slide-to-right')
                                                .addClass('slide-from-right');
                                        break;
                                }
                                $('.context-menu-dialog').hide();
                            });
                        });
                $('#uploaded-files-container input')
                        .change(function () {
                            sessionStorage.setItem('fileNames', filesToUpload.map(function(file) { return file.name; }));
                            pnnl.draw.drawSpinner();
                            pnnl.draw.drawOverlay();
                            loadData(datasetName, this.value);
                            document.documentElement.click();
                        })
                        .nextAll('i')
                        .removeClass('fa-pulse fa-spinner')
                        .addClass('fa-check');
            };
            var onError = function (msg) {
                errorCallback(msg);
                $('#uploaded-files-container input').removeClass('fa-pulse fa-spinner')
                        .addClass('fa-times-circle');
            };
            pnnl.utils.sendFormData(url, params, onSuccess, onError);
        }
    });

    d3.select('#upload-excel-form .upload').on('click', function () {
        d3.event.stopImmediatePropagation();
        if (!pnnl.validation.validateNotEmpty('upload-excel-form', 'notes'))
            return;
        else {
            var $excelForm = $('#upload-excel-form');
            $('.buttons #status').show();
            var notes = $excelForm.find('#notes').val();
            notes = notes ? notes : '';
            var excelFile = $excelForm.find('#file-name').get(0).files[0];
            var excelFilename = excelFile.name;
            var fileNames = Array.prototype.map.call($excelForm.find('#file-names').get(0).files, function (d) {
                return d.name;
            });
            var invalidFileFormat = fileNames.some(function (d) {
                return !d.endsWith('cdf') && !d.endsWith('hdf');
            });
            if (invalidFileFormat) {
                errorCallback('Selection must either contain .cdf or .hdf files only.');
                return;
            }
            if (!excelFilename.endsWith('xls') && !excelFilename.endsWith('xlsx')) {
                errorCallback('File selected is not an excel file');
                return;
            }
            $('#menu-toggler').click();
            var params = null;
            var websocket = null;
            var statusDetail = null;
            var statusInterval = null;
            var onSuccess;
            var onError;
            var cleanupCallback;
            var esRequestBody = { doc: {}, upsert: {} };

            esRequestBody.doc[excelFilename] = notes;
            esRequestBody.upsert[excelFilename] = notes;
            params = [
                ['datasetName', $excelForm.find('#dataset-name').val()],
                ['fileType', fileNames[0].endsWith('cdf') ? 'cdf' : 'hdf'],
                ['excelFile', excelFile],
                ['esRequestBody', JSON.stringify(esRequestBody)]
            ];
            statusDetail = d3.select('#status-container #status')
                    .append('tr')
                    .attr('class', 'status-detail');
            statusDetail.append('td')
                    .text(params[0][1]);
            statusDetail.append('td')
                    .text(excelFilename);
            statusDetail.append('td')
                    .attr('id', 'time-remaining')
                    .text('Calculating...');
            statusDetail.append('td')
                    .attr('id', 'job-progress')
                    .text('In progress');
            showButtons('#status-toggle');

            onSuccess = function () {
                statusDetail.select('#job-progress').text('Done');
            };
            onError = function () {
                statusDetail.select('#job-progress')
                        .text('Something went wrong');
            };
            cleanupCallback = function () {
                if (websocket)
                    websocket.close();
                clearInterval(statusInterval);
                statusDetail.select('#time-remaining')
                        .text('0 seconds');
            };
            pnnl.utils.sendFormData('/msiquickview/app/uploader/excel', params, onSuccess, onError, cleanupCallback);
            setTimeout(function () {
                websocket = new WebSocket('ws://' + location.host + '/msiquickview/excel-task-status');
                websocket.onmessage = function (event) {
                    statusDetail.select('#time-remaining')
                            .text(event.data + (event.data === 1 ? ' second' : ' seconds'));
                };
                statusInterval = setInterval(function () {
                    websocket.send('');
                }, 3000);
            }, 20000);
        }
    });

    $('#load-more-container li').click(function () {
        $(this).parent().fadeOut();
        var $currentImageTab = $('.tab.images:checked');
        var current = parseInt($currentImageTab.data().currentQuantity);
        var total = parseInt($currentImageTab.data().totalQuantity);
        if (current < total) {
            var limit = parseInt(this.id);
            if (current + limit > total)
                limit = total - current;
            pnnl.draw.drawOverlay();
            pnnl.draw.drawSpinner();
            $.ajax('/msiquickview/app/directory/more/' + $('#selected-dataset').text() + '/images', {
                data: {
                    limit: limit,
                    imageFolder: $currentImageTab.val().replace('-tab-content', '').replace('-', '/'),
                    imageNames: d3.selectAll('#' + $currentImageTab.val() + ' .image-container div')
                            .nodes()
                            .map(function (e) {
                                return d3.select(e).text();
                            })
                },
                method: 'GET',
                success: function (data) {
                    current += data.imageData.length;
                    $currentImageTab.attr('data-current-quantity', current).attr('data-total-quantity', data.total);
                    $('#current').text(current);
                    $('#total').text(data.total);
                    $('#load-more-toggler').attr('disabled', data.total === current ? 'disabled' : null);
                    appendImages(data, '#' + $currentImageTab.val());
                    pnnl.draw.removeSpinnerOverlay();
                },
                error: function () {
                    errorCallback('Something went wrong<br/>Please contact admin to report the error');
                }

            });
        }
    });
    $('#tools li').click(function () {
        $('#select-tool-cancel').click()
                .css('visibility', 'visible');
        var $selectedTool = $('#select-a-tool-toggler span');
        if (this.id !== $selectedTool.attr('id')) {
            $selectedTool.text(this.textContent).attr('id', this.id);
            switch (this.id) {
                case 'warp':
                    $('.image-container img[class != "roi-image"]')
                            .css('cursor', 'pointer')
                            .off('click')
                            .click(function () {
                                $(this).toggleClass('selected-image');
                                switch ($('.selected-image').length) {
                                    case 0:
                                    case 1:
                                        $('#select-tool-done').css('visibility', 'hidden');
                                        break;
                                    case 2:
                                        var $selectedImages = $('.selected-image');
                                        if ($selectedImages.filter('.optical-image').length === 0) {
                                            errorCallback('Please select 1 optical image');
                                            $selectedImages.last().removeClass('selected-image');
                                        } else if ($selectedImages.filter('.optical-image').length === 2) {
                                            errorCallback('Please select 1 optical image only');
                                            $selectedImages.last().removeClass('selected-image');
                                        } else
                                            $('#select-tool-done').css('visibility', 'visible');
                                        break;
                                    default:
                                        errorCallback('Please select 2 images at most');
                                        this.className = this.className.replace('selected-image', '').trim();
                                        break;
                                }
                            });
                    break;

                case 'mark-up-window':
                    document.getElementById('rois-roiImages-tab').click();
                    break;

                case 'overlay-window':
                    $('.overlay-window').draggable({handle: '.header'}).fadeIn();
                    d3.select('.image-names')
                            .selectAll('div')
                            .data($('#images-tab-content img').get())
                            .text(function (img) {
                                return img.alt;
                            })
                            .enter()
                            .append('div')
                            .text(function (img) {
                                return img.alt;
                            })
                            .on('click', function (img) {
                                $.ajax('/msiquickview/app/data/image', {
                                    method: 'GET',
                                    Accept: 'application/json',
                                    data: {
                                        datasetName: $('#selected-dataset').text(),
                                        fileName: img.alt.replace('.png', '')
                                    },
                                    success: function (data) {
                                        data.imageData.forEach(function (array) {
                                            array.forEach(function (numStr, index) {
                                                array[index] = parseInt(numStr);
                                            });
                                        });
                                        var colors = '0,2,4,6,8,10,12,14,16,18,20,22,24,26,28,30,32,34,36,38,40,42,44,46,48,50,52,54,56,58,60,62,64,66,68,70,72,74,76,78,80,82,84,86,88,90,92,94,96,98,100,102,104,106,108,110,112,114,116,118,120,122,124,126,128,130,132,134,136,138,140,142,144,146,148,150,152,154,156,158,160,162,164,166,168,170,172,174,176,178,180,182,184,186,188,190,192,194,196,198,200,202,204,206,208,210,212,214,216,218,220,222,224,226,228,230,232,234,236,238,240,242,244,246,248,250,252,255';
                                        var colorMap = [];
                                        switch (document.querySelector('.selected-color-map').id) {
                                            case 'green':
                                                colors.split(',')
                                                        .forEach(function (color) {
                                                            colorMap.push('rgb(0,' + color + ',0)');
                                                        });
                                                break;
                                            case 'blue':
                                                colors.split(',')
                                                        .forEach(function (color) {
                                                            colorMap.push('rgb(0,0,' + color + ')');
                                                        });
                                                break;
                                            default:
                                            case 'red':
                                                colors.split(',')
                                                        .forEach(function (color) {
                                                            colorMap.push('rgb(' + color + ',0,0)');
                                                        });
                                                break;
                                        }
                                        var imgDimensions = getNaturalImageSize(img);
                                        drawImage({hasContextMenu: false, setOpacity: true, shouldNotTranslate: true, idName: 'overlay-images-container', className: 'overlay-image'},
                                                data.imageData, imgDimensions.height, imgDimensions.width, img.alt, colorMap
                                                );
                                    },
                                    error: function (xhr) {
                                        errorCallback(xhr.statusText);
                                    }
                                });
                            });
                    break;
            }
        }
    });
    var clickCoords = null;
    $('#select-tool-done').click(function (event) {
        event.stopImmediatePropagation();
        this.style.visibility = 'hidden';
        switch (document.querySelector('#select-a-tool-toggler span').id) {
            case 'warp':
                clickCoords = {
                    leftCanvas: [],
                    rightCanvas: []
                };
                var warpWindow = d3.select($('.warp-window').draggable().fadeIn().get(0));
                var selectedImages = $('.selected-image').removeClass('selected-image').get();
                var opticalImg = selectedImages.filter(function (image) {
                    return image.className.indexOf('optical-image') !== -1;
                })[0];
                var regularImg = selectedImages.filter(function (image) {
                    return image.className.indexOf('optical-image') === -1;
                })[0];
                warpWindow.select('#left-image')
                        .attr('src', opticalImg.src)
                        .attr('alt', opticalImg.alt);
                warpWindow.select('#right-image')
                        .attr('src', regularImg.src)
                        .attr('alt', regularImg.alt);
                d3.selectAll('.warp-window canvas').on('click', function () {
                    if (clickCoords[this.id].length + 1 > 6)
                        errorCallback('Please select at most 6 points');
                    else {
                        clickCoords[this.id].push(markClickPoint(this.getContext('2d'), d3.mouse(this), 2));
                        if (clickCoords.leftCanvas.length === 6 && clickCoords.rightCanvas.length === 6)
                            document.querySelector('.warp-window #done').removeAttribute('disabled');
                    }
                });
                break;

            case 'mark-up-window':
                break;

            case 'overlay-window':
                break;
        }
    });
    $('#select-tool-cancel').click(function () {
        document.querySelector('#select-tool-done').style.visibility = 'hidden';
        this.style.visibility = 'hidden';
        var selectedTool = document.querySelector('#select-a-tool-toggler span');
        if (selectedTool.id === 'overlay-window')
            $('.overlay-window').fadeOut(400, function () {
                this.style.top = '10%';
                this.style.transform = 'translate(0px,0px) scale(1,1)';
                this.style.left = '5%';
                this.style.opacity = '1';
            });
        else {
            $('.image-container img').off('click').css('cursor', 'initial');
            $('.selected-image').removeClass('selected-image');
            if (selectedTool.id === 'mark-up-window') {
                $('.roi').remove();
                $('.roi-metadata').fadeOut().find('form').get(0).reset();
                $('.validation-error-dialog').remove();
            } else
                clickCoords = null;
        }
        selectedTool.id = 'none';
        selectedTool.textContent = 'Select a tool';

    });
    $('.warp-window #done').click(function () {
        $('#select-a-tool-toggler span').attr('id', 'none').text('Select a tool');
        $('.warp-window').fadeOut();
        convertToRealCoords(clickCoords.leftCanvas, getNaturalImageSize(document.querySelector('.warp-window #left-image')));
        convertToRealCoords(clickCoords.rightCanvas, getNaturalImageSize(document.querySelector('.warp-window #right-image')));
        document.querySelector('#select-tool-cancel').style.visibility = 'hidden';
        document.querySelector('.warp-window #done').setAttribute('disabled', 'disabled');
        document.querySelectorAll('.warp-window canvas').forEach(function (canvas) {
            canvas.getContext('2d').clearRect(0, 0, 320, 235);
        });
        // TODO: Not sure what to with these yet
        var requestParams = {
            opticalCoords: clickCoords.leftCanvas,
            regularCoords: clickCoords.rightCanvas,
            opticalName: document.querySelector('#left-image').alt,
            regularName: document.querySelector('#right-image').alt
        };
        console.log(clickCoords);
        clickCoords = null;
    });
    $('.warp-window .clear').click(function () {
        this.previousElementSibling.getContext('2d').clearRect(0, 0, 320, 235);
        clickCoords[this.previousElementSibling.id] = [];
        $('.warp-window #done').attr('disabled', 'disabled');
    });

    $('#upload-optical-image').click(function () {
        pnnl.dialog.createDialog('upload-optical-image-dialog')
                .setHeaderTitle('Select optical image')
                .setCloseActionButton()
                .setDialogBody('<form name="upload-optical-image-form" id="upload-optical-image-form">\n\
                        <input class="form-control" type="file" accept="image/*" id="optical-image"/><br/></form>')
                .setPositiveButton('Done', function () {
                    var dialog = this;
                    if (!pnnl.validation.validateNotEmpty('upload-optical-image-form'))
                        return;
                    var file = document.forms['upload-optical-image-form'].firstElementChild.files[0];
                    pnnl.utils.sendFormData('/msiquickview/app/uploader/images/optical', [['opticalImageFile', file], ['datasetName', $('#selected-dataset').text()]], function () {
                        dialog.hide();
                        pnnl.dialog.showToast(null, 'Image uploaded successfully');
                    }, errorCallback);
                })
                .show(true);
    });

    $('#action-container #add-roi').click(function () {
        if (this.getAttribute('disabled') !== 'disabled') {
            $('#select-a-tool-toggler span').attr('id', 'mark-up-window').text('Mark-Up Window');
            document.getElementById('images-tab').click();
            pnnl.dialog.showToast(null, 'Select one image before drawing ROI');
            $('.image-container img[class != "roi-image"]')
                    .css('cursor', 'pointer')
                    .click(function () {
                        var dim = getNaturalImageSize(this);
                        drawROI(d3.select(this.parentElement), $(this), dim.height, dim.width);
                    });
        }
    });

    $('#action-container #refresh').click(function () {
        var dataset = $('#selected-dataset').text();
        var $activeTab = $('input.tab:checked');
        var folder = $activeTab.attr('id').replace('-tab', '');
        var target = $activeTab.val();
        var callback;
        var requestParams = {'folder': folder.replace('-', '/')};
        switch (folder) {
            case 'cdf':
            case 'hdf':
                callback = function (files) {
                    populateList('#' + target + ' ul', files, true);
                };
                break;
            case 'excel':
                callback = function (files) {
                    populateList('#' + target + ' ul', files, false);
                };
                break;
            case 'images':
            case 'optical':
            case 'rois-roiImages':
                callback = function (newTotal) {
                    $activeTab.attr('data-total-quantity', newTotal);
                    $('#total').text(newTotal);
                    $.ajax('/msiquickview/app/directory/more/' + dataset + '/images', {
                        data: {
                            limit: 10,
                            imageNames: d3.selectAll('#' + $activeTab.val() + ' .caption')
                                    .nodes()
                                    .map(function (e) {
                                        return e.textContent;
                                    }),
                            imageFolder: folder.replace('-', '/')
                        },
                        method: 'GET',
                        success: function (d) {
                            if ($activeTab.data().currentQuantity !== $activeTab.data().totalQuantity) {
                                var current = parseInt($activeTab.data().currentQuantity) + d.imageData.length;
                                $('#load-more-toggler').attr('disabled', current === d.total ? 'disabled' : null);
                                $('#current').text(current);
                                $activeTab.attr('data-current-quantity', current);
                                appendImages(d, '#' + $activeTab.val());
                            }
                        },
                        error: function (xhr) {
                            errorCallback(xhr.statusText);
                        }
                    });
                };
                // restrict flag is used to figure out what we need to return, true -> count the files, else return the names of those files
                requestParams.restrict = true;
                break;
        }
        $.ajax('/msiquickview/app/directory/refresh/' + dataset, {
            method: 'GET',
            data: requestParams,
            success: function (data) {
                $('<span class="refresh-status" style="border:none;margin-left:-50px;margin-top:15px;color:gray;font-size:large">Done</span>').prependTo("#action-container");
                setTimeout(function () {
                    $('.refresh-status').remove();
                }, 2000);
                updateDatasetMenu(data.datasets);
                callback(data.payload);
            },
            error: function (xhr) {
                errorCallback(xhr.statusMessage);
                $('<span class="refresh-status" style="border:none;margin-left:-50px;margin-top:15px;color:gray;font-size:large">Done</span>').prependTo('#action-container');
                setTimeout(function () {
                    $('.refresh-status').remove();
                }, 2000);
            }
        });
    });

    d3.select('#show-uploaded-files-form .show').on('click', function () {
        d3.event.stopImmediatePropagation();
        if (!pnnl.validation.validateNotEmpty('show-uploaded-files-form', 'dataset-name'))
            return;
        else {
            $('#menu-toggler').click();
            browseDir($('#show-uploaded-files-form #dataset-name').val());
        }
    });

    var currentIndex = -1;
    var resultData = {};
    var offset = 0;
    var moveTo = 0;
    var totalElementsRead = 0;
    $('.next').click(function (event) {
        event.stopPropagation();
        if (currentIndex < resultData.pointCount.length - 1) {
            currentIndex++;
            moveTo += 690 / resultData.pointCount.length;
            pnnl.draw.moveIndicatorBar(moveTo);
            if (currentIndex % 20 === 0 && currentIndex !== 0 /*&& currentIndex !== resultData.length - 1*/) {
                var url = '/msiquickview/app/data/graph/more';
                pnnl.draw.drawOverlay();
                pnnl.draw.drawSpinner();
                var fileName = sessionStorage.getItem('fileName');
                var requestParams = {
                    fileName: fileName,
                    datasetName: document.querySelector('.panels .options').dataset.datasetName,
                    fileType: fileName.indexOf('hdf') !== -1 ? 'hdf' : 'cdf',
                    offset: offset,
                    direction: 'forward',
                    nextSum: resultData.pointCount.slice(currentIndex, currentIndex + 20).reduce(function (prev, next) {
                        return prev + next;
                    })
                };
                var onSuccess = function (intensityMass) {
                    totalElementsRead = 0;
                    resultData.intensityMass = intensityMass;
                    drawIntensityMassChart(resultData.intensityMass.slice(totalElementsRead,
                            totalElementsRead + resultData.pointCount[currentIndex]));
                    totalElementsRead += resultData.pointCount[currentIndex];
                    offset += resultData.pointCount[currentIndex];
                    pnnl.draw.removeSpinnerOverlay();
                };
                pnnl.data.fetch(url, requestParams, onSuccess, errorCallback);
            } else {
                drawIntensityMassChart(resultData.intensityMass.slice(totalElementsRead, totalElementsRead + resultData.pointCount[currentIndex]));
                totalElementsRead += resultData.pointCount[currentIndex];
                offset += resultData.pointCount[currentIndex];
            }
        }

    });
    $('.prev').click(function (event) {
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
                var url = '/msiquickview/app/data/graph/more';
                pnnl.draw.drawSpinner();
                pnnl.draw.drawOverlay();
                var fileName = sessionStorage.getItem('fileName');
                var requestParams = {
                    fileName: fileName,
                    datasetName: document.querySelector('.panels .options').dataset.datasetName,
                    fileType: fileName.indexOf('hdf') !== -1 ? 'hdf' : 'cdf',
                    offset: offset,
                    direction: 'backward',
                    nextSum: resultData.pointCount.slice(currentIndex - 20, currentIndex).reduce(function (prev, next) {
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
        ;
    });
    // Convinient function so we don't have to repeat codes for next and previous buttons' event handlers.
    function drawIntensityMassChart(data) {
        var config = {
            width: parseInt(d3.select('#intensity-mass-chart-id').style('width'), 10),
            height: 500,
            margin: {
                top: 30,
                right: 20,
                bottom: 20,
                left: 60
            },
            yLabel: '1.0e+7',
            className: 'intensity-mass-chart',
            idName: 'intensity-mass-chart-id',
            x: 'm/z Values',
            y: 'Intensity'
        };
        pnnl.draw.drawLineGraph(config, data);
        /*
         * Intensity / Mass values chart may not be drawn to the screen yet, so we set a 500ms delay so d3.select()
         * will not be empty which will not render the brushable area otherwise.
         */
        setTimeout(function () {
            d3.select('.' + config.className).append('g')
                    .attr('class', 'brush')
                    .attr('transform', 'translate(' + config.margin.left + ',' + config.margin.top + ')')
                    .call(d3.brushX()
                            .extent([[0, 0], [config.width - config.margin.left - config.margin.right, config.height - config.margin.top - config.margin.bottom]])
                            .on('end', function () {
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
                                $('.' + config.className)
                                        .off('contextmenu click')
                                        .contextmenu(function (event) {
                                            pnnl.dialog.showContextDialog(event, '<li id="generate-image">Generate ion image</li>', function () {
                                                switch (this.id) {
                                                    case 'hide-dialog':
                                                        $('#uploaded-files-container').removeClass('slide-to-right')
                                                                .addClass('slide-to-right');
                                                        break;
                                                    case 'show-dialog':
                                                        $('#uploaded-files-container').removeClass('slide-from-right slide-to-right')
                                                                .addClass('slide-from-right');
                                                        break;
                                                    case 'generate-image':
                                                        pnnl.draw.drawSpinner();
                                                        pnnl.draw.drawOverlay();
                                                        var fileNames = sessionStorage.getItem('fileNames');
                                                        var datasetName = document.querySelector('.panels .options').dataset.datasetName;
                                                        $.ajax('/msiquickview/app/data/ion-image',
                                                                {
                                                                    method: 'GET',
                                                                    data: {
                                                                        datasetName: datasetName,
                                                                        fileType: fileNames.indexOf('hdf') !== -1 ? 'hdf' : 'cdf',
                                                                        fileNames: fileNames,
                                                                        lowerBound: range[0],
                                                                        upperBound: range[1]
                                                                    },
                                                                    success: function (data) {
                                                                        pnnl.draw.removeSpinnerOverlay();
                                                                        var config = {
                                                                            idName: 'ion-image-container',
                                                                            className: 'ion-image',
                                                                            hasContextMenu: true
                                                                        };
                                                                        var imageDataPerRow = [];
                                                                        var imageName = null;

                                                                        range.push(data.dimension[0], data.dimension[1]);
                                                                        imageName = range.join('_');
                                                                        data.pixels = data.pixels.map(function (e) {
                                                                            return e < 0 ? 0 : e;
                                                                        });
                                                                        for (var i = 0; i < data.dimension[0]; i++) {
                                                                            imageDataPerRow.push([]);
                                                                            for (var j = i; j < data.pixels.length; j += data.dimension[0])
                                                                                imageDataPerRow[i].push(data.pixels[j]);
                                                                        }
                                                                        drawImage(config, imageDataPerRow, data.dimension[0], data.dimension[1], imageName);
                                                                    },
                                                                    error: function (xhr) {
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
    function loadData(datasetName, fileName) {
        document.querySelector('.panels .options')
                .setAttribute('data-dataset-name', datasetName);
        sessionStorage.setItem('fileName', fileName);
        var fileType = fileName.indexOf('hdf') !== -1 ? 'hdf' : 'cdf';
        var params = {
            datasetName: datasetName,
            fileName: fileName,
            fileType: fileType
        };
        $.ajax('/msiquickview/app/data/graph/new', {
            method: 'GET',
            data: params,
            success: successCallback,
            error: function () {
                errorCallback('A fatal error has occurred<br/>Please contact admin');
            }
        });
        currentIndex = -1;
        offset = 0;
        totalElementsRead = 0;
        moveTo = 0;
        function successCallback(data) {
            var config = {
                width: parseInt(d3.select('#intensity-scan-chart-id').style('width'), 10),
                height: 500,
                margin: {
                    top: 30,
                    right: 20,
                    bottom: 20,
                    left: 60
                },
                yLabel: '1.0e+8',
                className: 'intensity-scan-chart',
                idName: 'intensity-scan-chart-id',
                x: 'Scan Acquisition Time',
                y: 'Intensity'
            };
            resultData.pointCount = data.pointCount;
            resultData.intensityMass = data.intensityValues.map(function (d, i) {
                return {x: data.massValues[i], y: d / Math.pow(10, 7)};
            });
            $('.intensity-mass-chart').remove();
            pnnl.draw.drawLineGraph(config, data.scanTime.map(function (e, i) {
                return {x: e, y: data.totalIntensity[i] / Math.pow(10, 8)};
            }));
            pnnl.draw.removeSpinnerOverlay();
        }
    }
    // Global HTTP request response error handling
    function errorCallback(msg) {
        pnnl.dialog.showToast(new Error('Something went wrong'), msg, 10000);
    }

    function drawImage(config, dataArray, numRows, numCols, imageName, colorMap) {
        var margin = {top: 20, right: 15, bottom: 10, left: 15};
        var width = 350 - margin.left - margin.right;
        var height = 500 - margin.top - margin.bottom;
        var svg = d3.select('#' + config.idName)
                .append('svg')
                .attr('width', width + margin.left + margin.right)
                .attr('height', height)
                .append('g')
                .attr('transform', config.shouldNotTranslate ? '' : 'translate(' + margin.left + ',' + margin.top + ')');
        for (var i = 0; i < numRows; i++) {
            var xScale = d3.scaleBand()
                    .domain(dataArray[i])
                    .range([0, width]);
            var yScale = d3.scaleOrdinal()
                    .domain([i])
                    .range([height / numRows]);
            var colors = null;
            if (!colorMap)
                colors = ['rgb(3,0,0)', 'rgb(5,0,0)', 'rgb(8,0,0)', 'rgb(11,0,0)', 'rgb(13,0,0)', 'rgb(16,0,0)', 'rgb(19,0,0)', 'rgb(21,0,0)', 'rgb(24,0,0)', 'rgb(27,0,0)', 'rgb(30,0,0)', 'rgb(32,0,0)', 'rgb(35,0,0)', 'rgb(38,0,0)', 'rgb(40,0,0)', 'rgb(43,0,0)', 'rgb(46,0,0)', 'rgb(48,0,0)', 'rgb(51,0,0)', 'rgb(54,0,0)', 'rgb(56,0,0)', 'rgb(59,0,0)', 'rgb(62,0,0)', 'rgb(64,0,0)', 'rgb(67,0,0)', 'rgb(70,0,0)', 'rgb(72,0,0)', 'rgb(75,0,0)', 'rgb(78,0,0)', 'rgb(81,0,0)', 'rgb(83,0,0)', 'rgb(86,0,0)', 'rgb(89,0,0)', 'rgb(91,0,0)', 'rgb(94,0,0)', 'rgb(97,0,0)', 'rgb(99,0,0)', 'rgb(102,0,0)', 'rgb(105,0,0)', 'rgb(107,0,0)', 'rgb(110,0,0)', 'rgb(113,0,0)', 'rgb(115,0,0)', 'rgb(118,0,0)', 'rgb(121,0,0)', 'rgb(123,0,0)', 'rgb(126,0,0)', 'rgb(129,0,0)', 'rgb(132,0,0)', 'rgb(134,0,0)', 'rgb(137,0,0)', 'rgb(140,0,0)', 'rgb(142,0,0)', 'rgb(145,0,0)', 'rgb(148,0,0)', 'rgb(150,0,0)', 'rgb(153,0,0)', 'rgb(156,0,0)', 'rgb(158,0,0)', 'rgb(161,0,0)', 'rgb(164,0,0)', 'rgb(166,0,0)', 'rgb(169,0,0)', 'rgb(172,0,0)', 'rgb(174,0,0)', 'rgb(177,0,0)', 'rgb(180,0,0)', 'rgb(183,0,0)', 'rgb(185,0,0)', 'rgb(188,0,0)', 'rgb(191,0,0)', 'rgb(193,0,0)', 'rgb(196,0,0)', 'rgb(199,0,0)', 'rgb(201,0,0)', 'rgb(204,0,0)', 'rgb(207,0,0)', 'rgb(209,0,0)', 'rgb(212,0,0)', 'rgb(215,0,0)', 'rgb(217,0,0)', 'rgb(220,0,0)', 'rgb(223,0,0)', 'rgb(225,0,0)', 'rgb(228,0,0)', 'rgb(231,0,0)', 'rgb(234,0,0)', 'rgb(236,0,0)', 'rgb(239,0,0)', 'rgb(242,0,0)', 'rgb(244,0,0)', 'rgb(247,0,0)', 'rgb(250,0,0)', 'rgb(252,0,0)', 'rgb(255,0,0)', 'rgb(255,3,0)', 'rgb(255,5,0)', 'rgb(255,8,0)', 'rgb(255,11,0)', 'rgb(255,13,0)', 'rgb(255,16,0)', 'rgb(255,19,0)', 'rgb(255,21,0)', 'rgb(255,24,0)', 'rgb(255,27,0)', 'rgb(255,30,0)', 'rgb(255,32,0)', 'rgb(255,35,0)', 'rgb(255,38,0)', 'rgb(255,40,0)', 'rgb(255,43,0)', 'rgb(255,46,0)', 'rgb(255,48,0)', 'rgb(255,51,0)', 'rgb(255,54,0)', 'rgb(255,56,0)', 'rgb(255,59,0)', 'rgb(255,62,0)', 'rgb(255,64,0)', 'rgb(255,67,0)', 'rgb(255,70,0)', 'rgb(255,72,0)', 'rgb(255,75,0)', 'rgb(255,78,0)', 'rgb(255,81,0)', 'rgb(255,83,0)', 'rgb(255,86,0)', 'rgb(255,89,0)', 'rgb(255,91,0)', 'rgb(255,94,0)', 'rgb(255,97,0)', 'rgb(255,99,0)', 'rgb(255,102,0)', 'rgb(255,105,0)', 'rgb(255,107,0)', 'rgb(255,110,0)', 'rgb(255,113,0)', 'rgb(255,115,0)', 'rgb(255,118,0)', 'rgb(255,121,0)', 'rgb(255,123,0)', 'rgb(255,126,0)', 'rgb(255,129,0)', 'rgb(255,132,0)', 'rgb(255,134,0)', 'rgb(255,137,0)', 'rgb(255,140,0)', 'rgb(255,142,0)', 'rgb(255,145,0)', 'rgb(255,148,0)', 'rgb(255,150,0)', 'rgb(255,153,0)', 'rgb(255,156,0)', 'rgb(255,158,0)', 'rgb(255,161,0)', 'rgb(255,164,0)', 'rgb(255,166,0)', 'rgb(255,169,0)', 'rgb(255,172,0)', 'rgb(255,174,0)', 'rgb(255,177,0)', 'rgb(255,180,0)', 'rgb(255,183,0)', 'rgb(255,185,0)', 'rgb(255,188,0)', 'rgb(255,191,0)', 'rgb(255,193,0)', 'rgb(255,196,0)', 'rgb(255,199,0)', 'rgb(255,201,0)', 'rgb(255,204,0)', 'rgb(255,207,0)', 'rgb(255,209,0)', 'rgb(255,212,0)', 'rgb(255,215,0)', 'rgb(255,217,0)', 'rgb(255,220,0)', 'rgb(255,223,0)', 'rgb(255,225,0)', 'rgb(255,228,0)', 'rgb(255,231,0)', 'rgb(255,234,0)', 'rgb(255,236,0)', 'rgb(255,239,0)', 'rgb(255,242,0)', 'rgb(255,244,0)', 'rgb(255,247,0)', 'rgb(255,250,0)', 'rgb(255,252,0)', 'rgb(255,255,0)', 'rgb(255,255,4)', 'rgb(255,255,8)', 'rgb(255,255,12)', 'rgb(255,255,16)', 'rgb(255,255,20)', 'rgb(255,255,24)', 'rgb(255,255,27)', 'rgb(255,255,31)', 'rgb(255,255,35)', 'rgb(255,255,39)', 'rgb(255,255,43)', 'rgb(255,255,47)', 'rgb(255,255,51)', 'rgb(255,255,55)', 'rgb(255,255,59)', 'rgb(255,255,63)', 'rgb(255,255,67)', 'rgb(255,255,71)', 'rgb(255,255,75)', 'rgb(255,255,78)', 'rgb(255,255,82)', 'rgb(255,255,86)', 'rgb(255,255,90)', 'rgb(255,255,94)', 'rgb(255,255,98)', 'rgb(255,255,102)', 'rgb(255,255,106)', 'rgb(255,255,110)', 'rgb(255,255,114)', 'rgb(255,255,118)', 'rgb(255,255,122)', 'rgb(255,255,126)', 'rgb(255,255,129)', 'rgb(255,255,133)', 'rgb(255,255,137)', 'rgb(255,255,141)', 'rgb(255,255,145)', 'rgb(255,255,149)', 'rgb(255,255,153)', 'rgb(255,255,157)', 'rgb(255,255,161)', 'rgb(255,255,165)', 'rgb(255,255,169)', 'rgb(255,255,173)', 'rgb(255,255,177)', 'rgb(255,255,180)', 'rgb(255,255,184)', 'rgb(255,255,188)', 'rgb(255,255,192)', 'rgb(255,255,196)', 'rgb(255,255,200)', 'rgb(255,255,204)', 'rgb(255,255,208)', 'rgb(255,255,212)', 'rgb(255,255,216)', 'rgb(255,255,220)', 'rgb(255,255,224)', 'rgb(255,255,228)', 'rgb(255,255,231)', 'rgb(255,255,235)', 'rgb(255,255,239)', 'rgb(255,255,243)', 'rgb(255,255,247)', 'rgb(255,255,251)', 'rgb(255,255,255)'];
            else
                colors = colorMap;
            var colorScale = d3.scaleQuantize()
                    .domain(d3.extent(dataArray[i]))
                    .range(colors);

            svg.selectAll('.tile-' + i)
                    .data(dataArray[i])
                    .enter()
                    .append('rect')
                    .attr('x', function (d) {
                        return xScale(d);
                    })
                    .attr('y', function () {
                        return (yScale(i) / 2) * i;
                    })
                    .attr('width', function () {
                        return xScale.bandwidth();
                    })
                    .attr('height', function () {
                        return yScale(i) / 2;
                    })
                    .style('stroke-width', '0')
                    .style('fill', function (d) {
                        return colorScale(d);
                    });
            /*svg.append('text')
             .attr('y', 250)
             // We want to center the text under the image. 7.6968571429: Character width in the current font
             .attr('x', (width - 7.6968571429 * id.length) / 2)
             .text(id)
             .style('font-family', 'monospace');*/
        }
        var image = new Image();
        image.id = 'image' + Date.now();
        if (config.setOpacity && d3.select('#' + config.idName).size() > 1)
            image.style.opacity = '0.5';
        if (config.hasContextMenu) {
            image.setAttribute('data-dataset-name', document.querySelector('.panels .options').dataset.datasetName);
            image.title = 'Right click to save this image to the server';
            image.oncontextmenu = function (event) {
                if ($('#select-a-tool-toggler span').attr('id') !== 'none') {
                    event.preventDefault();
                    return;
                }
                var body = '<li id="save-image">Save</li>\n\
                            <li id="select-roi">Select Region of Interest</li>';
                pnnl.dialog.showContextDialog(event, body, function () {
                    switch (this.id) {
                        case 'hide-dialog':
                            $('#uploaded-files-container').removeClass('slide-to-right')
                                    .addClass('slide-to-right');
                            break;
                        case 'show-dialog':
                            $('#uploaded-files-container').removeClass('slide-from-right slide-to-right')
                                    .addClass('slide-from-right');
                            break;
                        case 'select-roi':
                            drawROI(d3.select('#' + config.idName), $(image), numRows, numCols);
                            break;
                        case 'save-image':
                            pnnl.draw.drawSpinner();
                            pnnl.draw.drawOverlay();
                            var url = '/msiquickview/app/uploader/images/generated';
                            var datasetName = image.dataset.datasetName;
                            datasetName = datasetName ? datasetName : $('#selected-dataset').text();
                            var esRequestBody = { doc: { } };
                            esRequestBody.doc[imageName + '_.png'] = dataArray;
                            var params = [
                                ['datasetName', datasetName],
                                ['imageName', imageName],
                                ['imageData', image.src.replace('data:image/png;base64,', '')],
                                ['esRequestBody', JSON.stringify(esRequestBody)]
                            ];
                            dataArray.forEach(function (imageDataPerRow) {
                                params.push(['rawImageData', imageDataPerRow.join(',')]);
                            });
                            console.log(dataArray);
                            var successCallback = function () {
                                pnnl.dialog.showToast(null, 'Image saved successfully');
                            };
                            pnnl.utils.sendFormData(url, params, successCallback, errorCallback, pnnl.draw.removeSpinnerOverlay);
                            break;
                    }
                });
            };
        }
        svgAsPngUri(svg.node(), {}, function (uri) {
            image.src = uri;
            image.onload = function () {
                $('#' + config.idName).append(image).find('svg').remove();
            };
        });
    }
    function browseDir(datasetName) {
        $.ajax('/msiquickview/app/directory/browse/' + (datasetName ? datasetName : ''), {
            method: 'GET',
            success: function (data) {
                if (data.empty) {
                    pnnl.dialog.showToast(new Error('Directory Emtpty'), data.message);
                    return;
                }
                var payload = data.payload;
                updateDatasetMenu(data.datasets, payload.dataset);
                populateList('#cdf-tab-content ul', payload.cdf, true);
                populateList('#hdf-tab-content ul', payload.hdf, true);
                populateList('#excel-tab-content ul', payload.excel, false);
                populateImages('#images-tab-content', payload.images, payload.ionImageData, '#images-tab', 'ion-image', payload.ionImageCount);
                populateImages('#optical-tab-content', payload.optical, payload.opticalImageData, '#optical-tab', 'optical-image', payload.opticalImageCount);
                populateImages('#rois-roiImages-tab-content', payload.roiImages, payload.roiImageData, '#rois-roiImages-tab', 'roi-image', payload.roiImageCount);
                showButtons('#tab-opener');
                d3.select('#tabs-container')
                        .transition()
                        .duration(800)
                        .style('transform', 'scale(1,1)')
                        .style('top', pnnl.utils.getScrollTop() + 80 + 'px')
                        .style('opacity', 1);
                $('#tabs-container').fadeIn()
                        .css({transform: 'scale(1,1)', 'top': pnnl.utils.getScrollTop() + 80 + 'px',
                            left: (screen.width - $('#tabs-container').width()) / 2 + 'px'
                        })
                        .find('#cdf-tab')
                        .prop('checked', true)
                        .change();
            },
            'error': function () {
                errorCallback('Something went wrong<br/>Please contact admin to report the error');
            }
        });
    }
    function populateList(selector, data, clickable) {
        var ul = d3.select(selector);
        if (ul.size() === 0 && data.length === 0) {
            ul.append('div')
                    .attr('class', 'empty-content')
                    .text('This folder is empty')
                    .style('text-align', 'center');
            return;
        } else if (data.length === 0)
            return;
        ul.select('.empty-content').remove();
        var joined = ul.selectAll('li').data(data);
        joined.exit().remove();
        joined.select('span')
                .text(function (d) {
                    return d;
                });
        var enter = joined.enter()
                .append('li');
        if (clickable) {
            joined.select('input')
                    .attr('value', function (d) {
                        return d;
                    });

            enter.append('input')
                    .attr('type', 'radio')
                    .attr('name', 'file-to-graph')
                    .attr('class', 'file')
                    .attr('title', 'Plot graph for this file')
                    .on('change', function () {
                        pnnl.draw.drawOverlay();
                        pnnl.draw.drawSpinner();
                        // when the user selects generate ion image context menu item
                        // we need to obtain the list of cdf or hdf file names to use to generate the image
                        // because each file represents a row, so we store these files in session storage for easy retrieval
                        var fileNames = $(selector + ' li input').map(function () {
                            return this.value;
                        }).get();
                        sessionStorage.setItem('fileNames', fileNames);
                        console.log(this);
                        loadData($('#dataset-selection-toggler #selected-dataset').text(), this.value);
                    })
                    .attr('value', function (d) {
                        return d;
                    });
            enter.append('i')
                    .attr('class', 'fa fa-line-chart plot-graph');
        }
        enter.append('span')
                .attr('class', 'file-name')
                .text(function (d) {
                    return d;
                });
    }

    function populateImages(imageTabContentId, imageNames, imageData, tab, imageClassName, imageCount) {
        d3.select(tab)
                .attr('data-current-quantity', imageData.length)
                .attr('data-total-quantity', imageCount);
        var d3imageTabContent = d3.select(imageTabContentId);
        d3imageTabContent.select('.empty-content').remove();
        $('#current').text(imageData.length);
        $('#total').text(imageNames.length);
        imageData = imageData.map(function (data) {
            return 'data:image/png;base64,' + data;
        });
        var containers = d3imageTabContent
                .selectAll('.image-container')
                .data(imageData);
        containers.exit().remove();
        if (imageNames.length === 0)
            d3.select(tab + '-content')
                    .append('p')
                    .attr('class', 'empty-content')
                    .style('text-align', 'center')
                    .style('width', '100%')
                    .text('This folder is empty');
        containers.select('img')
                .attr('src', function (d) {
                    return d;
                })
                .attr('alt', function (d, i) {
                    return imageNames[i];
                });
        containers.select('.caption')
                .text(function (d, i) {
                    return imageNames[i];
                });
        var enter = containers.enter()
                .append('div')
                .attr('class', 'image-container');
        enter.append('img')
                .classed(imageClassName ? imageClassName : '', true)
                .attr('src', function (d) {
                    return d;
                })
                .attr('alt', function (d, i) {
                    return imageNames[i];
                })
                .attr('id', function (d, i) {
                    return 'image' + imageNames[i].replace(/[._(?:png)]/g, '');
                })
                .style('height', '235px')
                .style('width', '320px')
                .on('contextmenu', function () {
                    if ($('#select-a-tool-toggler span').attr('id') !== 'none' || imageTabContentId === '#rois-roiImages-tab-content') {
                        d3.event.preventDefault();
                        return;
                    }
                    console.log(this);
                    var body = '<li id="select-roi">Select Region of Interest</li>';
                    var img = this;
                    pnnl.dialog.showContextDialog(d3.event, body, function () {
                        console.log(this);
                        switch (this.id) {
                            case 'hide-dialog':
                                $('#uploaded-files-container').removeClass('slide-to-right')
                                        .addClass('slide-to-right');
                                break;
                            case 'show-dialog':
                                $('#uploaded-files-container').removeClass('slide-from-right slide-to-right')
                                        .addClass('slide-from-right');
                                break;
                            case 'select-roi':
                                var dim = getNaturalImageSize(img);
                                console.log(dim);
                                drawROI(d3.select(img.parentElement), $(img), dim.height, dim.width);
                                break;
                        }
                    });
                });
        enter.append('div')
                .attr('class', 'caption')
                .text(function (d, i) {
                    return imageNames[i];
                });
    }

    function updateDatasetMenu(datasets, selected) {
        $("#dataset-selection-toggler #selected-dataset").text(selected);
        var joined = d3.select("#tabs-container .dataset-selection ul").selectAll("li").data(datasets);
        joined.exit().remove();
        joined.attr("id", function (d) {
            return d;
        })
                .text(function (d) {
                    return d;
                });
        joined.enter()
                .append("li")
                .attr("id", function (d) {
                    return d;
                })
                .text(function (d) {
                    return d;
                })
                .on("click", function () {
                    if (this.id !== $("#dataset-selection-toggler #selected-dataset").text()) {
                        $("#dataset-selection-toggler span").text(this.id);
                        browseDir(this.id);
                        $(this.parentElement).fadeOut();
                    }
                });
    }

    function appendImages(data, imageTabContentSelector) {
        var $container = $(imageTabContentSelector);
        $container.find('.empty-content').remove();
        var placeHolder = document.createDocumentFragment();
        data.imageData.forEach(function (d, i) {
            var div = pnnl.utils.createElem('div', {
                className: 'image-container'
            });
            var img = pnnl.utils.createElem('img', {
                src: 'data:image/png;base64,' + d,
                id: 'image' + Date.now(),
                alt: data.imageNames[i],
                style: 'width:320px;height:235px',
                oncontextmenu: function (event) {
                    if ($('#select-a-tool-toggler span').attr('id') !== 'none') {
                        event.preventDefault();
                        return;
                    }
                    var body = '<li id="select-roi">Select Region of Interest</li>';
                    var img = this;
                    pnnl.dialog.showContextDialog(event, body, function (e) {
                        switch (this.id) {
                            case 'hide-dialog':
                                $('#uploaded-files-container').removeClass('slide-to-right')
                                        .addClass('slide-to-right');
                                break;
                            case 'show-dialog':
                                $('#uploaded-files-container').removeClass('slide-from-right slide-to-right')
                                        .addClass('slide-from-right');
                                break;
                            case 'select-roi':
                                var dim = getNaturalImageSize(img);
                                drawROI(d3.select(img.parentElement), $(img), dim.height, dim.width);
                                break;
                        }
                    });
                }
            });
            div.appendChild(img);
            var caption = pnnl.utils.createElem('div', {
                className: 'caption',
                textContent: data.imageNames[i]
            });
            div.appendChild(caption);
            placeHolder.appendChild(div);
        });
        $container.append(placeHolder);
    }

    function showButtons(buttonId) {
        var buttons = $('.buttons');
        buttons.css('display', 'flex')
                .removeClass('fade-out')
                .addClass('fade-in')
                .find(buttonId)
                .css('display', 'block');
        setTimeout(function () {
            buttons.removeClass('fade-in');
        }, 10000);
    }

    function drawROI(imageContainer, $image, numRows, numCols) {
        console.log($image);
        $('.roi-metadata').fadeOut().find('form').get(0).reset();
        $('.validation-error-dialog').remove();
        var coordPairs = null;
        d3.selectAll('.roi').remove();
        var canvas = imageContainer.style('position', 'relative')
                .insert('div', '#' + $image.get(0).id)
                .style('position', 'absolute')
                .attr('class', 'roi')
                .append('canvas')
                .style('cursor', 'url(' + showPencilCursor() + ') 0 20, auto')
                .attr('width', $image.width() + 'px')
                .attr('height', $image.height() + 'px')
                .classed('selected-image', true)
                .on('mousedown', function () {
                    if (d3.event.which === 1) {
                        d3.event.preventDefault();
                        prepareCanvas();
                        var coords = d3.mouse(this.parentElement);
                        coords[0] += 0.5;
                        coords[0] = Math.floor(coords[0]);
                        context.strokeStyle = 'yellow';
                        context.lineWidth = '5px';
                        context.beginPath();
                        context.moveTo(coords[0], coords[1]);
                        coordPairs.push(coords);
                        d3.select(this)
                                .on('mousemove', function () {
                                    coords = d3.mouse(this.parentElement);
                                    coords[0] = Math.floor(coords[0] + 0.5);
                                    coordPairs.push(coords);
                                    context.lineTo(coords[0], coords[1]);
                                    context.stroke();
                                });
                    }
                })
                .on('contextmenu', function () {
                    var body = '<li id="clear">Clear</li><li id="select-done">Done</li>';
                    pnnl.dialog.showContextDialog(d3.event, body, function (e) {
                        switch (this.id) {
                            case 'hide-dialog':
                                $('#uploaded-files-container').removeClass('slide-to-right')
                                        .addClass('slide-to-right');
                                break;
                            case 'show-dialog':
                                $('#uploaded-files-container').removeClass('slide-from-right slide-to-right')
                                        .addClass('slide-from-right');
                                break;
                            case 'clear':
                                clearROI();
                                break;
                            case 'select-done':
                                drawROIFinished(coordPairs, canvas, $image, numCols, numRows);
                                break;
                        }
                    });
                })
                .on('mouseup', function () {
                    if (d3.event.which === 1) {
                        context.closePath();
                        context.stroke();
                        d3.select(this).on('mousemove', null);
                        if (coordPairs.length > 10) {
                            var canvasPos = canvas.parentElement.getBoundingClientRect();
                            var $roiMetadata = $('.roi-metadata');
                            $roiMetadata.css({left: canvasPos.right + 15, 'top': canvasPos.top + 20 + pnnl.utils.getScrollTop()})
                                    .draggable()
                                    .fadeIn()
                                    .find('#clear')
                                    .click(clearROI)
                                    .next('#done')
                                    .off('click')
                                    .click(function (event) {
                                        event.stopImmediatePropagation();
                                        drawROIFinished(coordPairs, canvas, $image, numCols, numRows);
                                    });
                            if ($roiMetadata.get(0).getBoundingClientRect().right > screen.width)
                                $roiMetadata.css('left', canvasPos.left - 20 - $roiMetadata.width());
                        }
                    }
                })
                .node();
        d3.selectAll('body *');
        var context = canvas.getContext('2d');
        prepareCanvas();
        function prepareCanvas() {
            coordPairs = [];
            context.clearRect(0, 0, $image.width(), $image.height());
            context.fillStyle = 'white';
            context.fillRect(0, 0, $image.width(), $image.height());
            context.drawImage($image.get(0), 0, 0, $image.width(), $image.height());
        }

        function clearROI() {
            prepareCanvas();
            $('.roi-metadata').fadeOut();
            $('.validation-error-dialog').remove();
        }
    }
    function drawROIFinished(coordPairs, canvas, $image, numCols, numRows) {
        if (!pnnl.validation.validateNotEmpty('roi-metadata', 'roi-description') && coordPairs.length !== 0)
            return;
        d3.selectAll('.roi').remove();
        $('.validation-error-dialog').remove();
        $('.image-container img').css('cursor', 'initial').off('click');
        $('#select-a-tool-toggler span').attr('id', 'none').text('Select a tool');
        document.querySelector('#select-tool-cancel').style.visibility = 'hidden';
        if (coordPairs.length === 0) {
            $('.roi-metadata').fadeOut().find('form').get(0).reset();
            return;
        }
        if (coordPairs.length > 0) {
            var selectedPixels = [];
            var conversionFactor = numCols / $image.width();
            var bandHeight = Math.floor($image.height() / numRows);
            for (var i = 0; i < numRows; i++) {
                var lowerBound = bandHeight * i;
                var upperBound = bandHeight * (i + 1);
                var intervals = [];
                var pixelsInRow = coordPairs.filter(function (pair) {
                    if (pair[1] >= lowerBound && pair[1] <= upperBound)
                        return true;
                    return false;
                }).map(function (pair) {
                    return pair[0];
                });
                if (pixelsInRow.length === 0)
                    continue;
                selectedPixels.push(i + 1);
                intervals.push(pixelsInRow[0]);
                for (var j = 0; j < pixelsInRow.length - 1; j++)
                    if (Math.abs(pixelsInRow[j] - pixelsInRow[j + 1]) > 20) {
                        intervals.push(pixelsInRow[j]);
                        intervals.push(pixelsInRow[j + 1]);
                    }
                intervals.push(pixelsInRow.pop());
                intervals = intervals.map(function (point) {
                    return Math.floor(point * conversionFactor);
                });
                for (var k = 0; k < intervals.length - 1; k += 2) {
                    if (intervals[k] < intervals[k + 1])
                        for (var l = intervals[k]; l <= intervals[k + 1]; l++)
                            selectedPixels.push(l);
                    else if (intervals[k] > intervals[k + 1])
                        for (var l = intervals[k]; l >= intervals[k + 1]; l--)
                            selectedPixels.push(l);
                }
                selectedPixels.push(-1);
            }
            if (selectedPixels[selectedPixels.length - 1] === -1)
                selectedPixels.pop();
            var params = [
                ['selectedPixels', selectedPixels.join(' ')],
                ['roiImageData', canvas.toDataURL().replace('data:image/png;base64,', '')],
                ['roiImageName', $('.roi-metadata #roi-name').val()],
                ['datasetName', $image.data().datasetName ? $image.data().datasetName : $('#selected-dataset').text()]
            ];
            var esRequestBody = { doc: { } };
            var roiDescription = $('.roi-metadata #roi-description').val();
            roiDescription = roiDescription ? roiDescription : '';
            esRequestBody.doc['roi-' + params[2][1]] = params[0][1];
            if (roiDescription)
                esRequestBody.doc['roi-' + params[2][1] + 'description'] = roiDescription;
            params.push(['esRequestBody', JSON.stringify(esRequestBody)]);
            pnnl.utils.sendFormData('/msiquickview/app/uploader/images/roi', params, onSuccess, errorCallback);
            $('.roi-metadata').fadeOut().find('form').get(0).reset();
            function onSuccess() {
                pnnl.dialog.showToast(null, 'Image saved successfully');
            }
        }
    }

    function markClickPoint(ctx, coords, markSize) {
        ctx.strokeStyle = 'white';
        ctx.lineWidth = '10px';
        ctx.beginPath();
        ctx.moveTo(coords[0] - markSize, coords[1] - markSize);
        ctx.lineTo(coords[0] + markSize, coords[1] + markSize);
        ctx.moveTo(coords[0] - markSize, coords[1] + markSize);
        ctx.lineTo(coords[0] + markSize, coords[1] - markSize);
        ctx.stroke();
        return coords;
    }

    function convertToRealCoords(clickCoords, dim) {
        var rowHeight = 235 / dim.height;
        var conversionFactor = dim.width / 320;
        for (var x = 0; x < clickCoords.length; x++) {
            for (var row = 0; row < dim.height; row++)
                if (clickCoords[x][1] >= rowHeight * row && clickCoords[x][1] <= rowHeight * (row + 1)) {
                    clickCoords[x][1] = row + 1;
                    break;
                }
            clickCoords[x][0] = Math.floor(clickCoords[x][0] * conversionFactor);
        }
    }

    function getNaturalImageSize(imageObj) {
        var dimensions = imageObj.alt.split('_');
        var dim = {};
        if (dimensions.length > 2) {
            dim.width = parseInt(dimensions[3]);
            dim.height = parseInt(dimensions[2]);
        } else {
            dim.width = imageObj.naturalWidth;
            dim.height = imageObj.naturalHeight;
        }
        return dim;
    }

    function showPencilCursor() {
        var canvas = pnnl.utils.createElem('canvas', {
            width: 25,
            height: 25
        });
        var ctx = canvas.getContext('2d');
        ctx.fillStyle = 'white';
        ctx.font = '20px FontAwesome';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('\uf040', 12, 12);
        return canvas.toDataURL('image/png');
    }
})(jQuery);