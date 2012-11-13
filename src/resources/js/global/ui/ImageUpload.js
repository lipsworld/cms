(function($) {

    var $modalContainerDiv;

    /**
     * Image Upload tool.
     */
    Blocks.ui.ImageUpload = Blocks.Base.extend({


        /**
         * postParameters    - an object of POST data to pass along with each Ajax request
         * modalClass        - class to add to the modal window to allow customization
         * uploadButton      - jQuery object of the element that should open the file chooser
         * uploadAction      - upload to this location (in form of "controller/action")
         * deleteButton      - jQuery object of the element that starts the image deletion process
         * deleteMessage     - confirmation message presented to the user for image deletion
         * deleteAction      - delete image at this location (in form of "controller/action")
         * cropAction        - crop image at this (in form of "controller/action")
         * areaToolOptions   - object with some options for the area tool selector
         *   aspectRatio     - aspect ration to enforce in form of "width:height". If empty, then select area is freeform
         *   intialRectangle - object with options for the initial rectangle
         *     mode          - if set to auto, then the part selected will be the maximum size in the middle of image
         *     x1            - top left x coordinate of th rectangle, if the mode is not set to auto
         *     x2            - bottom right x coordinate of th rectangle, if the mode is not set to auto
         *     y1            - top left y coordinate of th rectangle, if the mode is not set to auto
         *     y2            - bottom right y coordinate of th rectangle, if the mode is not set to auto
         */
        _defaultSettings: {
            postParameters: {},

            modalClass: "",
            uploadButton: {},
            uploadAction: "",

            deleteButton: {},
            deleteMessage: "",
            deleteAction: "",

            cropAction:"",

            areaToolOptions:
            {
                aspectRatio: "1:1",
                initialRectangle: {
                    mode: "auto",
                    x1: 0,
                    x2: 0,
                    y1: 0,
                    y2: 0
                }
            }
        },

        _imageHandler: null,


        init: function(settings) {
            settings = $.extend(this._defaultSettings, settings);
            $modalContainerDiv = $('<div class="modal"></div>').addClass(settings.modalClass).appendTo(Blocks.$body);
            this._imageHandler = new ImageHandler(settings);
        }
    }),

    ImageHandler = Blocks.Base.extend({

        modal: null,
        _settings: null,

        init: function(settings) {
            this._settings = settings;

            var element = settings.uploadButton;
            var options = {
                element:    this._settings.uploadButton[0],
                action:     Blocks.actionUrl + '/' + this._settings.uploadAction,
                params:     this._settings.postParameters,
                multiple:   false,
                onComplete: function (fileId, fileName, response) {
                    if (response.html) {
                        $modalContainerDiv.empty().append(response.html);
                        if (!this.modal) {
                            this.modal = new ImageModal({postParameters: settings.postParameters, cropAction: settings.cropAction});
                            this.modal.setContainer($modalContainerDiv);
                        }

                        var modal = this.modal;

                        modal.bindButtons();
                        modal.addListener(modal.$saveBtn, 'click', 'saveImage');
                        modal.addListener(modal.$cancelBtn, 'click', 'cancel');

                        modal.show();
                        modal.removeListener(Blocks.ui.Modal.$shade, 'click');

                        $modalContainerDiv.find('img').load(function () {
                            var profileTool = new ImageAreaTool(settings.areaToolOptions);
                            profileTool.showArea(modal);
                        });
                    }
                },
                allowedExtensions: ['jpg', 'jpeg', 'gif', 'png'],
                template: '<div class="QqUploader-uploader"><div class="QqUploader-upload-drop-area" style="display: none; "><span></span></div><div class="QqUploader-upload-button" style="position: relative; overflow: hidden; direction: ltr; ">' +
                    element.text() +
                    '<input type="file" name="file" style="position: absolute; right: 0px; top: 0px; font-family: Arial; font-size: 118px; margin: 0px; padding: 0px; cursor: pointer; opacity: 0; "></div><ul class="QqUploader-upload-list"></ul></div>'

            };

            options.sizeLimit = Blocks.maxUploadSize;

            this.uploader = new qqUploader.FileUploader(options);

            $(settings.deleteButton).click(function () {
                if (confirm(settings.deleteMessage)) {
                    $(this).parent().append('<div class="blocking-modal"></div>');
                    Blocks.postActionRequest(settings.deleteAction, settings.postParameters, $.proxy(function (response){
                        location.reload();
                    }, this));

                }
            });
        }
    }),

    ImageModal = Blocks.ui.Modal.extend({

        $container: null,
        $saveBtn: null,
        $cancelBtn: null,

        areaSelect: null,
        factor: null,
        source: null,
        _postParameters: null,
        _cropAction: "",


        init: function(settings) {
            this.base();
            this._postParameters = settings.postParameters;
            this._cropAction = settings.cropAction;
        },

        bindButtons: function () {
            this.$saveBtn = this.$container.find('.submit:first');
            this.$cancelBtn = this.$container.find('.cancel:first');
        },

        cancel: function () {
            this.hide();
            this.areaSelect.setOptions({remove: true, hide: true, disable: true});
            this.$container.empty();
        },

        saveImage: function () {

            var selection = this.areaSelect.getSelection();
            var params = {
                x1: Math.round(selection.x1 / this.factor),
                x2: Math.round(selection.x2 / this.factor),
                y1: Math.round(selection.y1 / this.factor),
                y2: Math.round(selection.y2 / this.factor),
                source: this.source
            };

            params = $.extend(this._postParameters, params);

            Blocks.postActionRequest(this._cropAction, params, $.proxy(function (response) {

                if (response.error)
                {
                    alert(response.error);
                }
                else
                {
                    location.reload();
                }

                this.hide();
                this.$container.empty();
                this.areaSelect.setOptions({remove: true, hide: true, disable: true});


            }, this));

            this.areaSelect.setOptions({disable: true});
            this.removeListener(this.$saveBtn, 'click');
            this.removeListener(this.$cancelBtn, 'click');

            this.$container.find('.crop-image').fadeTo(50, 0.5);
        }

    }),

    ImageAreaTool = Blocks.Base.extend({

        $container: null,
        _settings: null,

        init: function(settings) {
            this.$container = $modalContainerDiv;
            this._settings = settings;
        },

        showArea: function(referenceObject) {
            var $target = this.$container.find('img');


            var areaOptions = {
                aspectRatio: this._settings.aspectRatio,
                maxWidth: $target.width(),
                maxHeight: $target.height(),
                instance: true,
                resizable: true,
                show: true,
                persistent: true,
                handles: true

            };

            var areaSelect = $target.imgAreaSelect(areaOptions);

            var x1 = this._settings.initialRectangle.x1;
            var x2 = this._settings.initialRectangle.x2;
            var y1 = this._settings.initialRectangle.y1;
            var y2 = this._settings.initialRectangle.y2;

            if (this._settings.initialRectangle.mode == "auto")
            {
                var proportions = this._settings.aspectRatio.split(":");
                var rectangleWidth = 0;
                var rectangleHeight = 0;


                // [0] - width proportion, [1] - height proportion
                if (proportions[0] > proportions[1]) {
                    rectangleWidth = $target.width();
                    rectangleHeight = rectangleWidth * proportions[1] / proportions[0];
                } else if (proportions[0] > proportions[1]) {
                    rectangleHeight = $target.height();
                    rectangleWidth = rectangleHeight * proportions[0] / proportions[1];
                } else {
                    rectangleHeight = rectangleWidth = $target.width();
                }
                x1 = Math.round(($target.width() - rectangleWidth) / 2);
                y1 = Math.round(($target.height() - rectangleHeight) / 2);
                x2 = x1 + rectangleWidth;
                y2 = y1 + rectangleHeight;

            }
            areaSelect.setSelection(x1, y1, x2, y2);
            areaSelect.update();

            referenceObject.areaSelect = areaSelect;
            referenceObject.factor = $target.attr('data-factor');
            referenceObject.source = $target.attr('src').split('/').pop();
        }
    });

})(jQuery);