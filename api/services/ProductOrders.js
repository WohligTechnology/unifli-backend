var ApiContracts = require('authorizenet').APIContracts;
var ApiControllers = require('authorizenet').APIControllers;
var SDKConstants = require('authorizenet').Constants;
var constants = require('../controllers/constants');
var utils = require('../controllers/utils');
var upsAPI = require('shipping-ups');

var schema = new Schema({
    name: String,
    lname: String,
    phonenumber: String,
    email: {
        type: String,
        validate: validators.isEmail(),
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        index: true
    },
    cadLineWork: {
        type: Schema.Types.ObjectId,
        ref: 'CadLineWork',
        index: true
    },
    dfmSubscription: {
        type: Schema.Types.ObjectId,
        ref: 'DFMSubscription',
        index: true
    },
    products: [{
        product: {
            type: Schema.Types.ObjectId,
            ref: 'Products',
            index: true
        },
        qty: Number
    }],
    totalAmount: {
        type: Number,
        default: 0
    },
    discountAmount: {
        type: Number,
        default: 0
    },
    discountCoupon: String,
    shippingAmount: {
        type: Number,
        default: 0
    },
    billingAddress: {
        address: String,
        streetAddress: String,
        landmark: String,
        city: String,
        zip: String,
        state: String,
        country: String,
        fname: String,
        lname: String,
        comapny: String,
        phonenumber: String
    },
    shippingAddress: {
        address: String,
        streetAddress: String,
        landmark: String,
        city: String,
        zip: String,
        state: String,
        country: String,
        fname: String,
        lname: String,
        comapny: String,
        phonenumber: String
    },
    taxAmount: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        default: "Processing",
        enum: ['Processing', 'Paid']
    },
    pdf: String,
    invoiceNo: String,
    trackingCode: String,
    paymentId: String,
    oraganization: String,
    apartment: String,
    transactionId: String,
    transactionDate: Date,
    paymentResponse: {
        type: {}
    },
    paymentResponseForArbSub: {
        type: {}
    }

});



schema.plugin(deepPopulate, {
    populate: {
        products: {
            select: ""
        },
        user: {
            select: ""
        },
        cadLineWork: {
            select: ""
        },
        dfmSubscription: {
            select: ""
        }
    }
});
schema.plugin(deepPopulate, {});
schema.plugin(uniqueValidator);
schema.plugin(timestamps);
module.exports = mongoose.model('ProductOrders', schema);

var exports = _.cloneDeep(require("sails-wohlig-service")(schema, "products user cadLineWork dfmSubscription", "products user cadLineWork dfmSubscription"));
var model = {


    getOrderOfInvoice: function (data, callback) {
        ProductOrders.findOne({
            invoiceNo: data.invoiceNo
        }).deepPopulate("user dfmSubscription products.product cadLineWork ").exec(function (err, data) {
            if (err) {
                callback(err, null);
            } else {
                callback(null, data);
            }
        })
    },
    exceltotalProductOrders: function (data, callback) {
        ProductOrders.find({}).deepPopulate("user dfmSubscription products.product cadLineWork ").exec(function (err, data) {
            if (err || _.isEmpty(data)) {
                callback(err, [])
            } else {
                callback(null, data)
            }
        })
    },

    generateExcelProductOrders: function (match, callback) {
        async.concatSeries(match, function (mainData, callback) {
                console.log("inside concat", mainData)
                var obj = {};
                if (mainData.user) {
                    obj["USER ID"] = mainData.user.dataId;
                } else {
                    obj["USER ID"] = "-";
                }
                if (mainData.transactionDate) {
                    obj["TRANSACTION DATE"] = moment(mainData.transactionDate).format("DD/MM/YYYY")
                } else {
                    obj["TRANSACTION DATE"] = "-";
                }
                if (mainData.transactionId) {
                    obj["TRANSACTION ID"] = mainData.transactionId;
                } else {
                    obj["TRANSACTION ID"] = "-";
                }
                if (mainData.dfmSubscription) {
                    obj["SOLD ITEM"] = mainData.dfmSubscription.name;
                } else if (mainData.products[0]) {
                    var myVal = '';
                    var foo = ''
                    _.forEach(mainData.products, function (pro) {
                        myVal = pro.product.name + ',' + myVal;
                        foo = myVal.substring(0, myVal.length - 1);
                    })
                    obj["SOLD ITEM"] = foo;
                } else if (mainData.cadLineWork) {
                    obj["SOLD ITEM"] = mainData.cadLineWork.name;
                }
                obj["COST"] = mainData.totalAmount;

                if (mainData.user) {
                    obj["LICENSE TYPE"] = mainData.user.lisence;
                } else {
                    obj["LICENSE TYPE"] = "-";
                }

                if (mainData.shippingAddress) {
                    if (mainData.shippingAddress.city) {
                        obj["SHIPPING ADDRESS"] = mainData.shippingAddress.city;
                    } else {
                        obj["SHIPPING ADDRESS"] = "-";
                    }

                } else {
                    obj["SHIPPING ADDRESS"] = "-";
                }

                obj["PAYMENT STATUS"] = mainData.status;
                callback(null, obj);
            },
            function (err, singleData) {
                callback(null, singleData);
            });

    },


    exceltotalProductOrdersforUser: function (data, callback) {
        ProductOrders.find({
            user: data._id
        }).deepPopulate('user cadLineWork dfmSubscription products.product').exec(function (err, data) {
            if (err || _.isEmpty(data)) {
                callback(err, [])
            } else {
                callback(null, data)
            }
        })
    },

    generateExcelProductOrdersforUser: function (match, callback) {
        async.concatSeries(match, function (mainData, callback) {
                console.log("mainData.transactionDate", mainData)
                var obj = {};
                if (mainData.dfmSubscription) {
                    obj["PRODUCT NAME"] = mainData.dfmSubscription.name;

                } else if (mainData.products[0]) {
                    var myVal = ''
                    var foo = ''
                    _.forEach(mainData.products, function (pro) {
                        myVal = pro.product.name + ',' + myVal;
                        foo = myVal.substring(0, myVal.length - 1);
                    })
                    obj["PRODUCT NAME"] = foo;
                } else if (mainData.cadLineWork) {
                    obj["PRODUCT NAME "] = "cadLineWork";
                }
                obj["COST"] = mainData.totalAmount;
                if (mainData.transactionDate) {
                    obj["TRANSACTION DATE"] = moment(mainData.transactionDate).format("DD/MM/YYYY")
                } else {
                    obj["TRANSACTION DATE"] = "-"
                }
                if (mainData.transactionId) {
                    obj["TRANSACTION ID"] = mainData.transactionId;
                } else {
                    obj["TRANSACTION ID"] = "-";
                }

                obj["PAYMENT STATUS"] = mainData.status;
                callback(null, obj);
            },
            function (err, singleData) {
                callback(null, singleData);
            });

    },

    getuserwiseProduct: function (data, callback) {
        ProductOrders.find({
            user: data._id
        }).deepPopulate('user cadLineWork dfmSubscription products.product').exec(function (err, data) {
            if (err || _.isEmpty(data)) {
                callback(err, [])
            } else {
                callback(null, data)
            }
        })
    },

    invoiceGenerate: function (data, callback) {
        var emailData;
        async.waterfall([
                function (callback) {
                    ProductOrders.findOne({
                        invoiceNo: data.invoiceNo
                    }).deepPopulate('user cadLineWork dfmSubscription products.product').exec(function (err, data) {
                        if (err || _.isEmpty(data)) {
                            callback(err, [])
                        } else {
                            emailData = data;
                            callback(null, data);
                        }
                    })
                },
                function (complete, callback) {
                    Config.generatePdf(complete, function (err, data) {
                        if (err) {
                            console.log("err in generate pdf-------------", err);
                            callback(err, null);
                        } else {
                            if (_.isEmpty(data)) {
                                callback(err, null);
                            } else {
                                callback(null, data);
                            }
                        }
                    })
                },
                function (pdfData, callback) {
                    ProductOrders.update({
                        _id: pdfData.id
                    }, {
                        $set: {
                            pdf: pdfData.name,
                            status: 'Paid'
                        }
                    }).exec(function (err, found) {
                        if (err) {
                            callback(err, null);
                        } else if (_.isEmpty(found)) {
                            callback(null, "noDataound");
                        } else {
                            ProductOrders.sendMailOnPurchase(emailData, callback);
                            callback(null, found);
                        }

                    });
                }
            ],
            function (err, result) {
                if (err || _.isEmpty(result)) {
                    callback(err, []);
                } else {
                    callback(null, result);
                }
            });
    },

    getProductOrders: function (data, callback) {
        if (data.count) {
            var maxCount = data.count;
        } else {
            var maxCount = Config.maxRow;
        }
        var maxRow = maxCount
        var page = 1;
        if (data.page) {
            page = data.page;
        }
        var field = data.field;
        var options = {
            field: data.field,
            filters: {
                keyword: {
                    fields: ['name'],
                    term: data.keyword
                }
            },
            sort: {
                desc: 'createdAt'
            },
            start: (page - 1) * maxRow,
            count: maxRow
        };
        ProductOrders.find({}).deepPopulate('user dfmSubscription products.product  cadLineWork')
            .order(options)
            .keyword(options)
            .page(options,
                function (err, found) {
                    if (err) {
                        callback(err, null);
                    } else if (found) {
                        callback(null, found);
                    } else {
                        callback("Invalid data", null);
                    }
                });
    },

    //for user
    getProductData: function (data, callback) {
        if (data.count) {
            var maxCount = data.count;
        } else {
            var maxCount = Config.maxRow;
        }
        var maxRow = maxCount
        var page = 1;
        if (data.page) {
            page = data.page;
        }
        var field = data.field;
        var options = {
            field: data.field,
            filters: {
                keyword: {
                    fields: ['name'],
                    term: data.keyword
                }
            },
            sort: {
                desc: 'createdAt'
            },
            start: (page - 1) * maxRow,
            count: maxRow
        };
        ProductOrders.find({
                user: data.user
            })
            .deepPopulate("products.product user cadLineWork dfmSubscription")
            .order(options)
            .keyword(options)
            .page(options,
                function (err, found) {
                    if (err) {
                        callback(err, null);
                    } else if (found) {
                        callback(null, found);
                    } else {
                        callback("Invalid data", null);
                    }
                });
    },

    //for user end
    invoiceNumberGenerate: function (data, callback) {
        ProductOrders.find({}).sort({
            createdAt: -1
        }).limit(1).deepPopulate('products user cadLineWork dfmSubscription').exec(function (err, found) {
            if (err) {
                callback(err, null);
            } else {
                if (_.isEmpty(found)) {
                    var year = new Date().getFullYear().toString().substr(-2);
                    var month = new Date().getMonth() + 1;
                    var m = month.toString().length;
                    if (m == 1) {
                        month = "0" + month
                        var invoiceNumber = "INV" + year + month + "-" + "1";
                    } else if (m == 2) {
                        var invoiceNumber = "INV" + year + month + "-" + "1";
                    }
                    callback(null, invoiceNumber);
                } else {
                    if (!found[0].invoiceNo) {
                        var year = new Date().getFullYear().toString().substr(-2);
                        var month = new Date().getMonth() + 1;
                        var m = month.toString().length;
                        if (m == 1) {
                            month = "0" + month
                            var invoiceNumber = "INV" + year + month + "-" + "1";
                        } else if (m == 2) {
                            var invoiceNumber = "INV" + year + month + "-" + "1";
                        }
                        callback(null, invoiceNumber);
                    } else {
                        var invoiceData = found[0].invoiceNo.split("-");
                        var num = parseInt(invoiceData[1]);
                        var nextNum = num + 1;
                        var year = new Date().getFullYear().toString().substr(-2);
                        var month = new Date().getMonth() + 1;
                        var m = month.toString().length;
                        if (m == 1) {
                            month = "0" + month
                            var invoiceNumber = "INV" + year + month + "-" + nextNum;
                        } else if (m == 2) {
                            var invoiceNumber = "INV" + year + month + "-" + nextNum;
                        }
                        callback(null, invoiceNumber);
                    }
                }
            }
        });
    },

    //Payment Id Generate start
    paymentIdGenerate: function (data, callback) {
        ProductOrders.find({}).sort({
            createdAt: -1
        }).limit(1).exec(function (err, found) {
            if (err) {
                callback(err, null);
            } else {
                if (_.isEmpty(found)) {
                    var year = new Date().getFullYear().toString().substr(-2);
                    var month = new Date().getMonth() + 1;
                    var m = month.toString().length;
                    if (m == 1) {
                        month = "0" + month
                        var paymentNumber = "P" + year + month + "-" + "1";
                    } else if (m == 2) {
                        var paymentNumber = "P" + year + month + "-" + "1";
                    }
                    console.log("paymentNumber", paymentNumber)

                    callback(null, paymentNumber);
                } else {
                    if (!found[0].paymentId) {
                        var year = new Date().getFullYear().toString().substr(-2);
                        var month = new Date().getMonth() + 1;
                        var m = month.toString().length;
                        if (m == 1) {
                            month = "0" + month
                            var paymentNumber = "P" + year + month + "-" + "1";
                        } else if (m == 2) {
                            var paymentNumber = "P" + year + month + "-" + "1";
                        }
                        console.log("paymentNumber", paymentNumber)

                        callback(null, paymentNumber);
                    } else {
                        var paymentData = found[0].paymentId.split("-");
                        var num = parseInt(paymentData[1]);
                        var nextNum = num + 1;
                        var year = new Date().getFullYear().toString().substr(-2);
                        var month = new Date().getMonth() + 1;
                        var m = month.toString().length;
                        if (m == 1) {
                            month = "0" + month
                            var paymentNumber = "P" + year + month + "-" + nextNum;
                        } else if (m == 2) {
                            var paymentNumber = "P" + year + month + "-" + nextNum;
                        }
                        console.log("paymentNumber", paymentNumber)
                        callback(null, paymentNumber);
                    }
                }
            }
        });
    },
    //end

    createInvoice: function (data, callback) {
        async.waterfall([
            function (callback) { // generate invoice id
                ProductOrders.invoiceNumberGenerate(data, function (err, data1) {
                    callback(null, data1);
                })
            },
            function (invoiceID, callback) { //save invoice
                data.invoiceNo = invoiceID;
                ProductOrders.saveData(data, function (err, data2) {
                    if (err || _.isEmpty(data2)) {
                        callback(err, [])
                    } else {
                        callback(null, data2)
                    }
                })
            }
        ], function (err, data) {
            if (err || _.isEmpty(data)) {
                callback(err, [])
            } else {
                callback(null, data)
            }
        });
    },

    sendMailOnPurchase: function (data, callback) {
        console.log("data for email---", data)
        if (data.cadLineWork) {
            async.parallel({
                    forUser: function (callback) {
                        var emailData = {};
                        emailData.filename = "CAD Purchase";
                        emailData.subject = "NEW CAD PURCHASE";
                        emailData.email = data.user.email;
                        emailData.merge_vars = [{
                            "name": "CAD_ID",
                            "content": data.cadLineWork.cadId
                        }, {
                            "name": "AMOUNT",
                            "content": data.totalAmount
                        }, {
                            "name": "ACREAGE",
                            "content": data.cadLineWork.acreage
                        }, {
                            "name": "TRANSACTION_ID",
                            "content": data.transactionId
                        }, {
                            "name": "REQUESTED_DATE",
                            "content": data.createdAt
                        }];

                        Config.email(emailData, function (err, emailRespo) {
                            if (err) {
                                console.log(err);
                                callback(err, null);
                            } else if (emailRespo) {
                                callback(null, "Contact us form saved successfully!!!");
                            } else {
                                callback("Invalid data", null);
                            }
                        });
                    },
                    forAdmin: function (callback) {
                        var emailData = {};
                        emailData.filename = "New CAD Request (Admin)";
                        emailData.subject = "CAD REQUEST";
                        emailData.email = global["env"].adminEmail;
                        emailData.merge_vars = [{
                            "name": "USER_NAME",
                            "content": data.user.name
                        }, {
                            "name": "USER_ID",
                            "content": data.user.dataId
                        }, {
                            "name": "CAD_ID",
                            "content": data.cadLineWork.cadId
                        }, {
                            "name": "AMOUNT",
                            "content": data.totalAmount
                        }, {
                            "name": "ACREAGE",
                            "content": data.cadLineWork.acreage
                        }, {
                            "name": "REQUESTED_DATE",
                            "content": data.createdAt
                        }];

                        Config.email(emailData, function (err, emailRespo) {
                            // console.log("emailRespo", emailRespo);
                            if (err) {
                                console.log(err);
                                callback(err, null);
                            } else if (emailRespo) {
                                callback(null, "Contact us form saved successfully!!!");
                            } else {
                                callback("Invalid data", null);
                            }
                        });
                    }
                },
                function (err, result) {
                    if (err || _.isEmpty(result)) {
                        // callback(err, []);
                    } else {
                        // callback(null, result);
                    }
                });

        } else if (data.dfmSubscription) {
            async.parallel({
                    forUser: function (callback) {
                        var emailData = {};
                        emailData.filename = "DFM Purchase";
                        emailData.subject = "DFM PURCHASE";
                        emailData.email = data.user.email;
                        emailData.merge_vars = [{
                            "name": "NAME_OF_PACKAGE",
                            "content": data.dfmSubscription.name
                        }, {
                            "name": "PRICE",
                            "content": data.dfmSubscription.amount
                        }, {
                            "name": "TRANSACTION_ID",
                            "content": data.transactionId
                        }];
                        Config.email(emailData, function (err, emailRespo) {
                            if (err) {
                                console.log("senderr-----------", err);
                                callback(err, null);
                            } else if (emailRespo) {
                                callback(null, "Contact us form saved successfully!!!");
                            } else {
                                callback("Invalid data", null);
                            }
                        });
                    },
                    forAdmin: function (callback) {
                        var emailData = {};
                        emailData.filename = "New DFM Purchase (Admin)";
                        emailData.subject = "DFM REQUEST";
                        emailData.email = global["env"].adminEmail;
                        emailData.merge_vars = [{
                            "name": "USER_NAME",
                            "content": data.user.name
                        }, {
                            "name": "USER_ID",
                            "content": data.user.dataId
                        }, {
                            "name": "NAME_OF_PACKAGE",
                            "content": data.dfmSubscription.name
                        }, {
                            "name": "PRICE",
                            "content": data.dfmSubscription.amount
                        }, {
                            "name": "ACTIVATION_DATE",
                            "content": data.dfmSubscription.createdAt
                        }, {
                            "name": "EXPIRATION_DATE",
                            "content": data.dfmSubscription.expiryDate
                        }];

                        Config.email(emailData, function (err, emailRespo) {
                            // console.log("emailRespo", emailRespo);
                            if (err) {
                                console.log(err);
                                callback(err, null);
                            } else if (emailRespo) {
                                callback(null, "Contact us form saved successfully!!!");
                            } else {
                                callback("Invalid data", null);
                            }
                        });
                    }
                },
                function (err, result) {
                    if (err || _.isEmpty(result)) {
                        // callback(err, []);
                    } else {
                        // callback(null, result);
                    }
                });
        } else {
            async.parallel({
                    forUser: function (callback) {
                        var emailData = {};
                        emailData.filename = "Drone Purchase";
                        emailData.subject = "DRONE PURCHASE";
                        emailData.email = data.user.email;
                        var myVal = ''
                        var foo = ''
                        _.forEach(data.products, function (pro) {
                            myVal = pro.product.name + ',' + myVal;
                            foo = myVal.substring(0, myVal.length - 1);
                        })
                        var addressDetails = data.shippingAddress.state + ',' + data.shippingAddress.city + ',' + data.shippingAddress.streetAddress
                        emailData.merge_vars = [{
                            "name": "ADDRESS",
                            "content": addressDetails
                        }, {
                            "name": "NAME_DRONE",
                            "content": foo
                        }, {
                            "name": "PRICE",
                            "content": data.totalAmount
                        }];
                        Config.email(emailData, function (err, emailRespo) {
                            // console.log("emailRespo", emailRespo);
                            if (err) {
                                console.log(err);
                                callback(err, null);
                            } else if (emailRespo) {
                                callback(null, "Contact us form saved successfully!!!");
                            } else {
                                callback("Invalid data", null);
                            }
                        });
                    },
                    forAdmin: function (callback) {
                        var emailData = {};
                        emailData.email = global["env"].adminEmail;
                        emailData.filename = "New Drone Purchase (Admin)";
                        emailData.subject = "DRONE PURCHASE";
                        var myVal = ''
                        var foo = ''
                        _.forEach(data.products, function (pro) {
                            myVal = pro.product.name + ',' + myVal;
                            foo = myVal.substring(0, myVal.length - 1);
                        })
                        emailData.merge_vars = [{
                            "name": "USER_NAME",
                            "content": data.user.name
                        }, {
                            "name": "USER_ID",
                            "content": data.user.dataId
                        }, {
                            "name": "NAME_DRONE",
                            "content": foo
                        }, {
                            "name": "PRICE",
                            "content": data.totalAmount
                        }];
                        Config.email(emailData, function (err, emailRespo) {
                            // console.log("emailRespo", emailRespo);
                            if (err) {
                                console.log(err);
                                callback(err, null);
                            } else if (emailRespo) {
                                callback(null, "Contact us form saved successfully!!!");
                            } else {
                                callback("Invalid data", null);
                            }
                        });
                    }
                },
                function (err, result) {
                    if (err || _.isEmpty(result)) {
                        // callback(err, []);
                    } else {
                        // callback(null, result);
                    }
                });
        }
    },

    //recursive payment

    createCustomerProfileFromTransaction: function (transactionIdData, callback) {

        var merchantAuthenticationType = new ApiContracts.MerchantAuthenticationType();
        merchantAuthenticationType.setName(constants.apiLoginKey);
        merchantAuthenticationType.setTransactionKey(constants.transactionKey);

        var createRequest = new ApiContracts.CreateCustomerProfileFromTransactionRequest();
        createRequest.setTransId(transactionIdData);
        createRequest.setMerchantAuthentication(merchantAuthenticationType);

        //console.log(JSON.stringify(createRequest.getJSON(), null, 2));

        var ctrl = new ApiControllers.CreateCustomerProfileFromTransactionController(createRequest.getJSON());

        ctrl.execute(function () {

            var apiResponse = ctrl.getResponse();

            var response = new ApiContracts.CreateCustomerProfileResponse(apiResponse);
            //console.log(JSON.stringify(response.getJSON(), null, 2));

            if (response != null) {
                if (response.getMessages().getResultCode() == ApiContracts.MessageTypeEnum.OK) {
                    console.log('Successfully created a customer payment profile with id: ' + response.getCustomerProfileId() +
                        ' from a transaction : ' + "60036139346");
                } else {
                    //console.log(JSON.stringify(response));
                    //console.log('Result Code: ' + response.getMessages().getResultCode());
                    console.log('Error Code: ' + response.getMessages().getMessage()[0].getCode());
                    console.log('Error message: ' + response.getMessages().getMessage()[0].getText());
                }
            } else {
                console.log('Null response received');
            }

            callback(response);

        });
    },

    getCustomerProfile: function (profileIdData, callback) {

        var merchantAuthenticationType = new ApiContracts.MerchantAuthenticationType();
        merchantAuthenticationType.setName(constants.apiLoginKey);
        merchantAuthenticationType.setTransactionKey(constants.transactionKey);

        var getRequest = new ApiContracts.GetCustomerProfileRequest();
        getRequest.setCustomerProfileId(profileIdData);
        getRequest.setMerchantAuthentication(merchantAuthenticationType);

        //pretty print request
        //console.log(JSON.stringify(createRequest.getJSON(), null, 2));

        var ctrl = new ApiControllers.GetCustomerProfileController(getRequest.getJSON());

        ctrl.execute(function () {

            var apiResponse = ctrl.getResponse();

            var response = new ApiContracts.GetCustomerProfileResponse(apiResponse);

            //pretty print response
            //console.log(JSON.stringify(response, null, 2));

            if (response != null) {
                if (response.getMessages().getResultCode() == ApiContracts.MessageTypeEnum.OK) {
                    console.log('Customer profile ID : ' + response.getProfile().getCustomerProfileId());
                    console.log('Customer Email : ' + response.getProfile().getEmail());
                    console.log('Description : ' + response.getProfile().getDescription());
                } else {
                    //console.log('Result Code: ' + response.getMessages().getResultCode());
                    console.log('Error Code: ' + response.getMessages().getMessage()[0].getCode());
                    console.log('Error message: ' + response.getMessages().getMessage()[0].getText());
                }
            } else {
                console.log('Null response received');
            }

            callback(response);
        });
    },

    createSubscriptionFromCustomerProfile: function (profileData, callback) {

        var customerProfileId = profileData.profiledata.customerProfileId;
        var customerAddressId = profileData.profiledata.shipToList[0].customerAddressId;
        var customerPaymentProfileId = profileData.profiledata.paymentProfiles[0].customerPaymentProfileId;

        var merchantAuthenticationType = new ApiContracts.MerchantAuthenticationType();
        merchantAuthenticationType.setName(constants.apiLoginKey);
        merchantAuthenticationType.setTransactionKey(constants.transactionKey);

        var interval = new ApiContracts.PaymentScheduleType.Interval();
        interval.setLength(1);
        interval.setUnit(ApiContracts.ARBSubscriptionUnitEnum.DAYS);

        var paymentScheduleType = new ApiContracts.PaymentScheduleType();
        paymentScheduleType.setInterval(interval);
        paymentScheduleType.setStartDate(profileData.transactiondate);
        paymentScheduleType.setTotalOccurrences(9999);
        paymentScheduleType.setTrialOccurrences(0);

        var customerProfileIdType = new ApiContracts.CustomerProfileIdType();
        customerProfileIdType.setCustomerProfileId(customerProfileId);
        customerProfileIdType.setCustomerPaymentProfileId(customerPaymentProfileId);
        customerProfileIdType.setCustomerAddressId(customerAddressId);

        var arbSubscription = new ApiContracts.ARBSubscriptionType();
        arbSubscription.setName(utils.getRandomString('Name'));
        arbSubscription.setPaymentSchedule(paymentScheduleType);
        arbSubscription.setAmount(profileData.transactionamt);
        // arbSubscription.setTrialAmount(utils.getRandomAmount());
        arbSubscription.setProfile(customerProfileIdType);

        var createRequest = new ApiContracts.ARBCreateSubscriptionRequest();
        createRequest.setMerchantAuthentication(merchantAuthenticationType);
        createRequest.setSubscription(arbSubscription);

        console.log(JSON.stringify(createRequest.getJSON(), null, 2));

        var ctrl = new ApiControllers.ARBCreateSubscriptionController(createRequest.getJSON());

        ctrl.execute(function () {

            var apiResponse = ctrl.getResponse();

            var response = new ApiContracts.ARBCreateSubscriptionResponse(apiResponse);

            console.log(JSON.stringify(response, null, 2));

            if (response != null) {
                if (response.getMessages().getResultCode() == ApiContracts.MessageTypeEnum.OK) {
                    console.log('Subscription Id : ' + response.getSubscriptionId());
                    console.log('Message Code : ' + response.getMessages().getMessage()[0].getCode());
                    console.log('Message Text : ' + response.getMessages().getMessage()[0].getText());
                } else {
                    console.log('Result Code: ' + response.getMessages().getResultCode());
                    console.log('Error Code: ' + response.getMessages().getMessage()[0].getCode());
                    console.log('Error message: ' + response.getMessages().getMessage()[0].getText());
                }
            } else {
                console.log('Null Response.');
            }

            callback(response);
        });
    },

    cancelSubscription: function (subData, callback) {

        var merchantAuthenticationType = new ApiContracts.MerchantAuthenticationType();
        merchantAuthenticationType.setName(constants.apiLoginKey);
        merchantAuthenticationType.setTransactionKey(constants.transactionKey);

        var cancelRequest = new ApiContracts.ARBCancelSubscriptionRequest();
        cancelRequest.setMerchantAuthentication(merchantAuthenticationType);
        cancelRequest.setSubscriptionId(subData.subId);

        console.log(JSON.stringify(cancelRequest.getJSON(), null, 2));

        var ctrl = new ApiControllers.ARBCancelSubscriptionController(cancelRequest.getJSON());

        ctrl.execute(function () {

            var apiResponse = ctrl.getResponse();

            var response = new ApiContracts.ARBCancelSubscriptionResponse(apiResponse);

            console.log(JSON.stringify(response, null, 2));

            if (response != null) {
                if (response.getMessages().getResultCode() == ApiContracts.MessageTypeEnum.OK) {
                    console.log('Message Code : ' + response.getMessages().getMessage()[0].getCode());
                    console.log('Message Text : ' + response.getMessages().getMessage()[0].getText());
                } else {
                    console.log('Result Code: ' + response.getMessages().getResultCode());
                    console.log('Error Code: ' + response.getMessages().getMessage()[0].getCode());
                    console.log('Error message: ' + response.getMessages().getMessage()[0].getText());
                }
            } else {
                console.log('Null Response.');
            }

            callback(response);
        });
    },

    recursivePayment: function (recData) {
        async.waterfall([
            function (data, callback) {
                ProductOrders.findOne({
                    transactionId: recData.transactionid
                }).exec(function (err, data) {
                    if (err || _.isEmpty(data)) {
                        callback(err, []);
                    } else {
                        var transactionId = data.transactionId;
                        var transactionDate = data.transactionDate;
                        var transactionAmt = data.totalAmount;
                        callback(null, transactionId);
                    }
                });
            },
            function (transactionIdData, callback) {
                ProductOrders.createCustomerProfileFromTransaction(transactionIdData, function (err, data) {
                    if (err || _.isEmpty(data)) {
                        callback(err, []);
                    } else {
                        callback(null, data.customerProfileId);
                    }
                })
            },
            function (profileIdData, callback) {
                console.log("createCustomerProfileFromTransaction", profileIdData)
                ProductOrders.getCustomerProfile(profileIdData, function (err, data) {
                    if (err || _.isEmpty(data)) {
                        callback(err, []);
                    } else {
                        var dataToSend = {};
                        dataToSend.profiledata = data;
                        dataToSend.transactiondate = transactionDate;
                        dataToSend.transactionamt = transactionAmt
                        callback(null, dataToSend);
                    }
                })
            },
            function (profileData, callback) {
                console.log("getCustomerProfile", profileData)
                ProductOrders.createSubscriptionFromCustomerProfile(profileData, function (err, data) {
                    if (err || _.isEmpty(data)) {
                        callback(err, []);
                    } else {
                        callback(null, data);
                    }
                })
            },
            function (subData, callback) {
                ProductOrders.findOneAndUpdate({
                    transactionId: recData.transactionid
                }, {
                    paymentResponseForArbSub: subData
                }, {
                    new: true
                }).exec(function (err, data) {
                    if (err || _.isEmpty(data)) {
                        callback(err, []);
                    } else {
                        callback(null, data);
                    }
                });
            }
        ], function () {
            console.log("finished")
            // nothing at all
        });
    },

    //recursive payment end

};
module.exports = _.assign(module.exports, exports, model);